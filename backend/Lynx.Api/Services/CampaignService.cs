using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Campaigns;
using Lynx.Api.DTOs.Common;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services;

public class CampaignService : ICampaignService
{
    private readonly AppDbContext _db;
    private readonly ILogger<CampaignService> _logger;
    private readonly ICampaignLimitStore _limits;

    public CampaignService(AppDbContext db, ILogger<CampaignService> logger, ICampaignLimitStore limits)
    {
        _db = db;
        _logger = logger;
        _limits = limits;
    }

    public async Task<CampaignResponseDto> CreateAsync(string tenantId, CreateCampaignDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Campaign name is required.");

        ValidateDates(dto.StartDate, dto.EndDate);

        var exists = await _db.Campaigns
            .AnyAsync(x => x.TenantId == tenantId && !x.IsArchived && x.Name == dto.Name.Trim(), ct);

        if (exists)
            throw new InvalidOperationException("Campaign name already exists for this tenant.");

        var now = DateTime.UtcNow;

        var entity = new Campaign
        {
            CampaignId = Guid.NewGuid(),
            TenantId = tenantId,
            Name = dto.Name.Trim(),
            Description = dto.Description,
            Status = CampaignStatuses.Draft,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            DailyClickLimit = dto.DailyClickLimit,
            TotalClickLimit = dto.TotalClickLimit,
            BudgetAmount = dto.BudgetAmount,
            Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "USD" : dto.Currency.Trim(),
            UtmSource = dto.UtmSource,
            UtmMedium = dto.UtmMedium,
            UtmCampaign = dto.UtmCampaign,
            IsArchived = false,
            CreatedBy = dto.Actor,
            CreatedAtUtc = now,
            UpdatedBy = dto.Actor,
            UpdatedAtUtc = now
        };

        _db.Campaigns.Add(entity);
        await _db.SaveChangesAsync(ct);

        return Map(entity);
    }

    public async Task<PagedResult<CampaignResponseDto>> SearchAsync(string tenantId, CampaignSearchDto q, CancellationToken ct)
    {
        var query = _db.Campaigns.AsNoTracking().Where(x => x.TenantId == tenantId);

        if (!q.IncludeArchived)
            query = query.Where(x => !x.IsArchived);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(x => x.Name.Contains(s) || (x.Description != null && x.Description.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(q.Status))
            query = query.Where(x => x.Status == q.Status);

        if (q.From.HasValue) query = query.Where(x => x.CreatedAtUtc >= q.From.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        if (q.To.HasValue) query = query.Where(x => x.CreatedAtUtc <= q.To.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc));

        var total = await query.LongCountAsync(ct);

        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, 200);

        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => Map(x))
            .ToListAsync(ct);

        return new PagedResult<CampaignResponseDto>
        {
            Total = total,
            Page = page,
            PageSize = pageSize,
            Items = items
        };
    }

    public async Task<CampaignResponseDto?> GetByIdAsync(string tenantId, Guid id, CancellationToken ct)
    {
        var entity = await _db.Campaigns
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.CampaignId == id, ct);

        return entity == null ? null : Map(entity);
    }

    public async Task<bool> UpdateAsync(string tenantId, Guid id, UpdateCampaignDto dto, CancellationToken ct)
    {
        var entity = await _db.Campaigns
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.CampaignId == id, ct);

        if (entity == null) return false;
        if (entity.IsArchived) throw new InvalidOperationException("Cannot update archived campaign.");

        ValidateDates(dto.StartDate ?? entity.StartDate, dto.EndDate ?? entity.EndDate);

        if (dto.Name != null && !string.Equals(dto.Name.Trim(), entity.Name, StringComparison.OrdinalIgnoreCase))
        {
            var nameExists = await _db.Campaigns.AnyAsync(
                x => x.TenantId == tenantId && !x.IsArchived && x.Name == dto.Name.Trim() && x.CampaignId != id, ct);

            if (nameExists) throw new InvalidOperationException("Campaign name already exists.");
            entity.Name = dto.Name.Trim();
        }

        if (dto.Description != null) entity.Description = dto.Description;
        if (dto.StartDate.HasValue) entity.StartDate = dto.StartDate;
        if (dto.EndDate.HasValue) entity.EndDate = dto.EndDate;
        if (dto.DailyClickLimit.HasValue) entity.DailyClickLimit = dto.DailyClickLimit;
        if (dto.TotalClickLimit.HasValue) entity.TotalClickLimit = dto.TotalClickLimit;
        if (dto.BudgetAmount.HasValue) entity.BudgetAmount = dto.BudgetAmount;
        if (!string.IsNullOrWhiteSpace(dto.Currency)) entity.Currency = dto.Currency.Trim();

        if (dto.UtmSource != null) entity.UtmSource = dto.UtmSource;
        if (dto.UtmMedium != null) entity.UtmMedium = dto.UtmMedium;
        if (dto.UtmCampaign != null) entity.UtmCampaign = dto.UtmCampaign;

        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = dto.Actor;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    // -------------------------
    // Status Machine
    // -------------------------
    public async Task<bool> ChangeStatusAsync(string tenantId, Guid id, CampaignStatusUpdateDto dto, CancellationToken ct)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
            throw new ArgumentException("Status is required.");

        var target = dto.Status.Trim();
        if (!CampaignStatuses.All.Contains(target))
            throw new ArgumentException($"Invalid status: {target}");

        var entity = await _db.Campaigns
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.CampaignId == id, ct);

        if (entity == null) return false;

        if (entity.IsArchived)
            throw new InvalidOperationException("Cannot change status for archived campaign.");

        EnforceTransition(entity.Status, target);

        // Extra rule: cannot activate if end date already passed
        if (string.Equals(target, CampaignStatuses.Active, StringComparison.OrdinalIgnoreCase))
        {
            if (entity.EndDate.HasValue)
            {
                var endUtc = entity.EndDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
                if (DateTime.UtcNow > endUtc)
                    throw new InvalidOperationException("Cannot activate a campaign that already ended.");
            }
        }

        entity.Status = target;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = dto.Actor;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ArchiveAsync(string tenantId, Guid id, string? actor, CancellationToken ct)
    {
        var entity = await _db.Campaigns.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.CampaignId == id, ct);
        if (entity == null) return false;

        if (entity.IsArchived) return true; // idempotent

        entity.IsArchived = true;
        entity.Status = CampaignStatuses.Archived;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = actor;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RestoreAsync(string tenantId, Guid id, string? actor, CancellationToken ct)
    {
        var entity = await _db.Campaigns.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.CampaignId == id, ct);
        if (entity == null) return false;

        if (!entity.IsArchived) return true; // idempotent

        entity.IsArchived = false;
        entity.Status = CampaignStatuses.Draft; // safe default
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = actor;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<CampaignResponseDto> CloneAsync(string tenantId, Guid id, CampaignCloneDto dto, CancellationToken ct)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.NewName))
            throw new ArgumentException("NewName is required.");

        var src = await _db.Campaigns.AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.CampaignId == id, ct);

        if (src == null)
            throw new KeyNotFoundException("Campaign not found.");

        var exists = await _db.Campaigns
            .AnyAsync(x => x.TenantId == tenantId && !x.IsArchived && x.Name == dto.NewName.Trim(), ct);

        if (exists)
            throw new InvalidOperationException("Campaign name already exists.");

        var now = DateTime.UtcNow;

        var copy = new Campaign
        {
            CampaignId = Guid.NewGuid(),
            TenantId = tenantId,
            Name = dto.NewName.Trim(),
            Description = src.Description,
            Status = CampaignStatuses.Draft,

            StartDate = dto.CloneDates ? src.StartDate : null,
            EndDate = dto.CloneDates ? src.EndDate : null,

            DailyClickLimit = dto.CloneLimits ? src.DailyClickLimit : null,
            TotalClickLimit = dto.CloneLimits ? src.TotalClickLimit : null,

            BudgetAmount = dto.CloneLimits ? src.BudgetAmount : null,
            Currency = src.Currency,

            UtmSource = dto.CloneUtmFields ? src.UtmSource : null,
            UtmMedium = dto.CloneUtmFields ? src.UtmMedium : null,
            UtmCampaign = dto.CloneUtmFields ? src.UtmCampaign : null,

            IsArchived = false,
            CreatedBy = dto.Actor,
            CreatedAtUtc = now,
            UpdatedBy = dto.Actor,
            UpdatedAtUtc = now
        };

        _db.Campaigns.Add(copy);
        await _db.SaveChangesAsync(ct);

        return Map(copy);
    }

    // -------------------------
    // Auto lifecycle evaluation
    // -------------------------
    public async Task EvaluateLifecycleAsync(string tenantId, Guid id, CancellationToken ct)
    {
        var entity = await _db.Campaigns
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.CampaignId == id && !x.IsArchived, ct);

        if (entity == null) return;

        var nowUtc = DateTime.UtcNow;

        // If end date passed -> close (unless already closed)
        if (entity.EndDate.HasValue)
        {
            var endUtc = entity.EndDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            if (nowUtc > endUtc && !string.Equals(entity.Status, CampaignStatuses.Closed, StringComparison.OrdinalIgnoreCase))
            {
                entity.Status = CampaignStatuses.Closed;
                entity.UpdatedAtUtc = nowUtc;
                await _db.SaveChangesAsync(ct);
                return;
            }
        }

        // If start date reached -> can auto-activate from Draft (optional)
        if (entity.StartDate.HasValue)
        {
            var startUtc = entity.StartDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            if (nowUtc >= startUtc && string.Equals(entity.Status, CampaignStatuses.Draft, StringComparison.OrdinalIgnoreCase))
            {
                entity.Status = CampaignStatuses.Active;
                entity.UpdatedAtUtc = nowUtc;
                await _db.SaveChangesAsync(ct);
            }
        }
    }

    // -------------------------
    // Analytics summary
    // -------------------------
    public async Task<CampaignAnalyticsSummaryDto> GetAnalyticsSummaryAsync(
        string tenantId,
        Guid id,
        int lastHours,
        int topLinks,
        CancellationToken ct)
    {
        var sinceUtc = DateTime.UtcNow.AddHours(-Math.Max(1, lastHours));
        var untilUtc = DateTime.UtcNow;

        // Uses click events campaign_id_uuid (recommended migration above)
        var q = _db.Set<ShortLinkClickEvent>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId
                        && x.CampaignIdUuid == id
                        && x.CreatedAtUtc >= sinceUtc);

        var clicks = await q.LongCountAsync(x => x.Success, ct);
        var failures = await q.LongCountAsync(x => !x.Success, ct);

        var top = await q
            .Where(x => x.Success)
            .GroupBy(x => x.ShortCode)
            .Select(g => new { ShortCode = g.Key, Hits = g.LongCount() })
            .OrderByDescending(x => x.Hits)
            .Take(Math.Clamp(topLinks, 1, 50))
            .ToListAsync(ct);

        return new CampaignAnalyticsSummaryDto(
            CampaignId: id,
            Clicks: clicks,
            Failures: failures,
            TopLinks: top.ToDictionary(x => x.ShortCode, x => x.Hits),
            SinceUtc: sinceUtc,
            UntilUtc: untilUtc
        );
    }

    // -------------------------
    // Helpers
    // -------------------------
    private static void ValidateDates(DateOnly? start, DateOnly? end)
    {
        if (start.HasValue && end.HasValue && end < start)
            throw new ArgumentException("EndDate must be >= StartDate.");
    }

    private static void EnforceTransition(string current, string target)
    {
        // Allowed transitions:
        // Draft -> Active|Archived
        // Active -> Paused|Closed|Archived
        // Paused -> Active|Closed|Archived
        // Closed -> Archived
        // Archived -> (restore handled separately)
        current ??= CampaignStatuses.Draft;

        if (string.Equals(current, target, StringComparison.OrdinalIgnoreCase))
            return;

        bool ok =
            (Eq(current, CampaignStatuses.Draft) && (Eq(target, CampaignStatuses.Active) || Eq(target, CampaignStatuses.Archived)))
            || (Eq(current, CampaignStatuses.Active) && (Eq(target, CampaignStatuses.Paused) || Eq(target, CampaignStatuses.Closed) || Eq(target, CampaignStatuses.Archived)))
            || (Eq(current, CampaignStatuses.Paused) && (Eq(target, CampaignStatuses.Active) || Eq(target, CampaignStatuses.Closed) || Eq(target, CampaignStatuses.Archived)))
            || (Eq(current, CampaignStatuses.Closed) && Eq(target, CampaignStatuses.Archived));

        if (!ok)
            throw new InvalidOperationException($"Invalid status transition: {current} -> {target}");

        static bool Eq(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
    }

    private static CampaignResponseDto Map(Campaign x)
        => new(
            x.CampaignId,
            x.TenantId,
            x.Name,
            x.Description,
            x.Status,
            x.StartDate,
            x.EndDate,
            x.DailyClickLimit,
            x.TotalClickLimit,
            x.BudgetAmount,
            x.Currency,
            x.UtmSource,
            x.UtmMedium,
            x.UtmCampaign,
            x.IsArchived,
            x.CreatedBy,
            x.CreatedAtUtc,
            x.UpdatedBy,
            x.UpdatedAtUtc
        );
}