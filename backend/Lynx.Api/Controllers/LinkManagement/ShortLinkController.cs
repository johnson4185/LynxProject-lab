using Lynx.Api.DTOs;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/v1/short-links")]
public class ShortLinkController : ControllerBase
{
    private readonly IShortLinkService _shortLinkService;
    private readonly ILogger<ShortLinkController> _logger;

    public ShortLinkController(
        IShortLinkService shortLinkService,
        ILogger<ShortLinkController> logger)
    {
        _shortLinkService = shortLinkService;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ShortLinkCreateResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] GenerateRequestDto request,
        CancellationToken ct)
    {
        if (request == null)
            return BadRequest("Invalid payload.");

        if (string.IsNullOrWhiteSpace(request.FinalUrl))
            return BadRequest("FinalUrl is required.");

        var finalUrl = request.FinalUrl.Trim();

        // Guardrails (service also validates; this is fast-fail + UX)
        var expiryMinutes = request.ExpiryMinutes <= 0 ? 10 : request.ExpiryMinutes;
        expiryMinutes = Math.Clamp(expiryMinutes, 1, 60 * 24 * 30); // 1 min .. 30 days

        // Create
        var shortCode = await _shortLinkService.CreateAsync(
            HttpContext,
            finalUrl,
            expiryMinutes,
            request.OneTimeUse);

        // Proxy-safe base URL
        var scheme = Request.Headers.TryGetValue("X-Forwarded-Proto", out var xfProto)
            ? xfProto.ToString()
            : Request.Scheme;

        var host = Request.Headers.TryGetValue("X-Forwarded-Host", out var xfHost)
            ? xfHost.ToString()
            : Request.Host.Value;

        var shortUrl = $"{scheme}://{host}/r/{shortCode}";

        // Helpful debugging header (optional)
        if (HttpContext.TraceIdentifier is { Length: > 0 } traceId)
            Response.Headers["X-Trace-Id"] = traceId;

        var response = new ShortLinkCreateResponseDto
        {
            ShortCode = shortCode,
            ShortUrl = shortUrl,
            OneTimeUse = request.OneTimeUse,
            ExpiryMinutes = expiryMinutes
        };

        // 201 + Location header
        return Created($"/r/{shortCode}", response);
    }
}

public class ShortLinkCreateResponseDto
{
    public string ShortCode { get; set; } = default!;
    public string ShortUrl { get; set; } = default!;
    public bool OneTimeUse { get; set; }
    public int ExpiryMinutes { get; set; }
}