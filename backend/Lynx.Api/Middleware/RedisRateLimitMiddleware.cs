using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;

namespace Lynx.Api.Middleware;

public class RedisRateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RedisRateLimitMiddleware> _logger;

    public RedisRateLimitMiddleware(
        RequestDelegate next,
        ILogger<RedisRateLimitMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(
        HttpContext context,
        ITenantResolver tenantResolver,
        IRateLimiter limiter,
        IAuditService auditService,
        ISecurityPolicyProvider policyProvider)
    {
        // ======================================================
        // Apply ONLY to abuse-control traffic
        // ======================================================
        if (!RequestScopeHelper.ShouldApplyAbuseControls(context))
        {
            await _next(context);
            return;
        }

        // ======================================================
        // Determine route type via helper
        // ======================================================
        var routeType = RequestScopeHelper.GetRateLimitRouteType(context);

        if (routeType == RateLimitRouteType.None)
        {
            await _next(context);
            return;
        }

        string tenantId;
        try
        {
            tenantId = tenantResolver.ResolveTenantId(context);
        }
        catch
        {
            await ApiError.WriteAsync(
                context,
                StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED",
                "Tenant header is missing.");
            return;
        }

        var correlationId = CorrelationIdAccessor.Get(context);

        try
        {
            var policy = await policyProvider.GetAsync(tenantId);

            // Prefer fingerprint from Bot middleware
            var fingerprint = context.Items.TryGetValue("fingerprint", out var fpObj)
                              && fpObj is string fp
                              && !string.IsNullOrWhiteSpace(fp)
                ? fp
                : context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded)
                    ? forwarded.ToString().Split(',')[0].Trim()
                    : context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var limit = routeType == RateLimitRouteType.Redirect
                ? policy.RedirectLimitPerMinute
                : policy.CreateLimitPerMinute;

            var routeKey = routeType == RateLimitRouteType.Redirect
                ? "redirect"
                : "create";

            var window = TimeSpan.FromMinutes(1);

            var (allowed, count) =
                await limiter.AllowAsync(tenantId, routeKey, fingerprint, limit, window);

            if (!allowed)
            {
                _logger.LogWarning(
                    "Rate limit exceeded. Tenant={TenantId}, Route={RouteKey}, Fingerprint={Fingerprint}, Count={Count}, Limit={Limit}, CorrelationId={CorrelationId}",
                    tenantId,
                    routeKey,
                    fingerprint,
                    count,
                    limit,
                    correlationId);

                await auditService.LogAsync(
                    context,
                    tenantId,
                    "RATE_LIMIT",
                    false,
                    null,
                    $"limit={limit}/min count={count}");

                await ApiError.WriteAsync(
                    context,
                    StatusCodes.Status429TooManyRequests,
                    "RATE_LIMIT_EXCEEDED",
                    "Too many requests.");
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Rate limiter failure. Tenant={TenantId}, CorrelationId={CorrelationId}",
                tenantId,
                correlationId);

            // 🔥 Fail-open strategy
            // Never block traffic if Redis fails
        }

        await _next(context);
    }
}