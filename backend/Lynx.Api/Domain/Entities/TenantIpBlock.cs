using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantIpBlock
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string? Reason { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }

    public string IpOrCidr { get; set; } = null!;
}
