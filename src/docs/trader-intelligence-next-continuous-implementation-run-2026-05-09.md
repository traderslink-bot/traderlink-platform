# Trader Intelligence Next Continuous Implementation Run

**Date:** 2026-05-10
**Status:** Active next-run execution plan
**Use after:** `src/docs/codex-project-log.md`,
`src/docs/trader-intelligence-plan-index.md`,
`src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`,
and
`src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`

## Purpose

This is the next long-run implementation plan. It exists so Codex can keep
working through multiple useful implementation slices without stopping after
one route, one label, or one small test.

The current product priority is not a new dashboard idea. It is making the app
trustworthy for a real trader:

1. Detect the behavior correctly.
2. Say it in trader-readable language.
3. Separate risk-to-reduce from strength-to-repeat.
4. Name the evidence channel.
5. Gate chart, support/resistance, volume, and post-exit claims behind real
   market-context data.
6. Wire the same product-safe language into coach, trade detail, review,
   analytics, progress, and saved trades.

## Current Known State

Completed in the prior implementation slice:

- A shared `src/lib/user-facing-behavior` contract, registry, mapper, and tests
  exist.
- The first coach/product-intelligence path uses the mapper for several primary
  behavior labels.
- Prompt-only behaviors no longer drive several primary coach, product
  intelligence, review-habit, and evidence-card conclusions.
- Focused mapper and coach/product tests pass.
- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes.

Completed in the latest continuation slice:

- Block 1 leak search was repeated across core user routes and product-layer
  copy. Remaining raw hits are limited to tests, debug/admin surfaces,
  fixtures, internal IDs, or expanded technical implementation files.
- Block 2 contract hardening is implemented in
  `src/lib/user-facing-behavior`: contracts now carry opportunity type and
  evidence channel, and unknown behavior still fails closed.
- Block 3 started with certified execution-only strengths, including clean
  entry/full exit, controlled scale-in, structured partial exits, early risk
  reduction, clean full exits, consistent sizing, and profitable reductions.
- Shared report and saved-trade selectors now map execution-feedback point
  labels through user-facing behavior contracts before they reach trade detail,
  review, analytics, progress, or saved-trades surfaces.
- Remaining awkward user labels such as "adverse add", "rapid-fire",
  "open leftover", and "decisive full exit" were replaced in primary product
  copy with trader-readable language.
- Behavior trend copy now handles risk reductions and strength increases
  correctly, so a positive habit that appears more often is described as
  improving rather than "less often".
- Focused Vitest, TypeScript, and production build all pass after the
  continuation slice.

Completed in the current implementation run:

- The route-family language hardening path now maps report, saved-trade,
  import preview, analytics chart, review queue, trade detail, and import
  diagnostic copy through product-safe language instead of raw engine labels.
- Execution-feedback behavior IDs now have a mapper regression matrix covering
  every current risk/strength/review-prompt ID that can surface in user-facing
  analytics and coaching read models.
- Prompt-only behaviors such as rapid execution clusters still map to review
  prompts and cannot drive primary conclusions.
- The stale decision-review sample scenarios were corrected to sit near the
  current deterministic daily/4h support and resistance levels, so the bridge
  and quality-dashboard tests again prove level-location insight coverage.
- The prior broad-suite issue is resolved:
  `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review`
  passes.
- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes.

Completed in the latest continuation run:

- Import dry-run decision-review evidence now shows trader-readable evidence
  chips by default, such as "Resistance strength: major" and
  "Later add location in recent range: 84.0%"; raw calculation strings remain
  available only inside collapsed calculation details.
- Saved import history and import-batch detail pages no longer surface raw
  commit/status strings in normal user copy.
- The same-symbol trade-thread read model is now surfaced in coach, analytics,
  and progress as "Ticker Story" context so repeated round trips, re-entries,
  open re-entries, profit giveback, and day-trade-to-swing cases have a
  product-safe place to appear without confusing flat-to-flat accounting.
- Decision-review and coaching copy was tightened from engine phrasing to
  trader-readable wording, including:
  - "limited clean room" -> "limited room before resistance"
  - "Profit protection failed" -> "Open profit was not protected"
  - "Trade-window movement was measured" -> "During-trade movement was measured"
  - "Adds increased risk into weakness" -> "Added before the trade repaired"
  - "Entry was not close to support" -> "Entry had little nearby support"
- `/analytics` restored the P/L-by-session chart inside the Charts menu so the
  report still covers P/L by trade, outcome mix, session, entry hour, and
  execution habits after the menu-based layout split.
- The shared user-facing behavior registry now includes the first certified
  market-context contracts for daily/4h support/resistance review:
  entry near resistance, limited room before resistance, entry near support,
  entry with little nearby support, post-exit continuation, and chart-backed
  add-repair risk. These contracts require market-context evidence and keep
  chart claims unavailable when that evidence is missing.
- Focused unit, broad library, TypeScript, production build, import dry-run
  Playwright, and main app Playwright desktop regression all pass after the
  continuation run.

Completed in the latest hardening checkpoint:

- Same-symbol ticker stories now carry explicit story kinds:
  single round trip, swing transition, open re-entry, profit giveback,
  re-entry added profit, repeated losing attempts, and multiple round trips.
- Repeated losing attempts no longer masquerade as profit giveback when the
  ticker story never had a positive P/L peak.
- Coach, analytics, progress, and saved trades use those explicit story kinds
  instead of loose P/L/lifecycle inference.
- Analytics and progress now expose repeated-loss story metrics.
- Saved chart-context insight titles in ticker-story evidence route through
  the user-facing behavior mapper before appearing in primary UI.
- Visible copy was tightened from internal wording to user language:
  `raw import panels` became `import review panels`, `trade-window` labels
  became `during-trade` labels, sell-starting records use
  `position-history review`, and sample coach copy says
  `Sample data until you save an import`.
- Focused saved-thread/user-facing behavior tests, TypeScript, production
  build, and focused app-feature Playwright regressions pass after this
  checkpoint.

Completed in the prior continuous implementation run:

- The saved trade-thread read model now builds session-level stories above
  same-symbol ticker stories. Session stories identify green-to-red sessions,
  many attempts on one ticker, high trade-count sessions, open/swing exposure
  needing hold review, positive controlled sessions, and mixed sessions.
- Session story claims are based on execution evidence only: saved round trips,
  trade order, same-symbol grouping, open/overnight lifecycle, symbol count,
  trade count, cumulative P/L peak, final P/L, and giveback from peak.
- The app now avoids emotional intent claims for repeated attempts. It uses
  trader-readable copy such as "Many attempts on one ticker" and "High
  trade-count session" instead of calling the behavior revenge trading.
- `/analytics` now shows a Session Story Analytics panel alongside ticker-story
  analytics.
- `/coach` now has a Session Story Coach panel so the coaching page can review
  the full trading day, not only one trade or one ticker.
- `/progress` now tracks session-story follow-through counts.
- `/trades` now has a Session Stories browse mode and a session-story panel.
- Focused saved-thread tests, TypeScript, production build, and focused
  desktop Playwright regressions for analytics/coach/trades/progress pass.

Completed in the latest continuous implementation run:

- Saved trade-thread read models now translate saved decision-review
  market-context insights into product-ready chart-context findings instead of
  exposing raw insight IDs, raw titles, or route-local strings.
- Chart-context findings now carry opportunity type, evidence channel, source,
  beginner-readable label, detail, review action, tone, and primary-conclusion
  eligibility.
- Short-specific chart-context findings fail closed in normal user routes.
- Prompt-only during-trade measurements remain visible as review prompts, not
  risk or strength conclusions.
- The product-safe chart-context bridge is now wired into:
  - `/trades/[tradeId]` Chart Context Review cards and advanced hidden-note
    summaries,
  - `/review` queue reasons and evidence split counts,
  - `/coach` ticker-story chart-context metrics,
  - `/analytics` ticker-story chart-context metrics,
  - `/progress` ticker-story chart-context metrics,
  - `/trades` browse filters, stats, and story cards.
- Analytics, coach, progress, review queue, saved-trades browse, and trade
  detail can now consume the same product-safe chart-context counts rather
  than each route inventing its own explanation.
- Verification passed for the focused mapper/thread suites, TypeScript,
  production build, and focused desktop Playwright route coverage.

Completed in the latest route-handoff run:

- Saved trade-thread read models now expose priority chart findings and
  explicit support/resistance exit counts:
  - `priorityMarketContextFindings`,
  - `exitLevelFindingCount`,
  - `exitLevelRiskCount`,
  - `exitLevelStrengthCount`,
  - `exitLevelReviewPromptCount`,
  - aggregate thread-with-exit-level counts.
- `/trades/[tradeId]` now has a chart-and-volume handoff for both single
  round-trip trades and multi-round-trip ticker stories when certified saved
  market-context findings exist.
- `/review` links chart evidence queue items to the trade page's chart handoff
  anchor and uses "chart or level findings" instead of the older "support
  panels" wording.
- `/analytics`, `/coach`, `/progress`, and `/trades` now separate
  support/resistance exit evidence from generic chart findings.
- `/analytics` adds "what to open next" handoffs for support/resistance exit,
  volume comparison, and after-exit review stories when those counts exist.
- `/trades` now has a direct support/resistance exit story filter and story
  badges.
- Focused saved-thread/mapper tests, broader behavior/analytics/user-facing
  review tests, TypeScript, production build, focused route Playwright, and
  full desktop app-feature Playwright all pass after this run.

Completed in the latest product hardening runs:

- Protected-profit-before-fade is certified only when captured profit and
  measured after-exit fade evidence agree. The route family now has dedicated
  counts and handoffs for this strength.
- Strength-to-repeat session stories are implemented for green sessions with
  certified chart/level/volume/after-exit strengths and no higher-priority
  open/swing, repeated-loss, or profit-giveback concern.
- `/review` and `/trades/[tradeId]` now include session-story handoffs so an
  individual trade review can show the broader trading-day story.
- Primary copy now uses "Protected Profit", "profit-protection strength", and
  "Require Repair Before Adding Size" instead of confusing hyphenated or
  command-like wording.
- Adverse-add execution-only evidence is explicitly neutral: it proves size was
  added after price moved against the position, but it cannot call that a bad
  dip buy or added risk unless chart/level context proves no repair or
  weakness.
- Historical support/resistance context has been audited. Trader Intelligence
  now maps local `executionLevelRelations` from levels-system's per-execution
  historical relation facts, so PatternInput/coaching consumes the
  as-of-the-fill context instead of a broader post-trade/current snapshot.
  See `src/docs/trader-intelligence-historical-level-context-audit-2026-05-10.md`.
- Coach/analytics presentation polish has started:
  - shared workflow handoff cards and lighter metric/chart/advanced panel
    surfaces exist,
  - `/coach` shows the coach -> evidence trade -> review queue -> progress
    path and uses `Fix First`, `Repeat First`, and `Review Next Trade`,
  - `/analytics` chart mode is grouped into outcome, timing, and behavior with
    red/green/amber meaning and chart-to-review workflow handoffs,
  - `/progress` has a workflow handoff back through coach, review, and
    analytics,
  - adverse-add execution-only primary labels now use `Review adds that need
    chart context` / `Adds Needing Review`.

Current remaining work:

- Continue from the next independent product slice rather than repeating the
  completed mapper/route-language, ticker-story, first session-story,
  chart-context bridge, support/resistance exit, re-entry volume comparison,
  protected-profit, strength-session, or adverse-add repair wording passes.
- The next high-value work is now one of:
  - screenshot-guided visual/mobile polish for `/coach`, `/analytics`,
    `/review`, `/progress`, `/trades`, and `/trades/[tradeId]`,
  - remaining coach/analytics lower-page presentation polish that consumes
    certified read-model counts and improves a real user-facing flow,
  - a new market-context behavior family only if saved chart, level, candle,
    volume, or after-exit evidence can prove it without inference,
  - route copy/anchor fixes discovered by browser QA.
- Continue route UI polish only when it consumes safe read models or when
  visual overflow/copy scan finds a concrete defect.

## Completed Block Tracker

Use this tracker to avoid restarting completed slices.

| Block | Status | Notes |
| --- | --- | --- |
| Block 1: leak search | Completed baseline | Re-run only as a quick safety scan before a new code batch. |
| Block 2: behavior contract | Completed baseline | Opportunity type, evidence channel, fail-closed behavior, mapper tests exist. |
| Block 3: certified strengths | Completed first slice | Execution-only strengths exist; add more only when evidence is clear. |
| Blocks 4-8: route family wiring | Completed baseline | Coach, trade detail, review, analytics, progress, and saved trades use product-safe language for current surfaced behavior. Revisit only to wire new certified behaviors or fix concrete defects. |
| Block 9: decision-review level-context failures | Completed | Old failures are resolved; treat new failures as regressions. |
| Block 10: copy safety | Completed first slice, ongoing guard | Existing tests cover mapper/route safety. Extend when new behavior families are added. |
| Block 11: visual smoke | Completed first slice, ongoing guard | Main desktop route regressions pass. Use browser checks after UI layout changes. |
| Blocks 12-13: verification/docs | Always required | Run after each multi-slice batch and update docs/log. |
| Next Block A: same-symbol/session behavior contracts | Completed first session-story slice | Ticker stories and session stories exist. Do not rebuild them; extend only for new certified behaviors or route handoffs. |
| Market-context read-model bridge | Completed first route-family slice | Product-safe chart-context findings now flow through saved trade threads, review queue, trade detail, analytics, coach, progress, and saved trades. Do not rebuild this bridge; extend it only for new evidence families. |
| Add-quality ambiguity split | Completed | Execution-only adverse adds stay prompt-only; chart-backed add risk now uses "Added before the trade repaired." Do not rebuild unless regression appears. |
| After-exit continuation gate | Completed | `exit_left_continuation` requires safe post-exit candles; missing or oversized after-exit evidence is prompt-only. Do not rebuild; extend only into distinct fade/relief behavior if evidence supports it. |
| Certified finding route handoffs | Completed | `priorityMarketContextFindings`, support/resistance exit counters, trade-detail chart handoff anchor, `/review` chart handoff links, `/trades` support/resistance exit filter, and analytics/coach/progress metric cards are complete. Do not rebuild unless a route regression appears. |
| Protected-profit before fade | Completed | Certified only with capture plus measured after-exit fade evidence; generic duplicate fade cards are suppressed. Do not rebuild unless regression appears. |
| Strength-to-repeat session stories | Completed | Green sessions with certified strengths now have session-story counts/evidence and `/review` plus trade-detail handoffs. Do not rebuild unless regression appears. |
| Historical level context handoff | Completed guardrail | levels-system owns historical as-of level calculation; Trader Intelligence consumes per-execution historical relation facts for app-facing review. Do not build new support/resistance claims from a current/live snapshot. |
| Coach/analytics first presentation polish | Completed first slice | Shared workflow handoff cards, lighter chart/metric surfaces, `/coach` workflow strip, `/analytics` outcome/timing/behavior chart grouping, `/progress` workflow handoff, and adverse-add primary-label cleanup are complete. Continue with screenshot QA and remaining lower-page polish, not a rebuild. |

## Next Continuous Run Starts Here

The next coding run should not redo the completed route-language,
ticker-story, first session-story setup, first chart-context finding bridge,
support/resistance exit behavior, re-entry volume comparison,
protected-profit-before-fade certification, strength-to-repeat session-story
handoffs, or adverse-add repair wording.
Start from this ladder and keep moving through independent slices until a true
global stop condition appears.

### Required Long-Run Batch Shape

The next implementation run must not treat "presentation polish" or
"market-context gates" as a single small task. It must run as a chained batch.

Minimum target before final response:

1. Re-run the quick copy/leak scan for primary user routes and the shared
   product layer.
2. Pick the highest-value active slice:
   - coach/analytics presentation polish using existing certified read models,
   - route-family visual/mobile polish,
   - a new certifiable market-context family if saved evidence can prove it,
   - or route copy/anchor fixes found by QA.
3. If the slice adds a behavior claim, first add or harden contracts/tests and
   keep uncertified output as a review prompt.
4. Wire any certified outputs or safe review prompts into the affected route
   family without route-local string maps.
5. Run focused verification for the touched behavior family and route family.
6. If that verification is green, continue into one independent second slice
   before docs/logs and final response. Valid second slices are:
   - another presentation/visual route slice,
   - another certifiable behavior family,
   - copy-safety/Playwright expansion for the touched routes,
   - a route handoff repair for `/trades/[tradeId]`, `/review`, `/coach`,
     `/analytics`, `/progress`, or `/trades`.
7. Run TypeScript and build after shared-contract or route changes.
8. Update docs/logs only after the multi-slice batch.

Do not stop after:

- adding one mapper contract,
- finding that one market-context field is missing,
- wiring one route,
- passing one focused test,
- passing TypeScript,
- adding one panel,
- updating docs after one small slice.

If one path is blocked, park it and continue. Examples:

- If a future volume field is not available, park that conclusion and continue
  with route handoffs for existing certified support/resistance or volume
  comparison findings.
- If `/trades/[tradeId]` needs a larger route refactor, park the refactor and
  still wire safe evidence labels into `/review`, `/coach`, or `/analytics`.
- If a market-context detector is not certifiable, downgrade it to a review
  prompt and continue with a certifiable strength or route-copy pass.

### Next Run Phase Plan

Use these phases in order. Continue through as many as possible in one run.

#### Phase 0: Reorientation And Safety Scan

- Read the latest project log, plan index, this plan, detection/language plan,
  evidence model, detection inventory, behavior audit, and Layer 2 pattern
  catalog.
- Check `git status --short --untracked-files=all`; do not revert unrelated
  work.
- Run the leak search from Block 1, but treat it as orientation only unless a
  new primary-UI leak is found.
- Skim the local Next docs guide before touching App Router behavior.

#### Phase 1: Market-Context Evidence Inventory

Goal: know exactly what current saved decision-review snapshots can prove.

Inspect:

- saved decision-review snapshot types and fixture data,
- decision-review insight IDs and categories,
- candle quality notes,
- market context source fields,
- trade-window evidence source fields,
- support/resistance level evidence,
- post-exit continuation evidence,
- any volume evidence currently saved or missing.

Output of this phase should be code, tests, or an inventory update, not just
notes. If a needed field is missing, add a guarded fallback or test proving the
claim cannot surface.

#### Phase 2: Certify Or Downgrade Market-Context Behaviors

Goal: every market-context behavior touched by the run must be one of:

- certified detection,
- review prompt,
- internal-only.

Candidate behavior families:

- a new support/resistance, candle, volume, or after-exit behavior only when
  saved evidence proves the claim and the existing completed families do not
  already cover it,
- trader-facing presentation of an existing certified family when route copy or
  anchors still make the user action unclear,
- neutral review prompts for partially supported chart context that should not
  drive a coach headline, risk count, or strength count.

Completed candidate families that should not be rebuilt:

- add-quality prompt versus chart-certified repaired-trade distinction,
- after-exit continuation certification and prompt-only missing/oversized
  after-exit move gates,
- support/resistance-aware exit behavior,
- first-entry versus re-entry volume comparison,
- protected-profit-before-fade certification and duplicate generic fade
  suppression,
- strength-to-repeat session stories and `/review` plus trade-detail
  session-story handoffs.

Rules:

- Do not call an add weak, bad, or a mistake from execution-only adverse-price
  evidence. Execution-only evidence can say the add happened after adverse
  movement and should be reviewed.
- A chart-confirmed bad add needs candle/level evidence showing no repair,
  weakening structure, nearby resistance, fading volume, or continued adverse
  movement after the add.
- A dip-buy or constructive add needs supporting evidence such as support hold,
  reclaim, improving candle structure, or favorable movement after the add.
- Do not certify volume fade without actual volume evidence.
- Do not certify support/resistance claims without saved level/distance
  evidence.
- Do not certify post-exit continuation without a measured after-exit window.
- If evidence is partial, create or preserve a review prompt.

Tests:

- positive case when required evidence exists,
- negative case when evidence is missing,
- copy-safety case for beginner labels,
- route allow-list case when applicable.

#### Phase 3: Bridge Certified Findings Into Product Read Models

Goal: routes should consume product-ready summaries, not raw insight IDs.

Depending on where the evidence exists, add or harden read-model outputs for:

- ticker story evidence,
- session story evidence,
- saved review queue reasons,
- trade detail review workspace evidence,
- analytics chart/context panels,
- progress follow-through.

Do not add route-local string maps. If a route needs a label, put it in the
shared mapper/contract or read-model translator.

#### Phase 4: Route Family Handoffs

Wire the outputs from Phase 3 across route families. Do not stop after one
route if the next route consumes the same read model.

Priority order:

1. `/trades/[tradeId]`: show what this trade can prove, what is waiting, and
   what to fix/repeat.
2. `/review`: queue reasons should explain execution evidence, market context,
   or waiting state in plain language.
3. `/coach`: session/ticker story handoff should point to evidence, not just
   a generic trade.
4. `/analytics`: self-coaching panels should separate execution evidence,
   chart context available, and chart context waiting.
5. `/progress`: progress should track completed reviews and active coaching
   focus without pretending imported trades are completed coaching.
6. `/trades`: browse modes should expose session/ticker/market-context filters
   only when labels are understandable.

#### Phase 5: Presentation, Visual, Or New Evidence Follow-Up

After at least one route or evidence slice is verified, continue into a second
independent slice if time/context remains.

Preferred second slices:

- coach lower-page readability and card-length cleanup using existing certified
  counts,
- analytics lower-report polish and drill-down clarity,
- mobile/desktop screenshot fixes for `/coach`, `/analytics`, `/review`,
  `/progress`, `/trades`, or `/trades/[tradeId]`,
- route anchor/copy repairs for completed session-story or chart-context
  handoffs,
- a genuinely new evidence family only when saved chart, level, candle,
  volume, or after-exit data proves it.

Do not rebuild protected-profit, strength-session, support/resistance exit,
re-entry volume, add-quality, or after-exit continuation unless a regression is
found.

#### Phase 6: Verification Ladder

Run focused verification after each meaningful slice, but do not final-answer
until the multi-slice target is met.

Suggested focused commands:

```powershell
npm test -- --run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts
npm test -- --run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts
npm test -- --run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts
npx tsc --noEmit --pretty false
npm run build
```

If route UI changed:

```powershell
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims"
```

#### Phase 7: Documentation And Resume Point

Update docs only after the implementation batch:

- `src/docs/codex-project-log.md`,
- this next-run plan,
- detection/language plan,
- detection contract inventory,
- evidence model,
- plan index/root `plan.md` if the resume point changes.

The log must say what is complete, what is partial, what is parked, and exactly
what not to redo next time.

### Next Block A: Same-Symbol And Session Behavior Contracts

Goal: turn the new ticker-story foundation into stronger trader feedback.

Current status: baseline ticker stories, session stories, and the first
strength-to-repeat session-story pass are complete. Remaining work in this
block should be incremental, evidence-driven, and should not rebuild the
existing story model or route handoffs.

Implement or harden only detections that can be supported by saved executions
and existing read models:

- repeated losing same-symbol attempts,
- same-symbol overtrading,
- re-entry gave back earlier profit,
- re-entry added profit,
- day trade turned swing/overnight exposure,
- open re-entry waiting for closure,
- deeper green-to-red ticker story variants when a positive peak later becomes
  negative,
- additional strength-to-repeat session stories only when the current saved
  evidence proves a new story not already covered by the implemented strength
  session kind.

Rules:

- Do not claim emotional revenge intent as fact.
- Use "possible cooldown rule" or "review quick re-entry pressure" when intent
  cannot be proven.
- Keep round-trip accounting separate from ticker-story coaching.
- If volume/level comparison is missing, phrase it as a review prompt, not a
  conclusion.

Verification:

- Extend `src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`.
- Extend user-facing behavior mapper tests if a new primary behavior contract
  is added.

### Next Block B: Market-Context Volume And Level Gates

Goal: prepare the chart-context side without overclaiming.

This is no longer the automatic primary next block. Support/resistance-aware
exits, re-entry volume comparison, protected-profit-before-fade, and
after-exit continuation gates are complete. Use this block only for a new
market-context family that is not already covered and is provable from saved
evidence.

Inspect saved decision-review insight IDs and evidence for:

- a level/candle/volume/post-exit relationship not already covered by the
  completed families,
- route copy that is trying to make a chart claim without a certified finding,
- missing-evidence cases that should become review prompts rather than
  conclusions.

Only certify a behavior when required evidence is present. Otherwise map it to
a review prompt or chart-context-waiting state.

Verification:

- Add or extend mapper tests for market-context required evidence.
- Add negative tests proving missing chart context cannot produce support,
  resistance, volume, or post-exit continuation conclusions.

### Next Block C: Route Wiring For New Certified Outputs

After Blocks A or B add new certified behavior outputs, or after presentation
QA finds a missing handoff for an existing certified output, wire them into:

- `/coach` overall focus and evidence trade handoff,
- `/analytics` ticker-story/self-coaching panels,
- `/progress` behavior trend and completed-review separation,
- `/trades` ticker-story filters and cards,
- `/review` queue reasons only when priority evidence is certified,
- `/trades/[tradeId]` review workspace evidence and fix/repeat actions.

Do not add route-local wording tables. Use the shared mapper and fail closed.

### Next Block D: Verification And Docs

Run focused tests after each slice, then broader checks after the batch:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run build
```

If route UI changed, run focused Playwright for the touched routes. Update
`src/docs/codex-project-log.md`, this plan, the detection inventory, and the
plan index only after the multi-slice batch.

## Operating Mode

Work continuously through this plan.

Important correction after the latest continuation slice:

- A clean verification checkpoint is not, by itself, a reason to stop.
- Passing focused tests, TypeScript, or build after one slice must trigger the
  next independent slice in this plan unless a true global stop condition
  applies.
- Do not final-answer after "one hardening slice" when the next route,
  behavior family, or copy-safety task is already defined and does not require
  user judgment.
- Use green verification as a save point: note what passed, then continue into
  the next block.
- Only stop at a clean checkpoint when the next work would hit one of the true
  global stop conditions below.

### Work, Verify, Continue Loop

Use this loop during the run:

1. Pick the next highest-value slice from the ladder.
2. Implement it completely enough that the touched route/module is coherent.
3. Run the smallest meaningful verification for that slice.
4. If verification passes, keep going into the next slice.
5. If verification fails because of the slice, fix it and re-run verification.
6. If verification fails for a known unrelated issue, document it as parked and
   keep going.
7. Escalate to broader verification after several slices or after touching
   shared contracts.
8. Update docs/logs after a meaningful multi-slice batch, not after every
   green command.

The user does not need to verify each checkpoint. Codex must verify its own
work locally and continue.

Do not stop after:

- extending one type,
- fixing one label,
- wiring one route,
- adding one test,
- passing one focused Vitest command,
- passing one `tsc` or `npm run build`,
- updating docs after one slice,
- reaching a route boundary when the next route uses the same pattern,
- finding that one route lacks market context,
- finding one local failing test that does not invalidate the rest of the app.

When one item is blocked, park it and keep going on the next independent item.

Only stop the whole run for:

- destructive data operations,
- importer contract changes that would affect saved data,
- lower-layer architecture choices that are not already decided in the plans,
- verification failures that make later edits unreliable,
- unsafe product claims that require user/product judgment,
- missing credentials or APIs that block every remaining useful task.

## Required Docs To Read First

Read these before implementation:

1. `src/docs/codex-project-log.md`
2. `src/docs/trader-intelligence-plan-index.md`
3. `src/docs/trader-intelligence-continuous-ux-product-plan-2026-05-09.md`
4. `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
5. `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`
6. `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`
7. `src/docs/behavior-coverage-audit.md`
8. `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`

Before editing a route, also skim that route's feature plan if one exists:

- `/coach`: `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md`
- `/review`: `src/docs/trader-intelligence-review-queue-continuous-product-plan-2026-05-09.md`
- `/analytics`: `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md`
- `/progress`: `src/docs/trader-intelligence-progress-continuous-product-plan-2026-05-09.md`

No separate route-specific feature plan currently exists for `/trades` or
`/trades/[tradeId]`. For this run, Blocks 4 and 8 below are the controlling
plans for those routes. Do not stop to create a separate trades or trade-detail
plan unless the implementation discovers a larger route-specific follow-up that
cannot fit in this run.

If these conflict, use this order: latest project-log entry, this next-run
execution plan, active detection/language plan, active top-level plan, then
route-specific feature plans.

## Product Rules For This Run

- No uncertified detection can drive a primary user-facing conclusion.
- No raw behavior ID, pattern ID, scoring trace, suppressed behavior ID,
  normalization detail, or awkward engine label can appear in primary UI.
- Primary UI includes headings, cards, badges, charts, closed disclosure
  summaries, queue reasons, progress states, and chart labels.
- Expanded advanced details can contain builder-level information, but the
  disclosure title and closed-state summary must still be plain.
- Execution evidence and market-context evidence must stay separate unless both
  are present.
- Execution-only evidence can describe buys, sells, adds, reductions, exits,
  position size, re-entries, open positions, P/L, day/session behavior, and
  ticker stories.
- Market-context evidence is required for support/resistance, candle,
  extension, volume, and post-exit continuation claims.
- The app must identify strengths to repeat, not only mistakes to fix.
- Do not add short-seller coaching, borrow/locate analysis, short squeeze
  alerts, signals, trade calls, financial advice, or guaranteed-improvement
  language.

## Required Shape Of The Next Long Run

The next implementation run must use this shape unless a true global blocker
appears:

1. Complete a full route family pass.
2. Verify it.
3. Continue into one behavior-family pass.
4. Verify it.
5. Continue into one market-context gate or known-failure investigation when it
   is independent.
6. Verify it.
7. Update docs/logs.
8. Send the final response.

The first green verification checkpoint is a midpoint, not the finish line.

Required batch target for the next implementation run:

1. Re-run a quick leak search for newly introduced labels.
2. Complete one coherent route or evidence-family pass, not one isolated
   label. Current best candidates are coach/analytics presentation polish,
   mobile visual cleanup, route handoff/anchor fixes, or a new certifiable
   evidence family.
3. Wire any new certified outputs across the affected route family.
4. Add or extend tests for route-facing copy, mapper behavior, or visual route
   contracts changed during that pass.
5. Run focused Vitest or Playwright plus TypeScript when code changes require
   it.
6. If those pass, continue into one independent next slice before docs/logs and
   final response.
7. Only then update docs/logs and report back.

The first detection/language hardening baseline is complete for the currently
surfaced families. For future batches, "safe to surface" still means every new
or changed behavior is either:

- certified and mapped to trader-readable risk/strength/review copy,
- explicitly a review prompt,
- or internal/advanced-only and unable to drive primary UI.

Market-context behaviors remain gated by saved candle/level/volume/after-exit
evidence. Missing or partial evidence must stay as review prompts,
chart-context-waiting states, or internal-only diagnostics.

## Implementation Ladder

### Block 1: Reorient And Search For Leaks

Goal: identify the remaining places where primary UI can still show raw,
awkward, or uncertified behavior language.

Actions:

1. Read the required docs listed above.
2. Check current worktree state and do not revert unrelated user or prior-agent
   changes.
3. Search user routes and product code for raw labels and fallback wording:

```powershell
rg -n "failed premise|premise|revenge-like|taxonomy|dominant|normalization|suppressed|scoring|diagnostic|analysis_failed|market_context_unavailable|saved_sqlite|fixture|raw json|debug" app src/lib
rg -n "behavior|pattern|reason|headline|summary|badge|pill|lane|status|focus|fixFirst|reviewPrompt|label" app src/lib/trader-analytics src/lib/user-facing-review src/lib/user-facing-behavior
```

4. Classify each hit as:
   - primary UI,
   - closed advanced/disclosure label,
   - expanded advanced detail,
   - admin/internal,
   - test/fixture-only.
5. Update the detection inventory only when a newly discovered leak changes the
   implementation path.

Continue condition:

- If leaks are found in multiple routes, start with `/trades/[tradeId]`, then
  `/review`, `/analytics`, `/progress`, and `/trades`.

### Block 2: Strengthen The User-Facing Behavior Contract

Goal: make the mapper explicit enough to support risks, strengths, review
prompts, and evidence-channel gating across all routes.

Actions:

1. Inspect `src/lib/user-facing-behavior` types, registry, mapper, and tests.
2. Ensure the contract exposes, or add if missing:
   - `opportunityType`: `risk_to_reduce | strength_to_repeat | review_prompt | internal_only`
   - `evidenceChannel`: `execution_only | market_context | combined`
   - `canDrivePrimaryConclusion`
   - `userFacingLabel`
   - `plainExplanation`
   - `evidenceSentence`
   - `fixFirstAction`
   - `missingDataSentence`
   - `advancedHowDetected`
   - `routesAllowed`
3. Keep the mapper fail-closed:
   - unknown behavior -> no primary conclusion,
   - prompt-only behavior -> question/review task, not a warning,
   - internal-only behavior -> advanced/admin only.
4. Add or update mapper tests for:
   - unknown label fails closed,
   - review prompt cannot drive a primary conclusion,
   - internal signal cannot drive route copy,
   - strength can drive primary copy when certified,
   - market-context claim is unavailable when context is missing.

Continue condition:

- If contract changes are mechanical and tests pass, wire the same contract
  into route slices before any final response.

### Block 3: Add The First Certified Strengths

Goal: stop the product from feeling like it only tells traders what they did
wrong.

Candidate execution-only strengths:

- `good_loss_containment`
  - The trader reduced or closed quickly after the trade moved against them.
  - Must not claim chart weakness unless market context exists.
- `structured_execution`
  - Entry, adds, reductions, and exit were orderly enough to review as a good
    process example.
  - Must have enough execution sequence evidence to avoid empty praise.
- `protected_profit_with_reductions`
  - The trader reduced size after the trade had moved in their favor.
  - Execution-only version can say profit was reduced/protected by execution;
    market-context version can say it avoided a later fade only when candles
    support that.

Candidate market-context or combined strengths:

- `sold_near_best_part_of_move`
- `protected_profit_before_fade`
- `bought_near_clean_support`

Actions:

1. Add only strengths that the available data can prove.
2. For unproven strengths, add review prompts instead of certified detections.
3. Add tests that require strengths to use positive language:
   - "repeat",
   - "keep doing",
   - "protected",
   - "contained",
   - "structured".
4. Ensure strengths can appear in coach, analytics, progress, and trade detail.

Continue condition:

- If market-context strengths need data that is not available, park them and
  proceed with execution-only strengths.

### Block 4: Wire `/trades/[tradeId]` As The Primary Review Workspace

Goal: make individual trade review use product-safe behavior summaries instead
of raw or route-local labels.

Actions:

1. Inspect `app/trades/[tradeId]/page.tsx` and
   `src/lib/user-facing-review/mappers/build-user-facing-trade-review-summary.ts`.
2. Identify where the route shows:
   - behavior names,
   - risks/strengths,
   - evidence labels,
   - review prompts,
   - chart-context status,
   - similar trades,
   - technical limits.
3. Use the shared mapper for visible behavior labels and explanations.
4. Ensure the first screen answers:
   - what happened,
   - what to review,
   - what to write down,
   - what evidence is available,
   - what data is waiting.
5. Keep execution replay plain:
   - bought,
   - added,
   - reduced,
   - exited,
   - position still open,
   - re-entered after closing.
6. Keep chart-context claims gated:
   - "chart context waiting" when candles/levels are missing,
   - no support/resistance/volume/post-exit continuation claim without data.
7. Collapse technical review limits.

Tests:

- trade detail does not show "failed premise" or raw behavior IDs,
- prompt-only behavior appears as a review question,
- certified risk appears as a risk with evidence,
- certified strength appears as a strength with a repeat-first action,
- chart-context-missing state does not make level/volume claims.

Continue condition:

- If one trade-detail data field is missing, park it and still wire available
  labels, copy, and tests.

### Block 5: Wire `/review` Queue Language

Goal: make the review queue feel like a work queue and prevent uncertified
behavior from setting queue priority or lane copy.

Actions:

1. Inspect `app/review/page.tsx`,
   `app/review/saved-review-queue-actions.tsx`, and
   `src/lib/trader-analytics/server/saved-review-queue.ts`.
2. Route queue reasons through the mapper where they reference behaviors.
3. Keep lane language trader-readable:
   - Highest Priority,
   - Chart Context Waiting,
   - Open Trades,
   - Needs Technical Follow-Up,
   - Reviewed With Chart Context.
4. Each queue item must show:
   - symbol,
   - result/status,
   - why it is in the queue,
   - what to review,
   - evidence available,
   - `Open Trade Review`.
5. Do not let review prompts create high-priority warning labels unless a
   certified detection supports the priority.

Tests:

- review queue does not show raw internal labels,
- lane language is the approved language,
- queue item has an `Open Trade Review` action,
- missing chart context is framed as waiting, not failure,
- prompt-only behavior is not counted as a proven mistake.

Continue condition:

- If queue priority logic is too risky to change, keep priority as-is but
  safely change visible reasons and labels, then park priority logic.

### Block 6: Wire `/analytics` Behavior And Evidence Language

Goal: make analytics useful for self-coaching while staying honest about what
the app can prove.

Actions:

1. Inspect `app/analytics/page.tsx`, `app/analytics/analytics-client.tsx`, and
   trader analytics product/read-model files.
2. Route behavior labels in charts, cards, and drilldowns through the mapper.
3. Separate analytics into:
   - execution evidence,
   - chart context available,
   - chart context waiting,
   - risks to reduce,
   - strengths to repeat.
4. Ensure charts use red/green/amber/blue consistently:
   - red for loss/risk,
   - green for gain/strength,
   - amber for waiting/needs review,
   - blue/neutral for context/navigation.
5. Add or refine chart/detail copy so a new trader can tell what the chart
   means.
6. Do not claim support/resistance, volume, extension, or missed continuation
   unless market context exists.

Tests:

- analytics behavior chart labels use mapped copy,
- strengths and risks are separate when supported,
- chart-context waiting state does not produce level/volume claims,
- drilldown language does not expose raw behavior IDs.

Continue condition:

- If broad analytics layout is too large, prioritize behavior/copy safety and
  tests, then park deeper visual redesign for the analytics plan.

### Block 7: Wire `/progress` Around Review Completion And Behavior Change

Goal: make progress track finished review work, risks reduced, and strengths
preserved without pretending saved imports are completed coaching.

Actions:

1. Inspect `app/progress/page.tsx` and any progress view-model code.
2. Ensure progress separates:
   - saved imported trades,
   - completed reviews,
   - open review queue work,
   - active coaching focus,
   - behavior risks,
   - behavior strengths.
3. Use mapper labels for active focus and trend labels.
4. Make missing review history honest:
   - "Save reviews to measure progress from your own notes."
5. If new imported trades are not reflected, identify whether the issue is
   data-source selection, caching, or completed-review filtering.
6. Do not overclaim improvement without repeated completed-review evidence.

Tests:

- progress reflects saved import counts when saved data exists,
- completed review copy is separate from saved import copy,
- active focus label comes from mapped behavior language,
- strengths can appear as preserve/continue language.

Continue condition:

- If deeper trend math needs more review history, park it and improve saved vs
  completed-review copy and links.

### Block 8: Wire `/trades` Browser And Ticker Story Copy

Goal: explain repeated same-symbol rows and open/swing cases without confusing
the user.

Actions:

1. Inspect `app/trades/page.tsx` and
   `src/lib/trader-analytics/server/saved-trade-threads.ts`.
2. Keep round trips as accounting units and ticker stories as higher-level
   coaching context.
3. Explain same-symbol repeats as:
   - separate round trips,
   - part of a same-symbol story,
   - open re-entry,
   - day trade turned swing/overnight,
   - repeated same-symbol attempts.
4. Do not call sell-starting records short trades in end-user copy unless
   short-side product support is intentionally enabled.
5. Use mapper labels for any behavior badges or story reasons.
6. Make filters understandable:
   - all saved trades,
   - ticker stories,
   - open/swing,
   - needs review,
   - chart context waiting.

Tests:

- repeated ticker story copy explains round trips vs story,
- open/swing label appears when supported,
- end-user copy does not promote short trading,
- behavior badges use mapped labels.

Continue condition:

- If trade grouping itself is incorrect, do not rewrite importer/grouping in
  this run. Improve explanation and park the grouping contract issue.

### Block 9: Investigate Decision-Review Level-Context Failures

Goal: understand whether the existing broad-suite failures are blocking
market-context confidence or only stale expectations.

Actions:

1. Run the two failing tests alone.
2. Inspect the expected vs actual level-context output.
3. Decide whether the failure is:
   - a stale test expectation,
   - a real missing support/resistance bridge,
   - a fixture/data mismatch,
   - an unsafe market-context claim that must be gated.
4. Fix only if the change is local and safe.
5. If the fix requires lower-layer contract changes or data repair, park it
   with a clear note and continue route-level execution-only work.

Tests:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts
```

Continue condition:

- If the failure is not local, park it and do not let market-context claims
  become primary conclusions until it is resolved.

### Block 10: Cross-Route Copy Safety Tests

Goal: prevent regressions after route wiring.

Actions:

1. Add or update tests that check primary UI/read models do not emit:
   - `failed premise`,
   - `analysis_failed`,
   - `market_context_unavailable`,
   - `saved_sqlite`,
   - `fixture`,
   - `raw json`,
   - `debug`,
   - raw behavior IDs,
   - raw pattern IDs.
2. Add or update tests that banned product phrases are absent:
   - signals,
   - trade calls,
   - financial advice,
   - guaranteed profits,
   - short-seller coaching.
3. Add tests for copy shape:
   - what happened,
   - why it mattered,
   - evidence,
   - fix first,
   - missing data when applicable.

Continue condition:

- If one route is hard to test in Playwright, add unit/view-model tests for
  the read model and park browser coverage.

### Block 11: Visual Smoke And Browser Checks

Goal: make sure route changes actually look coherent in localhost.

Use the browser/plugin if available for local route inspection.

Routes:

- `/coach`
- `/review`
- `/progress`
- `/analytics`
- `/trades`
- one real `/trades/[tradeId]`

Check:

- first screen has one obvious next action,
- cards are not dumping equal-weight text,
- red/green/amber/blue are consistent,
- mobile does not overflow,
- advanced/internal sections stay collapsed or lower,
- data source is saved import data when saved data exists,
- no raw/internal language appears in default view.

Continue condition:

- If visual issues are minor, patch them, re-smoke the touched route, and keep
  going unless the larger batch target has already been met.
- If visual issues reveal a broader redesign need, document it in the relevant
  feature plan and continue safe copy/test work.

### Block 12: Verification

Run the fastest focused tests first, then broader checks.

Suggested order:

```powershell
npx vitest run src/lib/user-facing-behavior
npx vitest run src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/coach-overall-focus.test.ts
npx tsc --noEmit --pretty false
npm run build
```

If route UI changed materially, also run the focused Playwright coverage that
matches the touched routes.

The old decision-review level-context failures are resolved. If they fail
again, treat that as a new regression unless a later project-log entry
explicitly parks a new known failure.

### Block 13: Docs And Resume Point

Goal: leave the next resume clean.

Update:

- `src/docs/codex-project-log.md`
- this plan if scope or ordering changed materially,
- `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`
  if behavior classifications changed,
- route feature plans only when a new route-specific follow-up is discovered.

Project-log entry must include:

- what changed,
- tests run,
- known failures,
- parked local blockers,
- exact next best step.

## Parked Blocker Format

Use this only for meaningful blockers:

```text
Parked item:
- Area:
- Why parked:
- Safe work continued:
- Resume trigger:
- Risk if ignored:
```

## Acceptance Criteria For This Next Run

By the end of the next long implementation run, the target is to make all of
these true. If any item cannot be completed safely in the run, park it with a
reason, continue with the remaining independent items, and report the parked
item only after the rest of the batch has been worked:

- Preserve the behavior contract's opportunity type and evidence channel
  fields across every touched route.
- Preserve and extend certified strength-to-repeat flow through product-safe
  copy.
- `/trades/[tradeId]` uses product-safe behavior language for risks,
  strengths, evidence, and review prompts.
- `/review` queue reasons use product-safe behavior language.
- `/analytics` behavior charts/cards do not expose raw labels.
- `/progress` distinguishes saved imported trades from completed review
  progress.
- `/trades` explains repeated same-symbol rows as round trips and ticker
  stories.
- Market-context claims are gated behind real chart/level/volume/post-exit
  data.
- Missing market context is shown as waiting or review-needed, not as an error
  or proven behavior.
- Copy-safety tests prevent raw/internal language from returning.
- Typecheck and build pass after code changes.
- Any known broad-suite failures are documented with whether they are new or
  pre-existing.

## Non-Goals

Do not spend this run on:

- pushing to GitHub,
- committing,
- deployment,
- auth,
- billing,
- importer rewrites,
- saved trade data deletion/deduplication,
- candle warehouse data edits,
- new broker API behavior,
- broad visual redesign unrelated to behavior trust,
- SEO/marketing pages.

## Final Instruction For Future Codex

When the user says "proceed" from this point, start at **Next Continuous Run
Starts Here**, not at the old route-language blocks. The route-family language
pass, first market-context contract pass, ticker-story surfacing pass, first
same-symbol thread-story hardening pass, first session-story pass, and first
chart-context finding bridge are complete. Later updates also completed
support/resistance exits, first-entry versus re-entry volume comparison,
protected-profit-before-fade, strength-to-repeat session stories, and the
adverse-add repair wording pass. Re-run leak search only as a safety check,
then continue through the next independent route/evidence slices:

1. coach or analytics presentation polish using certified read-model counts,
2. visual/mobile polish for touched routes,
3. route anchor or copy repairs where completed handoffs are unclear,
4. a genuinely new evidence family only when saved chart, level, candle,
   volume, or after-exit evidence proves it,
5. verification and docs.

Wire only certified conclusions into `/coach`, `/analytics`, `/progress`,
`/trades`, `/review`, and `/trades/[tradeId]`; keep uncertain behavior as
review prompts or internal diagnostics. If one route or behavior family blocks,
park it and move to the next independent slice. Do not return after one small
slice unless a global stop condition is reached.

## 2026-05-10 Continuous Run Completion Update

Completed in the latest implementation run:

- Execution-only adverse-add detections now stay as review prompts:
  `scaled_loser` and `add_after_adverse_move` explain that size increased
  after adverse movement, but they no longer drive primary risks or coach
  archetype scoring without chart context.
- The add-quality split is explicit:
  - prompt-only adverse add from executions,
  - certified weak add from chart-backed weakness,
  - certified constructive add from chart-backed strength.
- The old "failed premise" product default was tightened to beginner-readable
  size-management language: "Added several times before reducing size."
- Saved trade threads now expose:
  - add-quality finding/risk/strength/prompt counts,
  - post-exit finding counts,
  - level finding counts,
  - volume evidence counts.
- `/analytics`, `/progress`, `/trades`, `/trades/[tradeId]`, and `/coach`
  now consume the add-quality split where it helps the user understand what is
  proven versus what still needs review.
- `/trades` now includes ticker-story filters for add quality, post-exit,
  levels, and volume evidence.

Verification completed:

```powershell
npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims"
```

Next run should not rebuild:

- route-language hardening,
- ticker stories,
- session stories,
- chart-context finding bridge,
- add-quality prompt/certification split,
- add-quality/post-exit/level/volume counts.

Historical next-slice note:

- Historical note only: this next-slice wording is superseded by the later
  support/resistance exit and re-entry volume completion section below.
- Only certify the behavior if explicit candle/level/volume/post-exit evidence
  exists. Otherwise add a review prompt and continue to the next independent
  certifiable slice.

## 2026-05-10 Post-Exit And Volume Evidence Hardening Completion

Completed in the latest continuation:

- Post-exit and volume findings now carry risk, strength, and review-prompt
  splits through saved trade-thread read models and user routes.
- Profit-protection findings now surface as after-exit evidence.
- Volume evidence cards use the certified finding itself, so risk and strength
  findings produce different titles, tones, details, and actions.
- The user-facing route language was tightened:
  - "After-Exit Review" replaces "Post-Exit Checks";
  - "risk to review" and "strength to repeat" replace "risk-backed" and
    "strength-backed";
  - visible hyphenated "chart-context" copy was replaced with "chart context,"
    "chart review," or "chart findings" depending on the surface.
- The core route copy-safety Playwright scan now blocks those confusing phrases
  from returning.

Verification completed:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot
npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot
npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/saved-import-api-routes.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims"
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "repairs a missing-quantity row"
```

Next run should not rebuild:

- post-exit/volume split counts,
- the first after-exit/profit-protection evidence card pass,
- the volume risk/strength evidence card selection,
- the beginner-readable copy cleanup for post-exit/volume/chart-context terms,
- the confusing-phrase Playwright guard.

Historical next-slice note:

- Historical note only: first-entry versus re-entry volume comparison and
  support/resistance-aware exit behavior were completed later. Use the latest
  completion section at the bottom of this file for active next work.
- Only certify the new family if attached chart/level/volume/candle evidence
  proves the claim. Otherwise keep the output as a review prompt or internal
  diagnostic and continue to the next independent slice.

## 2026-05-10 After-Exit Gate Completion

Completed in the latest continuation:

- `exit_left_continuation` is now gated behind real post-exit candles and a
  calibrated favorable after-exit move.
- Missing post-exit candles produce `exit_needs_post_exit_context`, a
  prompt-only user-facing finding.
- Large after-exit moves outside the current calibrated range produce
  `exit_large_post_exit_move_needs_review`, also prompt-only.
- Saved trade threads show those after-exit prompts as review evidence but do
  not count them as proven risk or strength.
- The chart-confirmed add-risk label is now "Added before the trade repaired"
  so the UI does not imply every adverse add was bad or that planned dip buys
  are automatically mistakes.
- Rule recommendations for adverse-add cost drivers now use
  "Require repair before adding size" instead of blanket avoid/no-add wording.

Verification completed:

```powershell
npx vitest run src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "coach product loop|market context observational|banned product claims"
git diff --check
```

Next run should not rebuild:

- after-exit certification gating,
- `exit_needs_post_exit_context`,
- `exit_large_post_exit_move_needs_review`,
- saved-thread after-exit prompt card handling,
- the add-repair label and adverse-add rule recommendation language.

Historical next-slice note:

- Historical note only: support/resistance-aware exit behavior,
  first-entry versus re-entry volume comparison, route handoffs,
  profit-protection/fade behavior, and strength-to-repeat session stories are
  now completed. Use the latest final instruction and bottom "Next best slice"
  section for active work.
- Keep support/resistance, volume, and after-exit claims prompt-only unless
  the required evidence is present and calibrated.

## 2026-05-10 Support/Resistance Exit And Re-Entry Volume Completion

Completed in the latest continuation:

- Support/resistance-aware exit behavior now has user-facing contracts for:
  - reductions near resistance,
  - exits that avoided later adverse follow-through,
  - exits into resistance followed by reversal,
  - exits into resistance before measured breakout,
  - exits into support before measured breakdown,
  - exits into support followed by relief as a review prompt.
- `build-trade-decision-review` now turns those support/resistance exit
  insights into risks, strengths, or prompts only when saved market-context
  evidence supports the claim.
- Same-symbol trade threads now compare first-entry volume with later
  re-entry volume when saved snapshot evidence exists. Faded later volume can
  produce a risk finding when outcome also weakens; confirmed later volume can
  produce a strength finding when the outcome holds up.
- Analytics drilldowns now keep execution-only adverse-add observations
  visible as review prompts without expecting them to become certified top
  risks.
- The stale fixture expectation for adverse-add losers was corrected: the
  prompt remains available for review, but it does not drive the main proven
  risk without chart context.

Verification completed:

```powershell
npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot
npx vitest run src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot
npx vitest run src/lib/trader-analytics/__tests__/coaching-fixture-expectation-matrix.test.ts src/lib/trader-analytics/__tests__/end-user-product-roadmap.test.ts --reporter=dot
npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
```

Next run should not rebuild:

- support/resistance-aware exit contracts,
- first-entry versus re-entry volume comparison findings,
- analytics review-prompt drilldown handling for execution-only adverse adds,
- the stale adverse-add fixture expectation correction,
- any earlier route-language, ticker-story, session-story, chart-context
  bridge, add-quality, post-exit/volume split, or after-exit certification
  work.

Historical next-slice note:

- This section is superseded by the protected-profit completion below. Do not
  restart support/resistance route handoffs or protected-profit-before-fade
  behavior from this older note.
- This note is now also superseded by the strength-to-repeat session-story
  completion below. Remaining active work is analytics/coach presentation
  polish, visual/mobile polish for the touched route family, or another
  evidence-backed market-context family.

## 2026-05-10 Protected-Profit Before Fade Completion

Completed in the latest continuation:

- Added the certified market-context behavior `protected_profit_before_fade`.
- The decision-review detector now requires realized capture, measured
  after-exit candles, more adverse than favorable movement after the exit, and
  a flat-to-adverse after-exit ending before it can say profit was protected
  before a fade.
- Missing after-exit candles or after-exit continuation do not produce this
  conclusion.
- The user-facing registry maps the behavior to "Protected profit before the
  fade" with strength-to-repeat language and no perfect-top, prediction, or
  signal wording.
- The stricter protected-profit finding suppresses the older generic
  `exit_avoided_adverse_followthrough` finding when both are present.
- Saved trade threads and aggregate read models now expose:
  - `protectedProfitBeforeFadeFindingCount`,
  - `threadWithProtectedProfitBeforeFadeFindingCount`.
- Analytics, coach, progress, saved trades, and trade detail now surface this
  evidence family separately from generic after-exit review.
- `/trades` now includes a protected-before-fade story filter and badge.

Verification completed:

```powershell
npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot
npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "mobile routes"
git diff --check
```

Next run should not rebuild:

- protected-profit-before-fade behavior,
- protected-profit saved-thread counts,
- the duplicate generic fade suppression,
- protected-before-fade route cards/filter/badge,
- support/resistance exit and re-entry volume handoffs,
- previous ticker-story/session-story/chart-context bridge work.

Historical next-slice note:

- This older idea was completed by the strength-to-repeat session-story work
  below, including explicit certified strength counts and `/review` plus
  `/trades/[tradeId]` handoffs.
- Polish analytics/coach presentation using the certified read-model counts
  already available.
- Implement another market-context family only if saved evidence can prove it;
  otherwise keep it prompt-only or internal.

This note is superseded by the strength-to-repeat session-story completion
below. Use the final "Next best slice" section at the bottom of this file for
active work.

## 2026-05-10 Strength-To-Repeat Session Story Completion

Completed in the latest continuation:

- Saved session stories now include `strengths_to_repeat_session` when the day
  finished green and certified chart/level/volume/after-exit strengths exist
  without higher-priority repeated-loss, giveback, or open/swing concerns.
- Strength-session counters are now part of the saved trade-thread read model:
  - `strengthsToRepeatSessionCount`,
  - session-level `marketContextStrengthCount`,
  - protected-profit, level, volume, and add-quality strength counts.
- Session-story evidence cards now identify strengths worth repeating rather
  than only risks to reduce.
- `/coach`, `/progress`, `/trades`, `/review`, and `/trades/[tradeId]` consume
  those counters and handoffs.
- `/trades/[tradeId]` now has a session-story handoff so the user can see the
  broader trading-day story from an individual trade review.
- Protected-profit route labels now use "Protected Profit" and
  "profit-protection strength" instead of hyphenated/internal phrasing.
- Adverse-add coaching copy now explains the dip-buy ambiguity directly:
  execution evidence only proves size was added after price moved against the
  position; chart/level context is needed before calling the add bad, weak, or
  constructive.
- The visible rule label is now "Require Repair Before Adding Size."

Verification completed:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot
npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "mobile routes"
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
```

Next run should not rebuild:

- strength-to-repeat session story classification,
- the strength-session counters listed above,
- session-story evidence cards,
- `/review` and `/trades/[tradeId]` session-story handoffs,
- protected-profit wording changes,
- adverse-add repair/dip-buy copy tightening.

Next best slice:

- The first certified-read-model presentation polish and screenshot-guided
  visual polish passes are now complete. Do not rebuild the shared workflow
  handoffs, analytics chart grouping, lighter report surfaces, metric-card
  copy tightening, review-flow raw-ID cleanup, or report-history label cleanup.
- Next UI/product slices should be either:
  - `/trades` browser and `/trades/[tradeId]` review-workspace polish using
    the same shared visual system,
  - deeper `/coach` lower-page reduction after tests are adjusted to allow
    supporting panels to be collapsed by default,
  - route copy/anchor repairs found by QA,
  - or a new market-context behavior family only if saved evidence can prove it
    without inference.
- Keep uncertain behavior prompt-only or internal.
