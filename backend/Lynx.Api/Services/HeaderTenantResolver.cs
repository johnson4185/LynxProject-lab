public class HeaderTenantResolver : ITenantResolver
{
    public string ResolveTenantId(HttpContext ctx)
    {
        if (ctx.Request.Headers.TryGetValue("X-Tenant-Id", out var tid))
            return tid.ToString().ToLower();

        return "mindivra";
    }
}