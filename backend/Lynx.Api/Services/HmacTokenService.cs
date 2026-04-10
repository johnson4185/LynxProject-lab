// using System.Security.Cryptography;
// using System.Text;
// using System.Text.Json;
// using Lynx.Api.DTOs;
// using Lynx.Api.Interfaces;

// namespace Lynx.Api.Services;

// public class HmacTokenService : IHmacTokenService
// {
//     private const int MaxTokenLength = 4096;

//     private readonly ITenantKeyProvider _keys;
//     private readonly ITokenStateStore _state;
//     private readonly IAuditService _audit;

//     public HmacTokenService(
//         ITenantKeyProvider keys,
//         ITokenStateStore state,
//         IAuditService audit)
//     {
//         _keys = keys;
//         _state = state;
//         _audit = audit;
//     }

//     public async Task<string> GenerateTokenAsync(
//         string tenantId,
//         string finalUrl,
//         DateTime expiryUtc,
//         bool oneTimeUse)
//     {
//         // NOTE: no HttpContext here by design; short-link CreateAsync already audits CREATE.
//         // We still generate token normally.
//         var signingKey = await _keys.GetSigningKeyAsync(tenantId);

//         var payload = new
//         {
//             tid = tenantId,
//             kid = signingKey.Kid,
//             jti = Guid.NewGuid().ToString("N"),
//             exp = new DateTimeOffset(expiryUtc).ToUnixTimeSeconds(),
//             url = finalUrl,
//             otu = oneTimeUse
//         };

//         var json = JsonSerializer.Serialize(payload);
//         var payloadB64 = Base64Url.Encode(Encoding.UTF8.GetBytes(json));

//         var sig = ComputeSignature(payloadB64, signingKey.SecretBytes);

//         return $"{payloadB64}.{sig}";
//     }

//     public async Task<string?> ValidateAndExtractUrlAsync(HttpContext context, string token)
//     {
//         // Always audit validation outcomes (success/failure) for security visibility.
//         if (string.IsNullOrWhiteSpace(token) || token.Length > MaxTokenLength)
//         {
//             await _audit.LogAsync(context, "unknown", "TOKEN_VALIDATE", false, null, "Invalid token format/length");
//             return null;
//         }

//         if (!TryParsePayload(token, out var p))
//         {
//             await _audit.LogAsync(context, "unknown", "TOKEN_VALIDATE", false, null, "Token payload parse failed");
//             return null;
//         }

//         // Fetch secret by kid (supports key rotation)
//         var secret = await _keys.GetSecretByKidAsync(p.Tid, p.Kid);
//         if (secret == null)
//         {
//             await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, $"Unknown kid '{p.Kid}'");
//             return null;
//         }

//         var parts = token.Split('.');
//         if (parts.Length != 2)
//         {
//             await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Invalid token structure");
//             return null;
//         }

//         var expectedSigB64 = ComputeSignature(parts[0], secret);

//         // Compare signature in constant-time on RAW BYTES (best practice)
//         byte[] providedSigBytes;
//         byte[] expectedSigBytes;
//         try
//         {
//             providedSigBytes = Base64Url.Decode(parts[1]);
//             expectedSigBytes = Base64Url.Decode(expectedSigB64);
//         }
//         catch
//         {
//             await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Signature decode failed");
//             return null;
//         }

//         if (!CryptographicOperations.FixedTimeEquals(providedSigBytes, expectedSigBytes))
//         {
//             await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Signature mismatch");
//             return null;
//         }

//         var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
//         if (p.Exp < now)
//         {
//             await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Expired");
//             return null;
//         }

//         // Blacklist check
//         if (await _state.IsBlacklistedAsync(p.Tid, p.Jti))
//         {
//             await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Blacklisted");
//             return null;
//         }

//         // One-time-use enforcement
//         if (p.Otu)
//         {
//             var ttl = TimeSpan.FromSeconds(p.Exp - now);
//             var ok = await _state.TryMarkUsedAsync(p.Tid, p.Jti, ttl);
//             if (!ok)
//             {
//                 await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "One-time token reuse attempt");
//                 return null;
//             }
//         }

//         await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", true, null, "Valid");
//         return p.Url;
//     }

//     public bool TryParsePayload(string token, out HmacTokenPayloadDto payload)
//     {
//         payload = default!;
//         var parts = token.Split('.');
//         if (parts.Length != 2) return false;

//         try
//         {
//             var json = Encoding.UTF8.GetString(Base64Url.Decode(parts[0]));
//             var doc = JsonDocument.Parse(json).RootElement;

//             payload = new HmacTokenPayloadDto(
//                 doc.GetProperty("tid").GetString()!,
//                 doc.GetProperty("kid").GetString()!,
//                 doc.GetProperty("jti").GetString()!,
//                 doc.GetProperty("exp").GetInt64(),
//                 doc.GetProperty("url").GetString()!,
//                 doc.GetProperty("otu").GetBoolean());

//             return true;
//         }
//         catch
//         {
//             return false;
//         }
//     }

//     private static string ComputeSignature(string payloadB64, byte[] secret)
//     {
//         using var hmac = new HMACSHA256(secret);
//         var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadB64));
//         return Base64Url.Encode(hash);
//     }
// }
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Lynx.Api.DTOs;
using Lynx.Api.Interfaces;

namespace Lynx.Api.Services;

public class HmacTokenService : IHmacTokenService
{
    private const int MaxTokenLength = 4096;
    private const int ClockSkewSeconds = 30;

    private readonly ITenantKeyProvider _keys;
    private readonly ITokenStateStore _state;
    private readonly IAuditService _audit;

    public HmacTokenService(
        ITenantKeyProvider keys,
        ITokenStateStore state,
        IAuditService audit)
    {
        _keys = keys;
        _state = state;
        _audit = audit;
    }

    // ======================================================
    // GENERATE TOKEN
    // ======================================================
    public async Task<string> GenerateTokenAsync(
        string tenantId,
        string finalUrl,
        DateTime expiryUtc,
        bool oneTimeUse)
    {
        var signingKey = await _keys.GetSigningKeyAsync(tenantId);

        var payload = new
        {
            tid = tenantId,
            kid = signingKey.Kid,
            jti = Guid.NewGuid().ToString("N"),
            iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            exp = new DateTimeOffset(expiryUtc).ToUnixTimeSeconds(),
            url = finalUrl,
            otu = oneTimeUse,
            typ = "shortlink",
            alg = "HS256"
        };

        var json = JsonSerializer.Serialize(payload);
        var payloadB64 = Base64Url.Encode(Encoding.UTF8.GetBytes(json));

        var sig = ComputeSignature(payloadB64, signingKey.SecretBytes);

        return $"{payloadB64}.{sig}";
    }

    // ======================================================
    // VALIDATE TOKEN
    // ======================================================
    public async Task<string?> ValidateAndExtractUrlAsync(
        HttpContext context,
        string token)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > MaxTokenLength)
        {
            await _audit.LogAsync(context, "unknown", "TOKEN_VALIDATE", false, null, "Invalid format/length");
            return null;
        }

        // Fast structural validation before parsing
        var firstDot = token.IndexOf('.');
        if (firstDot <= 0 || firstDot == token.Length - 1)
        {
            await _audit.LogAsync(context, "unknown", "TOKEN_VALIDATE", false, null, "Invalid structure");
            return null;
        }

        if (!TryParsePayload(token, out var p))
        {
            await _audit.LogAsync(context, "unknown", "TOKEN_VALIDATE", false, null, "Parse failed");
            return null;
        }

        var secret = await _keys.GetSecretByKidAsync(p.Tid, p.Kid);
        if (secret == null)
        {
            await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, $"Unknown kid '{p.Kid}'");
            return null;
        }

        var parts = token.Split('.');
        if (parts.Length != 2)
        {
            await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Invalid structure");
            return null;
        }

        var expectedSigB64 = ComputeSignature(parts[0], secret);

        byte[] providedSigBytes;
        byte[] expectedSigBytes;

        try
        {
            providedSigBytes = Base64Url.Decode(parts[1]);
            expectedSigBytes = Base64Url.Decode(expectedSigB64);
        }
        catch
        {
            await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Signature decode failed");
            return null;
        }

        if (!CryptographicOperations.FixedTimeEquals(providedSigBytes, expectedSigBytes))
        {
            await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Signature mismatch");
            return null;
        }

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        if (p.Exp < now - ClockSkewSeconds)
        {
            await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Expired");
            return null;
        }

        if (await _state.IsBlacklistedAsync(p.Tid, p.Jti))
        {
            await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "Blacklisted");
            return null;
        }

        if (p.Otu)
        {
            var remainingSeconds = p.Exp - now;
            if (remainingSeconds < 1)
                remainingSeconds = 1;

            var ttl = TimeSpan.FromSeconds(remainingSeconds);

            var ok = await _state.TryMarkUsedAsync(p.Tid, p.Jti, ttl);
            if (!ok)
            {
                await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", false, null, "One-time reuse");
                return null;
            }
        }

        await _audit.LogAsync(context, p.Tid, "TOKEN_VALIDATE", true, null, "Valid");

        return p.Url;
    }

    // ======================================================
    // PARSE PAYLOAD
    // ======================================================
    public bool TryParsePayload(string token, out HmacTokenPayloadDto payload)
    {
        payload = default!;

        var parts = token.Split('.');
        if (parts.Length != 2) return false;

        try
        {
            var jsonBytes = Base64Url.Decode(parts[0]);
            var json = Encoding.UTF8.GetString(jsonBytes);

            var doc = JsonDocument.Parse(json).RootElement;

            payload = new HmacTokenPayloadDto(
                doc.GetProperty("tid").GetString()!,
                doc.GetProperty("kid").GetString()!,
                doc.GetProperty("jti").GetString()!,
                doc.GetProperty("exp").GetInt64(),
                doc.GetProperty("url").GetString()!,
                doc.GetProperty("otu").GetBoolean()
            );

            return true;
        }
        catch
        {
            return false;
        }
    }

    // ======================================================
    // SIGNATURE
    // ======================================================
    private static string ComputeSignature(string payloadB64, byte[] secret)
    {
        using var hmac = new HMACSHA256(secret);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadB64));
        return Base64Url.Encode(hash);
    }
}