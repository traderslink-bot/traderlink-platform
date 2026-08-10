# Daily Trade Analyzer Long-Term Analytics Plan

**Status:** Combined factual prototype owner approved; capability-page split is
controlled by the [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md).

**Progress:** [Daily Trade Analyzer Long-Term Analytics Progress](daily-trade-analyzer-long-term-analytics-progress.md)

## Outcome

The accepted `/analytics/trade-analysis` prototype proves the complete factual
inventory for saved day-trade Analyzer results. The final product distributes
that inventory across a Day Trade Analysis landing and four focused Trade
Analyzer capability pages. It does not rerun the analyzer, request candles,
create a second profit calculation or mix ordinary historical imports into
Analyzer coverage.

## Page boundary

- The final pages belong under the separate expandable **Trade Analyzer**
  navigation group. The current route remains transitional until the accepted
  replacement pages exist.
- `/analytics/execution` retains its current job: Journal-only trade size,
  maximum-position and hold-duration results across all eligible closed trades.
- Trade Analysis uses only current, ready Daily Trade Analyzer revisions whose
  stored round-trip version still matches the current Journal projection.
- The shared page-level closing-date range applies to every card, breakdown and
  trade row.
- The page is a server read with a small client presentation boundary for
  filters and expandable details. It never calls an internal API route.

## Paid eligibility and coverage

- Trade Analyzer coverage is `analyzed eligible trades / all eligible trades`,
  not analyzed trades divided by every historical day trade in the Journal.
- Older imported trades outside the user's Analyzer eligibility period remain
  available in the Journal and ordinary Analytics but do not enter the
  Analyzer coverage denominator.
- A currently active paid Analyzer entitlement is required to create a new
  analysis. An analysis successfully created while the user was entitled
  remains readable if the user later stops paying.
- If fewer eligible trades have been analyzed, the page shows the simple count
  and a plain explanation for the outstanding or unavailable analyses. Trades
  that do not have the facts required for a supported analysis are not counted
  as Analyzer-eligible.
- The initial historical lookback length is deliberately undecided. Test it
  later with the owner's Moomoo test account before setting or advertising the
  production value; do not hardcode a 30-day assumption now.

## Source-of-truth contract

1. Journal Analytics owns symbol, direction, closing date, holding duration,
   currency and exact realized gross/net P/L facts.
2. Level Analysis owns immutable current-version execution snapshots, pattern
   contexts and `daily_trade_path_v1` summaries/opportunity windows.
3. Rows join by account-scoped round-trip identity and the exact stored
   round-trip-version identity. A stale or malformed analyzer record is counted
   as unavailable rather than guessed.
4. Every database read is scoped to the active workspace/account. No row is
   selected only by an analyzer, snapshot or path identifier.
5. Existing continuous values remain continuous. Buckets are presentation
   groupings and never replace stored facts.

## Complete first-page inventory

### Coverage and headline facts

- analyzed trades and analyzed execution count;
- analyzed-day-trade coverage for the selected date range;
- trades with a sustained completed-close profit opportunity;
- trades that moved from green to red;
- total and average result on the selected gross/net basis;
- total and average strongest sustained completed-close opportunity;
- total and average additional completed-close opportunity;
- average and median percentage of peak profit captured; and
- average peak-to-final-exit giveback.

Coverage is explicit. The denominator is completed Journal day trades that are
inside the user's Analyzer eligibility period and have the required supported
facts in the selected currency/date range. Multi-day trades, older ineligible
history and unavailable evidence are never reported as zero-value analysis.

### Profit capture and holding behavior

For each analyzed trade retain and display:

- actual Journal P/L on the selected basis;
- strongest sustained completed-close opportunity;
- additional opportunity, calculated as `max(opportunity - actual, 0)`;
- captured percentage when the opportunity is positive;
- minutes from the strongest completed-close peak until final exit;
- peak-to-final reversal; and
- duration and strength of the best sustained opportunity window.

Aggregate those facts into useful peak-to-exit holding buckets: `0-5`, `6-15`,
`16-30`, `31-60` and `60+` minutes. The page describes observed history, not an
instruction to exit at a specific future time.

The page also separates ordinary total holding time into `0-5`, `6-15`,
`16-30`, `31-60` and `60+` minute cohorts. Every cohort reports sample size,
win rate, average return, average result and average additional opportunity.
Win rate is never used as a return value: a cohort can correctly show a 0% win
rate and a negative average return.

### Green-to-red behavior

Show the exact count, win rate, average return and average result for `never
green`, `green without turning red`, `green to red and ended red`, `green to
red and recovered`, and `green to red and ended flat`. Also show:

- average time from first green to first red;
- recovery rate after turning red and average recovery time;
- average peak-to-red and peak-to-final-exit damage;
- results for trades with and without adds after the peak; and
- results for green-to-red trades with and without a partial exit before red.

These comparisons are observed history. They may help the trader assess profit
protection and scaling behavior, but they never claim that one action caused a
result or predict what a future trade will do.

### Entry and exit execution quality

Use every stored execution snapshot, not only the first entry/final exit.

- Entry/add facts: distance from Session VWAP and timeframe-specific EMA 9,
  execution-candle location, edge distance, one-minute relative volume,
  candle/session volume and turnover, MFE, MAE and minutes until flat.
- Partial/final exit facts: giveback from the best prior completed-candle price,
  execution-candle location, relative volume, VWAP/EMA distance and saved
  post-execution price paths.
- Combined trade rows remain separate from execution-occurrence rows so a
  multi-fill trade does not silently receive extra trade weight.
- Entry opportunity and risk report average and median favorable/adverse price
  movement per share from the saved entry/add snapshots. They do not mislabel
  those per-share moves as realized dollars.
- Entry-time cohorts use the Journal trading timezone and split premarket,
  opening hour, late morning, afternoon and after-hours entries.

### Candle-pattern observations

Group stored `1m` and `5m` patterns by canonical kind, entry/exit side, and:

- **Exact execution candle** (`candlesBeforeExecution = 0`); or
- **Before execution** (`candlesBeforeExecution = 1 or 2`).

Patterns after the execution remain excluded. Results show occurrence count,
distinct trade count, win rate, average return and average associated Journal
P/L on the selected basis. Copy consistently calls these observed candle
patterns, never predictions or trading signals.

### Detail table

Each analyzed trade row shows ticker, direction, close date, actual P/L and
return percentage,
strongest sustained opportunity, additional opportunity, captured percentage,
peak-to-exit hold, green-to-red outcome and execution count. It supports ticker
search, outcome filtering and sorting. A link returns to that trading date's
Daily Trade Tracker for the full replay and execution analysis.

## Currency and arithmetic

- Never add money from different currencies. The first slice uses one selected
  Journal currency partition at a time and labels it.
- Gross P/L is the default so analyzed manual trades without complete fee facts
  remain visible without inventing fees. Net P/L is selectable and includes
  only trades with complete fee evidence. A result set never mixes the two.
- Money is calculated with `decimal.js`; ordinary JavaScript floating-point is
  permitted only for non-financial chart geometry and already-stored ratios.
- Visible money uses at most two decimals, while calculations retain exact
  stored decimals.
- If actual P/L exceeds the strongest completed-close opportunity, additional
  opportunity is zero and capture may exceed 100%; the page does not rewrite
  either fact to force a narrative.

## Empty, unavailable and small-sample behavior

- No analyzed trades: explain that Trade Analysis begins after eligible Daily
  Trade Tracker analyses are saved.
- Partial coverage: show the exact analyzed/eligible count.
- A statistic with no valid denominator displays `N/A`, not zero.
- Small samples always show their count. The page does not claim a repeatable
  behavior from one occurrence.

## Verification gates

1. Static/read-model proof covers account isolation, current-version matching,
   date filtering, currency separation, malformed snapshots and no provider
   access.
2. Exact arithmetic proof covers additional opportunity, capture percentage,
   peak-to-exit buckets and zero-denominator handling.
3. Existing saved sample analyses reconcile to current Tracker facts without a
   candle request or database write.
4. Focused lint, changed-file TypeScript filtering, dashboard-navigation guard
   and whitespace checks pass. Do not run Vitest.
5. Desktop/mobile visual review covers the full page, empty state, filters and
   navigation before acceptance.
6. The final local commit contains only this analytics slice and its documents.

## Deliberately deferred

- Statistical significance claims, predictive scores or recommended exits.
- Cross-currency totals.
- Comparisons against unanalyzed historical imports.
- Account-level pre-aggregated summary tables; the current versioned read model
  is sufficient for beta volume and avoids premature schema duplication.
- Long-term 15-minute pattern results until the owner chooses a clear user
  presentation for that context.
