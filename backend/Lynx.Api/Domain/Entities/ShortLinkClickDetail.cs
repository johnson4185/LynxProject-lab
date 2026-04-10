using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class ShortLinkClickDetail
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string ShortCode { get; set; } = null!;

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Referer { get; set; }

    public bool Success { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
