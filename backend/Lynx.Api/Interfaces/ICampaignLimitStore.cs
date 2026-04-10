namespace Lynx.Api.Interfaces;

public interface ICampaignLimitStore
{
    Task<long> IncrementDailyClicksAsync(string tenantId, Guid campaignId, DateOnly day, long delta, CancellationToken ct);
    Task<long?> GetDailyClicksAsync(string tenantId, Guid campaignId, DateOnly day, CancellationToken ct);
}