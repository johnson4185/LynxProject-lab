using Lynx.Api.Interfaces;
using StackExchange.Redis;

namespace Lynx.Api.Services.Usage;

public class RedisUsageMeter : IUsageMeter
{
    private readonly IDatabase _db;

    public RedisUsageMeter(IConnectionMultiplexer mux) => _db = mux.GetDatabase();

    private static int YearMonthUtc()
    {
        var now = DateTime.UtcNow;
        return now.Year * 100 + now.Month; // e.g. 202602
    }

    private static string KeyLinks(string tid, int ym) => $"usage:{tid}:{ym}:links";
    private static string KeyClicks(string tid, int ym) => $"usage:{tid}:{ym}:clicks";
    private static string KeyIndex(int ym) => $"usage:index:{ym}";

    public async Task IncrementLinksAsync(string tenantId, long by = 1)
    {
        var ym = YearMonthUtc();
        await _db.SetAddAsync(KeyIndex(ym), tenantId);
        await _db.StringIncrementAsync(KeyLinks(tenantId, ym), by);
        await _db.KeyExpireAsync(KeyLinks(tenantId, ym), TimeSpan.FromDays(95));
        await _db.KeyExpireAsync(KeyIndex(ym), TimeSpan.FromDays(95));
    }

    public async Task IncrementClicksAsync(string tenantId, long by = 1)
    {
        var ym = YearMonthUtc();
        await _db.SetAddAsync(KeyIndex(ym), tenantId);
        await _db.StringIncrementAsync(KeyClicks(tenantId, ym), by);
        await _db.KeyExpireAsync(KeyClicks(tenantId, ym), TimeSpan.FromDays(95));
        await _db.KeyExpireAsync(KeyIndex(ym), TimeSpan.FromDays(95));
    }
}