namespace Lynx.Api.DTOs.Analytics;

public class TopShortCodeDto
{
    public string ShortCode { get; set; } = default!;
    public long Hits { get; set; }
}