# Day Trade Analyzer Version 2 Data Audit

**Date:** 2026-09-04

**Result:** The new analysis is feasible, but it is not a presentation-only
change. Saved one-minute candles and exact executions support the approved
potential-result and scaling-out questions for covered trades. The persisted
50%/75%-of-peak path cannot serve the new meaning, so Version 2 uses a separate,
deterministic read-model scenario contract calculated from the immutable
version-linked executions and candles. This avoids mutating saved evidence or
requiring a database migration. If performance later requires persistence, the
derived contract must receive a new immutable version before it is stored.

## Field-level matrix

| Fact | Required definition | Current source | Current unit/basis | Persisted? | Coverage | Recompute from saved facts? | New capture/schema? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Exact executions | Every accepted entry, add, partial and final exit in sequence | Journal allocations plus saved event snapshots | Price/share, quantity, UTC time, fee fact | Yes | Ready closed analyzed day trades | Yes | No |
| Gross chronological path | Realized gross plus open shares marked at each completed close | Exact fills + version-linked 1m closes | Whole-position money | Derived V2 read model | Candle-covered analyses | Yes | No |
| Net chronological path | Same path with complete signed saved fees | Saved event fee facts + Journal Net result | Whole-position money | Derived V2 read model | Only fee-complete trades | Yes when complete | No |
| Open-share return | Direction-adjusted close versus current average entry | Executions + completed close | Percent on open-share entry basis | Derived V2 read model | While quantity remains open | Yes | No |
| 50% / 3 closes | Three consecutive completed closes at 50%+ | Saved 1m closes | Percent + count/time | Derived V2 read model | Covered minutes only | Yes | No |
| 30% / 5 closes | Five consecutive completed closes at 30%+ | Saved 1m closes | Percent + count/time | Derived V2 read model | Covered minutes only | Yes | No |
| 20% / 10 closes | Ten consecutive completed closes at 20%+ | Saved 1m closes | Percent + count/time | Derived V2 read model | Covered minutes only | Yes | No |
| 15% / 15 closes | Fifteen consecutive completed closes at 15%+ | Saved 1m closes | Percent + count/time | Derived V2 read model | Covered minutes only | Yes | No |
| Potential result | Realized P/L already secured plus open shares marked at qualifying close | Same chronological path | Whole-position Gross or fee-complete Net | Derived V2 read model | Qualifying covered trades | Yes | No |
| Actual result | Canonical completed Journal result | Analytics fact set | Whole-trade Gross or Net | Yes | Ready closed trades | Already available | No |
| Difference | Potential result minus actual result on same basis | Derived | Whole-position money | No | Same as potential | Yes | Read model or path field |
| Raw Green-to-Red | Displayed whole-position P/L crosses above then below zero | Current path | Whole-position money | Yes | Covered analyzed trades | Yes | Preserve as separate raw fact |
| Meaningful ended-red | Matrix-qualified trade later closes with negative actual result | New qualification + Journal result | Trade count/money | No | Qualifying trades | Yes | New read model/path flags |
| Partial exits | Reduction event and exact quantity/price/time | Saved snapshots + allocations | Shares, price/share, UTC | Yes | Analyzed trades | Yes | No |
| Scale-out percent | Exposure reduction after the last qualifying profitable scale-out, measured against maximum position size | Position before/after + quantity | Percent | Underlying facts only | Meaningful-profit trades | Yes | Read model field |
| Profit secured | Gross realized by profitable partial exits after qualification and before the first subsequent whole-trade red point or final exit | Chronological allocations | Money | Underlying facts only | Each valid qualifying reduction | Yes | Read model/path field |
| Remaining exposure | Quantity and average entry after reduction | Saved event metrics | Shares and entry price | Yes | Each event | Yes | No |
| No-scale ended-red | Qualifying trade with no reduction before reversal and negative actual result | Events + new qualification | Count/money | No | Qualifying covered trades | Yes | New derived population |
| Later-fill comparison | Replace one reduction with exact later exits while conserving quantity | Journal profit-protection service | Gross whole-trade money | Not in long-term model | Exactly one partial exit; no later add/flip; exact sequence | Yes for eligible trades | Integrate service; extend contract for multiple reductions later |
| Entry/add MFE/MAE until flat | Highest/lowest direction-adjusted intratrade move | Snapshot excursion | Price/share and derived percent | Yes | Covered entries/adds | Already available | No |
| Entry/add paths 5/15/30/60 | Direction and opposite-direction price movement after event | `metrics.postEventPaths` | Price/share | In snapshot JSON | When target/prior candle exists | Already available | Long-term reader must retain |
| Partial/final paths 5/15/30/60 | Same event-path definition after reductions | `metrics.postEventPaths` | Price/share | In snapshot JSON | When target/prior candle exists | Already available | Long-term reader must retain |
| Final-exit paths 5/15/30/60 | Favorable direction-adjusted move after becoming flat | Post-exit path table | Price/share | Yes | Saved horizon; shortened session can be unavailable | Already available | Reader currently keeps only 30m |
| Session VWAP | Cumulative one-minute typical-price × volume / volume | 1m indicator snapshot | Anchor price + signed distance/% | In snapshot JSON | From available session candles | Already available | Label definition only |
| EMA 9 — 1 minute | EMA 9 from 1m series at event | Indicator snapshot | Anchor price + distance/% | In snapshot JSON | Requires lookback | Already available | Retain timeframe in read model |
| EMA 9 — 5 minute | EMA 9 from the last completed 5m candle before execution | `fiveMinuteContext.completedBeforeExecution` | Anchor price + distance/% | In snapshot JSON | Requires 5m lookback | Already available | Long-term reader currently discards |
| Short-term volume acceleration | Current candle volume / up to prior 20 candles; at least 5 | Analyzer `relativeVolume` | Ratio | In snapshot JSON | Local 1m/5m history | Already available | Rename; do not call conventional RVOL |
| Conventional RVOL | Volume versus historical same-time/day baseline | None | Ratio | No | Unavailable | No | New historical capture if later approved |
| ATR 14 | Saved indicator calculation | Indicator snapshot | Price/share | In snapshot JSON | Requires lookback | Already available | Reader may expose |
| ADR 20 | Daily range history | Analyzer accepts `dailyRanges` | Percent/range | Effectively absent | Workers pass `[]` | No from current 1m day alone | New daily-range capture if approved |
| Candle patterns | 1m/5m detected context, location and occurrence | Snapshots + normalized occurrence projection | Occurrence/trade counts | Yes | Required pattern candles | Already available | No |
| Market-data gap | Non-consecutive completed-close timestamps | Saved candles | Gap boundary | Underlying timestamps | Detectable | Yes | Persist unavailable reason in new path |
| Known halt | Explicit regulatory/news halt interval | Not linked to Analyzer | Interval/reason | No | Unavailable | No | Optional future integration; otherwise say market-data gap |
| Trading session | Premarket, regular or after-hours at execution/close | UTC timestamp + timezone/session rules | Category | Not retained in long-term model | Derivable | Yes | Read-model field; lock boundaries |
| Quote/spread/depth | Bid, ask, spread, size and depth at execution | None | Market microstructure | No | Unavailable | No | New provider capture, not V2 requirement |
| Order/route/venue | Order type, route and execution venue | Venue is not generally populated for Analyzer | Execution metadata | Insufficient | Unavailable/partial | No | New import mapping if later approved |
| Market cap/float | Verified as-of market cap and float | None | Shares/money at date | No | Unavailable | No | New reference-data capture; never infer from price |
| Short locate/borrow costs | Exact cost allocated to trade | None in Analyzer contract | Money | No | Unavailable | No | New Journal fact/allocation contract |
| Date range | Inclusive completed-trade closing dates in account timezone | Journal analytics closing range | Local date range | Query-level | All saved rows | Already available | Add presets and preserve query state |
| Analyzer eligibility | Same-day stock round trip within one-minute provider retention | Yahoo/Moomoo services | Status/reason | Job/analysis state | New queue eligibility is seven days | N/A | Expose coverage; do not imply old trades were analyzed |

## Confirmed defects in the current long-term model

1. The path opportunity is based on 50% and 75% of each trade's own
   completed-close P/L peak. It does not implement the approved matrix.
2. Fees are added into the saved path whenever present, while the long-term
   model compares that one path to a user-selected Gross or Net Journal result.
   This can produce a Gross-to-fee-adjusted comparison.
3. Only the 30-minute final-exit path is read. Other saved horizons and all
   event-level paths are discarded.
4. Entry and add rows, and partial and final exits, are combined in several
   aggregates.
5. Exit giveback groups are `0`, `≤1%`, `1–3%`, and `>3%`, calculated from an
   earlier intraminute favorable extreme. They are unsuitable as the main
   microcap behavior analysis.
6. Five-minute EMA context is saved but not read. The visible EMA label does
   not identify the timeframe.
7. `Relative volume` is short-term candle acceleration, not historical RVOL.
8. ADR 20 is not populated because both active workers call the Analyzer with
   an empty daily-range array.
9. The risk-management section uses every raw Green-to-Red trade and counts
   only reductions after the stored peak and before first red. It misses
   profitable reductions earlier in the trade and has no exact qualifying
   no-scale ended-red total.
10. The full date query is already applied before the model is built, but the
    shared date control lacks requested presets and its Update action replaces
    the query string, discarding Gross/Net and other state.

## Consumer inventory

Changing `DailyTradeLongTermAnalyticsModel` affects:

- the seven Analyzer page clients and server page;
- analyzed-trade and candle-pattern evidence explorers;
- Journal Analytics offline view contracts and offline route surfaces;
- offline page contracts and dashboard navigation metadata; and
- focused verifier scripts that construct the existing path/model shape.

The page-specific read-model contract adds V2 fields without removing or
reinterpreting the old persisted path fields. Other consumers can continue to
use the legacy model shape while the Analyzer pages use the required V2 fields.

## Page-admission result

`Scaling Out` passes because it answers a distinct controllable behavior
question, has exact executions/quantities, supports both action and omission,
and can drill into exact trades. No other new page is justified from current
facts. Time of Day duplicates `/analytics/timing`; post-exit movement belongs
inside Entries and Exits; market-cap/float and execution-quality pages lack the
required as-of or quote/order facts.

## Recommended implementation boundary

1. Calculate a separate V2 read-model scenario with Gross and fee-complete Net
   values, direction-adjusted open-share return and matrix qualification
   records. Do not reinterpret the existing persisted peak-relative path.
2. Recompute eligible history from the immutable version-linked saved candles
   and exact Journal executions; do not refetch or rewrite saved analysis rows.
3. Keep raw Green-to-Red facts for factual crossing history, but build the main
   behavior population from matrix qualification.
4. Expand the long-term reader to retain all saved event/final-exit horizons,
   five-minute EMA context, position quantities and event session.
5. Integrate the exact single-reduction profit-protection outcome as secondary
   scale-out evidence; label multiple-reduction cases unavailable until an
   approved quantity-conserving extension exists.
6. Do not add market cap/float, conventional RVOL, spread/depth, halt identity
   or borrow/locate claims without new exact capture.
