using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/v1/tenants/{tenantId}/configuration")]
public class AdminTenantConfigurationController : ControllerBase
{
    private readonly ITenantConfigurationService _service;
    private readonly ILogger<AdminTenantConfigurationController> _logger;

    public AdminTenantConfigurationController(
        ITenantConfigurationService service,
        ILogger<AdminTenantConfigurationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get(string tenantId)
    {
        var cfg = await _service.GetAsync(tenantId);
        if (cfg == null)
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status404NotFound,
                "TENANT_CONFIG_NOT_FOUND",
                "Tenant configuration not found.");
            return new EmptyResult();
        }

        return Ok(cfg);
    }

    [HttpPost]
    public async Task<IActionResult> Create(string tenantId, [FromBody] CreateTenantConfigurationDto dto)
    {
        var correlationId = CorrelationIdAccessor.Get(HttpContext);

        if (dto == null)
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status400BadRequest,
                "VALIDATION_ERROR",
                "Invalid payload.");
            return new EmptyResult();
        }

        if (!string.Equals(tenantId, dto.TenantId, StringComparison.OrdinalIgnoreCase))
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status400BadRequest,
                "TENANT_ID_MISMATCH",
                "TenantId mismatch between route and body.");
            return new EmptyResult();
        }

        var (ok, error, data) = await _service.CreateAsync(dto);
        if (!ok)
        {
            _logger.LogWarning("Tenant config create failed. Tenant={TenantId}, Error={Error}, CorrelationId={CorrelationId}",
                tenantId, error, correlationId);

            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status409Conflict,
                "TENANT_CONFIG_CREATE_FAILED",
                error ?? "Failed to create tenant configuration.");
            return new EmptyResult();
        }

        return Ok(data);
    }

    [HttpPatch]
    public async Task<IActionResult> Patch(string tenantId, [FromBody] UpdateTenantConfigurationDto dto)
    {
        var (ok, error, data) = await _service.PatchUpdateAsync(tenantId, dto);

        if (!ok)
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status404NotFound,
                "TENANT_CONFIG_UPDATE_FAILED",
                error ?? "Failed to update tenant configuration.");
            return new EmptyResult();
        }

        return Ok(data);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> Profile(string tenantId)
    {
        var profile = await _service.GetProfileAsync(tenantId);
        return Ok(profile);
    }

    [HttpPost("ensure-default")]
    public async Task<IActionResult> EnsureDefault(string tenantId)
    {
        var cfg = await _service.EnsureDefaultAsync(tenantId);
        return Ok(cfg);
    }
}