using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace YourProject.Services;



public class AdminDashboardService : IAdminDashboardService
{
    private readonly AppDbContext _db;
    public AdminDashboardService(AppDbContext db) => _db = db;

    public async Task<object> SummaryAsync(string tenantId, DateTime from, DateTime to)
    {
        var linksCreated = await _db.Set<ShortLink>()
            .CountAsync(x => x.TenantId == tenantId && x.CreatedAtUtc >= from && x.CreatedAtUtc <= to);

        var clicks = await _db.Set<ShortLinkClickEvent>()
            .CountAsync(x => x.TenantId == tenantId && x.Success && x.CreatedAtUtc >= from && x.CreatedAtUtc <= to);

        var failures = await _db.Set<ShortLinkClickEvent>()
            .CountAsync(x => x.TenantId == tenantId && !x.Success && x.CreatedAtUtc >= from && x.CreatedAtUtc <= to);

        var revoked = await _db.Set<ShortLink>()
            .CountAsync(x => x.TenantId == tenantId && x.RevokedAtUtc != null);

        return new { linksCreated, clicks, failures, revoked };
    }

   public async Task<object> TopLinksAsync(string tenantId, DateTime from, DateTime to, int top, CancellationToken ct = default)
    {
        var rows = await _db.Set<ShortLinkClickEvent>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Success && x.CreatedAtUtc >= from && x.CreatedAtUtc <= to)
            .GroupBy(x => x.ShortCode)
            .Select(g => new { shortCode = g.Key, clicks = g.LongCount() })
            .OrderByDescending(x => x.clicks)
            .Take(Math.Clamp(top, 1, 100))
            .ToListAsync(ct);

        return rows;
    }

    public async Task<object> TopFailedIpsAsync(
    string tenantId,
    DateTime from,
    DateTime to,
    int top,
    CancellationToken ct = default)
{
    var rows = await _db.Set<ShortLinkClickEvent>()
        .AsNoTracking()
        .Where(x =>
            x.TenantId == tenantId &&
            !x.Success &&
            x.CreatedAtUtc >= from &&
            x.CreatedAtUtc <= to &&
            x.IpAddress != null)
        .GroupBy(x => x.IpAddress)
        .Select(g => new
        {
            ip = g.Key,
            failures = g.LongCount(),
            lastSeen = g.Max(x => x.CreatedAtUtc)
        })
        .OrderByDescending(x => x.failures)
        .Take(Math.Clamp(top, 1, 100))
        .ToListAsync(ct);

    return rows;
}
}