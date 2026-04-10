using Lynx.Api.DTOs.Retention;

namespace Lynx.Api.Interfaces;

public interface IRetentionService
{
    Task<RetentionJobDto> TriggerAsync(string tenantId, TriggerRetentionDto dto, CancellationToken ct);

    Task<(IEnumerable<RetentionJobDto> data, int total)> 
        SearchAsync(string tenantId, RetentionSearchDto dto, CancellationToken ct);

    Task<RetentionJobDto?> GetByIdAsync(string tenantId, long id, CancellationToken ct);

    Task<bool> RetryAsync(string tenantId, long id, CancellationToken ct);
}