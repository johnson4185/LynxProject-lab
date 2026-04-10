using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
public class RedirectController : ControllerBase
{
    private readonly IShortLinkService _shortLinkService;

    public RedirectController(IShortLinkService shortLinkService)
        => _shortLinkService = shortLinkService;

    [HttpGet("r/{code}")]
    public async Task<IActionResult> Go(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest("Short code required.");

        var finalUrl = await _shortLinkService.ResolveAsync(HttpContext, code);

        if (finalUrl == null)
            return NotFound("Invalid, expired, revoked, or blocked.");

        return Redirect(finalUrl);
    }
}