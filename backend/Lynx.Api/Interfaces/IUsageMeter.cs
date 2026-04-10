namespace Lynx.Api.Interfaces;

public interface IUsageMeter
{
    Task IncrementLinksAsync(string tenantId, long by = 1);
    Task IncrementClicksAsync(string tenantId, long by = 1);
}