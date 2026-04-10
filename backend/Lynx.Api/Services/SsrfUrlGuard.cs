using System.Net;
using System.Net.Sockets;

namespace Lynx.Api.Services;

public static class SsrfUrlGuard
{
    public static async Task<(bool Allowed, string Reason)> IsAllowedAsync(
        string url,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            return (false, "FinalUrl is required.");

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return (false, "FinalUrl must be a valid absolute URL.");

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            return (false, "Only http/https URLs are allowed.");

        // Block localhost hostnames early
        var host = uri.Host.Trim().ToLowerInvariant();
        if (host == "localhost" || host.EndsWith(".localhost"))
            return (false, "localhost is not allowed.");

        // If host is already an IP, check directly
        if (IPAddress.TryParse(host, out var ip))
        {
            if (IsBlockedIp(ip))
                return (false, $"Blocked IP address: {ip}");
            return (true, "OK");
        }

        // Resolve DNS and block if any IP is private/link-local/etc
        IPAddress[] addresses;
        try
        {
            addresses = await Dns.GetHostAddressesAsync(host, ct);
        }
        catch
        {
            return (false, "Host could not be resolved.");
        }

        if (addresses == null || addresses.Length == 0)
            return (false, "Host could not be resolved.");

        foreach (var addr in addresses)
        {
            // Skip non-IP (shouldn't happen)
            if (addr.AddressFamily != AddressFamily.InterNetwork &&
                addr.AddressFamily != AddressFamily.InterNetworkV6)
                continue;

            if (IsBlockedIp(addr))
                return (false, $"Host resolves to blocked IP: {addr}");
        }

        return (true, "OK");
    }

    private static bool IsBlockedIp(IPAddress ip)
    {
        if (IPAddress.IsLoopback(ip))
            return true;

        if (ip.AddressFamily == AddressFamily.InterNetwork)
        {
            var b = ip.GetAddressBytes();
            // 10.0.0.0/8
            if (b[0] == 10) return true;
            // 172.16.0.0/12 => 172.16.0.0 - 172.31.255.255
            if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return true;
            // 192.168.0.0/16
            if (b[0] == 192 && b[1] == 168) return true;
            // 169.254.0.0/16 (link-local, includes cloud metadata patterns)
            if (b[0] == 169 && b[1] == 254) return true;
            // 0.0.0.0/8
            if (b[0] == 0) return true;
            // 100.64.0.0/10 (CGNAT)
            if (b[0] == 100 && b[1] >= 64 && b[1] <= 127) return true;
        }
        else if (ip.AddressFamily == AddressFamily.InterNetworkV6)
        {
            // ::1 handled by loopback above; cover ULA fc00::/7 and link-local fe80::/10
            var b = ip.GetAddressBytes();
            // fc00::/7 => first byte 0xFC or 0xFD
            if (b[0] == 0xFC || b[0] == 0xFD) return true;
            // fe80::/10 => first byte 0xFE and (second byte & 0xC0) == 0x80
            if (b[0] == 0xFE && (b[1] & 0xC0) == 0x80) return true;
        }

        return false;
    }
}