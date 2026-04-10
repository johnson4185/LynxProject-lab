namespace Lynx.Api.DTOs.Analytics;

public class RateLimitEventDto
{
    public string Key { get; set; } = "";   // ip or fingerprint
    public long Hits { get; set; }
}