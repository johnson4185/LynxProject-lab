namespace Lynx.Api.DTOs.Analytics;

public class BlockedIpDto
{
    public string IpAddress { get; set; } = "";
    public long BlockCount { get; set; }
}