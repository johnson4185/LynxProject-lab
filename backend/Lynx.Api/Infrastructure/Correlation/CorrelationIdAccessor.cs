using Lynx.Api.Infrastructure.Middleware;

namespace Lynx.Api.Infrastructure.Correlation;

public static class CorrelationIdAccessor
{
    public static string? Get(HttpContext context)
    {
        if (context.Items.TryGetValue(CorrelationIdMiddleware.HeaderName, out var v) && v is string s)
            return s;

        if (context.Request.Headers.TryGetValue(CorrelationIdMiddleware.HeaderName, out var h))
            return h.ToString();

        return null;
    }
}