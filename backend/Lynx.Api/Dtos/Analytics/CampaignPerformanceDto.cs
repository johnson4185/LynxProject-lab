namespace Lynx.Api.DTOs.Analytics;

public class CampaignPerformanceDto
{
    public Guid CampaignId { get; set; }
    public int LastHours { get; set; }
    public long TotalHits { get; set; }
    public long SuccessfulHits { get; set; }
}