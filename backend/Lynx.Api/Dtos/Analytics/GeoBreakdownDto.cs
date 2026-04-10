namespace Lynx.Api.DTOs.Analytics;

public class GeoBreakdownDto
{
    public string CountryCode { get; set; } = "UNKNOWN";
    public long Hits { get; set; }
}