using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers.Analytics;

[ApiController]
[Route("api/v1/analytics")]
[Authorize(Roles = "Admin")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analytics;

    public AnalyticsController(IAnalyticsService analytics)
    {
        _analytics = analytics;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        var data = await _analytics.GetSummaryAsync(lastHours, tenantId!);
        return Ok(data);
    }

    [HttpGet("top-shortcodes")]
    public async Task<IActionResult> TopShortCodes(
        [FromQuery] int lastHours = 24,
        [FromQuery] int top = 10)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        var data = await _analytics.GetTopShortCodesAsync(lastHours, tenantId!, top);
        return Ok(data);
    }

    [HttpGet("top-failed-ips")]
    public async Task<IActionResult> TopFailedIps(
        [FromQuery] int lastHours = 24,
        [FromQuery] int top = 10)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        var data = await _analytics.GetTopFailedIpsAsync(lastHours, tenantId!, top);
        return Ok(data);
    }
}