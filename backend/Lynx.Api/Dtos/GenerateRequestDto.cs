namespace Lynx.Api.DTOs;

public class GenerateRequestDto
{
    public string FinalUrl { get; set; } = default!;
    public int ExpiryMinutes { get; set; } = 10;
    public bool OneTimeUse { get; set; } = true;
}