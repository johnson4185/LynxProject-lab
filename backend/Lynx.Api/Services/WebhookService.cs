using System.Text;
using System.Text.Json;
using Lynx.Api.Domain.Entities;
using Lynx.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

public class WebhookService : IWebhookService
{
    private readonly AppDbContext _db;
    private readonly HttpClient _http;

    public WebhookService(AppDbContext db, IHttpClientFactory factory)
    {
        _db = db;
        _http = factory.CreateClient();
    }

    public async Task TriggerAsync(string tenantId, string eventType, object payload)
    {
        var hooks = await _db.Set<TenantWebhook>()
            .Where(x => x.TenantId == tenantId && x.IsActive==true)
            .ToListAsync();

        foreach (var hook in hooks)
        {
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync(hook.Url, content);

            _db.Add(new WebhookDeliveryLog
            {
                TenantId = tenantId,
                WebhookId = hook.Id,
                EventType = eventType,
                Payload = json,
                Status = response.IsSuccessStatusCode ? "Success" : "Failed",
                ResponseCode = (int)response.StatusCode
            });
        }

        await _db.SaveChangesAsync();
    }
}