# Trader Intelligence Plan Index

**Last updated:** 2026-05-16
**Purpose:** Keep Trader Intelligence planning organized so future Codex runs
can find the right plan, continue the current work, and avoid drifting into old
prototype docs.

## Instructions For Future Codex

Start here after reading `src/docs/codex-project-log.md`.

The root `plan.md` points here as the app-level plan entry point.

Fresh-chat handoff for the current UI/product resume point:

- `src/docs/trader-intelligence-new-chat-handoff-2026-05-16.md`

This file is the map. It is not the detailed work plan. Use it to decide which
planning file controls the next implementation run.

Default resume order:

1. Read the latest entry in `src/docs/codex-project-log.md`.
2. Read this index.
3. Open the active top-level plan for broad context.
4. Open the current detailed plan named under `Current active batch`.
5. Open the current next-run execution plan when one is listed.
6. If the active batch points to a specific feature, also open that feature
   plan.
7. If plans conflict, use this order: newest project-log entry, current
   next-run execution plan, current detailed plan, active top-level plan, then
   route-specific feature plans.
8. Work from the plan without asking for another planning confirmation unless a
   real blocker appears.
9. Update the project log after meaningful implementation.
10. Update this index when a plan is created, retired, replaced, or changes
   status.

When the user explicitly asks to review the plans, do one full cross-plan audit
before saying the plans are ready. Check the active detailed plan, active
top-level plan, feature plans listed below, root `plan.md`, and the latest
project-log entry for contradictions, stale active-batch wording, missing
implementation artifacts, route coverage gaps, and copy-safety loopholes.

Create a new separate feature plan when:

- a route or feature needs its own acceptance criteria,
- the top-level plan is getting too large,
- the feature has a distinct product loop or verification ladder,
- lessons from one route should be reused later on another route,
- the next implementation work would otherwise be buried in the project log.

Do not create a new plan for tiny TODOs. Put those in the active plan or the
project log. A good feature plan should include:

- purpose,
- primary route or module,
- user questions,
- current known direction,
- product rules,
- implementation runs,
- acceptance criteria,
- verification commands,
- relationship to the active top-level plan.

When creating a new plan:

1. Name it clearly with the feature and date.
2. Add it to this index.
3. Link it from the top-level plan if it changes future execution order.
4. Add a short project-log entry explaining why it exists.

## Current Active Work

Active top-level plan:

- `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`

Current active batch:

- **Post-Hardening Product Presentation And Evidence Polish Batch**
- Current detailed plan:
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
- Evidence-gating reference:
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
- Current next-run execution plan:
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
- Current continuation route order:
  completed detection inventory -> completed initial behavior
  contract/registry/mapper -> completed `/coach` first slice -> completed
  next-run Block 1 leak search -> completed Block 2 contract/evidence-channel
  hardening -> completed Block 3 certified strengths -> completed route-family
  behavior-language hardening -> completed decision-review level-context
  fixture correction -> completed import decision-review evidence-label pass ->
  completed ticker-story surfacing in coach/analytics/progress -> completed
  first certified market-context contracts for support/resistance,
  post-exit-continuation, and chart-backed add-weakness findings -> completed
  first same-symbol thread-story hardening for explicit story kinds, repeated
  losing attempts, profit-giveback gating, and safer chart-context evidence
  labels -> completed first session-story hardening for green-to-red sessions,
  many attempts on one ticker, high trade-count sessions, open/swing exposure,
  positive controlled sessions, and mixed session review -> completed first
  chart-context finding bridge through saved trade threads, review queue,
  trade detail, analytics, coach, progress, and saved trades -> completed
  add-quality prompt/certification split, adverse-add/dip-buy ambiguity
  downgrade, route handoffs for add quality, and saved thread counts for
  add-quality/post-exit/level/volume evidence -> completed post-exit/volume
  risk-strength-prompt splits, profit-protection after-exit evidence surfacing,
  volume risk/strength card selection, beginner-readable after-exit/volume
  route copy, and confusing-phrase Playwright guards -> completed after-exit
  certification gating, prompt-only missing/oversized after-exit findings, and
  add-repair rule language -> completed support/resistance-aware exit
  contracts and first-entry versus re-entry volume comparison -> completed
  route handoffs for those certified findings through priority chart findings,
  support/resistance exit counters, trade-detail chart handoff anchors,
  `/review` chart handoff links, `/trades` support/resistance exit filtering,
  and analytics/coach/progress support-resistance exit metrics -> completed
  protected-profit-before-fade certification, duplicate generic fade
  suppression, saved-thread counts, and analytics/coach/progress/saved-trades/
  trade-detail route handoffs -> completed strength-to-repeat session-story
  classification/counters/evidence, `/review` and `/trades/[tradeId]`
  session-story handoffs, protected-profit route wording cleanup, and
  adverse-add repair/dip-buy copy tightening -> continue with analytics/coach
  polish, visual/mobile polish -> completed `/trades` and
  `/trades/[tradeId]` first workflow-polish pass for saved-trade browsing,
  trade-card review reasons, trade-detail workflow handoff, lower-section label
  cleanup, and analytics trade-detail anchor repairs -> completed deeper coach
  lower-page reduction, coach next-session plan, coach evidence-card question
  structure, and trade-detail supporting-details collapse -> completed
  screenshot-guided saved-trades pagination, saved-trade range copy, softened
  `Why review this` block, and `/analytics` ticker-story summary/evidence-count
  collapse -> completed shared mobile `DashboardSideNav` collapse, `/review`
  queue first-batch limit and mobile tab compaction, `/progress` chart evidence
  collapse, and progress workflow title cleanup -> completed import-flow trust
  polish for `/import-dry-run`, `/imports`, and `/imports/[batchId]` shared
  labels, save/saved-import wording, lighter panels, and copy-safety guards ->
  completed `/workspace` visual-system migration, shared workflow handoff,
  saved-import workspace wording, route anchors, and `/coach`/dashboard old-card
  visual-system cleanup -> completed workspace core app-area demotion,
  workspace next-review anchor handoff, and coach positive-evidence
  `Review first` split -> completed route screenshot QA for workspace
  beta/admin-note collapse, trader-readable workflow copy, and shared
  user-facing trade-symbol display for import-ID-like labels -> completed
  `/analytics` behavior report grouping for resistance entries,
  support-based entries, chase/extension review, dip-buy/add review,
  profit protection, level-based exits, and volume/re-entry review -> completed
  shared `/coach` Behavior Coaching Map reuse of that certified report for
  fix-first, repeat-first, and needs-review grouping, but user QA says the
  coach UI now looks too much like duplicated analytics cards -> next coach
  run should redesign the behavior section into a coach-specific sequence while
  keeping the shared report as the evidence source -> continue with focused
  coach behavior-section redesign -> completed May 11 product clarity pass:
  `/coach` now uses the shared certified report to render a distinct guided
  `Behavior Coaching Sequence`, `/review` queue cards are task-first with
  evidence counts collapsed, `/trades/[tradeId]` leads with
  `Replay, decide, write, then continue`, active waiting-chart labels use
  `Chart data still missing`, and sell-starting items use
  `Limited sell-side review` copy -> completed route copy/anchor QA:
  chart-context-waiting language is replaced by chart-data wording across
  shared helpers and touched routes, coach progress links land on
  `/progress#progress-follow-through`, and Playwright bans the stale phrase ->
  completed first positive constructive-management storylines:
  `balanced_management_with_constructive_exit` and
  `add_into_strength_with_constructive_final_exit` now map through decision
  review, the user-facing registry, saved trade threads, and the analytics
  behavior report as combined-evidence repeatable strengths -> completed
  beginner-to-advanced import IA and analytics category access: `/imports` and
  `/imports/[batchId]` now keep import state, repairs, saved trades, decisions,
  and next actions primary while hiding batch IDs, mapping confidence, write
  safety, quality breakdowns, reconstruction previews, duplicate internals,
  and chart-review counts behind advanced disclosures; `/analytics` now exposes
  Results, Timing, Behavior, Ticker Stories, Session Stories, and Chart Evidence
  category access -> completed focused import wording and chart-language polish:
  `/imports/[batchId]` uses `Saved Import` / `Import Details`, `/imports` uses
  `Imports To Finish`, `/import-dry-run` keeps P/L/cost and mapping/calibration
  details behind advanced disclosures, and primary routes use chart data/evidence
  wording instead of visible chart-context phrasing -> completed final PR
  screenshot/copy QA: all ten requested routes were reviewed, `/import-dry-run`
  was the only route with a concrete issue, and its primary summary now uses
  `Rows To Fix` / `Import Check` instead of mapping confidence / `Copy Audit`
  while keeping mapping confidence in technical import setup details -> completed
  minimal end-user upload start: `/upload-csv` is the normal one-card CSV upload
  entry, broker choice stays automatic, the upload result now stays on the page
  with a saved/duplicate/needs-attention alert and an import-detail action, and
  `/imports/[batchId]` keeps automatically skipped informational row notices out
  of default repair actions while retaining them behind advanced import details
  -> completed saved-import chart-data resume: `/imports/[batchId]` tells the
  user when chart evidence is still loading, advanced chart/import details expose
  `Resume chart data review`, and limited resume runs leave unprocessed
  chart-review jobs queued instead of marking them skipped
  -> completed saved-trades day-session hierarchy and replay marker polish:
  `/trades` now defaults to Day Sessions, day cards open ticker-story drilldown,
  individual flat-to-flat cards remain Round Trips, `/trades/[tradeId]` has a
  Day Session -> Ticker Story -> Round Trip context trail, and clustered
  execution labels use a readable execution strip under the candle chart
  -> continue
  with focused screenshot fixes only if new concrete route issues appear,
  inspect only genuinely distinct constructive-management variants if saved
  evidence can certify them without broader claims, or use the normalized
  analytics conclusions plan when timing/session feedback risks overstating raw
  total P/L without sample-size, average, median, win-rate, and outlier context.
- Next continuous implementation run scope: work from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
  The completed route-family language and mapper pass should be preserved, not
  restarted. The next implementation must start from that plan's **Required
  Long-Run Batch Shape** and **Next Run Phase Plan** sections, not only the
  short next-block summary. The next coding run should chain a coherent
  route/evidence slice, focused verification, at least one independent second
  slice, broader verification when code changes require it, and docs/logs
  before final response. Current best slices are focused beginner-to-advanced
  route fixes only if screenshot/browser QA finds a concrete issue,
  particularly around `/workspace`, `/analytics`, `/progress`, or saved-trade
  handoffs, a follow-up constructive-management variant only when saved
  evidence proves it, or the normalized analytics conclusions slice when timing
  feedback needs statistical/outlier context before broad user-facing claims.
  Do not
  redo the completed import IA disclosure pass, import wording/advanced-detail
  polish, final import summary-card fix, minimal upload route/result-alert fix,
  saved-import chart-data resume,
  saved-trades day-session hierarchy and replay marker polish,
  dedicated ticker-story drilldown route,
  ticker-story hold-continuation classification and section,
  saved-trades month calendar view,
  review-queue chart-data waiting labels,
  analytics category-access pass,
  `/workspace` visual-system migration, `/coach` old-card cleanup, May 11 coach
  behavior sequence, review queue task-card simplification, sell-starting
  limitation copy, workspace chart-data wording, route copy/anchor repairs,
  trade-detail replay/decide/write flow, or the completed constructive
  management storylines unless QA finds a concrete regression.
- Current resume point: the shared behavior contract carries opportunity type
  and evidence channel, current execution-only risks/strengths/review prompts
  have mapper coverage, first market-context support/resistance contracts are
  certified in the mapper, decision-review evidence labels are trader-readable
  by default, the broad user-facing behavior/trader-analytics/coaching suite
  passes, the decision-review support/resistance scenarios are green, and
  import dry-run plus main app desktop Playwright regressions pass. Same-symbol
  thread stories now have explicit story kinds, repeated losing attempts no
  longer masquerade as profit giveback, touched route copy uses plain user
  language, session stories now surface execution-only full-day review, and
  product-safe chart evidence findings now flow through saved trade threads,
  review queue, trade detail, analytics, coach, progress, and saved trades.
  Adverse-add execution-only detections now stay as review prompts until
  chart data proves weak-add risk or constructive-add strength. Saved thread
  read models expose add-quality, post-exit, level, and volume evidence counts.
  Post-exit and volume findings now split risk, strength, and review prompts;
  profit-protection findings surface as after-exit evidence; and core route
  copy-safety blocks confusing terms such as "risk-backed," "strength-backed,"
  "post-exit checks," and visible hyphenated "chart-context" wording.
  After-exit continuation certification is now gated behind safe post-exit
  candles, while missing or oversized after-exit cases stay prompt-only. The
  next run should not rebuild ticker stories, the first session-story layer,
  the chart evidence finding bridge, the add-quality split, the first
  post-exit/volume evidence hardening pass, or the after-exit certification
  gate. Support/resistance-aware exit behavior and first-entry versus re-entry
  volume comparison are now also implemented and verified. The route handoff
  pass for those certified findings is complete too: saved trade threads expose
  priority chart findings and support/resistance exit counters, trade detail
  has a chart handoff anchor, review queue chart evidence links to that anchor,
  saved trades has a support/resistance exit filter, and analytics/coach/progress
  show separate support/resistance exit metrics. It should focus on the next
  independent slice. Profit-protection-before-fade behavior is now complete:
  it requires capture plus measured after-exit fade evidence, suppresses the
  generic duplicate fade card, and has dedicated saved-thread counts and route
  handoffs. Strength-to-repeat session stories are now also complete for
  green sessions with certified chart/level/volume/after-exit strengths, and
  `/review` plus `/trades/[tradeId]` have session-story handoffs. Adverse-add
  coaching copy now explicitly separates execution-only adds from proven bad
  dip buys and uses "Require Repair Before Adding Size" for the visible rule.
  Historical level context is now an explicit guardrail:
  `src/docs/trader-intelligence-historical-level-context-audit-2026-05-10.md`
  records that levels-system owns historical no-lookahead level calculation and
  Trader Intelligence consumes per-execution historical relation facts for
  app-facing review.
  The first coach/analytics presentation-polish pass is also complete: shared
  workflow handoff cards exist, `/coach` has an explicit coach -> evidence ->
  review -> progress flow, `/analytics` chart mode is grouped by outcome,
  timing, and behavior with red/green/amber meaning, `/progress` has a workflow
  handoff, and adverse-add primary labels now say `Review adds that need chart
  data` / `Adds Needing Review`.
  The first screenshot-guided visual/mobile polish pass is complete too:
  shared dashboard surfaces are lighter, metric cards are shorter, chart bars
  use cleaner red/green semantics, `/review` no longer exposes raw trade IDs
  in the Review Flow links, analytics/progress report history labels are
  user-facing, and visible hyphenated `chart-context` wording was removed.
  The first `/trades` and `/trades/[tradeId]` workflow-polish pass is complete:
  saved trades now explain the browse workflow and current view, trade cards
  show `Why review this`, trade detail has a four-step review-flow handoff,
  lower trade-detail section labels are more user-facing, and analytics links
  land on useful trade-detail anchors. The deeper `/coach` lower-page
  reduction is now complete too: the main coach page has a `Before Next
  Session` plan, evidence cards answer what happened / why it mattered / what
  to do next, duplicate coach details are collapsed, and trade detail now
  collapses optional score explanation, supporting evidence, behavior
  timeline, similar trades, and journal prompts. The screenshot-led follow-up
  is also complete: `/trades` paginates saved trade cards 18 at a time and
  `/analytics` lower ticker-story evidence counts are collapsed behind a
  trader-readable summary. The review/progress mobile-density pass is also
  complete: mobile page menus collapse, `/review` queue lanes are more compact,
  the queue shows the first batch of cards, and `/progress` detailed chart
  evidence counts are collapsed. Import-flow trust polish is also complete for
  shared state labels, save/saved-import wording, lighter panels, and
  copy-safety guards. The `/workspace` visual-system migration and `/coach`
  old-card cleanup are also complete, with workspace workflow handoffs,
  saved-import wording, route anchors, dashboard-scoped old-card cleanup, and
  Playwright visual-surface guards. The workspace route-handoff and coach
  review-first split are complete too: primary workspace app areas now focus on
  the core loop, secondary review tools are collapsed, the next-review tile
  lands on an actual review anchor, and profitable coach evidence says
  `Review first` instead of `Fix first`. The route screenshot QA and
  trade-label copy slice is complete too: workspace beta/admin notes are
  collapsed, the workspace flow title is trader-readable, and
  coach/trade-detail/session-story surfaces hide import-ID-like labels behind
  `Selected trade`. The analytics behavior report grouping slice is complete:
  `/analytics` now groups certified market-context findings into resistance
  entries, support-based entries, chase/extension review, dip-buy/add review,
  profit protection, level-based exits, and volume/re-entry review without
  adding route-local detection logic. The coach behavior-map reuse slice is
  complete too: `/coach` consumes the same shared behavior report as a
  coaching map with fix-first, repeat-first, and needs-review framing. User QA
  found that the coach version was too visually and structurally close to
  analytics, so the follow-up transformed that same evidence into a guided
  coaching sequence instead of broad report cards. That
  coach-specific transformation is now complete: `/coach` defaults to the
  guided sequence while the old map stays in supporting details, `/review`
  reads like a work queue with collapsed diagnostics, `/trades/[tradeId]`
  leads with a replay/decide/write/continue loop, waiting-chart labels use
  simpler chart-data copy, and sell-starting items use limited sell-side
  review language. The route copy/anchor QA pass is now complete too:
  chart-context-waiting copy is replaced with chart-data wording, coach
  progress links land on the follow-through anchor, and the stale phrase is
  covered by Playwright. The first positive constructive-management storylines
  are complete too: `balanced_management_with_constructive_exit` and
  `add_into_strength_with_constructive_final_exit` now surface as
  combined-evidence strengths through decision review, saved threads, and the
  analytics behavior report. The refreshed suggestions-file route hierarchy is
  now implemented and polished for the current import/analytics slice:
  `/imports` and `/imports/[batchId]` default to beginner-safe import state,
  repair, save, saved-trade, and next-action surfaces, while technical
  import/chart details stay behind advanced disclosures; `/analytics` adds
  explicit category access for Results, Timing, Behavior, Ticker Stories,
  Session Stories, and Chart Evidence; `/imports/[batchId]` uses
  `Saved Import` / `Import Details`; `/imports` uses `Imports To Finish`; and
  `/import-dry-run` keeps P/L/cost and mapping/calibration details behind
  advanced disclosures. The final PR screenshot/copy QA pass is also complete:
  all ten requested routes were reviewed, and the only concrete route issue was
  `/import-dry-run` still showing mapping confidence / `Copy Audit` in primary
  summary cards; the default summary now uses `Rows To Fix` and `Import Check`
  while mapping confidence remains behind technical import setup details.
  The minimal end-user upload start is complete too: `/upload-csv` is the
  normal one-card CSV upload entry, broker detection is automatic, upload
  results now show a saved/duplicate/needs-attention alert before the user opens
  import details, and automatically skipped informational rows are no longer
  shown as default repair work on `/imports/[batchId]`. Saved imports now also
  expose a demoted `Resume chart data review` action in advanced chart/import
  details, and limited resume runs leave remaining chart-review jobs queued
  instead of marking them skipped. The review queue and analytics/coach summary
  strips now distinguish user review work (`Needs Your Review`) from queued
  chart-data work (`Chart Data Waiting`), and `/upload-csv` starts one small
  chart-data resume pass after save without blocking the upload result.
  Continue with focused screenshot fixes only if new concrete route issues
  appear, extend constructive-management coverage only when saved evidence can
  certify a genuinely distinct deterministic variant, or work the normalized
  analytics conclusions plan when raw total P/L could produce misleading
  timing/session feedback.
  Uncertain behavior must become a review prompt or stay internal. The next run
  must not stop after one verified slice; it must keep
  going through the next safe route or behavior family.
- Primary goal: preserve the beginner-first CSV-to-insight flow from the
  refreshed suggestions doc while keeping advanced end-user evidence available
  behind disclosures and keeping any new behavior family gated by the
  detection/language plan.
- Evidence model: use
  `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md` to
  decide whether a coaching opportunity is execution-only, market-context,
  combined, risk-to-reduce, or strength-to-repeat.
- Continuous-run rule: do not stop after one route-sized improvement if the
  active plan's ladder still has safe, independent work remaining. Park isolated
  blockers in the project log and continue to the next ladder step unless the
  blocker affects architecture, saved data safety, or verification reliability.
- Verification rule: Codex verifies its own work. A passing focused test,
  typecheck, build, or route smoke is a checkpoint to keep going, not a reason
  to ask the user to review. Work -> verify -> continue until the current
  batch completion target or a true global stop condition is reached.
- Anti-short-run rule: do not stop after one mapper contract, one read-model
  change, one route panel, one green focused test, or one docs update. Use
  those as save points and continue to the next independent phase unless a
  true global stop condition appears.

Do not start another planning pass before implementation unless the repo state
changes materially or a global blocker appears.

## Active Feature Plans

Use these as route context during the current post-hardening presentation and
evidence polish batch.

| Feature | Plan | Use When |
| --- | --- | --- |
| Next Continuous Implementation Run | `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md` | Use when the user says to proceed and Codex needs a long autonomous ladder covering contract hardening, strengths, route wiring, market-context gates, tests, verification, and docs. |
| Detection And Language Hardening | `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md` | A user-facing behavior claim is uncertain, not certified, unclear, or using internal language. Use as the evidence-gating reference for new behavior families; do not redo completed baseline hardening slices. |
| Coaching Evidence Model | `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md` | Use whenever deciding whether a coaching opportunity is based on execution evidence, chart/levels market context, or both. Also use when deciding whether a finding is a risk to reduce or a strength to repeat. |
| Coach | `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md` | Use for lower-page readability, certified evidence presentation, visual rhythm, mobile polish, and advanced-section demotion. Do not redo the completed overall-focus, evidence-trade handoff, review-completion follow-through, or adverse-add wording passes unless a regression is found. |
| Analytics | `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md` | Use for lower-page report polish, self-review deep dives, chart/drill-down refinement, and mobile/visual cleanup. Do not rebuild the completed top report, section navigation, saved-data counts, or certified read-model counters unless they regress. |
| Normalized Analytics Conclusions | `src/docs/trader-intelligence-normalized-analytics-conclusions-plan-2026-05-12.md` | Use when analytics or coaching feedback might overstate raw total P/L, especially timing/session/hour feedback where sample size, average outcome, median result, win rate, or one large outlier changes the conclusion. |
| Review Queue | `src/docs/trader-intelligence-review-queue-continuous-product-plan-2026-05-09.md` | Use for queue card density, missing anchors, mobile tab reduction, and route-specific copy regressions. Do not rebuild the completed first review card, lane language, session-story handoff, chart-evidence handoff, or coach/progress loop unless a regression is found. |
| Progress | `src/docs/trader-intelligence-progress-continuous-product-plan-2026-05-09.md` | Use for deeper trend modeling, visual polish, and strength/risk follow-through once enough review history exists. Do not redo imported-vs-reviewed separation, active focus handoff, ticker/session story counters, or current insufficient-data honesty unless they regress. |
| Behavior Language Audit | `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md` | Supporting audit for unclear wording and label replacement. Use with the active detection/language hardening plan. |
| Historical Level Context Audit | `src/docs/trader-intelligence-historical-level-context-audit-2026-05-10.md` | Use before adding or changing support/resistance, chart-context, candle-window, volume, or after-exit behavior claims for imported historical trades. |

Future likely feature plans to create when needed:

- `trader-intelligence-trades-browser-continuous-product-plan-YYYY-MM-DD.md`
  for `/trades` browsing, filters, ticker-story grouping, repeated-symbol
  explanation, open/swing views, and dense saved-data navigation.
- `trader-intelligence-trade-detail-continuous-product-plan-YYYY-MM-DD.md`
  for `/trades/[tradeId]` replay, writing flow, evidence, notes, similar
  trades, and chart evidence review.
- `trader-intelligence-import-flow-continuous-product-plan-YYYY-MM-DD.md`
  for `/import-dry-run`, `/imports`, repair/save flow, import trust, and
  user-facing CSV state language.
- `trader-intelligence-visual-system-continuous-product-plan-YYYY-MM-DD.md`
  for shared colors, charts, cards, left navigation, responsive layout, and
  copy-safety UI patterns.

Create these only when the active top-level or next-run plan is no longer
specific enough for the implementation run. The current next-run plan already
contains controlling route blocks for `/trades` and `/trades/[tradeId]`, so do
not pause to create those feature plans before implementing Blocks 4 and 8.

## Planning Method And Operating Docs

- `plan.md`
  Root app-level entry point that links to this index and the active detection
  hardening priority.

- `src/docs/how_to_create_plan_to_work_continuously.md`
  Explains how to build a durable plan for long Codex runs.

- `src/docs/nextjs-local-docs-guide.md`
  Records the project-specific Next.js local docs path and fallback procedure.
  Read this before changing Next.js route, layout, caching, or server/client
  component behavior.

- `src/docs/codex-project-log.md`
  Chronological implementation log and resume point. Always read this first.

- `src/docs/2026-05-08-trader-intelligence-new-user-ux-qc-roadmap.md`
  New-user UX/QC roadmap that originally clarified the product translation
  direction.

- `src/docs/future-app-surface-plan.md`
  High-level app surface plan. Use for route/surface context, not as the active
  implementation plan.

- `src/docs/trader-intelligence-ui-change-summary-and-next-steps-2026-05-16.md`
  Compact summary of the recent UI/product IA work across workspace, upload,
  imports, trades, trade detail, analytics, coach, and remaining UX priorities.
  Read this before asking Codex to redo route hierarchy, dashboard, or
  beginner-to-advanced UI work.

- `src/docs/trader-intelligence-new-chat-handoff-2026-05-16.md`
  Fresh-chat resume note for the latest UI state, including the swing-trades
  product decision, completed UI work to preserve, verification commands, and
  the recommended next screenshot-led UI review pass.

## Current Product Context

Use these as context, not as the active execution plan:

- `src/docs/competitor-dashboard-research-2026-05-09.md`
  Dashboard inspiration and competitor research.

- `src/docs/trader-intelligence-end-user-ui-overhaul-plan-2026-05-08.md`
  Earlier broad UI overhaul plan.

- `src/docs/trader-intelligence-user-facing-review-summary-implementation.md`
  User-facing review summary work and product translation layer context.

- `src/docs/behavior-coverage-audit.md`
  Behavior coverage and downstream coaching readiness audit.

- `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`
  Pattern catalog. Important reminder: it describes facts/structure, not
  coaching conclusions.

## Historical Or Completed Prototype Plans

These docs may contain useful details, but many describe completed prototype,
fixture, or earlier productization work. Do not treat them as the current next
step unless the project log or active plan points here.

- `src/docs/trader-coach-action-loop-plan.md`
- `src/docs/trader-review-habit-loop-plan.md`
- `src/docs/trader-analytics-reports-plan.md`
- `src/docs/end-user-analytics-product-expansion-plan.md`
- `src/docs/end-user-trader-analytics-product-roadmap.md`
- `src/docs/end-user-productization-implementation-plan.md`
- `src/docs/end-user-workflow-productization-plan.md`
- `src/docs/end-user-execution-import-and-storage-plan.md`
- `src/docs/end-user-database-schema-plan.md`
- `src/docs/persistence-read-model-and-import-commit-plan-2026-05-07.md`

## Operational And QA Plans

Use these when the active implementation needs verification, import trust, or
runtime/candle context.

- `src/docs/trader-app-feature-regression-qa-plan.md`
- `src/docs/trader-app-acceptance-testing-plan.md`
- `src/docs/trader-first-user-and-hardening-test-plan.md`
- `src/docs/trader-actual-app-qa-and-visual-regression-plan.md`
- `src/docs/trader-import-automated-qa-harness-plan.md`
- `src/docs/trader-candle-runtime-operator-guide-2026-05-07.md`
- `src/docs/market-data-policy-status-2026-05-06.md`
- `src/docs/candle-warehouse-basis-policy-design-2026-05-06.md`
- `src/docs/trader-intelligence-historical-level-context-audit-2026-05-10.md`

## Maintenance Rules

- Keep this index short enough to scan.
- Do not list every doc unless it helps future work selection.
- Mark the active top-level plan and active batch clearly.
- If a plan becomes historical, say so here rather than deleting it.
- If a feature plan becomes active, update both this index and the project log.
- If two plans conflict, use the precedence order near the top of this file:
  newest project-log entry, current next-run execution plan, current detailed
  plan, active top-level plan, then route-specific feature plans. Patch the
  stale plan or this index so the next run does not need to rediscover the
  conflict.
