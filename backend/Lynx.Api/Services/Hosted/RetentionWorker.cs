using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

public class RetentionWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scope;

    public RetentionWorker(IServiceScopeFactory scope) => _scope = scope;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var s = _scope.CreateScope();
            var db = s.ServiceProvider.GetRequiredService<AppDbContext>();

            var deleted = await db.Database.ExecuteSqlRawAsync(
                "DELETE FROM short_link_click_events WHERE created_at_utc < NOW() - INTERVAL '90 days';");

            db.Add(new RetentionJob
            {
                JobType = "ClickRetention",
                Status = "Success",
                RecordsDeleted = deleted
            });

            await db.SaveChangesAsync();

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}