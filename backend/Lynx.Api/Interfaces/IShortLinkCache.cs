namespace Lynx.Api.Interfaces;



public interface IShortLinkCache
{
    Task<string?> GetSecureTokenAsync(string tenantId, string shortCode, CancellationToken ct = default);
    // Task SetSecureTokenAsync(string tenantId, string shortCode, string secureToken, TimeSpan ttl, CancellationToken ct = default);
   Task SetSecureTokenAsync(
    string tenantId,
    string shortCode,
    string secureToken,
    TimeSpan ttl,
    Guid? campaignId = null, // ✅ NEW optional param
    CancellationToken ct = default);
    Task RemoveAsync(string tenantId, string shortCode, CancellationToken ct = default);

    // ✅ NEW: for redirect path (no tenant header)
    Task<ShortLinkCacheItem?> GetAsync(string shortCode, CancellationToken ct = default);
}