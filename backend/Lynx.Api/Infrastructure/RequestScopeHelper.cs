using Microsoft.AspNetCore.Http;

namespace Lynx.Api.Infrastructure;

public static class RequestScopeHelper
{
    public static bool IsInternal(HttpContext context)
        => context.Request.Path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase)
        || context.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase)
        || context.Request.Path.StartsWithSegments("/metrics", StringComparison.OrdinalIgnoreCase);

    public static bool IsAdminApi(HttpContext context)
        => context.Request.Path.StartsWithSegments("/api/admin", StringComparison.OrdinalIgnoreCase);

    // Strict redirect segment: /r/{code}
    public static bool IsPublicRedirect(HttpContext context)
    {
        var path = context.Request.Path;

        return path.StartsWithSegments("/r", StringComparison.OrdinalIgnoreCase)
               && path.Value?.Length > 3; // ensures something after "/r/"
    }
    public static bool IsMachineApi(HttpContext context)
        => context.Request.Path.StartsWithSegments("/api/v1", StringComparison.OrdinalIgnoreCase);

    // Support BOTH legacy + v1 routes
    public static bool IsCreateShortLinkApi(HttpContext context)
        => (context.Request.Path.StartsWithSegments("/api/short-links", StringComparison.OrdinalIgnoreCase)
            || context.Request.Path.StartsWithSegments("/api/v1/short-links", StringComparison.OrdinalIgnoreCase))
           && HttpMethods.IsPost(context.Request.Method);

    /// <summary>
    /// Apply tenant-abuse controls (tenant context, ip block, bot, quota, rate limit)
    /// to everything EXCEPT internal endpoints + admin endpoints.
    /// </summary>
    public static bool ShouldApplyAbuseControls(HttpContext context)
        => !IsInternal(context) && !IsAdminApi(context);

    /// <summary>
    /// Endpoints that require tenant context / lifecycle checks.
    /// </summary>
    public static bool ShouldApplyTenantLifecycle(HttpContext context)
        => !IsInternal(context)
           && !IsAdminApi(context)
           && (IsMachineApi(context) || IsPublicRedirect(context) || IsCreateShortLinkApi(context));

    public static RateLimitRouteType GetRateLimitRouteType(HttpContext context)
    {
        var path = context.Request.Path;
        var method = context.Request.Method;

        if (path.StartsWithSegments("/r", StringComparison.OrdinalIgnoreCase))
            return RateLimitRouteType.Redirect;

        if ((path.StartsWithSegments("/api/short-links", StringComparison.OrdinalIgnoreCase)
             || path.StartsWithSegments("/api/v1/short-links", StringComparison.OrdinalIgnoreCase))
            && HttpMethods.IsPost(method))
            return RateLimitRouteType.Create;

        return RateLimitRouteType.None;
    }
}
    