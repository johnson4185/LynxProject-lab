namespace Lynx.Api.DTOs.Analytics;

public class ConversionDto
{
    public long TotalHits { get; set; }
    public long Conversions { get; set; }
    public decimal ConversionRate { get; set; } // 0..1
}