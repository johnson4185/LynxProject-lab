using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Lynx.Api.Infrastructure.Correlation;
using Lynx.Api.Interfaces;
using MaxMind.GeoIP2;
using Microsoft.EntityFrameworkCore;
using UAParser;

namespace Lynx.Services;

public class ClickEventService : IClickEventService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ClickEventService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task LogAsync(
        HttpContext context,
        string tenantId,
        string shortCode,
        bool success,
        string? reason = null)
    {
        try
        {
            var ip = GetClientIp(context);
            var userAgent = context.Request.Headers["User-Agent"].ToString();
            var referer = context.Request.Headers["Referer"].ToString();

            // -------------------------
            // Device Detection
            // -------------------------
            var parser = Parser.GetDefault();
            var clientInfo = parser.Parse(userAgent);

            var deviceType = clientInfo.Device.Family;
            var browser = clientInfo.UA.Family;
            var os = clientInfo.OS.Family;

            // -------------------------
            // Geo Detection
            // -------------------------
            string? country = null;
            string? city = null;

            try
            {
                var dbPath = Path.Combine(_env.ContentRootPath, "App_Data", "GeoLite2-City.mmdb");

                if (File.Exists(dbPath) && !string.IsNullOrWhiteSpace(ip))
                {
                    using var reader = new DatabaseReader(dbPath);
                    var geo = reader.City(ip);

                    country = geo.Country?.Name;
                    city = geo.City?.Name;
                }
            }
            catch
            {
                // Never break redirect flow
            }

            // -------------------------
            // Bot Scoring (Basic Heuristic)
            // -------------------------
            int botScore = 0;

            if (string.IsNullOrWhiteSpace(userAgent))
                botScore += 30;

            if (userAgent.Contains("bot", StringComparison.OrdinalIgnoreCase))
                botScore += 40;

            if (userAgent.Contains("crawler", StringComparison.OrdinalIgnoreCase))
                botScore += 40;

            if (!success)
                botScore += 10;

            // -------------------------
            // Risk Score
            // -------------------------
            int riskScore = botScore;

            // If too many failures from same IP in last 5 minutes
            if (!string.IsNullOrWhiteSpace(ip))
            {
                var recentFailures = await _db.Set<ShortLinkClickEvent>()
                    .AsNoTracking()
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.IpAddress == ip &&
                        !x.Success &&
                        x.CreatedAtUtc >= DateTime.UtcNow.AddMinutes(-5))
                    .CountAsync();

                if (recentFailures > 5)
                    riskScore += 30;
            }

            bool blocked = riskScore >= 60;

            // -------------------------
            // Save Click Event
            // -------------------------
            var entity = new ShortLinkClickEvent
            {
                TenantId = tenantId,
                ShortCode = shortCode,
                Success = success,
                Reason = reason,
                IpAddress = ip,
                UserAgent = userAgent,
                Referer = referer,
                CorrelationId = CorrelationIdAccessor.Get(context),
                CreatedAtUtc = DateTime.UtcNow,

                Country = country,
                City = city,
                DeviceType = deviceType,
                Browser = browser,
                Os = os,
                BotScore = botScore,
                RiskScore = riskScore,
                Blocked = blocked
            };

            _db.Add(entity);
            await _db.SaveChangesAsync();
        }
        catch
        {
            // NEVER break redirect flow
        }
    }

    private static string? GetClientIp(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
            return forwarded.ToString().Split(',')[0].Trim();

        return context.Connection.RemoteIpAddress?.ToString();
    }
}