# Admin market-data switching — source qualification

November 18, 2026. Source parent: `174ef044a1e7fdb0ba60bef2aa398e622c44429f`.
Local checkpoint branch: `codex/admin-market-data-provider-switching`.

## Delivered behavior

The existing admin Scanner section now has separate switches for Scanners,
Screeners, Charts, Trade Analyzer and Watchlist. Alpaca remains the default.
Controls acknowledge the saved server state rather than changing optimistically.
Failed acknowledgments reread the actual state; unavailable Watchlist Runtime,
custom source combinations and an incomplete Platform/Runtime pair remain visible.
Normal users cannot operate the admin endpoint. Existing same-origin mutation
security, body-size limits, private responses and revision conflicts are retained.

Scanners retain their existing stop/drain/restart transition. Moomoo Scanners and
Screeners use the saved app daily universe, existing shared request budget,
400-symbol batching and configured batch-start spacing (default 1,500 ms), with
5,000 ms after each completed pass. This is not a fixed five-second total refresh.
The existing 3 a.m. Eastern universe preparation is retained. Screeners does not
create its own Moomoo universe collector or a second snapshot loop. Healthy later
batches survive a failed batch. Real retained source dates are preserved.
Screeners requests stay behind Scanner priority in the shared transport.

Shared charts dispatch history, calendar, VWAP and streams to the selected source.
Provider and revision isolate browser data and server responses. Changing source
closes the previous stream, loads the new history, and retains drawings and chart
preferences. One demand-driven Moomoo socket serves active charts. Native minute
end labels become chart start labels; raw history is adjusted for splits and
reverse splits on one declared basis. Duplicate split rows are not applied twice.
Daily data supports the existing weekly/monthly/yearly chart aggregation. VWAP
uses the existing calculation with truthful source identity. Subscription success
is acknowledged before reporting connected; failed subscriptions back off, and
closing/reopening while credential lookup is pending recovers correctly.
Overnight data remains off.

Analyzer queues pin the source that created the job. Switching cannot reinterpret
queued/leased jobs, fills or immutable receipts. Both provider workers remain.
Moomoo corporate-action dates support prior-session warmup without mixing raw
prices from before a split. Candle labels and fill/share/P&L contracts remain.

Watchlist's previous setup is exactly **EODHD history + EODHD live prices + Moomoo
same-day candles**, verified by the feature owner's prior cutover receipt. One
Runtime profile mutation restores all three roles atomically, then confirms the
Platform pointer. GET does not repair by mutation. Lost acknowledgments, failed
pointer writes and failed Runtime persistence permit explicit recovery.

## Feature-owner source checkpoints

- Platform Watchlist: `17f7a3527f42020379aadede5ef523b4107bf455`,
  `aa5eab33978f604dc53b7334b6f008f188f72b84`,
  `9a6156c244b25e81d0bf7b8e534a087c7dc5f0e4`.
- Paired Watchlist Runtime: `68e2e0f0f7dc624aa7c272b59b37299fcd7730ca`
  over `e832928cfeb552d44cf5d4006341952b8f9fb298` in the Runtime repository.
- Screeners: `e715d74a0ea2decdac4b7dcc159b7b262962d24b`,
  `5ecc6dd7783eb4a4d30f655b555dee475e5155d6`,
  `dee97850f9bd7b534f8553ac53798c61d6ac60e7`.
- Independent current-main RVOL fixture correction:
  `969d68fc7af1b5a869372319e72bc74e27ab9a5d`. It fixes an overbroad mock
  response on a retry; real response validation is unchanged.
- Analyzer: `8150c2af025b8edf6a865216344b49db7dffad83`, `e37bc87a5`,
  `8aaffa891c072fdb949df934d9dca52676601292`.

## Verification

- Combined feature regression: **33 suites / 170 tests passed** using isolated
  temporary files, accounts, sockets and market fixtures. Includes all published
  Screeners suites plus provider, scanner and Analyzer tests.
- Strict targeted TypeScript: **67 changed TypeScript/TSX files passed** against
  the exact published parent and explicit integration source. Unchanged imports
  resolve from that parent, not older mixed workspace files.
- Targeted ESLint passed for the integration's TS/TSX source.
- Production React + actual Lightweight Charts browser batch passed: admin
  controls on desktop dark, mobile portrait light and mobile landscape dark;
  all five switches in both directions; failed switch does not claim success;
  no horizontal overflow. Charts: one desktop chart and four charts in mobile
  portrait/landscape with all six indicators populated; both source directions,
  closed old streams, separated caches, no page errors. Desktop exercised all
  available aggregation families through 1Y under both selected sources.
- Browser HTTP responses are deterministic fixtures. Their timings are not live
  provider performance measurements. The private owner preview was untouched.
- The final integrated Watchlist facade and shared-connection isolated scripts
  passed, including its 26 access-boundary assertions. The feature owner also
  reports 17 Runtime cases plus Runtime types, recorded-candle/source/revision
  checks and focused Platform checks passing at the listed checkpoints.
- Full repository build and signed-in live Moomoo switching/entitlement tests
  were not performed. Live Moomoo cold history, freshness and contention remain
  qualification work before a real cutover. Per-symbol Moomoo historical reads
  can take longer than Alpaca bulk reads; quote-only initial coverage is honest
  while historical metrics fill.

## Integration and release boundary

No database schema migration is introduced. Selections/profile persistence use
protected atomic JSON files. No live setting, worker, credential, release branch,
production service or other chat's preview was changed.

The mixed assigned checkout and original index are preserved. Existing changed
files were integrated as an explicit source projection against the published
parent; new shared feature files live in the assigned workspace. The narrow
local checkpoint stores the complete integrated source without absorbing the
checkout's unrelated unfinished files. Its diff from the named parent is the
integration artifact; do not deploy the mixed directory.

A later authorized integration must include the paired Watchlist Runtime profile
endpoint before exposing its switch. The Screeners runner now combines prepared
snapshots and live publishing; retire the old independent REST collector when
activating that runner to avoid duplicate source requests. Keep existing Alpaca
selections while verifying the integrated app. Production release/configuration
and an actual Moomoo activation require the owner's release instruction and the
Coordinator's exact-current-main release gates.

The quote socket implementation follows Moomoo's documented
[authentication](https://open.moomoo.com/api/quote/push/auth),
[subscription acknowledgments](https://open.moomoo.com/api/quote/push/subscribe)
and [push data formats](https://open.moomoo.com/api/quote/push/data-format).

## Complete Platform changed-file allowlist

- `app/(dashboard)/charts/alpaca-lightweight-chart.tsx`
- `app/(dashboard)/charts/use-chart-market-data.ts`
- `app/(dashboard)/screeners/scanner-card-indicators.tsx`
- `app/(dashboard)/screeners/scanner-provider-controls.tsx`
- `app/api/admin/market-data/route.ts`
- `app/api/charts/calendar/route.ts`
- `app/api/charts/provider/route.ts`
- `app/api/charts/vwap-seed/route.ts`
- `app/api/internal/market-data/route.ts`
- `app/api/internal/stock-screeners-live/route.ts`
- `app/api/internal/stock-screeners-pack/route.ts`
- `app/api/live-watchlist/moomoo-candles/route.ts`
- `docs/migration/admin-market-data-switching-plan.md`
- `docs/migration/admin-market-data-switching-progress.md`
- `docs/migration/analyzer-alpaca-cutover-progress.md`
- `docs/migration/analyzer-provider-switching-progress.md`
- `docs/migration/stock-screeners-provider-switching.md`
- `scripts/run-live-stock-screeners.ts`
- `src/modules/journal/server/journal-integrity-runtime.ts`
- `src/modules/level-analysis/server/analyzer-provider-switching.test.ts`
- `src/modules/level-analysis/server/analyzer-provider-workers.test.ts`
- `src/modules/level-analysis/server/daily-trade-analyzer-runtime.ts`
- `src/modules/level-analysis/server/logical-trade-analyzer-repository.ts`
- `src/modules/level-analysis/server/logical-trade-analyzer-selection-service.ts`
- `src/modules/level-analysis/server/logical-trade-moomoo-analyzer-worker.ts`
- `src/modules/level-analysis/server/providers/moomoo-analyzer-candle-time.test.ts`
- `src/modules/level-analysis/server/trend-momentum-history-repository.ts`
- `src/modules/level-analysis/server/trend-momentum-history-service.test.ts`
- `src/modules/level-analysis/server/trend-momentum-history-service.ts`
- `src/modules/level-analysis/server/trend-momentum-manual-retry.test.ts`
- `src/modules/market-data/moomoo-bridge.test.ts`
- `src/modules/market-data/moomoo-calendar.ts`
- `src/modules/market-data/moomoo-history.test.ts`
- `src/modules/market-data/moomoo-stream.test.ts`
- `src/modules/market-data/moomoo-vwap.test.ts`
- `src/modules/market-data/provider-contract.ts`
- `src/modules/market-data/provider-routes.test.ts`
- `src/modules/market-data/provider-settings.test.ts`
- `src/modules/market-data/server/moomoo-bridge.ts`
- `src/modules/market-data/server/moomoo-chart-history.ts`
- `src/modules/market-data/server/moomoo-chart-response.ts`
- `src/modules/market-data/server/moomoo-chart-stream.ts`
- `src/modules/market-data/server/provider-settings.ts`
- `src/modules/scanner/alpaca/chart-vwap-history.ts`
- `src/modules/scanner/alpaca/proxy.test.ts`
- `src/modules/scanner/alpaca/proxy.ts`
- `src/modules/scanner/live/server/runtime.test.ts`
- `src/modules/scanner/live/server/runtime.ts`
- `src/modules/scanner/live/server/scanner-connection.ts`
- `src/modules/scanner/live/server/scanner-indicator-response.ts`
- `src/modules/stock-screeners/collect-market.ts`
- `src/modules/stock-screeners/contracts.ts`
- `src/modules/stock-screeners/filters.test.ts`
- `src/modules/stock-screeners/live-screener-book.ts`
- `src/modules/stock-screeners/live-screener-publisher.ts`
- `src/modules/stock-screeners/moomoo-live-worker.ts`
- `src/modules/stock-screeners/moomoo-market-data.test.ts`
- `src/modules/stock-screeners/moomoo-market-data.ts`
- `src/modules/stock-screeners/moomoo-pacing.test.ts`
- `src/modules/stock-screeners/moomoo-quote-pack.ts`
- `src/modules/stock-screeners/provider-integration.test.ts`
- `src/modules/stock-screeners/provider-pack-store.ts`
- `src/modules/stock-screeners/provider-snapshot-collector.ts`
- `src/modules/stock-screeners/provider-transport.ts`
- `src/modules/stock-screeners/provider-worker.test.ts`
- `src/modules/stock-screeners/provider-worker.ts`
- `src/modules/stock-screeners/service.ts`
- `src/modules/stock-screeners/snapshot-file.ts`
- `src/modules/watchlist/server/indicators/indicator-refresh-runtime.ts`
- `src/modules/watchlist/server/moomoo-watchlist-candle-bridge.ts`
- `src/modules/watchlist/server/runtime/watchlist-runtime-admin-client.ts`
- `src/modules/watchlist/server/watchlist-market-data-profile.ts`
- `src/scripts/verify-watchlist-indicator-connection.mjs`
- `src/scripts/verify-watchlist-provider-profiles.mjs`
- `src/scripts/verify-watchlist-setup-feed-runtime.mjs`
