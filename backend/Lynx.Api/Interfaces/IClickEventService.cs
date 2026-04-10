namespace Lynx.Api.Interfaces;

public interface IClickEventService
{
    Task LogAsync(
        HttpContext context,
        string tenantId,
        string shortCode,
        bool success,
        string? reason = null);
}