using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;

namespace Lynx.Api.Middleware;

public class RedisBlockMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RedisBlockMiddleware> _logger;

    public RedisBlockMiddleware(
        RequestDelegate next,
        ILogger<RedisBlockMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(
        HttpContext context,
        ITenantResolver tenantResolver,
        IIPBlockCacheService ipBlockCache,
        IAuditService auditService)
    {
        // ======================================================
        // Apply ONLY to abuse-control traffic
        // ======================================================
        if (!RequestScopeHelper.ShouldApplyAbuseControls(context))
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

        // ======================================================
        // Reverse proxy safe IP detection
        // ======================================================
        var ip = context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded)
            ? forwarded.ToString().Split(',')[0].Trim()
            : context.Connection.RemoteIpAddress?.ToString() ?? "";

        if (string.IsNullOrWhiteSpace(ip))
        {
            await _next(context);
            return;
        }

        try
        {
            var blocked = await ipBlockCache.IsBlockedAsync(tenantId, ip);

            if (blocked)
            {
                _logger.LogWarning(
                    "Blocked request from IP. Tenant={TenantId}, IP={IP}, CorrelationId={CorrelationId}",
                    tenantId,
                    ip,
                    correlationId);

                await auditService.LogAsync(
                    context,
                    tenantId,
                    "ACCESS",
                    false,
                    null,
                    $"IP blocked ({ip})");

                await ApiError.WriteAsync(
                    context,
                    StatusCodes.Status403Forbidden,
                    "IP_BLOCKED",
                    "Your IP address is blocked.");
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "IP block check failed. Tenant={TenantId}, IP={IP}, CorrelationId={CorrelationId}",
                tenantId,
                ip,
                correlationId);

            // 🔥 Fail-open strategy
            // Never block traffic if Redis fails
        }

        await _next(context);
    }
}