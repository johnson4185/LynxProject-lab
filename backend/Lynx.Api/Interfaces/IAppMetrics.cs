using System.Collections.Concurrent;
using System.Text;

namespace Lynx.Api.Observability;

public interface IAppMetrics
{
    void Inc(string name, long value = 1);
    void ObserveMs(string name, long ms);
    string RenderPrometheus();
}