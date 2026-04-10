namespace Lynx.Api.Interfaces;

public record TenantSecurityPolicySnapshot(
    int RedirectLimitPerMinute,
    int CreateLimitPerMinute,
    bool AutoBlockEnabled,
    int AutoBlockThreshold,
    int AutoBlockWindowSeconds,
    int AutoBlockTtlSeconds,
    int BotScoreThreshold);

public interface ISecurityPolicyProvider
{
    Task<TenantSecurityPolicySnapshot> GetAsync(string tenantId);
}