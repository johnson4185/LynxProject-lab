using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace Lynx.Api.Middleware;

public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantContextMiddleware> _logger;

    public TenantContextMiddleware(RequestDelegate next, ILogger<TenantContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        ITenantResolver tenantResolver,
        ITenantConfigurationService configService,
        IMemoryCache cache)
    {
        // ✅ Skip only internal endpoints
        if (RequestScopeHelper.IsInternal(context))
        {
            await _next(context);
            return;
        }

        var correlationId = CorrelationIdAccessor.Get(context);

        string tenantId;
        try
        {
            tenantId = tenantResolver.ResolveTenantId(context);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Tenant header missing/invalid. CorrelationId={CorrelationId}", correlationId);

            await ApiError.WriteAsync(
                context,
                StatusCodes.Status400BadRequest,
                "TENANT_HEADER_MISSING",
                "Missing or invalid X-Tenant-Id header.");
            return;
        }

        var cacheKey = $"tenant-config:{tenantId}";

        try
        {
            if (!cache.TryGetValue(cacheKey, out TenantConfigurationResponseDto? cfg))
            {
                cfg = await configService.GetAsync(tenantId)
                      ?? await configService.EnsureDefaultAsync(tenantId);

                if (cfg == null)
                {
                    await ApiError.WriteAsync(
                        context,
                        StatusCodes.Status404NotFound,
                        "TENANT_NOT_FOUND",
                        "Tenant configuration not found.");
                    return;
                }

                cache.Set(cacheKey, cfg, TimeSpan.FromMinutes(5));
            }

            // ✅ Store DTO consistently
            context.Items["TenantConfig"] = cfg;
            context.Items["TenantId"] = tenantId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Tenant configuration load failed. Tenant={TenantId}, CorrelationId={CorrelationId}",
                tenantId,
                correlationId);

            await ApiError.WriteAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "TENANT_CONFIG_ERROR",
                "Failed to load tenant configuration.");
            return;
        }

        await _next(context);
    }
}