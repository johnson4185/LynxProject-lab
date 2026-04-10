using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/v1/links")]
public class LinkActionsController : ControllerBase
{
    private readonly IShortLinkService _shortLinkService;

    public LinkActionsController(IShortLinkService shortLinkService)
        => _shortLinkService = shortLinkService;

    // POST /api/v1/links/{code}/revoke
    [HttpPost("{code}/revoke")]
    public async Task<IActionResult> Revoke(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest("Short code required.");

        var result = await _shortLinkService.RevokeDetailedAsync(HttpContext, code);

        if (!result.Exists)
            return NotFound(new { code = "NOT_FOUND", message = "Short code not found or tenant mismatch." });

        return Ok(new
        {
            shortCode = code,
            revokedNow = result.RevokedNow,
            revokedAtUtc = result.RevokedAtUtc,
            message = result.Message
        });
    }
}