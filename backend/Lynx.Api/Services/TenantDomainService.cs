using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Domains;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services;

public class TenantDomainService : ITenantDomainService
{
    private readonly AppDbContext _db;

    public TenantDomainService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TenantDomainResponse> CreateAsync(string tenantId, CreateTenantDomainRequest req, CancellationToken ct)
    {
        var normalized = DomainNormalizer.Normalize(req.Domain);

        // Strongly recommended: enforce DB unique index on domain
        var exists = await _db.Set<TenantDomain>()
            .AsNoTracking()
            .AnyAsync(x => x.Domain != null && x.Domain == normalized, ct);

        if (exists)
            throw new InvalidOperationException("DOMAIN_ALREADY_REGISTERED");

        var entity = new TenantDomain
        {
            TenantId = tenantId,
            Domain = normalized,
            IsVerified = false,
            SslStatus = string.IsNullOrWhiteSpace(req.SslStatus) ? "pending" : req.SslStatus.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // If you add a UNIQUE constraint later, this becomes the main protection
            throw new InvalidOperationException("DOMAIN_ALREADY_REGISTERED");
        }

        return Map(entity);
    }

    public async Task<PagedResult<TenantDomainResponse>> ListAsync(string tenantId, int page, int pageSize, string? search, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var q = _db.Set<TenantDomain>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            q = q.Where(x => x.Domain != null && x.Domain.ToLower()!.Contains(s));
        }

        var total = await q.LongCountAsync(ct);

        var items = await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new TenantDomainResponse
            {
                Id = x.Id,
                TenantId = x.TenantId,
                Domain = x.Domain ?? "",
                IsVerified = x.IsVerified,
                SslStatus = x.SslStatus,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(ct);

        return new PagedResult<TenantDomainResponse>
        {
            Page = page,
            PageSize = pageSize,
            Total = total,
            Items = items
        };
    }

    public async Task<TenantDomainResponse?> GetByIdAsync(string tenantId, long id, CancellationToken ct)
    {
        var entity = await _db.Set<TenantDomain>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        return entity == null ? null : Map(entity);
    }

    public async Task<TenantDomainResponse?> UpdateAsync(string tenantId, long id, UpdateTenantDomainRequest req, CancellationToken ct)
    {
        var entity = await _db.Set<TenantDomain>()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        if (entity == null) return null;

        if (req.IsVerified.HasValue)
            entity.IsVerified = req.IsVerified.Value;

        if (!string.IsNullOrWhiteSpace(req.SslStatus))
            entity.SslStatus = req.SslStatus.Trim();

        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<TenantDomainResponse?> MarkVerifiedAsync(string tenantId, long id, bool verified, CancellationToken ct)
    {
        var entity = await _db.Set<TenantDomain>()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        if (entity == null) return null;

        entity.IsVerified = verified;
        await _db.SaveChangesAsync(ct);

        return Map(entity);
    }

    public async Task<bool> DeleteAsync(string tenantId, long id, CancellationToken ct)
    {
        var entity = await _db.Set<TenantDomain>()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        if (entity == null) return false;

        _db.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static TenantDomainResponse Map(TenantDomain x) => new()
    {
        Id = x.Id,
        TenantId = x.TenantId,
        Domain = x.Domain ?? "",
        IsVerified = x.IsVerified,
        SslStatus = x.SslStatus,
        CreatedAtUtc = x.CreatedAtUtc
    };
}