using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAdminDashboardService _svc;
    private readonly ITenantResolver _tenant;
    private readonly IIPBlockCacheService _blockCache;
    private readonly IIPWhitelistCacheService _whitelistCache;

    public AdminDashboardController(
        AppDbContext db,
        IAdminDashboardService svc,
        ITenantResolver tenant,
        IIPBlockCacheService blockCache,
        IIPWhitelistCacheService whitelistCache)
    {
        _db = db;
        _svc = svc;
        _tenant = tenant;
        _blockCache = blockCache;
        _whitelistCache = whitelistCache;
    }

    private string? ResolveTenantOrNull()
    {
        var tid = _tenant.ResolveTenantId(HttpContext);
        return string.IsNullOrWhiteSpace(tid) ? null : tid;
    }

    // ======================================================
    // HEALTH (enterprise ops)
    // GET /api/admin/dashboard/health
    // ======================================================
    [HttpGet("health")]
    public async Task<IActionResult> Health(CancellationToken ct)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        // DB check (fast)
        var dbOk = true;
        string? dbError = null;
        try
        {
            // minimal query to validate connectivity
            _ = await _db.Database.ExecuteSqlRawAsync("SELECT 1;", ct);
        }
        catch (Exception ex)
        {
            dbOk = false;
            dbError = ex.Message;
        }

        // Redis checks: best-effort (don’t block dashboard)
        var redisBlocksOk = true;
        var redisWhitelistOk = true;
        string? redisError = null;

        try
        {
            _ = await _blockCache.GetActiveBlocksAsync(tenantId, 1);
        }
        catch (Exception ex)
        {
            redisBlocksOk = false;
            redisError = ex.Message;
        }

        try
        {
            _ = await _whitelistCache.GetActiveWhitelistAsync(tenantId, 1);
        }
        catch (Exception ex)
        {
            redisWhitelistOk = false;
            redisError ??= ex.Message;
        }

        return Ok(new
        {
            tenantId,
            utcNow = DateTime.UtcNow,
            db = new { ok = dbOk, error = dbError },
            redis = new
            {
                blocksOk = redisBlocksOk,
                whitelistOk = redisWhitelistOk,
                error = redisError
            }
        });
    }

    // ======================================================
    // ACTIVE BLOCKS (Redis)
    // GET /api/admin/dashboard/blocks?top=200
    // ======================================================
    [HttpGet("blocks")]
    public async Task<IActionResult> ActiveBlocks([FromQuery] int top = 200, CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        top = Math.Clamp(top, 1, 1000);

        // housekeeping best-effort
        try { await _blockCache.CleanupExpiredIndexAsync(tenantId); } catch { /* ignore */ }

        var blocks = await _blockCache.GetActiveBlocksAsync(tenantId, top);

        return Ok(blocks.Select(b => new
        {
            kind = b.kind,
            value = b.value,
            expiresUtc = b.expiresUtc
        }));
    }

    // ======================================================
    // ACTIVE WHITELIST (Redis)
    // GET /api/admin/dashboard/whitelist?top=200
    // ======================================================
    [HttpGet("whitelist")]
    public async Task<IActionResult> ActiveWhitelist([FromQuery] int top = 200, CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        top = Math.Clamp(top, 1, 1000);

        // housekeeping best-effort
        try { await _whitelistCache.CleanupExpiredIndexAsync(tenantId); } catch { /* ignore */ }

        var rows = await _whitelistCache.GetActiveWhitelistAsync(tenantId, top);

        return Ok(rows.Select(x => new
        {
            kind = x.kind,
            value = x.value,
            expiresUtc = x.expiresUtc
        }));
    }

    // ======================================================
    // EVENTS (Audit log)
    // GET /api/admin/dashboard/events?type=ACCESS&success=false&from=...&to=...&take=100
    // ======================================================
    [HttpGet("events")]
    public async Task<IActionResult> Events(
        [FromQuery] string? type = null,
        [FromQuery] bool? success = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int take = 100,
        CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        take = Math.Clamp(take, 1, 500);

        var f = (from ?? DateTime.UtcNow.AddHours(-24)).ToUniversalTime();
        var t = (to ?? DateTime.UtcNow).ToUniversalTime();
        if (t < f) (f, t) = (t, f);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= f && x.CreatedAtUtc <= t);

        if (!string.IsNullOrWhiteSpace(type))
            q = q.Where(x => x.EventType == type);

        if (success.HasValue)
            q = q.Where(x => x.Success == success.Value);

        var rows = await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(take)
            .Select(x => new
            {
                x.EventType,
                x.Success,
                x.ShortCode,
                x.Reason,
                x.CorrelationId,
                x.IpAddress,
                x.UserAgent,
                x.CreatedAtUtc
            })
            .ToListAsync(ct);

        return Ok(new
        {
            fromUtc = f,
            toUtc = t,
            take,
            data = rows
        });
    }

    // ======================================================
    // SUMMARY (fast counters)
    // GET /api/admin/dashboard/summary?minutes=60
    // ======================================================
    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] int minutes = 60, CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        minutes = Math.Clamp(minutes, 1, 24 * 60);
        var fromUtc = DateTime.UtcNow.AddMinutes(-minutes);

        var rateLimitedTask = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .CountAsync(x => x.TenantId == tenantId && x.EventType == "RATE_LIMIT" && x.CreatedAtUtc >= fromUtc, ct);

        var securityTask = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .CountAsync(x => x.TenantId == tenantId && x.EventType == "SECURITY" && x.CreatedAtUtc >= fromUtc, ct);

        var accessFailuresTask = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .CountAsync(x => x.TenantId == tenantId && x.EventType == "ACCESS" && x.Success == false && x.CreatedAtUtc >= fromUtc, ct);

        // Redis based
        var activeBlocksTask = _blockCache.GetActiveBlocksAsync(tenantId, 1000);
        var activeWhitelistTask = _whitelistCache.GetActiveWhitelistAsync(tenantId, 1000);

        await Task.WhenAll(rateLimitedTask, securityTask, accessFailuresTask, activeBlocksTask, activeWhitelistTask);

        return Ok(new
        {
            fromUtc,
            minutes,
            rateLimited = rateLimitedTask.Result,
            securityEvents = securityTask.Result,
            accessFailures = accessFailuresTask.Result,
            activeBlocks = activeBlocksTask.Result.Count,
            activeWhitelist = activeWhitelistTask.Result.Count
        });
    }

    // ======================================================
    // TIMESERIES (dashboard charts)
    // GET /api/admin/dashboard/timeseries?minutes=120&bucketMinutes=5
    // ======================================================
    [HttpGet("timeseries")]
    public async Task<IActionResult> TimeSeries(
        [FromQuery] int minutes = 120,
        [FromQuery] int bucketMinutes = 5,
        CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        minutes = Math.Clamp(minutes, 5, 24 * 60);
        bucketMinutes = Math.Clamp(bucketMinutes, 1, 60);

        var fromUtc = DateTime.UtcNow.AddMinutes(-minutes);

        var data = await _db.Set<ShortLinkClickEvent>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= fromUtc)
            .GroupBy(x => new
            {
                Bucket = new DateTime(
                    x.CreatedAtUtc.Year,
                    x.CreatedAtUtc.Month,
                    x.CreatedAtUtc.Day,
                    x.CreatedAtUtc.Hour,
                    (x.CreatedAtUtc.Minute / bucketMinutes) * bucketMinutes,
                    0,
                    DateTimeKind.Utc)
            })
            .Select(g => new
            {
                bucketUtc = g.Key.Bucket,
                success = g.LongCount(x => x.Success),
                failed = g.LongCount(x => !x.Success)
            })
            .OrderBy(x => x.bucketUtc)
            .ToListAsync(ct);

        return Ok(new
        {
            fromUtc,
            minutes,
            bucketMinutes,
            points = data
        });
    }

    // ======================================================
    // SUSPICIOUS IPs (SOC view)
    // GET /api/admin/dashboard/suspicious-ips?lastHours=24&top=20
    // ======================================================
    [HttpGet("suspicious-ips")]
    public async Task<IActionResult> SuspiciousIps(
        [FromQuery] int lastHours = 24,
        [FromQuery] int top = 20,
        CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        lastHours = Math.Clamp(lastHours, 1, 24 * 30);
        top = Math.Clamp(top, 1, 200);

        var fromUtc = DateTime.UtcNow.AddHours(-lastHours);

        var rows = await _db.Set<ShortLinkClickEvent>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Success == false && x.CreatedAtUtc >= fromUtc)
            .GroupBy(x => x.IpAddress)
            .Select(g => new
            {
                ip = g.Key,
                failures = g.LongCount(),
                lastSeen = g.Max(x => x.CreatedAtUtc)
            })
            .OrderByDescending(x => x.failures)
            .Take(top)
            .ToListAsync(ct);

        return Ok(rows.Where(x => !string.IsNullOrWhiteSpace(x.ip)));
    }

    // ======================================================
    // TOP RATE LIMITED IPs
    // GET /api/admin/dashboard/top-rate-limited-ips?minutes=60&top=20
    // ======================================================
    [HttpGet("top-rate-limited-ips")]
    public async Task<IActionResult> TopRateLimitedIps(
        [FromQuery] int minutes = 60,
        [FromQuery] int top = 20,
        CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        minutes = Math.Clamp(minutes, 1, 24 * 60);
        top = Math.Clamp(top, 1, 200);
        var fromUtc = DateTime.UtcNow.AddMinutes(-minutes);

        var data = await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.EventType == "RATE_LIMIT" && x.CreatedAtUtc >= fromUtc)
            .GroupBy(x => x.IpAddress)
            .Select(g => new
            {
                ip = g.Key,
                hits = g.LongCount(),
                lastSeen = g.Max(x => x.CreatedAtUtc)
            })
            .OrderByDescending(x => x.hits)
            .Take(top)
            .ToListAsync(ct);

        return Ok(data.Where(x => !string.IsNullOrWhiteSpace(x.ip)));
    }

    // ======================================================
    // SECURITY INCIDENTS (merged here)
    // GET /api/admin/dashboard/incidents?take=100
    // ======================================================
    [HttpGet("incidents")]
    public async Task<IActionResult> Incidents([FromQuery] int take = 100, CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        take = Math.Clamp(take, 1, 500);

        // Keep generic to avoid compile breaks if your entity fields differ
        var incidents = await _db.Set<SecurityIncident>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(take)
            .ToListAsync(ct);

        return Ok(new { take, data = incidents });
    }

    // ======================================================
    // TOP LINKS (delegated service)
    // GET /api/admin/dashboard/top-links?from=...&to=...&top=10
    // ======================================================
    [HttpGet("top-links")]
    public async Task<IActionResult> TopLinks(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int top = 10,
        CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        top = Math.Clamp(top, 1, 200);

        var f = (from ?? DateTime.UtcNow.AddDays(-7)).ToUniversalTime();
        var t = (to ?? DateTime.UtcNow).ToUniversalTime();
        if (t < f) (f, t) = (t, f);

        return Ok(await _svc.TopLinksAsync(tenantId, f, t, top, ct));
    }

    // ======================================================
    // TOP FAILED IPS (delegated service)
    // GET /api/admin/dashboard/top-failed-ips?from=...&to=...&top=10
    // ======================================================
    [HttpGet("top-failed-ips")]
    public async Task<IActionResult> TopFailedIps(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int top = 10,
        CancellationToken ct = default)
    {
        var tenantId = ResolveTenantOrNull();
        if (tenantId == null) return Unauthorized("Tenant not resolved.");

        top = Math.Clamp(top, 1, 200);

        var f = (from ?? DateTime.UtcNow.AddDays(-7)).ToUniversalTime();
        var t = (to ?? DateTime.UtcNow).ToUniversalTime();
        if (t < f) (f, t) = (t, f);

        return Ok(await _svc.TopFailedIpsAsync(tenantId, f, t, top, ct));
    }
}