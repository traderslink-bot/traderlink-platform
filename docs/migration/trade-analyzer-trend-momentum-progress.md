# Trade Analyzer Trend & Momentum Progress

Plan: [Detailed plan](trade-analyzer-trend-momentum-plan.md).

Current source/remaining hosted acceptance:
[Exact handoff](trade-analyzer-current-acceptance-handoff.md).

## Production handback and test-harness correction - 2026-09-13

### Resumed live acceptance and Analyzer request correction

- Coordinator released whole-trade refresh at
  0277d4fdc2db4bae1a5263c46651e333c7866bcc / Railway
  f3e96ae9-e59f-4526-adde-c6ff7b907350 SUCCESS, app/proxy ready/121.
  One controlled fake-trade edit now replaces stale mismatch with populated
  EMA9/EMA20, RSI and session-VWAP execution context. No separate Analyzer POST
  was submitted. Timeframe, independent numeric and allowance checks remain open.
- Live edit inspection found rounded input prefill was submitted as a changed
  price even when another field was edited. Preserve approved two-decimal UI;
  retain original stored price unless Price onChange explicitly marks it edited.
  Intentional keyboard/paste input uses exact typed value, new rows use draft
  price, and reopen resets edit tracking. Four focused tests pass and three
  changed files lint clean. No table/summary formatting or financial formulas
  changed. Help copy remains correct; no new user action or label introduced.
- Exemption migration/repository draft is separate and unregistered/unapplied.
  Two in-memory tests prove populated immutable retry graph preservation,
  ordinary fourth-retry rejection, explicit grant/revoke and complete rollback.
  Runtime/UI integration, full migration registration and verified identity
  application are unfinished; do not release draft files with the price fix.

- Live whole-trade correction acceptance exposed stale Analyzer linkage. Owner
  confirms both named accounts contain disposable fake trades and permits all
  normal test edits. Corrected only the selected test trade's two prices through
  review/confirm; dates, times and quantities unchanged. The saved trade updated,
  but its Analyzer still showed pre-edit mismatch evidence after app reload.
  Exact before/after values remain in this owner task, not the release handoff.
- Source reproduced the omission: per-execution corrections rebuild their chain,
  then the final account rebuild can be already_current and contribute no IDs.
  Include the explicitly edited trade ID alongside final rebuilt IDs when facts
  changed; deduplicate and leave unrelated already-current trades out. No-op
  edits do not add an ID. Three focused orchestration cases pass; both changed
  TypeScript files lint clean. Hosted correction-to-analysis verification remains
  open; do not infer that unit proof establishes the full live flow.
- Retry-window correction is live per coordinator at
  7fec32217ac69fec89dd2398c13dc5c1de38865f, Railway
  dd3896b1-63b5-417f-a49c-2f13692c6d64 SUCCESS, health ready/121.
  0136_shared_trade_analyzer_owner_exemptions is exclusively allocated for
  the two-account exemption; no source migration or hosted application yet.

- Dependent retry-window correction: history acquisition uses the immutable
  active manual-retry request timestamp, falling back to the original job date.
  Existing job identity, original creation time, caps and saved analysis remain
  unchanged. Two focused suites / nine tests pass, including an old job explicitly
  refreshed now and an expired original request making zero acquisitions.
  Coordinator reports 47cf0b82589b5cb69554e0742d0c4acb7d70dcef live and healthy;
  older GCDT refresh remains paused until this dependent correction is deployed.
- Owner requires existing Demo analyzed trades to demonstrate the updated
  Analyzer. Derived-result refresh and rendered Demo verification remain open;
  preserve pack v12, fixed date, execution facts, P/L and opt-outs. No Demo data
  application has occurred in this checkpoint.

- Header correction released by coordinator at 6a35d65d752f9665a2349b12ec03835ac364d5e8,
  Railway 2bd70d14-5b7d-4f02-8e15-2fc667193d0a SUCCESS; health ready/121.
  Same FFAI popup POST now returns 200/queued, one allowance reservation
  10 to 9 daily and 96 to 95 period. Subsequent result became HTTP 404; no resubmit.
- Confirmed read route suppressed terminal/correction outcomes and old ready
  results lacked an indicator refresh action. Announced exact correction to owner:
  expose existing outcomes and allow explicit older-indicator refresh without
  changing trade facts, keeping saved revisions and existing free retry caps.
  Source correction complete; 28 tests across four focused suites pass and
  changed-file lint has zero errors. Actual GET tests cover pending, unavailable
  provider, missing coverage, expired, execution mismatch and absent result.
  Repository/selection tests protect completed modern results, explicit older
  refresh only, duplicate queue identity and capped/free retry accounting.
  Help is aligned. No local server/build or additional provider request.
  Coordinator full type/build/release gate and live recheck remain required.
- Actual This Guy Chrome: seven Day sidebar pages load without app errors.
  Both saved GCDT Session Tracker and combined Trend & Momentum remain rendered
  after genuinely offline reloads (navigator.onLine false); combined page shows
  Offline and all 72 table headers. Network and viewport restored afterward.
- Owner added required Demo refresh/acceptance; source materializer located.
  Demo source/derived-data update is not yet implemented or verified.

- Owner supplied a normal production Chrome session: This Guy, Discord signed
  in, Primary Journal. Account page shows Moomoo Connected; execution imports are
  disabled and unchanged. Connection badge is not provider-success evidence.
- Saved GCDT analysis opens and clearly identifies its older indicator history.
  September 4 FFAI explicit Analyze returned HTTP 400 twice, with unchanged
  allowance (10 daily / 96 period). Browser evidence identifies the wrong
  Journal mutation header; the endpoint requires the Platform mutation header.
  Coordinator confirms both requests reached production and failed immediately.
- Corrected only the popup's request-header import/use; bulk Workspace already
  uses the correct header. Server authentication and mutation checks unchanged.
  Three focused Vitest cases pass: both callers match the endpoint contract,
  and the server accepts Platform but rejects Journal-only mutation requests.
  Temporary dependency junction was removed after the single-worker test.
- Primary-session browser checks: 5-minute selector updates its URL; section help
  opens by keyboard without collapsing the section; all 72 table headings have
  explanation controls; mobile document width matches viewport content width.
  Optional Analytics rejected to dismiss blocking notice; no analytics enabled.
- Offline emulation did not survive in-app-browser reload (online became true),
  so that attempt is NOT an offline acceptance pass. Network and viewport restored.
- Pending: coordinator release of header fix, live request/provider/retry and
  independent numeric calibration, full rendered/offline acceptance. No migration,
  provider configuration, Swing, financial calculation or Watchlist change.

- Coordinator reports production source ade1375505482a2aefc870cb33eaf3d427283be4,
  deployment 5266f140-84b4-4d1b-a805-14a8489c3d6e SUCCESS, one running instance,
  original volume, 121 migrations through 0135, maintenance absent and both
  app/proxy health ready. Both migration backups restore-verified by coordinator.
- Test-only correction c2b56a0b5f744733c7e9482ba29a7278f603a31a changes exactly
  32 owned test files: node:test registration becomes Vitest; two mock fixtures
  use vi.spyOn with afterEach restoreAllMocks. All 723 assertion-bearing lines
  are unchanged. No product behavior or fixture values changed.
- Repository-config Vitest, jsdom, one worker, no file parallelism: narrow 32
  files/146 tests pass; complete owned set 33 files/148 tests pass. The final
  type-only mock casts were followed by a passing two-file/five-test rerun.
  Targeted lint has zero errors; two changed mock roots pass TypeScript.
- Live browser successfully loaded production Trend & Momentum. Signed-in
  profile is TradersLink / local development owner, Primary account, not This
  Guy. Two older saved analyses have no new indicator context; this is not
  evidence of a new provider-generation failure or successful calibration.
- Keyboard Enter opens section help without collapsing its expanded section.
  Navy Dark mobile viewport probe measured document width equal to viewport
  content width (375px), with 72 table headings and 90 explanation buttons.
  Cookie-consent dialog obscures the lower screen and blocked a selector check.
  No consent, appearance, account, authentication or delivery settings changed.
- Complete Light/touch/offline/PWA/performance and This Guy provider/corpus
  acceptance are NOT passed. Coordinator explicitly retained that separate
  boundary; no alternate identity, second-writer database mutation or provider
  requests were used to bypass it. No product changes are authorized by findings.
- Cleanup: temporary node_modules junction removed without deleting the shared
  installed dependencies; browser viewport reset and temporary tab closed.
  Normal page viewing may update ordinary read-only PWA page caches. No trade
  data was added/edited/deleted and no persistent test settings remain.
- Test correction is local only; no push, deployment or migration by this task.

## Final source release handoff

- Final changed-slice checkpoint: 32 Node test files, 146 tests pass, zero failed
  or skipped. Source checks remain separate from real provider/browser proof.
- Coordinator confirmed existing owner production authorization, so no repeated
  permission question is required. Staging stays untouched. Final handoff is
  release-ready for coordinator reconciliation/build/CI and guarded migrations,
  not a claim that deployment or full product acceptance already happened.
- Coordinator must preserve backup/rollback and one-writer boundaries; afterward
  this task owns approved This Guy corpus/provider and rendered acceptance.

## Post-retry regression and scale checkpoint

- Complete focused Trend & Momentum run: 27 files, 124 tests passed at bab42b4cc
  using a single 512-MB Node process; no local server or live provider request.
- Added a separate 500-saved-trade/10,000-execution projection fixture. Six
  aggregate tests pass. Counts reconcile to 500 trades and P/L is included once
  per trade; chart arrays and duplicate execution-context arrays stay excluded.
  Synthetic serialized payload is 5,085,362 bytes. This is measured scale evidence,
  not a mobile-transfer or real full-history payload performance approval.
- Static presentation matrix now includes long/short, 1m/5m, Net reporting,
  offline, reclaim and interim-closure selections. Every rendered table heading
  retains its explanation control; reclaim never displays a biased return rate.
  Static markup is not keyboard, touch or visual browser acceptance.
- Reviewed outcome/condition/supporting-table copy against count, P/L, returned-
  candle direction and completed-candle timestamp contracts. Existing population
  explanations remain; full rendered-copy and interactive acceptance are open.
- Coordinator confirmed normal staging is reserved for Coach/Communities.
  Continue source/disposable acceptance only. Hosted acceptance must use a later
  owner-authorized isolated preview or guarded production release; do not alter
  staging or apply 0134/0135 now. No new owner decision is needed for local work.

## Bounded free retry source checkpoint

- Added coordinator-allocated 0135 source-only migration for durable manual
  requests, free acquisition attribution and request-specific history receipts.
  Original paid reservations and completed 0134 evidence are preserved.
- Selection/worker accounting supports three provider-backed retries per stable
  account/trade/New York day across corrections. Saved-only analysis bypasses
  paid allowance and retry caps; queued correction waivers no longer reduce the
  displayed allowance. Existing provider pacing/global caps remain.
- Corrected Workspace, individual Analyzer and post-entry selection gates that blocked free cached
  analysis at zero allowance; selection no longer previews an assumed charge.
  Added retry-limit copy and aligned Help. No Swing Tracker changes.
- 25 focused tests pass across retry/selection/storage/worker coverage, including
  real-SQL requeue identity preservation, duplicate queue rejection and separate
  free history acquisitions without altering the original charge. These are
  disposable fixtures, not live-provider proof.
- Changed implementation roots pass TypeScript in bounded groups (11 roots,
  followed by the added panel and two retry test roots); lint has zero errors.
  Workspace library retains two pre-existing warnings outside changed logic.
  Source verifier passes all 121 migrations ending at 0135. Help is aligned.
- Full rendered acceptance, live calibration and broader goal remain open.
  No persistent migration, live provider call, push or deployment. Swing Tracker
  review is deferred until the current Day Analyzer work is finished.

## Available-session download implementation

- Worker now separates required first-result coverage from download coverage.
  When core candles need fetching, requests 04:00 through the latest completed
  minute capped at 20:00 New York. Persists that requested/downloaded boundary
  consistently in session evidence and indicator-history request receipts.
- Keeps sufficient cached first-result coverage on the zero-provider path.
  Readiness still uses the original final-exit-plus-30-minute policy; no formula,
  execution timestamp, user allowance or fixed study endpoint was changed.
- Five focused worker tests pass, including before-close evening, after-close,
  historical day, saved-cache reuse and prior multi-cycle/history behavior.
  Changed worker/test roots have zero TypeScript diagnostics. Tests use provider
  fixtures, not live Moomoo evidence. Live-provider and wider regression remain.
- Updated candle Help to explain the new download policy and saved-data reuse.
- Free manual-retry limit remains unfinished; no migration, provider request,
  user-data write, push or deployment performed in this slice.

## Owner resolves retry and corpus choices

- Owner explicitly reconfirmed authorization for This Guy and its saved trades.
  Removed that decision as an active blocker; no new private reads in this turn.
- Owner approved free retries with a limit and free saved-data-only analysis,
  including the first analysis. Announced a default of three manual provider
  retries per saved trade/New York day, excluding saved-only reruns.
- Owner also approved fetching the available full extended session when a
  download is required, instead of ending the download at exit plus 30 minutes.
- Updated the controlling plan with accounting, stable identity, atomic cap,
  measurement-window preservation and exact verification requirements.
- Current source already has correction-waived acquisition accounting. It does
  not yet implement the new bounded manual-retry contract. Earlier handoff's
  unanswered-choice text is superseded; implementation/acceptance gates remain.
- No application, billing, migration or hosted changes made in this policy update.

## Candidate handoff, not release readiness - 2026-09-13

- Captured clean source/docs candidate 53d9e73b4 relative to f97ab1cee and its
  complete 112-file Git allowlist in the linked candidate handoff. This later
  handoff and plan/progress updates are separately identified documentation.
- Explicitly recorded retry decision, private-corpus identity, real calibration,
  payload/copy/browser/CI acceptance and separate owner/release gates as open.
  Did not collapse the objective to the tested source subset or sum overlapping
  test runs as unique coverage. No coordinator dispatch or hosted operation.
- Last turn revalidated the retry issue but received no owner answers. This turn
  completed the safe handoff preparation without changing billing or accessing
  the unconfirmed private corpus. Final allowlist/SHA must be refreshed at release.

## Tooltip source inventory checkpoint - 2026-09-13

- Indexed all 19 changed TSX files and their explanation ownership in the
  [tooltip source inventory](trade-analyzer-tooltip-source-inventory.md).
  Recorded exact-template locations, dynamic variants and current static proof.
- Full inline extraction exceeded Windows command argument length before write;
  used a compact index without raising resource limits or creating temp files.
- Index explicitly leaves per-card/column rendered-copy reconciliation and
  actual keyboard/touch/theme/offline acceptance open. No new completeness claim.
- Documentation only; no redundant tests, provider call or hosted operation.

## Individual section help and shared disclosure - 2026-09-13

- Continued tooltip audit found the individual Trend & Momentum card also put
  its help button inside AccordionSummary. Extracted the prior corrected wrapper
  into AnalyzerDisclosureSection and used it in both individual/combined views.
  Preserved content, exact help text, selected execution and default expansion.
- Reporting/presentation: eight tests pass, including individual 1m/5m markup
  without nested buttons and help controls on every rendered table heading in
  the default combined page (more than 50 headings). This does not establish
  complete tooltip-copy inventory or every view's browser behavior.
- Five changed source/test roots: zero TypeScript diagnostics and zero targeted
  lint errors/warnings. React skill review: module-scope reusable component,
  unconditional hooks, stable useId, functional state update, direct imports,
  no new fetch/effect or serialization. No new dependency or local server.
- Help text unchanged. Full copy inventory, actual touch/keyboard/visual and
  offline browser acceptance remain open, along with hosted calibration and
  the previously recorded retry-accounting decision. No hosted actions.

## Section help markup correction - 2026-09-13

- Tooltip audit found seven help IconButtons nested inside AccordionSummary
  buttons, confirmed in rendered static markup. Event propagation guards do
  not make nested buttons valid HTML.
- Replaced only this page's local Section wrapper with a themed outlined Paper,
  native heading toggle and separate sibling help control. All titles, help
  text, children and default-expanded behavior remain. Added useId-based
  aria-controls/labelled regions and a visible keyboard-focus outline.
- Presentation/during-study: 10 tests passed, including zero nested buttons,
  seven expanded controls with corresponding regions, and existing URL/data
  behavior. Targeted Next lint: zero errors/warnings. No local server used.
- Used Next.js skill hydration guidance and installed use-client documentation;
  no server/client boundary or data contract changed. Help content unchanged.
- Actual keyboard/touch, Light/Navy Dark/mobile visual acceptance and the full
  per-page tooltip inventory remain open. Static markup is not browser proof.
- No provider call, hosted write, migration, push or deployment.

## Numerical acceptance scale and sparse-bucket checks - 2026-09-13

- Reused the existing independent closed-form EMA and Wilder RSI references;
  the convergence test alone is not independent formula verification.
- Added 1m/5m price-scale checks at 0.001, 0.1, 10 and 100 factors. EMA/VWAP
  scale with prices while RSI remains invariant; warm-up nulls remain null.
  Prices and volumes use a consistent adjustment basis. This does not verify
  actual provider split flags or normalize mixed adjusted/unadjusted data.
- Added sparse 5m observations with alternate empty buckets: exact returned
  bucket times, completion times and counts, and identical numerical values
  to the equivalent sequence of observed closes. No empty candles invented.
- Foundation plus convergence: 16 tests passed in one 512-MB process; diff
  whitespace check passed. No runtime/UI edits, provider requests or charges.
- Live provider/reference comparison and actual rendered acceptance are still
  open. This evidence does not replace those requirements. Help unchanged.

## Aggregate payload duplication check - 2026-09-13

- Removed the unused second execution-context array from newly built aggregate
  trade rows; execution records retain their complete context. Kept the empty
  array shape for compatibility and left saved individual analyses unchanged.
- Regression fixture verifies 40 executions still count as one trade with one
  P/L result, without serializing the duplicate context. Existing offline
  identity and landmark behavior remains covered.
- Six focused files passed 29 tests in one 512-MB process; whitespace check
  passed. This is not a full payload-scale or rendered browser acceptance.
- No visible copy or interaction changed; Help needs no additional update for
  this optimization. No provider calls, hosted writes, migration or deployment.

## Combined source checkpoint and lint cleanup - 2026-09-13

- Final rerun: all 31 scoped trend-momentum/saved-trade/provider-coverage files,
  125 tests passed with zero failures/skips in one 512-MB process. Static
  migration-file verification passed for 120 registered entries; none applied.
- Project Next lint rules on all 107 changed TS/TSX files: zero errors, one
  inherited unused TradeOutcomeSummary warning, confirmed present at base.
  Fixed owned fixture unused variables, literal request typing and intentionally
  partial render-fixture cast. No production validation was weakened.
- Fixed chart effect's missing theme-mode dependency. Read lightweight-charts
  skill fully; verified installed 5.2.0 typings and existing chart.remove cleanup.
  No new chart API, polling or layout introduced. Theme interaction still needs
  actual rendered acceptance. Help inspected; no new user-facing behavior/copy.
- Initial combined type check found fixture errors plus missing Vitest globals.
  Corrected fixtures. Including all Vitest types with all source exceeded the
  768-MB cap; did not raise it. Sequential split: 106 changed roots with zero
  diagnostics, then the migration test with real Vitest globals and zero
  diagnostics. This checks changed-root diagnostics, not full application build.
- Only pre-existing unused-component warning remains; dashboard-template's
  previously recorded inherited failures are not reclassified as passes.
  Full goal remains open: retry semantics awaiting owner choice, designated-user
  corpus authorization, numerical/provider calibration, remaining integrated
  UI/payload acceptance, browser Light/Navy Dark/mobile/PWA, release handoff.
- No local server, provider request, production write, push or deployment.

## Shared-connection identity and calibration boundary - 2026-09-13

- Read-only production check confirmed the configured shared Moomoo user differs
  from the single active journal_administration grant user. The grant user has
  no Moomoo connection; the designated user has an active quote:read connection,
  but its stored access-token expiry does not cover the next five minutes.
- Reported the two human-readable account labels privately to the owner for
  confirmation. No identifiers, credentials or private trade data from the
  designated user were read or exported. No designation was changed.
- Earlier two-record corpus is explicitly the operator-grant user's corpus,
  not proof of the real owner's complete personal trade history. Do not expand
  private-corpus reads to the designated user without confirming authorization.
- Normal access service refreshes expiring credentials and persists the result.
  Do not invoke it against a read-only connection and risk refreshing before
  persistence fails. Testing needs the established single-writer refresh path,
  not an improvised credential update or configuration change.
- No provider request, token refresh, service restart, migration or deployment
  performed. Calibration awaits account confirmation/normal credential access;
  retry-accounting choice and remaining source/browser gates remain open.

## Current owner corpus revalidation - 2026-09-13

- Confirmed production SSH works with Node v24.21.0. Explicit production
  service still reports source f97ab1ceecf30c411d605f1dd5ed3af31246dead.
- Opened configured SQLite with readonly/fileMustExist and query_only; required
  exactly one active journal_administration owner grant. Limited current ready
  logical records to 20 and each candle payload to 2 MB; matched active logical
  membership version and current saved analysis revision.
- Only two records returned: 445 candles/2 executions and 52 candles/2 executions.
  Both lack new trendMomentum results, as expected on the deployed baseline.
  Saved candle shape includes turnoverDecimal and lossless decimal OHLCV.
- Independently queried at most 20 owner-only historical ready round-trip
  analysis revisions: zero returned. No historical legacy sample can be assumed
  available. No private IDs, prices or execution times returned in this audit.
- This is corpus-availability evidence, not numerical or broad acceptance.
  Next calibration must use authorized bounded Moomoo history and/or explicit
  test/Demo fixtures. No writes, provider calls, deployment or migration ran.
- Retry allowance choice remains with the owner; no accounting/schema changes
  made while awaiting it. Continue independent goal work meanwhile.

## Terminal-card alignment and retry trace - 2026-09-13

- Added a client-safe shared availability-message function. Terminal trade card
  and logical-trade failure notice now use identical approved no-coverage versus
  provider-failure copy. Pending remains collecting; unknown statuses retain the
  neutral fallback. The existing usable-analysis branch is unchanged.
- Two focused notice/architecture checks pass, including shared-message equality
  and pending/unknown wording. Four selected TypeScript roots have zero diagnostics.
  Help updated. No runtime request, hosted mutation, server or migration.
- Confirmed manual retry defect: selection.alreadyRequested excludes terminal
  failures, but repository.queue returns any existing version/window job without
  checking terminal status. select then returns already_requested instead of
  requeueing. A correction/new trade version is a distinct accepted request.
  Internal reschedule/claim recovery reuses the same job. reserve creates a new
  reservation, but cached runs may have no reservation, so it alone cannot be
  the universal notification request identity.
- Next retry work must preserve bounded allowance accounting and append-only
  request evidence, distinguish explicit resubmission from worker retries, and
  test dedup/outcome changes. Do not claim that a notification-key-only change
  fixes queue behavior. Reserved 0134 currently contains history receipts only;
  any added persistence must be reviewed against its registration/verification.

## Failure-notice and preference audit - 2026-09-13

- Found and removed a notification-service mutation that automatically enabled
  broker-connection email after shared Moomoo failure. The existing scoped
  notification creation remains; saved delivery preferences are no longer changed.
- Passed the worker's existing no-coverage/provider-unavailable distinction to
  the failure notice. Uses the approved neutral insufficient-candle wording or
  retrieval-failure wording, never inferring proven low volume from missing bars.
- Five focused tests pass: wording, an AST guard against notification preference
  writes, and worker pending/history-failure/success behavior. Three selected
  TypeScript roots have zero diagnostics. AST guard is architectural evidence,
  not a live email-delivery test. No hosted actions or notification sent.
- Dedup currently uses logicalTradeVersionId and kind. Repository queue reuses
  the same job for a version/window; claimNext can requeue terminal failures
  when shared-session evidence becomes ready. Therefore do not change dedup to
  attemptCount or jobId without tracing manual request identity. New user-request
  retry and meaningful-outcome-change requirements remain open, as does terminal
  card copy alignment. Core-analysis preservation is covered by worker tests.
- Help reviewed: current provider/coverage explanations remain accurate; no new
  user controls. Full browser/corpus/source/release acceptance remains pending.

## Until-position-closure presentation - 2026-09-13

- Plan section at lines 483 onward required closing-fill movement independently
  of fixed horizons. Source already saved it, but the page did not display it.
  Added a first-event summary with measured/unavailable counts and mean raw
  percentage movement; recorded events show closing time and per-share/% move.
- Shared validity check rejects absent/nonfinite measurements and closing times
  not strictly after the selected event. Reclaim uses its own saved anchor;
  missing older evidence never borrows a loss measurement. Raw price direction
  is retained for shorts; whole-trade financial calculations are unchanged.
- Nineteen focused during-study, episode and reporting tests pass, including
  static rendered labels, currency handling, independent anchors and missing
  measurements. Three selected TypeScript roots have zero diagnostics. Help
  updated. Desktop/mobile themed browser acceptance remains unproven.
- Nothing deployed, no provider request or local server. Continue with the
  full remaining plan: notification/availability audit, historical calibration,
  final source/payload and rendered acceptance, then narrow release handoff.

## During-trade supporting navigation - 2026-09-13

- Confirmed Analyzed Trades previously interpreted every indicator query as
  an execution comparison. Added explicit during-study selection and links
  from matching/nonmatching/unknown groups, preserving direction, timeframe,
  event, reference, same-event conditions and earlier-history coverage.
- The list uses the same first-event study function as the table, counts each
  saved trade once and explains inclusion. Pagination signatures include the
  during selection; changed conditions cannot reuse an earlier cursor.
  Execution links explicitly clear the during marker when switching studies.
- Eleven focused index/during tests pass: first versus later event, missing
  context, incomplete history, independent reclaim, timeframe isolation,
  pagination, existing execution filters and offline privacy. Five selected
  TypeScript roots have zero diagnostics. Updated Help; reviewed TSX changes
  using React guidance. Actual online click-through/browser acceptance remains
  unproven. No server, new market-data request, deployment or migration.
- Previous-turn saved-trade regression also passed all 24 movement/filter,
  period, Day-summary and allocation-backed Scaling tests. Full goal remains
  active, including remaining outcomes, corpus and final acceptance gates.

## Offline selection restoration checkpoint - 2026-09-13

- Confirmed the offline client previously initialized comparison/filter state
  with an empty query, losing the choices present when the view was saved.
  Added a canonical allowlist of categorical selections to captures and seeded
  offline controls from it. Existing captures remain compatible. Private IDs,
  cursors, free text and unknown URL keys are never copied into this field.
- Trend, execution, landmark, Room After Entry and pattern controls reuse the
  existing local query state. No added polling, provider call, effect or server.
  Reviewed the three TSX changes using React state/serialization guidance.
- Twelve focused selection, redaction, evidence and during-study tests pass.
  Six selected TypeScript roots have zero diagnostics. This is not a full-app
  typecheck or actual browser/PWA reopen acceptance; those gates remain open.
- Help now explains restored choices and backward-compatible defaults. The
  full plan remains active; nothing published and migration 0134 unapplied.

## Combined regression and production identity checkpoint - 2026-09-13

- Ran all 28 `trend-momentum*.test.ts` / `saved-trade*.test.ts` files under
  `src/lib/trade-candle-analysis` and `src/modules/level-analysis/server` in one
  512-MB Node process: **113 tests passed, zero failures/skips**. Includes
  foundation/convergence, history/storage/worker, grouped SQL/allocation,
  filtering/pagination, offline redaction, reporting and static rendering.
  This is the scoped feature checkpoint, not full application or browser QA.
- Used installed Next's server-side empty module for the test-process-only
  `server-only` marker mapping. No dependency or production alias changed.
- Revalidated Railway project `TraderLink Platform`, explicit production
  environment, service `traderlink-platform-web-restore-0909`: SSH reports
  `f97ab1ceecf30c411d605f1dd5ed3af31246dead`, the assigned implementation base.
  This proves deployed source identity only, not health or branch configuration.
  No local link, variables, restart, build, migration or deployment action.
- The worktree was unlinked; resolved the project/environment/service through
  read-only CLI inventory. SSH needed installed Git's SSH client added only to
  the command process PATH. No machine-wide PATH or SSH configuration changed.
- Current remaining acceptance work: during-group supporting-trade navigation
  and outcome presentation; offline selection capture/restore; terminal-data
  notification coverage/dedup audit; owner/test historical corpus calibration
  with bounded Moomoo history; full focused type/lint/build checkpoint and
  populated desktop/mobile Light/Navy Dark/browser acceptance. The controlling
  plan remains the full target, including reserved unapplied 0134 and separate
  production release authority. The previous anonymous two-record feasibility
  sample is not broad calibration. No fresh candle request or DB read this turn.

## During-trade conditions and event controls - 2026-09-13

- Added loss/reclaim event selection and combined same-observation EMA,
  RSI, VWAP, spacing and close-vs-EMA20 conditions. First recorded event is
  selected across all cycles before filtering; later matches never replace it.
  Matching/nonmatching/unknown context groups remain separate within complete
  versus incomplete first-event history. Missing position cycles cannot prove
  no event; fully observed no-event and unknown-presence counts are separate.
- Connected the existing themed During the trade section to the new groups,
  financial comparison table, selected-event follow-through and occurrence
  pagination. URL state uses separate during-condition keys; offline local
  query changes use the same calculation with no provider requests. Loss-only
  recovery rates exclude unknown outcomes; reclaim-only samples show no rate.
  Occurrences, unique saved trades and held-position counts are distinguished.
- Eighteen focused during/episode/analytics tests pass, including static HTML
  rendering of reclaim controls and missing history. Four selected source/UI/
  test TypeScript roots have zero diagnostics. Help instructions updated.
- Static render is not browser acceptance: actual control interaction, mobile,
  Light/Navy Dark, offline capture/restoration and full current-page evidence
  pagination still need final checks. Supporting trade links for during groups,
  remaining outcome presentation, provider/corpus calibration and the full
  acceptance/release gates remain open. No local server or hosted action.

## Independently anchored reclaim evidence - 2026-09-13

- Added optional saved reclaim-study evidence: exact observed reclaim time and
  price, same-observation EMA/RSI context and VWAP side, its own 5/15/30/60-minute
  endpoints and until-position-closure change. Loss follow-through is unchanged.
- Reused the existing context calculation/policies only at episode observations;
  no second indicator formula, provider call, AI request or full per-bar context
  payload was introduced. Reporting converts new price-valued fields while
  preserving RSI, percentages, direction labels and timestamps.
- First-reclaim selection sorts observed reclaims across every saved-trade
  position cycle before condition filtering. Older saved episodes without the
  added context remain the first observation with missing context; a later
  occurrence cannot silently replace them. Optional fields preserve old reads.
- Seventeen focused episode/analytics/reporting tests pass, including independent
  loss/reclaim endpoints, exact closure, interruption, missing older context,
  multi-cycle selection and currency conversion. Six selected TypeScript roots
  have zero diagnostics; whitespace check passes.
- UI event selector, combined during-trade conditions, complete/unknown event
  presence and headline/occurrence presentation remain next. No visible card
  layout changed, so Help UI instructions stay unchanged until that integration.
  Remaining final goal/acceptance gates are still open. Nothing deployed.

## Allocation-backed Scaling verification - 2026-09-13

- Added real SQLite allocation-join tests for long and short grouped-trade
  comparisons. One member contributes actual Gross P/L of 1 versus -2 at its
  later exit; another contributes 5. Verified whole-trade totals are 6 versus
  3, retaining exactly 3 of additional loss avoided, without counting the
  second member's unchanged result as protection.
- Verified other-account/workspace reads, changed execution versions,
  snapshot price mismatch, later adds and incomplete allocated quantities
  cannot establish a comparison. Eight SQL plus scaling-math tests pass;
  the new test's selected TypeScript diagnostic count is zero.
- Standalone Node did not resolve Next's `server-only` marker. The test
  process mapped only that marker to installed Next's compiled server-side
  empty module. All Journal queries, Decimal arithmetic and SQLite execution
  remained real. No source alias, dependency installation or app setting changed.
- Next feature gap confirmed against plan sections 317-319 and 377 onward:
  during-trade UI currently selects losses only. Reclaim-specific follow-through,
  same-observation combined filters and no-event versus unknown presence still
  need implementation. Existing loss episode/recovery calculations must remain
  intact; first event must be selected before conditions, across all cycles.
  Full scenario integration, provider/corpus calibration, rendered acceptance
  and final release gates remain pending. Nothing deployed or applied.

## Scaling secondary saved-trade projection - 2026-09-13

- Replaced scenario-page secondary Scaling behavior and meaningful-profit
  rows with combined saved-trade scenarios/P&L and canonical saved IDs.
  Qualification, fee completeness and two-cent reconciliation are preserved.
  No-scale/red-finish summaries consume those same corrected rows.
- For exactly one partial exit, the existing Journal allocation verifier finds
  its supporting member. Only one verified comparison is accepted. Its exact
  cash-flow difference is retained while actual/counterfactual totals include
  the complete saved trade. Multiple partial exits and ambiguous comparisons
  remain unavailable; no Journal writer or counterfactual fee model changed.
- Scenario price projections now require matching reporting multipliers across
  all members instead of scaling every member with the first member's rate.
- Nine focused scaling/date/Day tests pass, including missing Net facts,
  reconciliation, duplicate IDs and all three comparison outcome types.
  Type-check found and corrected a nullable-scenario guard. Final three-root
  recheck has zero diagnostics. Help updated. No production or provider actions.
- Still required: real allocation-backed integration test for a combined trade,
  final grouped-scenario regression, populated offline/browser acceptance,
  remaining during-trade feature work, provider/corpus calibration and all
  final goal/release gates. This is not a completion or release-ready claim.

## Scenario-page final-close selection correction - 2026-09-13

- Confirmed Green-to-Red and Scaling Out fetched date-filtered round trips
  before assembling saved trades, losing earlier members of included trades.
  Both now retain all members and apply the selected period to the saved
  trade's final close in the scenario reader. Scenario math is unchanged.
- Page empty-state/coverage/direction counts now use current saved-trade
  results, so ready grouped analyses are not hidden by a zero legacy count.
  The existing secondary legacy rows remain date-bounded until their separate
  migration, rather than accidentally expanding to all dates with the fetch.
- Ten focused date/Day/SQL tests pass. Four selected source/page/test TypeScript
  roots pass for the date and coverage wiring. The subsequent small scenario
  fallback guard requires combined final-checkpoint regression: pending/stale
  logical results no longer fall back, and standalone candidates must match
  the current member version. No browser acceptance or release claim.
  Help explains the final-close behavior.
- Confirmed Scaling behavior still uses legacy `joined` rows. Its profit
  protection comparison calls a Journal helper scoped to one round trip and
  supports exactly one partial exit followed by compatible later allocations.
  Preserve that evidence contract when moving the cards to saved-trade rows;
  do not substitute a member's result for the grouped trade or fabricate a
  counterfactual. This is the next identity correction, not a completed slice.

## Day displayed-summary correction - 2026-09-13

- Confirmed and replaced the Day page's round-trip-derived displayed trade
  count, execution count, coverage, direction counts, P/L and average return
  with the current saved-trade population. Fetch retains every member before
  final-close selection. The existing card layout and offline model fields
  remain unchanged; the server sends the corrected values to both.
- Meaningful-profit count uses saved-trade scenarios within that same selected
  population, deduplicated by saved ID. Existing qualification, two-cent
  financial reconciliation and Net fee-completeness rules are preserved.
- Preserved the old reader's candle-backed readiness boundary in the shared
  population: current grouped results require saved candle evidence; standalone
  legacy results require an execution snapshot linked to their saved candle
  session. Added a real SQLite regression for missing evidence.
- Ten focused Day/population/SQL tests pass; six selected source/page/test
  TypeScript roots have zero diagnostics. Diff whitespace check passes.
  Help now explains saved-trade weighting and final-close date selection.
- This corrects the Day fields actually displayed, not every legacy unused
  model field. Green-to-Red/Scaling ancillary summaries and date selection,
  remaining during-trade controls, corpus/provider calibration, populated
  browser/offline acceptance and final release gates remain outstanding.
  No local server, hosted writes, migration application or deployment.

## Saved-population SQL checkpoint - 2026-09-13

- Added four disposable in-memory SQLite integration tests using the real
  Journal logical-trade and Analyzer repository readers, without repository
  mocks. These exercise query contracts, not full migration constraints.
- Verified two members produce one saved trade with combined P/L, current
  analysis revision, first entry/final close and final-close date selection.
  Missing members and other account/workspace scopes cannot enter the result.
- Verified pending/stale/missing grouped results cannot fall back to ready
  member analyses. Standalone legacy results must match the current member
  version and a ready analysis revision. Missing P/L stays unavailable.
- All six tests in the SQL plus existing population-service checkpoint pass.
  No production database, provider or deployment action was performed.
- Remaining identity audit confirmed Day still receives round-trip-based
  coverage, average return and profit-capture totals from the legacy `joined`
  population. Its indicator coverage alone uses saved trades. Do not fix only
  the displayed count: migrate its complete displayed summary together.
  Green-to-Red and Scaling primary scenario populations already use saved
  trades; preserve those while checking their ancillary summaries/date bounds.
  This checkpoint does not complete the goal or establish browser acceptance.

## Analyzed Trades saved identity and condition restoration - 2026-09-13

- Confirmed the index and API were still round-trip-only. Connected both to
  the shared current saved-trade population, without doing pattern extraction
  for index requests. Whole-trade result, first entry/final close, execution
  count and canonical trade ID stay together; grouped members do not become
  separate index rows. Date selection retains all members of an included trade.
- Trend condition groups link to the matching/nonmatching/unknown trade list.
  Index requests restore timeframe, execution kind, direction and conditions;
  the banner and per-row explanation identify the inclusion reason. The full
  analysis link focuses a supporting execution and retains its timeframe.
- Added plain trader-facing tooltips to every labeled index column. Offline
  preserves the selection explanation but strips IDs/cursors; capture identity
  includes conditions. Updated Help and removed a stale description of a
  30-minute column that was already absent from the inspected index.
- Eighteen focused index/cohort/analytics/pattern tests pass. Nine selected
  source/UI/API TypeScript roots pass. Shared indicator records now require
  exact execution timestamp binding, with a regression for mismatched context.
- Still pending: populated browser/index/API acceptance, shared legacy-reader
  SQL integration, remaining Day/other aggregate identity audit, remaining
  during-trade comparisons, provider calibration and full final goal gates.
  Nothing was published and no database/provider action was performed.

## Candle Patterns page/evidence integration - 2026-09-13

- Connected page summaries and occurrence API to the shared saved-trade
  population, selecting complete trades by final close and using whole-trade
  reporting results once per comparison row. Visible P/L coverage distinguishes
  missing results from losing trades. Interim flat executions have their own label.
- Added shared EMA/RSI controls to pattern rankings, comparison rows and server
  evidence requests. Pattern timeframe and timing labels remain unchanged.
  Drawer identity resets with selection; aborted responses cannot overwrite it.
- Evidence pages default to 25 with 10/25/50/100 supported, full matching totals,
  and cursors bound to scope/selection/result revisions. Exact occurrence refs
  reject changed revisions. Replay carries its saved analysis revision and must
  match the occurrence; mixed reporting rates cannot produce a misleading chart.
- Offline saved observations redact trade/member/execution/revision/compound IDs
  while keeping context and grouped financial identity usable. Twelve focused
  pattern/service/evidence/filter tests pass; eleven selected source/UI/route
  TypeScript roots pass. Help updated. No provider or hosted action occurred.
- Still required: actual route/browser/replay acceptance and population/payload
  scaling checks, legacy single-member source SQL integration proof, broader
  Analyzer trade-identity audit, remaining Trend comparisons and final goal gates.
  Source integration is not production or visual acceptance.

## Candle Patterns canonical source boundary - 2026-09-13

- Verified both current pattern summaries and the occurrence API still read
  per-round-trip results. Added their shared replacement saved-trade population
  reader; it is not yet wired into the page/API. The complete integration,
  including replay revision checks, is required before acceptance.
- Reader selects complete saved day trades by final close, binds patterns to
  the exact current analysis revision, preserves whole-trade selected P/L and
  null financial coverage, and allows only current single-member compatibility.
  Pending grouped analyses cannot substitute separate member snapshots.
- Projection preserves pattern timing/location, rejects future/unavailable
  patterns, distinguishes missing indicator context, and deduplicates canonical
  trade P/L within each comparison group while retaining individual occurrences.
- Eight focused pattern/projection/reader/movement tests pass. Four selected
  source TypeScript roots pass. Existing Help unchanged because no new pattern
  page control is live yet; update it with the page/API integration. No migration,
  provider request, local server or hosted action.

## Room After Entry indicator filters - 2026-09-12

- Added one shared EMA-alignment/RSI-band filter over the saved execution
  capsules. Cards, comparisons, timed paths and measured rows use its same
  selected population. Required missing context stays separate from a mismatch;
  default Any preserves existing observations. Coverage deduplicates executions
  across movement rows and four timed windows, separately by direction.
- Online controls preserve selections in the URL; offline controls filter the
  already-saved model locally. No extra candle or AI request. One-/five-minute
  selection changes indicator context only, never movement candle resolution.
- Eleven focused movement/filter/service tests pass including rendered control
  labels, timeframe isolation, grouping, timing and missing-data behavior.
  Help describes whole-page versus table-local filters. Real browser interaction
  and offline acceptance remain pending; this is not a release-ready claim.

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
