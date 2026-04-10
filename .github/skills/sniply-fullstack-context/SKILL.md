---
name: sniply-fullstack-context
description: "Use when working on the Sniply/url.ify project to analyze repo structure, connect the Next.js platform frontend to the Lynx.Api backend, replace mock dashboard data, map frontend pages to backend endpoints, or understand which app folders are active versus redundant. Keywords: platform dashboard, Lynx.Api, tenant header, X-Tenant-Id, short links, campaigns, analytics, API keys, website cleanup, frontend/backend integration."
---

# Sniply Full-Stack Context

## Project Topology

- `platform/` is the actual product dashboard app. It is a Next.js App Router project running on port `3001` and currently redirects `/` to `/dashboard`.
- `website/` is the public marketing site. It is a Next.js app running on port `3000`.
- `frontend/` is effectively another copy of the marketing site and appears redundant. Treat it as a removal candidate unless the user says otherwise.
- `backend/Lynx.Api/` is the primary .NET 9 API. It uses PostgreSQL, Redis, tenant-aware middleware, and Swagger.
- `docs/BACKEND_API_CONTEXT.md` and `docs/BACKEND_INTEGRATION.md` are the current backend integration references and should be checked before guessing endpoints.

## Current State

- The `platform/` dashboard is mostly UI-complete but still mock-driven.
- Mock auth currently lives in `platform/src/app/api/mock-auth/route.ts` and sets a `sniply_session` cookie with demo modes such as `trial` and `paid`.
- Dashboard layout currently resolves user/workspace from local mock helpers instead of backend data.
- Marketing site shortening currently uses TinyURL in `frontend/src/components/ShortenLinkCard.tsx`, not the local backend.
- The backend already exposes real link, analytics, tenant configuration, HMAC, campaign, domain, security, and admin endpoints.

## Backend Rules That Matter

- The main API is the source of truth and is expected on port `5055`.
- Tenant-scoped requests require the `X-Tenant-Id` header.
- There is no confirmed end-user login flow in the backend currently. Do not invent a JWT/session solution unless the user asks or the repo adds one.
- Short link creation currently centers on `POST /api/v1/short-links` with `finalUrl`, `expiryMinutes`, and `oneTimeUse`.
- Tenant configuration currently centers on:
  - `GET /api/v1/tenant/configuration`
  - `PATCH /api/v1/tenant/configuration`
  - `GET /api/v1/tenant/configuration/profile`
- Admin and analytics surfaces exist under controller groups such as:
  - `Controllers/LinkManagement`
  - `Controllers/Analytics`
  - `Controllers/Configuration`
  - `Controllers/Security`
  - `Controllers/Marketing`
  - `Controllers/System`

## Working Guidance

When asked to connect frontend and backend:

1. Treat `platform/` as the primary integration target unless the user explicitly asks for the marketing site.
2. Replace mock auth and mock workspace resolution with a shared API client plus tenant context strategy.
3. Prefer tenant-scoped endpoints first for tenant UX, and only use admin endpoints when the page clearly represents admin operations.
4. Reuse the backend DTO shapes and documented endpoints instead of preserving frontend-only fields that the API does not support.
5. If the frontend form contains unsupported fields, call that out and either trim the UI contract or stage the backend work to support them.
6. Avoid touching `frontend/` and `website/` in the same task unless the user explicitly wants marketing-site cleanup.

## Likely First Integration Targets

- Dashboard layout and shell: fetch tenant configuration and profile instead of using mock workspace/user helpers.
- Links page: replace `dashboardData.links` with backend list/search/create/revoke flows.
- Analytics page: replace hardcoded charts with backend analytics endpoints.
- Settings and security pages: wire API keys, tenant config, domains, and security endpoints.
- Marketing shortener card: swap TinyURL usage for the local `Lynx.Api` short-link endpoint if the user wants the public site connected too.

## Known Gaps To Validate Before Deep Implementation

- How tenant identity is obtained in the real product flow.
- Whether a separate platform service on port `5087` is still required for tenant lookup in this repo.
- Which advanced link fields from the platform UI are already supported by backend DTOs versus still missing.
- Whether `frontend/` can be safely removed now or should wait until after migration to `website/`.

## Practical Defaults

- For dashboard work, inspect `platform/src/app/dashboard/**` first.
- For backend route truth, inspect the controller file before trusting older notes.
- For integration work, centralize fetch logic early so `X-Tenant-Id`, base URL, and error handling are not duplicated page by page.
- Keep changes incremental: wire one page or one domain at a time and verify against live backend contracts.