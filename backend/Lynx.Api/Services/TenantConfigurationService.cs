using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Lynx.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services;

public class TenantConfigurationService : ITenantConfigurationService
{
    private readonly AppDbContext _db;

    public TenantConfigurationService(AppDbContext db) => _db = db;

    // ============================
    // ✅ Entity methods (for middleware)
    // ============================

    public async Task<TenantConfiguration?> GetEntityAsync(string tenantId)
    {
        return await _db.Set<TenantConfiguration>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId);
    }

    public async Task<TenantConfiguration> EnsureDefaultEntityAsync(string tenantId)
    {
        var existing = await _db.Set<TenantConfiguration>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId);

        if (existing != null) return existing;

        var now = DateTime.UtcNow;

        var entity = new TenantConfiguration
        {
            TenantId = tenantId,
            IsActive = true,
            IsSuspended = false,
            PlanCode = "FREE",

            Timezone = null,
            DefaultLinkExpiryMinutes = 60,
            AllowCustomDomains = false,
            CustomDomain = null,

            RedirectLimitPerMinute = 120,
            CreateLimitPerMinute = 30,
            MonthlyLinksQuota = 10000,
            MonthlyClicksQuota = 100000,

            AutoBlockEnabled = true,
            AutoBlockThreshold = 5,
            AutoBlockWindowSeconds = 300,
            AutoBlockTtlSeconds = 1800,
            BotScoreThreshold = 40,

            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _db.Add(entity);
        await _db.SaveChangesAsync();

        return entity;
    }

    // ============================
    // DTO methods (for controllers)
    // ============================

    public async Task<TenantConfigurationResponseDto?> GetAsync(string tenantId)
    {
        var cfg = await _db.Set<TenantConfiguration>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId);

        return cfg == null ? null : Map(cfg);
    }

    public async Task<TenantConfigurationResponseDto> EnsureDefaultAsync(string tenantId)
    {
        var entity = await EnsureDefaultEntityAsync(tenantId);
        return Map(entity);
    }

    public async Task<(bool ok, string? error, TenantConfigurationResponseDto? data)> CreateAsync(CreateTenantConfigurationDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.TenantId))
            return (false, "TenantId is required.", null);

        var exists = await _db.Set<TenantConfiguration>()
            .AnyAsync(x => x.TenantId == dto.TenantId);

        if (exists)
            return (false, "Tenant configuration already exists.", null);

        var now = DateTime.UtcNow;

        var entity = new TenantConfiguration
        {
            TenantId = dto.TenantId.Trim(),

            IsActive = dto.IsActive ?? true,
            IsSuspended = dto.IsSuspended ?? false,
            PlanCode = string.IsNullOrWhiteSpace(dto.PlanCode) ? "FREE" : dto.PlanCode.Trim(),

            Timezone = dto.Timezone?.Trim(),
            DefaultLinkExpiryMinutes = Clamp(dto.DefaultLinkExpiryMinutes ?? 60, 5, 60 * 24 * 30),
            AllowCustomDomains = dto.AllowCustomDomains ?? false,
            CustomDomain = dto.CustomDomain?.Trim(),

            RedirectLimitPerMinute = 120,
            CreateLimitPerMinute = 30,
            MonthlyLinksQuota = 10000,
            MonthlyClicksQuota = 100000,

            AutoBlockEnabled = true,
            AutoBlockThreshold = 5,
            AutoBlockWindowSeconds = 300,
            AutoBlockTtlSeconds = 1800,
            BotScoreThreshold = 40,

            Metadata = dto.Metadata,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _db.Add(entity);
        await _db.SaveChangesAsync();

        return (true, null, Map(entity));
    }

    public async Task<(bool ok, string? error, TenantConfigurationResponseDto? data)> PatchUpdateAsync(string tenantId, UpdateTenantConfigurationDto dto)
    {
        var entity = await _db.Set<TenantConfiguration>()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId);

        if (entity == null)
            return (false, "Tenant configuration not found.", null);

        if (dto == null)
            return (false, "Invalid payload.", null);

        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        if (dto.IsSuspended.HasValue) entity.IsSuspended = dto.IsSuspended.Value;

        if (!string.IsNullOrWhiteSpace(dto.PlanCode)) entity.PlanCode = dto.PlanCode.Trim();
        if (dto.Timezone != null) entity.Timezone = dto.Timezone.Trim();

        if (dto.DefaultLinkExpiryMinutes.HasValue)
            entity.DefaultLinkExpiryMinutes = Clamp(dto.DefaultLinkExpiryMinutes.Value, 5, 60 * 24 * 30);

        if (dto.AllowCustomDomains.HasValue) entity.AllowCustomDomains = dto.AllowCustomDomains.Value;
        if (dto.CustomDomain != null) entity.CustomDomain = dto.CustomDomain.Trim();

        if (dto.RedirectLimitPerMinute.HasValue) entity.RedirectLimitPerMinute = Clamp(dto.RedirectLimitPerMinute.Value, 1, 100000);
        if (dto.CreateLimitPerMinute.HasValue) entity.CreateLimitPerMinute = Clamp(dto.CreateLimitPerMinute.Value, 1, 100000);
        if (dto.MonthlyLinksQuota.HasValue) entity.MonthlyLinksQuota = Clamp(dto.MonthlyLinksQuota.Value, 0, int.MaxValue);
        if (dto.MonthlyClicksQuota.HasValue) entity.MonthlyClicksQuota = Clamp(dto.MonthlyClicksQuota.Value, 0, int.MaxValue);

        if (dto.AutoBlockEnabled.HasValue) entity.AutoBlockEnabled = dto.AutoBlockEnabled.Value;
        if (dto.AutoBlockThreshold.HasValue) entity.AutoBlockThreshold = Clamp(dto.AutoBlockThreshold.Value, 1, 100000);
        if (dto.AutoBlockWindowSeconds.HasValue) entity.AutoBlockWindowSeconds = Clamp(dto.AutoBlockWindowSeconds.Value, 10, 86400);
        if (dto.AutoBlockTtlSeconds.HasValue) entity.AutoBlockTtlSeconds = Clamp(dto.AutoBlockTtlSeconds.Value, 10, 86400);
        if (dto.BotScoreThreshold.HasValue) entity.BotScoreThreshold = Clamp(dto.BotScoreThreshold.Value, 0, 100);

        if (dto.Metadata != null) entity.Metadata = dto.Metadata;

        entity.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (true, null, Map(entity));
    }

    public async Task<TenantProfile> GetProfileAsync(string tenantId)
    {
        var cfg = await EnsureDefaultAsync(tenantId);

        var status = (!cfg.IsActive) ? "inactive"
            : (cfg.IsSuspended ? "suspended" : "active");

        return new TenantProfile(
            TenantId: cfg.TenantId,
            Status: status,
            PlanCode: cfg.PlanCode,
            Timezone: cfg.Timezone,
            DefaultLinkExpiryMinutes: cfg.DefaultLinkExpiryMinutes,
            AllowCustomDomains: cfg.AllowCustomDomains,
            CustomDomain: cfg.CustomDomain,
            RedirectLimitPerMinute: cfg.RedirectLimitPerMinute,
            CreateLimitPerMinute: cfg.CreateLimitPerMinute,
            MonthlyLinksQuota: cfg.MonthlyLinksQuota,
            MonthlyClicksQuota: cfg.MonthlyClicksQuota,
            AutoBlockEnabled: cfg.AutoBlockEnabled,
            AutoBlockThreshold: cfg.AutoBlockThreshold,
            AutoBlockWindowSeconds: cfg.AutoBlockWindowSeconds,
            AutoBlockTtlSeconds: cfg.AutoBlockTtlSeconds,
            BotScoreThreshold: cfg.BotScoreThreshold
        );
    }

    private static TenantConfigurationResponseDto Map(TenantConfiguration x) =>
        new(
            x.TenantId,
            x.IsActive,
            x.IsSuspended,
            x.PlanCode,
            x.Timezone,
            x.DefaultLinkExpiryMinutes ?? 60,
            x.AllowCustomDomains ?? false,
            x.CustomDomain,
            x.RedirectLimitPerMinute,
            x.CreateLimitPerMinute,
            x.MonthlyLinksQuota,
            x.MonthlyClicksQuota,
            x.AutoBlockEnabled,
            x.AutoBlockThreshold,
            x.AutoBlockWindowSeconds,
            x.AutoBlockTtlSeconds,
            x.BotScoreThreshold,
            x.Metadata,
            x.CreatedAtUtc,
            x.UpdatedAtUtc
        );

    private static int Clamp(int val, int min, int max) => Math.Min(Math.Max(val, min), max);
}