# Reuse request-scoped identity on three dashboard pages

Status: local implementation complete; targeted source checks passed. Not pushed or deployed. Runtime/Android acceptance pending.

Approved scope: coordinator five-part speed/loader correction assignment, rooted at production 5a603049584bec00f8d9daa5c90a0f65326f42db. See [PWA plan](traderlink-platform-pwa-plan.md). Exact checkpoint metadata is in qa-evidence/pwa-speed-identity-20260928.json.

## Corrections

Replace uncached no-options page-scope reads with the existing React Server Component request-scoped helper on Calendar, Analytics overview and Session Tracker. The shell already uses this same authenticated dashboard identity. Do not change explicit request resolvers, Server Actions, member-only permissions, cookie/account selection, or cross-request state. Preserve the preceding Tracker empty-state correction.

## Verification

Changed TypeScript/TSX passed syntax transpilation and targeted ESLint. Focused source-driven mocked contracts passed for successful/failure scan cadence, mandatory recovery guard preservation, registration coalescing/recovery, navigation target validation, RSC resolver-only edits and client boundary. Existing startup integrity source proof also passed for the integrity candidate. These are simulations/static checks, not real database/browser/phone acceptance. No Vitest, production build, server, DB/config mutation or notifications.

## Limits and remaining acceptance

Noncritical shell-read deferral was evaluated and not implemented: initial unread counts, halt controls, appearance and account data currently depend on those synchronous reads. Defaulting them would change visible truth; adding an asynchronous loading contract is a separate UI slice. Watchlist member identity remains unchanged. Authentication/account-switch runtime acceptance pending. Help unchanged.

## Allowlist

- app/(dashboard)/calendar/page.tsx
- app/(dashboard)/analytics/analytics-overview-page.tsx
- app/(dashboard)/trade-tracker/page.tsx
- docs/migration/pwa-speed-identity-progress-2026-09-28.md
- docs/migration/traderlink-platform-pwa-plan.md (progress link only)
