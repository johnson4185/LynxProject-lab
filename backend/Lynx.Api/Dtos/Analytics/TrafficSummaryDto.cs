namespace Lynx.Api.DTOs.Analytics;

public class TrafficSummaryDto
{
    public int LastHours { get; set; }
    public long TotalEvents { get; set; }
    public long RedirectSuccess { get; set; }
    public long RedirectFailure { get; set; }
    public long CreateRequests { get; set; }
    public long UniqueIps { get; set; }
}