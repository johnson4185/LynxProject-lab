using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/v1/tenant/configuration")]
public class TenantConfigurationController : ControllerBase
{
    private readonly ITenantConfigurationService _service;

    public TenantConfigurationController(ITenantConfigurationService service)
    {
        _service = service;
    }

    // GET /api/v1/tenant/configuration
    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        if (!HttpContext.Items.TryGetValue("TenantId", out var obj) || obj is not string tenantId || string.IsNullOrWhiteSpace(tenantId))
        {
            return ApiErrorResult.TenantMissing();
        }

        // SaaS-safe: ensure exists
        var config = await _service.GetAsync(tenantId)
                     ?? await _service.EnsureDefaultAsync(tenantId);

        return Ok(config);
    }

    // PATCH /api/v1/tenant/configuration
    [HttpPatch]
    public async Task<IActionResult> PatchMine([FromBody] UpdateTenantConfigurationDto dto)
    {
        if (dto == null)
            return BadRequest("Invalid payload.");

        if (!HttpContext.Items.TryGetValue("TenantId", out var obj) || obj is not string tenantId || string.IsNullOrWhiteSpace(tenantId))
        {
            return ApiErrorResult.TenantMissing();
        }

        try
        {
            var updated = await _service.PatchUpdateAsync(tenantId, dto);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            // should be rare if EnsureDefault exists elsewhere, but safe
            return NotFound();
        }
    }

    // GET /api/v1/tenant/configuration/profile
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        if (!HttpContext.Items.TryGetValue("TenantId", out var obj) || obj is not string tenantId || string.IsNullOrWhiteSpace(tenantId))
        {
            return ApiErrorResult.TenantMissing();
        }

        var profile = await _service.GetProfileAsync(tenantId);
        return Ok(profile);
    }
}

/// <summary>
/// Small helper to return consistent API error format using your ApiError writer.
/// This avoids repeating ApiError.WriteAsync(...) in every controller.
/// </summary>
internal static class ApiErrorResult
{
    public static ObjectResult TenantMissing()
        => new ObjectResult(new
        {
            success = false,
            status = StatusCodes.Status400BadRequest,
            error = new { code = "TENANT_REQUIRED", message = "Tenant context missing." }
        })
        { StatusCode = StatusCodes.Status400BadRequest };
}