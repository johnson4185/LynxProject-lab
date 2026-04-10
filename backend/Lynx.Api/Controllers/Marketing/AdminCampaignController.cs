using Lynx.Api.DTOs.Campaigns;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/admin/v1/campaigns")]
public class AdminCampaignsController : ControllerBase
{
    private readonly ICampaignService _svc;
    private readonly ITenantResolver _tenant;

    public AdminCampaignsController(ICampaignService svc, ITenantResolver tenant)
    {
        _svc = svc;
        _tenant = tenant;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCampaignDto dto, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var created = await _svc.CreateAsync(tenantId, dto, ct);
        return Ok(created);
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] CampaignSearchDto q, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var result = await _svc.SearchAsync(tenantId, q, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var row = await _svc.GetByIdAsync(tenantId, id, ct);
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCampaignDto dto, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var ok = await _svc.UpdateAsync(tenantId, id, dto, ct);
        return ok ? Ok(new { message = "Updated" }) : NotFound();
    }

    [HttpPost("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] CampaignStatusUpdateDto dto, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var ok = await _svc.ChangeStatusAsync(tenantId, id, dto, ct);
        return ok ? Ok(new { message = "Status updated" }) : NotFound();
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, [FromQuery] string? actor, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var ok = await _svc.ArchiveAsync(tenantId, id, actor, ct);
        return ok ? Ok(new { message = "Archived" }) : NotFound();
    }

    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id, [FromQuery] string? actor, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var ok = await _svc.RestoreAsync(tenantId, id, actor, ct);
        return ok ? Ok(new { message = "Restored" }) : NotFound();
    }

    [HttpPost("{id:guid}/clone")]
    public async Task<IActionResult> Clone(Guid id, [FromBody] CampaignCloneDto dto, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var cloned = await _svc.CloneAsync(tenantId, id, dto, ct);
        return Ok(cloned);
    }

    [HttpGet("{id:guid}/analytics/summary")]
    public async Task<IActionResult> AnalyticsSummary(Guid id, [FromQuery] int lastHours = 24, [FromQuery] int topLinks = 10, CancellationToken ct = default)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var summary = await _svc.GetAnalyticsSummaryAsync(tenantId, id, lastHours, topLinks, ct);
        return Ok(summary);
    }
}