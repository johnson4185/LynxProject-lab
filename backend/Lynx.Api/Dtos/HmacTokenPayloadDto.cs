namespace Lynx.Api.DTOs;

public record HmacTokenPayloadDto(
    string Tid,
    string Kid,
    string Jti,
    long Exp,
    string Url,
    bool Otu
);