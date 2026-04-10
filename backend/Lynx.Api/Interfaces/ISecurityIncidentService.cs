public interface ISecurityIncidentService
{
    Task LogAsync(string tenantId, string type, string severity, string ip, string fingerprint, string details);
}