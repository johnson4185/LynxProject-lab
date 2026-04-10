namespace Lynx.Api.Infrastructure;

public static class TenantCacheKeys
{
    public static string Config(string tenantId)
        => $"tenant-config:{tenantId}";
}