// namespace Lynx.Api.Interfaces;

// public interface IIPBlockCacheService
// {
//     Task<bool> IsBlockedAsync(string tenantId, string ip);
//     Task BlockAsync(string tenantId, string ip, TimeSpan ttl);
// }
namespace Lynx.Api.Interfaces;

public interface IIPBlockCacheService
{
    Task<bool> IsBlockedAsync(string tenantId, string ip);
   Task BlockIpAsync(string tenantId, string ip, TimeSpan ttl);
   Task BlockCidrAsync(string tenantId, string cidr, TimeSpan ttl);

 Task AddBlockAsync(string tenantId, string ipOrCidr, DateTime? expiresAtUtc);
    Task RemoveBlockAsync(string tenantId, string ipOrCidr);
    // dashboard helpers
    Task<IReadOnlyList<(string kind, string value, DateTime expiresUtc)>> GetActiveBlocksAsync(string tenantId, int top = 200);
    Task CleanupExpiredIndexAsync(string tenantId);
}