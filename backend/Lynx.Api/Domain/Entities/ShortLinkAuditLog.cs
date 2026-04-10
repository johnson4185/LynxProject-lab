using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class ShortLinkAuditLog
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string? ShortCode { get; set; }

    public string EventType { get; set; } = null!;

    public bool Success { get; set; }

    public string? Reason { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public string? CorrelationId { get; set; }

    public Guid? CampaignId { get; set; }
}
