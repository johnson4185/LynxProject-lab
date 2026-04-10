namespace Lynx.Api.Infrastructure.Middleware;

public class CorrelationIdMiddleware
{
    public const string HeaderName = "X-Correlation-Id";

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(HeaderName, out var incoming) &&
                            !string.IsNullOrWhiteSpace(incoming.ToString())
            ? incoming.ToString().Trim()
            : Guid.NewGuid().ToString("N");

        // Store for downstream usage
        context.Items[HeaderName] = correlationId;

        // 🔥 Sync with TraceIdentifier
        context.TraceIdentifier = correlationId;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = correlationId;
            return Task.CompletedTask;
        });

        await _next(context);
    }
}