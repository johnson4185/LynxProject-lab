using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Models;

namespace Lynx.Api.Interfaces;

public interface ITenantConfigurationService
{
    
    Task<TenantConfigurationResponseDto?> GetAsync(string tenantId);
    Task<TenantConfigurationResponseDto> EnsureDefaultAsync(string tenantId);

    Task<(bool ok, string? error, TenantConfigurationResponseDto? data)> CreateAsync(CreateTenantConfigurationDto dto);
    Task<(bool ok, string? error, TenantConfigurationResponseDto? data)> PatchUpdateAsync(string tenantId, UpdateTenantConfigurationDto dto);

    Task<TenantProfile> GetProfileAsync(string tenantId);

    // ✅ NEW: entity-level methods for middleware/infrastructure
    Task<TenantConfiguration?> GetEntityAsync(string tenantId);
    Task<TenantConfiguration> EnsureDefaultEntityAsync(string tenantId);
}