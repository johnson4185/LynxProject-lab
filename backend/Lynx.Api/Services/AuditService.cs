using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services;



public class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(
        HttpContext context,
        string tenantId,
        string eventType,
        bool success,
        string? shortCode = null,
        string? reason = null)
    {
        try
        {
            var correlationId = CorrelationIdAccessor.Get(context);
            var log = new ShortLinkAuditLog
            {
                TenantId = tenantId,
                ShortCode = shortCode,
                EventType = eventType,
                Success = success,
                Reason = reason,
                CorrelationId = correlationId,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.Request.Headers["User-Agent"].ToString(),
                CreatedAtUtc = DateTime.UtcNow
            };

            _db.Set<ShortLinkAuditLog>().Add(log);
            await _db.SaveChangesAsync();
        }
        catch
        {
            // IMPORTANT: Audit must NEVER break main flow
        }
    }
}