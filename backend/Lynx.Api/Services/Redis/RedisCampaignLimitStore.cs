using Lynx.Api.Interfaces;
using StackExchange.Redis;

namespace Lynx.Api.Services.Redis;

public class RedisCampaignLimitStore : ICampaignLimitStore
{
    private readonly IDatabase _db;
    public RedisCampaignLimitStore(IConnectionMultiplexer mux) => _db = mux.GetDatabase();

    private static string Key(string tenantId, Guid campaignId, DateOnly day)
        => $"camp:daily:{tenantId}:{campaignId}:{day:yyyyMMdd}";

    public async Task<long> IncrementDailyClicksAsync(string tenantId, Guid campaignId, DateOnly day, long delta, CancellationToken ct)
    {
        var key = Key(tenantId, campaignId, day);
        var val = await _db.StringIncrementAsync(key, delta);

        // expire after 2 days
        await _db.KeyExpireAsync(key, TimeSpan.FromDays(2));
        return (long)val;
    }

    public async Task<long?> GetDailyClicksAsync(string tenantId, Guid campaignId, DateOnly day, CancellationToken ct)
    {
        var v = await _db.StringGetAsync(Key(tenantId, campaignId, day));
        return v.HasValue ? (long?)v : null;
    }
}