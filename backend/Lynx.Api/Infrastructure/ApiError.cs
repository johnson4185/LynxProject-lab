using System.Text.Json;
using Lynx.Api.Infrastructure.Correlation;

namespace Lynx.Api.Infrastructure;

public static class ApiError
{
    public static async Task WriteAsync(
        HttpContext context,
        int statusCode,
        string errorCode,
        string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var traceId = CorrelationIdAccessor.Get(context) ?? context.TraceIdentifier;

        var response = new
        {
            success = false,
            status = statusCode,
            error = new
            {
                code = errorCode,
                message = message,
                traceId = traceId
            }
        };

        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }
}