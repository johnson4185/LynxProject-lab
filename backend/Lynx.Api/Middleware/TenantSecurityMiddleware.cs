using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;

namespace Lynx.Api.Middleware;

public class TenantSecurityMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantSecurityMiddleware> _logger;

    public TenantSecurityMiddleware(RequestDelegate next, ILogger<TenantSecurityMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IIPBlockCacheService ipBlockService, IAuditService auditService)
    {
        if (!RequestScopeHelper.ShouldApplyAbuseControls(context))
        {
            await _next(context);
            return;
        }

        var correlationId = CorrelationIdAccessor.Get(context);

        if (!context.Items.TryGetValue("TenantConfig", out var obj) ||
            obj is not TenantConfigurationResponseDto)
        {
            _logger.LogError("Tenant configuration missing in TenantSecurityMiddleware. CorrelationId={CorrelationId}", correlationId);
            await ApiError.WriteAsync(context, 500, "TENANT_CONFIG_MISSING", "Tenant configuration missing.");
            return;
        }

        var tenantId = context.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(context, 400, "TENANT_REQUIRED", "Tenant context missing.");
            return;
        }

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
            var blocked = await ipBlockService.IsBlockedAsync(tenantId, ip);
            if (blocked)
            {
                _logger.LogWarning("IP blocked. Tenant={TenantId}, IP={IP}, CorrelationId={CorrelationId}", tenantId, ip, correlationId);

                await auditService.LogAsync(context, tenantId, "ACCESS", false, null, $"IP blocked ({ip})");
                await ApiError.WriteAsync(context, 403, "IP_BLOCKED", "Your IP address is blocked.");
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "IP block check failed. Tenant={TenantId}, CorrelationId={CorrelationId}", tenantId, correlationId);
            // ✅ fail-open
        }

        await _next(context);
    }
}