using Lynx.Api.DTOs.Retention;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/admin/v1/retention")]
public class AdminRetentionController : ControllerBase
{
    private readonly IRetentionService _svc;
    private readonly ITenantResolver _tenant;

    public AdminRetentionController(
        IRetentionService svc,
        ITenantResolver tenant)
    {
        _svc = svc;
        _tenant = tenant;
    }

    [HttpPost("trigger")]
    public async Task<IActionResult> Trigger(
        [FromBody] TriggerRetentionDto dto,
        CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var result = await _svc.TriggerAsync(tenantId, dto, ct);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] RetentionSearchDto dto,
        CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var (data, total) = await _svc.SearchAsync(tenantId, dto, ct);

        return Ok(new
        {
            total,
            dto.Page,
            dto.PageSize,
            data
        });
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Get(long id, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var result = await _svc.GetByIdAsync(tenantId, id, ct);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:long}/retry")]
    public async Task<IActionResult> Retry(long id, CancellationToken ct)
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);
        var ok = await _svc.RetryAsync(tenantId, id, ct);
        return ok ? Ok(new { message = "Job requeued." }) : NotFound();
    }
}