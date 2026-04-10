using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class RetentionJob
{
    public long Id { get; set; }

    public string? JobType { get; set; }

    public string? Status { get; set; }

    public long? RecordsDeleted { get; set; }

    public DateTime? CreatedAtUtc { get; set; }

    public string TenantId { get; set; } = null!;

    public DateTime? StartedAtUtc { get; set; }

    public DateTime? CompletedAtUtc { get; set; }

    public long? RecordsScanned { get; set; }

    public string? ErrorMessage { get; set; }

    public string? CreatedBy { get; set; }

    public int? RetentionDays { get; set; }
}
