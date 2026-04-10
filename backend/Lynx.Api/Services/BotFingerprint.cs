using System.Security.Cryptography;
using System.Text;

namespace Lynx.Api.Security;

public static class BotFingerprint
{
    public static string Compute(HttpContext ctx, string tenantId)
    {
        var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "";
        var ua = ctx.Request.Headers["User-Agent"].ToString();
        var al = ctx.Request.Headers["Accept-Language"].ToString();

        // If behind gateway/proxy, you may prefer X-Forwarded-For first
        var xff = ctx.Request.Headers["X-Forwarded-For"].ToString();

        var raw = $"{tenantId}|{ip}|{xff}|{ua}|{al}";
        var bytes = Encoding.UTF8.GetBytes(raw);

        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant(); // 64 hex chars
    }

    public static int Score(HttpContext ctx)
    {
        var ua = ctx.Request.Headers["User-Agent"].ToString();

        // Very basic heuristic — upgrade later
        if (string.IsNullOrWhiteSpace(ua)) return 50;
        if (ua.Contains("curl", StringComparison.OrdinalIgnoreCase)) return 40;
        if (ua.Contains("python", StringComparison.OrdinalIgnoreCase)) return 40;
        if (ua.Contains("insomnia", StringComparison.OrdinalIgnoreCase)) return 10; // dev tool
        if (ua.Contains("postman", StringComparison.OrdinalIgnoreCase)) return 10;  // dev tool

        return 0;
    }
}