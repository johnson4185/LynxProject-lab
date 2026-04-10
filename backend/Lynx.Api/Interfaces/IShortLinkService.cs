using Microsoft.AspNetCore.Http;

namespace Lynx.Api.Interfaces;

public record RevokeResult(
    bool Exists,
    bool RevokedNow,
    DateTime? RevokedAtUtc,
    string? Message = null
);

public interface IShortLinkService
{
    Task<string> CreateAsync(
        HttpContext context,
        string finalUrl,
        int expiryMinutes,
        bool oneTimeUse);

    Task<string?> ResolveAsync(
        HttpContext context,
        string shortCode);

    /// <summary>
    /// Backward-compatible revoke (returns false if not found or tenant mismatch).
    /// </summary>
    Task<bool> RevokeAsync(
        HttpContext context,
        string shortCode);

    /// <summary>
    /// Enterprise/idempotent revoke: returns "Exists=true" even if already revoked.
    /// </summary>
    Task<RevokeResult> RevokeDetailedAsync(
        HttpContext context,
        string shortCode);
}