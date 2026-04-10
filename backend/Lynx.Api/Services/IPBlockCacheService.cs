using StackExchange.Redis;
using Lynx.Api.Interfaces;
using Lynx.Api.Security;

namespace Lynx.Api.Services;

public class IPBlockCacheService : IIPBlockCacheService
{
    private readonly IDatabase _redis;

    public IPBlockCacheService(IConnectionMultiplexer mux)
    {
        _redis = mux.GetDatabase();
    }

    // ================================
    // Key Builders
    // ================================
    private static string KeyIp(string tid, string ip)
        => $"blocked:{tid}:{ip}";

    private static string KeyCidr(string tid, string cidr)
        => $"blockedcidr:{tid}:{cidr}";

    private static string KeyIndex(string tid)
        => $"blockedindex:{tid}";

    // ================================
    // Check If Blocked (Used by Middleware)
    // ================================
    public async Task<bool> IsBlockedAsync(string tenantId, string ip)
    {
        if (string.IsNullOrWhiteSpace(ip))
            return false;

        // 1️⃣ Exact IP check (O(1))
        if (await _redis.KeyExistsAsync(KeyIp(tenantId, ip)))
            return true;

        // 2️⃣ CIDR check (from sorted index)
        var indexKey = KeyIndex(tenantId);
        var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var members = await _redis.SortedSetRangeByScoreAsync(
            indexKey,
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

            // Ensure actual key still exists (TTL may have expired)
            if (!await _redis.KeyExistsAsync(KeyCidr(tenantId, cidr)))
                continue;

            if (CidrUtils.IsMatch(ip, cidr))
                return true;
        }

        return false;
    }

    // ================================
    // Add Block (IP or CIDR)
    // ================================
    public async Task AddBlockAsync(
        string tenantId,
        string ipOrCidr,
        DateTime? expiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(ipOrCidr))
            return;

        var expiry = expiresAtUtc ?? DateTime.UtcNow.AddMinutes(30);
        var ttl = expiry - DateTime.UtcNow;

        if (ttl <= TimeSpan.Zero)
            ttl = TimeSpan.FromMinutes(1);

        var expUnix = new DateTimeOffset(expiry).ToUnixTimeSeconds();
        var indexKey = KeyIndex(tenantId);

        if (ipOrCidr.Contains("/"))
        {
            await _redis.StringSetAsync(
                KeyCidr(tenantId, ipOrCidr),
                "1",
                ttl);

            await _redis.SortedSetAddAsync(
                indexKey,
                $"cidr:{ipOrCidr}",
                expUnix);
        }
        else
        {
            await _redis.StringSetAsync(
                KeyIp(tenantId, ipOrCidr),
                "1",
                ttl);

            await _redis.SortedSetAddAsync(
                indexKey,
                $"ip:{ipOrCidr}",
                expUnix);
        }

        // Keep index alive
        await _redis.KeyExpireAsync(indexKey, TimeSpan.FromDays(30));
    }

    // ================================
    // Remove Block (IP or CIDR)
    // ================================
    public async Task RemoveBlockAsync(
        string tenantId,
        string ipOrCidr)
    {
        var indexKey = KeyIndex(tenantId);

        if (ipOrCidr.Contains("/"))
        {
            await _redis.KeyDeleteAsync(KeyCidr(tenantId, ipOrCidr));
            await _redis.SortedSetRemoveAsync(indexKey, $"cidr:{ipOrCidr}");
        }
        else
        {
            await _redis.KeyDeleteAsync(KeyIp(tenantId, ipOrCidr));
            await _redis.SortedSetRemoveAsync(indexKey, $"ip:{ipOrCidr}");
        }
    }

    // ================================
    // Get Active Blocks (Dashboard View)
    // ================================
    public async Task<IReadOnlyList<(string kind, string value, DateTime expiresUtc)>> 
        GetActiveBlocksAsync(string tenantId, int top = 200)
    {
        var indexKey = KeyIndex(tenantId);
        var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var entries = await _redis.SortedSetRangeByScoreWithScoresAsync(
            indexKey,
            start: nowUnix,
            stop: double.PositiveInfinity,
            order: Order.Descending,
            take: Math.Clamp(top, 1, 1000));

        var result = new List<(string, string, DateTime)>();

        foreach (var e in entries)
        {
            var member = e.Element.ToString();
            var expUnix = (long)e.Score;
            var expUtc = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;

            if (member.StartsWith("ip:", StringComparison.OrdinalIgnoreCase))
            {
                result.Add(("ip", member.Substring(3), expUtc));
            }
            else if (member.StartsWith("cidr:", StringComparison.OrdinalIgnoreCase))
            {
                result.Add(("cidr", member.Substring(5), expUtc));
            }
        }

        return result;
    }

    // ================================
    // Cleanup Expired Index Entries
    // ================================
    public async Task CleanupExpiredIndexAsync(string tenantId)
    {
        var indexKey = KeyIndex(tenantId);
        var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        await _redis.SortedSetRemoveRangeByScoreAsync(
            indexKey,
            double.NegativeInfinity,
            nowUnix - 1);
    }
    // ================================
// Block Exact IP (Direct)
// ================================
public async Task BlockIpAsync(
    string tenantId,
    string ip,
    TimeSpan ttl)
{
    if (string.IsNullOrWhiteSpace(ip))
        return;

    var expiry = DateTime.UtcNow.Add(ttl);

    await AddBlockAsync(
        tenantId,
        ip,
        expiry);
}

// ================================
// Block CIDR Range (Direct)
// ================================
public async Task BlockCidrAsync(
    string tenantId,
    string cidr,
    TimeSpan ttl)
{
    if (string.IsNullOrWhiteSpace(cidr))
        return;

    var expiry = DateTime.UtcNow.Add(ttl);

    await AddBlockAsync(
        tenantId,
        cidr,
        expiry);
}
}