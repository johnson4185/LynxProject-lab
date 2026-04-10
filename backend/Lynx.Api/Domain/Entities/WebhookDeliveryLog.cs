using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class WebhookDeliveryLog
{
    public long Id { get; set; }

    public string TenantId { get; set; } = null!;

    public long WebhookId { get; set; }

    public string? EventType { get; set; }

    public string? Payload { get; set; }

    public string? Status { get; set; }

    public int? ResponseCode { get; set; }

    public string? ResponseBody { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public int? RetryCount { get; set; }

    public DateTime? NextRetryAtUtc { get; set; }

    public virtual TenantWebhook Webhook { get; set; } = null!;
}
