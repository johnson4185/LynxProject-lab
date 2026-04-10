using Lynx.Api.DTOs.Campaigns;
using Lynx.Api.DTOs.Common;

namespace Lynx.Api.Interfaces;

public interface ICampaignService
{
    Task<CampaignResponseDto> CreateAsync(string tenantId, CreateCampaignDto dto, CancellationToken ct);
    Task<PagedResult<CampaignResponseDto>> SearchAsync(string tenantId, CampaignSearchDto q, CancellationToken ct);
    Task<CampaignResponseDto?> GetByIdAsync(string tenantId, Guid id, CancellationToken ct);
    Task<bool> UpdateAsync(string tenantId, Guid id, UpdateCampaignDto dto, CancellationToken ct);

    Task<bool> ChangeStatusAsync(string tenantId, Guid id, CampaignStatusUpdateDto dto, CancellationToken ct);
    Task<bool> ArchiveAsync(string tenantId, Guid id, string? actor, CancellationToken ct);
    Task<bool> RestoreAsync(string tenantId, Guid id, string? actor, CancellationToken ct);
    Task<CampaignResponseDto> CloneAsync(string tenantId, Guid id, CampaignCloneDto dto, CancellationToken ct);

    Task EvaluateLifecycleAsync(string tenantId, Guid id, CancellationToken ct);

    Task<CampaignAnalyticsSummaryDto> GetAnalyticsSummaryAsync(
        string tenantId,
        Guid id,
        int lastHours,
        int topLinks,
        CancellationToken ct);
}