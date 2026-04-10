// using Lynx.Api.Interfaces;
// using StackExchange.Redis;

// namespace Lynx.Api.Services.Redis;

// public class RedisScriptRegistry : IRedisScriptRegistry
// {
//     private readonly IConnectionMultiplexer _mux;
//     private readonly SemaphoreSlim _lock = new(1, 1);

//     public LoadedLuaScript? RateLimitScript { get; private set; }

//     // IMPORTANT: Same script as your sliding window (atomic)
//     private static readonly LuaScript RateLimitLua = LuaScript.Prepare(@"
// local key = KEYS[1]
// local now = tonumber(ARGV[1])
// local windowStart = tonumber(ARGV[2])
// local ttlSeconds = tonumber(ARGV[3])
// local limit = tonumber(ARGV[4])
// local member = ARGV[5]

// redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
// redis.call('ZADD', key, now, member)
// local count = redis.call('ZCARD', key)
// redis.call('EXPIRE', key, ttlSeconds)

// if count > limit then
//   return {0, count}
// else
//   return {1, count}
// end
// ");

//     public RedisScriptRegistry(IConnectionMultiplexer mux) => _mux = mux;

//     public async Task EnsureLoadedAsync(CancellationToken ct = default)
//     {
//         if (RateLimitScript != null) return;

//         await _lock.WaitAsync(ct);
//         try
//         {
//             if (RateLimitScript != null) return;

//             // Load into ALL endpoints (cluster-safe)
//             foreach (var ep in _mux.GetEndPoints())
//             {
//                 var server = _mux.GetServer(ep);
//                 if (!server.IsConnected) continue;

//                 // This returns LoadedLuaScript (holds SHA)
//                 RateLimitScript = await RateLimitLua.LoadAsync(server);
//             }

//             // If no server connected, keep null and we’ll fallback at runtime
//         }
//         finally
//         {
//             _lock.Release();
//         }
//     }
// }
using Lynx.Api.Interfaces;
using StackExchange.Redis;

namespace Lynx.Api.Services.Redis;

public class RedisScriptRegistry : IRedisScriptRegistry
{
    private readonly IConnectionMultiplexer _mux;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public LoadedLuaScript? RateLimitScript { get; private set; }

    private static readonly LuaScript RateLimitLua = LuaScript.Prepare(@"
local key = @key
local now = tonumber(@now)
local windowStart = tonumber(@windowStart)
local ttlSeconds = tonumber(@ttlSeconds)
local limit = tonumber(@limit)
local member = @member

redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
redis.call('ZADD', key, now, member)
local count = redis.call('ZCARD', key)
redis.call('EXPIRE', key, ttlSeconds)

if count > limit then
  return {0, count}
else
  return {1, count}
end
");

    public RedisScriptRegistry(IConnectionMultiplexer mux)
        => _mux = mux;

    public async Task EnsureLoadedAsync(CancellationToken ct = default)
    {
        if (RateLimitScript != null) return;

        await _lock.WaitAsync(ct);
        try
        {
            if (RateLimitScript != null) return;

            foreach (var ep in _mux.GetEndPoints())
            {
                var server = _mux.GetServer(ep);
                if (!server.IsConnected) continue;

                RateLimitScript = await RateLimitLua.LoadAsync(server);
            }
        }
        finally
        {
            _lock.Release();
        }
    }
}