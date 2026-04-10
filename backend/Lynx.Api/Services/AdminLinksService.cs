using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Admin;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services;



public class AdminLinksService : IAdminLinksService
{
    private readonly AppDbContext _db;
    private readonly ITenantResolver _tenant;
    private readonly IHmacTokenService _hmac;
    private readonly ITokenStateStore _stateStore;
    private readonly IAuditService _audit;

    public AdminLinksService(
        AppDbContext db,
        ITenantResolver tenant,
        IHmacTokenService hmac,
        ITokenStateStore stateStore,
        IAuditService audit)
    {
        _db = db;
        _tenant = tenant;
        _hmac = hmac;
        _stateStore = stateStore;
        _audit = audit;
    }

    public async Task<(long total, int page, int pageSize, List<LinkListItemDto> items)> SearchAsync(
        HttpContext context,
        LinkSearchDto q,
        CancellationToken ct = default)
    {
        var tenantId = RequireTenant(context);

        var query = _db.Set<ShortLink>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(x =>
                (x.ShortCode != null && EF.Functions.ILike(x.ShortCode, $"%{s}%")) ||
                (x.Title != null && EF.Functions.ILike(x.Title, $"%{s}%")));
        }

        if (q.CampaignId.HasValue)
            query = query.Where(x => x.CampaignId == q.CampaignId.Value);

        if (q.From.HasValue) query = query.Where(x => x.CreatedAtUtc >= q.From.Value);
        if (q.To.HasValue) query = query.Where(x => x.CreatedAtUtc <= q.To.Value);

        if (!string.IsNullOrWhiteSpace(q.Status))
        {
            var now = DateTime.UtcNow;

            if (q.Status.Equals("active", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.IsActive == true && x.ExpiryUtc >= now && x.RevokedAtUtc == null);
            }
            else if (q.Status.Equals("revoked", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.IsActive == false || x.RevokedAtUtc != null);
            }
            else if (q.Status.Equals("expired", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.ExpiryUtc < now);
            }
        }

        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, 200);

        var total = await query.LongCountAsync(ct);

        var rows = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => MapToDto(x))
            .ToListAsync(ct);

        return (total, page, pageSize, rows);
    }

    public async Task<LinkListItemDto?> GetAsync(
        HttpContext context,
        string shortCode,
        CancellationToken ct = default)
    {
        var tenantId = RequireTenant(context);

        if (string.IsNullOrWhiteSpace(shortCode))
            return null;

        var row = await _db.Set<ShortLink>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.ShortCode == shortCode)
            .Select(x => MapToDto(x))
            .FirstOrDefaultAsync(ct);

        return row;
    }

    public async Task<LinkListItemDto?> UpdateAsync(
        HttpContext context,
        string shortCode,
        UpdateLinkDto dto,
        CancellationToken ct = default)
    {
        var tenantId = RequireTenant(context);

        if (string.IsNullOrWhiteSpace(shortCode))
            return null;

        var entity = await _db.Set<ShortLink>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ShortCode == shortCode, ct);

        if (entity == null) return null;

        if (dto.Title != null)
            entity.Title = dto.Title.Trim();

        if (dto.CampaignId.HasValue)
            entity.CampaignId = dto.CampaignId.Value;

        if (dto.Tags != null)
            entity.Tags = dto.Tags;

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(context, tenantId, "ADMIN_LINK_UPDATE", true, shortCode);

        return MapToDto(entity);
    }

    public async Task<(string shortCode, DateTime newExpiryUtc)> ExtendExpiryAsync(
        HttpContext context,
        string shortCode,
        int minutes,
        CancellationToken ct = default)
    {
        var tenantId = RequireTenant(context);

        if (string.IsNullOrWhiteSpace(shortCode))
            throw new ArgumentException("Short code required.");

        var link = await _db.Set<ShortLink>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ShortCode == shortCode, ct);

        if (link == null)
            throw new KeyNotFoundException("Short link not found.");

        var addMinutes = Math.Clamp(minutes, 1, 60 * 24 * 30);

        var baseTime = link.ExpiryUtc > DateTime.UtcNow ? link.ExpiryUtc : DateTime.UtcNow;
        link.ExpiryUtc = baseTime.AddMinutes(addMinutes);

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(context, tenantId, "ADMIN_LINK_EXTEND_EXPIRY", true, shortCode);

        return (shortCode, link.ExpiryUtc);
    }

    public async Task<bool> RevokeAsync(
        HttpContext context,
        string shortCode,
        string? reason,
        CancellationToken ct = default)
    {
        var tenantId = RequireTenant(context);

        if (string.IsNullOrWhiteSpace(shortCode))
            return false;

        var link = await _db.Set<ShortLink>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ShortCode == shortCode, ct);

        if (link == null)
        {
            await _audit.LogAsync(context, tenantId, "ADMIN_LINK_REVOKE", false, shortCode, "Not found");
            return false;
        }

        if (link.IsActive == false || link.RevokedAtUtc != null)
        {
            await _audit.LogAsync(context, tenantId, "ADMIN_LINK_REVOKE", true, shortCode, "Already revoked");
            return true;
        }

        if (_hmac.TryParsePayload(link.SecureToken, out var payload))
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var ttlSeconds = payload.Exp - now;
            if (ttlSeconds < 1) ttlSeconds = 60;

            await _stateStore.BlacklistAsync(payload.Tid, payload.Jti, TimeSpan.FromSeconds(ttlSeconds));
        }

        link.IsActive = false;
        link.RevokedAtUtc = DateTime.UtcNow;
        link.RevokedBy = GetActor(context);

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(context, tenantId, "ADMIN_LINK_REVOKE", true, shortCode, reason);

        return true;
    }

    public async Task<bool> ActivateAsync(
        HttpContext context,
        string shortCode,
        CancellationToken ct = default)
    {
        var tenantId = RequireTenant(context);

        if (string.IsNullOrWhiteSpace(shortCode))
            return false;

        var link = await _db.Set<ShortLink>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ShortCode == shortCode, ct);

        if (link == null)
        {
            await _audit.LogAsync(context, tenantId, "ADMIN_LINK_ACTIVATE", false, shortCode, "Not found");
            return false;
        }

        link.IsActive = true;
        link.RevokedAtUtc = null;
        link.RevokedBy = null;

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(context, tenantId, "ADMIN_LINK_ACTIVATE", true, shortCode);

        return true;
    }

    public async Task<(int requested, int revoked)> BulkRevokeAsync(
        HttpContext context,
        BulkRevokeDto dto,
        CancellationToken ct = default)
    {
        var tenantId = RequireTenant(context);

        var requested = dto.ShortCodes?.Count ?? 0;
        if (requested == 0) return (0, 0);

        var codes = dto.ShortCodes!
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // NOTE: for huge lists, prefer batching. For now OK.
        var links = await _db.Set<ShortLink>()
            .Where(x => x.TenantId == tenantId && codes.Contains(x.ShortCode))
            .ToListAsync(ct);

        var revoked = 0;

        foreach (var link in links)
        {
            if (link.IsActive == false || link.RevokedAtUtc != null)
                continue;

            if (_hmac.TryParsePayload(link.SecureToken, out var payload))
            {
                var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var ttlSeconds = payload.Exp - now;
                if (ttlSeconds < 1) ttlSeconds = 60;

                await _stateStore.BlacklistAsync(payload.Tid, payload.Jti, TimeSpan.FromSeconds(ttlSeconds));
            }

            link.IsActive = false;
            link.RevokedAtUtc = DateTime.UtcNow;
            link.RevokedBy = GetActor(context);
            revoked++;
        }

        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(
            context,
            tenantId,
            "ADMIN_LINK_BULK_REVOKE",
            true,
            null,
            $"requested={requested}, revoked={revoked}. {dto.Reason}");

        return (codes.Count, revoked);
    }

    private string RequireTenant(HttpContext context)
    {
        var tenantId = _tenant.ResolveTenantId(context);
        if (string.IsNullOrWhiteSpace(tenantId))
            throw new UnauthorizedAccessException("Tenant not resolved. Provide X-Tenant-Id header.");
        return tenantId;
    }

    private static string? GetActor(HttpContext context)
    {
        // Prefer authenticated user if available
        var name = context.User?.Identity?.Name;
        if (!string.IsNullOrWhiteSpace(name)) return name;

        // Fallback header for admin panel usage
        if (context.Request.Headers.TryGetValue("X-Admin-User", out var hdr) && !string.IsNullOrWhiteSpace(hdr))
            return hdr.ToString().Trim();

        return "admin";
    }

    private static LinkListItemDto MapToDto(ShortLink x)
    {
        var now = DateTime.UtcNow;

        var status =
            (x.IsActive == false || x.RevokedAtUtc != null) ? "revoked"
            : (x.ExpiryUtc < now) ? "expired"
            : "active";

        return new LinkListItemDto
        {
            ShortCode = x.ShortCode!,
            Status = status,
            Title = x.Title,
            CampaignId = x.CampaignId,
            ClickCount = x.ClickCount,
            CreatedAtUtc = x.CreatedAtUtc,
            ExpiryUtc = x.ExpiryUtc,
            IsActive = x.IsActive,
            LastAccessedAtUtc = x.LastAccessedAtUtc,
            RevokedAtUtc = x.RevokedAtUtc,
            RevokedBy = x.RevokedBy,
            Tags = x.Tags
        };
    }
}