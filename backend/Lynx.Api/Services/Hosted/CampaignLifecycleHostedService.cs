using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services.Hosted;

public class CampaignLifecycleHostedService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<CampaignLifecycleHostedService> _logger;

    public CampaignLifecycleHostedService(IServiceProvider sp, ILogger<CampaignLifecycleHostedService> logger)
    {
        _sp = sp;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var svc = scope.ServiceProvider.GetRequiredService<ICampaignService>();

                // evaluate only active-ish campaigns
                var candidates = await db.Campaigns
                    .AsNoTracking()
                    .Where(x => !x.IsArchived && (x.Status == "Draft" || x.Status == "Active" || x.Status == "Paused"))
                    .Select(x => new { x.TenantId, x.CampaignId })
                    .Take(500) // protect DB
                    .ToListAsync(stoppingToken);

                foreach (var c in candidates)
                    await svc.EvaluateLifecycleAsync(c.TenantId, c.CampaignId, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Campaign lifecycle worker failed.");
            }

            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
        }
    }
}