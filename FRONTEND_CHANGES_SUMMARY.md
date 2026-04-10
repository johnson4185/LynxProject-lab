# Frontend Changes & Enhancements Summary
**For: Sniply/url.ify Platform Dashboard**  
**Date:** April 9, 2026  
**Status:** Ready for Phase 1 Implementation

---

## EXECUTIVE SUMMARY

The backend API is **100% production-ready** with 40+ endpoints across 7 domains. The frontend dashboard is **80% visually complete** but **0% integrated** with the backend—currently running entirely on mock data.

### By the Numbers:
- ✅ **Backend API:** 40+ endpoints, fully documented in `INTEGRATION_BLUEPRINT.md`
- ✅ **Frontend UI:** 15 dashboard pages, forms complete, styling polished
- ❌ **Integration:** 0% (all endpoints unused, all data hardcoded mock)
- ⚠️ **Auth Blocker:** How users login is NOT yet defined—this is blocking all integration

**Estimated Integration Effort:** 3-4 weeks for one frontend engineer with no backend changes needed.

---

## CRITICAL BLOCKER: USER AUTHENTICATION

**Issue:** The backend API has NO login endpoint.

**Current State:**
- Backend uses `X-Tenant-Id` header for tenant scoping (no user identity)
- Frontend has mock auth in `platform/src/app/api/mock-auth/route.ts`
- Real product needs user login, API auth, session handling

**Decision Needed (URGENT):**
Choose ONE of these approaches:

### Option A: OAuth Flow
- Implement login via Google/GitHub/SSO
- Exchange token for backend session
- Store session in cookie + context
- Send `X-Tenant-Id` header on every API call

### Option B: API Key Authentication
- User logs in, gets permanent API key
- Frontend stores key locally
- Every request includes key in header: `Authorization: Bearer sk_live_...`
- Backend validates against tenant's API keys

### Option C: Backend User/Login Endpoint
- Backend implements `POST /api/v1/auth/login` with email/password
- Returns session token
- Frontend includes token in headers

**Recommendation:** Option A (OAuth). Simplest, most secure, most user-friendly.

**Until this is resolved:** You can continue frontend development using mock tenantId + hardcoded header.

---

## PART 1: FRONTEND GAPS vs BACKEND

### A. Links Page (`/dashboard/links`)

**Fully Synced (Ready to Wire Now):**
- ✅ `finalUrl` → backend `POST /api/v1/short-links`
- ✅ `expiryMinutes` → backend accepts, clamps 1-43200
- ✅ `oneTimeUse` → backend enforces via Redis
- ✅ `shortCode`, `shortUrl` → returned from creation
- ✅ Click stats → from `GET /api/v1/analytics/summary`

**Partially Supported (Need 2-Step: Create then PATCH):**
- ⚠️ `title` → only available via `PUT /api/admin/v1/links/{code}`
- ⚠️ `tags` → only available via `PUT /api/admin/v1/links/{code}`
- ⚠️ `campaignId` → only available via `PUT /api/admin/v1/links/{code}`

**Not Supported (Must be removed from UI):**
- ❌ `password` → backend doesn't have password protection
- ❌ `customSlug` → backend doesn't expose custom code input
- ❌ `domain` → backend doesn't track tenant domain
- ❌ `qrCodeUrl` → backend doesn't auto-generate QR codes
- ❌ `pixelUrl` → tracking pixels not implemented
- ❌ `geoTargeting` → no geo-filtering on redirects

**Backend Endpoints Available:**
```
POST   /api/v1/short-links                         → Create link
GET    /api/admin/v1/links                          → List with search/filter
GET    /api/admin/v1/links/{code}                  → Get details
PUT    /api/admin/v1/links/{code}                  → Update (title, tags, campaign)
POST   /api/admin/v1/links/{code}/revoke           → Revoke link
POST   /api/admin/v1/links/{code}/activate         → Reactivate revoked link
POST   /api/admin/v1/links/{code}/extend-expiry    → Add more time
POST   /api/admin/v1/links/bulk/revoke             → Revoke multiple
```

**Action Items:**
1. **Immediate:** Wire create/list/revoke —no backend changes needed
2. **Sprint 2:** Add title/tags to form, update link immediately after create
3. **Future:** Remove password/QR/geo fields from UI or request backend implementation

---

### B. Campaigns Page (`/dashboard/campaigns`)

**Current State:** Stub form only, NO list view, NO data

**What Backend Supports:**
```
POST   /api/admin/v1/campaigns                     → Create
GET    /api/admin/v1/campaigns                     → List with search/filter/pagination
GET    /api/admin/v1/campaigns/{id}                → Get details
PUT    /api/admin/v1/campaigns/{id}                → Update fields
POST   /api/admin/v1/campaigns/{id}/status         → Change status (Draft→Active→Paused→Closed→Archived)
POST   /api/admin/v1/campaigns/{id}/clone          → Clone with options
POST   /api/admin/v1/campaigns/{id}/analytics/...  → Get campaign analytics
```

**Campaign Status Workflow:**
```
Draft ──(activate)──> Active ──(pause)──> Paused
                         ↓                   ↓
                      (close) ──────> Closed
                         
Any state ──(archive)──> Archived ──(restore)──> Previous
```

**Supported Fields:**
- Name, description, status
- Date range (startDate, endDate)
- Limits: dailyClickLimit, totalClickLimit (reporting only, not enforced)
- Budget: budgetAmount, currency
- UTM: utmSource, utmMedium, utmCampaign (appended to all links in campaign)

**Action Items:**
1. Build campaign list table (replace form-only stub)
2. Implement CRUD operations
3. Add status workflow UI (badge + dropdown)
4. Embed campaign analytics in detail view
5. Add clone functionality

---

### C. Settings/Configuration (`/dashboard/settings`)

**Current:** Completely mock-driven. Backend has rich configuration.

**Backend Configuration:**
```
GET    /api/v1/tenant/configuration                → Get all settings
PATCH  /api/v1/tenant/configuration                → Update settings
GET    /api/v1/tenant/configuration/profile        → Get tenant profile
```

**Available Settings:**
- `plan` (e.g., "TRIAL", "PRO", "GROWTH") — read-only
- `timezone` — IANA timezone, editable
- `defaultLinkExpiryMinutes` — default expiry for new links, editable
- `redirectRateLimit` — redirects/minute per tenant (read-only)
- `createRateLimit` — creates/minute per tenant (read-only)
- `monthlyLinksQuota`, `monthlyClicksQuota` — usage limits (read-only + show progress)
- `autoBlockEnabled` — toggle, editable
- `autoBlockThreshold` — N failed attempts before block, editable
- `autoBlockWindowSeconds`, `autoBlockTtl` — timing, editable
- `botScoreThreshold` — 0-100 score to block, editable

**Action Items:**
1. Create multi-tab settings page
2. Wire all read-only displays (plan, quotas, limits)
3. Wire all editable fields (timezone, defaults, security thresholds)
4. Add usage progress bars

---

### D. API Keys Page (`/dashboard/api-keys`)

**Current:** Missing entirely (page exists but no functionality)

**Backend Fully Supports:**
```
POST   /api/admin/v1/tenant/api-keys               → Create key
GET    /api/admin/v1/tenant/api-keys               → List (masked)
POST   /api/admin/v1/tenant/api-keys/{id}/rotate   → Rotate key
POST   /api/admin/v1/tenant/api-keys/{id}/revoke   → Revoke key
DELETE /api/admin/v1/tenant/api-keys/{id}          → Delete key
```

**Key Fields:**
- `name` — descriptive name
- `scopes` — array of permissions (create_link, read_analytics, admin, etc.)
- `isActive` — toggle
- `expiresAt` — optional expiration date
- `rateLimit` — optional per-minute cap

**Action Items:**
1. Implement key list table with status badges
2. Create key modal with scope multi-select
3. Implement rotate, revoke, delete actions
4. Show plain-text key once after creation (with secure copy button)

---

### E. Domains Page (`/dashboard/domains`)

**Current:** Missing entirely

**Backend Fully Supports:**
```
POST   /api/v1/tenant/domains                      → Add custom domain
GET    /api/v1/tenant/domains                      → List domains
PUT    /api/v1/tenant/domains/{id}                 → Update
DELETE /api/v1/tenant/domains/{id}                 → Delete
POST   /api/v1/tenant/domains/{id}/verify          → Trigger verification
GET    /api/v1/tenant/domains/{id}/verification   → Get latest verification status
```

**Domain States:**
- `Unverified` — awaiting DNS setup
- `VerificationInProgress` — checking DNS
- `Verified` — ready to use
- `VerificationFailed` — DNS incorrect
- `SSLPending`, `SSLActive`, `SSLFailed` — ACME certificate status

**Action Items:**
1. Create new `/dashboard/domains` page
2. Table with domain, status, SSL status, actions
3. "Add Domain" modal asking for hostname
4. "Verify" action showing CNAME/TXT instructions
5. Display verification result

---

### F. Webhooks Page (`/dashboard/webhooks`)

**Current:** Missing entirely

**Backend Fully Supports:**
```
POST   /api/v1/tenant/webhooks                     → Create
GET    /api/v1/tenant/webhooks                     → List
PUT    /api/v1/tenant/webhooks/{id}                → Update
DELETE /api/v1/tenant/webhooks/{id}                → Delete
POST   /api/v1/tenant/webhooks/{id}/test           → Send test payload
GET    /api/v1/tenant/webhooks/{id}/logs           → Get delivery history
```

**Webhook Events:**
- `link.created`
- `link.clicked`
- `link.revoked`
- `campaign.created`
- `campaign.status_changed`

**Action Items:**
1. Create `/dashboard/webhooks` page
2. Table with URL (masked), events, status, actions
3. "Create Webhook" modal with event multi-select
4. "Test Webhook" action to send sample payload
5. "View Logs" showing delivery history + response codes

---

### G. Analytics Page (`/dashboard/analytics`)

**Current:** UI is well-designed, but all data is mocked hardcodes

**Which Endpoints to Wire:**
```
GET    /api/v1/analytics/summary                   → All KPIs (clicks, devices, geos, referrers)
GET    /api/v1/analytics/top-shortcodes            → Top 10 by clicks
GET    /api/v1/analytics/top-failed-ips            → Top failed IPs for blocking
GET    /api/admin/dashboard/events                 → Security + lifecycle events
```

**Action Items:**
1. Add time range selector: Last 24h | 7d | 30d | Custom
2. Wire all chart data (already structured correctly in mock)
3. Add export buttons (CSV/PDF) — frontend-only, no API needed
4. Add security event log filtering

---

### H. Dashboard Overview (`/dashboard`)

**Current:** All metrics hardcoded from `dashboardData`

**What to Wire:**
```
GET    /api/v1/analytics/summary                   → KPI metrics
GET    /api/v1/analytics/top-shortcodes            → Top 5 links
GET    /api/admin/dashboard/events                 → Activity feed
GET    /api/admin/dashboard/blocks                 → Security alerts count
```

**Action Items:**
1. Fetch real KPI metrics (total clicks, active links, CTR)
2. Replace top links table
3. Replace activity feed with recent events
4. Add usage quota progress bars

---

## PART 2: UI ENHANCEMENTS & NEW FEATURES

### A. Dashboard Layout Enhancements

**What to Add:**
- Real workspace/tenant name fetched from backend
- Plan badge with status (TRIAL: 30 days left / PRO: Active)
- Quota usage bars at top:
  - Links used: 45/100 per month
  - Clicks used: 8,234/50,000 per month
- Quick actions: Create Link | Launch Campaign

**Endpoints:**
```
GET /api/v1/tenant/configuration         → plan, quotas, usage
```

---

### B. Links Page Enhancements

**Advanced Filtering:**
```
- Status filter: [All] [Active] [Revoked] [Expired]
- Campaign dropdown: filter by assigned campaign
- Date range: Created from/to
- Search: by shortCode, title, or destination URL
```

**Bulk Operations:**
```
- Checkbox select on each row
- "Revoke Selected" button
- "Extend Expiry" for multiple
- Confirm dialog showing count
```

**Link Details Drawer:**
```
Click a row → opens right sidebar showing:
- Full metadata (title, tags, campaign, created by)
- QR code (generated client-side from shortUrl)
- Expiry countdown if < 7 days
- Click timeline for this specific link
- Action buttons: Extend | Revoke | Reactivate
```

**Endpoint:**
```
POST /api/admin/v1/links/bulk/revoke     → Multiple revoke
POST /api/admin/v1/links/{code}/extend-expiry
```

---

### C. Campaigns Page Enhancements (Major Build)

**Campaign List Table:**
```
Columns:
- Name (link to details)
- Status badge: Draft | Active | Paused | Closed | Archived
- Dates: "Jan 15 — Feb 28" or "Not started"
- Links count: "12 links" (count of links assigned)
- Clicks: aggregated clicks
- Budget: "$500 / $1000 spent" if tracking
- Actions: Edit | Clone | Archive | Analytics
```

**Create Campaign Modal:**
```
Fields:
- Name (required, text)
- Description (optional, textarea)
- Status: Always defaults to "Draft"
- Dates: Optional start/end calendar picker
- Limits:
  - Daily click limit (number input, or 0 = unlimited)
  - Total click limit (number input, or 0 = unlimited)
- Budget section:
  - Amount (currency input)
  - Currency dropdown (USD, EUR, GBP, SAR, INR, etc.)
- UTM section:
  - utm_source (text)
  - utm_medium (text)
  - utm_campaign (text)
```

**Campaign Status Transitions:**
```
Show state machine with visual workflow
- Draft → Active (green "Launch" button)
- Active → Paused (yellow "Pause" button)
- Active/Paused → Closed (red "End Campaign" button)
- Any state → Archived (gear icon → "Archive")
- Archived → Previous state (restore button)
```

**Clone Functionality:**
```
"Clone Campaign" button shows dialog:
- New name (pre-filled: "{Original} (Copy)")
- Checkboxes:
  ☑ Clone UTM fields
  ☑ Clone limits
  ☐ Clone dates
```

**Analytics Embed in Campaign Details:**
```
GET /api/admin/v1/campaigns/{id}/analytics/summary
Show:
- Total clicks in campaign
- Top 5 short codes by clicks
- Average CTR
- Cost per click (if budget tracking)
- Clicks trend (line chart)
```

**Endpoints:**
```
POST /api/admin/v1/campaigns
GET /api/admin/v1/campaigns
PUT /api/admin/v1/campaigns/{id}
POST /api/admin/v1/campaigns/{id}/status
POST /api/admin/v1/campaigns/{id}/clone
GET /api/admin/v1/campaigns/{id}/analytics/summary
```

---

### D. Settings Page (New, Multi-Tab)

**Tab 1: General**
```
- Workspace name (display only)
- Plan: TRIAL | PRO | GROWTH (display only)
- Trial expires: 30 days (if applicable)
- Timezone: dropdown IANA (editable)
- Default link expiry: slider 1-43200 min (editable)
- Allow custom domains: toggle (editable)
```

**Tab 2: Rate Limits & Quotas**
```
Read-only displays:
- Redirects/min limit
- Creates/min limit
- Monthly links quota
- Monthly clicks quota
- Progress bar for each showing current usage
```

**Tab 3: Security**
```
- Auto-block enabled: toggle
- Auto-block threshold: number input (N failed attempts)
- Auto-block window: slider (seconds to count)
- Auto-block TTL: slider (how long block lasts)
- Bot score threshold: slider (0-100)
```

**Tab 4: Custom Domains**
```
Table with domain, status (Verified/Unverified/Failed), SSL status
Actions: Verify | Delete
"Add Domain" button → input domain name
Show verification instructions after adding
```

**Tab 5: IP Security**
```
Sub-tabs:
- Blocked IPs: table of IP/CIDR, reason, expiry, actions
- Whitelisted IPs: similar
"Add Block" button → input IP/CIDR, reason, expiry
```

**Endpoints:**
```
GET /api/v1/tenant/configuration
PATCH /api/v1/tenant/configuration
POST /api/v1/tenant/domains
GET /api/v1/tenant/domains
POST /api/admin/security/ip-blocks
GET /api/admin/security/ip-blocks
```

---

### E. New Pages to Build

**1. API Keys (`/dashboard/api-keys`)**
- List table: name, scopes (tags), status, created, expires, last used, usage count
- "Create API Key" button → modal with scope multi-select
- Show plain-text key once after creation
- Actions: Rotate, Revoke, Delete
- Success message: "Copy key before closing. You won't see this again."

**2. Webhooks (`/dashboard/webhooks`)**
- List table: URL (masked), events subscribed (tags), status, success rate, last triggered
- "Create Webhook" button → modal for URL + event multi-select
- "Test Webhook" action → send sample + show response
- "View Logs" action → delivery history table with status codes

**3. Domains (`/dashboard/domains`)**
- List table: domain name, verification status, SSL status, actions
- "Add Domain" button → input domain, show CNAME instructions
- "Verify" action → submits verification to backend
- "Delete" action → remove from list

---

### F. Analytics Enhancements

**Add These:**
1. Time range selector: Last 24h | 7d | 30d | Custom date range
2. Export buttons: CSV, PDF, JSON
3. Security event log: table showing IP blocks, rate limits, bot blocks
4. Export specific link analytics (individual link detail view)

---

## PART 3: INTEGRATION ROADMAP

### Phase 1: CRITICAL — Set Foundation (Weeks 1-2)

**Goals:** Get real data flowing, eliminate mock auth blocker

**Tasks:**
- [ ] Resolve user authentication (decide between OAuth/API Key/Backend login)
- [ ] Create API client with X-Tenant-Id default header
- [ ] Create tenant context provider (load config on app init)
- [ ] Wire dashboard overview (KPIs, top links, activity feed)
- [ ] Wire links list (GET, POST, DELETE/revoke)
- [ ] Wire links filters (status, campaign, search)

**Commit checkpoints:**
1. `feat: setup api-client and tenant context`
2. `feat: wire dashboard overview with real data`
3. `feat: wire links list and basic CRUD`

**Success Criteria:**
- Dashboard shows real metrics from backend
- Can create a link and see it in list
- Can revoke a link
- No more hardcoded `dashboardData`

---

### Phase 2: HIGH PRIORITY (Weeks 3-4)

**Goals:** Complete core dashboard functionality

**Tasks:**
- [ ] Build campaigns list view (full CRUD)
- [ ] Implement campaign status workflow UI
- [ ] Wire settings page (all tabs)
- [ ] Wire analytics page (all charts + time range)
- [ ] Add bulk operations to links (select + revoke multiple)

**Commit checkpoints:**
1. `feat: campaigns complete CRUD with status workflow`
2. `feat: settings page with all tabs`
3. `feat: analytics with time range selector`

---

### Phase 3: MEDIUM PRIORITY (Weeks 5-6)

**Goals:** Complete secondary features

**Tasks:**
- [ ] Build API keys page (create, list, rotate, revoke)
- [ ] Build domain management page (add, verify, delete)
- [ ] Build webhooks page (create, test, view logs)
- [ ] Add link details drawer with extended metadata
- [ ] Add IP security management (blocks list)

**Commit checkpoints:**
1. `feat: api-keys management page`
2. `feat: domains verification and management`
3. `feat: webhooks creation and testing`

---

### Phase 4: NICE-TO-HAVE (Weeks 7+)

**Goals:** Polish and advanced features

**Tasks:**
- [ ] Analytics export (CSV, PDF)
- [ ] Campaign clone with options
- [ ] Advanced link search and filtering
- [ ] Real-time activity notifications
- [ ] Bulk operations (extend expiry, re-activate)
- [ ] Performance optimizations (pagination, caching)

---

### Phase 5: FUTURE (Backend Changes Required)

**These features need backend work:**
- [ ] Password protection on links (backend: add password field to LinkDto)
- [ ] Custom slug input (backend: expose shortCode as input)
- [ ] QR code generation (backend or third-party service)
- [ ] Geo-targeting (backend: add geo filter to redirect)
- [ ] Tracking pixels (backend: add pixel tracking)
- [ ] User login flow (define auth strategy)

---

## PART 4: CRITICAL DECISIONS

**Before Phase 1, make these decisions:**

| Decision | Options | Recommendation |
|---|---|---|
| **User Authentication** | OAuth / API Key / Backend Login | OAuth (Google/GitHub) |
| **Session Storage** | Cookie / LocalStorage / Context | Cookie + Context |
| **API Base URL** | Hardcode / Env var / Dynamic | Env var (.env.local) |
| **Error Handling** | Toast messages / Error boundary / Page? | Toast + Error boundary |
| **Loading States** | Skeleton screens / Spinners / Disabled buttons | Skeleton screens on list pages |
| **Field Decisions** | Remove password/QR/geo / Request backend? | Remove from UI (backlog for later) |

---

## PART 5: CODE EXAMPLES

### API Client Setup

```typescript
// platform/src/lib/apiClient.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5055';

export const apiClient = {
  async request<T>(
    path: string,
    { method = 'GET', body, ...options }: RequestInit = {}
  ): Promise<T> {
    const tenantId = localStorage.getItem('tenantId') || 'demo-tenant';
    
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  },

  // Convenience methods
  create<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body });
  },

  list<T>(path: string) {
    return this.request<T>(path);
  },

  update<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PUT', body });
  },

  delete(path: string) {
    return this.request(path, { method: 'DELETE' });
  },
};
```

### Create Link Example

```typescript
// platform/src/app/dashboard/links/page.tsx
async function createLink(finalUrl: string, expiryMinutes: number) {
  try {
    const response = await apiClient.create(
      '/api/v1/short-links',
      {
        finalUrl,
        expiryMinutes,
        oneTimeUse: false,
      }
    );
    
    toast.success(`Link created: ${response.shortUrl}`);
    setLinks([...links, response]);
  } catch (error) {
    toast.error('Failed to create link');
  }
}
```

---

## PART 6: SUMMARY & NEXT STEPS

| What | Status | Priority | Timeline |
|---|---|---|---|
| **Backend API** | ✅ 100% ready | — | Done |
| **Frontend UI** | ✅ 80% designed | — | Done |
| **Frontend-API Integration** | ❌ 0% | CRITICAL | Phase 1-2 |
| **User Auth** | ❌ Not defined | BLOCKER | Immediate |
| **Advanced Features** | — | Nice-to-have | Phase 3-5 |

### Your Next Move:

1. **Thursday:** Resolve user authentication approach (decision meeting)
2. **Friday:** Start Phase 1 (API client + tenant context)
3. **Week 2:** Dashboard + Links + Campaigns
4. **Week 3-6:** Complete all secondary pages
5. **Week 7+:** Polish, optimize, add nice-to-have features

---

## Reference Files

- **Full Endpoint Reference:** [INTEGRATION_BLUEPRINT.md](INTEGRATION_BLUEPRINT.md) (9,800 lines)
- **Backend API Context:** [docs/BACKEND_API_CONTEXT.md](docs/BACKEND_API_CONTEXT.md)
- **Integration Docs:** [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md)
- **Copilot Skill:** [.github/skills/sniply-fullstack-context/SKILL.md](.github/skills/sniply-fullstack-context/SKILL.md)

---

**Ready to start building? Let's go to Phase 1!** 🚀
