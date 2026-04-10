using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;

public class SecurityIncidentService : ISecurityIncidentService
{
    private readonly AppDbContext _db;

    public SecurityIncidentService(AppDbContext db) => _db = db;

    public async Task LogAsync(string tenantId, string type, string severity, string ip, string fingerprint, string details)
    {
        _db.Add(new SecurityIncident
        {
            TenantId = tenantId,
            IncidentType = type,
            Severity = severity,
            IpAddress = ip,
            Fingerprint = fingerprint,
            Details = details
        });

        await _db.SaveChangesAsync();
    }
}