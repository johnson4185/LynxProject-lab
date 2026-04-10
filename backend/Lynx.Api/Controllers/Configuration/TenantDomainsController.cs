using Lynx.Api.DTOs.Domains;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/v1/tenant/domains")]
public class TenantDomainsController : ControllerBase
{
    private readonly ITenantDomainService _service;
    private readonly ILogger<TenantDomainsController> _logger;

    public TenantDomainsController(
        ITenantDomainService service,
        ILogger<TenantDomainsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTenantDomainRequest req, CancellationToken ct)
    {
        var correlationId = CorrelationIdAccessor.Get(HttpContext);

        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED", "Tenant context missing.");
            return new EmptyResult();
        }

        try
        {
            var created = await _service.CreateAsync(tenantId, req, ct);
            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status400BadRequest,
                "INVALID_DOMAIN", ex.Message);
            return new EmptyResult();
        }
        catch (InvalidOperationException ex) when (ex.Message == "DOMAIN_ALREADY_REGISTERED")
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status409Conflict,
                "DOMAIN_ALREADY_REGISTERED", "Domain already registered.");
            return new EmptyResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Create domain failed. Tenant={TenantId}, CorrelationId={CorrelationId}", tenantId, correlationId);
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status500InternalServerError,
                "DOMAIN_CREATE_FAILED", "Failed to create domain.");
            return new EmptyResult();
        }
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED", "Tenant context missing.");
            return new EmptyResult();
        }

        var data = await _service.ListAsync(tenantId, page, pageSize, search, ct);
        return Ok(data);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken ct)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED", "Tenant context missing.");
            return new EmptyResult();
        }

        var row = await _service.GetByIdAsync(tenantId, id, ct);
        if (row == null)
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status404NotFound,
                "DOMAIN_NOT_FOUND", "Domain not found.");
            return new EmptyResult();
        }

        return Ok(row);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateTenantDomainRequest req, CancellationToken ct)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED", "Tenant context missing.");
            return new EmptyResult();
        }

        var updated = await _service.UpdateAsync(tenantId, id, req, ct);
        if (updated == null)
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status404NotFound,
                "DOMAIN_NOT_FOUND", "Domain not found.");
            return new EmptyResult();
        }

        return Ok(updated);
    }

    // Enterprise: explicit verification action
    [HttpPost("{id:long}/verify")]
    public async Task<IActionResult> Verify(long id, [FromQuery] bool verified = true, CancellationToken ct = default)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED", "Tenant context missing.");
            return new EmptyResult();
        }

        var updated = await _service.MarkVerifiedAsync(tenantId, id, verified, ct);
        if (updated == null)
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status404NotFound,
                "DOMAIN_NOT_FOUND", "Domain not found.");
            return new EmptyResult();
        }

        return Ok(updated);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED", "Tenant context missing.");
            return new EmptyResult();
        }

        var ok = await _service.DeleteAsync(tenantId, id, ct);
        if (!ok)
        {
            await ApiError.WriteAsync(HttpContext, StatusCodes.Status404NotFound,
                "DOMAIN_NOT_FOUND", "Domain not found.");
            return new EmptyResult();
        }

        return Ok(new { deleted = id });
    }
}