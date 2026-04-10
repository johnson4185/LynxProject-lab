using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Analytics;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db)
    {
        _db = db;
    }

    // =========================
    // helpers
    // =========================
    private static DateTime UtcSince(int lastHours)
        => DateTime.UtcNow.AddHours(-Math.Max(1, lastHours));

    private static DateTime Bucket(DateTime utc, string interval)
    {
        interval = (interval ?? "hour").ToLowerInvariant();

        if (interval == "minute")
            return new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, utc.Minute, 0, DateTimeKind.Utc);

        if (interval == "day")
            return new DateTime(utc.Year, utc.Month, utc.Day, 0, 0, 0, DateTimeKind.Utc);

        // default hour
        return new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, 0, 0, DateTimeKind.Utc);
    }

    private async Task<List<TimeSeriesPointDto>> BuildTimeSeriesAsync(
        IQueryable<ShortLinkAuditLog> query,
        string interval)
    {
        // ✅ DB-side bucketing is best, but depends on your schema/extensions.
        // ✅ Safe approach: fetch timestamps only (bounded by lastHours) and group in memory.
        var rows = await query
            .Select(x => x.CreatedAtUtc)
            .ToListAsync();

        return rows
            .GroupBy(x => Bucket(x, interval))
            .OrderBy(g => g.Key)
            .Select(g => new TimeSeriesPointDto { BucketUtc = g.Key, Count = g.LongCount() })
            .ToList();
    }

    // =========================
    // TRAFFIC
    // =========================
    public async Task<TrafficSummaryDto> GetTrafficSummaryAsync(string tenantId, int lastHours)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since);

        var total = await q.LongCountAsync();
        var redirectSuccess = await q.LongCountAsync(x => x.EventType == "ACCESS" && x.Success);
        var redirectFailure = await q.LongCountAsync(x => x.EventType == "ACCESS" && !x.Success);
        var createRequests = await q.LongCountAsync(x => x.EventType == "CREATE");

        var uniqueIps = await q
            .Where(x => x.IpAddress != null && x.IpAddress != "")
            .Select(x => x.IpAddress!)
            .Distinct()
            .LongCountAsync();

        return new TrafficSummaryDto
        {
            LastHours = lastHours,
            TotalEvents = total,
            RedirectSuccess = redirectSuccess,
            RedirectFailure = redirectFailure,
            CreateRequests = createRequests,
            UniqueIps = uniqueIps
        };
    }

    public async Task<List<TimeSeriesPointDto>> GetTrafficTimeSeriesAsync(string tenantId, int lastHours, string interval)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since && x.EventType == "ACCESS");

        return await BuildTimeSeriesAsync(q, interval);
    }

    // =========================
    // SECURITY
    // =========================
    public async Task<SecurityOverviewDto> GetSecurityOverviewAsync(string tenantId, int lastHours)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since);

        return new SecurityOverviewDto
        {
            LastHours = lastHours,
            TotalFailures = await q.LongCountAsync(x => !x.Success),
            RateLimitHits = await q.LongCountAsync(x => x.EventType == "RATE_LIMIT"),
            BotEvents = await q.LongCountAsync(x => x.EventType == "BOT"),
            IpBlockedHits = await q.LongCountAsync(x => x.EventType == "IP_BLOCK")
        };
    }

    public async Task<List<BlockedIpDto>> GetBlockedIpsAsync(string tenantId, int lastHours)
    {
        var since = UtcSince(lastHours);

        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since && x.EventType == "IP_BLOCK" && x.IpAddress != null)
            .GroupBy(x => x.IpAddress!)
            .Select(g => new BlockedIpDto { IpAddress = g.Key, BlockCount = g.LongCount() })
            .OrderByDescending(x => x.BlockCount)
            .ToListAsync();
    }

    public async Task<List<RateLimitEventDto>> GetRateLimitEventsAsync(string tenantId, int lastHours, int top = 20)
    {
        var since = UtcSince(lastHours);

        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since && x.EventType == "RATE_LIMIT")
            .GroupBy(x => x.IpAddress ?? "unknown")
            .Select(g => new RateLimitEventDto { Key = g.Key, Hits = g.LongCount() })
            .OrderByDescending(x => x.Hits)
            .Take(Math.Clamp(top, 1, 200))
            .ToListAsync();
    }

    public async Task<List<BotActivityDto>> GetBotActivityAsync(string tenantId, int lastHours, int top = 20)
    {
        var since = UtcSince(lastHours);

        // If you don’t store fingerprint in DB logs, group by IP
        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since && x.EventType == "BOT")
            .GroupBy(x => x.IpAddress ?? "unknown")
            .Select(g => new BotActivityDto { Fingerprint = g.Key, Hits = g.LongCount() })
            .OrderByDescending(x => x.Hits)
            .Take(Math.Clamp(top, 1, 200))
            .ToListAsync();
    }

    public async Task<List<ApiKeyUsageDto>> GetApiKeyUsageAsync(string tenantId, int lastHours, int top = 20)
    {
        var since = UtcSince(lastHours);

        // If you store api key hint in Reason (or another column), update this grouping.
        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since && x.EventType == "API_KEY")
            .GroupBy(x => (x.Reason ?? "unknown"))
            .Select(g => new ApiKeyUsageDto { ApiKeyIdOrHint = g.Key, Calls = g.LongCount() })
            .OrderByDescending(x => x.Calls)
            .Take(Math.Clamp(top, 1, 200))
            .ToListAsync();
    }

    public async Task<IncidentSummaryDto> GetIncidentSummaryAsync(string tenantId, int lastHours)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<SecurityIncident>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since);

        var total = await q.LongCountAsync();

        // If you have "IncidentType" column, replace EF.Property here
        var byType = await q
            .GroupBy(x => EF.Property<string>(x, "IncidentType") ?? "UNKNOWN")
            .Select(g => new { Type = g.Key, Count = g.LongCount() })
            .ToListAsync();

        return new IncidentSummaryDto
        {
            LastHours = lastHours,
            TotalIncidents = total,
            ByType = byType.ToDictionary(x => x.Type, x => x.Count)
        };
    }

    // =========================
    // LINKS
    // =========================
    public async Task<LinkPerformanceDto> GetLinkPerformanceAsync(string tenantId, string shortCode, int lastHours)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.ShortCode == shortCode && x.CreatedAtUtc >= since && x.EventType == "ACCESS");

        var total = await q.LongCountAsync();
        var success = await q.LongCountAsync(x => x.Success);

        return new LinkPerformanceDto
        {
            ShortCode = shortCode,
            LastHours = lastHours,
            TotalHits = total,
            SuccessCount = success,
            FailureCount = total - success
        };
    }

    public async Task<List<TimeSeriesPointDto>> GetLinkTimeSeriesAsync(string tenantId, string shortCode, int lastHours, string interval)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.ShortCode == shortCode && x.CreatedAtUtc >= since && x.EventType == "ACCESS");

        return await BuildTimeSeriesAsync(q, interval);
    }

    public async Task<List<GeoBreakdownDto>> GetLinkGeoAsync(string tenantId, string shortCode, int lastHours, int top = 20)
    {
        var since = UtcSince(lastHours);

        // expects optional column: country_code
        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.ShortCode == shortCode && x.CreatedAtUtc >= since && x.EventType == "ACCESS" && x.Success)
            .GroupBy(x => EF.Property<string>(x, "CountryCode") ?? "UNKNOWN")
            .Select(g => new GeoBreakdownDto { CountryCode = g.Key, Hits = g.LongCount() })
            .OrderByDescending(x => x.Hits)
            .Take(Math.Clamp(top, 1, 200))
            .ToListAsync();
    }

    public async Task<List<DeviceBreakdownDto>> GetLinkDevicesAsync(string tenantId, string shortCode, int lastHours, int top = 20)
    {
        var since = UtcSince(lastHours);

        // expects optional column: device_type
        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.ShortCode == shortCode && x.CreatedAtUtc >= since && x.EventType == "ACCESS" && x.Success)
            .GroupBy(x => EF.Property<string>(x, "DeviceType") ?? "UNKNOWN")
            .Select(g => new DeviceBreakdownDto { DeviceType = g.Key, Hits = g.LongCount() })
            .OrderByDescending(x => x.Hits)
            .Take(Math.Clamp(top, 1, 200))
            .ToListAsync();
    }

    public async Task<ConversionDto> GetLinkConversionAsync(string tenantId, string shortCode, int lastHours)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.ShortCode == shortCode && x.CreatedAtUtc >= since && x.EventType == "ACCESS" && x.Success);

        var total = await q.LongCountAsync();

        // expects optional column: is_conversion (bool)
        var conversions = await q.LongCountAsync(x => (EF.Property<bool?>(x, "IsConversion") ?? false));

        var rate = total == 0 ? 0m : (decimal)conversions / total;

        return new ConversionDto
        {
            TotalHits = total,
            Conversions = conversions,
            ConversionRate = rate
        };
    }

    // =========================
    // CAMPAIGNS
    // =========================
    public async Task<CampaignPerformanceDto> GetCampaignPerformanceAsync(string tenantId, Guid campaignId, int lastHours)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CampaignId == campaignId && x.CreatedAtUtc >= since && x.EventType == "ACCESS");

        var total = await q.LongCountAsync();
        var success = await q.LongCountAsync(x => x.Success);

        return new CampaignPerformanceDto
        {
            CampaignId = campaignId,
            LastHours = lastHours,
            TotalHits = total,
            SuccessfulHits = success
        };
    }

    public async Task<ConversionDto> GetCampaignConversionRateAsync(string tenantId, Guid campaignId, int lastHours)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CampaignId == campaignId && x.CreatedAtUtc >= since && x.EventType == "ACCESS" && x.Success);

        var total = await q.LongCountAsync();
        var conversions = await q.LongCountAsync(x => (EF.Property<bool?>(x, "IsConversion") ?? false));

        var rate = total == 0 ? 0m : (decimal)conversions / total;

        return new ConversionDto
        {
            TotalHits = total,
            Conversions = conversions,
            ConversionRate = rate
        };
    }

    public async Task<List<TopLinkDto>> GetCampaignTopLinksAsync(string tenantId, Guid campaignId, int lastHours, int top = 20)
    {
        var since = UtcSince(lastHours);

        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CampaignId == campaignId && x.CreatedAtUtc >= since && x.EventType == "ACCESS" && x.Success && x.ShortCode != null)
            .GroupBy(x => x.ShortCode!)
            .Select(g => new TopLinkDto { ShortCode = g.Key, Hits = g.LongCount() })
            .OrderByDescending(x => x.Hits)
            .Take(Math.Clamp(top, 1, 200))
            .ToListAsync();
    }

    // =========================
    // SYSTEM
    // =========================
    public async Task<TenantUsageDto> GetTenantUsageAsync(string tenantId)
    {
        var totalLinks = await _db.Set<ShortLink>()
            .AsNoTracking()
            .LongCountAsync(x => x.TenantId == tenantId);

        var totalClicks = await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .LongCountAsync(x => x.TenantId == tenantId && x.EventType == "ACCESS" && x.Success);

        return new TenantUsageDto
        {
            TenantId = tenantId,
            TotalLinks = totalLinks,
            TotalClicks = totalClicks,
            AsOfUtc = DateTime.UtcNow
        };
    }

    public async Task<QuotaUsageDto> GetQuotaUsageAsync(string tenantId)
    {
        var cfg = await _db.Set<TenantConfiguration>()
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.TenantId == tenantId);

        if (cfg == null)
            throw new InvalidOperationException($"Tenant configuration not found: {tenantId}");

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var usedLinks = await _db.Set<ShortLink>()
            .AsNoTracking()
            .LongCountAsync(x => x.TenantId == tenantId && x.CreatedAtUtc >= monthStart);

        var usedClicks = await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .LongCountAsync(x => x.TenantId == tenantId && x.CreatedAtUtc >= monthStart && x.EventType == "ACCESS" && x.Success);

        return new QuotaUsageDto
        {
            TenantId = tenantId,
            MonthlyLinksQuota = cfg.MonthlyLinksQuota,
            MonthlyClicksQuota = cfg.MonthlyClicksQuota,
            UsedLinksThisMonth = usedLinks,
            UsedClicksThisMonth = usedClicks
        };
    }

    public async Task<AbuseOverviewDto> GetAbuseOverviewAsync(string tenantId, int lastHours)
    {
        var since = UtcSince(lastHours);

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since);

        return new AbuseOverviewDto
        {
            LastHours = lastHours,
            RateLimitHits = await q.LongCountAsync(x => x.EventType == "RATE_LIMIT"),
            BotEvents = await q.LongCountAsync(x => x.EventType == "BOT"),
            IpBlocks = await q.LongCountAsync(x => x.EventType == "IP_BLOCK")
        };
    }

    public async Task<RevenueUsageDto> GetRevenueUsageAsync(string tenantId)
    {
        var cfg = await _db.Set<TenantConfiguration>()
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.TenantId == tenantId);

        if (cfg == null)
            throw new InvalidOperationException($"Tenant configuration not found: {tenantId}");

        // Hook billing later. For now return placeholder.
        return new RevenueUsageDto
        {
            TenantId = tenantId,
            PlanCode = cfg.PlanCode ?? "FREE",
            EstimatedRevenue = 0m
        };
    }
    public async Task<AnalyticsSummaryDto> GetSummaryAsync(int lastHours, string tenantId)
    {
        var since = DateTime.UtcNow.AddHours(-Math.Max(1, lastHours));

        var q = _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= since);

        var total = await q.CountAsync();
        var success = await q.CountAsync(x => x.Success);
        var failure = total - success;

        var byType = await q
            .GroupBy(x => x.EventType)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync();

        var topReasons = await q
            .Where(x => !x.Success && !string.IsNullOrEmpty(x.Reason))
            .GroupBy(x => x.Reason!)
            .Select(g => new { g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync();

        return new AnalyticsSummaryDto
        {
            TotalEvents = total,
            SuccessCount = success,
            FailureCount = failure,
            ByEventType = byType.ToDictionary(x => x.Key ?? "UNKNOWN", x => x.Count),
            FailureReasonsTop = topReasons.ToDictionary(x => x.Key, x => x.Count)
        };
    }

    public async Task<List<TopShortCodeDto>> GetTopShortCodesAsync(
        int lastHours,
        string tenantId,
        int top)
    {
        var since = DateTime.UtcNow.AddHours(-Math.Max(1, lastHours));

        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x =>
                x.TenantId == tenantId &&
                x.CreatedAtUtc >= since &&
                x.EventType == "ACCESS" &&
                x.Success &&
                x.ShortCode != null)
            .GroupBy(x => x.ShortCode!)
            .Select(g => new TopShortCodeDto
            {
                ShortCode = g.Key,
                Hits = g.Count()
            })
            .OrderByDescending(x => x.Hits)
            .Take(Math.Clamp(top, 1, 100))
            .ToListAsync();
    }

    public async Task<List<TopFailedIpDto>> GetTopFailedIpsAsync(
        int lastHours,
        string tenantId,
        int top)
    {
        var since = DateTime.UtcNow.AddHours(-Math.Max(1, lastHours));

        return await _db.Set<ShortLinkAuditLog>()
            .AsNoTracking()
            .Where(x =>
                x.TenantId == tenantId &&
                x.CreatedAtUtc >= since &&
                !x.Success &&
                x.IpAddress != null)
            .GroupBy(x => x.IpAddress!)
            .Select(g => new TopFailedIpDto
            {
                IpAddress = g.Key,
                Failures = g.Count()
            })
            .OrderByDescending(x => x.Failures)
            .Take(Math.Clamp(top, 1, 100))
            .ToListAsync();
    }
}