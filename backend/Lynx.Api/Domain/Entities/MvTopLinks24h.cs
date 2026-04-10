using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class MvTopLinks24h
{
    public string? TenantId { get; set; }

    public string? ShortCode { get; set; }

    public long? Clicks { get; set; }
}
