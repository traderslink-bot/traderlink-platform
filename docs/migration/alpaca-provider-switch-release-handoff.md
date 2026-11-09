# Owner-authorized Alpaca switch — release handoff

The owner explicitly instructed this feature chat “switch it” on November 7, 2026 (Eastern). This authorizes completing the scanner workspace and Watchlist Alpaca provider switch discussed in this chat, including the separately hosted Watchlist/Stock Levels runtime. Do not ask the owner to repeat this authorization. Complete the required technical qualification and single-writer release gates before changing hosted state.

## Ownership and evidence

Owner-visible feature chat: `01a1aefd-b92a-76b2-b6a7-d3798d5d0903` (“Continue scanner workspace development”). Assigned source: `/home/traderlink/projects/admin-watchlist`; actual branch `migration/admin-watchlist-20261019` remains at its preservation HEAD with mixed unfinished work. Selected migration checkpoint: `ab638bf11eda88e3fccef2f3a0f162d89dbe02df`, on preservation ref `codex/scanner-stable-dashboard-layout`. Do not merge that entire historical branch: reconcile only the selected migration delta and its required existing chart/gateway dependencies against current production.

[Implementation, test evidence and runtime patch fingerprints](alpaca-market-data-migration-progress.md). [Eight-file external runtime patch](alpaca-watchlist-runtime-provider.patch). The patch is a candidate, not an accepted full runtime build. Existing 63 focused tests and real Alpaca candle-adapter proofs passed. Full runtime type/build/provider acceptance is still required.

## Required release sequence

1. Coordinator refreshes current release ownership, exact source/deployment/volume and applied migration identity for both Platform and the separate runtime. Preserve all unrelated work and runtime data; no feature worker self-assigns the release lane.
2. Reconcile the eight-file runtime patch in canonical runtime source. Its Railway deployment is CLI/archive backed, not assumed Git-triggered. Check all provider validators, persisted selection settings, historical/live/same-day consumers and Stock Levels reference/history; run full applicable build and contract tests.
3. Establish authenticated encrypted Railway-to-VPS gateway connectivity without public listener shortcuts or the temporary preview bridge. Current gateway is localhost:3041 under `traderlink-alpaca-gateway.service`. Alpaca keys stay exclusively on VPS. Railway receives only the separate gateway bearer. Never print credentials.
4. Integrate the explicit Platform migration delta with required dependencies against the exact latest production parent, preserving scanner rules, universe/float/country/news and owner UI. Configure `TRADERLINK_MARKET_DATA_PROVIDER=alpaca`, `TRADERLINK_ALPACA_GATEWAY_URL`, and `TRADERLINK_ALPACA_GATEWAY_TOKEN` through the coordinated release path.
5. Select runtime historical/live/same-day Alpaca through its established settings path, including persisted overrides. Stage and verify actual candle/provider provenance, reference price, Stock Levels generation, Watchlist indicator/AI reads and scanner session counters. Keep unqualified counters unavailable until history/subscriptions are complete. Do not relabel legacy data or silently fall back.
6. Complete the authorized switch through existing release gates. Report exact published source, immutable runtime artifact identity, deployment results, health and end-to-end provider evidence. Preserve a schema-compatible rollback and original single-writer volume ownership. Do not deploy the mixed workspace directly.

Known runtime target from previous read-only discovery: project `49fc9197-07c9-45c7-b528-57d0393c2cca`, service `traderlink-watchlist-runtime-staging` (`d69d66fa-b785-414c-90f5-ca61fbfb7cc2`), staging environment `9e079dd4-f3f3-4872-9b00-adbd3000c485`. Both live Platform Watchlist and Stock Levels URLs point there; the word staging does not make its effects disposable. Refresh before mutation. Previous deployment `e95dc262-bdd5-404a-97fd-56d93fe4b4c4` used EODHD.

The app currently exposes no send-message/start-turn/handoff tool to this feature session. The Coordinator has NOT been messaged or started. No Railway mutation has occurred in this authorization turn. This document is the concrete handoff to existing visible chat “VPS New coordinator” (`01a19f74-8e08-7742-8646-ba1c46ce9e58`).

## Selected Platform migration allowlist

- `docs/migration/alpaca-market-data-migration-progress.md`
- `docs/migration/alpaca-watchlist-runtime-provider.patch`
- `docs/migration/scanner-alpaca-vps-owner-test-plan.md`
- `src/lib/live-watchlist/indicators/indicator-history-provider.ts`
- `src/lib/live-watchlist/indicators/indicator-refresh-service.ts`
- `src/lib/live-watchlist/indicators/indicator-request-coordinator.ts`
- `src/lib/live-watchlist/setups/setup-input.ts`
- `src/lib/live-watchlist/setups/setup-results.ts`
- `src/modules/scanner/alpaca/client.ts`
- `src/modules/scanner/alpaca/gateway.ts`
- `src/modules/scanner/alpaca/rest-data.test.ts`
- `src/modules/scanner/alpaca/rest-data.ts`
- `src/modules/scanner/alpaca/runtime-providers.test.ts`
- `src/modules/scanner/alpaca/runtime-providers.ts`
- `src/modules/scanner/alpaca/scanner-snapshots.test.ts`
- `src/modules/scanner/alpaca/scanner-snapshots.ts`
- `src/modules/scanner/alpaca/session-book.test.ts`
- `src/modules/scanner/alpaca/session-book.ts`
- `src/modules/scanner/alpaca/watchlist-adapter.test.ts`
- `src/modules/scanner/alpaca/watchlist-adapter.ts`
- `src/modules/scanner/live/contracts.ts`
- `src/modules/scanner/live/server/live-feed.ts`
- `src/modules/scanner/live/server/runtime.test.ts`
- `src/modules/scanner/live/server/runtime.ts`
- `src/modules/watchlist/server/indicators/indicator-audit-store.ts`
- `src/modules/watchlist/server/indicators/indicator-refresh-runtime.ts`
- `src/modules/watchlist/server/moomoo-watchlist-candle-bridge.ts`
- `src/modules/watchlist/server/moomoo-watchlist-overnight-quote.ts`
