using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class ShortLinkClickEvent
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string ShortCode { get; set; } = null!;

    public bool Success { get; set; }

    public string? Reason { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Referer { get; set; }

    public string? CorrelationId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public string? Country { get; set; }

    public string? City { get; set; }

    public string? DeviceType { get; set; }

    public string? Browser { get; set; }

    public string? Os { get; set; }

    public int? BotScore { get; set; }

    public int? RiskScore { get; set; }

    public bool? Blocked { get; set; }

    public Guid? CampaignId { get; set; }

    public Guid? CampaignIdUuid { get; set; }
}
