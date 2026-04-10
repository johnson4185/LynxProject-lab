using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers.Analytics;

[ApiController]
[Route("api/v1/analytics/campaigns")]
public class CampaignAnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _svc;

    public CampaignAnalyticsController(IAnalyticsService svc)
    {
        _svc = svc;
    }

    [HttpGet("{id:guid}/performance")]
    public async Task<IActionResult> Performance(Guid id, [FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetCampaignPerformanceAsync(tenantId, id, lastHours));
    }

    [HttpGet("{id:guid}/conversion-rate")]
    public async Task<IActionResult> ConversionRate(Guid id, [FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetCampaignConversionRateAsync(tenantId, id, lastHours));
    }

    [HttpGet("{id:guid}/top-links")]
    public async Task<IActionResult> TopLinks(Guid id, [FromQuery] int lastHours = 24, [FromQuery] int top = 20)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetCampaignTopLinksAsync(tenantId, id, lastHours, top));
    }
}