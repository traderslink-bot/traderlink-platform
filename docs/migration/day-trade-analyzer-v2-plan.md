# Day Trade Analyzer Version 2 Plan

**Status:** Owner authorized complete Version 2 implementation on 2026-09-04
without intermediate UI approval pauses. The lightweight mockup remains the
implementation specification; owner visual review will occur after the
completed work is placed online through a separately authorized release.

**Progress:** [Day Trade Analyzer Version 2 Progress](day-trade-analyzer-v2-progress.md)

**Active follow-up:** [Profit Zones Progress](day-trade-analyzer-profit-zones-progress.md)

**Data audit:** [Day Trade Analyzer Version 2 Data Audit](day-trade-analyzer-v2-data-audit.md)

**Visual review:** [Day Trade Analyzer Version 2 Mockup](day-trade-analyzer-v2-mockup.html)

This plan supersedes the long-term presentation decisions in the completed
[Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md).
Immutable Journal facts, account isolation, current-version matching, saved
candles and exact execution evidence remain authoritative.

## Outcome

Version 2 keeps the current Material dashboard quality while making the Day
Trade Analyzer useful for volatile small- and micro-cap day trading. For any
selected period, it will show exact historical scenarios and the records behind
them so the trader can judge entry, profit-taking and risk-management behavior.

It will not grade the trader, claim improvement, predict what a stock will do,
or turn an observed scenario into advice.

## Owner-approved rules

1. Every page gets the same ordinary date selector. Changing it changes every
   card, table, total, denominator and evidence query on that page.
2. The default experience is one selected period, not side-by-side comparison.
3. Exact records and sample counts remain visible for small samples. Thirty
   completed trades in the total comparison population may gate automated
   high/low language; it is not required in every group.
4. Do not call a result best or worst based only on win rate. Gross total,
   average, median and win rate are distinct measures and must be named.
5. The approved meaningful open-profit matrix is:

   | Direction-adjusted return on open shares | Consecutive completed 1-minute closes |
   | --- | ---: |
   | 50% or more | 3 |
   | 30% or more | 5 |
   | 20% or more | 10 |
   | 15% or more | 15 |

6. A missing minute breaks a qualifying sequence. Do not count a halt, trading
   pause or market-data gap as time during which the qualifying price persisted.
7. At each qualifying close, calculate the recorded position's potential result:
   realized P/L already secured plus the result on remaining shares at that
   saved close. Show it beside actual completed P/L and the difference.
8. Show scaling out and not scaling out, including qualifying trades where no
   shares were reduced and the completed trade ended red.
9. Keep price movement per share, percentage price movement, calculated
   whole-position P/L and actual completed-trade P/L visibly separate.
10. Keep post-exit 5/15/30/60-minute prices within Entries and Exits. They are
    later price history, not pre-exit profit surrender and not a separate page.
11. Replace `move in your favor` and `move against you` with explicit labels:
    price rise/drop after a long/short entry or add.
12. Short-only language appears only when the selected period contains shorts.
    If both directions exist, provide Long and Short views. If one exists,
    render it directly without an unnecessary toggle.
13. Short borrow, locate and interest costs appear only when exact imported and
    allocated facts exist; otherwise do not describe Net P/L as all-in.

## Routes

| Route | Version 2 purpose |
| --- | --- |
| `/analytics/trade-analyzer/day` | Selected-period overview and route choices |
| `/analytics/trade-analyzer/day/entry-exit` | Entry/add/exit context, VWAP, EMA 9 and limited post-exit prices |
| `/analytics/trade-analyzer/day/mfe-mae` | Explicit price-rise and price-drop paths after entries/adds |
| `/analytics/trade-analyzer/day/green-to-red` | Meaningful open profit, potential result, actual result and reversal |
| `/analytics/trade-analyzer/day/scaling-out` | Scale-out and no-scale exposure behavior |
| `/analytics/trade-analyzer/day/candle-patterns` | Saved 1-minute and 5-minute candle contexts |
| `/analytics/trade-analyzer/day/trades` | Exact analyzed trades behind all aggregates |

No separate post-exit page and no duplicate Time of Day page are planned.
`/analytics/timing` already owns entry/exit time analysis.

## Date-filter contract

Required choices: Today, This week, Last week, This month, Last month, Last 30
days, Last 3 months, Last 6 months, Last 12 months, Year to date, All time and
custom inclusive start/end dates.

The filter uses the completed trade's Journal closing date in the account
timezone. It persists in the URL and across all seven routes, preserves the
Gross/Net basis and direction when applicable, and resets only invalidated
pagination. The resolved dates and selected-period trade count stay visible.

## Calculation contract

For each chronological accepted execution and completed candle close, retain:

- direction, average entry and open quantity;
- realized P/L already secured;
- unrealized P/L on open shares;
- combined calculated whole-position P/L;
- direction-adjusted return on the open shares;
- session, saved price and timestamp; and
- whether the next completed close is consecutive.

A trade may satisfy more than one matrix row. Headline trade counts are unique;
the supporting table can show all thresholds reached. The primary scenario is
the highest threshold satisfied; ties use the earliest qualifying close.

The sustained-close matrix remains available for the separate scaling and
profit-protection scenarios. It does **not** determine the Green-to-Red
population. Green-to-Red includes a completed trade when price reached at least
20% in the trade's direction while shares were open; there is no minimum time
requirement. Time in the peak ten-point gain zone is a displayed fact, not an
eligibility gate.

Gross scenarios contain no fees. Net scenarios appear only when fee facts are
complete and use the same fee basis as the actual Journal result. Gross is never
silently substituted for Net.

## Page contracts

### Day Trade Analysis

Show selected-period analyzed trades, candle coverage, actual P/L, qualifying
scenario count and direct links to the focused questions. Avoid a generic
takeaway that chooses a winner for the trader.

### Green to Red

Lead with the percentage and count of completed trades that reached +20%, their
combined maximum Gross profit opportunity, exact Gross profit taken, the count
that later turned red, and the count and combined Gross loss that finished red.
Keep the denominators explicit. Split finished-red trades into no-profit-taken
and some-profit-taken groups, and show recoveries separately. For each
finished-red trade show its maximum gain, maximum Gross opportunity, peak
ten-point zone, total time in that zone, exact Gross profit taken and final
Gross P/L. Do not use the sustained-close matrix as a gate and do not promote
raw one-cent breakeven crossings as the primary analysis.

### Scaling Out

Show how often qualifying trades reduced shares before reversal, how often they
did not, how many no-scale trades ended red, percentage of the position reduced,
profit secured by the reduction, remaining shares/exposure and exact trades.
Where the existing quantity-conserving later-fill comparison is available,
show its exact avoided-loss/given-up-profit result as a secondary fact.

Lead this page with a collective `Profit taking by price level` view for every
analyzed trade in the selected closing-date range. It has two coordinated
parts:

1. A compact vertical zone ladder uses cumulative direction-adjusted thresholds: at least
   20%, 30%, 40%, 50%, 60%, 70%, 80%, 90% and 100%. A trade that moves from
   below 30% to at least 40% on one completed close counts as reaching both
   thresholds; it is never added as a second or "skipped-zone" trade.
2. Exact zone facts assign every profitable exit fill to one exclusive band:
   20% to under 30%, 30% to under 40%, through 90% to under 100%, then 100% or
   more. The fill's direction-adjusted return uses the weighted average entry
   immediately before that fill. Its gross realized profit, quantity and trade
   identity are known Journal/analyzer facts and belong to that band only.

For each threshold/band pair show:

- unique trades reaching at least the lower threshold and its percentage of
  the selected direction's analyzed trades;
- trades and percentage taking profit inside the exclusive band and exact gross
  profit taken there;
- trades reaching the next threshold while shares remained open;
- trades that did not reach the next threshold before the final exit, with a
  separate count for a completed close falling below the current threshold;
- median first-reach time from entry and median total time inside the exact
  ten-point zone;
- calculated gross profit available on the shares held when the threshold was
  first reached, partitioned exactly between trades that did and did not reach
  the next threshold;
- among trades taking no profit inside that band, the exact count and rate that
  completed red plus the sum of their realized gross losses; and
- exact supporting records for every row and outcome.

`Profit available at level` is a conservative calculated scenario: average
entry multiplied by the threshold return and the shares still open at the
first completed close or exit execution proving the threshold was reached. It
is not an execution or guaranteed fill. `Profit taken in zone` and `Realized
gross losses` come only from recorded executions and completed Journal trades.
The ladder and its exact records never add overlapping level opportunities into a false
grand total. All profit-zone money stays Gross even when the page's general
Gross/Net selector is Net.

### Entries and Exits

Separate initial entries from adds and partial exits from final exits. Identify
Session VWAP and EMA 9 timeframe. Use the last completed 5-minute candle for
5-minute EMA context. Show total, average and median completed results beside
sample size, win rate and average return. Include execution-candle volume
multiple, ATR 14 as a percentage of price and execution location inside the
completed 1-minute candle range, with exact execution records. Replace 1%-3%
giveback buckets with the meaningful-profit analysis. Show both the highest and
lowest saved prices through 5/15/30/60 minutes after partial/final exits in a
clearly separated later-price section.

### Room After Entry

For longs, say price rise and price drop after entry/add. For shorts, say price
drop and price rise. Show per-share dollars and percentage price movement at
5/15/30/60 minutes and until flat, with exact executions.

### Candle Patterns

Keep timeframe, execution type, occurrence count, trade count, average result,
median result and win rate distinct. Preserve the exact occurrence explorer.

### Analyzed Trades

Keep bounded, stable, account-scoped evidence. Show enough scenario, direction,
coverage and post-exit detail to identify why each row contributes to a page.

## Data/versioning boundary

The current persisted contract is already called `daily_trade_analyzer_v2`.
Version 2 therefore adds a separately named read-model scenario contract and
does not reinterpret or mutate that immutable saved path. It deterministically
rebuilds from version-linked saved candles and exact Journal executions. Older
rows without enough evidence remain visibly unavailable.

No migration is required for this implementation. If bounded-query performance
later requires persisting the derived scenario, it must receive a new immutable
contract/version and a separately approved migration; do not overwrite the
existing analysis version.

## Delivery sequence and gates

1. Complete the saved-fact/source audit.
2. Create a lightweight shared visual specification without pausing for
   intermediate approval.
3. Lock exact scenario arithmetic and model contracts.
4. Implement a new Analyzer/path version only where the audit requires it.
5. Implement the long-term read model and bounded evidence queries.
6. Implement the shared date filter and complete page family in coherent slices.
7. Reconcile route navigation and offline page rendering. Help copy is a later
   owner-approved follow-up after the pages are accepted.
8. Perform targeted static/reconciliation checks; do not run Vitest.
9. Verify integrated desktop/mobile Light/Dark states at the authorized visual
   checkpoint.
10. Create one narrow allowlisted local implementation commit and hand it to
    the coordinator. Online owner review and any follow-up visual changes occur
    at the separately authorized release checkpoint.

No push, merge, deployment, hosted migration, configuration change or hosted
data write is authorized by this plan.

## Acceptance

- Exact account/workspace isolation and current round-trip-version matching.
- Every result obeys the selected closing-date range.
- Gross-to-Gross and fee-complete Net-to-Net scenario arithmetic.
- No double-counted trades, shares or executions in headline totals.
- Correct long/short direction, units and conditional direction controls.
- Missing minutes reset consecutive-close qualification.
- Exact scale-out and no-scale ended-red populations.
- Saved 5/15/30/60 entry/add/partial/final paths exposed when present.
- Session and 1-minute/5-minute EMA identity displayed.
- Exact supporting records for every aggregate.
- Route navigation and offline page rendering use the same page model.
- Help copy remains deferred until the owner accepts the pages.
- Desktop/mobile Light/Dark rendered owner acceptance.
