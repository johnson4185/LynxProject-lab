using System.Collections.Concurrent;
using System.Text;

namespace Lynx.Api.Observability;



public class AppMetrics : IAppMetrics
{
    private readonly ConcurrentDictionary<string, long> _counters = new();
    private readonly ConcurrentDictionary<string, (long count, long totalMs, long maxMs)> _timers = new();

    public void Inc(string name, long value = 1)
        => _counters.AddOrUpdate(name, value, (_, cur) => cur + value);

    public void ObserveMs(string name, long ms)
    {
        _timers.AddOrUpdate(
            name,
            _ => (1, ms, ms),
            (_, cur) => (cur.count + 1, cur.totalMs + ms, Math.Max(cur.maxMs, ms)));
    }

    public string RenderPrometheus()
    {
        var sb = new StringBuilder();

        foreach (var kv in _counters.OrderBy(x => x.Key))
        {
            sb.AppendLine($"# TYPE {kv.Key} counter");
            sb.AppendLine($"{kv.Key} {kv.Value}");
        }

        foreach (var kv in _timers.OrderBy(x => x.Key))
        {
            var (count, totalMs, maxMs) = kv.Value;
            var avg = count == 0 ? 0 : (double)totalMs / count;

            sb.AppendLine($"# TYPE {kv.Key}_count counter");
            sb.AppendLine($"{kv.Key}_count {count}");

            sb.AppendLine($"# TYPE {kv.Key}_avg_ms gauge");
            sb.AppendLine($"{kv.Key}_avg_ms {avg:0.###}");

            sb.AppendLine($"# TYPE {kv.Key}_max_ms gauge");
            sb.AppendLine($"{kv.Key}_max_ms {maxMs}");
        }

        return sb.ToString();
    }
}