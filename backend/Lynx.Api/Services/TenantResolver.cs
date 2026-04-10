using Lynx.Api.Interfaces;

namespace Lynx.Api.Infrastructure;

public class TenantResolver : ITenantResolver
{
    public string ResolveTenantId(HttpContext context)
    {
        // 1) If API-key middleware was enabled later, it may inject tenant here
        if (context.Items.TryGetValue("TenantId", out var tidObj) &&
            tidObj is string tidFromItems &&
            !string.IsNullOrWhiteSpace(tidFromItems))
        {
            return tidFromItems.Trim();
        }

        // 2) Header-based tenant (your current approach)
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var headerTid))
        {
            var tid = headerTid.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(tid))
                return tid;
        }

        // 3) Optional: allow query param for local testing (comment out in prod)
        if (context.Request.Query.TryGetValue("tenantId", out var qTid))
        {
            var tid = qTid.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(tid))
                return tid;
        }

        // Fail fast (enterprise behavior)
        throw new InvalidOperationException("Missing tenant context. Provide X-Tenant-Id header.");
    }
}