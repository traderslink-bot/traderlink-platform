# Moomoo Daily Trade Tracker Analyzer Plan

**Parent:** [Moomoo Direct Connection Plan](moomoo-direct-connection-plan.md)
**Progress:** [Moomoo Daily Trade Tracker Analyzer Progress](moomoo-daily-trade-tracker-analyzer-progress.md)
**Status:** Complete and owner-approved locally on 2026-08-09, including manual-execution correction refresh. Automatic Moomoo execution importing remains a separate later slice.

## Purpose

Restore the Daily Trade Tracker chart, replay and analysis with
Moomoo-authenticated one-minute U.S. candles. This supports manual Daily Trade
Tracker entries first; automatic Moomoo execution imports are a separate later
slice.

## Confirmed provider behavior

- `quote:read` on an unfunded Moomoo OAuth account returns same-day U.S.
  one-minute premarket and regular-session candles.
- A request from the trading date to the next date returns formed candles from
  04:01 AM through the current minute, including beyond 370 bars. Empty rows
  for later, unformed minutes are placeholders, not a failed request.
- 150 fresh Nasdaq symbols succeeded without a quota block; Moomoo did not
  disclose an upper numeric limit.

## Product decisions

1. Moomoo replaces Yahoo as the active Daily Trade Tracker candle source. No
   Yahoo fallback or invented candle data is allowed.
2. An active Moomoo connection with `quote:read` is required for a new candle
   fetch. Disconnecting prevents future fetches but does not erase a trader's
   saved Journal facts or past analysis.
3. The Daily Tracker page, its imported/manual entries and notes are available
   immediately. Only the final post-exit analysis waits.
4. If final exit plus 60 minutes already exists, make one same-day request and
   publish a complete analysis.
5. If it is still in the future, make one initial same-day request, publish
   every real candle and a `pending` live analysis, then make exactly one
   normal follow-up request at final exit plus 60 minutes (or session end).
   The durable worker may check due jobs, but it must not poll Moomoo between
   the two requests.
6. Partial analysis shows chart/replay, event markers, indicators and completed
   5/15/30-minute exit observations. It states actual completed minutes out of
   60 and becomes complete only when the 60-minute path exists.
7. Missing execution-minute candles, authorization, expired current-day data
   or a provider failure remain explicit unavailable states; they never alter
   executions or imply complete coverage.
8. Moomoo candles are a shared, server-side market-data cache. Before any
   Moomoo request, the system checks whether the exact provider/ticker/trading
   date/one-minute/extended-session coverage is already saved and reuses it
   for any TraderLink user who needs that same public market-data window.
   It calls Moomoo only for missing coverage. This cache is never stored in a
   user's browser or on the owner's computer in production.
9. Persist Moomoo's exact per-candle traded amount (`turnover`) and calculate
   VWAP from cumulative turnover divided by cumulative volume. The analyzer
   must not silently substitute a typical-price approximation when exact
   turnover is unavailable; VWAP is then explicitly unavailable.
10. After the immediate and exit-plus-60-minute lifecycle, make exactly one
    off-page post-session reconciliation against Moomoo's finalized History
    K-Line data. Reuse the shared cache so the same ticker/date is fetched only
    once, save a new immutable market-session version, and refresh affected
    analysis without changing Journal executions or notes. A failed
    reconciliation retains the prior factual analysis.
11. The future Help page must explain that same-day analysis is available
    immediately but Moomoo may finalize candle data after the session, causing
    one later chart and analysis update.
12. Do not expose the raw one-minute `change_rate` or `turnover_rate` fields in
    this slice. One-minute `change_rate` is only the return from the preceding
    candle and is already derivable from prices; observed U.S. microcap
    `turnover_rate` values were zero. A later market-context slice may add
    clearly labelled price-versus-prior-close and session turnover-rate facts
    from Market Snapshot, preserving the denominator, source and timestamp.
13. Saving a correction to a manual execution invalidates analysis tied to the
    earlier round-trip version. Complete the Journal correction and
    chronological rebuild first, then queue every newly rebuilt eligible
    closed trade. Never analyze partially committed Journal state or continue
    presenting the earlier execution analysis as current. Reuse the shared
    candle cache before requesting missing coverage. Notes, tags and rule
    reviews do not trigger this refresh because they do not change the trade's
    execution path.
14. During the initial beta, Moomoo is the only market-data source used inside
    user accounts for chart replay and trade analysis. A free Moomoo account is
    sufficient for this market-data connection. EODHD remains isolated to the
    owner's separate Levels System and is not a user-dashboard fallback. No
    pre-beta or unrelated historical candle cache is adopted in this slice. If
    exact Moomoo turnover cannot be obtained or refreshed, the chart states
    that VWAP is unavailable; it never estimates VWAP from OHLCV.

## Implementation

### 1. Scoped provider and provenance

- Replace the global Yahoo worker dependency with a provider factory created
  from the job's own workspace/user scope. It obtains the token only through
  `MoomooConnectionAccessService`.
- Implement a server-only History K-Line adapter using `ktype=1`,
  `extended_time=1`, start=trading date and end=following date. Normalize
  compatible OHLC field names, volume, exact turnover and epoch timestamps;
  ignore future placeholders; merge only identical timestamp duplicates.
- Add migration `0036` after the committed `0035` currency migration. It must
  preserve immutable market-session history while widening the current
  Yahoo-only schema check to store truthful Moomoo provider key/version.

### 2. Durable live-to-complete lifecycle

- Queue eligible same-day closed Stock round trips after a Journal rebuild.
- First worker run requests only through the current available minute, saves a
  new immutable market-session version, analyzes all coverage received and
  persists `pending` when the 60-minute target is later.
- Set the next job attempt to the exact target time. The final run re-fetches,
  merges stored and current actual candles, writes `ready`, and completes the
  job. No intermediate provider request is permitted.
- A first run after the target writes `ready` directly. Provider unavailability
  or missing execution-minute coverage writes the existing factual status.
- After the immediate analysis is ready, keep its durable job eligible for one
  post-session reconciliation. The reconciliation runs without the account
  page remaining open, checks whether the shared ticker/date cache has already
  been finalized, and requests Moomoo only when it has not. It writes another
  immutable candle-set and analysis revision only when finalized data is
  received, then ends; it never becomes periodic polling.

### 3. Daily Tracker presentation

- Reuse the existing analysis card/chart. `pending` renders it as **Live
  analysis** with factual post-exit progress; `ready` renders **Complete
  analysis**.
- Plot session VWAP and EMA 9 as labeled price-chart overlays. Every displayed
  indicator comparison identifies the execution event and time, then states
  the execution's signed dollar and percentage distance above or below that
  indicator. A bare indicator price is not analysis.
- Plot each entry, add, partial exit and final exit at its exact execution
  price with a large, top-layer callout. Hovering or clicking the chart shows
  the exact execution time, price, quantity and the selected candle's OHLCV.
- Show the ticker prominently on the chart. Winning and losing ticker summary
  panels use the same dark success/error colors as their Trade labels.
- The trade analysis includes factual entry precision within the execution
  candle, holding time, and price MFE/MAE from the first entry while held.
  Candle-extreme distance is called **Entry precision**, not slippage. True
  risk/reward or R-multiple zones require a trader-supplied planned stop; the
  analyzer must not invent one from subsequent candles.
- Keep notes usable in every state. Plain wording explains connection,
  coverage or current-hour waiting without internal error codes.

### 3.1 Detection evidence boundary

- Explain the approved five small-cap price-action families near every execution
  where they occur. Each family has its own evidence contract: expansion requires
  material range/body expansion and an extreme close; compression requires
  material range and volume contraction; a compression break must be decisive;
  rejection requires a dominant wick at a tested local extreme; engulfing must
  be meaningful versus recent active candles; and possible exhaustion requires
  exceptional activity, an extended move, a stall at an extreme and confirmation
  by the following candle. For every execution, retain structures from its
  containing candle and two immediately preceding candles independently for
  `1m`, `5m` and `15m`. Every stored observation identifies its timeframe,
  exact source-candle time, distance from the execution candle, and the time at
  which the completed or confirmed evidence became knowable. This separates
  exact-execution patterns from nearby patterns for long-term statistics and
  prevents a following-candle confirmation from being presented as evidence
  available at the fill. Patterns after the execution window are excluded.
  Each annotation identifies the event, structure time, observed evidence and
  why it matters; internal keys are never shown without context. Familiar
  candlestick names such as Hammer or Shooting Star may be used only when their
  trend and location context is also satisfied. The expanded saved association
  rules define analyzer contract v2. Later threshold or association changes
  require another stored contract version; saved historical analysis must not
  silently change meaning.
### 3.2 Long-term comparison facts

The immutable execution and indicator snapshots support personal comparisons
without another provider request. Retain or derive for every event:

- signed dollar and percentage distance from session VWAP;
- signed dollar and percentage distance from EMA 9;
- whether price was above or below each reference;
- entry-candle location and distance from the favorable candle extreme;
- MFE, MAE and holding time; and
- the relevant approved candle structures around the event.

Later analytics may compare results in stable distance buckets above and below
VWAP/EMA 9. It must keep the original continuous values so bucket definitions
can change without re-fetching candles.

### 3.3 Combined and per-execution analysis

The default trade view is a combined overview derived from every accepted fill,
not a renamed first-entry analysis. It separates **Combined entry**, **Combined
exit**, and **Trade outcome**. Every execution row also provides **View
analysis**; selecting a row replaces the overview with either **Entry analysis**
or **Exit analysis** for that exact fill, highlights its chart annotation, and
centers the chart on its candle using the chart's native time scale.
Each selected execution groups its trader-facing explanation into four compact
categories: **Execution context**, **Market activity**, **Price response**, and
**Nearby price action**. Empty categories are omitted rather than showing an
unavailable or meaningless section.

Each ticker owns exactly one chart and one expanded trade-detail view. On
desktop, the selected trade is expanded and every other trade is a compact
time/direction/execution-count/P&L summary; selecting a summary replaces the
chart and detail view with that trade. On mobile, every trade begins collapsed,
opening one trade selects its chart and closes the previously open trade. The
product must never render one chart per trade.

Combined entry and exit prices are quantity-weighted. Their VWAP/EMA distances
are also quantity-weighted from each fill's own timestamp; an aggregate fill
price must never be compared with one arbitrary indicator snapshot. The
overview reports the position-build and exit spans, and it deduplicates candle
volume/turnover when several fills share one minute. Re-entries after reductions
are processed chronologically rather than treated as a simple unordered list.

Every opening fill retains:

- its exact event, candle, volume, turnover, cumulative session volume and
  cumulative session turnover;
- signed and percentage distance from VWAP and EMA 9 at its own timestamp;
- entry precision and candle location;
- relative volume and nearby approved structures;
- maximum favorable/adverse price movement after the execution until the
  position closes; and
- factual 5/15/30/60-minute post-execution paths as those candles become
  available.

Every reducing/final fill retains the same market and indicator context plus
its exit-candle location, the favorable move available before that exit, the
amount given back from that prior favorable extreme, and its own
5/15/30/60-minute post-exit path. Exit wording distinguishes continuation after
the sale/cover from a protective reversal instead of calling both "favorable."

One-minute OHLC cannot establish whether the high or low occurred before or
after an execution inside the same candle. Entry/exit candle location may use
the full candle as a descriptive placement fact, but after-execution MFE/MAE
starts with later candles and pre-exit peak/giveback uses completed earlier
candles plus the execution price. The product must not imply intraminute order
that the provider did not supply.

These per-execution facts are the long-term source of truth. Combined results
are derived from them so later personal analytics can compare adds, partial
exits and final exits without another provider request or silently changing
the original event evidence.

### 3.4 Trade-level green-to-red analysis

Green-to-red is a separate trade-path calculation inside the same saved-candle
analyzer. It does not make another broker request. Entry and exit analysis stay
execution-specific; green-to-red evaluates the complete chronological position,
including adds and partial exits.

The calculation rebuilds the active quantity, weighted average entry, realized
P/L and remaining marked position after every execution. Between executions it
marks the open quantity with completed one-minute candle closes. Exact execution
prices are valid path points. Candle highs and lows are not used to claim which
side of breakeven occurred first inside a minute. Reported signed fees are
included; when any execution has unreported fees the result explicitly describes
the path as excluding those unavailable fees.

The result distinguishes:

- no confirmed profitable point;
- profitable without a later move below breakeven;
- green to red and ending red;
- green to red and recovering to finish positive; and
- green to red and finishing flat.

For a confirmed transition, retain the first profitable time, peak P/L and
time, first later negative time and P/L, peak-to-red reversal, elapsed time,
final calculated path P/L, first recovery time when applicable, quantity at the
peak/crossover, adds after the peak, and partial exits before the crossover.

Profit opportunity duration uses completed one-minute closes rather than the
single highest intraminute price. The analyzer finds the highest positive
completed-close P/L, then groups consecutive completed closes that retain at
least 50% of that peak into separate opportunity windows. A missing minute,
halt, or other saved-candle gap ends the current window; the analyzer must not
claim that an opportunity remained available through an unobserved interval.
Each window retains its exact start/end, completed-close count, duration, local
peak and time, lowest qualifying marked P/L, count of closes retaining at least
75% of the overall peak, and local-peak-to-final-result comparison. A single
qualifying close is described as one completed close, not as a one-minute
duration.

The longest window is the best sustained opportunity; ties prefer more
completed closes and then the higher local peak. The combined overview shows
that window by default. Additional non-overlapping windows appear in an
expandable **Other profit opportunities** section. They are alternative exit
opportunities and must never be summed or presented as profit the trader could
have captured more than once. The Journal's actual net result remains separate
from the calculated completed-close path, especially when fee coverage is
incomplete.

The structured opportunity-window fields are part of the analyzer result so a
later long-term analytics slice can compare opportunity retention, holding
duration and repeated profit giveback without another broker request. This
slice derives them from persisted executions and candles; it does not add a
database migration or pre-aggregate account-level statistics before owner
approval. An accepted later materialization must be analyzer-versioned and
must preserve these exact source facts.

In the combined overview, desktop displays **Combined entry / Combined exit /
Trade outcome** in the first column and **Green-to-red analysis** in a second
column. Narrow screens stack the same content. Selecting an individual
execution hides green-to-red analysis and returns to a single column because a
whole-position transition cannot be truthfully assigned to one fill.

### 3.5 Manual execution correction refresh

- Trigger only after **Save changes** succeeds. Editing fields in the dialog
  must never start work.
- Append the corrected execution version, rebuild the affected chronological
  Journal chains and commit that transaction before invoking the analyzer
  queue.
- Queue the current round trips returned only by chains that were actually
  rebuilt. This covers a correction that changes which trades the fill belongs
  to without refreshing unrelated recent trades in the account.
- Compare each current trade projection with the projection already analyzed.
  Reuse an analysis when those fingerprints match, even if a wider Journal
  chain rebuild assigned that unchanged trade a newer technical version.
- Recalculate the complete combined trade, every individual entry/exit,
  green-to-red path, one-minute/five-minute contexts and post-exit facts for
  the new round-trip version. A time edit always refreshes: crossing a minute
  boundary changes the source candle, while a within-minute change can still
  change ordering and holding-time facts.
- While a queued job targets a changed trade projection, hide the stale result
  and state that analysis is updating with the latest executions. A newer
  technical round-trip version with the same projection may safely reuse the
  existing analysis.
- If the corrected trade is open, outside the analyzer's eligible history, or
  cannot use Moomoo market data, keep the Journal correction but do not imply
  that analysis refreshed.

### 4. Versioned trade-path materialization

The approved green-to-red and profit-opportunity result must no longer exist
only as a page-time calculation. Migration `0040` adds two Level Analysis-owned
append-only tables attached to
`journal_round_trip_daily_trade_analysis_versions`:

- `journal_round_trip_daily_trade_analysis_path_summaries` stores exactly one
  `daily_trade_path_v1` summary per immutable analysis version. It also freezes
  the exact `round_trip_version_id`, because the existing mutable parent
  analysis row cannot provide historical revision attribution. The remaining
  fields retain status, fee coverage, first green/red/recovery facts,
  completed-close and exact-fill peak facts, position/add/partial-exit context,
  the 50% and 75% opportunity thresholds, and calculated final/reversal values.
- `journal_round_trip_daily_trade_analysis_profit_opportunities` stores the
  ordered non-overlapping completed-close windows for that version. Each row
  retains its zero-based sequence, whether it is the best sustained window,
  exact start/end/peak timestamps, observed duration, completed-close counts,
  75% retention count, lowest/peak P/L and local-peak-to-final reversal.

Both tables reject update and delete. Ownership remains inherited through the
analysis-version foreign key; account-scoped reads must join through the parent
analysis row and may never select a path row by its identifier alone. Actual
Journal net P/L is not duplicated into Level Analysis storage. Long-term reads
join the analysis version to its exact `round_trip_version_id` and use the
Journal-owned realized-P/L calculation, preserving fee eligibility and avoiding
two competing profit facts.

`analyzeDailyTrade` produces the path summary once from the same saved candles
and executions used for its event snapshots. `persistAnalysis` writes the
summary and child windows in the same immediate transaction as the analysis
version. The Tracker reads the stored result. A compatibility fallback may
derive the result only for an older analysis version that has not yet been
backfilled; it must never make a broker request or silently write from a
read-only page.

The cache-only backfill processes current analysis versions missing a path
summary in bounded batches. It reconstructs events from the canonical saved
Journal executions and round-trip allocations, reads candles only from the
version's saved market-session set, uses the direction of the current exact
round-trip version, and freezes that key on the summary. Existing pre-`0040` versions have no
version-local round-trip key, so only each analysis's current version is
eligible for automatic backfill; older historical analysis revisions remain
untouched rather than receiving guessed attribution. The backfill inserts the
derived summary/windows without creating a new analysis revision. Invalid or
incomplete stored evidence remains unmaterialized with a counted failure; it
must not invent events, direction, fees or candles. Re-running the backfill is
idempotent. It does not call Moomoo, change the Journal, replace source evidence
or rewrite an existing materialization.

The first long-term read contract exposes account-scoped, current-version
trade-path and opportunity rows with their round-trip version key. It is an
aggregation input, not a new dashboard. Later metrics may group exact retained
values into holding-duration, profit-retention and giveback buckets without
refetching candles or changing the stored continuous facts.

### 5. Alternate chart timeframes

The saved one-minute tape is the analyzer's canonical source evidence. The
chart may offer `1m`, `5m`, `15m` and `1h` views, but changing the view must not
silently replace the stored analysis or create a second interpretation of the
trade.
EMA 9, candle structures, relative volume, compression/expansion and
completed-close path timing are timeframe-sensitive. The selected chart view
may therefore recalculate its visual EMA 9 and aggregate its candle/volume
display. The selected trade receives a complete combined or individual
analysis at `1m` and `5m`. The `15m` and `1h` views remain chart-only; saved
15-minute observations are retained for later long-term statistics without a
separate higher-timeframe analysis section.

Higher intervals are derived entirely from the saved one-minute candle revision:

- buckets align to the exchange-hour clock and retain the first open, maximum
  high, minimum low, final close, summed volume and summed exact turnover;
- VWAP remains cumulative turnover divided by cumulative volume at the selected
  bucket closes, while EMA 9 is recalculated for the displayed interval;
- execution annotations retain the exact execution price and timestamp in their
  details and attach to the containing aggregate candle;
- `1m`, `5m` and `15m` independently detect and save candle structures from
  their own OHLCV candles around every execution; a five-minute Hammer is
  therefore never inherited from a one-minute label. Exact and one/two-candle
  lookback observations remain separate. Detection excludes partial aggregate
  candles and does not cross a missing aggregate-candle gap;
- switching views makes no Moomoo request, writes no new analysis revision and
  does not alter the shared candle cache.

The control must remain compact on desktop and phone, identify each analysis
timeframe honestly, and reset the initial viewport around the first
execution using a useful interval-specific bar count.

### 6. Deferred import handoff

The later `trade:read` execution-import job will call this same queueing
boundary after accepted Moomoo executions rebuild their round trips. It will
not create a separate Daily Tracker product or impose a 60-minute page delay.

## Acceptance checks

1. A connected user manually saves a same-day closed Stock trade and sees
   Moomoo candles/event markers, never Yahoo data.
2. Before exit + 60 minutes, the page shows live chart/analysis and only the
   completed post-exit observations; one final job is due at the exact target.
3. After the target, the final fetch merges current candles and completes the
   5/15/30/60-minute observations without duplicate timestamps.
4. A trade entered after exit + 60 minutes completes in one request.
5. Future Moomoo placeholders do not create an invalid-payload or no-coverage
   state. Missing actual execution candles remain honest no coverage.
6. Browser review confirms the live/complete wording and existing Tracker
   visual language before acceptance.
7. Browser review confirms exact-price execution callouts, ticker visibility,
   candle/volume interaction, VWAP and EMA 9 overlays, contextual indicator
   comparisons, entry precision, MFE, MAE and holding time.
8. Saved Moomoo candles include exact turnover and displayed VWAP reconciles to
   cumulative turnover divided by cumulative volume for the same timestamp and
   documented extended-session anchor.
9. Exactly one post-session reconciliation can finish off-page, is deduplicated
   by shared ticker/trading-date coverage, preserves the prior analysis on
   failure, and never changes executions or notes.
10. The Help-page backlog explicitly includes the one-time finalized-candle
    update disclosure. Raw one-minute change rate and zero/unsupported turnover
    rate are not presented as trader-facing analysis.
11. The default analysis is a true quantity-weighted combined entry/exit
    overview. Every execution row can open its own entry/exit analysis, and the
    selected native chart annotation remains attached and is visibly
    highlighted while the chart centers on that execution.
12. Every execution analysis includes its own indicator, volume/turnover,
    excursion and available 5/15/30/60-minute facts. Same-minute OHLC is never
    used to claim an unknowable before/after execution sequence.
13. The combined overview shows a separate green-to-red result derived from the
    complete position path. Desktop uses a second column, narrow screens stack
    it, and selecting one execution hides the whole-trade result.
14. Profit opportunity windows use only consecutive completed one-minute closes,
    split at missing-minute gaps, show the best sustained window by default and
    expose additional windows separately without summing alternative exits.
15. Actual Journal net P/L remains visibly distinct from calculated path P/L,
    and the opportunity-window result retains structured fields suitable for a
    later versioned long-term analytics materialization without another broker
    fetch.
16. Migration `0040` creates immutable summary/window rows owned by each exact
    analysis version. New analyzer revisions write them atomically and current
    stored results round-trip back to the same UI contract.
17. The cache-only backfill materializes current missing versions from saved
    Journal executions/allocations, saved candles and the exact saved round-trip direction. It is
    bounded, idempotent, makes zero provider requests and does not create a new
    analysis revision.
18. Account-scoped long-term reads cannot expose another account's facts and
    retain exact continuous values plus the source analysis/round-trip version
    keys. Actual net P/L remains Journal-owned rather than duplicated.
19. The chart offers `1m`, `5m`, `15m` and `1h` without a provider request or
    another persisted analysis revision.
20. Aggregate candles preserve exact OHLC order, summed volume and summed exact
    turnover. Displayed VWAP uses the aggregated exact totals and displayed EMA
    9 uses the selected chart interval.
21. Exact execution price/time remains available in every timeframe. Execution
    markers attach to the containing aggregate candle, while `1m`, `5m` and
    `15m` structures attach to their actual source candles.
22. Every execution snapshot distinguishes exact-candle, one-candle-before and
    two-candles-before patterns by timeframe and records whether the complete
    evidence was knowable at the fill. No after-execution pattern is used to
    judge the execution decision.
23. Candle-pattern labels are derived independently for the selected `1m`,
    `5m` or `15m` chart from that interval's own complete bars. The `1h` view
    remains visual only and does not claim detected structures.
24. The selected chart timeframe controls the selected trade's analysis for
    `1m` and `5m`. Five-minute analysis is a complete combined or individual
    execution view, not a pattern-only summary. It separates the last completed
    five-minute evidence that was knowable before the fill from the containing
    five-minute candle that became factual only after it closed. Trade outcome,
    MFE, MAE and holding-time facts remain unchanged across timeframes. The
    `15m` and `1h` remain chart-only. Stored 15-minute observations are retained
    for future long-term statistics but are not shown as a separate
    higher-timeframe section in the trade-analysis card.

25. Saving a manual execution correction commits the Journal rebuild before
    any analysis queue call, queues every current eligible trade from the
    actually rebuilt chains, and returns an honest queued count to the UI.
26. A current analysis tied to an older round-trip version is never displayed
    as current. A queued replacement shows an updating state until the new
    immutable analysis revision is available; an ineligible correction remains
    saved without claiming an analyzer update.

## Non-goals

Execution importing, broker account mapping, historical fill backfill,
notifications/inbox UI, overnight support, provider-supplied non-one-minute candles, scanner
data, and Yahoo fallback are outside this slice.
