# Fix Session Tracker empty-state client boundary

Status: local implementation complete; targeted source checks passed. Not pushed or deployed. Runtime/Android acceptance pending.

Approved scope: coordinator five-part speed/loader correction assignment, rooted at production 5a603049584bec00f8d9daa5c90a0f65326f42db. See [PWA plan](traderlink-platform-pwa-plan.md). Exact checkpoint metadata is in qa-evidence/pwa-speed-tracker-20260928.json.

## Corrections

Moved only the empty-state Typography theme callback into a client component. Exact text, dark/light colors, font weight, width and surrounding form remain unchanged. Prevents passing a function from the server page to MUI on the no-session-data branch.

## Verification

Changed TypeScript/TSX passed syntax transpilation and targeted ESLint. Focused source-driven mocked contracts passed for successful/failure scan cadence, mandatory recovery guard preservation, registration coalescing/recovery, navigation target validation, RSC resolver-only edits and client boundary. Existing startup integrity source proof also passed for the integrity candidate. These are simulations/static checks, not real database/browser/phone acceptance. No Vitest, production build, server, DB/config mutation or notifications.

## Limits and remaining acceptance

Real empty-account route render was not run. No UI redesign. Existing Help remains accurate; no guide edit required.

## Allowlist

- app/(dashboard)/trade-tracker/page.tsx
- app/(dashboard)/trade-tracker/trade-tracker-empty-notice.tsx
- docs/migration/pwa-speed-tracker-progress-2026-09-28.md
- docs/migration/traderlink-platform-pwa-plan.md (progress link only)
