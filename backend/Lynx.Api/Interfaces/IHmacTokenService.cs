using Lynx.Api.DTOs;


namespace Lynx.Api.Services;

public interface IHmacTokenService
{
    Task<string> GenerateTokenAsync(
        string tenantId,
        string finalUrl,
        DateTime expiryUtc,
        bool oneTimeUse);

    //Task<string?> ValidateAndExtractUrlAsync(string token);
    Task<string?> ValidateAndExtractUrlAsync(
        HttpContext context,
        string token);

    bool TryParsePayload(string token, out HmacTokenPayloadDto payload);
}