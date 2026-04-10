namespace Lynx.Api.Interfaces;

public interface IAdminDashboardService
{
    Task<object> SummaryAsync(string tenantId, DateTime from, DateTime to);
    Task<object> TopLinksAsync(string tenantId, DateTime from, DateTime to, int top, CancellationToken ct = default);
    Task<object> TopFailedIpsAsync(string tenantId, DateTime from, DateTime to, int top, CancellationToken ct = default);
}