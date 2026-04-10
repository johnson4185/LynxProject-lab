public interface ITokenStateStore
{
    Task<bool> IsBlacklistedAsync(string tenantId, string jti);
    Task BlacklistAsync(string tenantId, string jti, TimeSpan ttl);
    Task<bool> TryMarkUsedAsync(string tenantId, string jti, TimeSpan ttl);
}