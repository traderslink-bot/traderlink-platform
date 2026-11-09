# Alpaca real-time correction review handoff — November 9

**OWNER HOLD: no publish, deployment, service/configuration change, gateway restart or preview update until the owner says ready.** This is a concrete local source/recovery review packet, not release admission.

Source preservation: `775374d886bb8286ffb585bb9ba0dae7abfb7409`, parent `e23e01d3655b3f06dce4e2a2c0f28154f4c5bde6`. Exact current Platform release parent refreshed read-only: `08214bf084e53c9d59e2e975892c7f64a9a90b87`. Never merge the whole preservation branch. Actual assigned checkout HEAD/index were unchanged by source preservation.

## Result

Split-safe dated prior-close references remove false corporate-action gains without capping genuine gains. Chart and preferences access uses the existing two-private-account Scanner guard. Other accounts retain their embedded chart. The shared chart receives eligible trade-driven price/intraday/daily OHLCV; official closed candles reconcile intraday provisional candles. Daily reconstruction has its own daily eligibility, complete bounded history and Eastern/DST reset. Browser scanner results push on completed evaluation. Shared `/prices` lets Watchlist consume trade prices independently through the same SIP socket. BOATS remains its existing separate REST capability.

## Verified evidence

- Combined scanner/Alpaca59files/400tests PASS; edited-source lint PASS.
- Candidate TypeScript zero diagnostics with exact live High Drops engine/calculator/card preserved. Engine change is exactly two comparison-availability guards; do not copy the working tree's older High Drops files.
- Actual React/Lightweight Charts renderer passes isolated Chromium tests for all six timeframes, price/volume candles, daily stream routing, indicator persistence and cleanup. No preview/provider/server was started by that browser check.
- Actual4000-symbol engine + full durable audit:20cycles/80000observations, median150ms/p95=168ms/max175ms, audit-write p95=104ms. No sampling. See ledger for storage measurements and throughput limits.
- Watchlist consumer code `7e34c65d333713836fb71726a0c602c8fc369012` (docs follow-up `b3f63e0b8ff16129af4f2189c9e2a5ab1b14f453`):95focused Runtime tests/full TypeScript pass; matching actual hub→isolated HTTP→actual Runtime consumer228ms. Watchlist task owns its9-path Runtime handoff.
- Required dashboard-template verifier still has its previously recorded3pass/4fail legacy shell/navigation baseline. No all-green full app build/installed browser claim.

## Platform allowlist

Select these 42 changed paths from the immutable source above, against exact parent `08214bf084e53c9d59e2e975892c7f64a9a90b87`. Keep live High Drops card/calculator and every other live module. No Watchlist UI files, shared shell, unrelated guides or local launcher changes belong to this slice.

```
app/(dashboard)/charts/alpaca-lightweight-chart.tsx
app/(dashboard)/charts/chart-preferences-panel.tsx
app/(dashboard)/charts/market-chart-workspace.tsx
app/(dashboard)/charts/page.tsx
app/(dashboard)/charts/use-chart-preferences.ts
app/(dashboard)/screeners/live-screeners-client.tsx
app/api/charts/preferences/route.ts
app/api/screeners/live/route.ts
src/modules/scanner/alpaca/candles.ts
src/modules/scanner/alpaca/candles.test.ts
src/modules/scanner/alpaca/chart-axis.ts
src/modules/scanner/alpaca/chart-axis.test.ts
src/modules/scanner/alpaca/chart-history.ts
src/modules/scanner/alpaca/chart-history.test.ts
src/modules/scanner/alpaca/chart-indicators.ts
src/modules/scanner/alpaca/chart-preference-store.ts
src/modules/scanner/alpaca/chart-preferences.ts
src/modules/scanner/alpaca/chart-preferences.test.ts
src/modules/scanner/alpaca/chart-preferences-route.test.ts
src/modules/scanner/alpaca/chart-live-book.ts
src/modules/scanner/alpaca/chart-live-book.test.ts
src/modules/scanner/alpaca/live-price-hub.ts
src/modules/scanner/alpaca/live-price-hub.test.ts
src/modules/scanner/alpaca/gateway.ts
src/modules/scanner/alpaca/gateway.test.ts
src/modules/scanner/alpaca/previous-close.ts
src/modules/scanner/alpaca/previous-close.test.ts
src/modules/scanner/alpaca/proxy.ts
src/modules/scanner/alpaca/proxy.test.ts
src/modules/scanner/alpaca/scanner-snapshots.ts
src/modules/scanner/alpaca/scanner-snapshots.test.ts
src/modules/scanner/alpaca/split-gain-ranking.test.ts
src/modules/scanner/alpaca/event-scanner-flow.test.ts
src/modules/scanner/live/engine.ts
src/modules/scanner/live/gainer-view-client.test.ts
src/modules/scanner/live/premarket-pullbacks-admin-qa.test.ts
src/modules/scanner/live/server/backend-http.ts
src/modules/scanner/live/server/backend-http.test.ts
src/modules/scanner/live/server/live-feed.ts
src/modules/scanner/live/server/runtime.ts
src/scripts/verify-alpaca-chart-live-rendering.cjs
src/scripts/verify-alpaca-scanner-realtime-capacity.cjs
```

Include reviewed documentation separately: consolidated correction ledger, stream contract, chart progress, prepared private Help copy and this artifact/recovery receipt. Human documentation must not silently broaden the code allowlist.

## Shared gateway immutable build

The [artifact manifest](alpaca-realtime-gateway-artifact-20261109.json) lists all11 source input hashes from the immutable source, build options and recovery-source hashes. esbuild0.28.2/node22/cjs candidate is55,430bytes, SHA256 `9883d11d5c63f7990072fe4db5c69b1ca926953725938bef7d8473f2717a8db8`. No bundle was installed or executed. Recovery-source rebuild from pinned `ab638bf11eda88e3fccef2f3a0f162d89dbe02df` is26,338bytes/SHA256 `648b07528f71c8bdaee9d9c36c0c05cc41684a71ff1760d5c6e66c7161a61659`; that is not a claim that the installed binary has been compared yet.

Complete gateway source inputs:

```
scripts/run-alpaca-market-data-gateway.ts
src/modules/scanner/alpaca/candles.ts
src/modules/scanner/alpaca/chart-live-book.ts
src/modules/scanner/alpaca/gateway.ts
src/modules/scanner/alpaca/live-price-hub.ts
src/modules/scanner/alpaca/previous-close.ts
src/modules/scanner/alpaca/rest-data.ts
src/modules/scanner/alpaca/scanner-stream-hub.ts
src/modules/scanner/alpaca/session-book.ts
src/modules/scanner/live/event-timing.ts
src/modules/scanner/live/sessions.ts
```

## Review and eventual installation sequence

Coordinator independently refreshes main/source branch/deployment metadata, confirms the release lane and installed gateway artifact/recovery identity. Prepare a clean exact-parent candidate and run its production build and private-account acceptance using existing two-account authorization; do not replace approved High Drops with the mixed working calculator/card. Install new gateway before consumers that require adjustedPreviousClose or `/prices`. Enable reviewed Alpaca event evaluation (`TRADERLINK_ALPACA_SCANNER_EVENT_DRIVEN=true`) only with the reviewed artifact after the owner releases the hold; leaving it false retains the old5s evaluator even though browser transport pushes immediately. No universe/filter/ranking threshold changes are included.

Verify actual installed source→gateway receipt/emission→Runtime/Platform→browser timestamps, two-account bars/stream/settings access, denied-account behavior, session changes, reconnect/correction, one shared upstream socket and source health. Capacity measurements qualify local sequential throughput, not unrestricted storage lifetime or concurrent hosted users. Existing admin market-cap/universe choice remains unchanged. Keep full audit evidence and its visible coverage; agree retention/capacity for any later4000-symbol sustained setting rather than silently sampling.

For rollback, roll new consumers/Platform back before reverting gateway; the new scanner must not remain paired with a gateway that omits split-adjusted references. Preserve the prior installed bundle/configuration and single-writer Railway state. Once owner-authorized publishing occurs, record configuredmain, remote parent, publishedSHA, full allowlist, Railway deployment/status and `/api/platform/health`; do not infer deployment from a push.
