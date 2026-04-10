namespace Lynx.Api.DTOs.Retention;

public class RetentionSearchDto
{
    public string? Status { get; set; }
    public string? JobType { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}


public class RetentionJobDto
{
    public long Id { get; set; }
    public string JobType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public long RecordsDeleted { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? ErrorMessage { get; set; }
}


public class TriggerRetentionDto
{
    /// <summary>
    /// Type of retention job.
    /// Example: ClickRetention, AuditCleanup, TokenCleanup
    /// </summary>
    public string JobType { get; set; } = null!;

    /// <summary>
    /// Optional retention override (in days).
    /// If null, system default policy is used.
    /// </summary>
    public int? RetentionDays { get; set; }

    /// <summary>
    /// Actor triggering the job (admin username / system)
    /// </summary>
    public string? Actor { get; set; }
}