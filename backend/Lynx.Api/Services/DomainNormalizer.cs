namespace Lynx.Api.Infrastructure;

public static class DomainNormalizer
{
    public static string Normalize(string domain)
    {
        if (string.IsNullOrWhiteSpace(domain))
            throw new ArgumentException("Domain is required.");

        domain = domain.Trim();

        if (domain.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
            domain = domain["http://".Length..];

        if (domain.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            domain = domain["https://".Length..];

        domain = domain.TrimEnd('/');
        domain = domain.ToLowerInvariant();

        // No path/query/fragment
        if (domain.Contains('/') || domain.Contains('?') || domain.Contains('#'))
            throw new ArgumentException("Domain must not contain path/query/fragment.");

        // Basic sanity (not full RFC)
        if (!domain.Contains('.') || domain.StartsWith('.') || domain.EndsWith('.'))
            throw new ArgumentException("Invalid domain format.");

        return domain;
    }
}