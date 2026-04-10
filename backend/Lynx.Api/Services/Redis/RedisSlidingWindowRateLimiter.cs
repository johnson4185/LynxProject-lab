using Lynx.Api.Interfaces;
using StackExchange.Redis;

namespace Lynx.Api.Services;

public class RedisSlidingWindowRateLimiter : IRateLimiter
{
    private readonly IDatabase _redis;

    public RedisSlidingWindowRateLimiter(IConnectionMultiplexer mux)
        => _redis = mux.GetDatabase();

    private static readonly string Script = @"
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowStart = tonumber(ARGV[2])
local ttlSeconds = tonumber(ARGV[3])
local limit = tonumber(ARGV[4])
local member = ARGV[5]

redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
redis.call('ZADD', key, now, member)
local count = redis.call('ZCARD', key)
redis.call('EXPIRE', key, ttlSeconds)

if count > limit then
  return {0, count}
else
  return {1, count}
end
";

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

        var result = (RedisResult[])await _redis.ScriptEvaluateAsync(
            Script,
            keys: new RedisKey[] { key },
            values: new RedisValue[] { now, windowStart, ttlSeconds, limit, member });

        var allowed = (long)result[0] == 1;
        var count = (long)result[1];

        return (allowed, count);
    }
}