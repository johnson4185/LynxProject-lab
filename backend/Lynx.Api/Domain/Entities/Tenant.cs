using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class Tenant
{
    public Guid Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string DbMode { get; set; } = null!;

    public string? TenantDbConnString { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }
}
