using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class ShortLink
{
    public long Id { get; set; }

    public string ShortCode { get; set; } = null!;

    public string SecureToken { get; set; } = null!;

    public DateTime ExpiryUtc { get; set; }

    public bool IsActive { get; set; }

    public int ClickCount { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public string TenantId { get; set; } = null!;

    public string? Title { get; set; }

    public string? CreatedBy { get; set; }

    public List<string>? Tags { get; set; }

    public DateTime? LastAccessedAtUtc { get; set; }

    public DateTime? RevokedAtUtc { get; set; }

    public string? RevokedBy { get; set; }

    public Guid? CampaignId { get; set; }

    public Guid? CampaignIdUuid { get; set; }

    public virtual Campaign? Campaign { get; set; }

    public virtual Campaign? CampaignIdUu { get; set; }
}
