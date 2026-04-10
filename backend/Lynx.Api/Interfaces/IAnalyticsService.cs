using Lynx.Api.DTOs.Analytics;

namespace Lynx.Api.Interfaces;

public interface IAnalyticsService
{
    // TRAFFIC
    Task<TrafficSummaryDto> GetTrafficSummaryAsync(string tenantId, int lastHours);
    Task<List<TimeSeriesPointDto>> GetTrafficTimeSeriesAsync(string tenantId, int lastHours, string interval);

    // SECURITY
    Task<SecurityOverviewDto> GetSecurityOverviewAsync(string tenantId, int lastHours);
    Task<List<BlockedIpDto>> GetBlockedIpsAsync(string tenantId, int lastHours);
    Task<List<RateLimitEventDto>> GetRateLimitEventsAsync(string tenantId, int lastHours, int top = 20);
    Task<List<BotActivityDto>> GetBotActivityAsync(string tenantId, int lastHours, int top = 20);
    Task<List<ApiKeyUsageDto>> GetApiKeyUsageAsync(string tenantId, int lastHours, int top = 20);
    Task<IncidentSummaryDto> GetIncidentSummaryAsync(string tenantId, int lastHours);

    // LINKS
    Task<LinkPerformanceDto> GetLinkPerformanceAsync(string tenantId, string shortCode, int lastHours);
    Task<List<TimeSeriesPointDto>> GetLinkTimeSeriesAsync(string tenantId, string shortCode, int lastHours, string interval);
    Task<List<GeoBreakdownDto>> GetLinkGeoAsync(string tenantId, string shortCode, int lastHours, int top = 20);
    Task<List<DeviceBreakdownDto>> GetLinkDevicesAsync(string tenantId, string shortCode, int lastHours, int top = 20);
    Task<ConversionDto> GetLinkConversionAsync(string tenantId, string shortCode, int lastHours);

    // CAMPAIGNS
    Task<CampaignPerformanceDto> GetCampaignPerformanceAsync(string tenantId, Guid campaignId, int lastHours);
    Task<ConversionDto> GetCampaignConversionRateAsync(string tenantId, Guid campaignId, int lastHours);
    Task<List<TopLinkDto>> GetCampaignTopLinksAsync(string tenantId, Guid campaignId, int lastHours, int top = 20);

    // SYSTEM
    Task<TenantUsageDto> GetTenantUsageAsync(string tenantId);
    Task<QuotaUsageDto> GetQuotaUsageAsync(string tenantId);
    Task<AbuseOverviewDto> GetAbuseOverviewAsync(string tenantId, int lastHours);
    Task<RevenueUsageDto> GetRevenueUsageAsync(string tenantId);

    Task<AnalyticsSummaryDto> GetSummaryAsync(int lastHours, string tenantId);

    Task<List<TopShortCodeDto>> GetTopShortCodesAsync(
        int lastHours,
        string tenantId,
        int top);

    Task<List<TopFailedIpDto>> GetTopFailedIpsAsync(
        int lastHours,
        string tenantId,
        int top);
}