using StackExchange.Redis;

namespace Lynx.Api.Interfaces;

public interface IRedisScriptRegistry
{
    LoadedLuaScript? RateLimitScript { get; }
    Task EnsureLoadedAsync(CancellationToken ct = default);
}