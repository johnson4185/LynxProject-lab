namespace Lynx.Api.Models;

public record TenantProfile(
    string TenantId,
    string Status,
    string PlanCode,

    // Business
    string? Timezone,
    int DefaultLinkExpiryMinutes,
    bool AllowCustomDomains,
    string? CustomDomain,

    // Limits
    int RedirectLimitPerMinute,
    int CreateLimitPerMinute,
    int MonthlyLinksQuota,
    int MonthlyClicksQuota,

    // Security
    bool AutoBlockEnabled,
    int AutoBlockThreshold,
    int AutoBlockWindowSeconds,
    int AutoBlockTtlSeconds,
    int BotScoreThreshold
);