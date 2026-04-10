namespace Lynx.Api.DTOs.Analytics;

public class AnalyticsSummaryDto
{
    public int TotalEvents { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public Dictionary<string, int> ByEventType { get; set; } = new();
    public Dictionary<string, int> FailureReasonsTop { get; set; } = new();
}