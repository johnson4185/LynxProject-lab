using System.Security.Cryptography;
using System.Text;
using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.ApiKeys;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

public class TenantApiKeyService : ITenantApiKeyService
{
    private readonly AppDbContext _db;

    public TenantApiKeyService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> CreateAsync(
        string tenantId,
        CreateApiKeyRequest req,
        string actor,
        CancellationToken ct)
    {
        var rawKey = GenerateSecureKey();

        var hash = Hash(rawKey);

        var entity = new TenantApiKey
        {
            TenantId = tenantId,
            KeyHash = hash,
            Name = req.Name,
            Scopes = req.Scopes,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = actor,
            ExpiresAtUtc = req.ExpiresAtUtc,
            RateLimitPerMinute = req.RateLimitPerMinute
        };

        _db.Add(entity);
        await _db.SaveChangesAsync(ct);

        return rawKey;
    }

    public async Task<(IEnumerable<ApiKeyResponse>, int)>
        SearchAsync(string tenantId, ApiKeySearchDto dto, CancellationToken ct)
    {
        var query = _db.Set<TenantApiKey>()
            .Where(x => x.TenantId == tenantId)
            .AsNoTracking();

        if (dto.IsActive.HasValue)
            query = query.Where(x => x.IsActive == dto.IsActive);

        var total = await query.CountAsync(ct);

        var rows = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((dto.Page - 1) * dto.PageSize)
            .Take(dto.PageSize)
            .Select(x => new ApiKeyResponse(
                x.KeyId,
                x.Name!,
                x.Scopes,
                x.IsActive ?? false,
                x.UsageCount ?? 0,
                x.LastUsedAtUtc,
                x.ExpiresAtUtc,
                x.CreatedAtUtc ?? DateTime.UtcNow,
                x.RateLimitPerMinute
            ))
            .ToListAsync(ct);

        return (rows, total);
    }

    public async Task<bool> RevokeAsync(string tenantId, Guid keyId, CancellationToken ct)
    {
        var entity = await _db.Set<TenantApiKey>()
            .FirstOrDefaultAsync(x => x.KeyId == keyId && x.TenantId == tenantId, ct);

        if (entity == null) return false;

        entity.IsActive = false;
        entity.RevokedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> EnableAsync(string tenantId, Guid keyId, CancellationToken ct)
    {
        var entity = await _db.Set<TenantApiKey>()
            .FirstOrDefaultAsync(x => x.KeyId == keyId && x.TenantId == tenantId, ct);

        if (entity == null) return false;

        entity.IsActive = true;
        entity.RevokedAtUtc = null;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(string tenantId, Guid keyId, CancellationToken ct)
    {
        var entity = await _db.Set<TenantApiKey>()
            .FirstOrDefaultAsync(x => x.KeyId == keyId && x.TenantId == tenantId, ct);

        if (entity == null) return false;

        _db.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<string?> RotateAsync(string tenantId, Guid keyId, CancellationToken ct)
    {
        var entity = await _db.Set<TenantApiKey>()
            .FirstOrDefaultAsync(x => x.KeyId == keyId && x.TenantId == tenantId, ct);

        if (entity == null) return null;

        var newRaw = GenerateSecureKey();
        entity.KeyHash = Hash(newRaw);
        entity.UsageCount = 0;
        entity.LastUsedAtUtc = null;

        await _db.SaveChangesAsync(ct);

        return newRaw;
    }

    private static string GenerateSecureKey()
        => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    private static string Hash(string raw)
        => Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
}