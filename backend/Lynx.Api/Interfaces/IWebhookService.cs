public interface IWebhookService
{
    Task TriggerAsync(string tenantId, string eventType, object payload);
}