# Trade Analyzer Trend & Momentum Plan

Status: Implementation authorized 2026-09-12. Owner subsequently approved all
required testing and completing the planned work without routine approval stops,
including planned UI implementation. Production release remains separately gated.

Progress: [Planning and implementation record](trade-analyzer-trend-momentum-progress.md).
Latest payload checkpoint: redundant aggregate execution contexts removed;
29 focused tests pass. Full scale and rendered acceptance remain open.
Numerical checkpoint: 16 foundation/convergence tests pass, including independent
formula references, 1m/5m price-scale invariance and sparse-bucket observations.
Actual provider adjustment/reference and rendered acceptance remain open.
Section-help checkpoint: seven nested help buttons corrected; 10 scoped tests
and targeted lint pass. Full tooltip inventory and browser acceptance remain open.
Individual card now shares the corrected disclosure; eight reporting/presentation
tests and five changed-root type/lint checks pass. Default combined table headings
all render help controls; full text inventory and browser interaction remain open.
Parent: [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md).

Feasibility update: the progress record now includes the verified production
source and an operator-grant-user-scoped read-only sample. The designated shared
connection belongs to a different user; personal test-corpus authorization is
awaiting owner confirmation. One early entry has only nine
completed pre-entry bars; another has 382. Therefore prior-session warm-up is
a concrete implementation requirement where saved earlier history is insufficient,
not a reason to suppress the complete trade. The existing adapter's <=24-hour
request bound and shared strict pattern aggregator must be preserved; use bounded
history ranges and indicator-specific sparse aggregation. Broader numerical,
sparse-history and multi-round-trip acceptance remain pending.

Source checkpoint 2026-09-13: 125 scoped tests pass; 107 changed TypeScript roots
pass their split checks; lint has zero errors and one inherited unused-component
warning. These are not hosted calibration, full build or browser acceptance.
Retry-allowance choice, private-corpus identity, live calibration and the final
rendered/release gates remain open. See the progress record for exact evidence.

## 1. Product outcome

Implementation storage checkpoint: reserved/source-registered
`0134_daily_trade_analyzer_trend_momentum_history` follows exact predecessor
`0133_platform_watchlist_daily_recaps` and creates
`level_analysis_indicator_history_requests`. It records scoped job/range attempts
and immutable completed candle evidence, which existing session storage does not
provide. Only disposable in-memory verification is authorized now; release must
apply 0134 through the guarded migration process before this manifest can start
against production. No automatic startup migration or existing-data rewrite.

Extend the deterministic Trade Analyzer, independently of Watchlist and AI, to
explain EMA9, EMA20, RSI14 and Session VWAP behaviour around trades. The primary
benefit is analysis across the user's collected trades: useful feedback plus
inspectable comparisons from which users can draw their own conclusions.
Individual trade explanations and charts must use the same facts as aggregates.
This is not a Watchlist signal generator or an OpenAI integration.

Complete scope:

- Initial entry, adds, re-entries, partial exits, position closures and final exit.
- EMA9/EMA20 alignment, direction, separation and completed-bar crossings.
- RSI14 value, band, direction and changes through the trade.
- Price behaviour relative to EMA9, EMA20 and Session VWAP.
- Indicator-context comparisons of actual outcomes, entry excursions, scaling
  and profit-protection behaviour, with exact supporting records.
- Existing Analyzer group pages, one proposed Trend & Momentum page, individual
  analysis, connected chart evidence, Help and applicable offline surfaces.
- Versioning, data coverage, cost/resource controls and reference verification.

No trade grades, automatic execution instructions, new trade grouping, changes
to Journal P/L, entitlement expansion, or requirement to use Watchlist data.
Do not assume every user's instrument is a microcap or infer trader intent.
Calibrate interpretive rules against volatile small/microcap examples as well
as slower, falling, flat and short-trade examples.

## 2. Source audit and preservation boundary

Planning checkout: existing `e70f/traderlink-platform`, detached HEAD
`20f2209624ea03bf9e7c82bb2960a0feecc041cf`. It contains unrelated Watchlist changes;
none belong to this task. No branch/worktree changes or application startup.

The owner identified chat **analyzer analysis pages updates**, thread
`01a06d72-aa78-7d43-b8e5-c8fa51c2e030`. Its recent history was read, not messaged
or assigned parallel work. Its latest handoff preserves persistent help
tooltips, count-only navigation and uniform card sizing. A handoff is not proof
that those changes are deployed.

Its newer `day-trade-analyzer-v2-plan.md` was read in place under
`C:/Users/jerac/Documents/TraderLink/worktrees/trade-analyzer-v2/docs/migration/`.
That plan supersedes the older local presentation plan. It includes Scaling
Out, Profit Zones, saved user-defined trade grouping, Gross-only Scaling Out,
date controls, evidence drawers and newer written analysis. Do not copy its
whole branch or restore older local files over it. Before implementation,
identify the then-current integrated parent and reconcile the complete newer
inventory; production status was not inspected for this planning task.

Verified local source anchors:

| Source | Existing capability / limitation |
| --- | --- |
| `src/lib/trade-candle-analysis/indicator-context.ts` | EMA9, EMA20, Wilder RSI14, VWAP already computed; EMA uses first-close initialization |
| `src/modules/level-analysis/server/daily-trade-analyzer.ts` | Indicator snapshots attached to executions; 5-minute execution context exists |
| `app/(dashboard)/trade-tracker/[sessionDate]/day-session-types.ts` | EMA20/RSI fields exist alongside EMA9/VWAP distance metrics |
| `app/(dashboard)/trade-tracker/[sessionDate]/day-session-view.tsx` | Visible reference summaries principally use EMA9/VWAP distance |
| `src/modules/level-analysis/server/daily-trade-long-term-analytics-service.ts` | Existing ready/version-linked evidence and EMA9/VWAP context groups |
| `src/modules/help/trade-analyzer-guides.ts` | Documents EMA9/VWAP distances and timeframe-specific chart context; needs expansion |

Newer-lane integration anchors also include `daily-trade-v2-scenario-analyzer.ts`,
`written-trade-analysis.tsx`, `trade-analysis-page.tsx` and
`app/pwa/offline-analytics-route-surface.tsx`. Their complete runtime call graph,
saved history sufficiency and current production lineage remain pre-code checks.
This is a source-grounded plan, not a completed production data audit.

## 3. Complete page inventory and proposed additions

| Surface | Preserve | Addition |
| --- | --- | --- |
| Day Trade Analysis `/analytics/trade-analyzer/day` | Selected-period overview, analyzed count, date/basis/direction controls, existing destinations | Trend & Momentum destination and concise coverage/count summary; no duplicate long tables |
| Entries & Exits `/day/entry-exit` | Execution mix, snapshot, distance/volume groups, later-price section | EMA alignment and RSI context for initial entries/adds and partial/final exits; link to matching detailed comparison |
| Room After Entry `/day/mfe-mae` | Existing MFE/MAE per-share and percentage paths | Optional entry-context filter; same timed/until-flat excursions, not new P/L calculations |
| Green-to-Red `/day/green-to-red` | Existing +20% population, peak zones, recovery, profit taken and evidence | Compare indicator changes before first red/recovery, within this page's existing population |
| Scaling Out `/day/scaling-out` | Entire Profit Zones ladder, minimum-time controls, partial/full distinctions, exact Gross facts | Expandable indicator context at profit-taking executions; aggregate comparisons of recorded behaviour without changing zone qualification |
| Candle Patterns `/day/candle-patterns` | Timeframe, occurrence explorer, counts and current filters | Optional EMA alignment / RSI-band filter using the same pre-execution context; retain original pattern timing labels |
| Analyzed Trades `/day/trades` | Stable bounded evidence, exact grouped-trade drawer | Restore indicator cohort filters passed from other pages; show why each trade matched |
| Proposed `/analytics/trade-analyzer/day/trend-momentum` | New focused destination | Main exploratory comparison page described below |
| Individual written analysis and trade details | Current summary, executions, grouping, correction and replay interactions | Entry/during/exit context sentences and expandable chronological evidence |
| Connected Analyzer chart | Current timeframe, replay and execution selection | EMA20 alongside EMA9/VWAP and optional RSI pane, with matching indicator values and highlighted evidence bars |
| Offline/PWA Analyzer views | Existing privacy and last-synced coverage | Same definitions/filter semantics for available synced evidence; unavailable detail must not fabricate online results |
| Help | Stable routes/anchors and current tooltip interactions | Trend & Momentum guide plus relevant existing guide updates |

Paths abbreviated `/day/...` above belong to `/analytics/trade-analyzer`.
Propose one new page, not one page per indicator. Other pages keep their distinct
questions; detailed comparison rows live once and are linked/filtered from them.
All additions require owner review of layout/copy before UI implementation.

## 4. Data and time contracts

1. Use current, ready Analyzer evidence linked to exact accepted Journal
   execution/group revisions. Never join private data by ticker alone.
2. Canonical trade identity follows the newer Analyzer: saved logical trade
   where present, otherwise its supported single round trip. Multiple trades
   in one ticker remain separate; re-entry can belong to the same saved trade.
   Owner reconfirmed 2026-09-12: one user-defined trade may contain multiple
   round trips. Use the current canonical grouping resolver, not a new fallback
   implemented here. Missing/unready combined evidence never licenses splitting
   an existing group into its member round trips for these comparisons.
3. At execution time T, context uses only candles with close time <= T. Store
   whether provider timestamps mean bar start/end. Exclude the containing
   unfinished candle from what was observable at T, even if its final OHLC is
   now saved. Exact execution price remains usable as its own observation.
4. Initially use 1-minute and 5-minute assessments. Show one selected timeframe,
   default 1-minute, with optional side-by-side 5-minute context in trade details.
   Preserve existing 15-minute/hour charts; do not silently imply they have new
   written/grouped assessments. Higher-timeframe expansion needs evidence QA.
5. Aggregate 5-minute OHLCV/turnover from returned valid source bars using explicit
   exchange-time boundaries, after the bucket closes. A bucket does not require
   five returned one-minute bars: sparse trading can produce fewer. Confirm the
   source request covered the bucket and pagination completed. Empty buckets
   stay absent; failed/truncated request coverage is unavailable. Compare this
   aggregation with provider-native 5-minute bars before acceptance.
6. EMA/RSI history may span earlier supported sessions; VWAP resets at its stated
   session anchor. Session policy and adjustment basis must be versioned and
   match chart, event context and aggregates. Prior-day prices must have compatible
   split adjustment; do not apply Journal reporting-currency conversion to RSI.
7. Sparse timestamps alone do not invalidate returned Moomoo history. Do not
   create flat synthetic candles or claim an unobserved interval was traded.
   Indicator updates use consecutive returned bars, not consecutive clock minutes.
   Distinguish this from request errors, truncation, unconsumed pagination and
   missing requested coverage. Those break evidence continuity. Overnight/session
   boundaries are not intraday breaks/reclaims, even when warm-up continues.
   A partial request must not claim a complete session VWAP or full-trade history.
8. Indicators fail independently. Missing RSI does not hide valid EMA context,
   the trade, existing P/L or unrelated Analyzer results.

### Owner-approved sparse-candle policy - 2026-09-12

The owner reports that Moomoo does not identify why an individual candle is
absent and that sparse bars are expected before low-volume stocks become active.
Accept chronological returned bars from successfully completed range requests
without requiring an explanation for every absent minute. Do not record
"confirmed zero volume" for an absence; the API has not established that fact.
Valid low-volume bars remain eligible. Preserve actual returned zero-volume bars
according to the provider contract; do not synthesize additional ones.

Warm-up counts returned same-timeframe bars. Twenty one-minute bars may span
more than twenty minutes. Seek earlier supported history within a bounded range
when needed, rather than substituting daily bars or rejecting the whole trade.
Verify sorting, duplicate timestamps, adjustment/session compatibility, response
status, pagination and requested start/end coverage separately from bar density.
An empty successful response means no usable bars, not proof of an outage or
proof of zero trading. A request error must never be relabeled sparse trading.

Retain each observation's actual age at execution and the elapsed span of slope
windows. Describe old context as "last recorded bar at [time]", not current
momentum. During evidence QA, define a versioned freshness limit for current-state
wording separately from warm-up sufficiency; sparse history alone is not a ban
on indicator calculations. Early entries may have fewer available indicators
than later adds/exits. Never use later bars to fill an earlier knowledge gap.

Returned-bar runs support "three recorded closes above EMA20", not "held above
EMA20 for three minutes". Duration-based existing Profit Zones/hold rules retain
their original clock-continuity requirements. Explicit halts/session boundaries
reset event sequences; warm-up may continue through them under the session policy.
For a side change spanning absent timestamps, report "changed sides between
recorded closes" with both times, not an exact intragap crossing time.

### Warm-up and session feasibility checkpoint

There is no arbitrary shared 100-bar rule for all indicators. Before coding the
final contract, inventory earliest available history per timeframe and validate
initialization against a pinned independent implementation.

- EMA N: proposed new calculation uses an N-close SMA seed then alpha 2/(N+1).
  Legacy first-close output remains labeled/versioned, not overwritten. Evaluate
  100/200/400 prior-bar windows against a longer reference for convergence and
  stable classifications; choose the smallest verified bounded window.
- RSI14: Wilder seed from 14 price changes, then smoothing; use extended history
  for convergence, not only the minimum 15 closes. Explicitly cover no losses,
  no gains, flat series and numerical boundaries.
- VWAP: exact cumulative turnover/volume when consistently available; otherwise
  an explicitly identified bar-price approximation. Never mix methods midway.
  Preserve the verified existing session policy; document its actual anchor
  before implementation. Do not silently switch between regular-only and
  extended-hours VWAP or between day reset and all-history accumulation.
- Proposed acceptance tolerances: EMA/VWAP difference <= 0.00001 * reference
  price; RSI <= 0.1 point against full-history reference, with no confident
  classification when the initialization uncertainty straddles a boundary.
  These are engineering tolerances to validate, not trading rules.

Unresolved before implementation: actual saved warm-up coverage, current VWAP
anchor/method, permissible bounded history backfill, and performance cost of
the current integrated read path. Record evidence and adjust this plan rather
than promising every historical trade can immediately get all indicators.

## 5. Deterministic measurement specification

Store continuous numbers and timestamps alongside categories. Categories are
versioned presentation rules, never replacements for the underlying facts.

Proposed v1 definitions (product design, not universal trading standards):

| Measurement | Exact proposal |
| --- | --- |
| EMA alignment | 100*(EMA9-EMA20)/close at last returned completed bar; >0.02 above, <-0.02 below, inclusive middle effectively equal |
| EMA slope | 100*(EMA(t)-EMA(t-3))/close(t), using returned completed bars; >0.02 rising, <-0.02 falling, otherwise little change; retain elapsed time |
| EMA separation | signed percentage (EMA9-EMA20)/close times 100; expanding/contracting by change in absolute separation over 3 returned bars, with inclusive 0.02 percentage-point deadband |
| EMA crossover | opposite non-neutral sides in the returned completed-bar sequence; equality/neutral alone is not a cross; sparse timestamps use interval wording |
| Price side | completed close above/below reference using 0.02% of reference as comparison deadband; exact execution-price distance shown separately |
| Reference lost/reclaimed | completed close transitions from above to below / below to above that bar's EMA or VWAP, retaining bar timestamps |
| Recorded closes above/below | number of consecutive returned completed closes on that side; not clock duration or an assertion that price never wicked through |
| RSI bands | [0,30), [30,50), [50,70], (70,100]; above 70 / below 30 receive conventional overbought/oversold context |
| RSI direction | RSI(t)-RSI(t-3): >2 points rising, <-2 falling, otherwise little change; consecutive returned completed bars with elapsed span recorded |
| RSI midpoint crossing | retain last strict side of 50; equal values emit no crossing; emit once when a later returned completed value is strictly on the opposite side |

Comparison deadbands apply before display rounding. Neutral-to-opposite changes
require a previous known side in the same uninterrupted sequence; record both
the last known-side bar and confirming opposite-side bar. State labels require
the measured lookback and history quality. Failed-request gaps are unavailable;
sparse returned bars follow the policy above. The 3-bar change is t versus t-3,
requiring four observations. Display rounding must never create/remove events.
RSI 49 -> 50 -> 49 is a touch, not a crossing; 49 -> 50 -> 51 is one upward
crossing confirmed at the 51 observation. Reset remembered side at a session
boundary, known halt or unverified request gap. Do not infer hidden crossings.

QA must test those proposed deadbands/lookbacks across volatility regimes. Do
not optimize thresholds to make this user's winners appear correctly predicted.
If exact rules change during evidence QA, version and record the change before
presenting it as an accepted classification.

Do not call an EMA touch a dip-buy setup or a price/EMA crossing a failed thesis.
Initial release uses precise descriptions such as "closed below EMA20".
Market-structure failure, confirmed support, divergence and chart-pattern
invalidation require their own definitions/evidence and are not inferred here.
RSI above 70 alone does not mean the trader should sell; below 30 does not mean
the trader should buy. Long/short interpretation is explicit; raw RSI values
and indicator price direction are never inverted or renamed to fit an outcome.

## 6. Individual review and chronological evidence

Keep short templated sentences backed by event IDs, indicator values, timeframe
and completed-bar timestamps. Sections are "Entry", "During the trade" and
"Exits" within the existing analysis, not a replacement for the whole card.

Illustrative wording, not a real trade result:

> At your initial entry, EMA9 was above a rising EMA20 and RSI was rising.
> During the pullback, a candle closed below EMA9; the following three closes
> were above EMA20. At your first partial exit RSI was 74 and rising. At the
> final exit, EMA9 was falling and RSI had declined to 48.

Don't omit contradictory context: rising EMA20 with falling EMA9 is mixed,
not an automatic full uptrend. Do not assert buyers defended support simply
because an average was nearby. Missing evidence removes only the unsupported
clause. Expand to see exact values, timestamps and linked chart bars.

While flat inside a user-defined trade, market data can maintain indicator
history but is not counted as time holding the position. A new position cycle
resets held-position transition sequences; preserve the saved trade identity.
Post-final-exit price history stays in the established later-price section.

## 7. Aggregation and exploratory controls

### User-defined trade is the authoritative unit

One saved trade contributes one whole-trade P/L and one trade count, even when
it contains several returns to flat and re-entries. A position cycle (zero to
open to zero) is only an internal exposure segment. Never label cycle count as
trade count. Use the canonical grouped result, closing date, direction and
execution order; do not independently sum overlapping member projections.

Initial entry is the first opening execution of the saved trade. Re-entry opens
a later cycle within it; an add increases an already open position. An interim
position closure returns to flat without ending that saved trade. Final exit
is its canonical final closing execution. Preserve existing Scaling Out's
partial/full classifications separately; they are not interchangeable with
these event roles. Provide **Interim position closure** as a separate context so interim
closures are not hidden or mislabeled final exits. A group still open is outside
completed-trade outcome studies, though available individual context stays usable.

Example: one saved trade contains three round trips. The page counts one trade,
three position cycles and its exact execution occurrences. The first two full
closures are interim closures; only the final closing execution is the final
exit. Regrouping invalidates derived membership and cohort caches before reuse.
Never infer a user's trade boundary from ticker, time gap or return to flat.

Default comparison unit: one canonical completed analyzed trade classified at
its initial entry. Re-entry/add/exit studies are separate selectable event
types; label occurrence count AND distinct trade count. In a cohort, a trade's
whole P/L is counted once even if it has many matching executions. A trade can
appear in more than one event cohort; state overlap and never sum such cohorts
as though exclusive. Do not allocate whole-trade profit to a single indicator.

Trend & Momentum layout proposal:

1. Existing analyzed count plus shared date/basis/direction controls; show
   indicator-covered trades separately without shrinking the page's base count.
2. Controls: Timeframe (1m/5m), Context (initial entry/add/re-entry/partial exit/
   interim position closure/final exit/**During the trade**), EMA alignment, RSI
   band/direction and VWAP side. During the trade adds an event-type selector
   for the loss/reclaim studies below and a follow-through horizon. Defaults show
   initial entries with no restrictive condition. Save selections in URL.
3. "EMA9 & EMA20", "RSI" and "Session VWAP" comparison sections. Each displays
   trade count, wins/losses/breakevens, win rate, total/average/median actual P/L,
   average return and indicator coverage. Keep chosen Gross/Net labels explicit.
4. "Combined conditions" lets users combine the named filters, with matching
   and nonmatching comparable trades side by side. Unknown context is a separate
   coverage group, never the nonmatching control. Avoid an exponential matrix
   of every possible indicator combination or an automated best-strategy search.
5. "Supporting trades" opens exact in-page trade details with preserved filters,
   matching execution, timeframe and evidence. Growing rows use bounded server
   pagination, default 25, choices 10/25/50/100, stable ID tie-breakers.

For combined execution studies, all conditions must match the SAME selected-type
execution. A trade is matching if at least one such execution matches;
nonmatching requires complete context for every selected-type execution and
none matching. Otherwise it is unknown. These three trade cohorts are exclusive.
Trades with no selected-type execution are outside that comparison, with their
count visible. A trade may still appear in multiple descriptive per-band tables;
those overlapping tables are not an exclusive matching/nonmatching comparison.
Whole-trade outcome rates always use distinct trades, not occurrence count.

### Comparable indicator observation spans

Keep the returned-bar calculations, but partition slope/RSI-direction comparisons
by their actual t-3 to t elapsed span: **Standard spacing** (exactly three selected
timeframe intervals), **Sparse spacing** (longer within the same session), and
**Across sessions**. These categories describe timestamps, not an asserted cause.
Do not combine the categories into one direction-based performance highlight.
Show their sample counts and elapsed spans; users may inspect each separately.
Raw state-only comparisons (such as EMA9 above EMA20) can retain all valid
observations with coverage and last-bar age visible. Context freshness is a
separate dimension, not the same thing as the slope window's span.

Warm-up spanning earlier sessions remains valid under its policy. A direction
window spanning a known halt, session boundary or failed request is retained as
historical values but excluded from current intraday-direction feedback. Across
sessions is therefore inspectable context, not an intraday momentum cohort.

Aggregate feedback names the metric: "Higher average Net P/L when...", never
"best entry" solely from win rate. Exact small-sample rows remain visible.
Proposed narrative threshold preserves 30 distinct trades overall and at least
10 per compared side; verify the integrated rule before reusing it. This is a
display threshold, not statistical significance. Ties, negative averages on
both sides, zero-loss profit factors and missing fees need explicit handling.

Global date filter uses the canonical trade's closing date/account timezone.
Currency partitions, Gross/Net, direction, scope and current analysis revision
apply BEFORE aggregation/pagination. Never substitute Gross for missing Net.
Counts, highlights and drilldowns must reconcile to the same complete filtered
population, not just a downloaded page. Changing filters resets invalid pages.

For Green-to-Red/Scaling comparisons, classify context at the defined landmark
(first qualifying price evidence, recorded exit, first red or recovery), using
only completed indicator bars available then. Show later outcome separately.
Do not label a condition at final exit as a predictor available at initial entry.
Keep existing financial eligibility and quantity accounting untouched.

### During-trade studies and equivalent comparison points

Add a separate **During the trade** context to Trend & Momentum. Initial v1
studies: recorded EMA9 loss while the close remains above EMA20, subsequent
EMA9 reclaim, recorded EMA20 loss/reclaim, VWAP side changes, and RSI direction
at those observations. All are price/indicator descriptions, not setup verdicts.
For each reference and position cycle, a loss starts one episode when the prior
known close-side was above and the new side is below. Further below closes do
not start additional episodes. The first subsequent above-side close ends that
episode as a reclaim; neutral closes do not end it. A later loss can start a new
episode. Flat, a session boundary, known halt or failed-request gap ends an open
episode without claiming recovery. All event predicates refer to the same
observation; never combine EMA9 state from one bar with EMA20 state from another.
Short-trade studies additionally use the mirrored above-side break and later
below-side return with explicit labels; do not describe raw upward reclaim as
favourable to a short. No event while flat counts as held exposure.

Headline during-trade comparisons select the FIRST qualifying event of the
chosen event type in the entire saved trade, before applying indicator condition
filters. Never choose a later favourable occurrence to make the trade match.
Evaluate all combined conditions on that one event; unknown context remains
unknown rather than selecting a later event. Its associated episode supplies
loss-to-reclaim timing. A later cycle's first event does not create another
headline trade. The expandable occurrence table includes all episodes with
separate occurrence/cycle counts and one unique trade count. Reclaim-selected
studies are explicitly limited to observed reclaims; loss-selected studies also
retain unresolved episodes, so their recovery denominator is not biased to 100%.

**First-event coverage:** "First" means first qualifying recorded-bar event,
not the first possible intrabar price crossing. Confirm that request coverage,
required indicator warm-up and event state are available for every relevant
held-position interval from the saved trade's initial entry through the event,
including earlier position cycles. Sparse timestamps within valid requests do
not fail this check. Missing earlier request coverage or indicator availability
means the event is only **First observed - earlier context incomplete**.
Keep its exact evidence and follow-through available in a separately labeled
incomplete-history group; do not mix it into confirmed-first comparisons or
select another later event as a replacement. Even complete later-cycle coverage
does not prove first-in-trade when an earlier cycle lacks evidence. A loss with
no valid preceding side cannot itself be detected; missing-history labeling
does not authorize inventing that event.

Recovery outcome coverage and first-event coverage are independent: a valid
observed loss/reclaim episode may have a known outcome even when earlier trade
history is incomplete. Show it in that separate group. No observed event with
incomplete prior coverage is **Event presence unknown**, not **No event**.

Recovery outcome for these indicator episodes has three explicit states:

- **Observed reclaim:** a qualifying returned close reclaims the reference in
  the same uninterrupted episode while the position remains open.
- **No recorded reclaim before position closure:** the request coverage remains
  valid through the cycle's closing execution and no qualifying reclaim close
  was observed. This describes recorded closes, not proof that price never
  crossed the reference between bars.
- **Recovery unknown:** a failed/truncated data range, known halt, session
  boundary or unavailable episode ending interrupts observation before either
  outcome above is established. Later observations cannot repair the interrupted
  episode by assuming what happened in between.

Show all three counts. Recorded-reclaim rate is observed reclaims divided by
observed reclaims plus no-recorded-reclaim-before-closure episodes; unknowns are
excluded from that rate and shown separately against the full loss-event count.
With no known outcomes, show N/A rather than 0%. Headline rates use the selected
first loss episode per saved trade; occurrence-level rates are labeled separately.
Sparse timestamps in otherwise valid completed requests do not alone create an
unknown outcome. These rules extend indicator studies only; existing
Green-to-Red financial recovery calculations remain unchanged.

For these NEW indicator-event follow-through studies, baseline P0 is the close
of the bar confirming the event; time T0 is that bar's close time. P0 is a market
observation, not an assumed execution. Horizons are 5/15/30/60 CLOCK minutes.
Use the valid completed one-minute bar whose close time equals T0+horizon, not
the Nth returned bar, an unfinished bar or a later substitute. Missing endpoint
means unavailable for that horizon only. Price change is endpoint minus P0 per
share and 100*(endpoint-P0)/P0; show rise/drop explicitly and keep whole-trade
P/L separate. Never multiply this movement by assumed shares or reinvestment.

The held-position horizon requires that the cycle remain open through the
endpoint. If it closed earlier, show **Position closed before 15 minutes** (or
the chosen horizon) and exclude it only from that horizon's mean, not the
event/trade count. Show eligible, closed-before-horizon and missing-endpoint
counts next to each mean. A later re-entry in the same saved trade does not fill
the prior cycle's missing held-position horizon. Exact closure at the endpoint
is timing-ambiguous for held exposure and uses the closed-at-horizon category.
Report those samples explicitly; horizon means describe positions still open,
not every trade that had the event.

For each selected event and horizon, assign exactly ONE status in this order:

1. **Timing unavailable** if event time or the canonical position timeline cannot
   establish the event's held exposure and endpoint relationship.
2. **Position closed before horizon** if the cycle closed before T0+horizon.
3. **Position closed at horizon** if it closed at exactly T0+horizon.
4. **Endpoint unavailable** if the position remained open past the horizon but
   the required completed endpoint bar/price is missing or invalid.
5. **Measured** when timing, held exposure and endpoint price all qualify.

Earlier closure takes precedence over missing later candles. At each horizon,
the five status counts must sum to the selected event count; only Measured
observations enter that horizon's average. Preserve unique-trade headline
selection versus occurrence-table counts, and partition by first-event coverage
where applicable. Secondary diagnostics may list multiple issues but must not
add extra members to the exclusive status counts. These rules do not remove an
event from the trade's overall count or change its canonical P/L.

A separate **Until position closure** observation uses the actual closing fill
price and time versus P0, including shorter cycles; partial exits do not end the
window. This is price movement, not a claim about profit on the earlier position.
Only events confirmed while the cycle is open qualify. Equal-timestamp event
and closure records require proven ordering or remain timing-unavailable.
Existing entry/exit path and post-final-exit calculations are unchanged.

Cross-page comparisons use shared landmarks: for Scaling Out, compare indicator
context at the same first reached zone threshold among qualifying trades, then
describe later recorded profit-taking/no-profit-taking behaviour in that zone.
Do not compare a seller's sale-time RSI against a nonseller's entry-time RSI.
Sale-time indicator tables are descriptive execution studies only. For
Green-to-Red, use first +20% evidence for later-red versus no-later-red comparisons;
first-red context applies only to the turned-red population when comparing later
recovery. Preserve existing denominators and occurrence timing. A candle-extreme
landmark has only minute-range timing: pre-landmark indicator context must use
the bar completed before that minute, not its eventual close. Exact executions
use their own timestamp. Keep landmark qualification and indicator coverage separate.

### Calibration and consistent-version gate

The numeric thresholds remain candidate definitions, not accepted defaults.
Before implementation acceptance, compare nearby threshold/lookback choices on
a fixed diverse evidence set, inspect classification stability and record the
chosen version. Do not choose settings by maximizing the user's historical P/L.
Resolve freshness limits and warm-up requirements in the same checkpoint.

Chart, written context and grouped comparisons must select the same new
indicator series/version for a trade/timeframe. Preserve legacy stored results;
label legacy-only context rather than silently combining old first-close-seeded
EMA distance with new SMA-seeded EMA behaviour. If parallel values would confuse
the UI, keep new context unavailable until its consistent derived series is ready.
The remaining existing analysis stays readable. This is not an authorization
to rewrite legacy P/L or recalculate all historical trades on page load.

## 8. Persistence, resource use and independence

- Reuse saved market data first. Viewing, filtering and navigating must not
  request Moomoo, Yahoo or OpenAI. This feature has zero OpenAI cost.
- No new provider polling loop, shared connection change or Watchlist import.
- Propose a new immutable derived contract `trade_indicator_context_v1`, keyed
  by scoped canonical trade revision, candle-set revision, timeframe, session/
  adjustment policy and calculation version. Do not rewrite old snapshots.
- Start with a bounded derived read-model feasibility check. If full-history
  page requests would repeatedly recalculate candles, use bounded background
  materialization rather than expensive rendering. Persistence requiring schema
  work needs a separately registered migration; none is allocated by this plan.
- Corrections, regrouping and new candle revisions invalidate only affected
  derived results. Sufficient saved-candle recomputation uses zero Analyzer
  provider allowance; verify the existing charging boundary before integration.
- Missing history is reported per indicator. As part of an authorized Analyze
  request, automatically acquire missing earlier history through the existing
  background market-data workflow; no separate manual history request is needed.
  This is standard app behaviour, not test-only tooling. Page reads remain
  provider-free. Historical rollout is resumable.
- Account/workspace authorization applies to comparisons, evidence drawers,
  exports if exposed, cached results and offline projections. No cross-account
  derived cache reuse containing private trades.
- Audit: source revision, bar count/range, session anchor, initialization,
  calculation version, unavailable reason, derivation time and cache reuse.
  Do not log account secrets or private trade payloads into shared documents.

### Automatic history and understandable outcomes - owner approved

For each analysis request: reuse compatible saved history, determine missing
warm-up for each requested timeframe/indicator, then request earlier Moomoo
history in supported bounded ranges until the validated requirement is met or
the provider's available history/request budget is exhausted. Process pages
completely, deduplicate shared symbol/session acquisitions and checkpoint progress
between worker passes. Missing sparse minutes alone never trigger repeated fetches.
Provider errors use bounded backoff; a valid but sparse response is not an error.
Freeze request/range/retry limits at the data implementation checkpoint; no
unbounded loops or additional per-page polling. Do not extend entitlement or
silently charge several user analysis units because history requires several
requests. Preserve actual internal provider-acquisition accounting separately.

Owner explicitly permits Moomoo requests for their test and Demo trades to
complete this work's validation. This does not remove the normal production Demo
user restriction or permit requests against other users' private trade histories.
Use scoped validation tooling for those fixtures, not a general Demo entitlement
bypass. Existing recorded executions and trade grouping remain unchanged.

Analysis outcomes are independent of individual indicator coverage:

- Enough core trade evidence plus incomplete indicator history: keep the usable
  analysis and show the unavailable indicator, e.g. **EMA20 unavailable: not
  enough earlier candle data.** Do not reject the whole card.
- Too little usable evidence for core analysis after the completed acquisition:
  show **Not enough candle data to analyze this trade. This can happen when a
  stock trades very little.** The saved trade stays in the Journal; no invented
  result is added to Analyzer comparisons.
- Use **Not enough trading activity to analyze this trade. Too few candles were
  available because trading volume was very low.** only when returned evidence
  supports that cause. Moomoo timestamp absence alone does not prove it. Until
  a validated low-activity criterion exists, use the neutral candle-data wording.
- Connection/request failure: **We couldn't retrieve the candle data. Please
  try again later.** Never attribute a provider error to low volume.

Persist the reason on the analysis card and issue one deduplicated in-app
notification when a background attempt ends without usable core analysis. Link
to the exact user-defined trade. Partial indicator coverage is explained in the
card; it does not create one notification per indicator. A retry must not emit
repeated terminal notices until a new user-requested attempt or meaningful
outcome change. Reuse existing notification preferences and privacy boundaries;
no new forced email/push delivery. Pending history remains a progress state,
not a prematurely failed analysis. UI copy and tooltip integration require the
normal new-slice visual review before implementation acceptance.

## 9. UI and Help acceptance

### Required card and table tooltips - owner direction 2026-09-12

Tooltips are required, not optional, on new or changed Analyzer analysis-page
cards and every table column label. Preserve existing tooltip coverage and its
tone, flow and quality across all affected pages. A full Help article does not
replace the short explanation beside the displayed result.

- Each card tooltip explains what the card displays and which trades/events
  it includes. Each column-heading tooltip explains that column's value, units
  and, for percentages, what the percentage is out of. Explain time windows or
  unavailable values when needed to interpret that particular result.
- Write for an ordinary trader, not a developer. Use short, direct sentences
  with familiar trading terms. Explain unfamiliar indicator terms in plain
  language rather than assuming everyone knows them.
- Never expose system language such as cohort, materialization, canonical ID,
  projection, revision key, predicate, deadband or denominator. Prefer "trades
  in this group", "recorded candles", "little change" and "out of these trades".
  Internal audit fields may retain technical names; user-facing tooltip text may not.
- Match the existing Analyzer tooltip component and interaction: persistent
  click/tap explanations, keyboard access and suitable mobile touch targets.
  Opening help must not sort a table, expand a section or navigate through a
  linked count. Keep current uniform card sizes and contained table scrolling.
- Match the selected timeframe, Gross/Net basis, trade/event view and units.
  Do not describe a trade percentage as an execution percentage or a per-share
  price move as actual whole-trade profit. Never describe missing data as zero.
- Maintain a tooltip inventory for each affected page: card/column label,
  exact proposed text, applicable view and current definition it explains.
  Review it alongside the UI before acceptance; preserve existing explanations
  unless the changed behaviour requires a corresponding wording update.

Illustrative tone (final copy must match the implemented view):

- **EMA9 & EMA20:** "Compares your trade results based on whether EMA9 was above,
  below or close to EMA20 at your selected entry or exit."
- **Recorded reclaim rate:** "Of the trades with enough information to check,
  the percentage with a recorded candle closing back above the selected line
  before that position closed. Trades with incomplete information are shown
  separately." Use mirrored wording for the corresponding short-trade study.
- **Price change after 15 minutes:** "The price change per share from the
  recorded event to 15 minutes later, for positions still open then. This is
  price movement, not the profit you made."

Examples specify the writing style, not permission to reuse entry/exit wording
in a during-trade view where it would be inaccurate.

Proposed visible page title: **Trend & Momentum**. Proposed section titles:
**EMA9 & EMA20**, **RSI**, **Session VWAP**, **Combined conditions**,
**Supporting trades**. No generic subtitle under the page title.

Preserve uniform card sizes, persistent touch/click help, count-only navigation,
existing date controls, Light/Dark appearance and desktop/mobile evidence
drawers. Avoid making help clicks expand another control. Table overflow stays
inside its own region. Chart legend and evidence labels identify timeframe and
VWAP session. The chart remains optional to understand the written results.

Update `src/modules/help/trade-analyzer-guides.ts` and current Help routing/search
integration: indicator definitions, exact comparisons/counts, timing, warm-up,
coverage, drilldown, neutral/unknown values and no-AI operation. Preserve stable
anchors and the newer tooltip contract instead of reviving obsolete help rules.
Review the current live layout before coding, without starting a local server.
Owner UI approval is still required for this new slice; another chat's earlier
waiver does not automatically apply here.

## 10. Delivery checkpoints and candidate ownership

1. **Plan review:** source inventory, detailed proposal and document QA; owner
   approves scope/visible organisation. No application code in this checkpoint.
2. **Evidence feasibility:** verify integrated source parent, saved history,
   session semantics, grouping and bounded derivation. Freeze formulas and exact
   file allowlist. Report missing evidence instead of guessing.
3. **Calculation slice:** versioned indicator/event logic, independent reference
   comparisons and scoped saved-data integration. No new unrelated engine.
4. **Aggregate slice:** all listed page integrations, counts/filter/drilldown
   contracts and chronological comparisons.
5. **Presentation slice:** approved individual/aggregate/chart UI plus Help and
   offline alignment; preserve all existing interactions.
6. **Acceptance:** focused sequential checks and authorized hosted visual proof,
   exact allowlisted local commit(s), then owner-authorized coordinator release.

Candidate implementation areas (not authority to change whole directories):
indicator-context calculation/new isolated module; daily Analyzer and newer V2
scenario/read-model service; current written-analysis/data types; Analytics
shared page/client/evidence components; new Trend & Momentum route; chart
component; dashboard navigation; Help; offline Analyzer projection; focused
fixtures/tests and these documents. Resolve exact filenames against the newer
integrated parent before editing. Do not edit the older sibling lane.

No broad tests, Vitest, builds, servers, API experiments, migrations, commits,
pushes or deployments during this planning checkpoint. Implementation uses
low-resource batches and focused checks at coherent checkpoints. Release stays
serialized through the current release coordinator, after explicit authority.

## 11. Verification matrix

- Independent EMA/RSI/VWAP reference values; initialization convergence and
  reproducibility across versions, split-adjusted data and penny prices.
- Exact boundaries: RSI30/50/70, deadbands, equality/crossing, no early signal,
  flat/no-gain/no-loss series and insufficient history.
- Seconds within execution minute; execution at bar boundary; 5-minute alignment;
  gaps, halts, session changes, DST, missing turnover and partial VWAP history.
- Sparse pre-run history: successful paginated ranges with absent minute bars,
  low-volume/returned zero-volume bars, fully empty ranges, failed/truncated
  ranges, sparse 5-minute aggregation and provider-chart/reference comparison.
  Verify returned-bar counts versus elapsed time, context age and duration rules.
- Strong sustained runners with high RSI, choppy EMA crosses, sharp reversals,
  deep pullbacks, quiet trades and longs/shorts. No one-ticker success claim.
- Grouped trades, several same-ticker trades, re-entry after flat, multiple adds,
  partial exits and last remaining-share closure. No duplicated P/L or counts.
- One saved trade spanning three round trips remains one trade everywhere;
  missing combined evidence does not fall back to three trade rows. Repeated
  loss/reclaim episodes pair within cycles, select the first headline event
  before filters and retain unresolved episodes. Verify interim versus final
  closure and regrouping cache invalidation.
- Standard versus sparse observation spans, no mixed direction highlights,
  exact follow-through baseline/endpoint, missing horizon, early closure,
  closure at horizon and re-entry without joining flat intervals as exposure.
- Indicator recovery: observed reclaim, valid coverage through closure with no
  recorded reclaim, interrupted/unknown recovery and all-unknown N/A. Unknown
  outcomes never inflate non-recovery counts. Confirm **Interim position closure**
  excludes the final exit while **Until position closure** remains a movement
  endpoint for either kind of cycle closure.
- First-event coverage: missing earlier cycle/history or warm-up cannot produce
  a confirmed-first label; valid sparse history can. Known episode recovery may
  coexist with incomplete earlier history. No event with incomplete coverage is
  unknown presence, not confirmed absence.
- Follow-through exclusion precedence: early closure plus missing endpoint
  counts only as early closure; test equal-horizon closure, timing unavailable,
  endpoint-only failure and measured cases. Exclusive statuses reconcile to the
  selected population independently at every horizon and coverage partition.
- Entry knowledge versus later context; no hindsight entering pre-entry cohorts.
- All filter combinations, empty/small/large results, ties, unknown coverage,
  currency and Gross/Net; pagination totals equal complete cohort totals.
- Every aggregate reconciles to exact drilldown IDs/rows and Journal outcomes;
  existing Profit Zones, Green-to-Red and MFE/MAE calculations remain unchanged.
- Corrected/regrouped/deleted trades and candle revisions cannot return stale
  derived findings; account and offline isolation remain intact.
- Page/filter reads make zero provider/AI calls and no allowance deductions;
  bounded load/memory and incremental recomputation at agreed scale.
- Automatic warm-up on normal Analyze requests, saved-data reuse, sparse-success
  termination, exhausted history, bounded retries and internal versus user usage
  accounting. Verify partial card versus core-unavailable outcomes, provider-error
  wording, exact-trade notification links, deduplication and Demo-test isolation.
- Desktop/mobile Light/Dark, keyboard/touch Help, chart synchronization, URL
  restoration, shared navigation and actual offline behaviour.
- Tooltip inventory covers every new/changed card and every table column label
  on affected Analyzer pages. Check accuracy for each active view, plain-trader
  wording, unchanged existing coverage, readable desktop/mobile presentation,
  keyboard access and no accidental sorting, expansion or navigation.

These are future checks, not test results. The first document QA pass is recorded
in the progress file; saved-data feasibility and runtime verification remain open.

## 12. Research and interpretation boundaries

Checked 2026-09-12:

- [Fidelity EMA guide](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/ema): EMA weights recent prices more heavily and measures trend direction. It does not establish one universally correct entry or stop.
- [Fidelity RSI guide](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI): RSI measures momentum; conventional 70/30 bands can persist during strong trends. Their presence alone is not a reversal finding.
- [IBKR VWAP definition](https://www.interactivebrokers.com/campus/glossary-terms/volume-weighted-average-price-vwap/): daily traded dollar volume divided by share volume; the implementation must disclose its session and approximation when only bars are available.

The proposed 3-bar direction windows, deadbands, combined filters and sample
thresholds are product/engineering decisions, not externally certified microcap
trading rules. Validate them before acceptance. This plan does not claim that
these indicators alone provide a complete market-structure analysis.
