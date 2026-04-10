// using System.Net;
// using System.Text.RegularExpressions;
// using Lynx.Api.Domain.Entities;
// using Lynx.Api.DTOs.Security;
// using Lynx.Api.Infrastructure;
// using Lynx.Api.Interfaces;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;

// namespace Lynx.Api.Controllers;

// [ApiController]
// [Route("api/admin/security")]
// public class AdminSecurityController : ControllerBase
// {
//     private readonly AppDbContext _db;
//     private readonly ITenantResolver _tenant;
//     private readonly IIPBlockCacheService _blockCache;
//     private readonly IIPWhitelistCacheService _whitelistCache;

//     public AdminSecurityController(
//         AppDbContext db,
//         ITenantResolver tenant,
//         IIPBlockCacheService blockCache,
//         IIPWhitelistCacheService whitelistCache)
//     {
//         _db = db;
//         _tenant = tenant;
//         _blockCache = blockCache;
//         _whitelistCache = whitelistCache;
//     }

//     // ======================================================
//     // IP BLOCKS (Existing endpoints - keep)
//     // ======================================================
//     [HttpGet("ip-blocks")]
//     public async Task<IActionResult> ListIpBlocks(CancellationToken ct)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         var rows = await _db.Set<TenantIpBlock>()
//             .AsNoTracking()
//             .Where(x => x.TenantId == tenantId)
//             .OrderByDescending(x => x.CreatedAtUtc)
//             .ToListAsync(ct);

//         return Ok(rows);
//     }

//     [HttpPost("ip-blocks")]
//     public async Task<IActionResult> CreateIpBlock([FromBody] CreateIpBlockDto dto, CancellationToken ct)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         if (dto == null || string.IsNullOrWhiteSpace(dto.IpOrCidr))
//             return BadRequest("IpOrCidr is required.");

//         var ip = dto.IpOrCidr.Trim();

//         if (!IsValidIpOrCidr(ip))
//             return BadRequest("Invalid IP or CIDR.");

//         // ✅ if whitelisted, you may want to reject or warn
//         // (enterprise safe default: block is allowed but whitelist overrides at runtime)
//         // up to you. We'll allow it.

//         var existing = await _db.Set<TenantIpBlock>()
//             .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.IpOrCidr == ip, ct);

//         if (existing != null)
//         {
//             existing.Reason = dto.Reason ?? existing.Reason;
//             existing.ExpiresAtUtc = dto.ExpiresAtUtc ?? existing.ExpiresAtUtc;

//             await _db.SaveChangesAsync(ct);
//             await _blockCache.AddBlockAsync(tenantId, ip, existing.ExpiresAtUtc);

//             return Ok(new { message = "Block updated", existing });
//         }

//         var entity = new TenantIpBlock
//         {
//             TenantId = tenantId,
//             IpOrCidr = ip,
//             Reason = dto.Reason,
//             CreatedAtUtc = DateTime.UtcNow,
//             ExpiresAtUtc = dto.ExpiresAtUtc
//         };

//         _db.Add(entity);
//         await _db.SaveChangesAsync(ct);

//         await _blockCache.AddBlockAsync(tenantId, ip, dto.ExpiresAtUtc);

//         return Ok(new { message = "Block created", entity });
//     }

//     [HttpDelete("ip-blocks/{id:long}")]
//     public async Task<IActionResult> DeleteIpBlock(long id, CancellationToken ct)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         var row = await _db.Set<TenantIpBlock>()
//             .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

//         if (row == null)
//             return NotFound("IP block not found.");

//         var ipOrCidr = row.IpOrCidr?.Trim();

//         if (!string.IsNullOrWhiteSpace(ipOrCidr))
//             await _blockCache.RemoveBlockAsync(tenantId, ipOrCidr);

//         _db.Remove(row);
//         await _db.SaveChangesAsync(ct);

//         return Ok(new { message = "IP block removed successfully.", deletedId = id });
//     }

//     // ======================================================
//     // IP BLOCKS - SEARCH (Enterprise)
//     // GET /api/admin/security/ip-blocks/search?page=1&pageSize=50&activeOnly=true&ipOrCidr=1.2
//     // ======================================================
//     [HttpGet("ip-blocks/search")]
//     public async Task<IActionResult> SearchIpBlocks([FromQuery] IpRuleSearchDto dto, CancellationToken ct)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         var page = Math.Max(1, dto.Page);
//         var pageSize = Math.Clamp(dto.PageSize, 1, 200);

//         var q = _db.Set<TenantIpBlock>()
//             .AsNoTracking()
//             .Where(x => x.TenantId == tenantId);

//         if (!string.IsNullOrWhiteSpace(dto.IpOrCidr))
//             q = q.Where(x => x.IpOrCidr!.Contains(dto.IpOrCidr.Trim()));

//         if (dto.ActiveOnly == true)
//         {
//             var now = DateTime.UtcNow;
//             q = q.Where(x => x.ExpiresAtUtc == null || x.ExpiresAtUtc > now);
//         }

//         var total = await q.LongCountAsync(ct);

//         var rows = await q
//             .OrderByDescending(x => x.CreatedAtUtc)
//             .Skip((page - 1) * pageSize)
//             .Take(pageSize)
//             .ToListAsync(ct);

//         return Ok(new { total, page, pageSize, data = rows });
//     }

//     // ======================================================
//     // IP BLOCKS - BULK (Enterprise)
//     // POST /api/admin/security/ip-blocks/bulk
//     // ======================================================
//     [HttpPost("ip-blocks/bulk")]
//     public async Task<IActionResult> BulkBlock([FromBody] List<CreateIpBlockDto> blocks, CancellationToken ct)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         if (blocks == null || blocks.Count == 0)
//             return BadRequest("No blocks provided.");

//         var now = DateTime.UtcNow;

//         var normalized = blocks
//             .Where(b => b != null && !string.IsNullOrWhiteSpace(b.IpOrCidr))
//             .Select(b => new CreateIpBlockDto
//             {
//                 IpOrCidr = b.IpOrCidr.Trim(),
//                 Reason = b.Reason,
//                 ExpiresAtUtc = b.ExpiresAtUtc
//             })
//             .Where(b => IsValidIpOrCidr(b.IpOrCidr))
//             .ToList();

//         if (normalized.Count == 0)
//             return BadRequest("No valid IP/CIDR entries.");

//         var ips = normalized.Select(x => x.IpOrCidr).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

//         var existing = await _db.Set<TenantIpBlock>()
//             .Where(x => x.TenantId == tenantId && ips.Contains(x.IpOrCidr!))
//             .ToListAsync(ct);

//         var existingMap = existing.ToDictionary(x => x.IpOrCidr!, StringComparer.OrdinalIgnoreCase);

//         int created = 0, updated = 0;

//         foreach (var b in normalized)
//         {
//             if (existingMap.TryGetValue(b.IpOrCidr, out var row))
//             {
//                 row.Reason = b.Reason ?? row.Reason;
//                 row.ExpiresAtUtc = b.ExpiresAtUtc ?? row.ExpiresAtUtc;
//                 updated++;

//                 await _blockCache.AddBlockAsync(tenantId, b.IpOrCidr, row.ExpiresAtUtc);
//             }
//             else
//             {
//                 var newEntity = new TenantIpBlock
//                 {
//                     TenantId = tenantId,
//                     IpOrCidr = b.IpOrCidr,
//                     Reason = b.Reason,
//                     CreatedAtUtc = now,
//                     ExpiresAtUtc = b.ExpiresAtUtc
//                 };
//                 _db.Add(newEntity);
//                 created++;

//                 await _blockCache.AddBlockAsync(tenantId, b.IpOrCidr, b.ExpiresAtUtc);
//             }
//         }

//         await _db.SaveChangesAsync(ct);

//         return Ok(new { created, updated, requested = ips.Count });
//     }

//     // ======================================================
//     // WHITELIST - LIST/SEARCH
//     // GET /api/admin/security/whitelist
//     // ======================================================
//     [HttpGet("whitelist")]
//     public async Task<IActionResult> SearchWhitelist([FromQuery] IpRuleSearchDto dto, CancellationToken ct)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         var page = Math.Max(1, dto.Page);
//         var pageSize = Math.Clamp(dto.PageSize, 1, 200);

//         var q = _db.Set<TenantIpWhitelist>()
//             .AsNoTracking()
//             .Where(x => x.TenantId == tenantId);

//         if (!string.IsNullOrWhiteSpace(dto.IpOrCidr))
//             q = q.Where(x => x.IpOrCidr.Contains(dto.IpOrCidr.Trim()));

//         if (dto.ActiveOnly == true)
//         {
//             var now = DateTime.UtcNow;
//             q = q.Where(x => x.ExpiresAtUtc == null || x.ExpiresAtUtc > now);
//         }

//         var total = await q.LongCountAsync(ct);

//         var rows = await q
//             .OrderByDescending(x => x.CreatedAtUtc)
//             .Skip((page - 1) * pageSize)
//             .Take(pageSize)
//             .ToListAsync(ct);

//         return Ok(new { total, page, pageSize, data = rows });
//     }

//     // ======================================================
//     // WHITELIST - CREATE/UPSERT
//     // POST /api/admin/security/whitelist
//     // ======================================================
//     [HttpPost("whitelist")]
//     public async Task<IActionResult> UpsertWhitelist([FromBody] CreateIpWhitelistDto dto, CancellationToken ct)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         if (dto == null || string.IsNullOrWhiteSpace(dto.IpOrCidr))
//             return BadRequest("IpOrCidr is required.");

//         var ip = dto.IpOrCidr.Trim();

//         if (!IsValidIpOrCidr(ip))
//             return BadRequest("Invalid IP or CIDR.");

//         var now = DateTime.UtcNow;

//         var existing = await _db.Set<TenantIpWhitelist>()
//             .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.IpOrCidr == ip, ct);

//         if (existing != null)
//         {
//             existing.Reason = dto.Reason ?? existing.Reason;
//             existing.ExpiresAtUtc = dto.ExpiresAtUtc ?? existing.ExpiresAtUtc;
//             existing.UpdatedAtUtc = now;
//             existing.UpdatedBy = dto.Actor;

//             await _db.SaveChangesAsync(ct);
//             await _whitelistCache.AddWhitelistAsync(tenantId, ip, existing.ExpiresAtUtc);

//             return Ok(new { message = "Whitelist updated", existing });
//         }

//         var entity = new TenantIpWhitelist
//         {
//             TenantId = tenantId,
//             IpOrCidr = ip,
//             Reason = dto.Reason,
//             ExpiresAtUtc = dto.ExpiresAtUtc,
//             CreatedAtUtc = now,
//             CreatedBy = dto.Actor
//         };

//         _db.Add(entity);
//         await _db.SaveChangesAsync(ct);

//         await _whitelistCache.AddWhitelistAsync(tenantId, ip, dto.ExpiresAtUtc);

//         return Ok(new { message = "Whitelisted", entity });
//     }

//     // ======================================================
//     // WHITELIST - DELETE
//     // DELETE /api/admin/security/whitelist/{id}
//     // ======================================================
//     [HttpDelete("whitelist/{id:long}")]
//     public async Task<IActionResult> DeleteWhitelist(long id, CancellationToken ct)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         var row = await _db.Set<TenantIpWhitelist>()
//             .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

//         if (row == null)
//             return NotFound("Whitelist entry not found.");

//         var ipOrCidr = row.IpOrCidr.Trim();

//         await _whitelistCache.RemoveWhitelistAsync(tenantId, ipOrCidr);

//         _db.Remove(row);
//         await _db.SaveChangesAsync(ct);

//         return Ok(new { message = "Whitelist removed", deletedId = id });
//     }

//     // ======================================================
//     // Suspicious IPs (based on failed redirects)
//     // GET /api/admin/security/suspicious-ips?lastHours=24&top=20
//     // ======================================================
//     [HttpGet("suspicious-ips")]
//     public async Task<IActionResult> SuspiciousIps([FromQuery] int lastHours = 24, [FromQuery] int top = 20, CancellationToken ct = default)
//     {
//         var tenantId = _tenant.ResolveTenantId(HttpContext);
//         if (string.IsNullOrWhiteSpace(tenantId))
//             return Unauthorized("Tenant not resolved.");

//         var fromUtc = DateTime.UtcNow.AddHours(-Math.Clamp(lastHours, 1, 24 * 30));
//         top = Math.Clamp(top, 1, 200);

//         // Uses your click event table
//         var data = await _db.Set<ShortLinkClickEvent>()
//             .AsNoTracking()
//             .Where(x => x.TenantId == tenantId && x.Success == false && x.CreatedAtUtc >= fromUtc)
//             .GroupBy(x => x.IpAddress)
//             .Select(g => new
//             {
//                 ip = g.Key,
//                 failures = g.LongCount(),
//                 lastSeen = g.Max(x => x.CreatedAtUtc)
//             })
//             .OrderByDescending(x => x.failures)
//             .Take(top)
//             .ToListAsync(ct);

//         var mapped = data
//             .Where(x => !string.IsNullOrWhiteSpace(x.ip))
//             .Select(x => new SuspiciousIpDto(x.ip!, x.failures, x.lastSeen))
//             .ToList();

//         return Ok(mapped);
//     }

//     // ======================================================
//     // Helpers
//     // ======================================================
//     private static bool IsValidIpOrCidr(string input)
//     {
//         if (IPAddress.TryParse(input, out _))
//             return true;

//         return Regex.IsMatch(input, @"^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$");
//     }
// }
using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Security;
using Lynx.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
[Route("api/admin/v1/security")]
public class AdminSecurityController : ControllerBase
{
    private readonly ISecurityAdminService _service;
    private readonly ITenantResolver _tenant;

    public AdminSecurityController(
        ISecurityAdminService service,
        ITenantResolver tenant)
    {
        _service = service;
        _tenant = tenant;
    }

    // ======================================================
    // IP BLOCKS
    // ======================================================

    [HttpGet("ip-blocks")]
    public async Task<IActionResult> ListIpBlocks(CancellationToken ct)
    {
        var tenantId = ResolveTenant();
        var result = await _service.ListBlocksAsync(tenantId, ct);
        return Ok(result);
    }

    [HttpPost("ip-blocks")]
    public async Task<IActionResult> CreateIpBlock(
        [FromBody] CreateIpBlockDto dto,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();
        var result = await _service.UpsertBlockAsync(tenantId, dto, ct);
        return Ok(result);
    }

    [HttpDelete("ip-blocks/{id:long}")]
    public async Task<IActionResult> DeleteIpBlock(
        long id,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();
        var success = await _service.DeleteBlockAsync(tenantId, id, ct);

        if (!success)
            return NotFound("IP block not found.");

        return Ok(new { message = "IP block removed successfully.", deletedId = id });
    }

    [HttpGet("ip-blocks/search")]
    public async Task<IActionResult> SearchIpBlocks(
        [FromQuery] IpRuleSearchDto dto,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();
        var result = await _service.SearchBlocksAsync(tenantId, dto, ct);
        return Ok(result);
    }

    [HttpPost("ip-blocks/bulk")]
    public async Task<IActionResult> BulkBlock(
        [FromBody] List<CreateIpBlockDto> blocks,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();
        var result = await _service.BulkBlockAsync(tenantId, blocks, ct);
        return Ok(result);
    }

    // ======================================================
    // WHITELIST
    // ======================================================

    [HttpGet("whitelist")]
    public async Task<IActionResult> SearchWhitelist(
        [FromQuery] IpRuleSearchDto dto,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();
        var result = await _service.SearchWhitelistAsync(tenantId, dto, ct);
        return Ok(result);
    }

    [HttpPost("whitelist")]
    public async Task<IActionResult> UpsertWhitelist(
        [FromBody] CreateIpWhitelistDto dto,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();
        var result = await _service.UpsertWhitelistAsync(tenantId, dto, ct);
        return Ok(result);
    }

    [HttpDelete("whitelist/{id:long}")]
    public async Task<IActionResult> DeleteWhitelist(
        long id,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();
        var success = await _service.DeleteWhitelistAsync(tenantId, id, ct);

        if (!success)
            return NotFound("Whitelist entry not found.");

        return Ok(new { message = "Whitelist removed", deletedId = id });
    }

    // ======================================================
    // SUSPICIOUS IPS
    // ======================================================

    [HttpGet("suspicious-ips")]
    public async Task<IActionResult> SuspiciousIps(
        [FromQuery] int lastHours = 24,
        [FromQuery] int top = 20,
        CancellationToken ct = default)
    {
        var tenantId = ResolveTenant();
        var result = await _service.GetSuspiciousIpsAsync(
            tenantId,
            lastHours,
            top,
            ct);

        return Ok(result);
    }

    // ======================================================
    // Helper
    // ======================================================

    private string ResolveTenant()
    {
        var tenantId = _tenant.ResolveTenantId(HttpContext);

        if (string.IsNullOrWhiteSpace(tenantId))
            throw new UnauthorizedAccessException("Tenant not resolved.");

        return tenantId;
    }
    // ======================================================
    // SECURITY INCIDENTS
    // ======================================================

    [HttpGet("incidents")]
    public async Task<IActionResult> GetIncidents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? severity = null,
        [FromQuery] string? type = null,
        CancellationToken ct = default)
    {
        var tenantId = ResolveTenant();

        var result = await _service.GetSecurityIncidentsAsync(
            tenantId,
            page,
            pageSize,
            severity,
            type,
            ct);

        return Ok(result);
    }
    [HttpDelete("incidents/{id:long}")]
    public async Task<IActionResult> DeleteIncident(
        long id,
        CancellationToken ct)
    {
        var tenantId = ResolveTenant();

        var deletedId = await _service.DeleteSecurityIncidentAsync(
            tenantId,
            id,
            ct);

        if (deletedId == 0)
            return NotFound("Incident not found.");

        return Ok(new { message = "Incident deleted", deletedId });
    }
}