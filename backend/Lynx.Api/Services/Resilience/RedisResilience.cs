using Lynx.Api.Interfaces;

namespace Lynx.Api.Services.Resilience;

public class RedisResilience : IRedisResilience
{
    private readonly SimpleCircuitBreaker _breaker =
        new(failureThreshold: 5, openDuration: TimeSpan.FromSeconds(15));

    public bool IsRedisOpen() => _breaker.IsOpen();
    public void RedisSuccess() => _breaker.OnSuccess();
    public void RedisFailure() => _breaker.OnFailure();
}