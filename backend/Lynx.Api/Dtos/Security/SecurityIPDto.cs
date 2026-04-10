namespace Lynx.Api.Domain.Entities;

public class TenantIpWhitelist
{
    public long Id { get; set; }
    public string TenantId { get; set; } = null!;
    public string IpOrCidr { get; set; } = null!;
    public string? Reason { get; set; }

    public string? CreatedBy { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public string? UpdatedBy { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }
}


public class CreateIpWhitelistDto
{
    public string IpOrCidr { get; set; } = null!;
    public string? Reason { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public string? Actor { get; set; } // optional (admin user/email)
}

public class IpRuleSearchDto
{
    public string? IpOrCidr { get; set; }
    public bool? ActiveOnly { get; set; } = true;

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}


public record SuspiciousIpDto(
    string Ip,
    long Failures,
    DateTime LastSeenUtc
);