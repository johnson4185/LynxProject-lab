using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Tenants;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Middleware;

public class TenantQuotaMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantQuotaMiddleware> _logger;

    public TenantQuotaMiddleware(RequestDelegate next, ILogger<TenantQuotaMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (!RequestScopeHelper.ShouldApplyAbuseControls(context))
        {
            await _next(context);
            return;
        }

        var correlationId = CorrelationIdAccessor.Get(context);

        if (!context.Items.TryGetValue("TenantConfig", out var obj) ||
            obj is not TenantConfigurationResponseDto config)
        {
            _logger.LogError(
                "Tenant configuration missing in quota middleware. CorrelationId={CorrelationId}",
                correlationId);

            await ApiError.WriteAsync(context, 500, "TENANT_CONFIG_MISSING", "Tenant configuration missing.");
            return;
        }

        var tenantId = context.Items["TenantId"]?.ToString();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            await ApiError.WriteAsync(context, 400, "TENANT_REQUIRED", "Tenant context missing.");
            return;
        }

        try
        {
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var linkCount = await db.Set<ShortLink>()
                .AsNoTracking()
                .Where(x => x.TenantId == tenantId && x.CreatedAtUtc >= monthStart)
                .CountAsync();

            if (linkCount >= config.MonthlyLinksQuota)
            {
                _logger.LogWarning(
                    "Monthly quota exceeded. Tenant={TenantId}, Used={Used}, Limit={Limit}, CorrelationId={CorrelationId}",
                    tenantId, linkCount, config.MonthlyLinksQuota, correlationId);

                await ApiError.WriteAsync(context, 429, "MONTHLY_LINK_QUOTA_EXCEEDED", "Monthly link quota exceeded.");
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Quota validation failed. Tenant={TenantId}, CorrelationId={CorrelationId}",
                tenantId, correlationId);

            // ✅ fail-open (do not block user if DB fails)
        }

        await _next(context);
    }
}