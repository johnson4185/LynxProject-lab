namespace Lynx.Api.DTOs.Analytics;

public class AnalyticsRangeDto
{
    public int LastHours { get; set; } = 24;
    public string? TenantId { get; set; } // optional filter
}