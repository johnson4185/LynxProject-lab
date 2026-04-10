using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class Campaign
{
    public Guid CampaignId { get; set; }

    public string TenantId { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string Status { get; set; } = null!;

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public long? DailyClickLimit { get; set; }

    public long? TotalClickLimit { get; set; }

    public decimal? BudgetAmount { get; set; }

    public string Currency { get; set; } = null!;

    public string? UtmSource { get; set; }

    public string? UtmMedium { get; set; }

    public string? UtmCampaign { get; set; }

    public bool IsArchived { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public string? UpdatedBy { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public virtual ICollection<CampaignStat> CampaignStats { get; set; } = new List<CampaignStat>();

    public virtual ICollection<ShortLink> ShortLinkCampaignIdUus { get; set; } = new List<ShortLink>();

    public virtual ICollection<ShortLink> ShortLinkCampaigns { get; set; } = new List<ShortLink>();
}
