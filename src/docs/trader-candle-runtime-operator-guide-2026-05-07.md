# Trader Candle Runtime Operator Guide - 2026-05-07

## Purpose

Trader Intelligence should not own candle fetching, candle normalization, support/resistance detection, VWAP, or EMA logic. It asks `levels-system` for market context. `levels-system` checks the durable candle warehouse first, fetches missing IBKR candles when on-demand hydration is enabled, writes valid candles back to the warehouse, and returns either verified context or clear provider/data diagnostics.

## Runtime Modes

Use these modes intentionally:

- `replay`: warehouse-only. Use for deterministic audits, CI-style verification, and before/after comparisons where missing candles should remain visible.
- `read_write`: warehouse first, provider fallback second. Use for local operator runs when IBKR Gateway/TWS is running and this app should let `levels-system` fill missing candles.
- `refresh`: provider-preferred refresh. Use sparingly when intentionally rebuilding stale market data.

Recommended local hydration environment:

```powershell
$env:LEVELS_SYSTEM_PROVIDER = "ibkr"
$env:LEVELS_SYSTEM_WAREHOUSE_DIRECTORY = "../levels-system/data/candles"
$env:LEVELS_SYSTEM_WAREHOUSE_MODE = "read_write"
$env:LEVELS_SYSTEM_ON_DEMAND_HYDRATION = "true"
$env:LEVELS_SYSTEM_IBKR_HOST = "127.0.0.1"
$env:LEVELS_SYSTEM_IBKR_PORT = "7497"
$env:LEVELS_SYSTEM_IBKR_CLIENT_ID = "71"
```

Use `7496` only when intentionally connecting to live TWS/Gateway. Keep paper/local validation on the configured paper port.

## Calibration Flow

1. Run a small private CSV smoke with `--max-trades=5` before a full replay.
2. If missing-candle diagnostics appear and IBKR Gateway is available, switch to `read_write` with on-demand hydration.
3. Re-run the same bounded sample and confirm diagnostics move from missing data to completed reviews or honest execution-only fallback.
4. Run the full private CSV calibration after the bounded sample is stable.
5. Publish only aggregate/public readiness docs. Do not copy account IDs, private file paths, or private symbol lists into repo docs.

## Concurrency Notes

Avoid running a heavy sibling `levels-system` backfill at the same time as a full Trader Intelligence calibration. Concurrent reads are fine, but two provider-heavy writers can duplicate requests, hit IBKR pacing, or make diagnostics noisy. If a backfill is already running, either wait for it to finish or keep Trader Intelligence in `replay` mode until the warehouse settles.

## UI Evidence Rules

The import dry-run decision review should label the evidence state before coaching:

- `Full market context`: daily/4h levels-system context was available.
- `Trade-window evidence`: during-trade candles were used for movement review.
- `Execution/P&L only`: movement review stayed on executions/P&L because candles were unavailable or unsafe.
- `Lower-resolution candle window`: 5m fallback candles were used because complete 1m candles were unavailable.
- `Market context unavailable`: support/resistance conclusions are hidden; execution/P&L review can still continue.
- `Open trade skipped`: open positions stay out of completed-trade coaching until flat.

The coaching surface can be useful with limited evidence, but it must keep limitations visible and avoid market-structure claims when `levels-system` did not return verified context.

## Verification Commands

Focused checks after changing this path:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts --reporter=dot
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium
npx tsc --noEmit --pretty false
npm run build
```

Run `npm run verify:levels-system` when shared support/resistance or candle-runtime integration changed.
