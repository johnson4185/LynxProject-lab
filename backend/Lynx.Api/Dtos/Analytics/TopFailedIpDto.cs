namespace Lynx.Api.DTOs.Analytics;

public class TopFailedIpDto
{
    public string IpAddress { get; set; } = default!;
    public long Failures { get; set; }
}