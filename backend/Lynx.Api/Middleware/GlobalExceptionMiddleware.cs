using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;

namespace Lynx.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var correlationId = CorrelationIdAccessor.Get(context);
            var tenantId = context.Items["TenantId"]?.ToString() ?? "unknown";
            var path = context.Request.Path;
            var method = context.Request.Method;

            _logger.LogError(
                ex,
                "Unhandled exception. Tenant={TenantId}, Method={Method}, Path={Path}, CorrelationId={CorrelationId}",
                tenantId,
                method,
                path,
                correlationId);

            // If response already started, do NOT try to write again
            if (context.Response.HasStarted)
            {
                _logger.LogWarning(
                    "Response already started. Skipping error write. CorrelationId={CorrelationId}",
                    correlationId);
                return;
            }

            await ApiError.WriteAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred.");
        }
    }
}