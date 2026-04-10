using System.ComponentModel.DataAnnotations;

namespace Lynx.Api.DTOs.Domains;

public class CreateTenantDomainRequest
{
    [Required, MaxLength(200)]
    public string Domain { get; set; } = default!;

    [MaxLength(50)]
    public string? SslStatus { get; set; } // "pending" | "active" | "failed" etc
}

public class UpdateTenantDomainRequest
{
    public bool? IsVerified { get; set; }

    [MaxLength(50)]
    public string? SslStatus { get; set; }
}

public class TenantDomainResponse
{
    public long Id { get; set; }
    public string TenantId { get; set; } = default!;
    public string Domain { get; set; } = default!;
    public bool IsVerified { get; set; }
    public string? SslStatus { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class PagedResult<T>
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long Total { get; set; }
    public List<T> Items { get; set; } = new();
}