using Lynx.Api.Observability;
using Microsoft.AspNetCore.Mvc;

namespace Lynx.Api.Controllers;

[ApiController]
public class MetricsController : ControllerBase
{
    private readonly IAppMetrics _metrics;
    public MetricsController(IAppMetrics metrics) => _metrics = metrics;

    [HttpGet("/metrics")]
    public IActionResult Get()
        => Content(_metrics.RenderPrometheus(), "text/plain; version=0.0.4");
}