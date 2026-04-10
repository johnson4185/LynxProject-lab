using Lynx.Api.DTOs.ApiKeys;

namespace Lynx.Api.Interfaces;
public interface ITenantApiKeyService
{
    Task<string> CreateAsync(
        string tenantId,
        CreateApiKeyRequest req,
        string actor,
        CancellationToken ct);

    Task<(IEnumerable<ApiKeyResponse> data, int total)>
        SearchAsync(string tenantId, ApiKeySearchDto dto, CancellationToken ct);

    Task<bool> RevokeAsync(string tenantId, Guid keyId, CancellationToken ct);

    Task<bool> EnableAsync(string tenantId, Guid keyId, CancellationToken ct);

    Task<bool> DeleteAsync(string tenantId, Guid keyId, CancellationToken ct);

    Task<string?> RotateAsync(string tenantId, Guid keyId, CancellationToken ct);
}