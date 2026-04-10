using Lynx.Api.Interfaces;
using Lynx.Api.Services.Redis;
using StackExchange.Redis;

namespace Lynx.Api.Services;

public class RedisSlidingWindowRateLimiterHighPerf : IRateLimiter
{
    private readonly IDatabase _db;
    private readonly IRedisScriptRegistry _scripts;

    public RedisSlidingWindowRateLimiterHighPerf(
        IConnectionMultiplexer mux,
        IRedisScriptRegistry scripts)
    {
        _db = mux.GetDatabase();
        _scripts = scripts;
    }

    public async Task<(bool allowed, long currentCount)> AllowAsync(
        string tenantId,
        string routeKey,
        string fingerprint,
        int limit,
        TimeSpan window)
    {
        var key = $"rl:{tenantId}:{routeKey}:{fingerprint}";
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var windowStart = now - (long)window.TotalMilliseconds;
        var ttlSeconds = (int)Math.Ceiling(window.TotalSeconds) + 5;
        var member = $"{now}:{Guid.NewGuid():N}";

        await _scripts.EnsureLoadedAsync();

        RedisResult raw;

        try
        {
            raw = await _scripts.RateLimitScript!.EvaluateAsync(_db, new
            {
                key = (RedisKey)key,
                now,
                windowStart,
                ttlSeconds,
                limit,
                member
            });
        }
        catch (RedisServerException ex) when (ex.Message.Contains("NOSCRIPT"))
        {
            await _scripts.EnsureLoadedAsync();

            raw = await _scripts.RateLimitScript!.EvaluateAsync(_db, new
            {
                key = (RedisKey)key,
                now,
                windowStart,
                ttlSeconds,
                limit,
                member
            });
        }

        var result = (RedisResult[])raw;
        var allowed = (long)result[0] == 1;
        var count = (long)result[1];

        return (allowed, count);
    }
}