# Lynx.Api — Backend Context File

Comprehensive reference for integrating the Next.js frontend with the .NET 9 backend.
Generated from full source review of `c:/sniplyv2/utils/Lynx.Api/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | .NET 9 / ASP.NET Core |
| Database | PostgreSQL (EF Core 9, Database-First) |
| Cache / State | Redis (StackExchange.Redis) |
| Auth model | `X-Tenant-Id` HTTP header — no user sessions, no JWT auth |
| Admin endpoints | No authentication middleware — rely on infrastructure (VPN/firewall) |
| Observability | Custom `AppMetrics`, `CorrelationIdMiddleware` |
| SSRF protection | `SsrfUrlGuard` (async DNS resolution check on all user-supplied URLs) |

---

## Auth / Tenant Model

Every request must include:
```
X-Tenant-Id: <tenant-id>
```

- The `HeaderTenantResolver` reads this header and injects `TenantId` into `HttpContext.Items["TenantId"]`
- There is **no user login** — the API is tenant-keyed only
- Admin endpoints (`/api/admin/v1/...`) have no middleware auth; they assume network-level protection
- API keys (`TenantApiKey`) provide per-key rate limits and scopes but are an additional layer, not the primary auth mechanism

---

## Middleware Pipeline (in order)

```
HTTPS Redirect
Routing
CorrelationIdMiddleware       → injects X-Correlation-Id header
GlobalExceptionMiddleware     → catches unhandled exceptions, returns structured error
TenantContextMiddleware       → resolves X-Tenant-Id, loads TenantConfiguration into HttpContext.Items
TenantLifecycleMiddleware     → blocks if tenant IsActive=false or IsSuspended=true
TenantSecurityMiddleware      → IP block + whitelist check against Redis cache
BotFingerprintingMiddleware   → scores request as bot; blocks if above BotScoreThreshold
TenantRateLimitMiddleware     → sliding-window rate limit (CreateLimitPerMinute / RedirectLimitPerMinute)
TenantQuotaMiddleware         → monthly quota enforcement (MonthlyLinksQuota / MonthlyClicksQuota)
Authorization
MapControllers
/health endpoint (PostgreSQL + Redis health checks)
```

---

## Complete API Endpoint Table

### Short Links (Tenant)

| Method | Path | Body / Query | Description |
|---|---|---|---|
| POST | `/api/v1/short-links` | `GenerateRequestDto` | Create short link → returns `ShortLinkCreateResponseDto` with 201 |

**`GenerateRequestDto`** (body):
```json
{
  "finalUrl": "https://example.com",
  "expiryMinutes": 10,
  "oneTimeUse": false
}
```
Expiry clamped 1 min–30 days. Returns `{ shortCode, shortUrl, oneTimeUse, expiryMinutes }`.
Short URL format: `https://{host}/r/{shortCode}`

---

### Short Links (Admin)

| Method | Path | Body / Query | Description |
|---|---|---|---|
| GET | `/api/admin/v1/links` | `LinkSearchDto` (query) | Search/list links |
| GET | `/api/admin/v1/links/{shortCode}` | — | Get single link |
| PUT | `/api/admin/v1/links/{shortCode}` | `UpdateLinkDto` | Update link |
| POST | `/api/admin/v1/links/{shortCode}/extend-expiry` | `ExtendExpiryDto` | Extend expiry |
| POST | `/api/admin/v1/links/{shortCode}/revoke` | `RevokeLinkDto?` | Revoke link |
| POST | `/api/admin/v1/links/{shortCode}/activate` | — | Re-activate link |
| POST | `/api/admin/v1/links/bulk/revoke` | `BulkRevokeDto` | Bulk revoke |

---

### Redirect

| Method | Path | Description |
|---|---|---|
| GET | `/r/{shortCode}` | Redirect (bot detection, IP check, quota tracking, click event write) |

---

### HMAC Tokens

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/v1/hmac/generate` | `GenerateRequestDto` | Generate HMAC secure link (expiry capped at 60 min) |
| GET | `/api/v1/hmac/go?token=` | — | Validate + redirect (includes IP block check) |
| POST | `/api/v1/hmac/validate` | `{ token }` | Validate token, return `{ valid, url }` |
| POST | `/api/v1/hmac/inspect` | `{ token }` | Parse payload (DEBUG build only) |

**Generate response:**
```json
{
  "tenantId": "...",
  "secureUrl": "https://{host}/api/hmac/v1/go?token={token}",
  "expiresUtc": "2025-01-01T00:10:00Z",
  "expiresInMinutes": 10,
  "oneTimeUse": true
}
```

**Token format:** `{base64url(payload)}.{base64url(HMAC-SHA256-signature)}`

**Payload fields:**
```json
{
  "tid": "tenant-id",
  "kid": "key-id",
  "jti": "unique-token-id",
  "iat": 1700000000,
  "exp": 1700000600,
  "url": "https://final-destination.com",
  "otu": true,
  "typ": "shortlink",
  "alg": "HS256"
}
```

**Validation order:** format check → payload parse → `kid` lookup → signature compare (constant-time) → expiry check (30s clock skew) → blacklist check → one-time-use mark (atomic via Redis)

---

### Campaigns (Admin)

| Method | Path | Body / Query | Description |
|---|---|---|---|
| POST | `/api/admin/v1/campaigns` | `CreateCampaignDto` | Create campaign |
| GET | `/api/admin/v1/campaigns` | `CampaignSearchDto` (query) | Search campaigns |
| GET | `/api/admin/v1/campaigns/{id}` | — | Get by ID |
| PUT | `/api/admin/v1/campaigns/{id}` | `UpdateCampaignDto` | Update |
| POST | `/api/admin/v1/campaigns/{id}/status` | `CampaignStatusUpdateDto` | Change status |
| POST | `/api/admin/v1/campaigns/{id}/archive` | `?actor=` | Archive |
| POST | `/api/admin/v1/campaigns/{id}/restore` | `?actor=` | Restore from archive |
| POST | `/api/admin/v1/campaigns/{id}/clone` | `CampaignCloneDto` | Clone campaign |
| GET | `/api/admin/v1/campaigns/{id}/analytics/summary` | `?lastHours=24&topLinks=10` | Analytics summary |

**`CreateCampaignDto`** — NO status field on create (starts as Draft):
```json
{
  "name": "Q1 Promo",
  "description": "...",
  "startDate": "2025-01-01",
  "endDate": "2025-03-31",
  "dailyClickLimit": 1000,
  "totalClickLimit": 50000,
  "budgetAmount": 500.00,
  "currency": "USD",
  "utmSource": "newsletter",
  "utmMedium": "email",
  "utmCampaign": "q1-2025",
  "actor": "admin-user"
}
```

**`CampaignStatusUpdateDto`**:
```json
{ "status": "Active", "reason": "Approved by manager", "actor": "admin" }
```
Valid statuses: `Draft` | `Active` | `Paused` | `Closed` | `Archived`

**`CampaignCloneDto`**:
```json
{
  "newName": "Q1 Promo (Copy)",
  "cloneUtmFields": true,
  "cloneLimits": true,
  "cloneDates": false,
  "actor": "admin"
}
```

**`CampaignSearchDto`** (query params):
- `search`, `status`, `from`, `to` (DateOnly)
- `includeArchived` (default false)
- `page` (default 1), `pageSize` (default 20)

**`CampaignResponseDto`** (response shape):
```typescript
{
  campaignId: string;      // Guid
  tenantId: string;
  name: string;
  description?: string;
  status: string;          // Draft | Active | Paused | Closed | Archived
  startDate?: string;      // DateOnly "2025-01-01"
  endDate?: string;
  dailyClickLimit?: number;
  totalClickLimit?: number;
  budgetAmount?: number;
  currency: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isArchived: boolean;
  createdBy?: string;
  createdAtUtc: string;
  updatedBy?: string;
  updatedAtUtc?: string;
}
```

> **Important:** Campaign click limits are stored for reporting only — NOT enforced at redirect time.

---

### Analytics

| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/api/v1/analytics/summary` | `?lastHours=24` | Overall summary |
| GET | `/api/v1/analytics/top-shortcodes` | `?lastHours=24&top=10` | Top performing links |
| GET | `/api/v1/analytics/top-failed-ips` | `?lastHours=24&top=10` | Top failing IPs |

Additional analytics controllers (route prefixes):
- `/api/v1/analytics/links/...` — link analytics
- `/api/v1/analytics/campaigns/...` — campaign analytics
- `/api/v1/analytics/traffic/...` — traffic summary
- `/api/v1/analytics/security/...` — security analytics

Note: `AnalyticsController` has `[Authorize(Roles = "Admin")]` — may need middleware adjustment.

---

### Tenant Configuration

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/v1/tenant/configuration` | — | Get tenant config |
| PATCH | `/api/v1/tenant/configuration` | `UpdateTenantConfigurationDto` | Update config |
| GET | `/api/v1/tenant/configuration/profile` | — | Get profile |

**TenantConfiguration fields** (relevant for Settings page):
```typescript
{
  tenantId: string;
  isActive: boolean;
  isSuspended: boolean;
  planCode: string;
  timezone?: string;                 // IANA timezone string
  defaultLinkExpiryMinutes?: number;
  allowCustomDomains?: boolean;
  customDomain?: string;
  redirectLimitPerMinute: number;
  createLimitPerMinute: number;
  monthlyLinksQuota: number;
  monthlyClicksQuota: number;
  autoBlockEnabled: boolean;
  autoBlockThreshold: number;
  autoBlockWindowSeconds: number;
  autoBlockTtlSeconds: number;
  botScoreThreshold: number;
  metadata?: string;                 // free-form JSON string
}
```

---

### Webhooks

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/v1/tenant/webhooks` | `CreateTenantWebhookDto` | Create webhook |
| GET | `/api/v1/tenant/webhooks` | — | List webhooks |
| GET | `/api/v1/tenant/webhooks/{id}` | — | Get by ID |
| PUT | `/api/v1/tenant/webhooks/{id}` | `UpdateTenantWebhookDto` | Update |
| DELETE | `/api/v1/tenant/webhooks/{id}` | — | Delete |

---

### Custom Domains

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/tenant/domains` | List domains |
| POST | `/api/v1/tenant/domains` | Add domain |
| DELETE | `/api/v1/tenant/domains/{id}` | Remove domain |

---

### API Keys (Admin)

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/admin/v1/tenant/api-keys` | `CreateApiKeyRequest` | Create key (raw key returned ONCE) |
| GET | `/api/admin/v1/tenant/api-keys` | `ApiKeySearchDto` (query) | Search keys |
| POST | `/api/admin/v1/tenant/api-keys/{keyId}/revoke` | — | Revoke |
| POST | `/api/admin/v1/tenant/api-keys/{keyId}/enable` | — | Enable |
| POST | `/api/admin/v1/tenant/api-keys/{keyId}/rotate` | — | Rotate (new key returned ONCE) |
| DELETE | `/api/admin/v1/tenant/api-keys/{keyId}` | — | Delete |

**`CreateApiKeyRequest`**:
```json
{
  "name": "My API Key",
  "scopes": "create_link,read_campaign",
  "expiresAtUtc": "2026-01-01T00:00:00Z",
  "rateLimitPerMinute": 60
}
```
> Scopes is a **comma-separated string**, NOT an array. Frontend must be updated.

**`ApiKeyResponse`**:
```typescript
{
  keyId: string;           // Guid
  name: string;
  scopes?: string;         // "create_link,read_campaign"
  isActive: boolean;
  usageCount: number;
  lastUsedAtUtc?: string;
  expiresAtUtc?: string;
  createdAtUtc: string;
  rateLimitPerMinute?: number;
}
```
> Raw key shown only on create/rotate — never stored, never re-displayable.

---

### Security (Admin)

| Method | Path | Body / Query | Description |
|---|---|---|---|
| GET | `/api/admin/v1/security/ip-blocks` | — | List all IP blocks |
| POST | `/api/admin/v1/security/ip-blocks` | `CreateIpBlockDto` | Add/upsert IP block |
| DELETE | `/api/admin/v1/security/ip-blocks/{id}` | — | Remove IP block |
| GET | `/api/admin/v1/security/ip-blocks/search` | `IpRuleSearchDto` | Paged search |
| POST | `/api/admin/v1/security/ip-blocks/bulk` | `List<CreateIpBlockDto>` | Bulk block |
| GET | `/api/admin/v1/security/whitelist` | `IpRuleSearchDto` | List whitelist |
| POST | `/api/admin/v1/security/whitelist` | `CreateIpWhitelistDto` | Add to whitelist |
| DELETE | `/api/admin/v1/security/whitelist/{id}` | — | Remove from whitelist |
| GET | `/api/admin/v1/security/suspicious-ips` | `?lastHours=24&top=20` | Suspicious IPs |
| GET | `/api/admin/v1/security/incidents` | `?page&pageSize&severity&type` | Security incidents |
| DELETE | `/api/admin/v1/security/incidents/{id}` | — | Delete incident |

**`CreateIpBlockDto`**:
```json
{
  "ipOrCidr": "1.2.3.4",
  "reason": "Abuse detected",
  "expiresAtUtc": "2025-06-01T00:00:00Z"
}
```
Supports individual IPs and CIDR ranges (e.g. `192.168.1.0/24`). Whitelist overrides blocklist at runtime.

---

### System / Admin Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/v1/dashboard` | System overview stats |
| GET/POST/DELETE | `/api/admin/v1/retention` | Retention job management |

---

## Domain Entities (Full Field List)

### ShortLink

```typescript
{
  id: number;
  shortCode: string;
  secureToken: string;     // HMAC-signed token containing finalUrl
  expiryUtc: string;
  isActive: boolean;
  clickCount: number;
  createdAtUtc: string;
  tenantId: string;
  title?: string;
  createdBy?: string;
  tags?: string[];
  lastAccessedAtUtc?: string;
  revokedAtUtc?: string;
  revokedBy?: string;
  campaignId?: string;     // Guid — optional campaign assignment
}
```

> **Note:** There is no plain `finalUrl`/`destination` column — the destination is embedded inside `secureToken`. Confirm what the admin list DTO returns.

### Campaign

```typescript
{
  campaignId: string;
  tenantId: string;
  name: string;
  description?: string;
  status: string;          // Draft | Active | Paused | Closed | Archived
  startDate?: string;      // DateOnly "2025-01-01"
  endDate?: string;
  dailyClickLimit?: number;
  totalClickLimit?: number;
  budgetAmount?: number;
  currency: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isArchived: boolean;
  createdBy?: string;
  createdAtUtc: string;
  updatedBy?: string;
  updatedAtUtc?: string;
}
```

### TenantApiKey

```typescript
{
  keyId: string;
  tenantId: string;
  name?: string;
  scopes?: string;         // "create_link,read_campaign"
  isActive?: boolean;
  usageCount?: number;
  rateLimitPerMinute?: number;
  createdBy?: string;
  createdAtUtc?: string;
  expiresAtUtc?: string;
  lastUsedAtUtc?: string;
  revokedAtUtc?: string;
  // keyHash is stored server-side only — never returned to client
}
```

### TenantHmacKey

```typescript
{
  id: string;
  tenantId: string;
  kid: string;             // Key ID for rotation lookup
  isActive: boolean;
  canSign: boolean;        // false = retired key (verify-only)
  createdAtUtc: string;
  rotatedAtUtc?: string;
  // secret is server-side only — never returned
}
```

### TenantIpBlock

```typescript
{
  id: number;
  tenantId: string;
  ipOrCidr: string;        // "1.2.3.4" or "10.0.0.0/8"
  reason?: string;
  createdBy?: string;
  createdAtUtc: string;
  expiresAtUtc?: string;   // null = permanent
}
```

### ShortLinkAuditLog

```typescript
{
  id: number;
  tenantId: string;
  shortCode?: string;
  eventType: string;       // CREATE | REDIRECT | REVOKE | TOKEN_VALIDATE | RATE_LIMIT | ACCESS | ...
  success: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAtUtc: string;
  correlationId?: string;
  campaignId?: string;
}
```

---

## Background Services

| Service | Purpose |
|---|---|
| `CampaignLifecycleHostedService` | Auto-transitions campaigns based on startDate/endDate |
| `BlockedIpSyncHostedService` | Syncs DB IP blocks into Redis cache on startup + periodic refresh |
| `UsageFlushHostedService` | Flushes Redis usage counters to DB (monthly stats) |
| `RetentionWorker` | Deletes old click events and audit logs per retention policy |
| `MaintenanceWorker` | General maintenance tasks |
| `RedisScriptWarmupHostedService` | Pre-loads Lua scripts into Redis on startup |

---

## Redis Key Patterns

| Purpose | Pattern |
|---|---|
| Rate limit (sliding window) | `rl:{tenantId}:{action}:{minute}` |
| Token blacklist / OTU state | `token:{tenantId}:{jti}` |
| IP block cache | `ipblock:{tenantId}:{ip}` |
| IP whitelist cache | `ipwhitelist:{tenantId}:{ip}` |
| Short link cache | `sl:{shortCode}` |
| Campaign limit state | `campaign:{campaignId}:daily` / `:total` |
| Usage meters | `usage:{tenantId}:{month}:links` / `:clicks` |

---

## Critical Frontend Mismatches (Fix Before Integration)

### 1. Short Link Create Form — field names wrong

| Frontend field | Backend field | Type |
|---|---|---|
| `destination` | `finalUrl` | string |
| `expiresAt` (ISO date) | `expiryMinutes` | number (1–43200) |
| missing | `oneTimeUse` | boolean |

Fix: rename fields, convert date picker to minutes input, add oneTimeUse toggle.

### 2. API Keys — scopes model wrong

| Frontend | Backend |
|---|---|
| `permissions: ["read", "write", "delete"]` | `scopes: "create_link,read_campaign"` (string) |
| missing `rateLimitPerMinute` | `rateLimitPerMinute?: number` |
| missing `expiresAtUtc` | `expiresAtUtc?: string` |

### 3. Security Tab — conceptual mismatch

- Frontend shows **IP allowlist** (who is allowed in)
- Backend primary feature is **IP blocklist** (who is blocked), whitelist is an override bypass
- Rebuild security tab with blocklist as the primary table; whitelist as a secondary "override" section

### 4. Workspace Settings — missing fields

Frontend form is missing: `defaultLinkExpiryMinutes`, `redirectLimitPerMinute`, `createLimitPerMinute`, `monthlyLinksQuota`, `monthlyClicksQuota`, `autoBlockEnabled` + thresholds, `botScoreThreshold`

### 5. Audit Log — event type values

Real backend event types: `CREATE`, `REDIRECT`, `REVOKE`, `ACTIVATE`, `TOKEN_VALIDATE`, `RATE_LIMIT`, `ACCESS` — update any hardcoded filter values in the frontend.

### 6. ShortLink has no plain `destination` column

`finalUrl` is stored inside `secureToken`. Verify what shape the admin list endpoint returns before building the Links table UI.

---

## Business Logic Rules

1. **Campaign status flow:** `Draft` → `Active` → `Paused` ↔ `Active` → `Closed` → `Archived`. Use `/status` endpoint with `reason` field.
2. **Campaign archive/restore:** separate endpoints (`/archive`, `/restore`), toggle `IsArchived` flag independently of status.
3. **Campaign click limits:** stored but NOT enforced at redirect time — reporting only.
4. **HMAC expiry cap:** max 60 minutes enforced server-side regardless of requested value.
5. **OTU enforcement:** atomic Redis `SET NX` with TTL; reuse attempt logged and rejected.
6. **Key rotation:** old `TenantHmacKey` stays with `canSign=false` for in-flight token validation; new key with `canSign=true`.
7. **IP whitelist overrides blocklist:** whitelisted IP bypasses block check entirely.
8. **Auto-blocking:** if `AutoBlockEnabled=true`, IPs exceeding `AutoBlockThreshold` failures within `AutoBlockWindowSeconds` are auto-blocked for `AutoBlockTtlSeconds`.
9. **Bot scoring:** requests above `BotScoreThreshold` are blocked by `BotFingerprintingMiddleware`.
10. **Two separate rate limiters:** `CreateLimitPerMinute` (link creation) and `RedirectLimitPerMinute` (redirect hits), both per-tenant sliding window.
11. **Tenant lifecycle:** suspended → 503 on all requests; inactive → 403.
12. **`CampaignLifecycleHostedService`** auto-transitions campaigns by date — status can change without a user action.

---

## Non-Obvious Findings

- Old `AdminSecurityController` at `/api/admin/security` is **entirely commented out**; active route is `/api/admin/v1/security`.
- Old `HmacController` at `/api/hmac` is **entirely commented out**; active route is `/api/v1/hmac`.
- `ShortLink` has two campaign FK columns (`CampaignId` and `CampaignIdUuid`) — likely a migration artifact. Confirm which one the service layer uses.
- Raw API key is returned only on create/rotate and is never stored plaintext — the frontend must display it immediately with a "copy now" warning.
- `AnalyticsController` has `[Authorize(Roles = "Admin")]` which may conflict with the header-only auth model — may need adjustment before analytics endpoints work.
- `GET /api/admin/v1/security/ip-blocks` returns all without pagination. Use `/search` with `IpRuleSearchDto` for paged results.
- `SsrfUrlGuard` rejects private IP ranges as `finalUrl` — relevant for local dev testing behind NAT.
- `RetentionWorker` deletes old data — audit log has finite retention. Historical data may not always be present.
- `TenantConfiguration.Metadata` is a free-form JSON string — not structured. Do not rely on it for frontend features.
