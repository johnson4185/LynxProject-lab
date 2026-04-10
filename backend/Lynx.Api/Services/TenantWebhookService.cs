using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.TenantWebhooks;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services;

public class TenantWebhookService : ITenantWebhookService
{
    private readonly AppDbContext _db;

    public TenantWebhookService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TenantWebhookResponseDto> CreateAsync(string tenantId, CreateTenantWebhookDto dto)
    {
        var entity = new TenantWebhook
        {
            TenantId = tenantId,
            Url = dto.Url.Trim(),
            IsActive = dto.IsActive,
            Secret = string.IsNullOrWhiteSpace(dto.Secret) ? null : dto.Secret.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Add(entity);
        await _db.SaveChangesAsync();

        return Map(entity);
    }

    public async Task<List<TenantWebhookResponseDto>> GetByTenantAsync(string tenantId)
    {
        var rows = await _db.Set<TenantWebhook>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync();

        return rows.Select(Map).ToList();
    }

    public async Task<TenantWebhookResponseDto?> GetByIdAsync(string tenantId, long id)
    {
        var entity = await _db.Set<TenantWebhook>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);

        return entity == null ? null : Map(entity);
    }

    public async Task<TenantWebhookResponseDto?> UpdateAsync(string tenantId, long id, UpdateTenantWebhookDto dto)
    {
        var entity = await _db.Set<TenantWebhook>()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);

        if (entity == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.Url))
            entity.Url = dto.Url.Trim();

        if (dto.IsActive.HasValue)
            entity.IsActive = dto.IsActive.Value;

        if (dto.Secret != null) // allow clearing secret by sending ""
            entity.Secret = string.IsNullOrWhiteSpace(dto.Secret) ? null : dto.Secret.Trim();

        await _db.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<bool> DeleteAsync(string tenantId, long id)
    {
        var entity = await _db.Set<TenantWebhook>()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);

        if (entity == null) return false;

        _db.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    private static TenantWebhookResponseDto Map(TenantWebhook x) => new()
    {
        Id = x.Id,
        TenantId = x.TenantId,
        Url = x.Url,
        //IsActive = x.IsActive,
        Secret = x.Secret,
        CreatedAtUtc = x.CreatedAtUtc
    };
}