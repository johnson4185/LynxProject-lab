DROP TABLE IF EXISTS public.tenant_configuration;

CREATE TABLE public.tenant_configuration
(
    tenant_id varchar(100) NOT NULL PRIMARY KEY,

    -- =========================
    -- Tenant Lifecycle
    -- =========================
    is_active bool DEFAULT true NOT NULL,
    is_suspended bool DEFAULT false NOT NULL,
    plan_code varchar(50) DEFAULT 'FREE' NOT NULL,

    -- =========================
    -- Business Settings
    -- =========================
    timezone varchar(50) NULL,
    default_link_expiry_minutes int4 DEFAULT 60,
    allow_custom_domains bool DEFAULT false,
    custom_domain text NULL,

    -- =========================
    -- Limits & Quotas
    -- =========================
    redirect_limit_per_minute int4 DEFAULT 120 NOT NULL,
    create_limit_per_minute int4 DEFAULT 30 NOT NULL,

    monthly_links_quota int4 DEFAULT 10000 NOT NULL,
    monthly_clicks_quota int4 DEFAULT 100000 NOT NULL,

    -- =========================
    -- Security Controls
    -- =========================
    auto_block_enabled bool DEFAULT true NOT NULL,
    auto_block_threshold int4 DEFAULT 5 NOT NULL,
    auto_block_window_seconds int4 DEFAULT 300 NOT NULL,
    auto_block_ttl_seconds int4 DEFAULT 1800 NOT NULL,

    bot_score_threshold int4 DEFAULT 40 NOT NULL,

    -- =========================
    -- Metadata & Auditing
    -- =========================
    metadata jsonb NULL,

    created_at_utc timestamptz DEFAULT now() NOT NULL,
    updated_at_utc timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX ix_tenant_configuration_plan 
ON public.tenant_configuration (plan_code);