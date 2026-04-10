using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class ShortLinkDailyStat
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string ShortCode { get; set; } = null!;

    public DateOnly StatDate { get; set; }

    public int Clicks { get; set; }

    public int Failures { get; set; }
}
