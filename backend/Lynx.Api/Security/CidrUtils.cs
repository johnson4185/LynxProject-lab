using System.Net;

namespace Lynx.Api.Security;

public static class CidrUtils
{
    public static bool IsMatch(string ipString, string cidr)
    {
        if (!IPAddress.TryParse(ipString, out var ip)) return false;

        var parts = cidr.Split('/');
        if (parts.Length != 2) return false;

        if (!IPAddress.TryParse(parts[0], out var network)) return false;
        if (!int.TryParse(parts[1], out var prefixLength)) return false;

        var ipBytes = ip.GetAddressBytes();
        var netBytes = network.GetAddressBytes();

        // Must be same address family length (IPv4 vs IPv6)
        if (ipBytes.Length != netBytes.Length) return false;

        var fullBytes = prefixLength / 8;
        var remainingBits = prefixLength % 8;

        // Compare full bytes
        for (int i = 0; i < fullBytes; i++)
            if (ipBytes[i] != netBytes[i]) return false;

        if (remainingBits == 0) return true;

        // Compare remaining bits
        int mask = 0xFF << (8 - remainingBits);
        return (ipBytes[fullBytes] & mask) == (netBytes[fullBytes] & mask);
    }
}