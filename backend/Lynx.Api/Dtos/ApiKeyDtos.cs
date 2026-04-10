namespace Lynx.Api.DTOs.ApiKeys;

public class CreateApiKeyRequest
{
    public string Name { get; set; } = null!;
    public string? Scopes { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public int? RateLimitPerMinute { get; set; }
}

public record ApiKeyResponse(
    Guid KeyId,
    string Name,
    string? Scopes,
    bool IsActive,
    long UsageCount,
    DateTime? LastUsedAtUtc,
    DateTime? ExpiresAtUtc,
    DateTime CreatedAtUtc,
    int? RateLimitPerMinute
);
public class ApiKeySearchDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? IsActive { get; set; }
}