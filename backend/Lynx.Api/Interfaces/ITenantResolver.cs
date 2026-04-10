public interface ITenantResolver
{
    string ResolveTenantId(HttpContext ctx);
}