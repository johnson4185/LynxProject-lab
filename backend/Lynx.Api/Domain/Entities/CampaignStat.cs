using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class CampaignStat
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public long? TotalClicks { get; set; }

    public long? TotalLinks { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? CampaignId { get; set; }

    public virtual Campaign? Campaign { get; set; }
}
