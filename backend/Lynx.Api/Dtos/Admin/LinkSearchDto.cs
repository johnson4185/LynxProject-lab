namespace Lynx.Api.DTOs.Admin;

public class LinkSearchDto
{
    public string? Search { get; set; }
    public string? Status { get; set; } // active|revoked|expired
    public Guid? CampaignId { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}


public class UpdateLinkDto
{
    // Partial update: only apply when not null/empty
    public string? Title { get; set; }
    public Guid? CampaignId { get; set; }
    public List<string>? Tags { get; set; }
}
public class RevokeLinkDto
{
    public string? Reason { get; set; }
}
public class BulkRevokeDto
{
    public List<string> ShortCodes { get; set; } = new();
    public string? Reason { get; set; }
}
public class LinkListItemDto
{
    public string ShortCode { get; set; } = default!;
    public string Status { get; set; } = default!; // active|revoked|expired
    public string? Title { get; set; }
    public Guid? CampaignId { get; set; }
    public int ClickCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ExpiryUtc { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastAccessedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? RevokedBy { get; set; }
     public List<string>? Tags { get; set; }
}