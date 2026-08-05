# Daily Trade Tracker Yahoo Analyzer Plan

**Status:** Owner-approved for implementation. Begin with the underlying
schema/cache contract and real Daily Trade Tracker save path before building
the temporary analysis-details presentation.
**Owner:** TraderLink product owner and Codex
**Prepared:** 2026-08-04
**Progress:** [Daily Trade Tracker Yahoo Analyzer Progress](daily-trade-tracker-yahoo-analyzer-progress.md)
**Replaces for active runtime direction:** the Round Trips, manual-trigger, and first-entry/final-exit-only portions of [Trade Candle Analyzer Experiment Plan](../trade-candle-analyzer-experiment-plan.md). Its approved small-cap candle vocabulary remains the source of truth for this plan.

## 1. Product outcome

The paid Daily Trade Tracker analyzer automatically collects chart context for
each eligible completed day trade while Yahoo one-minute data remains
available. It gives the trader durable, comparable facts about their own
entries, adds, partial exits, and final exits.

The immediate product surface is the Daily Trade Tracker only. Market Charts
remain a separate dashboard tool. Round Trips does not display an analyzer
link or analyzer status.

Over time, the retained per-event facts enable the trader to look back across
their own trades and compare the chart context of stronger and weaker entries,
adds, reductions, and exits.

## 2. Approved product decisions

| Decision | Approved direction |
| --- | --- |
| Provider | Yahoo is the market-data provider for this feature. |
| Access | This is a paid Journal feature. Local loopback review remains usable until public identity and paid entitlement activation are deliberately connected. |
| Eligible trade | A completed stock day trade whose opening execution and final closing execution have the same `America/New_York` trading date. |
| Start rule | The analyzer starts automatically after the final exit is recorded. It never makes manual execution save wait for Yahoo. |
| Yahoo window | A new one-minute Yahoo request is permitted only while the final exit is less than seven rolling 24-hour periods old. This is an elapsed-time window, not seven market sessions. |
| Session scope | Use the trade date's extended-hours session: 4:00 AM through 8:00 PM Eastern, including premarket, regular hours, and post-market. |
| Post-exit horizons | Retain observed paths at 5, 15, 30, and 60 minutes after the final exit whenever those windows exist. |
| Event coverage | Analyze every opening entry, add, partial exit/reduction, and final exit. |
| Cache | Reuse one normalized market-session candle set for the same Yahoo ticker, exchange identity where known, trading date, one-minute interval, and extended-hours policy. It is shared market data, not user data. |
| User interface | Attach one chart directly above each ticker card. It begins on that ticker's Trade 1 and changes in place when the trader selects Trade 2, Trade 3, and so on. The analyzer area beneath a completed trade card has a light blue tint. |

## 3. Eligibility and trade-event rules

### 3.1 Day-trade eligibility

The server derives eligibility from the canonical Journal execution ledger and
the selected Journal account. An eligible item must:

1. be a ready, closed stock round trip;
2. open and return to flat on the same New York trading date;
3. have at least one exact opening execution and one exact closing execution;
4. have a Yahoo-supported symbol identity; and
5. be within the rolling seven-day Yahoo one-minute request window when the
   needed market-session set is absent.

An eligible trade is not made ineligible merely because another trade, ticker,
or import decision needs attention. A Day Tracker trade remains a Journal fact;
analyzer availability never changes its P/L, tags, notes, rules, calendar
activity, or Data Decisions state.

### 3.2 Event classification

The analyzer derives one ordered event for each accepted execution in the
round-trip version:

- **Entry:** position moves from flat to non-zero.
- **Add:** an execution increases exposure in the existing direction.
- **Partial exit:** an execution reduces exposure without returning it to flat.
- **Final exit:** an execution returns the position to flat.

The exact execution timestamp, price, side, and quantity remain Journal facts.
The analyzer maps each exact timestamp to the one-minute candle containing that
instant; it does not round or change the execution itself. This is required for
manual entries that include seconds while Yahoo bars are minute-aligned.

### 3.3 Time and session boundaries

- The account's Daily Trade Tracker date and all session boundaries use
  `America/New_York`.
- A session starts at 4:00 AM Eastern and ends at 8:00 PM Eastern on the trade
  date, including daylight-saving transitions.
- The initial collection covers session start through the current available
  minute. It never asks Yahoo for future candles.
- The cached session is extended/rechecked when the 5-, 15-, 30-, and 60-minute
  post-final-exit horizons become available, or to the 8:00 PM session end.
- If a horizon reaches past the session end or Yahoo has no usable coverage,
  only that unavailable metric is `N/A`; earlier verified event data remains
  available.

## 4. Market-session cache and automatic work

### 4.1 One shared session set

The implementation adds a new immutable, system-level market-session cache;
it does not repurpose the accepted account-scoped Candle Review records. The
cache key is:

```text
provider + provider symbol identity + exchange identity when known
+ New York trading date + 1 minute + extended-hours session policy
```

Only normalized OHLCV candles and provider retrieval/coverage evidence are
stored. Raw Yahoo payloads, Journal execution facts, account identifiers,
notes, tags, rules, and P/L never enter the shared cache.

Every eligible user trade for that ticker/session reuses the same set. Each
user's private Journal analysis stores only its own stable trade version,
execution-event snapshots, and a reference to that shared session set.

### 4.2 Cache lifecycle

1. The final exit creates an idempotent analyzer work item after the Journal
   save succeeds.
2. A worker obtains or extends the shared session set without holding a Journal
   write transaction during the Yahoo request.
3. A unique cache key and short lease prevent simultaneous jobs from fetching
   the same ticker/session repeatedly.
4. The first result creates event snapshots from the currently available
   candles.
5. Scheduled follow-up work records the 5-, 15-, 30-, and 60-minute paths.
   Repeated work is idempotent and only extends coverage or writes a newer
   immutable analysis version.
6. The completed normalized set is retained for the chart and the trader's
   historical analyzer data. A later trade never re-requests a complete set
   merely because it belongs to another user.

The initial implementation must use persisted, retry-safe work records. A
browser visit, a page refresh, or a long-running Next.js request is not the
worker. This keeps manual execution saving fast and makes automatic analysis
reliable after the trader leaves the page.

### 4.3 Failure and coverage behavior

Provider/coverage state belongs to the requested event or horizon, not to the
whole account or dashboard. A Yahoo connection problem is retryable. A missing
or unusable candle interval produces `N/A` for the affected displayed value.
No result is fabricated from a gap, and no unrelated completed trade is hidden.

## 5. Saved analysis facts

### 5.1 Per-event snapshot

For every Entry, Add, Partial exit, and Final exit, save these facts whenever
the necessary candles exist:

| Group | Facts |
| --- | --- |
| Execution | event type, exact execution time, side, price, quantity, and resulting position quantity |
| One-minute candle | open, high, low, close, range, body/wick structure, volume, and relative volume |
| Indicator context | session VWAP, EMA 9, EMA 20, RSI 14, MACD, MACD signal/histogram, ATR 14, and ADR 20 when the required lookback exists |
| Candle structure | the approved small-cap pattern observations near the event, their observed time, and their measured proximity/relevance |
| Forward path | observed favorable and adverse movement, plus price at 5, 15, 30, and 60 minutes after the event where the relevant horizon is complete |

All displayed dollar values use at most two decimal places. Counts and event
numbers remain whole numbers. Stored decimal values remain lossless.

### 5.2 Trade-level facts

Each completed trade also retains:

- opening and final exit timestamps/prices;
- holding duration;
- highest and lowest observed price while held;
- maximum favorable and adverse observed movement while held;
- retained movement from the observed held-position extreme to the final exit;
- final-exit continuation at 5, 15, 30, and 60 minutes; and
- references to the exact shared candle-session version and immutable analysis
  version used to produce the result.

### 5.3 Indicator integrity

The existing analyzer calculates EMA 9/20, RSI 14, session VWAP, MACD, ATR 14,
and ADR 20. This slice corrects the current limited-window approach by
calculating intraday indicators from the session-start candle sequence rather
than only a short window around the first entry. ADR 20 continues to use the
required daily lookback. A metric with insufficient prior candles is `N/A`, not
zero or an inferred value.

## 6. Approved small-cap candle vocabulary

Only these five families are shown in the initial analyzer:

1. **Expansion / continuation** — wide directional body relative to recent
   active candles, closing near its extreme.
2. **Engulfing shift** — bullish or bearish engulfing real body near an event.
3. **Rejection wick** — hammer, shooting-star, topping-tail, bottoming-tail,
   or comparable asymmetric rejection structure.
4. **Compression / break** — inside-bar/tight-range compression and the
   observed bullish or bearish break from it.
5. **High-volume exhaustion** — extended move, unusually high relative volume,
   and observed stalling/rejection/reversal evidence together.

The detector records concrete observed structures. The first release does not
expand this list with generic candle names simply because a broader pattern
catalogue exists.

## 7. Daily Trade Tracker presentation

### 7.1 Ticker chart

For a ticker with at least one eligible completed Day Tracker trade:

- Render one lightweight candlestick chart directly attached above its ticker
  card, with no separate panel title or gap between the chart and card.
- The chart itself shows `TICKER · Trade 1` initially.
- The card labels each trade clearly as **Trade 1**, **Trade 2**, and so on.
  Selecting another trade changes the attached chart to that trade; it does not
  render duplicate charts.
- Mark all executions belonging to the selected trade with clear entry, add,
  partial-exit, and final-exit markers.
- The chart uses the stored one-minute extended-hours session set. It never
  waits for or loads the separate Market Charts page.

### 7.2 Per-trade analyzer area

Directly below each eligible completed trade card, show a light-blue-tinted
analyzer area. It is concise by default and expands for the event-level data.

The default view contains the entry and final-exit summaries, the most relevant
nearby candle structures, and 5/15/30/60-minute price-path values as they
become available. Expanding an event shows its candle values, indicator
snapshot, and full observed path. The area uses plain trading language and
never displays provider internals, cache identifiers, engine codes, or
unnecessary explanatory boilerplate.

Swing trades, active positions, and bag holds do not receive this Daily Trade
Tracker analyzer surface in this slice.

## 8. Long-term trader data

This implementation first captures correct, versioned event facts. It does not
prematurely decide the final analytics screens. A later owner-reviewed personal
analyzer-history slice can let traders compare their own data by:

- entry/exit event type;
- candle family and relative-volume context;
- price location relative to VWAP and EMA 9/20;
- RSI, MACD, ATR, and ADR ranges;
- time of day and hold duration;
- adds/reductions versus final exits; and
- observed 5/15/30/60-minute movement after each event.

The later comparison screens must use the saved immutable snapshots rather
than re-running Yahoo requests against old trades.

## 9. Delivery order

1. **Planning acceptance:** review this plan and resolve any product changes
   before implementation.
2. **Schema and cache contract:** design the system-level session cache,
   account-scoped analysis versions/events, idempotent work records, ownership
   rules, retention, and migration checks. No existing Candle Review table is
   altered in place.
3. **Yahoo session service:** add validated extended-hours session retrieval,
   normalization, shared cache reuse, execution-to-minute alignment, and
   follow-up scheduling.
4. **Per-event analyzer:** compute the snapshots, selected candle families,
   post-event paths, and trade-level facts from the saved session set.
5. **Daily Tracker connection:** automatically enqueue eligible closed day
   trades after manual execution save; remove Round Trips analyzer entry points;
   leave Market Charts separate.
6. **Tracker UI:** attach the ticker chart, Trade 1/2 selection, markers, and
   light-blue analyzer area. Obtain owner visual review before accepting the
   visible slice.
7. **Paid-access connection:** before public Journal launch, gate the server
   work/action and reads through the paid Journal entitlement. Local loopback
   review remains deliberately available until then.
8. **Focused proof:** run the smallest data/cache/analyzer checks for the
   completed slice, then the required integrated verification at its explicit
   acceptance boundary.

## 10. Acceptance criteria

- A same-day completed Day Tracker stock trade automatically produces one
  private per-trade analysis without delaying manual execution save.
- The same ticker/session is fetched once and reused across repeated trades and
  accounts.
- Premarket, regular-hours, and post-market executions use their actual
  extended-hours session candles.
- Every entry/add/partial-exit/final-exit event has a correctly aligned snapshot
  or precise `N/A` for only the unavailable value.
- Five, 15, 30, and 60-minute post-final-exit values are independently
  retained when their windows complete.
- The selected five small-cap candle families are detected only from complete,
  active candle evidence.
- The attached ticker chart changes between clearly labeled Trade 1, Trade 2,
  and later trades without duplicating charts.
- Round Trips contains no analyzer link or analyzer status.
- Market Charts remains independent.
- The Daily Trade Tracker shows the approved chart/analyzer layout with no
  provider, system, or engine language in ordinary trader-facing copy.
- Rebuilds, replays, a stale client, concurrent jobs, or a Yahoo retry cannot
  duplicate an execution analysis, mutate Journal facts, or double-request a
  completed shared session.

## 11. Explicitly out of scope

- Swing Trade Tracker analysis, active-position analysis, and bag-hold
  analysis.
- Automatic chart analysis of statement imports or historical Round Trips.
- Market Charts redesign or connection to this feature.
- Recommendations, trade signals, alerts, order entry, or inferred execution
  facts.
- A final personal analyzer-history/analytics page before enough saved paid-user
  analyzer data exists.
- Changing the trader's saved tags, notes, rules, P/L, executions, or Data
  Decisions from candle data.
