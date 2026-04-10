public record SigningKey(string TenantId, string Kid, byte[] SecretBytes);

public interface ITenantKeyProvider
{
    Task<SigningKey> GetSigningKeyAsync(string tenantId);
    Task<byte[]?> GetSecretByKidAsync(string tenantId, string kid);
}