# On-Demand Candle Hydration Implementation - 2026-05-06

## Purpose

Let Trader Intelligence ask `levels-system` for the historical candles needed by
an imported trade instead of requiring the durable candle warehouse to already be
fully backfilled.

The durable warehouse remains the cache/source of truth after hydration. This
app still does not own candle fetching, support/resistance generation, VWAP,
EMA, or market-structure logic.

## Implemented Design

`levels-system` now exposes an on-demand IBKR runtime helper through the shared
support-resistance package:

- creates an IBKR historical candle provider from host/port/client id settings
- lazily connects to IBKR before the first historical fetch
- reuses one IBKR client per host/port/client id inside the process
- reuses the existing durable warehouse `read_write` path
- writes fetched candles into the warehouse
- keeps existing replay behavior strict when no real provider is configured

Trader Intelligence now supports:

- `LEVELS_SYSTEM_ON_DEMAND_HYDRATION=true`
- `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY=../levels-system/data/candles`
- `LEVELS_SYSTEM_WAREHOUSE_MODE=read_write` or omitted
- `LEVELS_SYSTEM_IBKR_HOST`
- `LEVELS_SYSTEM_IBKR_PORT`
- `LEVELS_SYSTEM_IBKR_CLIENT_ID`
- `LEVELS_SYSTEM_IBKR_TIMEOUT_MS`
- `LEVELS_SYSTEM_IBKR_CONNECTION_TIMEOUT_MS`

When on-demand hydration is enabled, Trader Intelligence passes an IBKR-backed
fetch service to `levels-system`. Missing candles are fetched and written by
`levels-system`; the trader app only consumes the returned context/diagnostics.

## Expected Operator Flow

For private CSV calibration or user-imported trades:

1. Import/group executions in Trader Intelligence.
2. Run decision review with on-demand hydration enabled.
3. `levels-system` checks the warehouse for daily, 4h, 1m, and 5m windows.
4. Missing windows are fetched from IBKR and persisted.
5. Decision review uses returned market context only when candle evidence is
   available and basis-safe.
6. If IBKR cannot fetch or candles fail basis checks, the app stays honest and
   uses execution-only feedback/diagnostics.

## Environment Example

```powershell
$env:LEVELS_SYSTEM_ON_DEMAND_HYDRATION = 'true'
$env:LEVELS_SYSTEM_WAREHOUSE_DIRECTORY = '..\levels-system\data\candles'
$env:LEVELS_SYSTEM_IBKR_HOST = '127.0.0.1'
$env:LEVELS_SYSTEM_IBKR_PORT = '7497'
$env:LEVELS_SYSTEM_IBKR_CLIENT_ID = '101'
$env:LEVELS_SYSTEM_IBKR_TIMEOUT_MS = '30000'
```

## Boundaries

- This does not make Trader Intelligence a candle provider.
- Tests do not require live IBKR Gateway access.
- Replay-only mode still fails on warehouse misses instead of silently using
  deterministic stub candles.
- Market-context coaching remains gated by returned evidence and basis
  diagnostics.

## Verification

- `levels-system`: `npm run build` passed.
- `levels-system`: Node test run passed with `755/755`, including the new lazy
  IBKR on-demand fetch helper coverage.
- `trader-intelligence-v2`: focused trade-analysis / levels-system /
  decision-review bridge Vitest batch passed with `27/27`.
- `trader-intelligence-v2`: `npx tsc --noEmit --pretty false` passed.
- `trader-intelligence-v2`: `npm run build` passed.
- `trader-intelligence-v2`: `npm run verify:levels-system` passed with
  `80/80`.
- `trader-intelligence-v2`: full `npm test -- --reporter=dot` passed with
  `866/866`.
- Private on-demand hydration smoke passed with `max-trades=1`: one completed
  private trade received `levels_system_daily_4h` market context and
  `levels_system_trade_window` evidence instead of a durable warehouse miss.
- After the sibling warehouse backfill completed, replay-only private
  calibration with `--max-trades 206` completed `204` decision reviews from
  `206` analyzable completed-trade candidates. Remaining market-data
  limitations were evidence-gated: `2` market-context-unavailable rows and `5`
  execution-only fallback reviews for unavailable or unsafe trade-window candle
  evidence.
- `levels-system` now also has a durable-warehouse regression for short but
  usable provider history so limited-history symbols can reuse stored provider
  responses instead of repeatedly refetching the same partial history.
