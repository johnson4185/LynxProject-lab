using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantDomain
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string Domain { get; set; } = null!;

    public bool IsVerified { get; set; }

    public string? SslStatus { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
