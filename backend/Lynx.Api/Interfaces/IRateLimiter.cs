namespace Lynx.Api.Interfaces;

public interface IRateLimiter
{
    Task<(bool allowed, long currentCount)> AllowAsync(
        string tenantId,
        string routeKey,
        string fingerprint,
        int limit,
        TimeSpan window);
}