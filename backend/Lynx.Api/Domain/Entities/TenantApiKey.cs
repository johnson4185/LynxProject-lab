using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantApiKey
{
    public string TenantId { get; set; } = null!;

    public string KeyHash { get; set; } = null!;

    public string? Name { get; set; }

    public string? Scopes { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAtUtc { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }

    public Guid KeyId { get; set; }

    public DateTime? LastUsedAtUtc { get; set; }

    public long? UsageCount { get; set; }

    public int? RateLimitPerMinute { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime? RevokedAtUtc { get; set; }
}
