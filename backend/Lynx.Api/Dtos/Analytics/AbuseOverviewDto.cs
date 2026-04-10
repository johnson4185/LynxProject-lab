namespace Lynx.Api.DTOs.Analytics;

public class AbuseOverviewDto
{
    public int LastHours { get; set; }
    public long RateLimitHits { get; set; }
    public long BotEvents { get; set; }
    public long IpBlocks { get; set; }
}