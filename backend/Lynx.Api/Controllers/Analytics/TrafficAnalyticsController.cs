using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers.Analytics;

[ApiController]
[Route("api/v1/analytics/traffic")]
public class TrafficAnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _svc;

    public TrafficAnalyticsController(IAnalyticsService svc)
    {
        _svc = svc;
    }

    // GET /api/v1/analytics/traffic/summary?lastHours=24
    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetTrafficSummaryAsync(tenantId, lastHours));
    }

    // GET /api/v1/analytics/traffic/timeseries?lastHours=24&interval=hour
    [HttpGet("timeseries")]
    public async Task<IActionResult> TimeSeries([FromQuery] int lastHours = 24, [FromQuery] string interval = "hour")
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetTrafficTimeSeriesAsync(tenantId, lastHours, interval));
    }
}