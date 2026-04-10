namespace Lynx.Api.DTOs.Analytics;

public class TimeSeriesPointDto
{
    public DateTime BucketUtc { get; set; }
    public long Count { get; set; }
}