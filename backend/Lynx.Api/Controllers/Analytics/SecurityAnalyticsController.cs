using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers.Analytics;

[ApiController]
[Route("api/v1/analytics/security")]
public class SecurityAnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _svc;

    public SecurityAnalyticsController(IAnalyticsService svc)
    {
        _svc = svc;
    }

    // GET /api/v1/analytics/security/overview?lastHours=24
    [HttpGet("overview")]
    public async Task<IActionResult> Overview([FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetSecurityOverviewAsync(tenantId, lastHours));
    }

    [HttpGet("blocked-ips")]
    public async Task<IActionResult> BlockedIps([FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetBlockedIpsAsync(tenantId, lastHours));
    }

    [HttpGet("rate-limit-events")]
    public async Task<IActionResult> RateLimitEvents([FromQuery] int lastHours = 24, [FromQuery] int top = 20)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetRateLimitEventsAsync(tenantId, lastHours, top));
    }

    [HttpGet("bot-activity")]
    public async Task<IActionResult> BotActivity([FromQuery] int lastHours = 24, [FromQuery] int top = 20)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetBotActivityAsync(tenantId, lastHours, top));
    }

    [HttpGet("api-key-usage")]
    public async Task<IActionResult> ApiKeyUsage([FromQuery] int lastHours = 24, [FromQuery] int top = 20)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetApiKeyUsageAsync(tenantId, lastHours, top));
    }

    [HttpGet("incident-summary")]
    public async Task<IActionResult> IncidentSummary([FromQuery] int lastHours = 24)
    {
        var tenantId = HttpContext.Items["TenantId"]!.ToString()!;
        return Ok(await _svc.GetIncidentSummaryAsync(tenantId, lastHours));
    }
}