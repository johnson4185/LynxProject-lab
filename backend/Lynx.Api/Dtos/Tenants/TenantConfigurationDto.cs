namespace Lynx.Api.DTOs.Tenants;

public record TenantConfigurationResponseDto(
    string TenantId,
    bool IsActive,
    bool IsSuspended,
    string PlanCode,
    string? Timezone,
    int DefaultLinkExpiryMinutes,
    bool AllowCustomDomains,
    string? CustomDomain,
    int RedirectLimitPerMinute,
    int CreateLimitPerMinute,
    int MonthlyLinksQuota,
    int MonthlyClicksQuota,
    bool AutoBlockEnabled,
    int AutoBlockThreshold,
    int AutoBlockWindowSeconds,
    int AutoBlockTtlSeconds,
    int BotScoreThreshold,
    string? Metadata,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc
);

public class CreateTenantConfigurationDto
{
    public string TenantId { get; set; } = default!;
    public bool? IsActive { get; set; }
    public bool? IsSuspended { get; set; }
    public string? PlanCode { get; set; }
    public string? Timezone { get; set; }
    public int? DefaultLinkExpiryMinutes { get; set; }
    public bool? AllowCustomDomains { get; set; }
    public string? CustomDomain { get; set; }
    public string? Metadata { get; set; }
}

public class UpdateTenantConfigurationDto
{
    public bool? IsActive { get; set; }
    public bool? IsSuspended { get; set; }
    public string? PlanCode { get; set; }
    public string? Timezone { get; set; }
    public int? DefaultLinkExpiryMinutes { get; set; }
    public bool? AllowCustomDomains { get; set; }
    public string? CustomDomain { get; set; }

    public int? RedirectLimitPerMinute { get; set; }
    public int? CreateLimitPerMinute { get; set; }
    public int? MonthlyLinksQuota { get; set; }
    public int? MonthlyClicksQuota { get; set; }

    public bool? AutoBlockEnabled { get; set; }
    public int? AutoBlockThreshold { get; set; }
    public int? AutoBlockWindowSeconds { get; set; }
    public int? AutoBlockTtlSeconds { get; set; }
    public int? BotScoreThreshold { get; set; }

    public string? Metadata { get; set; }
}