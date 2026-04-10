using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Text;

public class DbTenantKeyProvider : ITenantKeyProvider
{
    private readonly AppDbContext _db;

    public DbTenantKeyProvider(AppDbContext db)
    {
        _db = db;
    }

    public async Task<SigningKey> GetSigningKeyAsync(string tenantId)
    {
        var key = await _db.Set<TenantHmacKey>()
            .Where(x => x.TenantId == tenantId &&
                        x.IsActive == true &&
                        x.CanSign == true)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync();

        if (key == null)
            throw new Exception($"No signing key for tenant {tenantId}");

        return new SigningKey(
            key.TenantId,
            key.Kid,
            Encoding.UTF8.GetBytes(key.Secret));
    }

    public async Task<byte[]?> GetSecretByKidAsync(string tenantId, string kid)
    {
        var key = await _db.Set<TenantHmacKey>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Kid == kid);

        return key == null ? null : Encoding.UTF8.GetBytes(key.Secret);
    }
}