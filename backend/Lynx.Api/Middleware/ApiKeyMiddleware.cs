using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;

namespace Lynx.Api.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyMiddleware> _logger;

    public ApiKeyMiddleware(
        RequestDelegate next,
        ILogger<ApiKeyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(
        HttpContext context,
        IApiKeyService apiKeyService)
    {
        var correlationId = CorrelationIdAccessor.Get(context);

        // ======================================================
        // Skip internal endpoints (health, swagger, metrics)
        // ======================================================
        if (RequestScopeHelper.IsInternal(context))
        {
            await _next(context);
            return;
        }

        // ======================================================
        // Skip public redirect endpoints
        // ======================================================
        if (RequestScopeHelper.IsPublicRedirect(context))
        {
            await _next(context);
            return;
        }

        // ======================================================
        // Apply only to machine APIs (/api/v1)
        // ======================================================
        if (!RequestScopeHelper.IsMachineApi(context))
        {
            await _next(context);
            return;
        }

        // ======================================================
        // Validate API Key
        // ======================================================
        if (!context.Request.Headers.TryGetValue("X-API-Key", out var key))
        {
            _logger.LogWarning(
                "Missing API key. Path={Path}, CorrelationId={CorrelationId}",
                context.Request.Path,
                correlationId);

            await ApiError.WriteAsync(
                context,
                StatusCodes.Status401Unauthorized,
                "API_KEY_MISSING",
                "Missing API key.");
            return;
        }

        var rawKey = key.ToString();

        try
        {
            var tenantId = await apiKeyService.ResolveTenantAsync(rawKey);

            if (string.IsNullOrWhiteSpace(tenantId))
            {
                _logger.LogWarning(
                    "Invalid API key attempt. Path={Path}, CorrelationId={CorrelationId}",
                    context.Request.Path,
                    correlationId);

                await ApiError.WriteAsync(
                    context,
                    StatusCodes.Status401Unauthorized,
                    "API_KEY_INVALID",
                    "Invalid or expired API key.");
                return;
            }

            // Inject tenant
            context.Items["TenantId"] = tenantId;

            _logger.LogInformation(
                "API key validated. Tenant={TenantId}, CorrelationId={CorrelationId}",
                tenantId,
                correlationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "API key validation failure. CorrelationId={CorrelationId}",
                correlationId);

            await ApiError.WriteAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "API_KEY_VALIDATION_ERROR",
                "API key validation failed.");
            return;
        }

        await _next(context);
    }
}