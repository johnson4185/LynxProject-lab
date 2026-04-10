using System;
using System.Collections.Generic;

namespace Lynx.Api.Domain.Entities;

public partial class AdminUser
{
    public long Id { get; set; }

    public string? Email { get; set; }

    public string? PasswordHash { get; set; }

    public string? Role { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAtUtc { get; set; }

    public int? FailedLoginAttempts { get; set; }

    public DateTime? LockedUntil { get; set; }
}
