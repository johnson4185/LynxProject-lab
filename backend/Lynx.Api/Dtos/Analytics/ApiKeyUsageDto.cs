namespace Lynx.Api.DTOs.Analytics;

public class ApiKeyUsageDto
{
    public string ApiKeyIdOrHint { get; set; } = "";
    public long Calls { get; set; }
}