using Lynx.Api.DTOs.Admin;

namespace Lynx.Api.Interfaces;

public interface IAdminLinksService
{
    Task<bool> ActivateAsync(HttpContext context, string shortCode, CancellationToken ct = default);
    Task<(int requested, int revoked)> BulkRevokeAsync(HttpContext context, BulkRevokeDto dto, CancellationToken ct = default);
    Task<(string shortCode, DateTime newExpiryUtc)> ExtendExpiryAsync(HttpContext context, string shortCode, int minutes, CancellationToken ct = default);
    Task<LinkListItemDto?> GetAsync(HttpContext context, string shortCode, CancellationToken ct = default);
    Task<bool> RevokeAsync(HttpContext context, string shortCode, string? reason, CancellationToken ct = default);
    Task<(long total, int page, int pageSize, List<LinkListItemDto> items)> SearchAsync(HttpContext context, LinkSearchDto q, CancellationToken ct = default);
    Task<LinkListItemDto?> UpdateAsync(HttpContext context, string shortCode, UpdateLinkDto dto, CancellationToken ct = default);
}