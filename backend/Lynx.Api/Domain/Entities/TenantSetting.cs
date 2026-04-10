using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantSetting
{
    public string TenantId { get; set; } = null!;

    public string? Timezone { get; set; }

    public int? DefaultLinkExpiryMinutes { get; set; }

    public bool? AllowCustomDomains { get; set; }

    public string? CustomDomain { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public int RedirectLimitPerMinute { get; set; }

    public int CreateLimitPerMinute { get; set; }

    public int MonthlyLinksQuota { get; set; }

    public int MonthlyClicksQuota { get; set; }

    public bool AutoBlockEnabled { get; set; }

    public int AutoBlockThreshold { get; set; }

    public int AutoBlockWindowSeconds { get; set; }

    public int AutoBlockTtlSeconds { get; set; }
}
