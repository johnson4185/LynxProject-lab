using Lynx.Api.DTOs.TenantWebhooks;

namespace Lynx.Api.Interfaces;

public interface ITenantWebhookService
{
    Task<TenantWebhookResponseDto> CreateAsync(string tenantId, CreateTenantWebhookDto dto);
    Task<List<TenantWebhookResponseDto>> GetByTenantAsync(string tenantId);
    Task<TenantWebhookResponseDto?> GetByIdAsync(string tenantId, long id);
    Task<TenantWebhookResponseDto?> UpdateAsync(string tenantId, long id, UpdateTenantWebhookDto dto);
    Task<bool> DeleteAsync(string tenantId, long id);
}