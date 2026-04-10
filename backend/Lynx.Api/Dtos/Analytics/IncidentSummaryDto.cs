namespace Lynx.Api.DTOs.Analytics;

public class IncidentSummaryDto
{
    public int LastHours { get; set; }
    public long TotalIncidents { get; set; }
    public Dictionary<string, long> ByType { get; set; } = new();
}