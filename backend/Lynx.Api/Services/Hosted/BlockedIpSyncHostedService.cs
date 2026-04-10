using Microsoft.EntityFrameworkCore;
using Lynx.Api.Interfaces;
using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;

namespace Lynx.Api.Services.Hosted;

public class BlockedIpSyncHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BlockedIpSyncHostedService> _logger;

    public BlockedIpSyncHostedService(IServiceScopeFactory scopeFactory, ILogger<BlockedIpSyncHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Run immediately, then every 2 minutes
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var cache = scope.ServiceProvider.GetRequiredService<IIPBlockCacheService>();

                // (Optional) if you have tenant registry table, iterate tenants.
                // Here we infer tenants from blocks table.
                var tenants = await db.Set<TenantIpBlock>()
                    .AsNoTracking()
                    .Select(x => x.TenantId)
                    .Distinct()
                    .ToListAsync(stoppingToken);

                foreach (var tid in tenants)
                {
                    await cache.CleanupExpiredIndexAsync(tid);

                    var now = DateTime.UtcNow;
                    var activeBlocks = await db.Set<TenantIpBlock>()
                        .AsNoTracking()
                        .Where(x => x.TenantId == tid && (x.ExpiresAtUtc == null || x.ExpiresAtUtc > now))
                        .ToListAsync(stoppingToken);

                    foreach (var b in activeBlocks)
                    {
                        // TTL: if null expiry → default 30 days
                        var ttl = b.ExpiresAtUtc.HasValue
                            ? b.ExpiresAtUtc.Value - now
                            : TimeSpan.FromDays(30);

                        if (ttl < TimeSpan.FromSeconds(10)) continue;

                        // CIDR or IP?
                        if (b.IpOrCidr.Contains('/'))
                            await cache.BlockCidrAsync(tid, b.IpOrCidr, ttl);
                        else
                            await cache.BlockIpAsync(tid, b.IpOrCidr, ttl);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "BlockedIpSyncHostedService failed");
            }

            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
        }
    }
}