using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using StackExchange.Redis;

namespace Lynx.Api.Middleware;

public class TenantRateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<TenantRateLimitMiddleware> _logger;

    public TenantRateLimitMiddleware(RequestDelegate next, IConnectionMultiplexer redis, ILogger<TenantRateLimitMiddleware> logger)
    {
        _next = next;
        _redis = redis;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!RequestScopeHelper.ShouldApplyAbuseControls(context))
        {
            await _next(context);
            return;
        }

        var routeType = RequestScopeHelper.GetRateLimitRouteType(context);
        if (routeType == RateLimitRouteType.None)
        {
            await _next(context);
            return;
        }

        var correlationId = CorrelationIdAccessor.Get(context);

        if (!context.Items.TryGetValue("TenantConfig", out var obj) ||
            obj is not TenantConfigurationResponseDto config)
        {
            _logger.LogError("Tenant config missing in rate limit middleware. CorrelationId={CorrelationId}", correlationId);
            await ApiError.WriteAsync(context, 500, "TENANT_CONFIG_MISSING", "Tenant configuration missing.");
            return;
        }

        var tenantId = context.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(context, 400, "TENANT_REQUIRED", "Tenant context missing.");
            return;
        }

        try
        {
            var db = _redis.GetDatabase();

            var fingerprint =
                context.Items.TryGetValue("fingerprint", out var fpObj) && fpObj is string fp && !string.IsNullOrWhiteSpace(fp)
                    ? fp
                    : context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded)
                        ? forwarded.ToString().Split(',')[0].Trim()
                        : context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var bucket = DateTime.UtcNow.ToString("yyyyMMddHHmm");

            var routeKey = routeType == RateLimitRouteType.Redirect ? "redirect" : "create";
            var limit = routeType == RateLimitRouteType.Redirect ? config.RedirectLimitPerMinute : config.CreateLimitPerMinute;

            var key = $"ratelimit:{tenantId}:{routeKey}:{bucket}:{fingerprint}";

            var count = await db.StringIncrementAsync(key);
            if (count == 1) await db.KeyExpireAsync(key, TimeSpan.FromMinutes(1));

            if (count > limit)
            {
                _logger.LogWarning(
                    "Tenant rate limit exceeded. Tenant={TenantId}, Route={RouteKey}, Count={Count}, Limit={Limit}, CorrelationId={CorrelationId}",
                    tenantId, routeKey, count, limit, correlationId);

                context.Response.Headers["Retry-After"] = "60";
                await ApiError.WriteAsync(context, 429, "TENANT_RATE_LIMIT_EXCEEDED", $"Rate limit exceeded for {routeKey}.");
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Redis rate limit failure. Tenant={TenantId}, CorrelationId={CorrelationId}",
                tenantId, correlationId);

            // ✅ fail-open
        }

        await _next(context);
    }
}