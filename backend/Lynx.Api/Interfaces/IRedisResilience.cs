namespace Lynx.Api.Interfaces;

public interface IRedisResilience
{
    bool IsRedisOpen(); // circuit open?
    void RedisSuccess();
    void RedisFailure();
}