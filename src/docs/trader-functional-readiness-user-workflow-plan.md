# Trader Functional Readiness User Workflow Plan

## Summary

This plan is the next branch after
`src/docs/trader-functional-product-readiness-plan.md`.

Current project reset/review:

- `src/docs/trader-execution-intelligence-project-review-2026-05-04.md`

The previous branch created the functional readiness engine:

- import confidence state machine
- CSV dry-run to saved-analysis prototype
- execution-only autopsy enrichment
- synthetic trader personas
- deterministic execution-math fuzz checks
- truth-source evidence audit
- readiness dashboard
- real-data calibration harness

That work is now visible on `/platform-readiness`, but the real user workflow
still needs to show more of that functionality inside `/import-dry-run`.

This plan moves the functional readiness engine into the rough product flow
without pretending the app is live-ready. The goal is functionality and testing,
not final visual polish.

## Product Boundary

Current product direction:

- the app should compete by explaining execution decisions in context, for
  example: "Your first entry was close to major 4h resistance, the trade had
  limited clean room, and your add increased size after the trade had already
  used most of its favorable move"
- daily/4h support and resistance from `levels-system` are the first-pass
  market-context feedback source
- 1m/5m historical candles are used for movement facts such as MFE/MAE,
  trade-window high/low, and post-exit continuation
- VWAP/EMA should not drive trader-facing feedback for now
- lower-timeframe support/resistance coaching is deferred until a later
  tactical-context layer
- trade-analysis summaries now expose `decisionReview`, which contains the
  first deterministic coaching headline, fix-first behavior, and concrete
  decision insights

This branch must not add:

- production database writes
- auth/login
- billing or paid-plan enforcement
- export/download controls
- live broker account connections
- local candle fetching
- local support/resistance calculation
- local VWAP/EMA calculation
- local market-structure scoring
- market-context-driven coaching conclusions

This branch may add:

- in-memory/prototype-only UI panels
- route-visible readiness state
- tests that prove the functional loop works
- user-facing calibration guidance
- fee/commission visibility in import review
- no-save preview contracts that can later connect to persistence

## Required Files To Read Before Coding

Before implementation starts, read these files in this order:

1. `src/docs/codex-project-log.md`
2. `src/docs/trader-functional-readiness-next-handoff.md`
3. `src/docs/trader-functional-product-readiness-plan.md`
4. `src/lib/trader-analytics/product/functional-readiness.ts`
5. `src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts`
6. `app/platform-readiness/page.tsx`
7. `app/import-dry-run/import-dry-run-client.tsx`
8. `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
9. `src/lib/trader-analytics/product/types.ts`
10. `tests/e2e/import-dry-run.spec.ts`
11. `tests/e2e/app-feature-regression.spec.ts`
12. `tests/e2e/app-actual-qa.spec.ts`

If implementation changes Next.js route behavior, also read the relevant guide
under `node_modules/next/dist/docs/` before editing route/page code.

## Current Inputs Available

The next branch should reuse these existing exports:

```ts
import {
  buildImportConfidenceState,
  buildSavedAnalysisPrototypeFromDryRun,
  buildTraderFunctionalProductReadinessViewModel,
  runRealDataCalibrationHarness,
} from "@/src/lib/trader-analytics";
```

Important existing contracts:

- `CsvDryRunImportExperience`
- `ImportConfidenceStateModel`
- `SavedAnalysisPrototype`
- `ExecutionFeedbackAutopsyEnrichment`
- `RealDataCalibrationHarnessResult`
- `FunctionalFeatureReadinessDashboard`

Important UI route:

- `/import-dry-run`

Important internal readiness route:

- `/platform-readiness`

## Step 1. Keep This Plan And Handoff Current

Status: in_progress

Goal:

Make this file the working implementation checklist for the next branch, and
make the handoff file the small read-first note for a new chat.

Implementation tasks:

- Keep this plan updated when a step starts, completes, or changes scope.
- Update `src/docs/trader-functional-readiness-next-handoff.md` whenever:
  - a blocker appears
  - the best next step changes
  - a verification command fails
  - a new file becomes central to the workflow
  - a new boundary decision is made
- Update `src/docs/codex-project-log.md` at the end of the branch.
- Update README only if a user-facing or resume-relevant doc path changes.
- Do not update the shared `levels-system` handoff file unless this branch
  discovers a real blocker or requirement for the other project.

Acceptance criteria:

- A fresh Codex chat can resume by reading the project log and handoff note.
- The plan reflects actual completed work.
- No stale "planned" statuses remain after implementation completes.

## Step 2. Add A User-Workflow Prototype Analysis View Model

Status: completed

Goal:

Create a small product view model that turns a `CsvDryRunImportExperience` into
the exact data `/import-dry-run` should display for the prototype saved-analysis
path.

Recommended file:

- Prefer adding to `src/lib/trader-analytics/product/functional-readiness.ts`
  if the output is functional-readiness specific.
- Avoid importing `functional-readiness.ts` into
  `csv-dry-run-workflow.ts` to prevent an avoidable circular dependency.

Suggested exported function:

```ts
buildCsvDryRunPrototypeAnalysisPanel({
  experience,
  generatedAt,
})
```

Suggested output fields:

- `contractVersion: "csv_dry_run_prototype_analysis_panel_v1"`
- `state`
- `stateLabel`
- `primaryNextAction`
- `canGeneratePrototype`
- `prototypeGenerated`
- `generatedTradeCount`
- `feedbackSummaryCount`
- `reviewQueueItemCount`
- `topAutopsyFindings`
- `topDecisionReviewInsights`
- `coachingHeadline`
- `fixFirstBehaviorId`
- `topImportBlockers`
- `topReviewReasons`
- `limitations`
- `evidence`
- `writesProductionDatabase: false`
- `marketContextUsed`
- `marketContextSource`
- `exportAvailable: false`

Mapping rules:

- Use `buildImportConfidenceState(experience)` for pre-save state.
- Use `buildSavedAnalysisPrototypeFromDryRun({ experience })` only when the
  import state is `ready_for_analysis` or `needs_review`.
- For blocked imports, do not generate a prototype report.
- For `needs_review`, show that a prototype preview can exist, but the user
  should review the flagged items before a real save later.
- Pull top autopsy findings from:
  - `prototype.autopsies[*].firstMistakeMoment`
  - `prototype.autopsies[*].firstStrengthMoment`
  - `prototype.autopsies[*].worstAdd`
  - `prototype.autopsies[*].bestReduction`
  - `prototype.autopsies[*].positionSizeEscalationWarning`
- Accept precomputed decision-review coaching snapshots from server-side
  `TradeAnalysisSummary.decisionReview` when that trade-analysis path is
  available. Do not import server-only trade-analysis code into the browser
  dry-run route.
- Keep all language execution-only.
- Do not mention chart reads, support/resistance, or market structure as if
  they were used unless the source is explicitly `levels-system` daily/4h
  support/resistance and the panel labels it as market-context review.

Acceptance criteria:

- Ready imports return a panel with generated trade and feedback counts.
- Blocked imports return a panel with blockers and no generated prototype.
- Needs-review imports return review reasons and safe preview language.
- Every panel claim has evidence.
- The output is deterministic.

## Step 3. Surface Prototype Analysis In `/import-dry-run`

Status: completed

Goal:

Make the user-facing dry-run route show what would happen next after import
repair and grouping: prototype analysis readiness, generated feedback count,
autopsy highlights, decision-review coaching, and review/progress preview.

Files likely involved:

- `app/import-dry-run/import-dry-run-client.tsx`
- possible small helper component inside the same file
- `src/lib/trader-analytics/product/functional-readiness.ts`
- `src/lib/trader-analytics/index.ts`

UI requirements:

- Add a new section after the confidence/import session area or near the
  feedback preview area.
- Suggested heading: `Prototype Analysis`
- Show:
  - state badge: ready, needs review, blocked, or prototype saved
  - primary next action
  - generated trade preview count
  - feedback summary count
  - review queue count
  - top mistake/strength/autopsy item when available
  - top decision-review headline and fix-first behavior when available
  - top decision-review insights when available
  - explicit note: prototype only, not saved to production
  - explicit note: execution-only until server-side daily/4h decision review
    facts are attached
- For blocked imports:
  - show blockers first
  - do not show "saved" language
  - do not show links implying real persistence exists
- For ready imports:
  - show "would generate prototype analysis" or equivalent safe wording
  - show the generated counts
  - show top autopsy evidence
- For needs-review imports:
  - show review reasons before generated counts
  - make clear real save would require review later

Design constraints:

- Keep styling consistent with the existing rough product route.
- Do not spend time on final website visual design.
- Avoid adding new dependencies.
- Use existing utility classes and panel style.
- Keep text compact and functional.
- Do not add export/download/copy raw JSON controls.

Acceptance criteria:

- `/import-dry-run` visibly explains whether the current import can become a
  prototype analysis.
- The route makes the future product loop understandable without persistence.
- The route does not overclaim production saves, broker connections, auth,
  billing, market context, or exports.
- The route remains usable on desktop and mobile.

## Step 4. Add State-Driven Workflow Affordances Without Persistence

Status: planned

Goal:

Make the prototype analysis panel feel like part of the workflow while still
being honest that nothing is saved.

Implementation tasks:

- Add state-driven labels/actions such as:
  - `Review blockers`
  - `Review import warnings`
  - `Prototype analysis ready`
  - `Open review preview`
  - `Open progress preview`
- If adding links, route only to already-existing sample/prototype-safe pages:
  - `/analytics`
  - `/review`
  - `/progress`
  - `/platform-readiness`
- Do not create fake persisted trade IDs that imply a real user save happened.
- If showing trade ids from the prototype, label them as preview ids.
- Keep the action copy in-app and product-facing, not debug-facing.

Acceptance criteria:

- The UI gives a clear next action for each state.
- The UI avoids dead buttons.
- The UI avoids fake "saved to account" language.
- No new persistence boundary is introduced.

## Step 5. Add Fee And Commission Visibility To Import Review

Status: completed

Goal:

Show when imported broker rows contain fees or commissions without changing the
execution-only scoring model yet.

Why this matters:

End users will care about net results later. The current execution feedback
correctly stays gross-only unless net P/L is deliberately supported. This step
should make that limitation visible and testable.

Implementation tasks:

- Inspect existing fee/commission fields on parsed executions:
  - `commission`
  - `fees`
  - `netAmount`
  - `currency`
- Add or reuse import review data that reports:
  - whether any fees/commissions were present
  - total parsed commissions if safely numeric
  - total parsed fees if safely numeric
  - whether net amount exists
  - whether currencies are mixed
  - whether net P/L is intentionally not used for feedback scoring yet
- Surface a compact note in `/import-dry-run`:
  - "Fees detected" when present
  - "Feedback remains gross-only for now" when relevant
- Keep this as import-review context, not scoring.
- Do not change `execution_feedback_summary_v1` to include net P/L unless a
  separate plan explicitly owns that change.

Acceptance criteria:

- Imports with fee/commission fields visibly disclose that fees exist.
- Execution feedback still says commissions and fees are not included.
- Tests prove fee presence does not silently alter gross-only scoring.

Completed:

- Added `CsvDryRunCostVisibilityPanel` and
  `CsvDryRunCostVisibilityItem` to the dry-run import experience.
- The model reports commission, fees, broker net amount presence, parsed
  currencies, mixed-currency review state, and the gross-only scoring policy.
- `/import-dry-run` now renders `Fee / Commission Visibility`.
- Unit and Playwright tests cover a CSV with commission, fees, amount, and
  currency while preserving gross-only feedback scoring.

## Step 6. Add Real CSV Calibration Guidance

Status: completed

Goal:

Create user/developer guidance for future anonymized real CSV testing without
requiring the user to have every broker account.

Recommended file:

- `src/docs/trader-real-csv-calibration-guide.md`

Guide should include:

- what the calibration harness does
- what CSV columns matter:
  - symbol
  - timestamp/date/time
  - side/action
  - quantity/shares
  - price/average price
  - status/fill status
  - order id/execution id
  - commission/fees/net amount/currency when available
- safe anonymization instructions:
  - replace account numbers
  - remove names, addresses, emails
  - preserve headers
  - preserve row order
  - preserve timestamps enough to test grouping
  - preserve side/quantity/price relationships enough to test math
  - use fake tickers only if every row for the same trade is changed
    consistently
- what not to send:
  - account numbers
  - login credentials
  - API keys
  - broker tokens
  - personal identity fields
- broker notes:
  - IBKR is for candle data in the other project, but CSV here means trade
    executions only
  - Moomoo, Webull, Robinhood, Schwab, and generic CSV are currently
    representative parser targets
  - more brokers can be calibrated with anonymized examples later
- expected output:
  - parse success/failure
  - accepted/rejected/skipped rows
  - grouped trade count
  - correction count
  - confidence state
  - top calibration blockers

Acceptance criteria:

- The user can understand how to create safe calibration CSVs later.
- The guide does not ask for private broker credentials.
- The guide reinforces that this app imports executions, not candles.

Completed:

- Added `src/docs/trader-real-csv-calibration-guide.md`.
- The guide covers safe anonymization, important execution columns, broker
  notes, expected calibration output, bounded verification commands, and the
  boundary between execution imports in this app and candle/level work in
  `levels-system`.

## Step 7. Add Automated App Tests For The New Workflow Surface

Status: partially completed

Goal:

Test the actual UI so the new prototype analysis panel cannot silently break.

Recommended test files:

- Add focused tests to `tests/e2e/import-dry-run.spec.ts`
- Add broader route assertions to `tests/e2e/app-feature-regression.spec.ts`
  only if needed
- Add unit tests in
  `src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts`
  for any new view-model helper

Unit test coverage:

- ready import panel
- blocked import panel
- needs-review import panel
- fee/commission visibility (still planned in Step 5)
- gross-only scoring unchanged (still planned in Step 5)
- evidence refs present
- market context unused
- production persistence false
- export false

Playwright coverage:

- `/import-dry-run` shows `Prototype Analysis`
- clean preset shows prototype-ready counts
- unknown mapping sample shows blockers before mapping
- mapped unknown headers show ready/prototype state
- open-position sample shows needs-review language
- fee/commission sample shows fee visibility and gross-only limitation
- no export/download/raw JSON controls appear
- no "saved to account" overclaim appears
- mobile viewport has no page-level horizontal overflow

Completed in this branch:

- Unit tests cover ready/prototype-generated, blocked, and precomputed
  daily/4h decision-review facts.
- The desktop and mobile Playwright route smoke tests now require the
  `Prototype Analysis` panel and check safe production-write and daily/4h
  wording.
- Playwright coverage also verifies `Fee / Commission Visibility` with a CSV
  containing commission, fees, amount, and currency.

Acceptance criteria:

- Tests fail if the route hides the prototype analysis panel.
- Tests fail if the route introduces unsafe export/download or persistence
  language.
- Tests fail if market context appears to drive execution-only feedback.

## Step 8. Verify, Update Docs, And Decide On GitHub

Status: planned

Goal:

Close the branch with evidence that the implementation works, and leave the
repo easy to resume.

Verification commands:

```bash
npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile
npm run test:e2e
npx tsc --noEmit --pretty false
npm run lint
npm run build
npm run verify:all
npm audit
```

Doc updates required:

- update this plan's statuses and completion log
- update `src/docs/trader-functional-readiness-next-handoff.md`
- update `src/docs/codex-project-log.md`
- update README if new docs or user-facing capabilities are added
- update the shared `levels-system` handoff only if a real blocker is found

GitHub decision:

- Do not push a massive dirty worktree by accident.
- Only commit/push if:
  - the user explicitly asks for a commit/PR, or
  - a clean branch/commit scope is obvious and safe
- If not pushing, record that decision in the handoff note.

Acceptance criteria:

- Verification results are written into the plan and project log.
- Handoff says exactly what changed and what to do next.
- GitHub status is explicit: pushed, not pushed, or intentionally deferred.

## Implementation Order

Recommended order for the next chat:

1. Read the handoff and this plan.
2. Inspect `/import-dry-run` and current dry-run types.
3. Add the prototype analysis panel view model.
4. Add unit tests for the panel model.
5. Wire the panel into `/import-dry-run`.
6. Add Playwright tests for the visible route behavior.
7. Add fee/commission visibility if not already covered by the panel model.
8. Add the real CSV calibration guide.
9. Run focused verification.
10. Run full verification.
11. Update docs and handoff.

## Completion Log

- 2026-05-03: Plan created as the next branch after functional product
  readiness completion. No implementation work from this plan has started yet.
- 2026-05-04: Project review completed and documented in
  `src/docs/trader-execution-intelligence-project-review-2026-05-04.md`.
  Existing trade-analysis simulations were run for sample, long/short
  winners/losers, partial exits, open-position warning, rapid-fire cluster,
  inconsistent sizing, and repeated-add scenarios. The next implementation step
  remains `buildCsvDryRunPrototypeAnalysisPanel(...)`.
- 2026-05-04: `TradeAnalysisSummary.decisionReview` was added. The prototype
  analysis panel should now surface that review output instead of only showing
  readiness counts.
- 2026-05-05: Added `buildCsvDryRunPrototypeAnalysisPanel(...)`, exported its
  types, rendered `Prototype Analysis` in `/import-dry-run`, and added focused
  unit plus desktop Playwright coverage. The panel shows execution autopsy
  findings now and accepts precomputed daily/4h decision-review facts without
  importing server-only market analysis into the browser route.
- 2026-05-05: Added fee/commission visibility to the dry-run import experience
  and `/import-dry-run`. Costs are visible as import-review context, while
  execution feedback remains gross-only.
- 2026-05-05: Added `src/docs/trader-real-csv-calibration-guide.md` so future
  real broker CSV testing has safe anonymization and verification guidance.
