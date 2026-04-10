using System.Net;
using System.Text.RegularExpressions;
using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Security;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services;

public class SecurityAdminService : ISecurityAdminService
{
    private readonly AppDbContext _db;
    private readonly IIPBlockCacheService _blockCache;
    private readonly IIPWhitelistCacheService _whitelistCache;

    public SecurityAdminService(
        AppDbContext db,
        IIPBlockCacheService blockCache,
        IIPWhitelistCacheService whitelistCache)
    {
        _db = db;
        _blockCache = blockCache;
        _whitelistCache = whitelistCache;
    }

    // ======================================================
    // BLOCKS
    // ======================================================

    public async Task<List<TenantIpBlock>> ListBlocksAsync(string tenantId, CancellationToken ct)
    {
        return await _db.Set<TenantIpBlock>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(ct);
    }

    public async Task<object> UpsertBlockAsync(string tenantId, CreateIpBlockDto dto, CancellationToken ct)
    {
        var ip = dto.IpOrCidr.Trim();
        if (!IsValidIpOrCidr(ip))
            throw new InvalidOperationException("Invalid IP or CIDR.");

        var now = DateTime.UtcNow;

        var existing = await _db.Set<TenantIpBlock>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.IpOrCidr == ip, ct);

        if (existing != null)
        {
            existing.Reason = dto.Reason ?? existing.Reason;
            existing.ExpiresAtUtc = dto.ExpiresAtUtc ?? existing.ExpiresAtUtc;

            await _db.SaveChangesAsync(ct);
            await _blockCache.AddBlockAsync(tenantId, ip, existing.ExpiresAtUtc);

            return new { message = "Block updated", existing };
        }

        var entity = new TenantIpBlock
        {
            TenantId = tenantId,
            IpOrCidr = ip,
            Reason = dto.Reason,
            CreatedAtUtc = now,
            ExpiresAtUtc = dto.ExpiresAtUtc
        };

        _db.Add(entity);
        await _db.SaveChangesAsync(ct);

        await _blockCache.AddBlockAsync(tenantId, ip, dto.ExpiresAtUtc);

        return new { message = "Block created", entity };
    }

    public async Task<bool> DeleteBlockAsync(string tenantId, long id, CancellationToken ct)
    {
        var row = await _db.Set<TenantIpBlock>()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        if (row == null)
            return false;

        await _blockCache.RemoveBlockAsync(tenantId, row.IpOrCidr!);

        _db.Remove(row);
        await _db.SaveChangesAsync(ct);

        return true;
    }

    public async Task<object> BulkBlockAsync(string tenantId, List<CreateIpBlockDto> blocks, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var normalized = blocks
            .Where(b => !string.IsNullOrWhiteSpace(b.IpOrCidr))
            .Select(b => new CreateIpBlockDto
            {
                IpOrCidr = b.IpOrCidr.Trim(),
                Reason = b.Reason,
                ExpiresAtUtc = b.ExpiresAtUtc
            })
            .Where(b => IsValidIpOrCidr(b.IpOrCidr))
            .ToList();

        var ips = normalized.Select(x => x.IpOrCidr).Distinct().ToList();

        var existing = await _db.Set<TenantIpBlock>()
            .Where(x => x.TenantId == tenantId && ips.Contains(x.IpOrCidr!))
            .ToListAsync(ct);

        var existingMap = existing.ToDictionary(x => x.IpOrCidr!);

        int created = 0, updated = 0;

        foreach (var b in normalized)
        {
            if (existingMap.TryGetValue(b.IpOrCidr, out var existingRow))
            {
                existingRow.Reason = b.Reason ?? existingRow.Reason;
                existingRow.ExpiresAtUtc = b.ExpiresAtUtc ?? existingRow.ExpiresAtUtc;
                updated++;

                await _blockCache.AddBlockAsync(tenantId, b.IpOrCidr, existingRow.ExpiresAtUtc);
            }
            else
            {
                var entity = new TenantIpBlock
                {
                    TenantId = tenantId,
                    IpOrCidr = b.IpOrCidr,
                    Reason = b.Reason,
                    CreatedAtUtc = now,
                    ExpiresAtUtc = b.ExpiresAtUtc
                };

                _db.Add(entity);
                created++;

                await _blockCache.AddBlockAsync(tenantId, b.IpOrCidr, b.ExpiresAtUtc);
            }
        }

        await _db.SaveChangesAsync(ct);

        return new { created, updated };
    }

    // ======================================================
    // WHITELIST
    // ======================================================

    public async Task<object> UpsertWhitelistAsync(string tenantId, CreateIpWhitelistDto dto, CancellationToken ct)
    {
        var ip = dto.IpOrCidr.Trim();
        if (!IsValidIpOrCidr(ip))
            throw new InvalidOperationException("Invalid IP or CIDR.");

        var now = DateTime.UtcNow;

        var existing = await _db.Set<TenantIpWhitelist>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.IpOrCidr == ip, ct);

        if (existing != null)
        {
            existing.Reason = dto.Reason ?? existing.Reason;
            existing.ExpiresAtUtc = dto.ExpiresAtUtc ?? existing.ExpiresAtUtc;
            existing.UpdatedAtUtc = now;
            existing.UpdatedBy = dto.Actor;

            await _db.SaveChangesAsync(ct);
            await _whitelistCache.AddWhitelistAsync(tenantId, ip, existing.ExpiresAtUtc);

            return new { message = "Whitelist updated", existing };
        }

        var entity = new TenantIpWhitelist
        {
            TenantId = tenantId,
            IpOrCidr = ip,
            Reason = dto.Reason,
            ExpiresAtUtc = dto.ExpiresAtUtc,
            CreatedAtUtc = now,
            CreatedBy = dto.Actor
        };

        _db.Add(entity);
        await _db.SaveChangesAsync(ct);

        await _whitelistCache.AddWhitelistAsync(tenantId, ip, dto.ExpiresAtUtc);

        return new { message = "Whitelisted", entity };
    }

    public async Task<bool> DeleteWhitelistAsync(string tenantId, long id, CancellationToken ct)
    {
        var row = await _db.Set<TenantIpWhitelist>()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        if (row == null)
            return false;

        await _whitelistCache.RemoveWhitelistAsync(tenantId, row.IpOrCidr!);

        _db.Remove(row);
        await _db.SaveChangesAsync(ct);

        return true;
    }

    // ======================================================
    // SUSPICIOUS IPS
    // ======================================================

    public async Task<List<SuspiciousIpDto>> GetSuspiciousIpsAsync(
        string tenantId,
        int lastHours,
        int top,
        CancellationToken ct)
    {
        var fromUtc = DateTime.UtcNow.AddHours(-Math.Clamp(lastHours, 1, 720));

        var data = await _db.Set<ShortLinkClickEvent>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && !x.Success && x.CreatedAtUtc >= fromUtc)
            .GroupBy(x => x.IpAddress)
            .Select(g => new SuspiciousIpDto(
                g.Key!,
                g.LongCount(),
                g.Max(x => x.CreatedAtUtc)))
            .OrderByDescending(x => x.Failures)
            .Take(Math.Clamp(top, 1, 200))
            .ToListAsync(ct);

        return data;
    }

    private static bool IsValidIpOrCidr(string input)
    {
        if (IPAddress.TryParse(input, out _))
            return true;

        return Regex.IsMatch(input, @"^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$");
    }

    public Task<object> SearchBlocksAsync(string tenantId, IpRuleSearchDto dto, CancellationToken ct)
    {
        throw new NotImplementedException();
    }

    public Task<object> SearchWhitelistAsync(string tenantId, IpRuleSearchDto dto, CancellationToken ct)
    {
        throw new NotImplementedException();
    }
    // ======================================================
    // SECURITY INCIDENTS
    // ======================================================

    public async Task<object> GetSecurityIncidentsAsync(
        string tenantId,
        int page,
        int pageSize,
        string? severity,
        string? type,
        CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var q = _db.Set<SecurityIncident>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(severity))
            q = q.Where(x => x.Severity == severity);

        if (!string.IsNullOrWhiteSpace(type))
            q = q.Where(x => x.IncidentType == type);

        var total = await q.LongCountAsync(ct);

        var data = await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new
        {
            total,
            page,
            pageSize,
            data
        };
    }

    public async Task<long> DeleteSecurityIncidentAsync(
        string tenantId,
        long id,
        CancellationToken ct)
    {
        var row = await _db.Set<SecurityIncident>()
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        if (row == null)
            return 0;

        _db.Remove(row);
        await _db.SaveChangesAsync(ct);

        return id;
    }
}