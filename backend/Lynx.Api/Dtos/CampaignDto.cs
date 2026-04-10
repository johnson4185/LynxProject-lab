using Lynx.Api.Domain.Entities;

namespace Lynx.Api.DTOs.Campaigns;

public static class CampaignStatuses
{
    public const string Draft = "Draft";
    public const string Active = "Active";
    public const string Paused = "Paused";
    public const string Closed = "Closed";
    public const string Archived = "Archived";

    public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
    {
        Draft, Active, Paused, Closed, Archived
    };
}

public record CreateCampaignDto(
    string Name,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    long? DailyClickLimit,
    long? TotalClickLimit,
    decimal? BudgetAmount,
    string? Currency,
    string? UtmSource,
    string? UtmMedium,
    string? UtmCampaign,
    string? Actor
);

public record UpdateCampaignDto(
    string? Name,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    long? DailyClickLimit,
    long? TotalClickLimit,
    decimal? BudgetAmount,
    string? Currency,
    string? UtmSource,
    string? UtmMedium,
    string? UtmCampaign,
    string? Actor
);

public record CampaignStatusUpdateDto(
    string Status,
    string? Reason,
    string? Actor
);

public record CampaignCloneDto(
    string NewName,
    bool CloneUtmFields = true,
    bool CloneLimits = true,
    bool CloneDates = false,
    string? Actor = null
);

public record CampaignSearchDto(
    string? Search,
    string? Status,
    DateOnly? From,
    DateOnly? To,
    bool IncludeArchived = false,
    int Page = 1,
    int PageSize = 20
);

public record CampaignResponseDto(
    Guid CampaignId,
    string TenantId,
    string Name,
    string? Description,
    string Status,
    DateOnly? StartDate,
    DateOnly? EndDate,
    long? DailyClickLimit,
    long? TotalClickLimit,
    decimal? BudgetAmount,
    string Currency,
    string? UtmSource,
    string? UtmMedium,
    string? UtmCampaign,
    bool IsArchived,
    string? CreatedBy,
    DateTime CreatedAtUtc,
    string? UpdatedBy,
    DateTime? UpdatedAtUtc
);

public record CampaignAnalyticsSummaryDto(
    Guid CampaignId,
    long Clicks,
    long Failures,
    Dictionary<string, long> TopLinks,
    DateTime SinceUtc,
    DateTime UntilUtc
);