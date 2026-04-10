// using Lynx.Api.DTOs;
// using Lynx.Api.Interfaces;
// using Lynx.Api.Services;
// using Microsoft.AspNetCore.Mvc;

// namespace Lynx.Api.Controllers;

// [ApiController]
// [Route("api/hmac")]
// public class HmacController : ControllerBase
// {
//     private readonly IHmacTokenService _hmacService;
//     private readonly ITenantResolver _tenantResolver;

//     public HmacController(
//         IHmacTokenService hmacService,
//         ITenantResolver tenantResolver)
//     {
//         _hmacService = hmacService;
//         _tenantResolver = tenantResolver;
//     }

//     // ======================================================
//     // GENERATE LONG SECURE HMAC LINK
//     // ======================================================
//     [HttpPost("generate")]
//     public async Task<IActionResult> Generate([FromBody] GenerateRequestDto request)
//     {
//         if (request == null || string.IsNullOrWhiteSpace(request.FinalUrl))
//             return BadRequest("FinalUrl is required.");

//         var (allowed, reason) = await SsrfUrlGuard.IsAllowedAsync(request.FinalUrl);
//         if (!allowed)
//             return BadRequest($"FinalUrl blocked: {reason}");

//         var tenantId = _tenantResolver.ResolveTenantId(HttpContext);

//         var expiryUtc = DateTime.UtcNow.AddMinutes(
//             request.ExpiryMinutes <= 0 ? 10 : request.ExpiryMinutes);

//         var token = await _hmacService.GenerateTokenAsync(
//             tenantId,
//             request.FinalUrl,
//             expiryUtc,
//             request.OneTimeUse);

//         var secureUrl =
//             $"{Request.Scheme}://{Request.Host}/api/hmac/go?token={token}";

//         return Ok(new
//         {
//             tenantId,
//             secureUrl,
//             expiresUtc = expiryUtc,
//             oneTimeUse = request.OneTimeUse
//         });
//     }

//     // ======================================================
//     // VALIDATE & REDIRECT LONG SECURE LINK
//     // ======================================================
//     [HttpGet("go")]
//     public async Task<IActionResult> Go([FromQuery] string token)
//     {
//         if (string.IsNullOrWhiteSpace(token))
//             return BadRequest("Token required.");

//         var finalUrl =
//             await _hmacService.ValidateAndExtractUrlAsync(HttpContext, token);

//         if (finalUrl == null)
//             return Unauthorized("Invalid, expired, revoked, blacklisted, or already-used token.");

//         return Redirect(finalUrl);
//     }

//     // ======================================================
//     // VALIDATE TOKEN (API MODE)
//     // ======================================================
//     [HttpPost("validate")]
//     public async Task<IActionResult> Validate([FromBody] HmacValidateRequestDto request)
//     {
//         if (request == null || string.IsNullOrWhiteSpace(request.Token))
//             return BadRequest("Token is required.");

//         var url = await _hmacService
//             .ValidateAndExtractUrlAsync(HttpContext, request.Token);

//         if (url == null)
//             return Unauthorized("Invalid, expired, blacklisted, or reused token.");

//         return Ok(new
//         {
//             valid = true,
//             url
//         });
//     }

//     // ======================================================
//     // PARSE TOKEN PAYLOAD (DEBUG ONLY)
//     // ======================================================
//     [HttpPost("inspect")]
//     public IActionResult Inspect([FromBody] HmacValidateRequestDto request)
//     {
//         if (request == null || string.IsNullOrWhiteSpace(request.Token))
//             return BadRequest("Token is required.");

//         if (!_hmacService.TryParsePayload(request.Token, out var payload))
//             return BadRequest("Invalid token format.");

//         return Ok(payload);
//     }
// }
using Lynx.Api.DTOs;
using Lynx.Api.Interfaces;
using Lynx.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/v1/hmac")]
//[EnableRateLimiting("public-hmac")] // optional if you configured rate limiting
public class HmacController : ControllerBase
{
    private readonly IHmacTokenService _hmacService;
    private readonly ITenantResolver _tenantResolver;
    private readonly IIPBlockCacheService _blockCache;
    private readonly IIPWhitelistCacheService _whitelistCache;

    public HmacController(
        IHmacTokenService hmacService,
        ITenantResolver tenantResolver,
        IIPBlockCacheService blockCache,
        IIPWhitelistCacheService whitelistCache)
    {
        _hmacService = hmacService;
        _tenantResolver = tenantResolver;
        _blockCache = blockCache;
        _whitelistCache = whitelistCache;
    }

    // ======================================================
    // GENERATE LONG SECURE HMAC LINK
    // ======================================================
    //[Authorize(Policy = "TenantApiUser")] // secure generation
    [HttpPost("generate")]
    public async Task<IActionResult> Generate(
        [FromBody] GenerateRequestDto request,
        CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.FinalUrl))
            return BadRequest("FinalUrl is required.");

        var tenantId = ResolveTenant();

        // SSRF Protection
        var (allowed, reason) = await SsrfUrlGuard.IsAllowedAsync(request.FinalUrl);
        if (!allowed)
            return BadRequest($"FinalUrl blocked: {reason}");

        // Cap expiry to prevent abuse (max 60 mins)
        var minutes = request.ExpiryMinutes <= 0
            ? 10
            : Math.Min(request.ExpiryMinutes, 60);

        var expiryUtc = DateTime.UtcNow.AddMinutes(minutes);

        var token = await _hmacService.GenerateTokenAsync(
            tenantId,
            request.FinalUrl,
            expiryUtc,
            request.OneTimeUse);

        var secureUrl =
            $"{Request.Scheme}://{Request.Host}/api/hmac/v1/go?token={token}";

        return Ok(new
        {
            tenantId,
            secureUrl,
            expiresUtc = expiryUtc,
            expiresInMinutes = minutes,
            oneTimeUse = request.OneTimeUse
        });
    }

    // ======================================================
    // VALIDATE & REDIRECT LONG SECURE LINK
    // ======================================================
    [AllowAnonymous]
    [HttpGet("go")]
    public async Task<IActionResult> Go(
        [FromQuery] string token,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest("Token required.");

        var tenantId = ResolveTenantSafe();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        // 🔥 IP Security Integration
        if (!string.IsNullOrWhiteSpace(ip))
        {
            // whitelist override
            if (!await _whitelistCache.IsWhitelistedAsync(tenantId, ip))
            {
                if (await _blockCache.IsBlockedAsync(tenantId, ip))
                    return Unauthorized("Access blocked.");
            }
        }

        var finalUrl =
            await _hmacService.ValidateAndExtractUrlAsync(HttpContext, token);

        if (finalUrl == null)
            return Unauthorized("Invalid, expired, revoked, blacklisted, or already-used token.");

        return Redirect(finalUrl);
    }

    // ======================================================
    // VALIDATE TOKEN (API MODE)
    // ======================================================
    [AllowAnonymous]
    [HttpPost("validate")]
    public async Task<IActionResult> Validate(
        [FromBody] HmacValidateRequestDto request,
        CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Token))
            return BadRequest("Token is required.");

        var url = await _hmacService
            .ValidateAndExtractUrlAsync(HttpContext, request.Token);

        if (url == null)
            return Unauthorized("Invalid, expired, blacklisted, or reused token.");

        return Ok(new
        {
            valid = true,
            url
        });
    }

#if DEBUG
    // ======================================================
    // PARSE TOKEN PAYLOAD (DEBUG ONLY)
    // ======================================================
    [HttpPost("inspect")]
    public IActionResult Inspect(
        [FromBody] HmacValidateRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Token))
            return BadRequest("Token is required.");

        if (!_hmacService.TryParsePayload(request.Token, out var payload))
            return BadRequest("Invalid token format.");

        return Ok(payload);
    }
#endif

    // ======================================================
    // Helpers
    // ======================================================

    private string ResolveTenant()
    {
        var tenantId = _tenantResolver.ResolveTenantId(HttpContext);

        if (string.IsNullOrWhiteSpace(tenantId))
            throw new UnauthorizedAccessException("Tenant not resolved.");

        return tenantId;
    }

    private string ResolveTenantSafe()
    {
        return _tenantResolver.ResolveTenantId(HttpContext) ?? "unknown";
    }
}