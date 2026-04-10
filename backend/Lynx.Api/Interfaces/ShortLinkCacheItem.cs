namespace Lynx.Api.Interfaces;

public sealed class ShortLinkCacheItem
{
    public string TenantId { get; init; } = default!;
    public string SecureToken { get; init; } = default!;
    public DateTime ExpiryUtc { get; init; }

    // ✅ add this
    public Guid? CampaignId { get; init; }
}