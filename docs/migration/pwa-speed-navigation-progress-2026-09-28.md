# Give slow PWA navigation bounded time and clear recovery

Status: local implementation complete; targeted source checks passed. Not pushed or deployed. Runtime/Android acceptance pending.

Approved scope: coordinator five-part speed/loader correction assignment, rooted at production 5a603049584bec00f8d9daa5c90a0f65326f42db. See [PWA plan](traderlink-platform-pwa-plan.md). Exact checkpoint metadata is in qa-evidence/pwa-speed-navigation-20260928.json.

## Corrections

Increase authenticated NetworkOnly navigation timeout from twelve to thirty seconds. On failure, carry a navigation-recovery marker into the existing public saved-data shell and offer a same-origin Try again link preserving the intended path/query. State only that the live page could not load; do not infer lost connectivity. Existing saved pages, offline entry and push handlers stay unchanged. Update the app Help guide.

## Verification

Changed TypeScript/TSX passed syntax transpilation and targeted ESLint. Focused source-driven mocked contracts passed for successful/failure scan cadence, mandatory recovery guard preservation, registration coalescing/recovery, navigation target validation, RSC resolver-only edits and client boundary. Existing startup integrity source proof also passed for the integrity candidate. These are simulations/static checks, not real database/browser/phone acceptance. No Vitest, production build, server, DB/config mutation or notifications.

## Limits and remaining acceptance

A stalled response may now wait thirty seconds. Serwist NetworkOnly races the deadline but does not abort its underlying fetch; this behavior is unchanged. No automatic retry loop and no authenticated HTML cache. Service-worker build/precache/installed-phone behavior still needs release acceptance; no build/server/browser run in this slice.

## Allowlist

- app/sw.ts
- app/offline/page.tsx
- app/pwa/navigation-recovery-notice.tsx
- src/modules/help/traderslink-app-guides.ts
- docs/migration/pwa-speed-navigation-progress-2026-09-28.md
- docs/migration/traderlink-platform-pwa-plan.md (progress link only)
