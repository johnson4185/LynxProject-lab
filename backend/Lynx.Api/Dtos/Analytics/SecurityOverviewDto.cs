namespace Lynx.Api.DTOs.Analytics;

public class SecurityOverviewDto
{
    public int LastHours { get; set; }
    public long TotalFailures { get; set; }
    public long RateLimitHits { get; set; }
    public long BotEvents { get; set; }
    public long IpBlockedHits { get; set; }
}