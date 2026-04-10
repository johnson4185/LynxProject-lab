using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers.Analytics;

[ApiController]
[Route("api/v1/analytics/links")]
public class LinkAnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _svc;

    public LinkAnalyticsController(IAnalyticsService svc)
    {
        _svc = svc;
    }

    [HttpGet("{shortCode}/performance")]
    public async Task<IActionResult> Performance(string shortCode, [FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetLinkPerformanceAsync(tenantId, shortCode, lastHours));
    }

    [HttpGet("{shortCode}/timeseries")]
    public async Task<IActionResult> TimeSeries(string shortCode, [FromQuery] int lastHours = 24, [FromQuery] string interval = "hour")
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetLinkTimeSeriesAsync(tenantId, shortCode, lastHours, interval));
    }

    [HttpGet("{shortCode}/geo")]
    public async Task<IActionResult> Geo(string shortCode, [FromQuery] int lastHours = 24, [FromQuery] int top = 20)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetLinkGeoAsync(tenantId, shortCode, lastHours, top));
    }

    [HttpGet("{shortCode}/devices")]
    public async Task<IActionResult> Devices(string shortCode, [FromQuery] int lastHours = 24, [FromQuery] int top = 20)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetLinkDevicesAsync(tenantId, shortCode, lastHours, top));
    }

    [HttpGet("{shortCode}/conversion")]
    public async Task<IActionResult> Conversion(string shortCode, [FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetLinkConversionAsync(tenantId, shortCode, lastHours));
    }
}