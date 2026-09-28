# Share service-worker initialization across PWA push callers

Status: local implementation complete; targeted source checks passed. Not pushed or deployed. Runtime/Android acceptance pending.

Approved scope: coordinator five-part speed/loader correction assignment, rooted at production 5a603049584bec00f8d9daa5c90a0f65326f42db. See [PWA plan](traderlink-platform-pwa-plan.md). Exact checkpoint metadata is in qa-evidence/pwa-speed-push-20260928.json.

## Corrections

Share a page-session registration/ready promise between bootstrap and push helpers. Remove the immediate redundant update call because register already performs an update check; the existing update notice retains later foreground checks. Keep the fifteen-second readiness deadline, clear timers, and allow a fresh attempt after failure/timeout. Cache only device-wide registration, never account identity, subscription status, permission decisions or subscription mutations.

## Verification

Changed TypeScript/TSX passed syntax transpilation and targeted ESLint. Focused source-driven mocked contracts passed for successful/failure scan cadence, mandatory recovery guard preservation, registration coalescing/recovery, navigation target validation, RSC resolver-only edits and client boundary. Existing startup integrity source proof also passed for the integrity candidate. These are simulations/static checks, not real database/browser/phone acceptance. No Vitest, production build, server, DB/config mutation or notifications.

## Limits and remaining acceptance

This deduplicates registration initialization only, not all push status POSTs. It does not prove Android notification display or tap behavior. No alerts sent and no preferences, categories or subscriptions changed. Existing Help instructions remain accurate.

## Allowlist

- app/pwa/pwa-service-worker-bootstrap.tsx
- src/modules/platform/client/pwa/platform-service-worker-registration.ts
- src/modules/platform/client/pwa/platform-web-push.ts
- docs/migration/pwa-speed-push-progress-2026-09-28.md
- docs/migration/traderlink-platform-pwa-plan.md (progress link only)
