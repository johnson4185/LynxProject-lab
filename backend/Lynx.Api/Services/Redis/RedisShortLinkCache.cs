using System.Globalization;
using Lynx.Api.Interfaces;
using StackExchange.Redis;

namespace Lynx.Api.Services.Redis;

public class RedisShortLinkCache : IShortLinkCache
{
    private readonly IDatabase _db;
    public RedisShortLinkCache(IConnectionMultiplexer mux) => _db = mux.GetDatabase();

    // Existing tenant-scoped key
    private static string Key(string tenantId, string shortCode) => $"sl:{tenantId}:{shortCode}";

    // NEW public redirect lookup key (no tenant header required)
    private static string LookupKey(string shortCode) => $"sl:lookup:{shortCode}";

    public async Task<string?> GetSecureTokenAsync(string tenantId, string shortCode, CancellationToken ct = default)
    {
        var val = await _db.StringGetAsync(Key(tenantId, shortCode));
        return val.HasValue ? val.ToString() : null;
    }

    // public async Task SetSecureTokenAsync(string tenantId, string shortCode, string secureToken, TimeSpan ttl, Guid? campaignId = null,CancellationToken ct = default)
    // {
    //     if (ttl < TimeSpan.FromSeconds(30)) ttl = TimeSpan.FromSeconds(30);
    //     if (ttl > TimeSpan.FromDays(30)) ttl = TimeSpan.FromDays(30);

    //     // 1) Tenant-scoped key
    //     await _db.StringSetAsync(Key(tenantId, shortCode), secureToken, ttl);

    //     // 2) Public lookup hash for redirect
    //     var expiryUtc = DateTime.UtcNow.Add(ttl);
    //     var lookupKey = LookupKey(shortCode);

    //     var entries = new[]
    //     {
    //         new HashEntry("tenantId", tenantId),
    //         new HashEntry("token", secureToken),
    //         new HashEntry("expiryUtc", expiryUtc.ToString("O", CultureInfo.InvariantCulture))
    //     };

    //     // ✅ store campaignId if exists
    // if (campaignId.HasValue)
    //     entries.Add(new HashEntry("campaignId", campaignId.Value.ToString()));

    //     await _db.HashSetAsync(lookupKey, entries);
    //     await _db.KeyExpireAsync(lookupKey, ttl);
    // }
    public async Task SetSecureTokenAsync(
    string tenantId,
    string shortCode,
    string secureToken,
    TimeSpan ttl,
    Guid? campaignId = null,
    CancellationToken ct = default)
{
    if (ttl < TimeSpan.FromSeconds(30))
        ttl = TimeSpan.FromSeconds(30);

    if (ttl > TimeSpan.FromDays(30))
        ttl = TimeSpan.FromDays(30);

    // 1️⃣ Tenant-scoped key (fast path validation)
    await _db.StringSetAsync(Key(tenantId, shortCode), secureToken, ttl);

    // 2️⃣ Public lookup hash (redirect path)
    var expiryUtc = DateTime.UtcNow.Add(ttl);
    var lookupKey = LookupKey(shortCode);

    var entries = new List<HashEntry>
    {
        new("tenantId", tenantId),
        new("token", secureToken),
        new("expiryUtc", expiryUtc.ToString("O", CultureInfo.InvariantCulture))
    };

    // ✅ Store campaignId if exists
    if (campaignId.HasValue)
    {
        entries.Add(new HashEntry("campaignId", campaignId.Value.ToString()));
    }

    await _db.HashSetAsync(lookupKey, entries.ToArray());
    await _db.KeyExpireAsync(lookupKey, ttl);
}

    public async Task RemoveAsync(string tenantId, string shortCode, CancellationToken ct = default)
    {
        // delete both keys
        await _db.KeyDeleteAsync(Key(tenantId, shortCode));
        await _db.KeyDeleteAsync(LookupKey(shortCode));
    }

    // ✅ NEW method: used by redirect flow
    // public async Task<ShortLinkCacheItem?> GetAsync(string shortCode, CancellationToken ct = default)
    // {
    //     if (string.IsNullOrWhiteSpace(shortCode))
    //         return null;

    //     var key = LookupKey(shortCode);
    //     var values = await _db.HashGetAllAsync(key);

    //     if (values == null || values.Length == 0)
    //         return null;

    //     string? tenantId = null;
    //     string? token = null;
    //     string? expiryStr = null;

    //     foreach (var v in values)
    //     {
    //         var name = v.Name.ToString();
    //         if (name.Equals("tenantId", StringComparison.OrdinalIgnoreCase)) tenantId = v.Value.ToString();
    //         else if (name.Equals("token", StringComparison.OrdinalIgnoreCase)) token = v.Value.ToString();
    //         else if (name.Equals("expiryUtc", StringComparison.OrdinalIgnoreCase)) expiryStr = v.Value.ToString();
    //     }

    //     if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(token))
    //         return null;

    //     DateTime expiryUtc = DateTime.UtcNow.AddMinutes(1);
    //     if (!string.IsNullOrWhiteSpace(expiryStr) &&
    //         DateTime.TryParse(expiryStr, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
    //     {
    //         expiryUtc = parsed.Kind == DateTimeKind.Utc ? parsed : parsed.ToUniversalTime();
    //     }

    //     // safety: treat expired as cache miss
    //     if (expiryUtc <= DateTime.UtcNow)
    //         return null;

    //     return new ShortLinkCacheItem
    //     {
    //         TenantId = tenantId,
    //         SecureToken = token,
    //         ExpiryUtc = expiryUtc
    //     };
    // }
    public async Task<ShortLinkCacheItem?> GetAsync(
    string shortCode,
    CancellationToken ct = default)
{
    if (string.IsNullOrWhiteSpace(shortCode))
        return null;

    var key = LookupKey(shortCode);
    var values = await _db.HashGetAllAsync(key);

    if (values == null || values.Length == 0)
        return null;

    string? tenantId = null;
    string? token = null;
    string? expiryStr = null;
    Guid? campaignId = null;

    foreach (var v in values)
    {
        var name = v.Name.ToString();

        if (name.Equals("tenantId", StringComparison.OrdinalIgnoreCase))
        {
            tenantId = v.Value.ToString();
        }
        else if (name.Equals("token", StringComparison.OrdinalIgnoreCase))
        {
            token = v.Value.ToString();
        }
        else if (name.Equals("expiryUtc", StringComparison.OrdinalIgnoreCase))
        {
            expiryStr = v.Value.ToString();
        }
        else if (name.Equals("campaignId", StringComparison.OrdinalIgnoreCase))
        {
            if (Guid.TryParse(v.Value.ToString(), out var parsedCampaignId))
                campaignId = parsedCampaignId;
        }
    }

    if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(token))
        return null;

    // safety fallback
    DateTime expiryUtc = DateTime.UtcNow.AddMinutes(1);

    if (!string.IsNullOrWhiteSpace(expiryStr) &&
        DateTime.TryParse(
            expiryStr,
            CultureInfo.InvariantCulture,
            DateTimeStyles.RoundtripKind,
            out var parsedExpiry))
    {
        expiryUtc = parsedExpiry.Kind == DateTimeKind.Utc
            ? parsedExpiry
            : parsedExpiry.ToUniversalTime();
    }

    if (expiryUtc <= DateTime.UtcNow)
        return null;

    return new ShortLinkCacheItem
    {
        TenantId = tenantId,
        SecureToken = token,
        ExpiryUtc = expiryUtc,
        CampaignId = campaignId
    };
}
}