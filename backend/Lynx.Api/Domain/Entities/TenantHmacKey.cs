using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantHmacKey
{
    public Guid Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string Kid { get; set; } = null!;

    public string Secret { get; set; } = null!;

    public bool IsActive { get; set; }

    public bool CanSign { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? RotatedAtUtc { get; set; }
}
