# Separate successful SQLite scan cadence from failure recovery

Status: local implementation complete; targeted source checks passed. Not pushed or deployed. Runtime/Android acceptance pending.

Approved scope: coordinator five-part speed/loader correction assignment, rooted at production 5a603049584bec00f8d9daa5c90a0f65326f42db. See [PWA plan](traderlink-platform-pwa-plan.md). Exact checkpoint metadata is in qa-evidence/pwa-speed-integrity-20260928.json.

## Corrections

Successful background foreign-key scans now have at least five minutes between release and the next routine scan; successful combined quick scans have thirty minutes. Existing elapsed-scan storage cooldown can lengthen this. Separate optional state fields prevent these routine intervals from changing failure retries or identity/structure recovery. Initial combined scan, structure/migration gates, dirty tracking, worker occupancy, phase deadlines and corruption latches remain intact. Writes cannot postpone an already scheduled scan. Clean unchanged data still does not rescan.

## Verification

Changed TypeScript/TSX passed syntax transpilation and targeted ESLint. Focused source-driven mocked contracts passed for successful/failure scan cadence, mandatory recovery guard preservation, registration coalescing/recovery, navigation target validation, RSC resolver-only edits and client boundary. Existing startup integrity source proof also passed for the integrity candidate. These are simulations/static checks, not real database/browser/phone acceptance. No Vitest, production build, server, DB/config mutation or notifications.

## Limits and remaining acceptance

Latent external corruption can take longer to be detected after a successful scan: up to the next dirty-data scan/cooldown, rather than the former short routine intervals. Mandatory synchronous structure and observed-corruption gates are preserved. No claim that scans caused the measured Analytics stall. No database or runtime mutation, timing benchmark or full runtime acceptance. Help unchanged because this is internal maintenance.

## Allowlist

- src/modules/platform/server/database/open-platform-database.ts
- docs/migration/pwa-speed-integrity-progress-2026-09-28.md
- docs/migration/traderlink-platform-pwa-plan.md (progress link only)
