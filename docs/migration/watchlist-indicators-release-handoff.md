# Watchlist Indicators — pre-release handoff

Status: **Prepared for the hosted acceptance gate, not production acceptance.** Native Moomoo acquisition passes the nine-symbol matrix. The current-main integration tree has zero conflicts and passes focused member/admin DOM checks. Actual hosted runtime/UI acceptance requires separate publication/deployment authority. This document is not authorization to publish, and has not been sent to another chat.

Controlling [plan](watchlist-deterministic-indicators-plan.md) and [progress](watchlist-deterministic-indicators-progress.md).

## Exact source boundary, checked 2026-09-12

- Platform feature base: `907971dc6ce49bc41054ef8cee0354ea7c3f8ea6`.
- Application implementation tip: `6397ce01aab7c0ddc4065612c7b403b65c2c57ba`; later integration-verifier/documentation commits must accompany it.
- Remote `main`: `2a40e87b964574f1b525f3f3f1cb8fce7f24468a`, verified by `git ls-remote`; the normal Windows TLS backend failed, then the OpenSSL backend succeeded without disabling TLS verification.
- Railway production metadata reports branch `main`, the same commit, deployment `e05a861c-803d-404d-91d5-b32c459f738b`, running instance. This is existing-deployment metadata, not a new deployment result. Recheck health and deployment status at release time.
- Supporting canonical runtime local commit: `54be739`, based on `fb85207`, in `levels-system-post-mtf-handoff-stability`. Runtime files: `src/lib/market-data/platform-watchlist-indicator-loader.ts`, `src/lib/monitoring/manual-watchlist-runtime-manager.ts`, `src/runtime/manual-watchlist-server.ts`, `docs/watchlist-indicator-shared-refresh-progress-2026-09-12.md`. Do not deploy the deprecated sibling runtime.

## Integration rehearsal and exact conflict resolution intent

A disposable Git index based on the confirmed remote parent checked the committed feature diff with `git apply --cached --check --3way`. Two files reported conflicts. Exit code zero was **not** treated as a conflict-free result. No working-tree, branch, published ref or hosted service was changed.

The later `verify-watchlist-indicator-integration.mjs --temporary-index` rehearsal resolves the following two conflicts and verifies preservation, producing tree `8e9c35dcd0db4f3e5118b9e6a74d757cf0f186c8` (47 changed files, zero unmerged entries). With `TRADERLINK_INDICATOR_VERIFY_TREE` set to this tree, member/admin DOM verifiers pass 16/21 assertions. This is an integration tree, not a release commit or hosted proof. A changed parent must be reconciled again, not assumed equivalent.

1. `app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx`: preserve the current parent's Daily Recaps prop, panel, editor, preview and iframe lifecycle. Add the six runtime section buttons, Usage, Daily Recaps and lazy Indicator Audit in one navigation; retain origin/source-checked child handshake. The implementation-tip file differs from the confirmed parent only in this intended navigation/audit scope, including optional-prop compatibility for the older local page.
2. `app/watchlist/live-watchlist-client.tsx`: apply only the Indicators import, remove only `liveVolumeContext={symbol.liveVolumeContext}` from the detail-page Analysis card invocation, and insert the Indicators card after Analysis/status and before recent news. Preserve all current-parent notices, company-card layout, owner-edited Analysis rendering and other changes. Do not replace this entire file from the feature worktree.

Do **not** include the older local admin `page.tsx`, any Daily Recaps backend/page replacement, global CSS, untracked owner exports or unrelated dirty documentation. The current parent already supplies the actual Daily Recaps panel. No new Recaps implementation is needed.

## Platform implementation allowlist

The exact committed allowlist can be reproduced with `git diff --name-only 907971dc6ce49bc41054ef8cee0354ea7c3f8ea6 aca2213a8f11058e20ae549e9102eb6639c60a7a`:

```text
app/(dashboard)/admin/watchlist/watchlist-indicator-audit-panel.tsx
app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx
app/api/admin/watchlist/indicator-audit/route.ts
app/api/live-watchlist/indicators/refresh/route.ts
app/api/live-watchlist/symbols/[symbol]/indicators/route.ts
app/watchlist/live-watchlist-client.tsx
app/watchlist/watchlist-indicators-card.module.css
app/watchlist/watchlist-indicators-card.tsx
docs/migration/watchlist-deterministic-indicators-plan.md
docs/migration/watchlist-deterministic-indicators-progress.md
src/lib/live-watchlist/indicators/indicator-aggregation.ts
src/lib/live-watchlist/indicators/indicator-engine.test.ts
src/lib/live-watchlist/indicators/indicator-engine.ts
src/lib/live-watchlist/indicators/indicator-history-provider.ts
src/lib/live-watchlist/indicators/indicator-history-rebuild.ts
src/lib/live-watchlist/indicators/indicator-member-snapshot.ts
src/lib/live-watchlist/indicators/indicator-presentation.ts
src/lib/live-watchlist/indicators/indicator-refresh-service.ts
src/lib/live-watchlist/indicators/indicator-request-coordinator.ts
src/lib/live-watchlist/indicators/indicator-series.ts
src/lib/live-watchlist/indicators/indicator-sessions.ts
src/modules/help/watchlist-guides.ts
src/modules/watchlist/server/indicators/indicator-audit-runtime.ts
src/modules/watchlist/server/indicators/indicator-audit-store.ts
src/modules/watchlist/server/indicators/indicator-refresh-runtime.ts
src/modules/watchlist/server/moomoo-watchlist-candle-bridge.ts
src/modules/watchlist/server/runtime/watchlist-runtime-admin-document.ts
src/scripts/verify-watchlist-indicator-admin-types.mjs
src/scripts/verify-watchlist-indicator-admin.mjs
src/scripts/verify-watchlist-indicator-audit-route.mjs
src/scripts/verify-watchlist-indicator-audit.mjs
src/scripts/verify-watchlist-indicator-captured-candles.mjs
src/scripts/verify-watchlist-indicator-card-types.mjs
src/scripts/verify-watchlist-indicator-card.mjs
src/scripts/verify-watchlist-indicator-connection.mjs
src/scripts/verify-watchlist-indicator-foundation.mjs
src/scripts/verify-watchlist-indicator-history.mjs
src/scripts/verify-watchlist-indicator-hosted-history.mjs
src/scripts/verify-watchlist-indicator-member-route.mjs
src/scripts/verify-watchlist-indicator-refresh-route.mjs
src/scripts/verify-watchlist-indicator-refresh.mjs
src/scripts/verify-watchlist-indicator-requests.mjs
src/scripts/verify-watchlist-indicator-runtime-bridge.mjs
src/scripts/verify-watchlist-indicator-series.mjs
src/scripts/verify-watchlist-indicator-sessions.mjs
```

This handoff document itself is an additional documentation-only allowlist entry.

Subsequent allowlist additions: `src/scripts/verify-watchlist-indicator-native-hosted.cjs`, `src/scripts/verify-watchlist-indicator-integration.mjs`, `src/scripts/watchlist-indicator-verification-source.mjs`. Reproduce the full final list from the base to the final handoff commit; never include dirty working-tree files.

## Evidence and remaining gates

- Exact per-check results and limitations are in progress. Nine actual Friday histories verify one-minute conversion, derived 5m/15m calculations and full-session HLC3-volume VWAP arithmetic. They do not prove native 5m/15m/Daily transport, real throttling, chart-reference VWAP parity or hosted rendering.
- Native Moomoo end labels, exclusive intraday end-date boundary and multi-day 1m truncation were established and corrected. The new pure adapter/coordinator/refresh modules ran against all nine symbols successfully: four requests each, all four frames ready, independent session VWAP arithmetic passed. This does not prove hosted UI/scheduler behavior or full chart-reference numerical parity for every indicator.
- The existing public authenticated bridge only exposes 1m. A separate isolated Node diagnostic can reuse its compiled owner selection with forced read-only SQLite and a history-only network guard; this does not modify the app process or deploy an endpoint. Railway is linked from the canonical runtime folder, not this worktree. No project link or variable was changed.
- No database migration is introduced. Audit files use the existing persistent storage boundary, with separate retention/byte limits. Verify directory permissions and one-writer deployment behavior during authorized hosted acceptance.
- Preserve manual Analysis refresh, review/approval/editing, Discord publication, EODHD updates and Potential Path ATR. The shared bridge changes candle polling, not AI-generation settings or publishing authority.
- Before release: settle native-provider evidence, resolve the two files against then-current main, run focused integrated checks, verify member/admin rendering on the authorized hosted environment (no local preview server), and obtain separate owner deployment approval through the serialized release process.
- No push, merge, deployment, restart, variable change or migration is authorized by this handoff.
