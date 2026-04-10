using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantWebhook
{
    public long Id { get; set; }

    public string? TenantId { get; set; }

    public string Url { get; set; } = null!;

    public bool? IsActive { get; set; }

    public string? Secret { get; set; }

    public DateTime? CreatedAtUtc { get; set; }

    public virtual ICollection<WebhookDeliveryLog> WebhookDeliveryLogs { get; set; } = new List<WebhookDeliveryLog>();
}
