using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class TenantBillingRecord
{
    public long Id { get; set; }

    public string? TenantId { get; set; }

    public string? InvoiceNumber { get; set; }

    public decimal? Amount { get; set; }

    public string? Currency { get; set; }

    public string? Status { get; set; }

    public DateOnly? PeriodStart { get; set; }

    public DateOnly? PeriodEnd { get; set; }

    public DateTime? CreatedAtUtc { get; set; }
}
