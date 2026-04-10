using Lynx.Api.DTOs.TenantWebhooks;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers.Tenant;

[ApiController]
[Route("api/v1/tenant/webhooks")]
public class TenantWebhooksController : ControllerBase
{
    private readonly ITenantWebhookService _service;

    public TenantWebhooksController(ITenantWebhookService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTenantWebhookDto dto)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED",
                "Tenant context missing.");
            return new EmptyResult();
        }

        if (dto == null || string.IsNullOrWhiteSpace(dto.Url))
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status400BadRequest,
                "VALIDATION_ERROR",
                "Url is required.");
            return new EmptyResult();
        }

        var created = await _service.CreateAsync(tenantId, dto);
        return Ok(created);
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED",
                "Tenant context missing.");
            return new EmptyResult();
        }

        var rows = await _service.GetByTenantAsync(tenantId);
        return Ok(rows);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED",
                "Tenant context missing.");
            return new EmptyResult();
        }

        var row = await _service.GetByIdAsync(tenantId, id);
        if (row == null)
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status404NotFound,
                "NOT_FOUND",
                "Webhook not found.");
            return new EmptyResult();
        }

        return Ok(row);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateTenantWebhookDto dto)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED",
                "Tenant context missing.");
            return new EmptyResult();
        }

        var updated = await _service.UpdateAsync(tenantId, id, dto);
        if (updated == null)
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status404NotFound,
                "NOT_FOUND",
                "Webhook not found.");
            return new EmptyResult();
        }

        return Ok(updated);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var tenantId = HttpContext.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED",
                "Tenant context missing.");
            return new EmptyResult();
        }

        var ok = await _service.DeleteAsync(tenantId, id);
        if (!ok)
        {
            await ApiError.WriteAsync(HttpContext,
                StatusCodes.Status404NotFound,
                "NOT_FOUND",
                "Webhook not found.");
            return new EmptyResult();
        }

        return Ok(new { deleted = id });
    }
}