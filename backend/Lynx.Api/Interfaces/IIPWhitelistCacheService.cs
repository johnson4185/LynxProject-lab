namespace Lynx.Api.Interfaces;

public interface IIPWhitelistCacheService
{
    Task<bool> IsWhitelistedAsync(string tenantId, string ip);
    Task AddWhitelistAsync(string tenantId, string ipOrCidr, DateTime? expiresAtUtc);
    Task RemoveWhitelistAsync(string tenantId, string ipOrCidr);

    Task<IReadOnlyList<(string kind, string value, DateTime expiresUtc)>>
        GetActiveWhitelistAsync(string tenantId, int top = 200);

    Task CleanupExpiredIndexAsync(string tenantId);
}