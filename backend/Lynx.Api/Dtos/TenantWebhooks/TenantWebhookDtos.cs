namespace Lynx.Api.DTOs.TenantWebhooks;

public sealed class CreateTenantWebhookDto
{
    public string Url { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public string? Secret { get; set; }
}

public sealed class UpdateTenantWebhookDto
{
    public string? Url { get; set; }
    public bool? IsActive { get; set; }
    public string? Secret { get; set; }
}

public sealed class TenantWebhookResponseDto
{
    public long Id { get; set; }
    public string TenantId { get; set; } = default!;
    public string Url { get; set; } = default!;
    public bool IsActive { get; set; }
    public string? Secret { get; set; }
    public DateTime? CreatedAtUtc { get; set; }
}