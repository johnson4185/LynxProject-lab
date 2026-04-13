using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Lynx.Api.Observability;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Lynx.Api.Services;

public class ShortLinkService : IShortLinkService
{
    private readonly AppDbContext _db;
    private readonly IHmacTokenService _tokenService;
    private readonly ITokenStateStore _stateStore;
    private readonly ITenantResolver _tenantResolver;
    private readonly IAuditService _auditService;
    private readonly IClickEventService _clickLogger;
    private readonly ICampaignLimitStore _campaignLimits;
    private readonly IShortLinkCache _cache;
    private readonly IRedisResilience _redisResilience;
    private readonly IAppMetrics _metrics;

    private const int AutoBlockThreshold = 5;
    private static readonly TimeSpan AutoBlockWindow = TimeSpan.FromMinutes(5);

    public ShortLinkService(
        AppDbContext db,
        IHmacTokenService tokenService,
        ITokenStateStore stateStore,
        ITenantResolver tenantResolver,
        IAuditService auditService,
        IClickEventService clickLogger,
        IShortLinkCache cache,
        IRedisResilience redisResilience,
        ICampaignLimitStore campaignLimits,
        IAppMetrics metrics)
    {
        _db = db;
        _tokenService = tokenService;
        _stateStore = stateStore;
        _tenantResolver = tenantResolver;
        _auditService = auditService;
        _clickLogger = clickLogger;
        _campaignLimits = campaignLimits; // NEW
        _cache = cache;
        _redisResilience = redisResilience;
        _metrics = metrics;
    }

    // ======================================================
    // CREATE (tenant from header)
    // ======================================================
    public async Task<string> CreateAsync(HttpContext context, string finalUrl, int expiryMinutes, bool oneTimeUse)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var tenantId = _tenantResolver.ResolveTenantId(context);

        try
        {
            if (string.IsNullOrWhiteSpace(finalUrl))
            {
                _metrics.Inc("lynx_create_fail_total");
                await _auditService.LogAsync(context, tenantId, "CREATE", false, null, "FinalUrl missing");
                throw new ArgumentException("FinalUrl is required.");
            }

            if (!Uri.TryCreate(finalUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                _metrics.Inc("lynx_create_fail_total");
                await _auditService.LogAsync(context, tenantId, "CREATE", false, null, "Invalid URL format");
                throw new ArgumentException("FinalUrl must be valid http/https URL.");
            }

            var (allowed, reason) = await SsrfUrlGuard.IsAllowedAsync(finalUrl);
            if (!allowed)
            {
                _metrics.Inc("lynx_create_fail_total");
                await _auditService.LogAsync(context, tenantId, "CREATE", false, null, $"SSRF blocked: {reason}");
                throw new ArgumentException($"FinalUrl blocked: {reason}");
            }

            var expiryUtc = DateTime.UtcNow.AddMinutes(expiryMinutes <= 0 ? 10 : expiryMinutes);

            var secureToken = await _tokenService.GenerateTokenAsync(
                tenantId,
                finalUrl,
                expiryUtc,
                oneTimeUse);

            const int maxAttempts = 7;

            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                var shortCode = ShortCodeGenerator.Generate(8);

                var entity = new ShortLink
                {
                    TenantId = tenantId,
                    ShortCode = shortCode,
                    SecureToken = secureToken,
                    ExpiryUtc = expiryUtc,
                    IsActive = true,
                    ClickCount = 0,
                    CreatedAtUtc = DateTime.UtcNow
                };

                _db.Set<ShortLink>().Add(entity);

                try
                {
                    await _db.SaveChangesAsync();

                    _metrics.Inc("lynx_create_success_total");
                    await _auditService.LogAsync(context, tenantId, "CREATE", true, shortCode);

                    _ = CacheBackfillBestEffortAsync(tenantId, shortCode, secureToken, expiryUtc);

                    return shortCode;
                }
                catch (DbUpdateException ex) when (IsUniqueViolation(ex))
                {
                    _db.Entry(entity).State = EntityState.Detached;
                    _metrics.Inc("lynx_shortcode_collision_total");
                    if (attempt == maxAttempts) throw;
                }
            }

            throw new Exception("Failed to generate unique short code.");
        }
        finally
        {
            sw.Stop();
            _metrics.ObserveMs("lynx_create_duration", sw.ElapsedMilliseconds);
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex)
        => ex.InnerException is PostgresException pg && pg.SqlState == "23505";

    private async Task CacheBackfillBestEffortAsync(string tenantId, string shortCode, string secureToken, DateTime expiryUtc)
    {
        if (_redisResilience.IsRedisOpen())
        {
            _metrics.Inc("lynx_cache_skipped_circuit_open_total");
            return;
        }

        try
        {
            var ttl = expiryUtc - DateTime.UtcNow;
            if (ttl > TimeSpan.FromDays(30)) ttl = TimeSpan.FromDays(30);
            if (ttl < TimeSpan.FromMinutes(1)) ttl = TimeSpan.FromMinutes(1);

            await _cache.SetSecureTokenAsync(tenantId, shortCode, secureToken, ttl);
            _redisResilience.RedisSuccess();
        }
        catch
        {
            _redisResilience.RedisFailure();
            _metrics.Inc("lynx_cache_error_total");
        }
    }

    private static string ResolveClientIp(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
        {
            var ip = forwarded.ToString().Split(',')[0].Trim();
            if (!string.IsNullOrWhiteSpace(ip)) return ip;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "";
    }

    // ======================================================
    // RESOLVE (public redirect: NO tenant header required)
    // ======================================================
    // public async Task<string?> ResolveAsync(HttpContext context, string shortCode)
    // {
    //     var sw = System.Diagnostics.Stopwatch.StartNew();
    //     var now = DateTime.UtcNow;
    //     var ip = ResolveClientIp(context);

    //     try
    //     {
    //         if (string.IsNullOrWhiteSpace(shortCode))
    //             return null;

    //         // ✅ Step 1: Try cache that can return (tenantId, token, expiry)
    //         ShortLinkCacheItem? cached = null;

    //         if (!_redisResilience.IsRedisOpen())
    //         {
    //             try
    //             {
    //                 cached = await _cache.GetAsync(shortCode);
    //                 _redisResilience.RedisSuccess();

    //                 if (cached != null) _metrics.Inc("lynx_cache_hit_total");
    //                 else _metrics.Inc("lynx_cache_miss_total");
    //             }
    //             catch
    //             {
    //                 _redisResilience.RedisFailure();
    //                 _metrics.Inc("lynx_cache_error_total");
    //             }
    //         }
    //         else
    //         {
    //             _metrics.Inc("lynx_cache_skipped_circuit_open_total");
    //         }

    //         string tenantId;
    //         string secureToken;
    //         DateTime expiryUtc;

    //         // ✅ Step 2: DB fallback if no cache
    //         if (cached == null)
    //         {
    //             var entity = await _db.Set<ShortLink>()
    //                 .AsNoTracking()
    //                 .FirstOrDefaultAsync(x => x.ShortCode == shortCode && x.IsActive == true);

    //             if (entity == null)
    //             {
    //                 _metrics.Inc("lynx_redirect_notfound_total");
    //                 // tenant unknown here -> still log click best-effort without tenant
    //                 return null;
    //             }

    //             if (entity.ExpiryUtc < now)
    //             {
    //                 _metrics.Inc("lynx_redirect_expired_total");
    //                 return null;
    //             }

    //             tenantId = entity.TenantId;
    //             secureToken = entity.SecureToken;
    //             expiryUtc = entity.ExpiryUtc;

    //             // backfill cache
    //             _ = CacheBackfillBestEffortAsync(tenantId, shortCode, secureToken, expiryUtc);
    //         }
    //         else
    //         {
    //             tenantId = cached.TenantId;
    //             secureToken = cached.SecureToken;
    //             expiryUtc = cached.ExpiryUtc;

    //             if (expiryUtc < now)
    //             {
    //                 _metrics.Inc("lynx_redirect_expired_total");
    //                 return null;
    //             }
    //         }

    //         // ✅ Step 3: Enforce IP block (tenantId is now known)
    //         var blocked = await _db.Set<TenantIpBlock>()
    //             .AsNoTracking()
    //             .AnyAsync(x =>
    //                 x.TenantId == tenantId &&
    //                 x.IpOrCidr == ip &&
    //                 (x.ExpiresAtUtc == null || x.ExpiresAtUtc > now));

    //         if (blocked)
    //         {
    //             _metrics.Inc("lynx_redirect_blocked_ip_total");
    //             await _clickLogger.LogAsync(context, tenantId, shortCode, false, "IP blocked");
    //             await _auditService.LogAsync(context, tenantId, "ACCESS", false, shortCode, "IP blocked");
    //             return null;
    //         }

    //         // ✅ Step 4: Validate token
    //         var finalUrl = await _tokenService.ValidateAndExtractUrlAsync(context, secureToken);
    //         if (finalUrl == null)
    //         {
    //             _metrics.Inc("lynx_redirect_invalidtoken_total");
    //             await LogFailureAndMaybeAutoBlock(context, tenantId, shortCode, "Invalid signature/blacklisted");
    //             return null;
    //         }

    //         // ✅ Step 5: Update click stats (minimal DB write)
    //         var entityToUpdate = await _db.Set<ShortLink>()
    //             .FirstOrDefaultAsync(x => x.ShortCode == shortCode);

    //         if (entityToUpdate != null)
    //         {
    //             entityToUpdate.ClickCount += 1;
    //             entityToUpdate.LastAccessedAtUtc = now;
    //             await _db.SaveChangesAsync();
    //         }

    //         _metrics.Inc("lynx_redirect_success_total");
    //         await _clickLogger.LogAsync(context, tenantId, shortCode, true);
    //         await _auditService.LogAsync(context, tenantId, "ACCESS", true, shortCode);

    //         return finalUrl;
    //     }
    //     finally
    //     {
    //         sw.Stop();
    //         _metrics.ObserveMs("lynx_redirect_duration", sw.ElapsedMilliseconds);
    //     }
    // }
    public async Task<string?> ResolveAsync(HttpContext context, string shortCode)
{
    var sw = System.Diagnostics.Stopwatch.StartNew();
    var now = DateTime.UtcNow;
    var ip = ResolveClientIp(context);

    try
    {
        if (string.IsNullOrWhiteSpace(shortCode))
            return null;

        // ==============================
        // 1️⃣ CACHE LOOKUP
        // ==============================
        ShortLinkCacheItem? cached = null;

        if (!_redisResilience.IsRedisOpen())
        {
            try
            {
                cached = await _cache.GetAsync(shortCode);
                _redisResilience.RedisSuccess();

                if (cached != null)
                    _metrics.Inc("lynx_cache_hit_total");
                else
                    _metrics.Inc("lynx_cache_miss_total");
            }
            catch
            {
                _redisResilience.RedisFailure();
                _metrics.Inc("lynx_cache_error_total");
            }
        }
        else
        {
            _metrics.Inc("lynx_cache_skipped_circuit_open_total");
        }

        string tenantId;
        string secureToken;
        DateTime expiryUtc;
        Guid? campaignId = null;

        // ==============================
        // 2️⃣ DB FALLBACK
        // ==============================
        if (cached == null)
        {
            var entity = await _db.Set<ShortLink>()
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.ShortCode == shortCode &&
                    x.IsActive == true);

            if (entity == null)
            {
                _metrics.Inc("lynx_redirect_notfound_total");
                return null;
            }

            if (entity.ExpiryUtc < now)
            {
                _metrics.Inc("lynx_redirect_expired_total");
                return null;
            }

            tenantId = entity.TenantId;
            secureToken = entity.SecureToken;
            expiryUtc = entity.ExpiryUtc;
            campaignId = entity.CampaignIdUuid;

            _ = CacheBackfillBestEffortAsync(tenantId, shortCode, secureToken, expiryUtc);
        }
        else
        {
            tenantId = cached.TenantId;
            secureToken = cached.SecureToken;
            expiryUtc = cached.ExpiryUtc;
            campaignId = cached.CampaignId;

            if (expiryUtc < now)
            {
                _metrics.Inc("lynx_redirect_expired_total");
                return null;
            }
        }

        // ==============================
        // 3️⃣ CAMPAIGN ENFORCEMENT
        // ==============================
        if (campaignId.HasValue)
        {
            var campaign = await _db.Set<Campaign>()
                .FirstOrDefaultAsync(x =>
                    x.CampaignId == campaignId.Value &&
                    x.TenantId == tenantId &&
                    !x.IsArchived);

            if (campaign == null)
            {
                _metrics.Inc("lynx_campaign_missing_total");
                return null;
            }

            if (!string.Equals(campaign.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                _metrics.Inc("lynx_campaign_block_status_total");
                return null;
            }

            // -----------------------------
            // DAILY LIMIT (Redis Atomic)
            // -----------------------------
            if (campaign.DailyClickLimit.HasValue)
            {
                try
                {
                    var today = DateOnly.FromDateTime(now);

                    var dailyCount = await _campaignLimits
                        .IncrementDailyClicksAsync(
                            tenantId,
                            campaign.CampaignId,
                            today,
                            1,
                            context.RequestAborted);

                    if (dailyCount > campaign.DailyClickLimit.Value)
                    {
                        _metrics.Inc("lynx_campaign_block_daily_total");
                        await AutoCloseCampaignIfNeeded(campaign);
                        return null;
                    }
                }
                catch
                {
                    // Redis fallback
                    var todayStart = now.Date;

                    var dailyDbCount = await _db.Set<ShortLinkClickEvent>()
                        .CountAsync(x =>
                            x.TenantId == tenantId &&
                            x.CampaignIdUuid == campaign.CampaignId &&
                            x.Success &&
                            x.CreatedAtUtc >= todayStart);

                    if (dailyDbCount >= campaign.DailyClickLimit.Value)
                    {
                        _metrics.Inc("lynx_campaign_block_daily_total");
                        await AutoCloseCampaignIfNeeded(campaign);
                        return null;
                    }
                }
            }

            // -----------------------------
            // TOTAL LIMIT
            // -----------------------------
            if (campaign.TotalClickLimit.HasValue)
            {
                var totalCount = await _db.Set<ShortLinkClickEvent>()
                    .CountAsync(x =>
                        x.TenantId == tenantId &&
                        x.CampaignIdUuid == campaign.CampaignId &&
                        x.Success);

                if (totalCount >= campaign.TotalClickLimit.Value)
                {
                    _metrics.Inc("lynx_campaign_block_total_total");
                    await AutoCloseCampaignIfNeeded(campaign);
                    return null;
                }
            }
        }

        // ==============================
        // 4️⃣ IP BLOCK CHECK
        // ==============================
        var blocked = await _db.Set<TenantIpBlock>()
            .AsNoTracking()
            .AnyAsync(x =>
                x.TenantId == tenantId &&
                x.IpOrCidr == ip &&
                (x.ExpiresAtUtc == null || x.ExpiresAtUtc > now));

        if (blocked)
        {
            _metrics.Inc("lynx_redirect_blocked_ip_total");
            await _clickLogger.LogAsync(context, tenantId, shortCode, false, "IP blocked");
            await _auditService.LogAsync(context, tenantId, "ACCESS", false, shortCode, "IP blocked");
            return null;
        }

        // ==============================
        // 5️⃣ TOKEN VALIDATION
        // ==============================
        var finalUrl = await _tokenService.ValidateAndExtractUrlAsync(context, secureToken);
        if (finalUrl == null)
        {
            _metrics.Inc("lynx_redirect_invalidtoken_total");
            await LogFailureAndMaybeAutoBlock(context, tenantId, shortCode, "Invalid signature/blacklisted");
            return null;
        }

        // ==============================
        // 6️⃣ UPDATE STATS
        // ==============================
        var entityToUpdate = await _db.Set<ShortLink>()
            .FirstOrDefaultAsync(x => x.ShortCode == shortCode);

        if (entityToUpdate != null)
        {
            entityToUpdate.ClickCount += 1;
            entityToUpdate.LastAccessedAtUtc = now;
            await _db.SaveChangesAsync();
        }

        _metrics.Inc("lynx_redirect_success_total");

        await _clickLogger.LogAsync(context, tenantId, shortCode, true);
        await _auditService.LogAsync(context, tenantId, "ACCESS", true, shortCode);

        return finalUrl;
    }
    finally
    {
        sw.Stop();
        _metrics.ObserveMs("lynx_redirect_duration", sw.ElapsedMilliseconds);
    }
}

    // ======================================================
    // REVOKE
    // ======================================================
    public async Task<bool> RevokeAsync(HttpContext context, string shortCode)
    {
        if (string.IsNullOrWhiteSpace(shortCode)) return false;

        var entity = await _db.Set<ShortLink>().FirstOrDefaultAsync(x => x.ShortCode == shortCode);
        if (entity == null) return false;

        if (!_tokenService.TryParsePayload(entity.SecureToken, out var payload))
            return false;

        var tenantId = _tenantResolver.ResolveTenantId(context);

        if (!string.Equals(payload.Tid, tenantId, StringComparison.OrdinalIgnoreCase))
        {
            await _auditService.LogAsync(context, tenantId, "REVOKE", false, shortCode, "Tenant mismatch");
            return false;
        }

        var nowSec = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var ttlSeconds = payload.Exp - nowSec;
        if (ttlSeconds < 1) ttlSeconds = 60;

        await _stateStore.BlacklistAsync(payload.Tid, payload.Jti, TimeSpan.FromSeconds(ttlSeconds));

        entity.IsActive = false;
        entity.RevokedAtUtc = DateTime.UtcNow;
        entity.RevokedBy = tenantId;

        await _db.SaveChangesAsync();

        // evict cache best-effort
        try
        {
            if (!_redisResilience.IsRedisOpen())
            {
                await _cache.RemoveAsync(entity.TenantId, shortCode);
                _metrics.Inc("lynx_cache_evict_total");
            }
        }
        catch
        {
            _redisResilience.RedisFailure();
            _metrics.Inc("lynx_cache_error_total");
        }

        await _auditService.LogAsync(context, tenantId, "REVOKE", true, shortCode);
        return true;
    }

    private async Task LogFailureAndMaybeAutoBlock(HttpContext context, string tenantId, string shortCode, string reason)
    {
        var ip = ResolveClientIp(context);
        var now = DateTime.UtcNow;

        await _clickLogger.LogAsync(context, tenantId, shortCode, false, reason);
        await _auditService.LogAsync(context, tenantId, "ACCESS", false, shortCode, reason);

        if (string.IsNullOrWhiteSpace(ip)) return;

        var failureCount = await _db.Set<ShortLinkClickEvent>()
            .AsNoTracking()
            .CountAsync(x =>
                x.TenantId == tenantId &&
                x.IpAddress == ip &&
                x.Success == false &&
                x.CreatedAtUtc >= now - AutoBlockWindow);

        if (failureCount >= AutoBlockThreshold)
        {
            var exists = await _db.Set<TenantIpBlock>()
                .AsNoTracking()
                .AnyAsync(x => x.TenantId == tenantId && x.IpOrCidr == ip);

            if (!exists)
            {
                _db.Add(new TenantIpBlock
                {
                    TenantId = tenantId,
                    IpOrCidr = ip,
                    Reason = "Auto blocked due to repeated failures",
                    CreatedAtUtc = now,
                    ExpiresAtUtc = now.AddMinutes(30)
                });

                await _db.SaveChangesAsync();
                _metrics.Inc("lynx_autoblock_total");
            }
        }
    }
    public async Task<RevokeResult> RevokeDetailedAsync(HttpContext context, string shortCode)
{
    if (string.IsNullOrWhiteSpace(shortCode))
        return new RevokeResult(false, false, null, "Short code required.");

    var tenantId = _tenantResolver.ResolveTenantId(context);

    var entity = await _db.Set<ShortLink>()
        .FirstOrDefaultAsync(x => x.ShortCode == shortCode);

    if (entity == null)
    {
        await _auditService.LogAsync(context, tenantId, "REVOKE", false, shortCode, "Not found");
        return new RevokeResult(false, false, null, "Not found.");
    }

    // Validate token payload and tenant match (tenant safety)
    if (!_tokenService.TryParsePayload(entity.SecureToken, out var payload))
    {
        await _auditService.LogAsync(context, tenantId, "REVOKE", false, shortCode, "Invalid token payload");
        return new RevokeResult(false, false, null, "Invalid token payload.");
    }

    if (!string.Equals(payload.Tid, tenantId, StringComparison.OrdinalIgnoreCase))
    {
        await _auditService.LogAsync(context, tenantId, "REVOKE", false, shortCode, "Tenant mismatch");
        return new RevokeResult(false, false, null, "Tenant mismatch.");
    }

    // ✅ Idempotent: already revoked => 200 OK semantic
    if (entity.IsActive == false || entity.RevokedAtUtc != null)
    {
        await _auditService.LogAsync(context, tenantId, "REVOKE", true, shortCode, "Already revoked");
        return new RevokeResult(true, false, entity.RevokedAtUtc, "Already revoked.");
    }

    // Blacklist token until it expires
    var nowSec = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
    var ttlSeconds = payload.Exp - nowSec;
    if (ttlSeconds < 1) ttlSeconds = 60;

    await _stateStore.BlacklistAsync(payload.Tid, payload.Jti, TimeSpan.FromSeconds(ttlSeconds));

    entity.IsActive = false;
    entity.RevokedAtUtc = DateTime.UtcNow;
    entity.RevokedBy = tenantId;

    await _db.SaveChangesAsync();

    // Evict cache best-effort
    try
    {
        if (!_redisResilience.IsRedisOpen())
        {
            await _cache.RemoveAsync(tenantId, shortCode);
            _metrics.Inc("lynx_cache_evict_total");
            _redisResilience.RedisSuccess();
        }
        else
        {
            _metrics.Inc("lynx_cache_skipped_circuit_open_total");
        }
    }
    catch
    {
        _redisResilience.RedisFailure();
        _metrics.Inc("lynx_cache_error_total");
    }

    await _auditService.LogAsync(context, tenantId, "REVOKE", true, shortCode);

    return new RevokeResult(true, true, entity.RevokedAtUtc, "Revoked.");
}
private async Task AutoCloseCampaignIfNeeded(Campaign campaign)
{
    if (!string.Equals(campaign.Status, "Closed", StringComparison.OrdinalIgnoreCase))
    {
        campaign.Status = "Closed";
        campaign.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        _metrics.Inc("lynx_campaign_auto_closed_total");
    }
}
}