// namespace Lynx.Api.Middleware;

// public static class MiddlewareExtensions
// {
//     // ===============================
//     // EXISTING MIDDLEWARES
//     // ===============================

//     // public static IApplicationBuilder UseIpBlock(this IApplicationBuilder app)
//     //     => app.UseMiddleware<IpBlockMiddleware>();

//     public static IApplicationBuilder UseRedisRateLimiting(this IApplicationBuilder app)
//         => app.UseMiddleware<RedisRateLimitMiddleware>();

//     public static IApplicationBuilder UseBotFingerprinting(this IApplicationBuilder app)
//         => app.UseMiddleware<BotFingerprintMiddleware>();


//     // ===============================
//     // NEW SAAS TENANT MIDDLEWARES
//     // ===============================

//     public static IApplicationBuilder UseTenantContext(this IApplicationBuilder app)
//         => app.UseMiddleware<TenantContextMiddleware>();

//     public static IApplicationBuilder UseTenantLifecycle(this IApplicationBuilder app)
//         => app.UseMiddleware<TenantLifecycleMiddleware>();

//     public static IApplicationBuilder UseTenantQuota(this IApplicationBuilder app)
//         => app.UseMiddleware<TenantQuotaMiddleware>();

//     public static IApplicationBuilder UseTenantRateLimiting(this IApplicationBuilder app)
//         => app.UseMiddleware<TenantRateLimitMiddleware>();

//     public static IApplicationBuilder UseTenantSecurity(this IApplicationBuilder app)
//         => app.UseMiddleware<TenantSecurityMiddleware>();
// }

using Lynx.Api.Infrastructure.Middleware;

namespace Lynx.Api.Middleware;

public static class MiddlewareExtensions
{
    // ==========================================
    // CORE INFRASTRUCTURE
    // ==========================================

    public static IApplicationBuilder UseCorrelation(this IApplicationBuilder app)
        => app.UseMiddleware<CorrelationIdMiddleware>();

    public static IApplicationBuilder UseGlobalExceptionHandling(this IApplicationBuilder app)
        => app.UseMiddleware<GlobalExceptionMiddleware>();


    // ==========================================
    // TENANT SAAS PIPELINE
    // ==========================================

    public static IApplicationBuilder UseTenantContext(this IApplicationBuilder app)
        => app.UseMiddleware<TenantContextMiddleware>();

    public static IApplicationBuilder UseTenantLifecycle(this IApplicationBuilder app)
        => app.UseMiddleware<TenantLifecycleMiddleware>();
        

    public static IApplicationBuilder UseTenantSecurity(this IApplicationBuilder app)
        => app.UseMiddleware<TenantSecurityMiddleware>();

    public static IApplicationBuilder UseTenantRateLimiting(this IApplicationBuilder app)
        => app.UseMiddleware<TenantRateLimitMiddleware>();

    public static IApplicationBuilder UseTenantQuota(this IApplicationBuilder app)
        => app.UseMiddleware<TenantQuotaMiddleware>();


    // ==========================================
    // ADVANCED SECURITY
    // ==========================================

    public static IApplicationBuilder UseBotFingerprinting(this IApplicationBuilder app)
        => app.UseMiddleware<BotFingerprintMiddleware>();
}