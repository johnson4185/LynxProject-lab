using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Lynx.Api.Interfaces;
using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;

namespace Lynx.Api.Services;

public class SecurityPolicyProvider : ISecurityPolicyProvider
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;

    public SecurityPolicyProvider(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<TenantSecurityPolicySnapshot> GetAsync(string tenantId)
    {
        var key = $"secpol:{tenantId}";
        if (_cache.TryGetValue(key, out TenantSecurityPolicySnapshot snap))
            return snap;

        var row = await _db.Set<TenantSecurityPolicy>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId);

        // Defaults if no row exists
        snap = row == null
            ? new TenantSecurityPolicySnapshot(120, 30, true, 5, 300, 1800, 40)
            : new TenantSecurityPolicySnapshot(
                row.RedirectLimitPerMinute,
                row.CreateLimitPerMinute,
                row.AutoBlockEnabled,
                row.AutoBlockThreshold,
                row.AutoBlockWindowSeconds,
                row.AutoBlockTtlSeconds,
                row.BotScoreThreshold);

        _cache.Set(key, snap, TimeSpan.FromSeconds(30));
        return snap;
    }
}