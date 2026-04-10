# url.ify — Backend Integration Context (Updated from Insomnia Collection)

> This document maps every frontend page to the **real backend API** endpoints from the Insomnia collection.  
> The previous version had guessed endpoints — this version reflects what is actually built.

---

## 1. Critical Architecture Discoveries

### 1.1 Two Backend Services

| Service | Port | Purpose |
|---|---|---|
| **Main API** | `5055` | All short-link, campaign, domain, admin, security operations |
| **Platform / Architecture API** | `5087` | Tenant resolution, platform-level tenant management |

### 1.2 Auth is NOT user login — it is Tenant Header

**The backend does NOT have user login/session endpoints in the collection.**  
Every request is identified by `X-Tenant-Id` header (e.g. `mindivra`).

```
X-Tenant-Id: mindivra
```

This means the frontend's current mock auth (cookie-based `sniply_session`) needs to be replaced with **tenant context resolution**. Likely approach:
- On login, the user is associated with a tenant slug
- The frontend stores the tenant ID (in a cookie or context) and sends it as a header on every API call
- The `/api/debug/tenant` endpoint on port 5087 can be used to validate/resolve tenant context

> **Confirm with manager:** How does a user authenticate? Is there a JWT issued after login that carries the tenant ID, or is the frontend expected to embed it differently?

### 1.3 Admin vs Tenant Endpoints

There are two tiers of API access:

| Tier | URL Prefix | Usage |
|---|---|---|
| **Admin** | `/api/admin/...` | Full CRUD for managing all tenant data |
| **Tenant** | `/api/...` or `/api/tenant/...` | Scoped to the current tenant (identified by header) |

For the dashboard frontend, **most operations use the tenant-scoped paths**, not admin paths.

---

## 2. Backend URL Summary (from Insomnia collection)

### Base URLs
```
MAIN_API   = http://localhost:5055
PLATFORM   = http://localhost:5087
```

### Link Management
| Method | Path | Description |
|---|---|---|
| POST | `/api/short-links` | Create a short link |
| POST | `/api/v1/short-links` | Create a short link (versioned) |
| POST | `/api/v1/links/:code/revoke` | Revoke a link |
| POST | `/api/revoke/short/:code` | Revoke a short link (alternate path) |
| GET | `/r/:code` | Redirect (follow the short link) |
| GET | `/api/admin/links?page=1&pageSize=20` | List links (admin) |
| GET | `/api/admin/links?search=:code` | Search links (admin) |
| GET | `/api/admin/links/:code` | Get link details (admin) |
| PUT | `/api/admin/links/:code` | Update link metadata (admin) |

**Create short link body:**
```json
{
  "finalUrl": "https://example.com",
  "expiryMinutes": 10,
  "oneTimeUse": false
}
```

**Update link metadata body:**
```json
{
  "title": "Promo Feb 2026",
  "campaignId": 1,
  "tags": ["promo", "ksa"]
}
```

### HMAC Secure Links
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/hmac/generate` | Generate a signed HMAC token link |
| POST | `/api/hmac/generate` | Generate HMAC (non-versioned) |
| GET | `/api/hmac/go?token=...` | Follow a HMAC-signed link |

**HMAC generate body:**
```json
{
  "finalUrl": "https://example.com",
  "expiryMinutes": 2,
  "oneTimeUse": true
}
```

### Campaigns (Tenant-level)
| Method | Path | Description |
|---|---|---|
| GET | `/api/campaigns` | List all campaigns |
| GET | `/api/campaigns/:id` | Get campaign by ID |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/` | Soft delete |

### Campaigns (Admin-level)
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/campaigns` | Create campaign |
| GET | `/api/admin/campaigns?status=Active&page=1&pageSize=10` | Search/list campaigns |
| GET | `/api/admin/campaigns/:id` | Get campaign by ID |
| PUT | `/api/admin/campaigns/:id` | Update campaign |
| POST | `/api/admin/campaigns/:id/status` | Change status |
| POST | `/api/admin/campaigns/:id/clone` | Clone campaign |
| POST | `/api/admin/campaigns/:id/archive?actor=admin_user` | Archive |
| POST | `/api/admin/campaigns/:id/restore?actor=admin_user` | Restore |
| GET | `/api/admin/campaigns/:id/analytics/summary?lastHours=24&topLinks=10` | Campaign analytics |

**Create/Update campaign body:**
```json
{
  "name": "Ramadan Promo 2026",
  "description": "Seasonal marketing campaign",
  "status": "Active",
  "startDate": "2026-03-01",
  "endDate": "2026-03-31",
  "dailyClickLimit": 100,
  "totalClickLimit": 1000,
  "budgetAmount": 5000,
  "currency": "SAR",
  "utmSource": "facebook",
  "utmMedium": "paid",
  "utmCampaign": "ramadan_2026"
}
```

### Domains (Admin-level)
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/domains` | Create/add domain |
| GET | `/api/admin/domains` | List domains |
| PUT | `/api/admin/domains/:id` | Update domain (verify, set SSL status) |

**Create domain body:** `{ "domain": "go.mindivra.com" }`  
**Update domain body:** `{ "isVerified": true, "sslStatus": "active" }`

### API Keys (Admin)
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/api-keys` | Create API key |

**Create key body:**
```json
{
  "name": "Production Key",
  "scopes": "create_link,read_campaign",
  "expiresAtUtc": "2026-12-31T00:00:00Z"
}
```

### Admin Dashboard / Analytics
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/dashboard/events?type=RATE_LIMIT&take=50` | Audit events (ACCESS / RATE_LIMIT / SECURITY) |
| GET | `/api/admin/dashboard/summary?minutes=60` | Security metrics summary |
| GET | `/api/admin/dashboard/top-links` | Top performing links |
| GET | `/api/admin/dashboard/blocks` | Active IP blocks |
| GET | `/api/admin/dashboard/top-failed-ips` | Top IPs with failed access |

### Security / IP Blocking
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/security/ip-blocks` | Create IP block (single IP or CIDR) |
| DELETE | `/api/admin/security/ip-blocks/:id` | Remove IP block |
| GET | `/api/admin/security/ip-blocks` | List IP blocks |

**IP block body (single IP):** `{ "ipOrCidr": "127.0.0.1", "reason": "Manual block test" }`  
**CIDR block body:** `{ "ipOrCidr": "10.10.10.0/24", "reason": "Block full subnet", "expiresAtUtc": "..." }`

### Retention & Incidents
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/retention` | Data retention info |
| GET | `/api/admin/security-incidents/:tenantId` | Security incidents for a tenant |

### Tenant Configuration (Two levels)

**Admin manages a tenant's config:**
| Method | Path |
|---|---|
| POST | `/api/admin/tenants/:tenantId/configuration/ensure-default` |
| GET | `/api/admin/tenants/:tenantId/configuration/` |
| PATCH | `/api/admin/tenants/:tenantId/configuration` |
| GET | `/api/admin/tenants/:tenantId/settings` |
| GET | `/api/admin/tenants/:tenantId/settings/profile` |

**Admin patch body:**
```json
{
  "planCode": "PRO",
  "redirectLimitPerMinute": 300,
  "allowCustomDomains": true,
  "customDomain": "mindivra.com",
  "autoBlockThreshold": 10
}
```

**Tenant reads/updates own config:**
| Method | Path |
|---|---|
| GET | `/api/tenant/configuration` |
| GET | `/api/tenant/configuration/profile` |
| PATCH | `/api/tenant/configuration` |

**Tenant patch body:**
```json
{
  "timezone": "Asia/Riyadh",
  "defaultLinkExpiryMinutes": 45,
  "redirectLimitPerMinute": 300
}
```

### Platform Service (Port 5087)
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/debug/tenant` | Resolve tenant from header |
| GET | `/api/v1/platform/tenants/:id` | Get tenant by ID |
| GET | `/api/v1/platform/tenants/` | List tenants |
| POST | `/api/v1/campaigns` | Create campaign (platform-level) |
| GET | `/api/v1/campaigns/:id` | Get campaign (platform-level) |
| GET | `/api/v1/campaigns/` | List campaigns (platform-level) |

---

## 3. Frontend Page → Backend Endpoint Mapping

### 3.1 Dashboard Layout (`src/app/dashboard/layout.tsx`)

**Currently:** reads `sniply_session` cookie → `resolveSessionMode()` → mock user/workspace  
**Target:** resolve tenant from stored tenant ID → call tenant config endpoint

```
GET /api/tenant/configuration         → workspaceName, plan, features
GET /api/tenant/configuration/profile → userName, avatar, preferences
```

The layout needs:
```ts
workspaceName: string    // from tenant config
userName: string         // from tenant profile
workspacePlan: string    // from planCode in tenant config
trialDaysLeft: number | null
```

---

### 3.2 Dashboard Overview (`/dashboard`)

**Currently uses:** `dashboardData` (all mock)

| UI element | Backend endpoint |
|---|---|
| KPI: total links, clicks | `GET /api/admin/dashboard/summary?minutes=60` or `GET /api/admin/dashboard/top-links` |
| Top links table | `GET /api/admin/dashboard/top-links` |
| Activity feed | `GET /api/admin/dashboard/events?take=8` |
| Security alerts | `GET /api/admin/dashboard/events?type=SECURITY&take=20` |
| IP blocks alert | `GET /api/admin/dashboard/blocks` |

> **Gap:** No explicit analytics timeline (clicks per day) endpoint seen in collection. Confirm with manager if `/api/admin/dashboard/summary` returns time-series data or if there's a separate endpoint.

---

### 3.3 Links (`/dashboard/links`)

**Frontend create form sends:** `finalUrl`, `expiryMinutes`, `oneTimeUse` (based on actual backend body)

> **Important mismatch:** The frontend create form has many more fields (UTM, geo targeting, password, pixels, tags, slug, domain). Most of these may NOT be supported by the current backend.  
> **Confirm with manager:** Which fields does `POST /api/short-links` actually accept beyond `finalUrl`, `expiryMinutes`, `oneTimeUse`?

| Operation | Endpoint |
|---|---|
| List links | `GET /api/admin/links?page=1&pageSize=20` |
| Search links | `GET /api/admin/links?search=:query` |
| Create short link | `POST /api/short-links` |
| Revoke link | `POST /api/revoke/short/:code` |
| Update metadata (tags, title, campaign) | `PUT /api/admin/links/:code` |
| Link details | `GET /api/admin/links/:code` |

**Note:** No explicit delete/archive endpoint found. Revoke (`POST /api/revoke/short/:code`) may be the equivalent.

---

### 3.4 Campaigns (`/dashboard/campaigns`)

**The backend has a richer campaign model than the frontend currently shows.** Frontend needs to be updated to include:
- `status` (Active / Paused / Archived)
- `dailyClickLimit`, `totalClickLimit`  
- `budgetAmount`, `currency`
- UTM fields

| Operation | Endpoint |
|---|---|
| List campaigns | `GET /api/campaigns` (tenant) or `GET /api/admin/campaigns` (admin) |
| Create campaign | `POST /api/admin/campaigns` |
| Get by ID | `GET /api/campaigns/:id` |
| Update | `PUT /api/campaigns/:id` |
| Delete (soft) | `DELETE /api/campaigns/` |
| Change status | `POST /api/admin/campaigns/:id/status` |
| Clone | `POST /api/admin/campaigns/:id/clone` |
| Archive | `POST /api/admin/campaigns/:id/archive?actor=admin_user` |
| Analytics | `GET /api/admin/campaigns/:id/analytics/summary?lastHours=24&topLinks=10` |

---

### 3.5 QR Codes (`/dashboard/qrcodes`)

QR codes are rendered client-side by `qrcode.react` from the short URL.

| Operation | Endpoint |
|---|---|
| List links for QR display | `GET /api/admin/links?page=1&pageSize=50` (filter in frontend) |
| Generate new QR (create link) | `POST /api/short-links` |

No dedicated QR backend endpoint — the short URL is the input to `qrcode.react`.

---

### 3.6 Domains (`/dashboard/domains`)

| Operation | Endpoint |
|---|---|
| List domains | `GET /api/admin/domains` |
| Add domain | `POST /api/admin/domains` — body: `{ "domain": "..." }` |
| Verify/update domain | `PUT /api/admin/domains/:id` — body: `{ "isVerified": true, "sslStatus": "active" }` |

> **Gap:** No DELETE domain endpoint in collection. Confirm with manager.

**Frontend expects this shape — map from backend response:**
```ts
{
  id: string | number;
  host: string;             // maps to "domain" field
  status: 'Verified' | 'Pending' | 'Failed';   // from isVerified
  ssl: 'Active' | 'Provisioning' | 'None';      // from sslStatus
  links: number;
  clicks: number;
}
```

---

### 3.7 Analytics (`/dashboard/analytics`)

**Available admin dashboard endpoints:**

| UI element | Endpoint |
|---|---|
| Security / rate limit events | `GET /api/admin/dashboard/events?type=RATE_LIMIT&take=50` |
| Access events | `GET /api/admin/dashboard/events?type=ACCESS&take=50` |
| Security incidents | `GET /api/admin/dashboard/events?type=SECURITY&take=50` |
| Overall security metrics | `GET /api/admin/dashboard/summary?minutes=60` |
| Top links | `GET /api/admin/dashboard/top-links` |
| Failed IPs | `GET /api/admin/dashboard/top-failed-ips` |
| Campaign analytics | `GET /api/admin/campaigns/:id/analytics/summary?lastHours=24&topLinks=10` |
| Retention data | `GET /api/admin/retention` |

> **Large gap:** No explicit click timeline, device breakdown, geo, referrer, or hourly analytics endpoints found. These are likely on a separate analytics service or need to be confirmed with manager.

---

### 3.8 Team (`/dashboard/team`)

> **Gap:** No team/member management endpoints found in the collection. This may not be implemented yet or may be handled at the tenant/platform level.  
> **Confirm with manager.**

---

### 3.9 Integrations (`/dashboard/integrations`)

> **Gap:** No integration or pixel config endpoints found.  
> The pixel tracking configs (GA4, GTM, Plausible, etc.) likely map to tenant configuration.  
> **Confirm with manager** — does `PATCH /api/tenant/configuration` accept pixel/tracking settings?

---

### 3.10 Usage (`/dashboard/usage`)

| Data | Endpoint |
|---|---|
| Plan limits & usage | `GET /api/tenant/configuration` → extract `planCode`, `redirectLimitPerMinute`, `allowCustomDomains` |
| Retention metrics | `GET /api/admin/retention` |

> **Gap:** No explicit usage metrics endpoint (link count, click count totals). May be derived from `dashboard/summary` or `retention`.

---

### 3.11 Billing (`/dashboard/billing`)

> **Gap:** No billing or invoice endpoints found in collection.  
> Plan info is in tenant config (`planCode`). Payment/invoice management may be a separate service.  
> **Confirm with manager.**

---

### 3.12 Settings (`/dashboard/settings`)

**8 tabs — actual backend coverage:**

| Tab | Endpoint | Status |
|---|---|---|
| **Workspace** | `PATCH /api/tenant/configuration` | Available |
| **Profile** | `GET /api/tenant/configuration/profile` | Available (read) |
| **API Keys** | `POST /api/admin/api-keys` | Create only (list/revoke not shown) |
| **Webhooks** | Not found in collection | Gap — confirm |
| **Audit Log** | `GET /api/admin/dashboard/events?type=ACCESS&take=50` | Partial match |
| **Security** | `GET /api/admin/security/ip-blocks` + IP block CRUD | IP blocking available |
| **Notifications** | Not found | Gap — confirm |
| **Danger Zone** | Not found | Gap — confirm |

**Settings tab: Security** maps to IP blocking:
- `GET /api/admin/security/ip-blocks` — list blocks
- `POST /api/admin/security/ip-blocks` — add block
- `DELETE /api/admin/security/ip-blocks/:id` — remove block
- `GET /api/admin/security-incidents/:tenantId` — security incidents

---

## 4. Data Model Mismatches (Frontend vs Backend)

### Link creation
| Frontend form field | Backend field | Status |
|---|---|---|
| `destination` | `finalUrl` | **Different name** |
| `expiresAt` (ISO date) | `expiryMinutes` (integer) | **Different type** — convert |
| `oneTimeUse` | `oneTimeUse` | Match |
| `slug`, `domain`, `tags`, `utm`, `geo`, `password` | **Not in collection** | Confirm with manager |

### Link response
| Frontend expects | Backend field | Notes |
|---|---|---|
| `id` | Code (e.g. `DsEOmAIe`) | Backend uses short code as ID |
| `shortUrl` | Full short URL | Construct from domain + code |
| `destination` | `finalUrl` | Rename on fetch |
| `stats.clicks` | Likely in `GET /api/admin/links/:code` | Confirm shape |

### Campaign
| Frontend shows | Backend has | Status |
|---|---|---|
| `name`, `clicks`, `links`, `ctr` | `name`, `status`, `dailyClickLimit`, `totalClickLimit`, `budgetAmount`, `currency`, UTM fields | **Frontend needs update** to show richer campaign data |

---

## 5. Authentication: Required Clarification

The collection shows `X-Tenant-Id: mindivra` on every request but no login/auth endpoint.

**Questions for manager:**
1. How does a user log in? Is there an auth service not shown in this collection?
2. After login, how is the tenant ID stored/sent on the frontend?
3. Is there a JWT that includes the tenant ID as a claim?
4. Should the Next.js frontend proxy all API calls (to attach the tenant header server-side), or does the browser call the backend directly?

**Interim approach for frontend:**
- Store `tenantId` in a cookie after login
- Create a Next.js API route at `src/app/api/[...proxy]/route.ts` that adds the `X-Tenant-Id` header to all outbound requests

---

## 6. Request Convention

All requests to the main API require:
```
X-Tenant-Id: {tenantId}
Content-Type: application/json   (for POST/PUT/PATCH)
```

The Platform API (5087) uses `X-Tenant-Code` instead of `X-Tenant-Id`:
```
X-Tenant-Code: mindivra
```

---

## 7. Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5055
NEXT_PUBLIC_PLATFORM_URL=http://localhost:5087
NEXT_PUBLIC_TENANT_ID=mindivra          # hardcoded during dev, dynamic in production
```

---

## 8. Gaps — Endpoints Not Found in Collection

These features exist in the frontend UI but have **no corresponding backend endpoint** in the Insomnia collection. Confirm with manager which are built vs planned:

| Feature | Frontend page | Backend status |
|---|---|---|
| User login/authentication | `/auth` | Not in collection |
| Team member management | `/dashboard/team` | Not in collection |
| Analytics: click timeline | `/dashboard` + `/dashboard/analytics` | Not in collection |
| Analytics: device/geo breakdown | `/dashboard/analytics` | Not in collection |
| Webhooks CRUD | Settings > Webhooks | Not in collection |
| Billing / invoices | `/dashboard/billing` | Not in collection |
| Notification preferences | Settings > Notifications | Not in collection |
| Integrations (Slack, Zapier, etc.) | `/dashboard/integrations` | Not in collection |
| Export all data / Danger Zone | Settings > Danger Zone | Not in collection |
| Link password protection | `/dashboard/links` | Unconfirmed |
| UTM / geo targeting on links | `/dashboard/links` | Unconfirmed |

---

## 9. Integration Priority Order (Revised)

1. **Tenant auth** — Confirm auth flow with manager, implement `X-Tenant-Id` header propagation
2. **Tenant config** — `GET /api/tenant/configuration` → feeds layout, settings, usage
3. **Links (short-links)** — `POST /api/short-links` + `GET /api/admin/links` → core product
4. **Campaigns** — Rich backend model, update frontend campaign form fields
5. **Domains** — `POST/GET /api/admin/domains`
6. **Admin dashboard** — `GET /api/admin/dashboard/*` → feeds overview & analytics pages
7. **Security / IP blocking** — `GET/POST/DELETE /api/admin/security/ip-blocks`
8. **API Keys** — `POST /api/admin/api-keys`
9. **Audit Log** — `GET /api/admin/dashboard/events`
10. **Everything else** — Confirm with manager what's planned

---

## 10. Files to Modify

| File | Change needed |
|---|---|
| `src/app/auth/page.tsx` | Replace mock buttons → real login form (confirm auth mechanism first) |
| `src/app/api/mock-auth/route.ts` | Delete after real auth is confirmed |
| `src/app/dashboard/layout.tsx` | Call `GET /api/tenant/configuration` instead of mock cookie |
| `src/platform/lib/auth.ts` | Replace mock session logic |
| `src/platform/lib/workspace.ts` | Replace with `GET /api/tenant/configuration` |
| `src/platform/lib/links.ts` | Replace with `GET /api/admin/links` |
| `src/platform/lib/dashboardData.ts` | Replace with per-page API calls |
| `src/platform/mock/mockUser.ts` | Delete |
| `src/platform/mock/mockWorkspace.ts` | Delete |
| `src/platform/mock/mockLinks.ts` | Delete |
| `src/app/dashboard/links/page.tsx` | Map `finalUrl`/`expiryMinutes` to form fields |
| `src/app/dashboard/campaigns/page.tsx` | Update form to include budget, limits, UTM, status |
| `src/platform/types/link.ts` | Update to match actual backend response shape |
