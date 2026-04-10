using Lynx.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

namespace Lynx.Api.Services.Hosted;

public class UsageFlushHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConnectionMultiplexer _mux;
    private readonly ILogger<UsageFlushHostedService> _logger;

    public UsageFlushHostedService(IServiceScopeFactory scopeFactory, IConnectionMultiplexer mux, ILogger<UsageFlushHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _mux = mux;
        _logger = logger;
    }

    private static int YearMonthUtc()
    {
        var now = DateTime.UtcNow;
        return now.Year * 100 + now.Month;
    }

    private static string KeyLinks(string tid, int ym) => $"usage:{tid}:{ym}:links";
    private static string KeyClicks(string tid, int ym) => $"usage:{tid}:{ym}:clicks";
    private static string KeyIndex(int ym) => $"usage:index:{ym}";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var dbRedis = _mux.GetDatabase();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var ym = YearMonthUtc();
                var indexKey = KeyIndex(ym);

                var tenants = await dbRedis.SetMembersAsync(indexKey);
                if (tenants.Length > 0)
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    foreach (var t in tenants)
                    {
                        var tenantId = t.ToString();

                        var linksVal = await dbRedis.StringGetAsync(KeyLinks(tenantId, ym));
                        var clicksVal = await dbRedis.StringGetAsync(KeyClicks(tenantId, ym));

                        long links = linksVal.HasValue ? (long)linksVal : 0;
                        long clicks = clicksVal.HasValue ? (long)clicksVal : 0;

                        // Upsert (fast & safe)
                        await db.Database.ExecuteSqlInterpolatedAsync($@"
INSERT INTO tenant_usage_monthly (tenant_id, year_month, links_created, clicks, updated_at_utc)
VALUES ({tenantId}, {ym}, {links}, {clicks}, NOW())
ON CONFLICT (tenant_id, year_month)
DO UPDATE SET
  links_created = EXCLUDED.links_created,
  clicks = EXCLUDED.clicks,
  updated_at_utc = NOW();
", stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UsageFlushHostedService failed");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}