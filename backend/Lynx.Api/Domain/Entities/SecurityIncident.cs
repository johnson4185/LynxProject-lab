using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class SecurityIncident
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public string? IncidentType { get; set; }

    public string? Severity { get; set; }

    public string? IpAddress { get; set; }

    public string? Fingerprint { get; set; }

    public string? Details { get; set; }

    public DateTime? CreatedAtUtc { get; set; }
}
