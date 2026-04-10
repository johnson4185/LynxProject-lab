using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers.Analytics;

[ApiController]
[Route("api/v1/analytics/system")]
public class SystemAnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _svc;

    public SystemAnalyticsController(IAnalyticsService svc)
    {
        _svc = svc;
    }

    [HttpGet("tenant-usage")]
    public async Task<IActionResult> TenantUsage()
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetTenantUsageAsync(tenantId));
    }

    [HttpGet("quota-usage")]
    public async Task<IActionResult> QuotaUsage()
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetQuotaUsageAsync(tenantId));
    }

    [HttpGet("abuse-overview")]
    public async Task<IActionResult> AbuseOverview([FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetAbuseOverviewAsync(tenantId, lastHours));
    }

    [HttpGet("revenue-usage")]
    public async Task<IActionResult> RevenueUsage()
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetRevenueUsageAsync(tenantId));
    }
}