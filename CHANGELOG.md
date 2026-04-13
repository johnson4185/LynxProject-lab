# Changelog

All code changes are logged here chronologically, session by session.

---

## Session 6 — 2026-04-10

### Goal
Wire the Links page frontend to the real .NET backend API (replace mock data).

---

### New Files Created

#### `platform/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5055
NEXT_PUBLIC_TENANT_ID=mindivra
```
Environment variables for the platform dev server. `NEXT_PUBLIC_` prefix exposes them to the browser.

---

#### `platform/src/platform/lib/api.ts`
Typed fetch wrapper used by all frontend → backend calls.
- Automatically injects `Content-Type: application/json` and `X-Tenant-Id` header on every request
- Throws a descriptive `Error` on non-2xx responses
- Exports `api.get / post / put / patch / delete`

---

### Modified Files

#### `platform/src/app/dashboard/links/page.tsx`

**Change 1 — Imports**
- Removed: `import { dashboardData } from "@/platform/lib/dashboardData"`
- Removed: `import type { Link as LinkEntity } from "@/platform/types/link"`
- Added: `import { api } from "@/platform/lib/api"`

---

**Change 2 — `LinkRecord` type + DTO interface + mapper**

Replaced `type LinkRecord = LinkEntity & { ... }` (which extended the mock-data type) with a self-contained type that matches what the backend actually returns.

Added `interface LinkListItemDto` — mirrors the backend `LinkListItemDto` C# class:
```ts
interface LinkListItemDto {
  shortCode: string;
  status: string;          // "active" | "revoked" | "expired"
  title?: string | null;
  campaignId?: string | null;
  clickCount: number;
  createdAtUtc: string;
  expiryUtc: string;
  isActive: boolean;
  revokedAtUtc?: string | null;
  tags?: string[] | null;
}
```

Added `mapDto(item: LinkListItemDto): LinkRecord` — converts backend response to the shape the UI expects:
- `id` ← `shortCode`
- `shortUrl` ← constructed as `url.ify/{shortCode}`
- `destination` ← `"—"` (not available in list endpoint)
- `stats.clicks` ← `clickCount` (ctr/timeline/geo zeroed — not in list DTO)
- `isRevoked` ← `status === "revoked"`

---

**Change 3 — State initialization**

Before:
```ts
const [links, setLinks] = useState<LinkRecord[]>(() => dashboardData.links.map(...));
```
After:
```ts
const [links, setLinks] = useState<LinkRecord[]>([]);
const [loading, setLoading] = useState(true);
const [apiError, setApiError] = useState<string | null>(null);
```

---

**Change 4 — Fetch links from API on mount**

Added `useEffect` that calls `GET /api/admin/v1/links?pageSize=200` and populates state via `mapDto`. Handles loading and error states. Uses a `cancelled` flag to prevent state updates after unmount.

---

**Change 5 — `revokeLinks` wired to API**

Optimistic update retained (UI changes immediately). API calls fire in background:
- 1 link → `POST /api/admin/v1/links/{shortCode}/revoke`
- Multiple links → `POST /api/admin/v1/links/bulk/revoke` with `{ shortCodes: [...] }`

---

**Change 6 — `reactivateLinks` wired to API**

Optimistic update retained. Calls `POST /api/admin/v1/links/{shortCode}/activate` for each link (no bulk activate endpoint in backend).

---

**Change 7 — `reactivateLink` (single row action) wired to API**

Added `POST /api/admin/v1/links/{id}/activate` call alongside the existing local state update.

---

**Change 8 — Table loading and error states**

Before: table body showed "No links" when `filtered.length === 0`.

After: three-way check:
1. `loading` → shows "Loading links…"
2. `apiError` → shows error message in red
3. `filtered.length === 0` → shows existing "No links match" empty state

---

**Change 9 — Create modal wired to API**

Before: form submit built a local `LinkRecord` with a fake `id: link-${Date.now()}` and called `onCreate` directly.

After: calls `POST /api/v1/short-links` with:
```json
{ "finalUrl": "<destination>", "expiryMinutes": <days * 1440>, "oneTimeUse": false }
```
On success, maps the response `{ shortCode, shortUrl }` into a `LinkRecord` and calls `onCreate`. On failure, shows `alert()` with the error. All other form fields (UTM, pixels, geo) are still collected in state and stored on the local record — backend support for those comes later.

---

**Change 10 — Drawer "Save changes" wired to API**

`handleSaveEdit` now calls `PUT /api/admin/v1/links/{shortCode}` with `{ tags }` after updating local state. (Backend `UpdateLinkDto` only accepts `title`, `campaignId`, `tags` — other drawer fields are local-only for now.)

---

**Change 11 (NEW FEATURE) — "Extend Expiry" in drawer footer**

Backend has `POST /api/admin/v1/links/{shortCode}/extend-expiry` which was not exposed anywhere in the frontend. Added a new control in the drawer footer (visible only for active links):

- Dropdown: +1 hour / +6 hours / +1 day / +7 days / +30 days
- "Extend" button → calls `POST .../extend-expiry` with `{ minutes }`, then updates `expiresAt` in local state from the response's `newExpiryUtc`

---

### Backend changes required (manual — user applies)

#### `backend/Lynx.Api/appsettings.json`
Revert IP from `10.8.0.1` → `10.10.0.1` in both `DefaultConnection` and `Redis`.

#### `backend/Lynx.Api/Program.cs`

After `builder.Services.AddControllers()` — add CORS policy:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:3001", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
```

After `app.UseRouting()` — apply CORS:
```csharp
app.UseCors("FrontendDev");
```

---

### API endpoints used (Links page)

| Method | Endpoint | Used for |
|--------|----------|----------|
| `GET` | `/api/admin/v1/links?pageSize=200` | Load all links on mount |
| `POST` | `/api/v1/short-links` | Create new link |
| `POST` | `/api/admin/v1/links/{shortCode}/revoke` | Revoke single link |
| `POST` | `/api/admin/v1/links/bulk/revoke` | Revoke multiple links |
| `POST` | `/api/admin/v1/links/{shortCode}/activate` | Reactivate link |
| `PUT` | `/api/admin/v1/links/{shortCode}` | Update tags |
| `POST` | `/api/admin/v1/links/{shortCode}/extend-expiry` | Extend expiry date |

---

### Field mapping (backend → frontend)

| Backend (`LinkListItemDto`) | Frontend (`LinkRecord`) | Notes |
|-----------------------------|-------------------------|-------|
| `shortCode` | `id`, `slug` | Used as the unique key |
| `status === "revoked"` | `isRevoked` | Derived |
| `clickCount` | `stats.clicks` | |
| `createdAtUtc` | `createdAt` | |
| `expiryUtc` | `expiresAt` | |
| `tags` | `tags` | |
| *(not in list DTO)* | `destination` | Shows `"—"` |
| *(not in list DTO)* | `stats.ctr / timeline / geo` | Zeroed out |

---

## Session 7 — 2026-04-10

### Goal
Wire all remaining dashboard pages to the real .NET backend API. Replaced mock data on 6 pages.

---

### Files Modified

#### `platform/src/app/dashboard/domains/page.tsx`
- **Removed:** `import { dashboardData }` — was using `dashboardData.domains` for stats cards and table
- **Added:** `import { api }`, `useEffect`, `DomainDto` interface, `DomainRecord` type, `mapDto()` mapper
- **State:** `domains []`, `loading`, `domainInput`, `adding`
- **Fetch:** `GET /api/v1/tenant/domains?pageSize=100` on mount → `DomainDto[]` → `DomainRecord[]`
- **Create:** Add domain button → `POST /api/v1/tenant/domains { domainName }` → appends to state
- **Delete:** Trash button → optimistic remove → `DELETE /api/v1/tenant/domains/{id}`
- **Verify:** "Verify domain" in DNS modal → `POST /api/v1/tenant/domains/{id}/verify` → sets status to Verified
- **Stats cards:** Now computed from live state (total, verified, pending)
- **Removed columns:** Links and Clicks (not in backend DTO) — table now shows Domain / Status / SSL / Actions

#### `platform/src/app/dashboard/page.tsx` (Dashboard home)
- **Removed:** `import { dashboardData }` — was using `.links`, `.devices`, `.geos`, `.clicksTimeline`, `.referrers`, `.totals`
- **Added:** `import { api }`, `useEffect`, DTO interfaces, static fallback constants
- **State:** `trafficSummary`, `timeseries`, `topLinks`, `totalLinks`
- **Fetch 1:** `GET /api/v1/analytics/traffic/summary?lastHours=168` → `TrafficSummaryDto` → KPI Total Clicks + Unique Visitors
- **Fetch 2:** `GET /api/v1/analytics/traffic/timeseries?lastHours=168&interval=day` → `TimeSeriesPointDto[]` → area chart
- **Fetch 3:** `GET /api/admin/v1/links?pageSize=200` → sorted by clickCount → top 5 links table + Active Links KPI
- **Static inline:** `STATIC_DEVICES`, `STATIC_GEOS`, `STATIC_REFERRERS` — device/geo/referrer breakdown (no per-tenant endpoint available)
- **KPI changes:** Avg. CTR and QR-Enabled now show "—" (not derivable from available APIs)

#### `platform/src/app/dashboard/analytics/page.tsx`
- **Removed:** `import { dashboardData }` — was using `.devices`, `.geos`, `.clicksTimeline`, `.totals`
- **Added:** `import { api }`, `useEffect`, `TimeSeriesPointDto` interface, static fallbacks
- **State:** `rawTimeseries`, `trafficSummary`, `analyticsLinks`
- **Fetch 1:** `GET /api/v1/analytics/traffic/timeseries?lastHours={range*24}&interval=day` — re-fetches on range change
- **Fetch 2:** `GET /api/v1/analytics/traffic/summary?lastHours={range*24}` → Total Clicks + Unique Visitors KPI cards
- **Fetch 3:** `GET /api/admin/v1/links?pageSize=200` → "By Link" tab table + bar chart
- **Static inline:** `STATIC_DEVICES`, `STATIC_GEOS` — device/geo breakdown
- **Avg. CTR KPI:** Now shows "—"

#### `platform/src/app/dashboard/usage/page.tsx`
- **Removed:** Hardcoded `METRICS` constant with static values
- **Added:** `import { api }`, `useState`, `useEffect`, `MetricValue` interface
- **State:** `metrics { links, clicks, domains, api }`
- **Fetch 1:** `GET /api/admin/v1/links?pageSize=1` → `res.total` → links count
- **Fetch 2:** `GET /api/v1/analytics/traffic/summary?lastHours=720` → `totalRequests` → clicks + api counts
- **Fetch 3:** `GET /api/v1/tenant/domains?pageSize=1` → `res.total` → domain count
- **METRICS:** Now computed inside component from live state; seats and QR remain static

#### `platform/src/app/dashboard/settings/page.tsx`
- **Added:** `import { api }`, DTO interfaces (`ApiKeyDto`, `ApiKeyRecord`, `ApiKeyCreateResponse`, `WebhookDto`, `HookRecord`), mapper functions (`mapApiKey`, `mapWebhook`)
- **API Keys:** `useState<ApiKeyRecord[]>(INITIAL_KEYS)` kept as initial fallback; `useEffect` loads `GET /api/admin/v1/tenant/api-keys?pageSize=100` on mount
- **Create API key:** `POST /api/admin/v1/tenant/api-keys { name, permissions }` → backend returns full key value → shown in `createdKey` state
- **Revoke API key:** Optimistic update → `POST /api/admin/v1/tenant/api-keys/{keyId}/revoke`
- **Webhooks:** `useState<HookRecord[]>(INITIAL_HOOKS)` kept as initial fallback; `useEffect` loads `GET /api/v1/tenant/webhooks` on mount
- **Create webhook:** `POST /api/v1/tenant/webhooks { url, events }` → backend DTO → mapped to HookRecord
- **Delete webhook:** Optimistic remove → `DELETE /api/v1/tenant/webhooks/{id}`
- **Note:** Backend webhook DTO has no `name` field — URL is used as display name

#### `platform/src/app/dashboard/campaigns/page.tsx`
- **Added:** `import { api }`, DTO interfaces (`CampaignDto`, `CampaignCreateResponse`, `CampaignAnalyticsSummary`), mappers (`mapCampaignDto`, `mapStatusFromBackend`, `mapStatusToBackend`)
- **State:** `campaigns []` now starts empty (was `INITIAL`); `campaignLinksMap {}` starts empty (was `CAMPAIGN_LINKS`); added `loadingCampaigns`
- **Fetch campaigns:** `GET /api/admin/v1/campaigns?pageSize=100` on mount → `CampaignDto[]` → `Campaign[]`
- **Fetch campaign links:** `GET /api/admin/v1/campaigns/{id}/analytics/summary?lastHours=720&topLinks=20` triggered when `viewCampaign` changes → `TopLinks: Record<string,number>` → `CampaignLink[]`
- **Create:** `POST /api/admin/v1/campaigns {name, description, status, dates, limits, budget, utm}` → backend ID replaces temp ID
- **Edit:** Optimistic update → `PUT /api/admin/v1/campaigns/{id} {name, description, dates, limits, budget, utm}`
- **Clone:** Optimistic add → `POST /api/admin/v1/campaigns/{id}/clone {newName, dates}` → backend ID replaces temp ID
- **Status change:** Optimistic update → `POST /api/admin/v1/campaigns/{id}/status {status, reason}`
- **Archive:** Optimistic update → `POST /api/admin/v1/campaigns/{id}/archive`
- **Restore:** Optimistic update → `POST /api/admin/v1/campaigns/{id}/restore`
- **Status mapping:** Backend "Draft" / "Closed" → Frontend "Paused"; "Active" → "Active"; "Archived" → "Archived"

---

### Endpoints Wired (Session 7)

| Method | Endpoint | Used by |
|---|---|---|
| GET | `/api/v1/tenant/domains?pageSize=100` | Domains page list |
| POST | `/api/v1/tenant/domains` | Add domain |
| DELETE | `/api/v1/tenant/domains/{id}` | Delete domain |
| POST | `/api/v1/tenant/domains/{id}/verify` | Verify domain |
| GET | `/api/v1/analytics/traffic/summary?lastHours=N` | Dashboard home KPI, Analytics KPI, Usage metrics |
| GET | `/api/v1/analytics/traffic/timeseries?lastHours=N&interval=day` | Dashboard home chart, Analytics chart |
| GET | `/api/admin/v1/campaigns?pageSize=100` | Campaigns list |
| POST | `/api/admin/v1/campaigns` | Create campaign |
| PUT | `/api/admin/v1/campaigns/{id}` | Edit campaign |
| POST | `/api/admin/v1/campaigns/{id}/clone` | Clone campaign |
| POST | `/api/admin/v1/campaigns/{id}/status` | Change campaign status |
| POST | `/api/admin/v1/campaigns/{id}/archive` | Archive campaign |
| POST | `/api/admin/v1/campaigns/{id}/restore` | Restore campaign |
| GET | `/api/admin/v1/campaigns/{id}/analytics/summary` | Campaign detail links |
| GET | `/api/admin/v1/tenant/api-keys?pageSize=100` | Settings API Keys tab |
| POST | `/api/admin/v1/tenant/api-keys` | Create API key |
| POST | `/api/admin/v1/tenant/api-keys/{keyId}/revoke` | Revoke API key |
| GET | `/api/v1/tenant/webhooks` | Settings Webhooks tab |
| POST | `/api/v1/tenant/webhooks` | Create webhook |
| DELETE | `/api/v1/tenant/webhooks/{id}` | Delete webhook |

---

### Notes
- Device/geo breakdown data is not available from non-admin analytics endpoints — static inline arrays used as placeholders
- Campaign link counts/destinations not in list DTO — clickCount from analytics summary used instead
- Avg. CTR shown as "—" on dashboard/analytics (not derivable from traffic APIs)
- INITIAL_KEYS and INITIAL_HOOKS kept as initial state in settings to prevent empty flash before API loads

---

## Session 7 (continued) — Bug fixes + FinalUrl — 2026-04-10

### Bugs Fixed

#### Console `RangeError: Invalid time value` (Dashboard home, Analytics)
- **Root cause:** Backend `timestamp` field in timeseries response was not in ISO 8601 format on some records — `new Date(pt.timestamp).toISOString()` threw when the date was unparseable.
- **Fix:** Added `isNaN(d.getTime())` guard before calling `.toISOString()`; unparseable timestamps fall back to the raw string.
- **Files:** `platform/src/app/dashboard/page.tsx`, `platform/src/app/dashboard/analytics/page.tsx`

#### `TypeError: Cannot read 'toLocaleString' of undefined` (Dashboard home)
- **Root cause:** `trafficSummary.totalRequests` could be `undefined` when the backend returns `null` or a shape mismatch.
- **Fix:** Applied optional chaining throughout: `trafficSummary?.totalRequests?.toLocaleString() ?? "—"` and similar for all derived fields.
- **Files:** `platform/src/app/dashboard/page.tsx`, `platform/src/app/dashboard/analytics/page.tsx`

#### Hydration mismatch — `fdprocessedid` attribute (Dashboard home)
- **Root cause:** Browser password-manager extension injecting a `fdprocessedid` DOM attribute on the Refresh button; React's server-rendered HTML didn't match client HTML.
- **Fix:** Added `suppressHydrationWarning` to the Refresh `<button>` element.
- **File:** `platform/src/app/dashboard/page.tsx`

#### "Link not found" on detail page (`/dashboard/links/[id]`)
- **Root cause:** `[id]/page.tsx` was calling `dashboardData.links.find(item => item.id === params.id)` — mock link IDs like `link-1` never matched real backend short codes like `qo8b7G6Z`.
- **Fix:** Replaced the mock lookup with a live fetch `GET /api/admin/v1/links/{shortCode}` on mount; added `loadingLink` state and a loading display.
- **File:** `platform/src/app/dashboard/links/[id]/page.tsx`

#### `url.ify` fake domain appearing in short URLs
- **Root cause:** `shortUrl` was constructed as `` `url.ify/${shortCode}` `` — a hardcoded placeholder from the original mock data, not a real URL.
- **Fix:** Replaced with `` `${API_BASE}/r/${shortCode}` `` where `API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055"` in all locations.
- **Files:** `platform/src/app/dashboard/links/page.tsx`, `platform/src/app/dashboard/links/[id]/page.tsx`, `platform/src/app/dashboard/page.tsx`

#### Destination showing `"—"` (link created before FinalUrl column existed) + "Open link" going to redirect URL
- **Root cause:** The `destination` / `finalUrl` was embedded only inside the HMAC `SecureToken` and not stored as a plain DB column — backend `LinkListItemDto` had no `FinalUrl` field, so the frontend always showed `"—"`.
- **Fix:** Added `final_url` column to the backend (see Backend Changes below). "Open link" button now opens `finalUrl` when available.
- **Files:** Multiple (see below)

---

### Backend Changes (FinalUrl)

> **Migration required:** run `ALTER TABLE short_links ADD COLUMN IF NOT EXISTS final_url TEXT` against the PostgreSQL database before restarting the backend. Existing links will show `"—"` as destination until recreated.

#### `backend/Lynx.Api/Domain/Entities/ShortLink.cs`
Added property after `SecureToken`:
```csharp
public string? FinalUrl { get; set; }
```

#### `backend/Lynx.Api/Infrastructure/AppDbContext.cs`
Added EF column mapping inside `OnModelCreating`:
```csharp
entity.Property(e => e.FinalUrl).HasColumnName("final_url");
```

#### `backend/Lynx.Api/Dtos/Admin/LinkSearchDto.cs`
Added to `LinkListItemDto`:
```csharp
public string? FinalUrl { get; set; }
```

#### `backend/Lynx.Api/Services/AdminLinksService.cs`
Added to `MapToDto()`:
```csharp
FinalUrl = x.FinalUrl,
```

#### `backend/Lynx.Api/Services/ShortLinkService.cs`
Added to entity creation (so new links populate the column):
```csharp
FinalUrl = finalUrl,
```

---

### Frontend Changes (FinalUrl / real short URLs)

#### `platform/src/app/dashboard/links/page.tsx`
- Added `finalUrl?: string | null` to `LinkListItemDto` interface
- `mapDto`: `destination: item.finalUrl ?? "—"` (was `"—"` always)
- `mapDto`: `shortUrl: \`${API_BASE}/r/${item.shortCode}\`` (was `url.ify/...`)
- Create response: uses `res.shortUrl || \`${API_BASE}/r/${res.shortCode}\``

#### `platform/src/app/dashboard/links/[id]/page.tsx`
- Added `finalUrl?: string | null` to `LinkListItemDto` interface
- `mapDto`: `destination: item.finalUrl ?? "—"`
- `mapDto`: `shortUrl: \`${apiBase}/r/${item.shortCode}\``
- "Open link" button href: uses `link.finalUrl` when set, falls back to `link.shortUrl`

#### `platform/src/app/dashboard/page.tsx`
- Short URL constructed as `` `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055"}/r/${shortCode}` `` (was `url.ify/...`)

---
