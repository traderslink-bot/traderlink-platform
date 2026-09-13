# Trade Analyzer Trend & Momentum Progress

Plan: [Detailed plan](trade-analyzer-trend-momentum-plan.md).

## Room After Entry saved-trade correction in progress - 2026-09-12

- Connected Room After Entry to current saved logical-trade results. Fetches
  complete member rows before final-close date selection, counts each saved
  trade once, preserves null whole-trade P/L, and does not fall back to separate
  member results for unavailable grouped analyses. Existing single-member
  compatibility remains; no Journal facts or financial formulas were changed.
- MFE/MAE now recompute each opening execution's movement through its next
  position closure, including the exact closing fill and interior candle ranges.
  Temporary-flat gaps cannot inflate a prior entry. Fixed timed paths retain
  their existing independent horizon. Re-entry is distinguished in path rows.
  Shared aggregate movement fields derive from the same measured rows.
- Eight focused projection/service tests pass, covering grouping, date boundary,
  partial member rejection, missing P/L, unavailable grouped results, account
  isolation, sparse windows, conversion, short moves and flat-gap exclusion.
  Six selected source/UI/test TypeScript roots pass. Single-member fallback
  now requests only current active round-trip versions. Whitespace check passes.
  Updated Room After Entry Help and tooltips. Page visual/offline acceptance,
  optional indicator filters and broader trade-identity audit remain pending.

## Restart recovery and owner-authorized trade-identity audit - 2026-09-12

- Verified HEAD 6369346b1 and both unfinished movement source changes survived
  the computer restart in the assigned current worktree. No reset, migration,
  provider request, local server or hosted action was performed.
- Owner explicitly authorized correcting Room After Entry and other Analyzer
  pages only where inspection confirms an outdated round-trip-only path.
  Round-trip source records remain intact; canonical user-defined trade identity
  must control grouped results and trade counts. Do not rewrite already-correct
  paths merely because their underlying inputs include round-trip records.
- Confirmed Room After Entry measures legacy joined per-round-trip snapshots
  while its P/L lookup already resolves saved trade totals. Its measurements,
  IDs, counts, date selection and detail navigation require consistent review.
  Entries/Exits has a logical-result override; Green-to-Red and Scaling scenario
  calculations have logical-trade readers. Their other summaries and drilldowns
  still require separate inspection before declaring them correct.
- Added three passing focused movement projection tests: interior-candle timing,
  missing-window containment, re-entry labeling, missing P/L preservation,
  reporting conversion, and short-direction movement. This helper is not yet
  connected to the page; page correction and full acceptance remain incomplete.


## Exact execution-filter snapshot boundary - 2026-09-12

- New completed Analyzer results embed compact EMA-alignment/RSI-band context
  with each execution snapshot, tied to its exact execution ID and timestamp.
  This avoids cross-joining movement/pattern observations by symbol or sequence.
- Reader validates the calculation version and binding, rejects future frames,
  preserves another valid timeframe if one is malformed, and removes private
  execution identifiers before exposing filter categories to aggregate models.
  Default Any filters preserve all rows; missing required context is unknown.
- Existing movement/path projections now carry this optional context directly
  from their own saved snapshots. Existing historical snapshots remain readable
  and unavailable for added context; no historical facts were rewritten.
- Nine binding/worker/landmark tests pass, including unchanged core snapshots
  after removing the additive field. Four selected source TypeScript roots and
  whitespace check pass. No server, provider request, migration or hosted action.
- Room After Entry still requires its current logical-result/source selection
  and filter UI integration; merely attaching context to legacy rows is not
  sufficient. Candle Patterns aggregate/occurrence filters must use this same
  snapshot contract. These page integrations are not marked complete.
- Help review: no new visible control in this checkpoint; update relevant Help
  when the movement/pattern filters are connected.

## Day overview and Entries/Exits integration - 2026-09-12

- Added the compact Day overview coverage card and detailed-comparison link,
  with no duplicate long tables. Count includes both directions because the
  existing Day overview has no direction selector. Existing analyzed count and
  financial metrics are unchanged.
- Added Entries/Exits EMA alignment and RSI comparisons for initial entries,
  adds, re-entries, partial exits, interim closures and final exits. Matching
  timeframe and Gross/Net labels are explicit. Detailed-comparison links retain
  date/basis/direction/timeframe/execution choices. Offline uses saved records.
- Twelve focused execution-page/cohort/render tests pass; three selected UI
  TypeScript roots pass. Help updated. No local server or hosted action.
- Room After Entry and Candle Patterns still need exact pre-execution filtering;
  their existing occurrence IDs/version joins must be preserved, not inferred
  from ticker or execution sequence alone. Analyzed Trades cohort restoration,
  remaining evidence drilldowns and full acceptance remain outstanding.

## Green-to-Red and Scaling Out integration - 2026-09-12

- Added an additive Indicators at the comparison point section to both pages.
  Green-to-Red compares first +20% against later-red outcomes, or first red
  against recovery only among turned-red trades. Scaling uses the same first
  selected-zone arrival for both profit-taking and no-profit-taking groups.
- Reuses existing financial rows, classifications and selected Gross/Net outcomes.
  Joins by canonical trade ID plus exact landmark key/time; unknown indicators
  do not change financial eligibility. Timeframe/point/axis selections persist
  in the URL online and remain locally interactive offline.
- Saved landmark evidence now includes its last completed close for a properly
  labeled close-vs-VWAP comparison, with reporting conversion. No hypothetical
  execution or position profit is inferred from that observation.
- Corrected offline financial-row trade references to use the same anonymized
  mapping as indicator rows; regression verifies joins and no original IDs.
- Seventeen focused landmark/comparison/cohort/reporting fixtures pass. Nine selected
  TypeScript roots pass; whitespace check passes. Updated relevant Help guides.
- Still required: complete per-row evidence drilldowns for these sections,
  remaining page integrations, full-data/payload checks, calibration corpus,
  browser/offline interaction acceptance and final release handoff. No hosted
  actions or migration application occurred.

## Shared financial-landmark evidence - 2026-09-12

- Reused the existing V2 financial scenario engine to identify first zone
  arrivals, first +20% and first red after +20%. Added source provenance only
  to the green-opportunity result; no financial formula or eligibility changed.
- New indicator results save compact context at these exact landmarks. A
  candle-extreme timestamp is the source minute's end, so its context cut-off
  is that minute's start. Exit-fill landmarks retain exact execution time.
  EMA/RSI use completed matching-timeframe bars; VWAP uses the same session.
- Landmark context is retained in the aggregate projection and its price values
  follow reporting conversion. No existing saved results are rewritten and no
  page view requests market data. Cross-page comparison UI remains next; this
  does not yet claim the Green-to-Red/Scaling integrations are complete.
- Contained optional enrichment exceptions inside the Analyzer so they cannot
  discard completed core event/path/financial analysis. Failure gets the existing
  neutral history-unavailable reason, not an asserted low-volume cause.
- Twenty-two landmark/foundation/reporting/worker fixtures pass in one process;
  six selected TypeScript roots pass with the installed ESNext library contract.
  Whitespace check passes. No hosted action, migration or local server used.
- Help review: this checkpoint adds saved backend evidence only. Update the
  cross-page Help copy with its visible integration rather than documenting
  controls that are not yet present.

## Indicator-specific comparison tables - 2026-09-12

- Added separate EMA 9 & EMA 20, RSI and Session VWAP sections with saved-URL
  axis selections. Each includes distinct trades/executions, wins/losses/
  breakevens, known-outcome counts, win rate, total/average/median selected-basis
  P/L and average return. Gross/Net labels remain explicit.
- EMA/RSI direction and EMA separation tables partition observation spacing
  and candle freshness, and show elapsed span and age. Unavailable evidence
  stays a visible group. VWAP uses the same execution-price predicate as the
  combined-condition filter, not a separate interpretation.
- Changed the execution option to the approved Interim position closure label.
  No execution classifications, Journal outcomes or Watchlist behavior changed.
- Thirteen focused cohort/aggregation/static-render checks pass; five selected
  TypeScript roots have zero diagnostics; whitespace check passes. Help updated.
- Across-session classification, full band-to-detail reconciliation, cross-page
  integrations, server payload scaling, provider corpus and complete browser/
  offline acceptance remain outstanding. This is not final feature acceptance.

## Supporting execution drilldown - 2026-09-12

- Added server-built supporting pages from the same current scoped projection.
  Direction and combined conditions apply before counts or pagination. Default
  25 rows; only 10/25/50/100 allowed. Timestamp, trade ID, execution sequence and
  execution ID provide deterministic ordering. Counts cover the whole cohort.
- Expandable execution rows show saved EMA9/20, RSI14, VWAP, last completed
  candle, candle age, direction observation span and real history count. Each
  column/detail has a trader-facing tooltip. Full-analysis links preserve the
  selected timeframe. Offline uses sanitized saved records and opens saved days.
- Changed selections withhold mismatched supporting pages until the server
  result arrives. Trend direction follows current online URL state. No database
  writes, market-data requests, local servers or hosted actions were performed.
- Eleven cohort/aggregation/static-render checks pass, including populated rows,
  timeframe/reporting-basis mismatch withholding, stable page boundaries and
  changed-population clamping. Six selected TypeScript roots pass after fixing
  a literal-union inference issue. These are not browser-interaction proofs.
- The existing summary projection still carries its full execution/episode set
  for offline and comparison controls; paged detail rows alone do not prove the
  final payload-size/scaling requirement. This remains a final integration item.

## Combined-condition controls - 2026-09-12

- Added the Combined conditions section: EMA alignment/directions/separation,
  RSI band/direction, execution-price vs session VWAP, and candle spacing.
  Matching, nonmatching, and missing-data cohorts show distinct trade outcomes,
  wins/losses/breakeven, total/average/median P/L, average return and denominators.
- Online selections persist in URL parameters without removing date, direction
  or reporting-basis parameters. Offline selections remain locally interactive.
  Every filter and table heading includes plain-language help.
- Initial focused render check caught unsupported MUI system props; moved them
  to sx. This is a local source slice, not rendered browser or hosted acceptance.
- After correction, all nine focused cohort/aggregation/render tests pass without
  the warning, and the three edited UI roots have zero TypeScript diagnostics.
  Updated the Trend & Momentum Help guide for exclusive cohorts and saved filters.
- Supporting-record server pagination, cross-page integration, remaining corpus
  and complete acceptance checks are still outstanding. The goal remains active.

## Restart recovery and combined-condition core - 2026-09-12

- Verified checkpoints 0ff29bccc, 18ab0f82d and 0a2e8a955 and the unfinished
  comparison files survived the owner-reported restart. Diff whitespace check
  passes. Recreated the test file whose interrupted patch had not succeeded.
- Added exclusive same-execution matching/nonmatching/unknown cohorts. A known
  match takes precedence; otherwise any missing required context stays unknown.
  Multiple executions still count one whole-trade outcome. Trades without saved
  selected executions are outside the comparison and counted separately.
- Added wins/losses/breakevens, median P/L and average return to distinct-trade
  summaries, plus known-value URL filter parsing. UI wiring remains next.
- Six aggregation/cohort fixtures and three selected-root TypeScript checks
  pass after restart. Full-scope QA and final acceptance remain incomplete.

## Individual trade context and chart alignment - 2026-09-12

- Connected saved indicator context through both logical-analysis presentation
  paths: Session Tracker data and scoped trade-detail API. The shared written
  trade view now includes an execution selector, timeframe-aligned EMA9/20,
  RSI14 and session VWAP card, bar age/lookback span and per-indicator reasons.
  Partial availability does not hide the existing P/L story.
- Trade summary uses the same new pre-execution context when present; it never
  substitutes conflicting older values when a new indicator is unavailable.
  Older analysis is retained and its different candle timing is labeled in Help.
- Reporting conversion scales only price-valued fields, including episode
  per-share changes. Percentages, RSI, times and source evidence stay unchanged.
- Saved result now retains compact session-only 1m/5m indicator chart series
  calculated with the same warmed history. Chart uses these series, shows EMA20
  dashed alongside EMA9, offers an optional RSI pane, and emits whitespace for
  unavailable values. Unsupported 15m/1h indicator context is not substituted
  with 1m/5m output; existing candle/pattern/interaction controls remain intact.
  Older chart EMA is explicitly identified as an older calculation.
- Chart skill used; installed lightweight-charts 5.2.0 typings verify v5
  addSeries, LineStyle and createPriceLine APIs. Existing chart color scheme is
  retained, including the existing light plotting surface in Navy Dark; rendered
  appearance/interaction acceptance is still pending, not claimed by typechecks.
- Combined analysis projection deliberately excludes chart arrays to avoid
  duplicating every trade's full chart in group-page/offline payloads. Individual
  daily offline contract already excludes Analyzer detail; that boundary remains.
- Four new fixtures pass: currency invariants, chart/execution equality and
  unsupported timeframe, partial card rendering, and no legacy summary fallback.
  Foundation/worker regression passes in the same 19-test process. Six initial
  individual/API roots and five subsequent chart/core roots pass targeted strict
  TypeScript checks, not a full application build.
- Remaining full scope: aggregate filters/cohorts/statistics/URL and bounded
  supporting evidence, equivalent cross-page comparison anchors, other-page
  enrichment, outcome notification/copy audit, real saved-trade calibration,
  populated browser/interaction/offline acceptance and final release handoff.
  No hosted change, local server or real provider request in this checkpoint.

## Initial Trend & Momentum page integration - 2026-09-12

- Combined checkpoint: all 43 focused tests pass in one 512MB-capped process
  (history/math, episodes, grouping, basic rendering, worker, in-memory storage,
  selection and mocked provider). No real market-data request was made by this run.

- Added `/analytics/trade-analyzer/day/trend-momentum` through the existing
  authenticated shared page, navigation and overview capability links. New
  optional model field reads saved logical-trade evidence only. Existing pages'
  financial projections are unchanged. Selected reporting P/L stays lossless.
- Initial view includes timeframe/execution selection, EMA alignment/direction
  and RSI group results, first-event recovery/horizon summary, separate earlier
  coverage groups, paginated all-occurrence records and full-analysis links.
  All card/table headings use existing tap-persistent plain-language tooltips;
  table scroll containers and surfaces use existing shared theme components.
- Added Help guide and offline route/model integration. Offline indicator
  trade/execution references are replaced with local references, including
  nested event contexts. No raw provider payload is sent to this page.
- Next.js skill guided async route props and server/client separation. React
  skill review replaced barrel imports and repeated group-array copying.
- Eight changed UI/contracts roots pass strict targeted TypeScript diagnostics
  using explicit installed React type paths. Initial compiler attempt used an
  incorrect React resolution path; no source errors remained after correcting
  that check configuration. Two server-render fixtures pass for unavailable
  and empty views, controls/tooltips and exclusive horizon columns.
- Required dashboard-template Vitest file ran single-worker: 3 pass, 4 fail.
  Failures concern unchanged legacy assertions: layout now uses shared Frame;
  shell no longer owns navigation imports; route enumerator misses Watchlist
  and dynamic News routes; a Help-link comment mentions DashboardShell. Read-only
  inspection confirms new route exists and no new local shell was introduced.
  Do not report that architecture suite green or edit unrelated shell to satisfy
  stale assumptions. Baseline guard reconciliation remains an acceptance note.
- Not complete: full execution evidence/filter design (VWAP, RSI direction,
  separation and conditioning), event-presence/ambiguous timing coverage,
  first-reclaim/combined conditions, equivalent Green-to-Red/Scaling comparison
  anchors, other existing-page enrichments, individual cards/charts,
  real saved-ticker calibration, populated interaction/render and offline tests,
  final regression and committed handoff. No server started or deployment made.

## Combined evidence calculation checkpoint - 2026-09-12

- Owner confirmed continuing under the existing single goal without routine
  approval pauses; all necessary tests are authorized. Production release is
  still a separate decision. No local server or hosted database changes.
- Added pure execution/whole-trade projection and first-event study summaries.
  Repeated executions count one logical trade and one selected-basis P/L;
  unavailable P/L remains unavailable. First-event selection happens before
  context filters. Unknown recovery is excluded from the known-outcome rate.
- Added a read-only scoped saved-analysis service for the upcoming shared UI.
  It respects logical trade membership and selected reporting P/L, retains
  unavailable analysis, and makes no provider requests. Not yet wired to pages.
- Found and fixed missed crossings on the first held close: valid completed
  context already known at entry now supplies the preceding side. Missing entry
  context still cannot invent an event.
- Latest single-process run passes 12 tests: seven episode, three aggregation,
  two synthetic convergence. Strict selected-root TypeScript check passes for
  the new analytics module and saved-evidence service (not a full app check).
- Remaining: page integration, cross-page comparison anchors and UI/Help/offline,
  real saved-ticker calibration, final verification and narrow commit handoff.
  Goal remains active; this is not completion or deployment evidence.

## Convergence edge case and during-trade calculation - 2026-09-12

- Synthetic convergence compares 100-bar EMA9 and 200-bar EMA20/RSI against
  2000-bar references across rising/falling/volatile penny/slower/flat sequences.
  Worst relative EMA errors: 3.60e-11 and 2.36e-10; RSI error 0.0000253 points.
  This is synthetic calibration, not the remaining saved-ticker corpus proof.
- Found a flat-tail RSI exception: recent flat initialization gives 50 while
  longer Wilder history can retain 100. Context now marks RSI unavailable when
  its full required history window has unchanged closes; raw numerical output is
  preserved. Reason is explicit and no overbought/oversold band is assigned.
- Added during-trade loss/reclaim episodes for EMA9/20 and VWAP, short mirroring,
  neutral-side retention, session/coverage interruption, EMA and RSI midpoint
  crossings, per-clock-horizon observations and until-closure movement.
- Connected episode calculation to existing Decimal position states: temporary
  flat periods delimit cycles, not saved trades. Zero-duration/unknown cycle
  timing stays unavailable. Session VWAP event observations use a linear prefix
  calculation and covered as-of lookup, including sparse five-minute buckets.
- Six episode fixtures and two convergence fixtures pass; foundation and worker
  regressions pass together (23 tests in that checkpoint). Earlier 14 selection/
  storage/provider/service fixtures remain passing from their last runs.
- Still pending: complete first-event aggregate selection and timing-ambiguity
  presentation, current saved-ticker corpus, cross-page comparison projection,
  chart/UI/Help/offline work and complete final regression. Not release-ready.

## Selection and worker checkpoint - 2026-09-12

- Explicit Analyze now checks cached indicator readiness before deciding that
  no reservation is needed. Fully cached work remains free. Missing history can
  reserve one unit when available; exhausted allowance does not hide usable
  cached core analysis. Correction-only rebuild policy remains unchanged.
- Four selection fixtures pass. Three worker fixtures pass: pending history
  retains reservation and does not falsely notify ready; history failure keeps
  core calculations exactly equal to the unchanged calculator; a multi-cycle
  logical trade saves all four execution contexts in one result.
- Targeted strict TypeScript diagnostics pass for five changed worker/service/
  repository/selection roots using existing dependency types and a 512MB cap.
  This is not a whole-application type/build result. Focused fixture total: 29.
- Next full-scope work: policy convergence/corpus calibration, during-trade
  indicator events, combined-page projection/UI, individual cards/charts,
  tooltips and Help/offline surfaces, then broader checkpoint acceptance.

## Normal worker connection - 2026-09-12

- Added history service and connected it in the sole Analyzer runtime/worker.
  Original session acquisitions now retain coverage receipts; prior history is
  requested one range per worker pass after core follow-up coverage is available.
  Evidence is reused across same-owner/account symbol requests, newest completed
  candle evidence first. No page-triggered fetching or OpenAI calls.
- Dedicated history provider mode uses strict pagination with an eight-page cap;
  existing normal and owner-session provider modes retain their separate caps.
- Worker reschedules pending history and retains core analysis on a history
  preparation failure, with an explicit unavailable field. User-charge release
  occurs after history completion, not before the continuation can use it.
- Mocked multi-pass service test passes: current range plus two prior windows,
  then cache-only completion with no further acquisition. Combined single-process
  run passes all 22 current fixtures. This is not full worker acceptance yet.
- Remaining integration issue: selection currently treats saved core candles as
  zero-unit sufficient even when indicator history is absent. Integrate history
  readiness into explicit Analyze reservation without blocking otherwise usable
  cached core analysis or charging correction-only recomputation. Candidate
  warm-up policy 100 EMA9 / 200 EMA20 / 200 RSI needs final convergence/corpus
  validation before release. UI, aggregate events and Help remain incomplete.

## Interrupted requests and prior-session range checks - 2026-09-12

- Scoped recovery now closes only requested history attempts older than five
  minutes and their still-open acquisition records. Completed evidence stays
  immutable; late completion is rejected. Tests cover wrong-user isolation,
  non-expired requests, idempotent recovery and late responses.
- Added ten bounded prior weekday windows using the existing New York extended
  session conversion. Weekends are skipped; holidays remain provider-confirmed
  empty history rather than assumed sessions. DST test covers March 9 versus
  March 6 UTC offsets; invalid calendar dates rejected.
- Five storage/range/accounting tests pass in explicitly in-memory fixtures,
  all closed afterward. Together with foundation/provider: 21 passing fixtures.
- Worker wiring is still pending. These helpers do not yet fetch extra history
  during normal Analyze. Do not describe acquisition as implemented end-to-end.

## Durable history and single-charge accounting - 2026-09-12

- Authored and registered reserved migration
  `0134_daily_trade_analyzer_trend_momentum_history`, immediately after
  `0133_platform_watchlist_daily_recaps`. Adds only
  `level_analysis_indicator_history_requests` with per-job/range/attempt identity,
  acquisition linkage, result status, candle digest and immutable completed evidence.
  Existing session storage has no equivalent per-job retry/completion record.
- Added scoped history repository begin/finish/read operations. It requires an
  owned leased job and live matching acquisition; completed empty history is
  distinct from failed requests and cannot be rewritten or repeatedly requested.
- Internal continuation reuses the consumed reservation only for the same leased
  user/job. Each provider acquisition still passes the global guard/spacing/cap;
  user availability counts the first acquisition per reservation, including
  owner-reset semantics. No entitlement limit values changed.
- Coordinator explicitly permitted disposable in-memory SQLite tests. Four
  storage/accounting fixtures pass; all handles closed in finally blocks.
  No configured database, user rows or hosted volume was opened/copied.
- Static migration-file verifier passes, including exact 0133 predecessor and
  0134 identity; 120 registered entries (historical numeric gaps are preserved).
  Total focused fixtures currently passing: 20 across foundation/provider/storage.
- No migration applied outside disposable in-memory fixture. No push/deploy.
  Still pending: interrupted-request recovery, complete worker integration,
  convergence policy, analysis/event aggregation, UI/Help and full acceptance.

## Provider range-completion evidence - 2026-09-12

- Added optional `requestCoverage` to provider results. Moomoo marks complete
  only after explicit pagination exhaustion without excluded invalid rows;
  missing pagination, page-cap truncation and retained partial rows stay partial.
  A successful empty response carries complete range evidence while remaining
  the existing no-candles result for old callers. Rejections never do.
- Four focused provider fixtures pass without network calls. Combined with the
  12 foundation fixtures, 16 tests currently pass; integrated worker, persisted
  history and allowance tests are still pending. No database mutations.
- Coordinator reserved `0134_daily_trade_analyzer_trend_momentum_history`,
  predecessor `0133_platform_watchlist_daily_recaps`, only if storage audit
  proves it necessary. Source registration only; do not apply. Migration has
  not been authored. Historical Journal/schema documentation read was truncated
  and must be completed before schema work; do not treat that as a full read.

## Current-main port verified - 2026-09-12

- Active implementation path is now
  `C:/Users/jerac/Documents/TraderLink/worktrees/analyzer-trend-momentum-current-20260912`,
  branch `codex/analyzer-trend-momentum-current-20260912`, base
  `f97ab1ceecf30c411d605f1dd5ed3af31246dead`, allocated by Coordinator.
- Materialized eight new files from checkpoint `5f408165d` and applied only the
  approved additive hunks to the three existing files. Current Analyzer V2
  contract fields remain intact. All 12 focused tests pass in the new workspace;
  diff whitespace check is clean. Old e70f remains unchanged after checkpoint.
- Read current AGENTS.md completely; Light and Navy Dark theme support required.
- Source audit: existing allowance counts each acquisition row as a user unit,
  so warm-up cannot simply invoke beginAcquisition repeatedly. Need internal
  continuation accounting and durable range receipts without extra user units.
  Requested a collision-free migration reservation from Coordinator if the
  storage audit confirms a new table is necessary; no migration applied.

## Current-source checkpoint - 2026-09-12

- Fixed warm-up inventory to count only candles completed by the earliest
  execution needing context, not later acquired session candles. Regression
  fixture proves a nine-bar early entry still requests history even when the
  saved session contains 60 bars. All 12 focused fixtures pass.
- Coordinator explicitly directed no further integration in dirty detached
  e70f. Create a narrow local Analyzer checkpoint only; preserve Watchlist state.
  Coordinator will allocate a current-main branch-backed full worktree for this
  same implementation chat. No push, migration or deployment is authorized.
- Current saved-result repository serializes the analysis result JSON, so
  additive derived output can be persisted there without replacing canonical
  executions. Provider receipts/history persistence and runtime integration
  remain unresolved work, not a completed migration decision.

## Execution calculation integration - 2026-09-12

- Added execution enrichment for both timeframes with session VWAP independently
  evaluated as of each execution. Preserves event IDs across trade cycles,
  rejects duplicate IDs and withholds context beyond acquired history.
- Connected it as an optional, additive input/output on `analyzeDailyTrade`.
  Calls without the input retain their previous output shape. Existing candle,
  execution, pattern and financial calculations are unchanged. Worker acquisition
  does not yet supply the new input; this is not app-wide activation.
- All 11 focused fixtures pass, including future-candle exclusion and distinct
  execution identities. Actual full logical-trade grouping acceptance is pending.
- Current `origin/main` worker was inspected from Git: it is absent in this old
  checkout. The analyzer implementation matches that integrated source; its
  contract has newer unrelated fields in main. Reconcile only additive hunks,
  never replace the current contract with this checkout's older full file.

## Uninterrupted implementation authority - 2026-09-12

- Owner requested completion of the full plan in one goal without routine
  involvement. Proceed with planned UI and all necessary low-resource testing;
  do not repeatedly request testing or implementation approvals.
- Preserve the complete objective. Production publishing/deployment remains a
  separate release gate; existing unrelated work remains outside the allowlist.
- The previous goal was marked blocked awaiting testing approval. That reason
  is resolved. App-controlled goal resumption is separate from implementation;
  no tool can change an existing goal status back to active.

## Focused numerical checkpoint and testing authority - 2026-09-12

- Owner approved the focused tests, then explicitly approved all testing needed
  to complete this goal. Testing approval is no longer a blocker. Keep checks
  low-resource and checkpoint-based; UI acceptance and production release remain
  separate, and no local application server is authorized by this test approval.
- All 10 foundation tests pass in a single Node process, including independent
  closed-form EMA9/20 and Wilder RSI weighted-sum comparisons over 180 mixed-price
  observations (absolute tolerance 1e-10). Sparse aggregation, session VWAP,
  missing turnover, acquisition retries and completed-bar context also pass.
- Initial tsx launcher attempts failed on Windows userInfo/ENOMEM before tests.
  Direct Node with the existing uncommitted account-information fallback and tsx
  CJS hook succeeded. No global settings or dependencies changed.
- This proves only the isolated foundation fixtures, not history convergence,
  provider acquisition, logical-trade integration, combined analytics or UI.
  Runtime integration and full feature acceptance remain incomplete.

## Context interpretation foundation - 2026-09-12

- Added `trend-momentum-context.ts`: execution-time completed-bar selection,
  indicator-specific history gating, observation age, standard/sparse/interrupted
  direction windows, EMA alignment/slopes/separation and RSI bands/direction.
- All interpretation thresholds/readiness counts are supplied by a versioned
  policy; no provisional calibration is silently installed as a production default.
- Added fixtures for execution timing, old context and interrupted direction
  windows. Strict targeted TypeScript passed; fixtures remain unrun.
- Requested owner permission for the small single-process fixture/reference
  checkpoint (no Vitest/build/server). Runtime integration and UI work remain
  pending; this is not a completed feature or a numerical validation claim.

## Bounded history decision layer - 2026-09-12

- Added `trend-momentum-acquisition.ts`: deterministic saved-history reuse,
  newest-missing-range selection, persisted complete-range skipping, retry-time
  waiting, exhausted-history versus request-failure distinction and policy caps.
- Planner emits one decision per worker pass. It does not call Moomoo or alter
  allowance; the integration caller must supply compatible calendar ranges,
  scoped receipts and the existing shared acquisition lease. Numerical sufficiency
  remains separate from calibrated convergence/readiness.
- Added fixtures for sufficient-cache reuse, sparse completed-range exhaustion,
  retry waiting and retry exhaustion. Authored, not executed under test restriction.
- Focused strict TypeScript check passed. Existing runtime remains disconnected
  from the new modules. Next integration work must persist range receipts and
  retain the distinction between completed empty history and transport failure.

## Isolated numerical foundation - 2026-09-12

- Added `trend-momentum-indicators.ts`: SMA-seeded EMA9/20, Wilder RSI14 with
  separate initialization/null states, immutable timestamped series and one-minute
  session VWAP calculated independently of earlier warm-up history.
- VWAP requires completed request coverage for its session interval; missing
  turnover stays unavailable rather than silently changing calculation method.
  Typical-price approximation is an explicit method. No UI displays these values yet.
- Added `trend-momentum-foundation.test.ts` fixtures for sparse buckets, incomplete
  coverage, duplicate conflicts, EMA/RSI boundaries, session isolation and turnover.
  Tests authored but not run under the current restriction. No numerical parity
  claim or calibrated readiness claim is made from TypeScript alone.
- Focused strict TypeScript passed for the numerical/history implementation.
  Existing Analyzer and Watchlist files are untouched; modules remain isolated.
- Next: bounded acquisition policy, numerical/reference checkpoint when authorized,
  and reconciliation with current integrated source before runtime imports.

## New goal active; isolated history foundation started - 2026-09-12

- Created the owner-authorized Analyzer goal after the old goal was cleared.
- Added `src/lib/trade-candle-analysis/trend-momentum-history.ts`, currently not
  imported by runtime code. It aggregates returned 1m candles into sparse-aware
  closed 5m buckets only within completed request coverage; no fabricated bars,
  unfinished buckets or duplicate-conflicting rows.
- Added warm-up inventory with caller-supplied calibrated targets and actual
  last-observation age. This is inventory, not final readiness or provider fetching.
- Module is intentionally independent of existing pattern aggregation and the
  Watchlist implementation. Session/adjustment compatibility must be established
  by the eventual caller; this primitive does not infer it from prices.
- No UI, existing calculations, provider requests or deployed behavior changed.
  Focused static verification and fixtures are next; runtime integration remains
  against the current source, not replacement with this older checkout's files.

## Implementation preparation authorized - 2026-09-12

- Recorded automatic history acquisition as normal Analyze behaviour, not only
  test tooling. Kept page reads provider-free, valid sparse history eligible,
  saved-candle reuse free of provider allowance and multi-request accounting explicit.
- Recorded owner permission for Moomoo retrieval for their test/Demo trades;
  production Demo entitlement restrictions remain unchanged.
- Added partial indicator/core-unavailable/provider-failure outcomes, plain card
  copy and deduplicated in-app terminal-failure notification requirements.
- Focused consistency review: automatic acquisition belongs to the authorized
  Analyze job; it does not contradict provider-free page reads. Low activity is
  not inferred from absent timestamps. Partial indicators do not reject otherwise
  usable analysis or create notification spam.
- Next: implement isolated data/calculation contracts, then integrate against
  the verified current source. No application code changed at this checkpoint.

## Production feasibility sample - 2026-09-12

- Read-only Railway SSH confirmed production service
  `traderlink-platform-web-restore-0909` reports commit
  `f97ab1ceecf30c411d605f1dd5ed3af31246dead`, matching inspected remote main.
  No restart, configuration changes, health claim or deployment performed.
- Opened the configured database using better-sqlite3 `readonly:true`,
  `fileMustExist:true` and query_only. Required exactly one active owner-admin
  grant; selected only its user_id's ready logical analyses joined to their
  current matching analysis revisions. Limited to 20 rows, candle JSON under
  2 MB per row. Returned only anonymous bar/event counts, not identifiers/prices.
- Two matching ready logical records returned: 52 candles / 2 events / 9
  completed pre-entry bars, and 445 candles / 2 events / 382 pre-entry bars.
  Both had turnover on every saved candle; neither had sparse pre-entry
  intervals or temporary-flat events. This sample establishes a real warm-up
  shortfall for one early entry, not broad numerical or grouped/sparse acceptance.
- Current `aggregateCompleteExecutionTimeframeCandles` requires exactly five
  source bars per 5m bucket and is shared with pattern detection. Introduce
  separate indicator aggregation; do not weaken the pattern continuity contract.
- Current Moomoo adapter accepts 1m extended-hours requests <=24 hours with a
  four-page cap. Prior-session warm-up requires bounded separate ranges/cache
  reuse, not an arbitrarily enlarged existing request. No provider call made.
- Grouped Entry/Exit read model resolves Journal logical trades and prefers
  ready combined evidence; single-member fallback is restricted to one-member
  trades. Existing `temporary_flat` mapping requires careful new interim-closure
  presentation without changing existing Scaling Out accounting.

Ready to define the implementation goal: the data path and integration strategy
are established, with calibration and broader sparse/grouped fixture coverage
remaining implementation acceptance work. Before source edits, reconcile the
assigned old worktree against the current integrated parent under the repository
ownership rules; do not overwrite current Analyzer files with older copies.
UI review and release authorization remain separate gates. No implementation
goal was created in this feasibility turn.

## Feasibility started - source checkpoint 2026-09-12

Owner authorized proceeding after plan QA. Read-only source investigation began;
no UI or runtime modifications. Current remote main verified with `ls-remote`:
`f97ab1ceecf30c411d605f1dd5ed3af31246dead`. Read files directly from that Git object
instead of treating either older checkout as current. This is remote source
verification, not a fresh Railway deployment/health verification.

Source findings at that revision:

- `logical-trade-analyzer-selection-service.ts` resolves the user-defined trade
  through Journal's materializer. Saved sufficient coverage bypasses reservation;
  corrections with prior analysis can use saved coverage. Preserve these paths.
- `logical-trade-moomoo-analyzer-worker.ts` fetches 1-minute extended-hours data
  from `newYorkExtendedSession(...).startTime` through its desired endpoint.
  That session is 04:00-20:00 New York. The inspected worker does not acquire a
  separate prior-session warm-up window. It passes `dailyRanges: []` to analysis.
- `logical-trade-analyzer-repository.ts` stores and reads version-linked
  `evidence_candles_json` alongside the combined result. Thus saved grouped-trade
  candle replay is structurally available; actual per-trade bar counts have
  not yet been queried.
- `daily-trade-analyzer.ts` calls `calculateIndicatorPoints` with turnover VWAP
  for both 1m and aggregated 5m candles. The function accumulates over supplied
  candles; it does not independently reset by date. In this worker, the supplied
  window begins at the extended session, not regular open.
- `indicator-context.ts` uses first-close EMA seeding; Wilder RSI needs 14
  changes and returns null before that. Zero total volume or incomplete turnover
  makes the corresponding turnover VWAP unavailable. Adding earlier EMA/RSI
  history must NOT prepend prior-day turnover into the current session VWAP.

Next evidence work: inspect actual saved-history counts/coverage through a
read-only scoped data path; verify grouped read-model and chart consumers,
provider pagination, and 5m aggregation. Then specify bounded warm-up acquisition
only where saved history cannot supply it. No conclusion yet that historical
trades have enough warm-up or that a provider request is required for every trade.

No local servers, builds, runtime tests, provider requests, migrations or release
actions. Existing Watchlist modifications remain untouched.

## 2026-09-12 planning checkpoint

- [x] Recorded owner scope: no AI; separate from Watchlist; individual review
  plus combined Analyzer group pages and useful new pages.
- [x] Located owner-named chat and read its recent handoff without starting work
  in another chat.
- [x] Read newer Version 2 plan in its existing lane; identified local lineage
  gap and preserved Scaling Out/grouped-trade requirements in this proposal.
- [x] Inspected local indicator fields, distance-based comparison source and Help.
- [x] Created detailed plan with full surface inventory, proposed definitions,
  aggregation, data/usage constraints, rollout gates and verification matrix.
- [x] Complete first document QA and record corrections (below).
- [ ] Owner review of plan and UI organisation.
- [ ] Pre-code integrated-source and saved-history feasibility checkpoint.
- [ ] Implementation and focused verification.
- [ ] Owner visual acceptance and separately authorized coordinator handoff.

No application code, hosted data, provider settings or Watchlist files changed.
No tests, builds, app servers, API generation or deployment ran. No new migration
is requested/reserved. Current release lineage and production candle sufficiency
are not yet verified. The detailed draft is not an implementation completion claim.

## First document QA

- Preserved all seven newer Analyzer routes, including Scaling Out; the proposed
  eighth page does not replace any of them.
- Added explicit same-execution conjunction and exclusive matching/nonmatching/
  unknown trade cohorts, preventing different fills from satisfying different
  conditions and preventing repeated-fill weighting of whole-trade P/L.
- Clarified t versus t-3 requires four observations and equality must not emit
  repeated RSI crossover events or be determined by display rounding.
- Kept indicator-specific coverage independent, protected saved grouping and
  distinguished pre-execution knowledge from later trade/outcome observations.
- Kept session anchor, warm-up convergence, integrated production lineage and
  bounded persistence feasibility open rather than claiming they were verified.
- Documentation whitespace check passed. No runtime tests were run. These three
  documentation files are the entire change allowlist for this checkpoint.

## Owner-approved sparse-history update and QA corrections - 2026-09-12

- Accepted sparse Moomoo timestamps without requiring a missing-minute reason;
  use actual returned bars, no invented flat candles, and count warm-up in bars.
- Distinguished sparse responses from failed/truncated/paginated request gaps;
  absence is not stored as confirmed zero volume. Sparse closed 5-minute buckets
  no longer require five one-minute rows.
- Separated recorded-close sequences from clock-duration proof; preserved
  existing Profit Zones duration rules and added context age/freshness review.
- Added during-trade loss/reclaim studies, clock-based follow-through boundaries
  and common comparison landmarks for scaling/red/recovery cohorts.
- Specified EMA equality/slope formulas and RSI touch-versus-cross examples.
- Added threshold calibration and consistent chart/written/aggregate version
  gates. Actual saved-history sufficiency, freshness limits and production
  integration remain unverified pre-implementation checkpoints.
- Documentation only. No application changes, runtime tests, API calls,
  migration, commit or release performed for this update.

## Second QA corrections and owner trade-definition clarification - 2026-09-12

- Explicitly made the saved user-defined trade authoritative across multiple
  round trips; cycles are exposure segments, not extra trades or duplicate P/L.
  Added interim position-closure context and prohibited fallback to member trades
  when combined evidence is unavailable.
- Partitioned returned-bar direction comparisons by standard/sparse observation
  spans; cross-session changes are not intraday momentum highlights.
- Defined repeated loss/reclaim pairing, first-event selection before filters,
  unresolved episodes and separate occurrence versus unique-trade counts.
- Added During the trade to the actual selector inventory.
- Defined follow-through baseline, exact clock endpoints, early/at-horizon
  closure, missing data, re-entry and until-closure price-movement treatment.
- Added explicit acceptance cases for all four QA findings and owner grouping
  clarification. Existing financial/path calculations remain outside this change.
- Documentation-only update; no feature implementation, tests or deployment.

## Final focused QA clarifications - 2026-09-12

- Renamed the context selector to **Interim position closure**, explicitly
  separate from Final exit. Kept **Until position closure** as the endpoint
  measurement for either kind of position cycle.
- Defined observed reclaim, no recorded reclaim before closure and recovery
  unknown. Unknowns remain visible but do not count as non-recovery; rates use
  known outcomes only and show N/A when none are known.
- Preserved sparse returned-bar eligibility, unique saved-trade headline counts
  and existing Green-to-Red financial calculations. Added acceptance cases.
- Documentation only. Next checkpoint is saved-data/integrated-source feasibility;
  this update does not authorize application changes or hosted operations.

## First-event coverage and exclusive horizon counts - 2026-09-12

- Distinguished confirmed first recorded events from first observed events with
  incomplete earlier history, including earlier cycles of a user-defined trade.
  Preserved valid sparse-candle history and independent episode-recovery status.
- Specified that no observed event with incomplete coverage is unknown event
  presence, not confirmed absence.
- Added an exclusive horizon classification order: timing unavailable, closure
  before horizon, closure at horizon, endpoint unavailable, measured. Early
  closure wins over missing later candles; all counts reconcile exactly once.
- Added acceptance cases for the two QA findings. Documentation only; no
  application changes, runtime tests or deployment.

## Owner-required tooltip quality - 2026-09-12

- Made card and table-column tooltips mandatory for new/changed Analyzer pages,
  preserving existing coverage, interactions, tone and presentation quality.
- Required short trader-friendly explanations of displayed values, units,
  included trades and percentage populations; no developer/system terminology.
- Added exact-copy inventory and desktop/mobile/keyboard acceptance checks,
  including protection against help clicks sorting, expanding or navigating.
- Documentation only; no UI changes, tests or deployment.
