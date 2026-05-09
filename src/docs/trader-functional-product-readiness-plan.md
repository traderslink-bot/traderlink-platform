# Trader Functional Product Readiness Plan

## Summary

This plan focuses on functionality, feature correctness, and testability rather
than final website styling.

The app is not ready to go live yet. It still needs production auth, user
isolation, persistence, payment-plan enforcement, security/privacy review,
monitoring, real broker-import calibration, and real saved user-data flows.

This branch should move the prototype closer to product readiness by adding the
functional bridge and validation harnesses that can be tested now:

- import dry run to saved-analysis prototype
- formal import confidence state machine
- deeper execution-feedback autopsy
- synthetic trader personas
- deterministic property/fuzz tests for execution math
- truth-source evidence checks
- feature readiness dashboard
- real-data calibration harness

This work must stay execution-first. It must not add chart-reading logic,
candle fetching, support/resistance building, VWAP/EMA calculation, or market
structure calculation in this repo. `levels-system` remains the owner of
candles, support/resistance, and market structure.

## Product Boundaries

The branch must not add:

- production database writes
- real auth
- real billing
- real broker account connection
- user export/download features
- local candle fetching
- local support/resistance generation
- local market-structure scoring
- market-context-driven coaching conclusions

The branch may add deterministic in-memory/prototype records and fixtures so
the product loop can be tested without real user data.

## Step 1. Import-To-Saved-Analysis Prototype

Status: complete

Goal:

Build a prototype bridge that starts from a dry-run CSV import and produces a
saved-analysis preview object. This is not production persistence. It is a
stable in-memory/prototype contract for testing the real product loop:

CSV import -> repair/map -> confidence gate -> saved trade preview -> analytics
report -> trade review/progress/review evidence.

Implementation tasks:

- Add a product module near `src/lib/trader-analytics/product/`.
- Define a deterministic saved-analysis prototype type with:
  - import batch id
  - source broker
  - state-machine status
  - generated trade ids
  - generated trade labels
  - feedback summary ids
  - analytics report status
  - review queue item count
  - limitations
  - evidence references
- Accept existing dry-run import experience output as input.
- Convert accepted grouped trade requests into execution-feedback summaries.
- Build a trader analytics report from the generated summaries.
- Return a saved-analysis preview contract that can be shown/tested later.
- Include explicit flags:
  - `isPrototypeOnly: true`
  - `writesProductionDatabase: false`
  - `marketContextUsed: false`
  - `exportAvailable: false`

Acceptance criteria:

- Ready imports generate saved-analysis preview records.
- Blocked imports do not generate saved-analysis previews.
- Generated records keep evidence links to source rows/trades.
- The contract is deterministic and testable without a database.

## Step 2. Import Confidence State Machine

Status: complete

Goal:

Formalize import readiness into a small state machine that every product
surface can reason about.

States:

- `empty`
- `blocked`
- `needs_review`
- `ready_for_analysis`
- `prototype_saved`
- `rejected`

Implementation tasks:

- Add a state machine builder near the dry-run product modules.
- Use existing dry-run facts:
  - CSV text present/missing
  - rejected row count
  - skipped row count
  - mapping confidence
  - grouped trade count
  - feedback preview count
  - confidence gate status
  - review items
- Return:
  - state
  - severity
  - user-facing label
  - primary next action
  - allowed actions
  - blockers
  - review reasons
  - evidence refs
- Make state transitions deterministic.
- Use this state machine inside the saved-analysis prototype.

Acceptance criteria:

- Blank CSV is `empty` or `blocked`.
- Rejected rows are `blocked`.
- Low-confidence but usable imports are `needs_review`.
- Valid grouped trades are `ready_for_analysis`.
- A successful prototype save becomes `prototype_saved`.
- Rejected imports remain explicit and do not silently proceed.

## Step 3. Deeper Execution Feedback Autopsy

Status: complete

Goal:

Add more execution-only detail to explain when a trade improved or got worse.

Implementation tasks:

- Add an execution autopsy enrichment module that consumes existing
  `execution_feedback_summary_v1` style outputs.
- Produce:
  - first mistake moment
  - first strength moment
  - best add
  - worst add
  - best reduction
  - worst reduction
  - green-to-red or giveback observation where execution facts support it
  - position-size escalation warning
  - trade became problem after execution number
  - concise lifecycle summary
- Keep the output evidence-backed:
  - execution index
  - label
  - reason
  - source point id or risk/strength label
  - confidence
- Do not use candles, market structure, support/resistance, VWAP, or EMA.

Acceptance criteria:

- The autopsy can explain the key turning point for scale-in/problem trades.
- Clean trades produce strengths without fake mistakes.
- Every observation has traceable evidence.

## Step 4. Synthetic Trader Personas

Status: complete

Goal:

Create deterministic synthetic trader personas to test whether the product
identifies behavior profiles correctly.

Personas:

- overtrader
- clean scalper
- revenge-like re-entry trader
- poor exit trader
- strong risk manager
- inconsistent sizer

Implementation tasks:

- Add persona fixtures as generated in-memory requests, not real customer data.
- Keep trades execution-only.
- Generate enough trades per persona to make behavior visible.
- Run them through execution feedback and trader analytics.
- Produce a persona evaluation result:
  - expected label
  - detected label
  - matching observations
  - confidence
  - limitations

Acceptance criteria:

- Each persona produces the expected dominant behavior.
- Tests fail if the app no longer detects the intended behavior cluster.

## Step 5. Property/Fuzz Tests For CSV And Execution Math

Status: complete

Goal:

Add deterministic property-style tests without introducing a random/flaky test
dependency.

Implementation tasks:

- Create a seeded/deterministic scenario generator for execution sequences:
  - long winner
  - long loser
  - short winner
  - short loser
  - partial exits
  - over-reductions
  - flat re-entry
  - same-timestamp fills
  - open leftover
  - zero/invalid rows
- Test invariants:
  - realized P/L is finite when a trade can be evaluated
  - position returns to zero for closed trades
  - open leftovers are explicitly flagged
  - rejected rows do not become accepted execution facts
  - trade counts do not become negative
  - risk/strength observations cite existing evidence
  - market context remains unused

Acceptance criteria:

- The execution math survives a broader deterministic scenario set.
- The tests are repeatable and not dependent on market hours or providers.

## Step 6. Truth-Source Tests

Status: complete

Goal:

Require user-facing claims to be traceable to evidence.

Implementation tasks:

- Add a truth-source checker for product view models.
- Check claims from:
  - saved-analysis prototype
  - execution autopsy enrichment
  - persona evaluation
  - import state machine
- Require evidence refs to include at least one of:
  - trade id
  - execution index
  - import row number
  - feedback point label/id
  - risk/strength label
  - report metric id
- Fail when strong claims have no evidence.
- Keep market-context fields observational only.

Acceptance criteria:

- Every coaching/import/readiness claim produced by this branch has evidence.
- Market context cannot be used as evidence for execution-only conclusions.

## Step 7. Feature Readiness Dashboard

Status: complete

Goal:

Add an internal product-readiness surface that says what is product-ready,
prototype-only, blocked, or waiting for real data.

Implementation tasks:

- Add a product-readiness view model.
- Add an internal route, likely `/platform-readiness` if it already exists or a
  new nearby surface if needed.
- Track feature modules:
  - CSV dry run
  - row repair
  - import confidence gate
  - saved-analysis prototype
  - execution feedback
  - trader analytics
  - review queue
  - progress dashboard
  - market context add-on
  - auth/billing/persistence
- For each module show:
  - status
  - what works now
  - what blocks go-live
  - verification coverage
  - next validation action
- Avoid presenting prototype-only modules as production-ready.

Acceptance criteria:

- The app has a clear internal readiness page for deciding what can ship later.
- The readiness page does not overclaim auth, billing, persistence, broker
  sync, export, or market-context scoring.

## Step 8. Real-Data Calibration Harness

Status: complete

Goal:

Prepare the tool that will accept real imported trades later and compare parser
output, reconstructed trades, generated feedback, and required user correction.

Implementation tasks:

- Add a calibration harness module that accepts anonymized CSV text or existing
  dry-run experiences.
- Produce:
  - parse success/failure
  - accepted/rejected row counts
  - grouped trade count
  - correction count
  - confidence state
  - saved-analysis prototype readiness
  - detected broker format
  - top calibration blockers
  - privacy/safety notes
- Include a deterministic sample calibration batch using synthetic broker
  fixture text.
- Ensure the harness does not connect to IBKR, live brokers, or
  `levels-system`.

Acceptance criteria:

- The calibration harness can be run now with fixtures.
- Later real broker CSVs can be dropped into the same contract.
- The harness identifies what user corrections would be needed before saving.

## Verification Plan

Run focused tests first:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts`

Then run broader checks:

- `npm run test:e2e`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:all`
- `npm audit`

## Files To Add Or Update

Expected additions:

- `src/docs/trader-functional-product-readiness-plan.md`
- `src/lib/trader-analytics/product/functional-readiness.ts`
- `src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts`

Expected updates:

- `src/lib/trader-analytics/index.ts`
- `app/platform-readiness/page.tsx`
- `README.md`
- `src/docs/codex-project-log.md`

## Completion Log

- 2026-05-03: Plan created before implementation.
- 2026-05-03: Implementation started after inspecting the existing CSV dry-run, execution feedback, trader analytics report, and platform readiness contracts.
- 2026-05-03: Completed all eight steps. Added the functional readiness module, exported contracts, route surface, focused tests, README note, and project-log entry.
- 2026-05-03: Verification passed: focused functional readiness suite, platform readiness suite, `npm run test:e2e`, `npx tsc --noEmit --pretty false`, `npm run lint` with 4 existing warnings and 0 errors, `npm run build`, `npm run verify:all`, and `npm audit`.
- 2026-05-03: Follow-up user-workflow plan created at `src/docs/trader-functional-readiness-user-workflow-plan.md`; short resume handoff created at `src/docs/trader-functional-readiness-next-handoff.md`.
