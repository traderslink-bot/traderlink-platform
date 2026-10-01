# Safe automatic PWA updates — 2026-09-28

Status: local implementation and targeted checks complete. No push/deployment authorized. Parent: 3e40070f577e3b43c3279dd97809006878729f67. [Controlling PWA plan](traderlink-platform-pwa-plan.md).

## Owner-approved behavior

Downloaded updates automatically activate and reload on clean opening/resume or safe page navigation in browser tabs and installed PWA under the same service-worker scope. Never automatically reload an editing page. Routine successful updates have no banner; unresolved editing/other-window safety or automatic failure retains plain-language guidance. Preserve saved offline entries, authenticated HTML NetworkOnly and explicit failure recovery.

## Implementation

- PwaUpdateNotice observes the current waiting worker and pathname/resume boundaries, requests guarded activation, and rechecks visibility, connectivity, paused state and page safety immediately before reload. First installation does not reload. Only one reload per document. A timeout disables late automatic reload; safe explicit Reload app remains available. Unmount cleans up timers, ports and listeners.
- platform-pwa-update-safety starts from the root service-worker bootstrap, tracks input/change/composition/drop and form/dialog interaction, checks focused editors/open dialogs/unknown iframes, and answers worker safety queries. Known Tracker and Admin analysis-editor dirty flags also block updates. React/focus transition notifications are deferred to a microtask so cleanup cannot create a transient safe decision.
- Waiting service worker requires affirmative replies from every open window, with a two-second per-window timeout and twenty-window cap, and refuses activation if another window appeared during the check. Missing/old clients fail closed. Concurrent readiness checks are shared. Existing explicit activation compatibility and all push/storage/navigation handlers remain unchanged.
- App Help text describes the new behavior. No notification preferences, subscription changes, DB/config mutations, page-data edits or runtime restarts.

## Conservative safety boundary

The app has no universal saved-state contract. Any untracked edit latches automatic updating off for the document lifetime, including SPA navigation; a click on Save is not treated as proof of successful persistence. This can delay updates after harmless filter changes or already-saved edits until a clean close/reopen. Open dialogs, iframes and older/unresponsive tabs also block automatic activation. It is intentionally safer than trying to infer that unknown drafts are saved. This limitation must be reviewed as part of product acceptance; do not claim every clean form can automatically update without reopening.

A clean page may start activation and then receive edits before the worker changes. The page rechecks and withholds reload in that race. Real multi-window/Android lifecycle and lazy-resource compatibility remain release-acceptance gates. Previously loaded old app JavaScript cannot gain these guards until that page loads this release; do not promise retroactive protection of old clients. Legacy explicit activation messages remain supported for compatibility.

## Verification

Seven changed source files pass targeted ESLint and TypeScript syntax transpilation. Mocked source replay covers clean opening/no routine banner; dirty form and safe navigation; editing during activation; timeout plus late activation; unsafe and safe explicit retry; another-window denial and resume retry; paused behavior; unmount cleanup; first installation; fail-closed uninitialized guard; focused control, dialog/iframe and known dirty flags; document-lifetime edit latch; worker all-safe/dirty/silent/new-client/absent-requester behavior; retained NetworkOnly policy. Evidence script: qa-evidence/pwa-safe-auto-update-proof-20260928.cjs, accepts exact candidate commit SHA.

No Vitest, full semantic TypeScript check, build, server, real browser mutation, installation, phone update or production activation performed. Runtime/phone acceptance remains pending. Exact commit/parent/allowlist/patch digest will be recorded in qa-evidence/pwa-safe-auto-update-20260928.json.

## Complete allowlist

- app/pwa/pwa-update-notice.tsx
- app/pwa/pwa-service-worker-bootstrap.tsx
- app/sw.ts
- app/(dashboard)/trade-tracker/trade-tracker-unsaved-changes.tsx
- app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx
- src/modules/platform/client/pwa/platform-pwa-update-safety.ts
- src/modules/help/traderslink-app-guides.ts
- docs/migration/pwa-safe-auto-update-progress-2026-09-28.md
- docs/migration/traderlink-platform-pwa-plan.md (progress link only)
