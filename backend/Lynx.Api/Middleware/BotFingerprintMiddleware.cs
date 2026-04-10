using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;
using Lynx.Api.Security;
using StackExchange.Redis;

namespace Lynx.Api.Middleware;

public class BotFingerprintMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<BotFingerprintMiddleware> _logger;

    public BotFingerprintMiddleware(
        RequestDelegate next,
        ILogger<BotFingerprintMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(
        HttpContext context,
        ITenantResolver tenantResolver,
        IConnectionMultiplexer redis,
        IAuditService auditService)
    {
        // ======================================================
        // Apply ONLY to public traffic (abuse control layer)
        // ======================================================
        if (!RequestScopeHelper.ShouldApplyAbuseControls(context))
        {
            await _next(context);
            return;
        }

        string tenantId;

        try
        {
            tenantId = tenantResolver.ResolveTenantId(context);
        }
        catch
        {
            await ApiError.WriteAsync(
                context,
                StatusCodes.Status400BadRequest,
                "TENANT_REQUIRED",
                "Tenant header is missing.");
            return;
        }

        var correlationId = CorrelationIdAccessor.Get(context);

        // ======================================================
        // Compute fingerprint
        // ======================================================
        var fingerprint = BotFingerprint.Compute(context, tenantId);

        // Make fingerprint visible downstream (rate limiter)
        context.Items["fingerprint"] = fingerprint;

        var score = BotFingerprint.Score(context);

        if (score > 0)
        {
            try
            {
                var db = redis.GetDatabase();
                var key = $"bot:{tenantId}:{fingerprint}";

                var count = await db.StringIncrementAsync(key);

                if (count == 1)
                    await db.KeyExpireAsync(key, TimeSpan.FromMinutes(30));

                _logger.LogWarning(
                    "Bot activity detected. Tenant={TenantId}, Fingerprint={Fingerprint}, Score={Score}, Count={Count}, CorrelationId={CorrelationId}",
                    tenantId,
                    fingerprint,
                    score,
                    count,
                    correlationId);

                // Audit only at milestones
                if (count == 1 || count == 5 || count == 10)
                {
                    await auditService.LogAsync(
                        context,
                        tenantId,
                        "SECURITY",
                        false,
                        null,
                        $"BotScore={score}, Count={count}");
                }

                // Enforcement threshold
                if (count >= 20)
                {
                    await ApiError.WriteAsync(
                        context,
                        StatusCodes.Status403Forbidden,
                        "BOT_DETECTED",
                        "Suspicious automated activity detected.");
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "BotFingerprintMiddleware Redis failure. Tenant={TenantId}, CorrelationId={CorrelationId}",
                    tenantId,
                    correlationId);

                // Fail-open strategy
                // Never block if Redis fails
            }
        }

        await _next(context);
    }
}