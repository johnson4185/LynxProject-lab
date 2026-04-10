using System.Security.Cryptography;
using System.Text;
using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

public class ApiKeyService : IApiKeyService
{
    private readonly AppDbContext _db;

    public ApiKeyService(AppDbContext db)
    {
        _db = db;
    }

    // =====================================================
    // CREATE API KEY
    // =====================================================
    public async Task<string> CreateAsync(string tenantId, string name, string scopes)
    {
        var rawKey = "lynx_live_" + Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var hash = Hash(rawKey);

        var entity = new TenantApiKey
        {
            TenantId = tenantId,
            Name = name,
            KeyHash = hash,
            Scopes = scopes,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UsageCount = 0
        };

        _db.Add(entity);
        await _db.SaveChangesAsync();

        return rawKey; // shown once only
    }

    // =====================================================
    // VALIDATE API KEY (Tenant Specific)
    // =====================================================
    public async Task<bool> ValidateAsync(string tenantId, string apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return false;

        var hash = Hash(apiKey);

        var entity = await _db.Set<TenantApiKey>()
            .FirstOrDefaultAsync(x =>
                x.TenantId == tenantId &&
                x.KeyHash == hash &&
                x.IsActive == true &&
                x.RevokedAtUtc == null &&
                (x.ExpiresAtUtc == null || x.ExpiresAtUtc > DateTime.UtcNow));

        if (entity == null)
            return false;

        // Track usage
        entity.LastUsedAtUtc = DateTime.UtcNow;
        entity.UsageCount += 1;

        await _db.SaveChangesAsync();

        return true;
    }

    // =====================================================
    // RESOLVE TENANT FROM API KEY
    // =====================================================
    public async Task<string?> ResolveTenantAsync(string rawKey)
    {
        if (string.IsNullOrWhiteSpace(rawKey))
            return null;

        var hash = Hash(rawKey);

        var entity = await _db.Set<TenantApiKey>()
            .FirstOrDefaultAsync(x =>
                x.KeyHash == hash &&
                x.IsActive == true &&
                x.RevokedAtUtc == null &&
                (x.ExpiresAtUtc == null || x.ExpiresAtUtc > DateTime.UtcNow));

        if (entity == null)
            return null;

        // Track usage
        entity.LastUsedAtUtc = DateTime.UtcNow;
        entity.UsageCount += 1;

        await _db.SaveChangesAsync();

        return entity.TenantId;
    }

    // =====================================================
    // HASH (SHA256)
    // =====================================================
    private static string Hash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}