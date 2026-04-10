namespace Lynx.Api.DTOs.Security;

public class CreateIpBlockDto
{
    public string IpOrCidr { get; set; } = null!;
    public string? Reason { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}