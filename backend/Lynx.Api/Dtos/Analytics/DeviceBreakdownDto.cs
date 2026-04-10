namespace Lynx.Api.DTOs.Analytics;

public class DeviceBreakdownDto
{
    public string DeviceType { get; set; } = "UNKNOWN";
    public long Hits { get; set; }
}