using Lynx.Api.Domain.Entities;
using Lynx.Api.Models;

namespace Lynx.Api.Interfaces;

public interface ITenantSettingsService
{
    Task<TenantSetting?> GetAsync(string tenantId);
    Task UpdateAsync(string tenantId, TenantSetting setting);
    Task<TenantProfile> GetProfileAsync(string tenantId);
}