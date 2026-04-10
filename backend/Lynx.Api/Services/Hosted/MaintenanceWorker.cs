using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services.Maintenance;

public class MaintenanceWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MaintenanceWorker> _logger;

    public MaintenanceWorker(IServiceScopeFactory scopeFactory, ILogger<MaintenanceWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var now = DateTime.UtcNow;

                // 1) delete click events older than 90 days
                var cutoff = now.AddDays(-90);
                var deletedClicks = await db.Database.ExecuteSqlRawAsync(
                    "DELETE FROM short_link_click_events WHERE created_at_utc < {0};", cutoff);

                // 2) deactivate expired links (optional but useful)
                var deactivated = await db.Database.ExecuteSqlRawAsync(
                    "UPDATE short_links SET is_active = FALSE WHERE is_active = TRUE AND expiry_utc < {0};", now);

                // 3) remove expired ip blocks
                var deletedBlocks = await db.Database.ExecuteSqlRawAsync(
                    "DELETE FROM tenant_ip_blocks WHERE expires_at_utc IS NOT NULL AND expires_at_utc < {0};", now);

                db.Add(new RetentionJob
                {
                    JobType = "DailyMaintenance",
                    Status = "Success",
                    RecordsDeleted = deletedClicks + deactivated + deletedBlocks,
                    CreatedAtUtc = now
                });

                await db.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("Maintenance done. deletedClicks={deletedClicks}, deactivated={deactivated}, deletedBlocks={deletedBlocks}",
                    deletedClicks, deactivated, deletedBlocks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "MaintenanceWorker failed");
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}