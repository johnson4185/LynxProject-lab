using Lynx.Api.DTOs.ApiKeys;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/admin/v1/tenant/api-keys")]
public class AdminTenantApiKeysController : ControllerBase
{
    private readonly ITenantApiKeyService _svc;
    private readonly ITenantResolver _tenant;

    public AdminTenantApiKeysController(
        ITenantApiKeyService svc,
        ITenantResolver tenant)
    {
        _svc = svc;
        _tenant = tenant;
    }

    // ======================================================
    // CREATE
    // ======================================================

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateApiKeyRequest req,
        CancellationToken ct)
    {
        if (req == null)
            return BadRequest("Request body required.");

        var tenantId = ResolveTenant();
        var actor = User?.Identity?.Name ?? "system";

        var raw = await _svc.CreateAsync(tenantId, req, actor, ct);

        return Ok(new
        {
            apiKey = raw,
            message = "Store securely. This will not be shown again."
        });
    }

    // ======================================================
    // SEARCH
    // ======================================================

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] ApiKeySearchDto dto,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();

        var (data, total) = await _svc.SearchAsync(tenantId, dto, ct);

        return Ok(new
        {
            total,
            dto.Page,
            dto.PageSize,
            data
        });
    }

    // ======================================================
    // REVOKE
    // ======================================================

    [HttpPost("{keyId:guid}/revoke")]
    public async Task<IActionResult> Revoke(
        Guid keyId,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();

        var success = await _svc.RevokeAsync(tenantId, keyId, ct);

        if (!success)
            return NotFound("API key not found.");

        return Ok(new { message = "API key revoked." });
    }

    // ======================================================
    // ENABLE
    // ======================================================

    [HttpPost("{keyId:guid}/enable")]
    public async Task<IActionResult> Enable(
        Guid keyId,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();

        var success = await _svc.EnableAsync(tenantId, keyId, ct);

        if (!success)
            return NotFound("API key not found.");

        return Ok(new { message = "API key enabled." });
    }

    // ======================================================
    // ROTATE
    // ======================================================

    [HttpPost("{keyId:guid}/rotate")]
    public async Task<IActionResult> Rotate(
        Guid keyId,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();

        var raw = await _svc.RotateAsync(tenantId, keyId, ct);

        if (raw == null)
            return NotFound("API key not found.");

        return Ok(new
        {
            newApiKey = raw,
            message = "Store securely. This will not be shown again."
        });
    }

    // ======================================================
    // DELETE
    // ======================================================

    [HttpDelete("{keyId:guid}")]
    public async Task<IActionResult> Delete(
        Guid keyId,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();

        var success = await _svc.DeleteAsync(tenantId, keyId, ct);

        if (!success)
            return NotFound("API key not found.");

        return Ok(new { message = "API key deleted." });
    }

    // ======================================================
    // Helper
    // ======================================================

    private string ResolveTenant()
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);

        if (string.IsNullOrWhiteSpace(tenantId))
            throw new UnauthorizedAccessException("Tenant not resolved.");

        return tenantId;
    }
}