using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Middleware;
using Lynx.Api.Interfaces;
using Lynx.Api.Middleware;
using Lynx.Api.Observability;
using Lynx.Api.Services;
using Lynx.Api.Services.Analytics;
using Lynx.Api.Services.Hosted;
using Lynx.Api.Services.Maintenance;
using Lynx.Api.Services.Redis;
using Lynx.Api.Services.Resilience;
using Lynx.Api.Services.Usage;
using Lynx.Services;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using YourProject.Services;

var builder = WebApplication.CreateBuilder(args);

// ======================================================
// DATABASE (PostgreSQL - Database First)
// ======================================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// ======================================================
// REDIS CONNECTION
// ======================================================
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var redisConnection =
        builder.Configuration.GetConnectionString("Redis");

    return ConnectionMultiplexer.Connect(redisConnection!);
});

// ======================================================
// MEMORY CACHE
// ======================================================
builder.Services.AddMemoryCache();

// ======================================================
// OBSERVABILITY & METRICS
// ======================================================
builder.Services.AddSingleton<IAppMetrics, AppMetrics>();
builder.Services.AddSingleton<IRedisResilience, RedisResilience>();

// ======================================================
// CORE BUSINESS SERVICES
// ======================================================
builder.Services.AddScoped<IShortLinkService, ShortLinkService>();
builder.Services.AddScoped<IShortLinkCache, RedisShortLinkCache>();
builder.Services.AddScoped<IIPWhitelistCacheService, IPWhitelistCacheService>();
builder.Services.AddScoped<IClickEventService, ClickEventService>();
builder.Services.AddScoped<ICampaignService, CampaignService>();
builder.Services.AddSingleton<ICampaignLimitStore, RedisCampaignLimitStore>(); // requires Redis mux
builder.Services.AddHostedService<CampaignLifecycleHostedService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();
builder.Services.AddScoped<IAdminLinksService, AdminLinksService>();

// ======================================================
// TENANT SERVICES
// ======================================================
builder.Services.AddScoped<ITenantResolver, HeaderTenantResolver>();
builder.Services.AddScoped<ITenantConfigurationService, TenantConfigurationService>();
builder.Services.AddScoped<ISecurityPolicyProvider, SecurityPolicyProvider>();
builder.Services.AddScoped<ITenantKeyProvider, DbTenantKeyProvider>();
builder.Services.AddScoped<ITenantDomainService, TenantDomainService>();
// ======================================================
// SECURITY SERVICES
// ======================================================
builder.Services.AddSingleton<ITokenStateStore, RedisTokenStateStore>();
builder.Services.AddScoped<IHmacTokenService, HmacTokenService>(); 
builder.Services.AddScoped<IIPBlockCacheService, IPBlockCacheService>();
builder.Services.AddScoped<IRateLimiter, RedisSlidingWindowRateLimiterHighPerf>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<ISecurityIncidentService, SecurityIncidentService>();
builder.Services.AddScoped<IApiKeyService, ApiKeyService>();

// ======================================================
// USAGE / QUOTA SERVICES
// ======================================================
builder.Services.AddScoped<IUsageMeter, RedisUsageMeter>();

// ======================================================
// REDIS SCRIPT REGISTRY (HIGH PERFORMANCE)
// ======================================================
builder.Services.AddSingleton<IRedisScriptRegistry, RedisScriptRegistry>();

// ======================================================
// BACKGROUND WORKERS
// ======================================================
builder.Services.AddHostedService<RedisScriptWarmupHostedService>();
builder.Services.AddHostedService<MaintenanceWorker>();
builder.Services.AddHostedService<RetentionWorker>();
builder.Services.AddHostedService<BlockedIpSyncHostedService>();
builder.Services.AddHostedService<UsageFlushHostedService>();

// ======================================================
// HTTP CLIENT
// ======================================================
builder.Services.AddHttpClient();

// ======================================================
// CONTROLLERS
// ======================================================
builder.Services.AddControllers();
// ======================================================
// CORS (allow frontend dev server)
// ======================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:3001", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
// ======================================================
// SWAGGER
// ======================================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ======================================================
// HEALTH CHECKS
// ======================================================
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddRedis(builder.Configuration.GetConnectionString("Redis")!);

// ======================================================
// BUILD APP
// ======================================================
var app = builder.Build();

// ======================================================
// MIDDLEWARE PIPELINE
// ======================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("FrontendDev");
// ======================================================
// CORE INFRASTRUCTURE MIDDLEWARE
// ======================================================

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();

// Optional (if protecting machine APIs)
// app.UseMiddleware<ApiKeyMiddleware>();

// ======================================================
// TENANT SAAS PIPELINE
// ======================================================

app.UseTenantContext();        // Load tenant configuration
app.UseTenantLifecycle();      // Active / suspended enforcement
app.UseTenantSecurity();       // IP blocking
app.UseBotFingerprinting();    // Bot scoring & fingerprinting
app.UseTenantRateLimiting();   // Per-minute rate limits
app.UseTenantQuota();          // Monthly quota enforcement

// ======================================================
// AUTHORIZATION
// ======================================================
app.UseAuthorization();

// ======================================================
// ENDPOINTS
// ======================================================
app.MapControllers();
app.MapHealthChecks("/health");

// ======================================================
// RUN
// ======================================================
app.Run();