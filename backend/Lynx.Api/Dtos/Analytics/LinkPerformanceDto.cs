namespace Lynx.Api.DTOs.Analytics;

public class LinkPerformanceDto
{
    public string ShortCode { get; set; } = "";
    public int LastHours { get; set; }
    public long TotalHits { get; set; }
    public long SuccessCount { get; set; }
    public long FailureCount { get; set; }
}