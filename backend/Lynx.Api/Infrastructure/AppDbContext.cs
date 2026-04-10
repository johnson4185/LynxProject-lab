using System;
using System.Collections.Generic;
using Lynx.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Infrastructure;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AdminUser> AdminUsers { get; set; }

    public virtual DbSet<Campaign> Campaigns { get; set; }

    public virtual DbSet<CampaignStat> CampaignStats { get; set; }

    public virtual DbSet<MvTopLinks24h> MvTopLinks24hs { get; set; }

    public virtual DbSet<RetentionJob> RetentionJobs { get; set; }

    public virtual DbSet<SecurityIncident> SecurityIncidents { get; set; }

    public virtual DbSet<ShortLink> ShortLinks { get; set; }

    public virtual DbSet<ShortLinkAuditLog> ShortLinkAuditLogs { get; set; }

    public virtual DbSet<ShortLinkClickDetail> ShortLinkClickDetails { get; set; }

    public virtual DbSet<ShortLinkClickEvent> ShortLinkClickEvents { get; set; }

    public virtual DbSet<ShortLinkDailyStat> ShortLinkDailyStats { get; set; }

    public virtual DbSet<Tenant> Tenants { get; set; }

    public virtual DbSet<TenantApiKey> TenantApiKeys { get; set; }

    public virtual DbSet<TenantBillingRecord> TenantBillingRecords { get; set; }

    public virtual DbSet<TenantConfiguration> TenantConfigurations { get; set; }

    public virtual DbSet<TenantDailyStat> TenantDailyStats { get; set; }

    public virtual DbSet<TenantDomain> TenantDomains { get; set; }

    public virtual DbSet<TenantHmacKey> TenantHmacKeys { get; set; }

    public virtual DbSet<TenantIpBlock> TenantIpBlocks { get; set; }

    public virtual DbSet<TenantUsageMonthly> TenantUsageMonthlies { get; set; }

    public virtual DbSet<TenantWebhook> TenantWebhooks { get; set; }

    public virtual DbSet<WebhookDeliveryLog> WebhookDeliveryLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresExtension("pgcrypto")
            .HasPostgresExtension("uuid-ossp");

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("admin_users_pkey");

            entity.ToTable("admin_users");

            entity.HasIndex(e => e.Email, "admin_users_email_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.Email)
                .HasMaxLength(200)
                .HasColumnName("email");
            entity.Property(e => e.FailedLoginAttempts)
                .HasDefaultValue(0)
                .HasColumnName("failed_login_attempts");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LockedUntil).HasColumnName("locked_until");
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .HasColumnName("role");
        });

        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.HasKey(e => e.CampaignId).HasName("campaigns_pkey");

            entity.ToTable("campaigns");

            entity.HasIndex(e => e.TenantId, "ix_campaigns_tenant");

            entity.HasIndex(e => new { e.TenantId, e.CreatedAtUtc }, "ix_campaigns_tenant_created").IsDescending(false, true);

            entity.HasIndex(e => new { e.TenantId, e.Name }, "ux_campaigns_tenant_name")
                .IsUnique()
                .HasFilter("(is_archived = false)");

            entity.Property(e => e.CampaignId)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("campaign_id");
            entity.Property(e => e.BudgetAmount)
                .HasPrecision(18, 2)
                .HasColumnName("budget_amount");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(150)
                .HasColumnName("created_by");
            entity.Property(e => e.Currency)
                .HasMaxLength(10)
                .HasDefaultValueSql("'USD'::character varying")
                .HasColumnName("currency");
            entity.Property(e => e.DailyClickLimit).HasColumnName("daily_click_limit");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.IsArchived)
                .HasDefaultValue(false)
                .HasColumnName("is_archived");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'draft'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.TotalClickLimit).HasColumnName("total_click_limit");
            entity.Property(e => e.UpdatedAtUtc).HasColumnName("updated_at_utc");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(150)
                .HasColumnName("updated_by");
            entity.Property(e => e.UtmCampaign)
                .HasMaxLength(150)
                .HasColumnName("utm_campaign");
            entity.Property(e => e.UtmMedium)
                .HasMaxLength(150)
                .HasColumnName("utm_medium");
            entity.Property(e => e.UtmSource)
                .HasMaxLength(150)
                .HasColumnName("utm_source");
        });

        modelBuilder.Entity<CampaignStat>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("campaign_stats_pkey");

            entity.ToTable("campaign_stats");

            entity.HasIndex(e => e.TenantId, "ix_campaign_stats_tenant");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CampaignId).HasColumnName("campaign_id");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.TotalClicks)
                .HasDefaultValue(0L)
                .HasColumnName("total_clicks");
            entity.Property(e => e.TotalLinks)
                .HasDefaultValue(0L)
                .HasColumnName("total_links");
            entity.Property(e => e.UpdatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at_utc");

            entity.HasOne(d => d.Campaign).WithMany(p => p.CampaignStats)
                .HasForeignKey(d => d.CampaignId)
                .HasConstraintName("fk_campaign_stats_campaign");
        });

        modelBuilder.Entity<MvTopLinks24h>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("mv_top_links_24h");

            entity.Property(e => e.Clicks).HasColumnName("clicks");
            entity.Property(e => e.ShortCode)
                .HasMaxLength(50)
                .HasColumnName("short_code");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<RetentionJob>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("retention_jobs_pkey");

            entity.ToTable("retention_jobs");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CompletedAtUtc).HasColumnName("completed_at_utc");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(200)
                .HasColumnName("created_by");
            entity.Property(e => e.ErrorMessage).HasColumnName("error_message");
            entity.Property(e => e.JobType)
                .HasMaxLength(50)
                .HasColumnName("job_type");
            entity.Property(e => e.RecordsDeleted).HasColumnName("records_deleted");
            entity.Property(e => e.RecordsScanned)
                .HasDefaultValue(0L)
                .HasColumnName("records_scanned");
            entity.Property(e => e.RetentionDays).HasColumnName("retention_days");
            entity.Property(e => e.StartedAtUtc).HasColumnName("started_at_utc");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasColumnName("status");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasDefaultValueSql("'default'::character varying")
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<SecurityIncident>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("security_incidents_pkey");

            entity.ToTable("security_incidents");

            entity.HasIndex(e => new { e.TenantId, e.Severity }, "ix_security_incidents_severity");

            entity.HasIndex(e => new { e.TenantId, e.CreatedAtUtc }, "ix_security_incidents_tenant_created").IsDescending(false, true);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.Details).HasColumnName("details");
            entity.Property(e => e.Fingerprint).HasColumnName("fingerprint");
            entity.Property(e => e.IncidentType)
                .HasMaxLength(100)
                .HasColumnName("incident_type");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(100)
                .HasColumnName("ip_address");
            entity.Property(e => e.Severity)
                .HasMaxLength(50)
                .HasColumnName("severity");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<ShortLink>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("short_links_pkey");

            entity.ToTable("short_links");

            entity.HasIndex(e => new { e.IsActive, e.ExpiryUtc }, "ix_short_links_active_expiry");

            entity.HasIndex(e => e.CampaignId, "ix_short_links_campaign");

            entity.HasIndex(e => new { e.TenantId, e.CampaignIdUuid }, "ix_short_links_campaign_uuid");

            entity.HasIndex(e => e.CreatedAtUtc, "ix_short_links_created_at");

            entity.HasIndex(e => new { e.IsActive, e.ExpiryUtc }, "ix_short_links_expiry_active");

            entity.HasIndex(e => e.ExpiryUtc, "ix_short_links_expiry_utc");

            entity.HasIndex(e => e.IsActive, "ix_short_links_is_active");

            entity.HasIndex(e => e.TenantId, "ix_short_links_tenant");

            entity.HasIndex(e => new { e.TenantId, e.CreatedAtUtc }, "ix_short_links_tenant_created").IsDescending(false, true);

            entity.HasIndex(e => e.ShortCode, "short_links_short_code_key").IsUnique();

            entity.HasIndex(e => e.ShortCode, "ux_short_links_short_code").IsUnique();

            entity.HasIndex(e => new { e.TenantId, e.ShortCode }, "ux_short_links_tenant_shortcode").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CampaignId).HasColumnName("campaign_id");
            entity.Property(e => e.CampaignIdUuid).HasColumnName("campaign_id_uuid");
            entity.Property(e => e.ClickCount)
                .HasDefaultValue(0)
                .HasColumnName("click_count");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(150)
                .HasColumnName("created_by");
            entity.Property(e => e.ExpiryUtc).HasColumnName("expiry_utc");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LastAccessedAtUtc).HasColumnName("last_accessed_at_utc");
            entity.Property(e => e.RevokedAtUtc).HasColumnName("revoked_at_utc");
            entity.Property(e => e.RevokedBy)
                .HasMaxLength(150)
                .HasColumnName("revoked_by");
            entity.Property(e => e.SecureToken).HasColumnName("secure_token");
            entity.Property(e => e.ShortCode)
                .HasMaxLength(32)
                .HasColumnName("short_code");
            entity.Property(e => e.Tags).HasColumnName("tags");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasDefaultValueSql("'mindivra'::character varying")
                .HasColumnName("tenant_id");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");

            entity.HasOne(d => d.Campaign).WithMany(p => p.ShortLinkCampaigns)
                .HasForeignKey(d => d.CampaignId)
                .HasConstraintName("fk_short_links_campaign");

            entity.HasOne(d => d.CampaignIdUu).WithMany(p => p.ShortLinkCampaignIdUus)
                .HasForeignKey(d => d.CampaignIdUuid)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_short_links_campaign_uuid");
        });

        modelBuilder.Entity<ShortLinkAuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("short_link_audit_logs_pkey");

            entity.ToTable("short_link_audit_logs");

            entity.HasIndex(e => e.CorrelationId, "ix_audit_logs_corr");

            entity.HasIndex(e => new { e.TenantId, e.CreatedAtUtc }, "ix_audit_logs_tenant_created").IsDescending(false, true);

            entity.HasIndex(e => e.CorrelationId, "ix_short_link_audit_logs_corr");

            entity.HasIndex(e => e.CreatedAtUtc, "ix_short_link_audit_logs_created");

            entity.HasIndex(e => e.ShortCode, "ix_short_link_audit_logs_short_code");

            entity.HasIndex(e => e.TenantId, "ix_short_link_audit_logs_tenant");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CampaignId).HasColumnName("campaign_id");
            entity.Property(e => e.CorrelationId)
                .HasMaxLength(64)
                .HasColumnName("correlation_id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.EventType)
                .HasMaxLength(50)
                .HasColumnName("event_type");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(100)
                .HasColumnName("ip_address");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.ShortCode)
                .HasMaxLength(50)
                .HasColumnName("short_code");
            entity.Property(e => e.Success).HasColumnName("success");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.UserAgent).HasColumnName("user_agent");
        });

        modelBuilder.Entity<ShortLinkClickDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("short_link_click_details_pkey");

            entity.ToTable("short_link_click_details");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(100)
                .HasColumnName("ip_address");
            entity.Property(e => e.Referer).HasColumnName("referer");
            entity.Property(e => e.ShortCode)
                .HasMaxLength(50)
                .HasColumnName("short_code");
            entity.Property(e => e.Success).HasColumnName("success");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.UserAgent).HasColumnName("user_agent");
        });

        modelBuilder.Entity<ShortLinkClickEvent>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("short_link_click_events_pkey");

            entity.ToTable("short_link_click_events");

            entity.HasIndex(e => new { e.TenantId, e.CampaignId }, "ix_click_events_campaign");

            entity.HasIndex(e => new { e.TenantId, e.CampaignIdUuid, e.CreatedAtUtc }, "ix_click_events_campaign_uuid").IsDescending(false, false, true);

            entity.HasIndex(e => new { e.TenantId, e.Country }, "ix_click_events_country");

            entity.HasIndex(e => e.CreatedAtUtc, "ix_click_events_created");

            entity.HasIndex(e => e.CreatedAtUtc, "ix_click_events_created_partition");

            entity.HasIndex(e => new { e.TenantId, e.DeviceType }, "ix_click_events_device");

            entity.HasIndex(e => new { e.TenantId, e.Success, e.CreatedAtUtc }, "ix_click_events_failures").IsDescending(false, false, true);

            entity.HasIndex(e => new { e.TenantId, e.CreatedAtUtc }, "ix_click_events_tenant_created").IsDescending(false, true);

            entity.HasIndex(e => new { e.TenantId, e.ShortCode }, "ix_click_events_tenant_shortcode");

            entity.HasIndex(e => new { e.TenantId, e.CreatedAtUtc }, "ix_click_success_only")
                .IsDescending(false, true)
                .HasFilter("(success = true)");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Blocked)
                .HasDefaultValue(false)
                .HasColumnName("blocked");
            entity.Property(e => e.BotScore)
                .HasDefaultValue(0)
                .HasColumnName("bot_score");
            entity.Property(e => e.Browser)
                .HasMaxLength(100)
                .HasColumnName("browser");
            entity.Property(e => e.CampaignId).HasColumnName("campaign_id");
            entity.Property(e => e.CampaignIdUuid).HasColumnName("campaign_id_uuid");
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasColumnName("city");
            entity.Property(e => e.CorrelationId)
                .HasMaxLength(64)
                .HasColumnName("correlation_id");
            entity.Property(e => e.Country)
                .HasMaxLength(100)
                .HasColumnName("country");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.DeviceType)
                .HasMaxLength(50)
                .HasColumnName("device_type");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(100)
                .HasColumnName("ip_address");
            entity.Property(e => e.Os)
                .HasMaxLength(100)
                .HasColumnName("os");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.Referer).HasColumnName("referer");
            entity.Property(e => e.RiskScore)
                .HasDefaultValue(0)
                .HasColumnName("risk_score");
            entity.Property(e => e.ShortCode)
                .HasMaxLength(50)
                .HasColumnName("short_code");
            entity.Property(e => e.Success).HasColumnName("success");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.UserAgent).HasColumnName("user_agent");
        });

        modelBuilder.Entity<ShortLinkDailyStat>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("short_link_daily_stats_pkey");

            entity.ToTable("short_link_daily_stats");

            entity.HasIndex(e => new { e.TenantId, e.StatDate }, "ix_daily_stats_tenant_date").IsDescending(false, true);

            entity.HasIndex(e => e.TenantId, "ix_short_link_daily_stats_tenant");

            entity.HasIndex(e => new { e.TenantId, e.ShortCode, e.StatDate }, "short_link_daily_stats_tenant_id_short_code_stat_date_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Clicks)
                .HasDefaultValue(0)
                .HasColumnName("clicks");
            entity.Property(e => e.Failures)
                .HasDefaultValue(0)
                .HasColumnName("failures");
            entity.Property(e => e.ShortCode)
                .HasMaxLength(50)
                .HasColumnName("short_code");
            entity.Property(e => e.StatDate).HasColumnName("stat_date");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenants_pkey");

            entity.ToTable("tenants");

            entity.HasIndex(e => e.Status, "ix_tenants_status");

            entity.HasIndex(e => e.TenantId, "tenants_tenant_id_key").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.DbMode)
                .HasMaxLength(50)
                .HasDefaultValueSql("'shared'::character varying")
                .HasColumnName("db_mode");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'active'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.TenantDbConnString).HasColumnName("tenant_db_conn_string");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.UpdatedAtUtc)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at_utc");
        });

        modelBuilder.Entity<TenantApiKey>(entity =>
        {
            entity.HasKey(e => e.KeyId).HasName("tenant_api_keys_pkey");

            entity.ToTable("tenant_api_keys");

            entity.HasIndex(e => e.TenantId, "ix_tenant_api_keys_tenant");

            entity.HasIndex(e => new { e.TenantId, e.KeyHash }, "ux_api_key_hash").IsUnique();

            entity.Property(e => e.KeyId)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("key_id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(150)
                .HasColumnName("created_by");
            entity.Property(e => e.ExpiresAtUtc).HasColumnName("expires_at_utc");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.KeyHash).HasColumnName("key_hash");
            entity.Property(e => e.LastUsedAtUtc).HasColumnName("last_used_at_utc");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.RateLimitPerMinute).HasColumnName("rate_limit_per_minute");
            entity.Property(e => e.RevokedAtUtc).HasColumnName("revoked_at_utc");
            entity.Property(e => e.Scopes).HasColumnName("scopes");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.UsageCount)
                .HasDefaultValue(0L)
                .HasColumnName("usage_count");
        });

        modelBuilder.Entity<TenantBillingRecord>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenant_billing_records_pkey");

            entity.ToTable("tenant_billing_records");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount)
                .HasPrecision(12, 2)
                .HasColumnName("amount");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.Currency)
                .HasMaxLength(10)
                .HasColumnName("currency");
            entity.Property(e => e.InvoiceNumber)
                .HasMaxLength(100)
                .HasColumnName("invoice_number");
            entity.Property(e => e.PeriodEnd).HasColumnName("period_end");
            entity.Property(e => e.PeriodStart).HasColumnName("period_start");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasColumnName("status");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<TenantConfiguration>(entity =>
        {
            entity.HasKey(e => e.TenantId).HasName("tenant_configuration_pkey");

            entity.ToTable("tenant_configuration");

            entity.HasIndex(e => e.PlanCode, "ix_tenant_configuration_plan");

            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.AllowCustomDomains)
                .HasDefaultValue(false)
                .HasColumnName("allow_custom_domains");
            entity.Property(e => e.AutoBlockEnabled)
                .HasDefaultValue(true)
                .HasColumnName("auto_block_enabled");
            entity.Property(e => e.AutoBlockThreshold)
                .HasDefaultValue(5)
                .HasColumnName("auto_block_threshold");
            entity.Property(e => e.AutoBlockTtlSeconds)
                .HasDefaultValue(1800)
                .HasColumnName("auto_block_ttl_seconds");
            entity.Property(e => e.AutoBlockWindowSeconds)
                .HasDefaultValue(300)
                .HasColumnName("auto_block_window_seconds");
            entity.Property(e => e.BotScoreThreshold)
                .HasDefaultValue(40)
                .HasColumnName("bot_score_threshold");
            entity.Property(e => e.CreateLimitPerMinute)
                .HasDefaultValue(30)
                .HasColumnName("create_limit_per_minute");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.CustomDomain).HasColumnName("custom_domain");
            entity.Property(e => e.DefaultLinkExpiryMinutes)
                .HasDefaultValue(60)
                .HasColumnName("default_link_expiry_minutes");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsSuspended)
                .HasDefaultValue(false)
                .HasColumnName("is_suspended");
            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb")
                .HasColumnName("metadata");
            entity.Property(e => e.MonthlyClicksQuota)
                .HasDefaultValue(100000)
                .HasColumnName("monthly_clicks_quota");
            entity.Property(e => e.MonthlyLinksQuota)
                .HasDefaultValue(10000)
                .HasColumnName("monthly_links_quota");
            entity.Property(e => e.PlanCode)
                .HasMaxLength(50)
                .HasDefaultValueSql("'FREE'::character varying")
                .HasColumnName("plan_code");
            entity.Property(e => e.RedirectLimitPerMinute)
                .HasDefaultValue(120)
                .HasColumnName("redirect_limit_per_minute");
            entity.Property(e => e.Timezone)
                .HasMaxLength(50)
                .HasColumnName("timezone");
            entity.Property(e => e.UpdatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at_utc");
        });

        modelBuilder.Entity<TenantDailyStat>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenant_daily_stats_pkey");

            entity.ToTable("tenant_daily_stats");

            entity.HasIndex(e => new { e.TenantId, e.StatDate }, "ix_tenant_daily_stats_tenant_date").IsDescending(false, true);

            entity.HasIndex(e => new { e.TenantId, e.StatDate }, "tenant_daily_stats_tenant_id_stat_date_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Clicks)
                .HasDefaultValue(0)
                .HasColumnName("clicks");
            entity.Property(e => e.Creates)
                .HasDefaultValue(0)
                .HasColumnName("creates");
            entity.Property(e => e.Failures)
                .HasDefaultValue(0)
                .HasColumnName("failures");
            entity.Property(e => e.Revoked)
                .HasDefaultValue(0)
                .HasColumnName("revoked");
            entity.Property(e => e.StatDate).HasColumnName("stat_date");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<TenantDomain>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenant_domains_pkey");

            entity.ToTable("tenant_domains");

            entity.HasIndex(e => e.Domain, "ux_tenant_domains_domain").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.Domain)
                .HasMaxLength(200)
                .HasColumnName("domain");
            entity.Property(e => e.IsVerified)
                .HasDefaultValue(false)
                .HasColumnName("is_verified");
            entity.Property(e => e.SslStatus)
                .HasMaxLength(50)
                .HasColumnName("ssl_status");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<TenantHmacKey>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenant_hmac_keys_pkey");

            entity.ToTable("tenant_hmac_keys");

            entity.HasIndex(e => new { e.TenantId, e.CanSign }, "ix_tenant_hmac_keys_can_sign");

            entity.HasIndex(e => e.TenantId, "ix_tenant_hmac_keys_tenant");

            entity.HasIndex(e => new { e.TenantId, e.Kid }, "ux_tenant_hmac_keys_tenant_kid").IsUnique();

            entity.HasIndex(e => e.TenantId, "ux_tenant_single_signing_key")
                .IsUnique()
                .HasFilter("(can_sign = true)");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.CanSign)
                .HasDefaultValue(true)
                .HasColumnName("can_sign");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Kid)
                .HasMaxLength(64)
                .HasColumnName("kid");
            entity.Property(e => e.RotatedAtUtc).HasColumnName("rotated_at_utc");
            entity.Property(e => e.Secret).HasColumnName("secret");
            entity.Property(e => e.TenantId)
                .HasMaxLength(64)
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<TenantIpBlock>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenant_ip_blocks_pkey");

            entity.ToTable("tenant_ip_blocks");

            entity.HasIndex(e => e.TenantId, "ix_ip_blocks_tenant");

            entity.HasIndex(e => e.TenantId, "ix_ipblock_tenant");

            entity.HasIndex(e => new { e.TenantId, e.IpOrCidr }, "ix_ipblock_tenant_ip");

            entity.HasIndex(e => new { e.TenantId, e.ExpiresAtUtc }, "ix_tenant_ip_blocks_expires");

            entity.HasIndex(e => e.TenantId, "ix_tenant_ip_blocks_tenant");

            entity.HasIndex(e => new { e.TenantId, e.IpOrCidr }, "ux_ip_blocks_tenant_ip").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(150)
                .HasColumnName("created_by");
            entity.Property(e => e.ExpiresAtUtc).HasColumnName("expires_at_utc");
            entity.Property(e => e.IpOrCidr)
                .HasMaxLength(100)
                .HasDefaultValueSql("'0.0.0.0'::character varying")
                .HasColumnName("ip_or_cidr");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
        });

        modelBuilder.Entity<TenantUsageMonthly>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenant_usage_monthly_pkey");

            entity.ToTable("tenant_usage_monthly");

            entity.HasIndex(e => new { e.TenantId, e.YearMonth }, "ix_usage_monthly_tenant");

            entity.HasIndex(e => new { e.TenantId, e.YearMonth }, "ix_usage_tenant_month");

            entity.HasIndex(e => new { e.TenantId, e.YearMonth }, "uq_tenant_usage_monthly").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Clicks)
                .HasDefaultValue(0L)
                .HasColumnName("clicks");
            entity.Property(e => e.LinksCreated)
                .HasDefaultValue(0L)
                .HasColumnName("links_created");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.UpdatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("updated_at_utc");
            entity.Property(e => e.YearMonth).HasColumnName("year_month");
        });

        modelBuilder.Entity<TenantWebhook>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tenant_webhooks_pkey");

            entity.ToTable("tenant_webhooks");

            entity.HasIndex(e => e.TenantId, "ix_tenant_webhooks_tenant");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Secret).HasColumnName("secret");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.Url).HasColumnName("url");
        });

        modelBuilder.Entity<WebhookDeliveryLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("webhook_delivery_logs_pkey");

            entity.ToTable("webhook_delivery_logs");

            entity.HasIndex(e => new { e.Status, e.NextRetryAtUtc }, "ix_webhook_retry");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at_utc");
            entity.Property(e => e.EventType)
                .HasMaxLength(100)
                .HasColumnName("event_type");
            entity.Property(e => e.NextRetryAtUtc).HasColumnName("next_retry_at_utc");
            entity.Property(e => e.Payload).HasColumnName("payload");
            entity.Property(e => e.ResponseBody).HasColumnName("response_body");
            entity.Property(e => e.ResponseCode).HasColumnName("response_code");
            entity.Property(e => e.RetryCount)
                .HasDefaultValue(0)
                .HasColumnName("retry_count");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasColumnName("status");
            entity.Property(e => e.TenantId)
                .HasMaxLength(100)
                .HasColumnName("tenant_id");
            entity.Property(e => e.WebhookId).HasColumnName("webhook_id");

            entity.HasOne(d => d.Webhook).WithMany(p => p.WebhookDeliveryLogs)
                .HasForeignKey(d => d.WebhookId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_webhook_delivery");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
