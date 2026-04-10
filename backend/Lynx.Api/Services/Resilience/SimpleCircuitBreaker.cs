namespace Lynx.Api.Services.Resilience;

public class SimpleCircuitBreaker
{
    private readonly object _lock = new();
    private int _failures;
    private DateTime? _openedAtUtc;

    public int FailureThreshold { get; }
    public TimeSpan OpenDuration { get; }

    public SimpleCircuitBreaker(int failureThreshold, TimeSpan openDuration)
    {
        FailureThreshold = Math.Max(1, failureThreshold);
        OpenDuration = openDuration <= TimeSpan.Zero ? TimeSpan.FromSeconds(10) : openDuration;
    }

    public bool IsOpen()
    {
        lock (_lock)
        {
            if (_openedAtUtc == null) return false;

            if (DateTime.UtcNow - _openedAtUtc.Value >= OpenDuration)
            {
                // half-open: allow trial
                _openedAtUtc = null;
                _failures = 0;
                return false;
            }

            return true;
        }
    }

    public void OnSuccess()
    {
        lock (_lock)
        {
            _failures = 0;
            _openedAtUtc = null;
        }
    }

    public void OnFailure()
    {
        lock (_lock)
        {
            _failures++;
            if (_failures >= FailureThreshold)
                _openedAtUtc = DateTime.UtcNow;
        }
    }
}