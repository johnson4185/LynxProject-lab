public interface IApiKeyService
{
    Task<string> CreateAsync(string tenantId, string name, string scopes);
    Task<bool> ValidateAsync(string tenantId, string apiKey);
    Task<string?> ResolveTenantAsync(string rawKey);
}