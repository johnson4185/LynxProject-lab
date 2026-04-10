using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;

namespace Lynx.Api.Middleware;

public class TenantLifecycleMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantLifecycleMiddleware> _logger;

    public TenantLifecycleMiddleware(RequestDelegate next, ILogger<TenantLifecycleMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip internal
        if (RequestScopeHelper.IsInternal(context))
        {
            await _next(context);
            return;
        }

        var correlationId = CorrelationIdAccessor.Get(context);

        if (!context.Items.TryGetValue("TenantConfig", out var obj) ||
            obj is not TenantConfigurationResponseDto config)
        {
            _logger.LogError(
                "Tenant configuration missing in pipeline. CorrelationId={CorrelationId}",
                correlationId);

            await ApiError.WriteAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "TENANT_CONFIG_MISSING",
                "Tenant configuration missing.");
            return;
        }

        var tenantId = context.Items["TenantId"]?.ToString() ?? "unknown";

        if (!config.IsActive)
        {
            _logger.LogWarning(
                "Inactive tenant access attempt. Tenant={TenantId}, CorrelationId={CorrelationId}",
                tenantId, correlationId);

            await ApiError.WriteAsync(
                context,
                StatusCodes.Status403Forbidden,
                "TENANT_INACTIVE",
                "Tenant is inactive.");
            return;
        }

        if (config.IsSuspended)
        {
            _logger.LogWarning(
                "Suspended tenant access attempt. Tenant={TenantId}, CorrelationId={CorrelationId}",
                tenantId, correlationId);

            await ApiError.WriteAsync(
                context,
                StatusCodes.Status403Forbidden,
                "TENANT_SUSPENDED",
                "Tenant is suspended.");
            return;
        }

        await _next(context);
    }
}