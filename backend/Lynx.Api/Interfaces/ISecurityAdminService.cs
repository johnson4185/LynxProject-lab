using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Security;

namespace Lynx.Api.Interfaces;

public interface ISecurityAdminService
{
    Task<List<TenantIpBlock>> ListBlocksAsync(string tenantId, CancellationToken ct);
    Task<object> UpsertBlockAsync(string tenantId, CreateIpBlockDto dto, CancellationToken ct);
    Task<bool> DeleteBlockAsync(string tenantId, long id, CancellationToken ct);
    Task<object> SearchBlocksAsync(string tenantId, IpRuleSearchDto dto, CancellationToken ct);
    Task<object> BulkBlockAsync(string tenantId, List<CreateIpBlockDto> blocks, CancellationToken ct);

    Task<object> SearchWhitelistAsync(string tenantId, IpRuleSearchDto dto, CancellationToken ct);
    Task<object> UpsertWhitelistAsync(string tenantId, CreateIpWhitelistDto dto, CancellationToken ct);
    Task<bool> DeleteWhitelistAsync(string tenantId, long id, CancellationToken ct);

    Task<List<SuspiciousIpDto>> GetSuspiciousIpsAsync(string tenantId, int lastHours, int top, CancellationToken ct);
    Task<object> GetSecurityIncidentsAsync(
    string tenantId,
    int page,
    int pageSize,
    string? severity,
    string? type,
    CancellationToken ct);

    Task<long> DeleteSecurityIncidentAsync(
        string tenantId,
        long id,
        CancellationToken ct);
}