using Lynx.Api.Interfaces;
using Lynx.Api.Services.Redis;

namespace Lynx.Api.Services.Hosted;

public class RedisScriptWarmupHostedService : IHostedService
{
    private readonly IRedisScriptRegistry _registry;

    public RedisScriptWarmupHostedService(IRedisScriptRegistry registry)
        => _registry = registry;

    public async Task StartAsync(CancellationToken cancellationToken)
        => await _registry.EnsureLoadedAsync(cancellationToken);

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}