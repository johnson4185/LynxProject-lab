namespace Lynx.Api.DTOs.Analytics;

public class QuotaUsageDto
{
    public string TenantId { get; set; } = "";
    public int MonthlyLinksQuota { get; set; }
    public int MonthlyClicksQuota { get; set; }
    public long UsedLinksThisMonth { get; set; }
    public long UsedClicksThisMonth { get; set; }
}