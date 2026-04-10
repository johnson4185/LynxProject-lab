using Lynx.Api.DTOs.Domains;

namespace Lynx.Api.Interfaces;

public interface ITenantDomainService
{
    Task<TenantDomainResponse> CreateAsync(string tenantId, CreateTenantDomainRequest req, CancellationToken ct);
    Task<PagedResult<TenantDomainResponse>> ListAsync(string tenantId, int page, int pageSize, string? search, CancellationToken ct);
    Task<TenantDomainResponse?> GetByIdAsync(string tenantId, long id, CancellationToken ct);
    Task<TenantDomainResponse?> UpdateAsync(string tenantId, long id, UpdateTenantDomainRequest req, CancellationToken ct);
    Task<bool> DeleteAsync(string tenantId, long id, CancellationToken ct);

    // Enterprise flow: explicit verification action
    Task<TenantDomainResponse?> MarkVerifiedAsync(string tenantId, long id, bool verified, CancellationToken ct);
}