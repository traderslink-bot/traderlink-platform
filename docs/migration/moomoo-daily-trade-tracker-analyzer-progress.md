# Moomoo Daily Trade Tracker Analyzer Progress

**Plan:** [Moomoo Daily Trade Tracker Analyzer Plan](moomoo-daily-trade-tracker-analyzer-plan.md)
**Status:** Complete and owner-approved locally on 2026-08-09. Automatic Moomoo execution importing remains a separate later slice.

## Current checkpoint — 2026-08-09

- [x] Implemented the owner-approved multi-trade presentation. Every ticker
  retains one chart; desktop expands only the selected trade while other trades
  become compact summaries, and mobile starts with every trade collapsed.
  Selecting another trade replaces the chart and expanded detail instead of
  adding another chart or full analysis card.
- [x] Backed up the local development database and added six boundary-confirmed
  synthetic trades for owner review: MB, NAMI and DSY now each have three
  completed trades with four executions apiece. All nine affected analyses were
  rebuilt from the existing 960-bar saved Moomoo sessions with no provider call,
  and all nine current round trips have current `ready` analyses.
- [x] Confirmed same-day Moomoo one-minute candles and the owner-approved
  live-analysis behavior: show real candles now, then make one final fetch at
  exit plus 60 minutes.
- [x] Owner decision: retain one shared server-side Moomoo candle cache across
  TraderLink users. The analyzer must always reuse exact saved coverage before
  making a provider request; browser and owner-computer storage are excluded
  from production.
- [x] Reviewed the inactive Yahoo analyzer: it already provides durable jobs,
  versioned candle storage, cached analysis and the Daily Tracker chart.
- [x] Reviewed the parallel uncommitted Moomoo provider work and preserved it
  untouched. Its uncommitted state and different live-request assumptions mean
  this slice will use a separate verified adapter module rather than adopt or
  overwrite it.
- [x] Implemented the server-only Moomoo History K-Line adapter, truthful Moomoo
  provider provenance migration, and user/workspace-scoped worker factory.
- [x] Implemented the initial-live/final-complete lifecycle: one current-candle
  request now and one final request at exit plus 60 minutes. A failed final
  request retains any already saved live analysis rather than replacing it.
- [x] Implemented Tracker presentation for live, complete and partially
  available analysis. Live analysis shows the real post-exit minutes available
  out of 60; the chart and notes remain usable.
- [x] Replaced the detached DOM annotation overlay with a Lightweight Charts
  series primitive. Execution and price-action labels now redraw from native
  time/price coordinates during pan, zoom and resize; leader lines remain
  attached to the exact candle/price and native hit testing supplies details.
- [x] Owner review confirmed this is the best execution/price-action marker
  presentation so far. Keep the current basic marker appearance while analyzer
  evidence is calibrated.
- [x] Applied the next owner-approved marker refinement without redesigning the
  chart: execution leader lines no longer end in a circle, BUY/SELL labels have
  slightly less horizontal padding.
- [x] Corrected the initial viewport after finalized sessions expanded to 960
  bars. It no longer uses a percentage of the entire saved session. The first
  view now uses a width-aware 90-to-240-bar window anchored around the first
  execution, with context before it and more room after it. The candle size is
  therefore stable whether the cache contains a partial or full session.
- [x] Replaced the loose prototype price-action rules with separate contextual
  evidence contracts for expansion, engulfing, rejection, compression,
  compression breaks and possible high-volume exhaustion. Possible exhaustion
  now requires following-candle confirmation. At most two structures from the
  execution candle or two preceding candles are exposed to the trade view.
- [x] Audited the exact execution windows on the five saved public test tickers.
  Twenty executions expose twelve strong nearby structures; executions without
  sufficient evidence expose none. Expansion, compression, breaks and engulfing
  examples materially exceeded their recent range/body/volume baselines.
- [x] Added strict familiar-name handling. NAMI's 10:34 final-exit candle is a
  confirmed Hammer after a measured decline and following-candle recovery.
  Similar wick shapes without the required trend and confirmation remain neutral
  rejection labels. Shooting Star uses the symmetric strict boundary.
- [x] Locked the rule-version boundary in the plan: analyzer v1 may be calibrated
  only before acceptance; later threshold changes require a new stored contract
  version rather than silently rewriting historical meaning.
- [x] Reconciled the reported NAMI indicator mismatch against both the saved
  candles and a fresh read-only Moomoo History K-Line response. At 06:30 ET the
  saved values reproduce as VWAP 7.18 and EMA 9 7.13; the refreshed API data
  produces turnover-based VWAP 7.20 and EMA 9 7.13. The quoted Moomoo EMA 7.82
  instead matches the 09:42 ET candle. No indicator formula was changed from a
  comparison that was not aligned to the same timestamp.
- [x] Confirmed Moomoo later revises the same-day History K-Line response. All
  454 cached NAMI bars through 11:34 ET had finalized volume differences the
  following day and 374 had at least one OHLC difference; the largest observed
  high/low/close differences were 0.04/0.13/0.07. Immediate analysis therefore
  remains useful but is not necessarily the provider's final historical tape.
- [x] Owner decision: persist exact per-candle turnover for VWAP and add exactly
  one off-page post-session reconciliation. The prior analysis remains usable
  if that reconciliation fails, and shared ticker/date coverage prevents every
  user or trade from independently refetching the same finalized session.
- [x] Added the required future Help-page disclosure to the controlling plan:
  same-day analysis is immediate, but Moomoo may finalize the candles after the
  session and TradersLink will then apply one chart/analysis update.
- [x] Reviewed Moomoo's additional one-minute fields. `change_rate` is merely
  the preceding-candle percentage move and is derivable from OHLC; the tested
  U.S. microcap `turnover_rate` values were zero. Neither will be exposed as a
  vague trader-facing statistic. A later Market Snapshot slice may add a
  properly sourced session turnover rate and price-versus-prior-close context.
- [x] Implemented the single reconciliation lifecycle in the durable worker.
  Ready same-day analysis remains visible while its job waits off-page until
  04:15 AM Eastern the following morning. The first job for a shared
  ticker/date refreshes the full finalized session; other jobs reuse that
  version. A failed or execution-incomplete final response leaves the earlier
  analysis unchanged, and no recurring polling is introduced.
- [x] Implemented exact-turnover normalization and calculation support. New
  Moomoo candles carry exact traded amount, server snapshots calculate VWAP as
  cumulative turnover divided by cumulative volume, and candle details expose
  exact U.S.-dollar turnover. Historical pre-turnover revisions retain their
  existing estimated VWAP instead of being silently reinterpreted.
- [x] Added, registered and locally applied migration
  `0038_daily_trade_exact_turnover` for nullable immutable candle turnover.
  The owner also authorized the required preceding Coach migration `0037`;
  the normal migration runner applied exactly `0037` and `0038`. AI Review
  provider calls and customer activation remain off.
- [x] Re-fetched the saved 2026-08-07 NAMI, MB, DSY, WWR and YJ sessions after
  migration `0038`. Each shared ticker/date now has 960 finalized one-minute
  candles and all 960 rows contain exact turnover. Five affected analysis jobs
  rebuilt successfully and no refresh job remained queued.
- [x] Owner approved the next analyzer contract: a quantity-weighted combined
  entry/exit overview is the default, while every buy, add, partial exit and
  final exit receives its own selectable analysis and chart focus.
- [x] Implement and persist the per-execution market context, indicator
  distances, volume/turnover context, price excursions and 5/15/30/60-minute
  paths without making unknowable same-minute sequence claims.
- [x] Implement the combined entry, combined exit and trade-outcome derivation,
  including chronological fill handling, quantity weighting and deduplicated
  execution-candle activity.
- [x] Add **View analysis** to every execution row; keep the combined overview
  as the default and highlight/center the selected chart execution through the
  native Lightweight Charts primitive and time-scale APIs.
- [x] Group each selected entry or exit explanation under four concise
  trader-facing categories: **Execution context**, **Market activity**, **Price
  response**, and **Nearby price action**. Categories with no factual content
  are omitted.
- [x] Clarify exit giveback as a per-share, share-quantity-weighted comparison
  with each exit's most favorable earlier completed-candle price, and remove the
  redundant disclaimer after the trade-level favorable/adverse price path.
- [x] Implement the approved trade-level green-to-red calculation over saved
  executions and completed candle closes, including adds, partial exits,
  reported-fee coverage and factual transition timestamps.
- [x] Add the desktop second-column green-to-red presentation to the combined
  overview, stack it on narrow screens, and hide it during individual execution
  analysis.
- [x] Complete focused lint and live desktop/mobile browser review of the
  green-to-red analyzer before owner visual approval.
- [x] Derive separate completed-close profit opportunity windows, splitting at
  missing-minute gaps and retaining exact duration, close counts, local peaks,
  75% peak retention and peak-to-final comparisons for later long-term use.
- [x] Show the best sustained opportunity by default and place additional
  alternative opportunities in an expandable section without summing them.
- [x] Keep actual Journal net P/L separate from calculated path P/L and complete
  focused lint plus live desktop/mobile browser verification of the opportunity
  UI. Owner visual approval remains open below.
- [x] Owner visually approved the completed-close opportunity presentation on
  2026-08-08: best sustained window in the default analysis, additional windows
  in a separate expandable section, and actual net result kept distinct from
  the calculated price path.
- [x] Owner authorized long-term materialization on 2026-08-08. Migration
  ownership is coordinated: AI Reviews owns `0039`; this analyzer slice owns
  `0040`.
- [x] Define the `daily_trade_path_v1` append-only summary/window contract,
  atomic revision writes, account-scoped long-term read boundary and bounded
  cache-only backfill. Actual net P/L remains Journal-owned.
- [x] QA the materialization plan against the current schema, analyzer write
  transaction and current-version read path. The QA found that existing
  analysis-version rows do not freeze their own round-trip-version key, so
  `0040` stores that key on every path summary and limits automatic legacy
  backfill to the current analysis revision rather than guessing historical
  attribution.
- [x] Implement and register migration `0040`, persisted calculation, stored
  Tracker read, account-scoped long-term fact query and compatibility fallback.
- [x] Apply `0040` locally and backfill the current five saved sample analyses
  from cached evidence with zero Moomoo requests.
- [x] Confirm each stored result exactly matches the prior derived result and
  complete focused static/runtime checks before the checkpoint commit.
- [x] Preserved the implementation in narrow local commit `745f84c9`. A fresh
  pre-`0040` SQLite online backup and independent restored copy matched exactly
  before the migration write. The database already contained migration `0039`,
  so the normal runner applied exactly `0040_daily_trade_path_materialization`.
- [x] The cache-only backfill materialized all 10 current analyzer revisions
  with zero skips and no provider call. The five approved 2026-08-07 sample
  trades then matched their independently recalculated saved-evidence results
  5-for-5. Tracker, Account and AI Reviews each returned HTTP 200 after one
  coordinated clean restart.
- [x] Owner authorized alternate `1m`, `5m`, `15m` and `1h` chart views. The
  plan keeps `1m` as the canonical stored analyzer contract because candle
  structures, EMA 9, relative volume and path timing are timeframe-sensitive.
- [x] Add the compact timeframe control and aggregate higher views only from
  the saved one-minute candle revision. Keep exact execution details, hide
  one-minute pattern labels outside `1m`, and make no provider request/write.
- [x] Complete focused desktop/mobile technical review of the timeframe control,
  interval-specific viewport, execution annotation placement and chart detail.
  All four controls switch normally on desktop and 390px mobile, higher views
  retain exact-price execution annotations, no one-minute price-action labels
  appear outside `1m`, the mobile page has no horizontal overflow, and no page
  or console error was observed.
- [x] Clarify the analysis boundary in the review UI: every analysis-card
  title states `1 min timeframe only`, chart labels distinguish session VWAP
  from the selected interval's EMA 9, and `5m`/`15m`/`1h` independently detect
  execution-adjacent candle structures from their own aggregated OHLCV bars.
  Partial aggregate candles and discontinuous candle runs are excluded.
  Higher-timeframe structures remain chart context and do not rewrite the
  canonical one-minute analysis. Owner visually approved this timeframe
  presentation on 2026-08-08.
- [x] Rebuilt the five saved 2026-08-07 sample analyses from their finalized
  shared candle revisions. All 20 executions now expose selectable analysis;
  the worker reused cached candles and made no additional Moomoo request.
- [x] Focused lint passes for the analyzer contracts, calculator, repository,
  data adapter, chart primitive and Tracker UI. The live route returns 200.
  Desktop and 390px browser checks show all five combined overviews, all 20
  execution-analysis controls, successful selection, no error overlay and no
  `NaN`/undefined analysis text. An existing Material UI hydration style
  warning remains outside this analyzer slice.
- [x] Completed the delegated detector-evidence audit on NAMI, MB, DSY, WWR and
  YJ. Only two canonical one-minute labels are present. DSY's 09:16 bullish
  expansion has a 3.68x baseline body, 1.63x median range, 2.85x median volume
  and a close in the top 8% of its range. NAMI's 10:34 confirmed Hammer follows
  a 1.83-median-range decline, tests the local low, has a 66% lower wick and
  16% upper wick, and receives bullish next-candle confirmation. MB, WWR and YJ
  correctly force no label. All saved event patterns replay exactly.
- [x] Completed a new direct Moomoo comparison for all five already-requested
  symbols. The broker returned 960 finalized 04:01-20:00 candles per symbol;
  all 4,800 OHLCV/turnover rows matched the saved finalized revisions exactly.
  At every execution, cumulative turnover divided by cumulative volume matched
  the saved VWAP with a maximum floating-point difference below `7e-15`.
- [x] Verified the connected post-session lifecycle from durable evidence. Every
  symbol has both a pre-due and post-due immutable session version, every job
  completed after its scheduled reconciliation time, and each current analysis
  points to the finalized full-session revision. Static write-set review shows
  the worker mutates only Level Analysis session/job/analysis/materialization
  tables; it has no execution or note mutation path.
- [x] Owner approved the corrected pattern-context hierarchy: exact and nearby
  patterns remain distinct; only the execution candle and two preceding candles
  are eligible; patterns after the execution are excluded. One-minute evidence
  describes execution timing, five-minute evidence describes setup and
  confirmation, fifteen-minute evidence is expandable broader context, and the
  one-hour view remains visual only.
- [x] Persist analyzer contract v2 pattern context for every execution with
  timeframe, source candle, execution-candle distance, and factual evidence
  availability at the fill. Migration `0042` preserves the immutable analyzer
  graph while admitting `daily_trade_analyzer_v2`; new revisions now store the
  structured contexts instead of relying on the temporary one-minute shortcut.
- [x] Rebuild the five cached sample analyses without provider requests and
  audit the new `1m`, `5m` and `15m` observations against their source candles.
  Ten current round-trip analyses rebuilt from the saved cache with 48 stored
  contexts. All five symbols passed exact pattern replay, completed-job,
  full-session, turnover and post-session reconciliation checks; the largest
  event VWAP replay difference remained below `7e-15`.
- [x] Completed focused desktop/mobile owner review and final detector
  calibration, restoring final local analyzer acceptance on 2026-08-09.
- [x] Owner corrected the presentation contract before acceptance: a nearby
  five-minute candle-pattern line is not a complete five-minute trade analysis,
  and `setup and confirmation` must not be claimed without that exact evidence.
- [x] Persist per-execution five-minute activity, EMA 9 and containing-candle
  context while keeping known-before-fill evidence separate from retrospective
  completed-candle evidence. The snapshot separately stores the last completed
  five-minute candle, completed one-minute activity already available inside
  the active five-minute window, and the final containing candle.
- [x] Synchronize the chart selector with a complete `Trade analysis
  (5-minute)` combined/individual view. Keep the default complete analysis at
  `1m`; keep `15m` and `1h` as chart-only. Stored 15-minute observations remain
  available for future long-term statistics, but the owner removed the separate
  higher-timeframe section from the analysis card on 2026-08-08. The mobile
  chart control now uses the exact label `Candle patterns` instead of the
  broader and inaccurate `Price action key`, with an explicit `+`/`−`
  expansion-state indicator. Execution-row `View analysis` actions now use the
  same compact button treatment as `Edit`. Analysis cards now rely on their
  explicit `Trade analysis (1-minute)` or `Trade analysis (5-minute)` title
  without an explanatory subtitle, and detected structures are labelled
  `1-minute candle patterns` or `5-minute candle patterns` rather than the
  broader `price action`. On desktop, the Trade analysis heading now begins
  inside the left analysis column using the same heading size and top alignment
  as `Green-to-red analysis`. Chart interaction now leaves ordinary mouse-wheel
  and vertical touch gestures to page scrolling. Horizontal touch drag still
  pans, pinch still zooms, desktop `Ctrl`/`Cmd` + wheel deliberately zooms around
  the pointer, and visible `−`/`+` controls provide explicit zoom. The controls
  sit beside the timeframe selector on desktop and remain floating at the lower
  right on mobile. The
  cache-only rebuild updated 10 current analyses with 20 execution-level
  five-minute contexts. Independent replay passed for all five test symbols,
  alongside exact pattern replay, turnover, full-session and reconciliation
  checks.
- [x] Owner approved the final multi-trade Tracker presentation and chart
  refinements on 2026-08-09. The chart's selected Trade label now matches the
  trade's green/red result treatment with white text; explicit zoom controls
  use the approved navy/white styling; the desktop candle-pattern key remains
  clear of the price scale; and each ticker card has a definite black bottom
  boundary.
- [x] Completed the final bounded browser regression at 1440px desktop and
  390px mobile. Trade switching, five-minute combined analysis, individual
  execution analysis, explicit zoom, ordinary page scrolling over charts and
  the mobile Candle Patterns expansion all passed. Five ticker charts rendered,
  no horizontal mobile overflow or framework error overlay was present, and no
  browser console/page error was observed.
- [x] Completed the final cache-only acceptance audit across all 11 current
  analyses for DSY, MB, NAMI, WWR and YJ. One-minute pattern replay,
  five-minute context replay, existing job completion, pre/post-reconciliation
  coverage, finalized-session use, full extended-session requests and exact
  turnover coverage all passed. Focused ESLint, Tracker/analyzer TypeScript
  filtering and diff-whitespace verification also pass.

## Boundary

Manual Daily Trade Tracker entries are the first delivery. Automatic Moomoo
execution imports remain a later independent implementation slice.
