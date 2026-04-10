namespace Lynx.Api.DTOs.Analytics;

public class RevenueUsageDto
{
    public string TenantId { get; set; } = "";
    public string PlanCode { get; set; } = "FREE";
    public decimal EstimatedRevenue { get; set; } // placeholder (hook billing later)
}