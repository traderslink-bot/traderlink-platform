# Market Data Policy Status - 2026-05-06

## Current Provider Path

- Use IBKR plus the shared `data/candles` warehouse.
- Do not silently fall back to stub candles for real trade-analysis requests.
- If IBKR/warehouse data is unavailable, return diagnostics that the product can
  show directly.

## Warehouse Rules

- Treat provider `raw` metadata as provenance, not proof that stored candles are
  aligned with broker executions.
- Use trade-window candles for movement review only when nearby candle OHLC is
  compatible with broker execution prices.
- Preserve basis/provenance notes in calibration artifacts and product UI.
- Do not multiply, divide, or rewrite stored candles using inferred split ratios.

## Reverse Splits And Price Basis

- Known basis-mismatch rows currently remain execution/P&L-only:
  - `VEEE`
  - `ISPC`
  - `DGNX`
- These rows look like reverse-split or split-adjustment basis mismatches.
- Keep them out of movement review unless raw IBKR candle basis can be proven
  aligned to broker execution prices.
- In product copy, say movement review is unavailable because candles appear to
  be on a different price basis, while execution/P&L review can still proceed.

## Delisted Or Renamed Symbols

- Keep alias handling narrow and validated through the normal provider workflow.
- Current validated alias policy: `MAXN -> MAXNQ`.
- Do not add broad alias discovery or ticker research right now.
- If a renamed/delisted symbol cannot be resolved quickly through IBKR, fail
  cleanly and let the app say market data is unavailable for that symbol.

## Insufficient Higher-Timeframe History

- `AVEX` and `ELMT` currently return `market_context_unavailable`.
- They are insufficient daily/4h history cases under the no-future-leakage
  cutoff.
- Do not treat them as reverse-split or alias-discovery tasks unless new
  evidence proves that.

## Current Calibration State

- Requested trades: `208`
- Analyzable completed trades: `206`
- Completed decision reviews: `204`
- Open skipped trades: `2`
- Market context: `levels_system_daily_4h=204`
- Trade-window evidence:
  - `levels_system_trade_window=199`
  - `execution_only_fallback=5`
- Remaining execution-only fallback symbols:
  - `VEEE=1`
  - `ISPC=2`
  - `DGNX=2`
- Remaining market-context diagnostics:
  - `AVEX`
  - `ELMT`
- Verified extreme excursion row:
  - `SKLZ` reached a warehouse-confirmed `20.00` high after a `6.12` entry on
    `2026-04-23`; keep this as a real extreme move, not a candle bug.

## Next Safe Work

- Product wording for warning severity:
  - unsafe price basis;
  - lower-resolution 5m fallback;
  - incomplete pre/post trade window;
  - unavailable daily/4h context.
- Synthetic fixtures for the final policy cases before threshold changes.
- Weak-level copy/threshold calibration only after inspecting concrete examples.

## Product Interpretation Status

- `/import-dry-run` decision-review cards now display confidence/status badges:
  - `Verified candle basis`
  - `Lower-resolution candle window`
  - `Execution/P&L only`
  - `Verified extreme move`
  - `Context present, not supportive`
- SKLZ-style triple-digit excursion rows should be shown as verified extreme
  moves when candle basis is aligned, not hidden as suspicious data.
- Weak daily/4h rows should say context is present but not supportive, not imply
  that market data is missing.
