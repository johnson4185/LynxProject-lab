using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        HttpContext context,
        string tenantId,
        string eventType,
        bool success,
        string? shortCode = null,
        string? reason = null);
}