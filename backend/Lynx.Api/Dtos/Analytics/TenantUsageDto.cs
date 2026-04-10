namespace Lynx.Api.DTOs.Analytics;

public class TenantUsageDto
{
    public string TenantId { get; set; } = "";
    public long TotalLinks { get; set; }
    public long TotalClicks { get; set; }
    public DateTime AsOfUtc { get; set; }
}