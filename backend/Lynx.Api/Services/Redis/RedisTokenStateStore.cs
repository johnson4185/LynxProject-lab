using StackExchange.Redis;

public class RedisTokenStateStore : ITokenStateStore
{
    private readonly IDatabase _db;

    public RedisTokenStateStore(IConnectionMultiplexer mux)
    {
        _db = mux.GetDatabase();
    }

    private static string UsedKey(string t, string j) => $"used:{t}:{j}";
    private static string BlKey(string t, string j) => $"bl:{t}:{j}";

    public Task<bool> IsBlacklistedAsync(string tenantId, string jti)
        => _db.KeyExistsAsync(BlKey(tenantId, jti));

    public Task BlacklistAsync(string tenantId, string jti, TimeSpan ttl)
        => _db.StringSetAsync(BlKey(tenantId, jti), "1", ttl);

    public Task<bool> TryMarkUsedAsync(string tenantId, string jti, TimeSpan ttl)
        => _db.StringSetAsync(UsedKey(tenantId, jti), "1", ttl, When.NotExists);
}