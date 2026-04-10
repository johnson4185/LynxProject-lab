using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantSecurityPolicy
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public int RedirectLimitPerMinute { get; set; }

    public int CreateLimitPerMinute { get; set; }

    public bool AutoBlockEnabled { get; set; }

    public int AutoBlockThreshold { get; set; }

    public int AutoBlockWindowSeconds { get; set; }

    public int AutoBlockTtlSeconds { get; set; }

    public int BotScoreThreshold { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
