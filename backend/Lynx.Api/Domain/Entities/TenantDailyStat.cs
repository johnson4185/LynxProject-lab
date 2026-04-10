using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantDailyStat
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public DateOnly StatDate { get; set; }

    public int Creates { get; set; }

    public int Clicks { get; set; }

    public int Failures { get; set; }

    public int Revoked { get; set; }
}
