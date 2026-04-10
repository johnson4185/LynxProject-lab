using StackExchange.Redis;
using Lynx.Api.Interfaces;
using Lynx.Api.Security;

namespace Lynx.Api.Services;

public class IPWhitelistCacheService : IIPWhitelistCacheService
{
    private readonly IDatabase _redis;

    public IPWhitelistCacheService(IConnectionMultiplexer mux)
        => _redis = mux.GetDatabase();

    private static string KeyIp(string tid, string ip) => $"wl:{tid}:ip:{ip}";
    private static string KeyCidr(string tid, string cidr) => $"wl:{tid}:cidr:{cidr}";
    private static string KeyIndex(string tid) => $"wl:{tid}:index";

    public async Task<bool> IsWhitelistedAsync(string tenantId, string ip)
    {
        if (string.IsNullOrWhiteSpace(ip)) return false;

        // 1) exact
        if (await _redis.KeyExistsAsync(KeyIp(tenantId, ip)))
            return true;

        // 2) cidr scan (top N active)
        var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var members = await _redis.SortedSetRangeByScoreAsync(
            KeyIndex(tenantId),
            start: nowUnix,
            stop: double.PositiveInfinity,
            order: Order.Descending,
            take: 200);

        foreach (var m in members)
        {
            var entry = m.ToString();
            if (!entry.StartsWith("cidr:", StringComparison.OrdinalIgnoreCase))
                continue;

            var cidr = entry.Substring("cidr:".Length);

            if (!await _redis.KeyExistsAsync(KeyCidr(tenantId, cidr)))
                continue;

            if (CidrUtils.IsMatch(ip, cidr))
                return true;
        }

        return false;
    }

    public async Task AddWhitelistAsync(string tenantId, string ipOrCidr, DateTime? expiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(ipOrCidr)) return;

        var expiry = expiresAtUtc ?? DateTime.UtcNow.AddDays(3650); // default "long-lived"
        var ttl = expiry - DateTime.UtcNow;
        if (ttl <= TimeSpan.Zero) ttl = TimeSpan.FromMinutes(1);
        if (ttl > TimeSpan.FromDays(3650)) ttl = TimeSpan.FromDays(3650);

        var expUnix = new DateTimeOffset(DateTime.SpecifyKind(expiry, DateTimeKind.Utc)).ToUnixTimeSeconds();

        if (ipOrCidr.Contains("/"))
        {
            await _redis.StringSetAsync(KeyCidr(tenantId, ipOrCidr), "1", ttl);
            await _redis.SortedSetAddAsync(KeyIndex(tenantId), $"cidr:{ipOrCidr}", expUnix);
        }
        else
        {
            await _redis.StringSetAsync(KeyIp(tenantId, ipOrCidr), "1", ttl);
            await _redis.SortedSetAddAsync(KeyIndex(tenantId), $"ip:{ipOrCidr}", expUnix);
        }

        await _redis.KeyExpireAsync(KeyIndex(tenantId), TimeSpan.FromDays(30));
    }

    public async Task RemoveWhitelistAsync(string tenantId, string ipOrCidr)
    {
        if (string.IsNullOrWhiteSpace(ipOrCidr)) return;

        if (ipOrCidr.Contains("/"))
        {
            await _redis.KeyDeleteAsync(KeyCidr(tenantId, ipOrCidr));
            await _redis.SortedSetRemoveAsync(KeyIndex(tenantId), $"cidr:{ipOrCidr}");
        }
        else
        {
            await _redis.KeyDeleteAsync(KeyIp(tenantId, ipOrCidr));
            await _redis.SortedSetRemoveAsync(KeyIndex(tenantId), $"ip:{ipOrCidr}");
        }
    }
    // =====================================================
// GET ACTIVE (DASHBOARD)
// =====================================================
public async Task<IReadOnlyList<(string kind, string value, DateTime expiresUtc)>>
    GetActiveWhitelistAsync(string tenantId, int top = 200)
{
    var indexKey = KeyIndex(tenantId);
    var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

    var entries = await _redis.SortedSetRangeByScoreWithScoresAsync(
        key: indexKey,
        start: nowUnix,
        stop: double.PositiveInfinity,
        exclude: Exclude.None,
        order: Order.Descending,
        skip: 0,
        take: Math.Clamp(top, 1, 1000));

    var result = new List<(string kind, string value, DateTime expiresUtc)>();

    foreach (var e in entries)
    {
        var member = e.Element.ToString();
        var expUnix = (long)e.Score;
        var expUtc = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;

        if (member.StartsWith("ip:", StringComparison.OrdinalIgnoreCase))
            result.Add(("ip", member.Substring(3), expUtc));
        else if (member.StartsWith("cidr:", StringComparison.OrdinalIgnoreCase))
            result.Add(("cidr", member.Substring(5), expUtc));
    }

    return result;
}

    // =====================================================
    // CLEANUP
    // =====================================================
    public async Task CleanupExpiredIndexAsync(string tenantId)
    {
        var indexKey = KeyIndex(tenantId);
        var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        await _redis.SortedSetRemoveRangeByScoreAsync(
            indexKey,
            double.NegativeInfinity,
            nowUnix - 1);
    }

}