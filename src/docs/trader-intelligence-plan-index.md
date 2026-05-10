# Trader Intelligence Plan Index

**Last updated:** 2026-05-10
**Purpose:** Keep Trader Intelligence planning organized so future Codex runs
can find the right plan, continue the current work, and avoid drifting into old
prototype docs.

## Instructions For Future Codex

Start here after reading `src/docs/codex-project-log.md`.

The root `plan.md` points here as the app-level plan entry point.

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
  polish, visual/mobile polish, or another market-context family only when
  saved evidence can prove it.
- Next continuous implementation run scope: work from
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
  The completed route-family language and mapper pass should be preserved, not
  restarted. The next implementation must start from that plan's **Required
  Long-Run Batch Shape** and **Next Run Phase Plan** sections, not only the
  short next-block summary. The next coding run should chain a coherent
  route/evidence slice, focused verification, at least one independent second
  slice, broader verification when code changes require it, and docs/logs
  before final response. Current best slices are analytics/coach presentation
  polish, visual/mobile polish, route anchor/copy repairs, or a new
  market-context family only when saved evidence proves it.
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
  product-safe chart-context findings now flow through saved trade threads,
  review queue, trade detail, analytics, coach, progress, and saved trades.
  Adverse-add execution-only detections now stay as review prompts until
  chart context proves weak-add risk or constructive-add strength. Saved thread
  read models expose add-quality, post-exit, level, and volume evidence counts.
  Post-exit and volume findings now split risk, strength, and review prompts;
  profit-protection findings surface as after-exit evidence; and core route
  copy-safety blocks confusing terms such as "risk-backed," "strength-backed,"
  "post-exit checks," and visible hyphenated "chart-context" wording.
  After-exit continuation certification is now gated behind safe post-exit
  candles, while missing or oversized after-exit cases stay prompt-only. The
  next run should not rebuild ticker stories, the first session-story layer,
  the chart-context finding bridge, the add-quality split, the first
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
  context` / `Adds Needing Review`.
  The first screenshot-guided visual/mobile polish pass is complete too:
  shared dashboard surfaces are lighter, metric cards are shorter, chart bars
  use cleaner red/green semantics, `/review` no longer exposes raw trade IDs
  in the Review Flow links, analytics/progress report history labels are
  user-facing, and visible hyphenated `chart-context` wording was removed.
  Continue with `/trades` and `/trades/[tradeId]` detail polish, deeper
  `/coach` lower-page reduction after route tests are ready for collapsed
  support panels, route copy/anchor repairs found by QA, or another
  market-context family only when saved evidence can prove it.
  Uncertain behavior must become a review prompt or stay internal. The next run
  must not stop after one verified slice; it must keep
  going through the next safe route or behavior family.
- Primary goal: improve coach/analytics/review/progress presentation using the
  certified detection contracts already built, while keeping any new behavior
  family gated by the detection/language plan.
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
  trades, and chart-context review.
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
