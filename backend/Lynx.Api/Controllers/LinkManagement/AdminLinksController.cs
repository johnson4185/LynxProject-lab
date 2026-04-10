using Lynx.Api.DTOs.Admin;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/admin/v1/links")]
public class AdminLinksController : ControllerBase
{
    private readonly IAdminLinksService _svc;

    public AdminLinksController(IAdminLinksService svc) => _svc = svc;

    private async Task<IActionResult> ApiErrorResult(int status, string code, string message)
    {
        await ApiError.WriteAsync(HttpContext, status, code, message);
        return new EmptyResult();
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] LinkSearchDto q, CancellationToken ct)
    {
        try
        {
            var (total, page, pageSize, items) = await _svc.SearchAsync(HttpContext, q, ct);
            return Ok(new { total, page, pageSize, items });
        }
        catch (UnauthorizedAccessException)
        {
            return await ApiErrorResult(
                StatusCodes.Status401Unauthorized,
                "TENANT_REQUIRED",
                "Tenant not resolved. Provide X-Tenant-Id header.");
        }
    }

    [HttpGet("{shortCode}")]
    public async Task<IActionResult> Details(string shortCode, CancellationToken ct)
    {
        try
        {
            var row = await _svc.GetAsync(HttpContext, shortCode, ct);
            if (row == null) return NotFound("Short link not found.");
            return Ok(row);
        }
        catch (UnauthorizedAccessException)
        {
            return await ApiErrorResult(
                StatusCodes.Status401Unauthorized,
                "TENANT_REQUIRED",
                "Tenant not resolved. Provide X-Tenant-Id header.");
        }
    }

    [HttpPut("{shortCode}")]
    public async Task<IActionResult> Update(string shortCode, [FromBody] UpdateLinkDto dto, CancellationToken ct)
    {
        if (dto == null) return BadRequest("Invalid payload.");

        try
        {
            var updated = await _svc.UpdateAsync(HttpContext, shortCode, dto, ct);
            if (updated == null) return NotFound("Short link not found.");
            return Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return await ApiErrorResult(
                StatusCodes.Status401Unauthorized,
                "TENANT_REQUIRED",
                "Tenant not resolved. Provide X-Tenant-Id header.");
        }
    }

    [HttpPost("{shortCode}/extend-expiry")]
    public async Task<IActionResult> ExtendExpiry(string shortCode, [FromBody] ExtendExpiryDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _svc.ExtendExpiryAsync(HttpContext, shortCode, dto.Minutes, ct);
            return Ok(new { result.shortCode, result.newExpiryUtc });
        }
        catch (UnauthorizedAccessException)
        {
            return await ApiErrorResult(
                StatusCodes.Status401Unauthorized,
                "TENANT_REQUIRED",
                "Tenant not resolved. Provide X-Tenant-Id header.");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Short link not found.");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{shortCode}/revoke")]
    public async Task<IActionResult> Revoke(string shortCode, [FromBody] RevokeLinkDto? dto, CancellationToken ct)
    {
        try
        {
            var ok = await _svc.RevokeAsync(HttpContext, shortCode, dto?.Reason, ct);
            if (!ok) return NotFound("Short link not found.");
            return Ok(new { shortCode, message = "Link revoked." });
        }
        catch (UnauthorizedAccessException)
        {
            return await ApiErrorResult(
                StatusCodes.Status401Unauthorized,
                "TENANT_REQUIRED",
                "Tenant not resolved. Provide X-Tenant-Id header.");
        }
    }

    [HttpPost("{shortCode}/activate")]
    public async Task<IActionResult> Activate(string shortCode, CancellationToken ct)
    {
        try
        {
            var ok = await _svc.ActivateAsync(HttpContext, shortCode, ct);
            if (!ok) return NotFound("Short link not found.");
            return Ok(new { shortCode, message = "Link activated." });
        }
        catch (UnauthorizedAccessException)
        {
            return await ApiErrorResult(
                StatusCodes.Status401Unauthorized,
                "TENANT_REQUIRED",
                "Tenant not resolved. Provide X-Tenant-Id header.");
        }
    }

    [HttpPost("bulk/revoke")]
    public async Task<IActionResult> BulkRevoke([FromBody] BulkRevokeDto dto, CancellationToken ct)
    {
        if (dto == null) return BadRequest("Invalid payload.");

        try
        {
            var (requested, revoked) = await _svc.BulkRevokeAsync(HttpContext, dto, ct);
            return Ok(new { requested, revoked });
        }
        catch (UnauthorizedAccessException)
        {
            return await ApiErrorResult(
                StatusCodes.Status401Unauthorized,
                "TENANT_REQUIRED",
                "Tenant not resolved. Provide X-Tenant-Id header.");
        }
    }
}