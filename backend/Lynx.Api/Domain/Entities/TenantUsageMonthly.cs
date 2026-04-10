using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantUsageMonthly
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public int YearMonth { get; set; }

    public long LinksCreated { get; set; }

    public long Clicks { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
