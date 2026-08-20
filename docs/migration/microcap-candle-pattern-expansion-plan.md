# Micro-cap candle-pattern expansion plan

**Status:** Owner-approved implementation in progress (2026-08-19)
**Progress:** [Micro-cap Candle Pattern Expansion Progress](microcap-candle-pattern-expansion-progress.md)
**Parent:** [Moomoo Daily Trade Tracker Analyzer Plan](moomoo-daily-trade-tracker-analyzer-plan.md)

## Outcome

Add six familiar, retail-recognizable candle labels to the existing deterministic
micro-cap detector:

- Doji;
- Bullish Harami and Bearish Harami;
- Bullish Morning Star and Bearish Evening Star; and
- Bullish Three White Soldiers and Bearish Three Black Crows.

The shared presentation catalog, Daily Trade Tracker chart/key and written
analysis, Candle Patterns analytics, occurrence drawer and Help Center must use
the same labels.

## Boundaries

- Keep the existing execution-context contract: only the execution candle and
  two preceding complete candles are retained for each execution. Do not scan
  every candle between entry and exit.
- Keep the Candle Patterns page limited to patterns that were knowable at the
  execution. A later confirmed structure may be visibly labelled on a chart but
  must not be presented as information the trader had at the fill.
- Do not alter Journal facts, market-data retrieval, account scope, source
  candles, or historical immutable analysis versions.
- Existing saved analyses are not silently rewritten. New detector output is
  used by newly produced analysis versions; a separately approved versioned
  reclassification/backfill would be needed to populate the new labels in
  existing saved results.

## Detection rules

Every candidate requires active OHLCV facts and uses the detector's recent
range/body/volume baselines. A single candle retains only the strongest
applicable label so chart markers remain readable.

| Label | Required measured structure |
| --- | --- |
| Doji | A meaningful-range candle whose real body is no more than 10% of its range and whose activity is not materially absent. |
| Bullish / Bearish Harami | A smaller opposite-direction body fully contained in the preceding meaningful body, after a recent move in the preceding candle's direction. |
| Morning Star / Evening Star | A meaningful bearish/bullish candle, a small middle body, then a meaningful opposite-direction body that closes through the first candle's midpoint. Intraday gap rules are intentionally not required. |
| Three White Soldiers / Three Black Crows | Three consecutive meaningful bullish/bearish bodies with progressive closes, each opening inside the preceding body, after an opposing local move. |

Morning/Evening Star and Three Soldiers/Black Crows are complete only when their
final candle closes. Harami and Doji are complete when their labelled candle
closes. The existing Bullish Hammer, Bearish Shooting Star and High-Volume
Exhaustion continue to require a following completed candle.

## Delivery

1. Extend the typed detector, definitions and marker-priority ordering.
2. Add one shared full/short display name for each new label.
3. Extend the Daily Trade Tracker chart explanation, color and marker placement,
   then rely on the shared name in its analysis cards.
4. Keep the existing Candle Patterns page/occurrence reader generic so it
   automatically groups the newly stored label kinds.
5. Update Candle Patterns and Daily Trade Tracker Help content.
6. Perform focused source and type-path review only; no broad test suite,
   database migration, provider request, server restart or deployment is part
   of this owner-review checkpoint.
