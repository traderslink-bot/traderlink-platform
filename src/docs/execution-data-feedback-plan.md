# Execution Data Feedback Plan

## Purpose

This document tracks the execution-data feedback lane.

The app should give trader feedback through two complementary evidence sources:

1. **Execution behavior**
   - what the trader did through buy/sell orders, timestamps, share size,
     sequence, adds, reductions, exits, and position lifecycle
2. **Market/candle context**
   - what the market did through candles, support/resistance, VWAP/EMA,
     structure, range, MFE/MAE, giveback, and level interaction

This plan is for the first lane: trader feedback that can be produced mostly
or entirely from execution data.

The goal is to make the system useful even before candle data is available, and
then let candle context sharpen the feedback later.

## Continuous Work Protocol

This file is the source of truth for the execution-data feedback lane.

When the user says to continue, take the next unchecked item in the work queue,
complete it, update this file, run the relevant verification, and continue to
the next item unless one of the stop conditions below is hit.

Do not wait for a new prompt between normal implementation steps.

### Working Rules

- Keep execution feedback independent from candle fetching and chart reading.
- Reuse existing request validation where possible instead of creating a second
  incompatible request shape.
- Prefer a small execution-feedback module over expanding the full trade
  analysis summary too early.
- Add tests with every new contract or pattern family.
- Keep all wording factual and evidence-bound.
- Do not make candle-dependent claims in execution-only output.
- Do not ask `levels-system` for execution-feedback features; this lane belongs
  in this repo.
- Update this file whenever phase status, current task, open questions, or the
  best next step changes.
- Update `src/docs/codex-project-log.md` when a phase completes or the resume
  point materially changes.

### Stop Conditions

Pause and ask the user only if:

- a choice would permanently change the public request or summary contract
- a choice would merge execution-only feedback with candle-derived conclusions
  in a way that could mislead users
- an implementation would require moving ownership into `levels-system`
- a destructive filesystem or git operation is required
- existing user changes conflict with the execution-feedback files in a way
  that cannot be safely merged

Otherwise keep going.

### Default Verification Ladder

After a narrow implementation step:

```bash
npx vitest run <new-or-touched-test-files>
npx tsc --noEmit
```

After a phase completes:

```bash
npm run verify:levels-system
npm run verify:all
```

After adding an API route or debug page:

```bash
npm run build
npm run lint
```

Existing lint warnings can be left alone if the command exits successfully, but
new lint errors must be fixed.

### Current Status Board

| Phase | Status | Output |
| --- | --- | --- |
| Phase 1: Inventory and boundary | Completed | `src/docs/execution-data-feedback-inventory.md` |
| Phase 2: Execution fact summary | Completed | `src/lib/execution-feedback/build-execution-feedback-facts.ts` |
| Phase 3: Execution-only behavior patterns | Completed | `src/lib/execution-feedback/execution-behavior-patterns.ts` |
| Phase 4: Summary and coaching bridge | Completed | `execution_feedback_summary_v1` |
| Phase 5: API and debug UI | Completed | `/api/execution-feedback/debug`, `/debug/execution-feedback` |
| Phase 6: Full trade-analysis integration | Completed | `executionFeedback` section in `trade_analysis_summary_v1` |
| Docs and full verification | Completed | final verification |

### Current Task Pointer

Current task: complete.

Current phase: Complete.

Next action: use `/debug/execution-feedback` for execution-only request testing.

## Ownership Boundary

`trader-intelligence-v2` owns execution behavior analysis.

`levels-system` owns candle fetching, candle normalization, support/resistance,
VWAP/EMA, market structure, and chart-reading context.

Execution feedback must not require `levels-system` to produce a useful first
read. Candle context can enrich or confirm execution feedback later, but the
execution lane should stand on its own.

## Current System Shape

Current execution-data foundations already exist in:

- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline.ts`
- `src/lib/raw-trade-timeline/builders/build-trade-timeline.ts`
- `src/lib/raw-trade-timeline/builders/build-trade-state-series.ts`
- `src/lib/pattern-input/builders/build-pattern-input.ts`
- `src/lib/pattern-detection/patterns/position-building-patterns.ts`
- `src/lib/pattern-detection/patterns/position-reduction-patterns.ts`
- `src/lib/pattern-detection/patterns/position-structure-patterns.ts`
- `src/lib/pattern-detection/patterns/scaling-quality/`
- `src/lib/pattern-detection/patterns/trade-closure-patterns.ts`
- `src/lib/pattern-detection/patterns/execution-frequency-patterns.ts`
- `src/lib/behavior-analysis/`
- `src/lib/coaching/`

The existing system already understands many execution-driven facts:

- opening side and direction
- execution ordering
- add / reduce / exit sequence
- share-size changes
- partial exits
- full exits
- open positions
- multi-build trades
- repeated rescue attempts
- balanced vs unbalanced management
- position structure
- some scaling-quality patterns

The gap is not that execution analysis is missing.

The gap is that execution-only feedback is not yet presented as its own clear
contract, report, debug view, or calibration lane.

## Product Goal

Given only:

- symbol
- trade direction
- session date / bucket
- executions:
  - timestamp
  - side
  - shares
  - price
  - optional execution id/order id/source/notes

The app should be able to answer:

- Did the trader build the position cleanly?
- Did the trader add responsibly or chase/revenge/average down?
- Did share size increase after pain or after confirmation?
- Did the trader reduce risk in time?
- Did partial exits improve or damage the trade?
- Did the trader overcomplicate the position?
- Did the trader leave an unintended open position?
- Did the trader show discipline, hesitation, panic, or over-management?
- What is the single most important execution behavior to improve?
- What did the trader do well?

When candle data is later available, the app can add:

- whether the adds were into support/resistance
- whether exits happened into support/resistance
- whether reductions came before breakdown or before continuation
- whether trade management matched market structure
- whether market context confirms or softens the execution-only read

## Design Rule

Execution-only feedback should be honest about what it can and cannot know.

It can say:

- "You increased size after the position moved against you."
- "Your first reduction only removed a small amount of risk."
- "The trade used three adds before any reduction."
- "You fully closed the position."
- "You scaled out in two reductions."

It should not say without candles:

- "You added into support."
- "You chased a breakout."
- "You sold before the next leg higher."
- "You ignored resistance."
- "The setup was invalid."

Those claims require market/candle context.

## Proposed Architecture

### 1. Execution Feedback Input Contract

Create a stable execution-feedback input contract that can be built from the
existing trade-analysis request contract.

Proposed path:

```text
src/lib/execution-feedback/request/execution-feedback-request-contract.ts
```

Likely input shape:

```ts
interface ExecutionFeedbackRequest {
  symbol: string;
  tradeDirection: "long" | "short";
  sessionContext: {
    sessionDate: string;
    sessionBucket: string;
  };
  executions: ProviderExecution[];
}
```

It should reuse or wrap:

```text
src/lib/trade-analysis/request/trade-analysis-request-contract.ts
```

so request validation does not fork unnecessarily.

### 2. Execution Feedback Facts

Create an execution-only fact summary extracted from the raw timeline.

Proposed path:

```text
src/lib/execution-feedback/build-execution-feedback-facts.ts
```

Likely fact groups:

- position lifecycle
  - opened
  - fully closed
  - open shares remaining
  - total executions
  - add count
  - reduction count
  - full exit count
- sizing behavior
  - initial size
  - max size
  - final size
  - largest add size
  - average add size
  - size expansion ratio
- sequencing behavior
  - first action
  - first reduction index/time
  - adds before first reduction
  - reductions after max size
  - execution clustering
- price behavior from executions only
  - average entry price
  - average exit price
  - realized execution-only P/L estimate
  - add price progression
  - exit price progression
- risk behavior from executions only
  - increased size after worse price
  - reduced size after better price
  - reduced size after worse price
  - oversized final exit
  - open-position warning

### 3. Execution Behavior Patterns

Some patterns already exist, but the execution-only lane should identify which
patterns can be trusted without candles.

Proposed path:

```text
src/lib/execution-feedback/execution-behavior-patterns.ts
```

Initial pattern families:

- position construction
  - single-entry trade
  - structured scale-in
  - overbuilt position
  - repeated adds before reduction
- size discipline
  - controlled initial risk
  - size expansion after adverse execution price
  - large add after position already grew
  - inconsistent share sizing
- risk reduction
  - early risk reduction
  - delayed first reduction
  - small first reduction
  - decisive risk-off exit
- exit structure
  - full planned exit
  - partial exit sequence
  - all-or-nothing exit
  - open-position leftover
- behavioral warnings
  - possible averaging down
  - possible revenge add
  - possible hesitation to reduce
  - possible over-management

Pattern names must stay factual and avoid overclaiming.

For example:

- good:
  - `size_expansion_after_adverse_price`
  - `three_adds_before_first_reduction`
  - `small_first_risk_reduction`
- avoid without candles:
  - `chased_breakout`
  - `ignored_support`
  - `bad_setup`

### 4. Execution Feedback Summary Contract

Create a stable UI/API/debug output contract.

Proposed path:

```text
src/lib/execution-feedback/summary/build-execution-feedback-summary.ts
```

Likely output shape:

```ts
interface ExecutionFeedbackSummary {
  contractVersion: "execution_feedback_summary_v1";
  symbol: string;
  tradeDirection: "long" | "short";
  sessionDate: string;
  sessionBucket: string;
  executionCount: number;
  lifecycle: {...};
  sizing: {...};
  sequencing: {...};
  executionOnlyPnl: {...};
  strengths: ExecutionFeedbackPoint[];
  risks: ExecutionFeedbackPoint[];
  primaryFocus: ExecutionFeedbackPoint | null;
  limitations: string[];
}
```

Every summary should include limitations such as:

- "This read uses execution data only."
- "Market context, support/resistance, and candle structure were not used."
- "Setup quality and level interaction require candle context."

### 5. Execution Feedback Runner

Create a top-level runner that does not require candles.

Proposed path:

```text
src/lib/execution-feedback/run-execution-feedback.ts
```

Responsibilities:

1. validate request
2. build raw trade timeline with minimal/no candles if possible
3. build execution facts
4. detect execution-only behavior patterns
5. build stable summary

Important implementation question:

The current raw timeline builder expects candle arrays. The execution-only lane
may need either:

- a dedicated execution-only timeline builder, or
- a safe empty-candle mode that preserves execution facts without claiming
  structural/candle availability

This should be decided carefully before implementation.

### 6. Execution Feedback API / Debug Surface

After the core summary is stable, add:

```text
POST /api/execution-feedback/debug
/debug/execution-feedback
```

This should mirror the trade-analysis debug surface but not call
`levels-system`.

This lets the app test pure execution-feedback behavior without needing IBKR,
stub candles, or saved market data.

### 7. Integration With Full Trade Analysis

Once execution-only summary exists, the full trade-analysis summary can include
two separate evidence sections:

```text
executionFeedback
marketContext
```

The final combined analysis should be able to distinguish:

- execution problem confirmed by market context
- execution problem softened by market context
- execution strength confirmed by market context
- execution-only warning that needs market context before stronger judgment

Example:

Execution-only:

```text
You added twice before any reduction.
```

With candles:

```text
Those adds also occurred below VWAP and away from nearby support.
```

or:

```text
Those adds occurred near a shared support zone, so the sizing behavior was
aggressive but not random.
```

## Phased Work Plan

### Phase 1: Inventory And Boundary

Status: Completed

Goal:

Understand exactly what execution-only data the app already derives, where it
lives, which existing patterns are safe without candles, and whether the new
lane should build from the current raw timeline or a dedicated execution-only
fact builder.

Tasks:

- [x] `WQ-001` Inventory execution-derived fields in raw timeline output
- [x] `WQ-002` Inventory execution-derived fields in PatternInput
- [x] `WQ-003` Inventory execution-only and mixed pattern IDs in Layer 2
- [x] `WQ-004` Inventory behavior/coaching consumers that already use
      execution-derived patterns
- [x] `WQ-005` Mark each existing pattern as:
  - execution-only safe
  - candle-context required
  - mixed
- [x] `WQ-006` Identify raw timeline fields and builders that currently
      require candle arrays
- [x] `WQ-007` Decide whether Phase 2 should use:
  - existing raw timeline with empty/synthetic-safe candle handling
  - a smaller execution-only fact builder
  - both, with execution facts as the stable public contract
- [x] `WQ-008` Write the inventory and boundary decision
- [x] `WQ-009` Update this file with Phase 1 results and mark Phase 2 ready

Deliverable:

```text
src/docs/execution-data-feedback-inventory.md
```

Phase 1 definition of done:

- inventory doc exists
- execution-only-safe vs mixed vs candle-required pattern categories are listed
- recommended Phase 2 builder approach is chosen
- no code behavior needs to change yet unless a tiny type/test helper is needed
- this plan's status board and task pointer are updated

### Phase 2: Execution Fact Summary

Status: Completed

Goal:

Create the stable execution-only fact contract that all later execution feedback
uses.

Tasks:

- [x] `WQ-010` Create `src/lib/execution-feedback/` module structure
- [x] `WQ-011` Add execution feedback fact types
- [x] `WQ-012` Add request-to-normalized-execution helper or wrapper around
      the existing trade-analysis request contract
- [x] `WQ-013` Build position lifecycle fact extraction
- [x] `WQ-014` Build sizing behavior fact extraction
- [x] `WQ-015` Build sequencing behavior fact extraction
- [x] `WQ-016` Build execution-price behavior fact extraction
- [x] `WQ-017` Build execution-only risk behavior facts
- [x] `WQ-018` Add tests for long, short, partial exit, open position, scale-in,
      scale-out, and repeated-add cases
- [x] `WQ-019` Verify no candle fields are required
- [x] `WQ-020` Add a compact debug formatter if useful for test failures
- [x] `WQ-021` Update this file with Phase 2 results and mark Phase 3 ready

Deliverable:

```text
src/lib/execution-feedback/build-execution-feedback-facts.ts
```

Expected supporting files:

```text
src/lib/execution-feedback/types/execution-feedback-facts.ts
src/lib/execution-feedback/__tests__/build-execution-feedback-facts.test.ts
```

Phase 2 definition of done:

- facts can be built from execution request data without `levels-system`
- tests cover long and short direction math
- tests cover add/reduce/full-exit/open-position lifecycle
- execution-only P/L estimate is clearly labeled as gross/fees-excluded if
  included
- `npx tsc --noEmit` passes

### Phase 3: Execution-Only Behavior Patterns

Status: Completed

Goal:

Convert execution facts into factual strengths, risks, and neutral context
without relying on candles.

Tasks:

- [x] `WQ-022` Define execution feedback point type
- [x] `WQ-023` Add neutral context pattern candidates
- [x] `WQ-024` Add position-construction strength/risk candidates
- [x] `WQ-025` Add size-discipline strength/risk candidates
- [x] `WQ-026` Add risk-reduction strength/risk candidates
- [x] `WQ-027` Add exit-structure strength/risk candidates
- [x] `WQ-028` Add factual descriptions and evidence payloads
- [x] `WQ-029` Add severity/strength/priority ordering
- [x] `WQ-030` Add tests for each pattern family
- [x] `WQ-031` Add tests proving candle-dependent labels are not emitted
- [x] `WQ-032` Update this file with Phase 3 results and mark Phase 4 ready

Deliverable:

```text
src/lib/execution-feedback/execution-behavior-patterns.ts
```

Expected supporting files:

```text
src/lib/execution-feedback/types/execution-feedback-point.ts
src/lib/execution-feedback/__tests__/execution-behavior-patterns.test.ts
```

Phase 3 definition of done:

- each emitted point has a stable id
- each point includes evidence from executions
- no point claims support/resistance, VWAP, breakout, trend, setup quality, or
  candle structure
- tests cover both long and short adverse-price logic
- the strongest risk/strength ordering is deterministic

### Phase 4: Summary And Coaching Bridge

Status: Completed

Goal:

Expose a stable execution-only summary that can power CLI/API/UI output and
later feed coaching.

Tasks:

- [x] `WQ-033` Build `execution_feedback_summary_v1`
- [x] `WQ-034` Include lifecycle, sizing, sequencing, execution-price, and
      risk fact groups
- [x] `WQ-035` Include neutral context, strengths, risks, and primary focus
- [x] `WQ-036` Add deterministic primary-focus selection
- [x] `WQ-037` Add explicit limitations
- [x] `WQ-038` Add summary snapshot tests
- [x] `WQ-039` Decide whether coaching consumes this now or waits for API/UI
- [x] `WQ-040` Update this file with Phase 4 results and mark Phase 5 ready

Deliverable:

```text
src/lib/execution-feedback/summary/build-execution-feedback-summary.ts
```

Expected supporting files:

```text
src/lib/execution-feedback/run-execution-feedback.ts
src/lib/execution-feedback/__tests__/build-execution-feedback-summary.test.ts
src/lib/execution-feedback/__tests__/run-execution-feedback.test.ts
```

Phase 4 definition of done:

- one top-level runner can produce a summary from execution request JSON
- summary clearly separates strengths, risks, primary focus, and limitations
- snapshot tests lock the public contract
- current coaching remains unchanged unless an explicit bridge is added and
  tested

### Phase 5: API And Debug UI

Status: Completed

Goal:

Give the app a user/developer-facing way to run execution-only feedback without
candle/provider dependencies.

Tasks:

- [x] `WQ-041` Add batch runner if Phase 4 only supports single requests
- [x] `WQ-042` Add `POST /api/execution-feedback/debug`
- [x] `WQ-043` Add `GET /api/execution-feedback/debug` contract description
- [x] `WQ-044` Add `/debug/execution-feedback`
- [x] `WQ-045` Add or reuse request fixtures
- [x] `WQ-046` Add API route tests
- [x] `WQ-047` Add page build verification
- [x] `WQ-048` Add comparison output if useful after real examples exist
- [x] `WQ-049` Update README and this file

Deliverables:

```text
app/api/execution-feedback/debug/route.ts
app/debug/execution-feedback/page.tsx
```

Phase 5 definition of done:

- debug API returns stable execution feedback contract
- debug UI can paste a request and run validation/summary
- no route calls `levels-system`
- `npm run build` passes
- `npm run lint` exits with 0 errors

### Phase 6: Full Trade Analysis Integration

Status: Completed

Goal:

Merge the execution feedback lane into full trade-analysis output without
blurring execution behavior and market/candle context.

Tasks:

- [x] `WQ-050` Design `trade_analysis_summary_v2` or compatible extension
- [x] `WQ-051` Include execution feedback summary in full trade-analysis debug
      output
- [x] `WQ-052` Keep execution feedback and market context visibly separate
- [x] `WQ-053` Add combined interpretation rules
- [x] `WQ-054` Add tests proving candle context enriches but does not overwrite
      execution facts
- [x] `WQ-055` Add tests proving market structure remains observational unless
      separately promoted
- [x] `WQ-056` Update README, trade-analysis docs, project log, and this file

Deliverable:

```text
executionFeedback section in trade_analysis_summary_v1
```

This was implemented as a backward-compatible summary extension instead of a
contract-version bump. The new section carries its own
`execution_feedback_summary_v1` contract and is marked as separated from market
context.

Phase 6 definition of done:

- full trade-analysis output shows execution feedback and market context as
  separate evidence sections
- execution facts do not depend on candles
- candle context may enrich interpretation but cannot rewrite execution facts
- existing trade-analysis debug route remains backward-compatible or has an
  explicit contract-version bump

## Initial Pattern Candidates

### Strength Candidates

- `clean_single_entry_full_exit`
- `structured_partial_exit_sequence`
- `early_position_risk_reduction`
- `consistent_share_sizing`
- `decisive_full_exit`
- `controlled_scale_in`

### Risk Candidates

- `multiple_adds_before_first_reduction`
- `size_expansion_after_adverse_price`
- `large_late_add`
- `small_first_risk_reduction`
- `open_position_leftover`
- `overbuilt_position`
- `rapid_fire_execution_cluster`
- `inconsistent_share_sizing`
- `all_or_nothing_exit_after_many_adds`

### Neutral Context Candidates

- `single_entry_trade`
- `multi_entry_trade`
- `partial_exit_trade`
- `full_exit_trade`
- `open_position_trade`
- `scale_in_scale_out_trade`

## Test Fixture Needs

Execution-only fixtures should cover:

- long winner
- long loser
- short winner
- short loser
- single entry / single exit
- scale in / full exit
- scale in / partial exits
- repeated adds before reduction
- open position
- out-of-order executions
- exit before entry invalid request
- mixed-symbol invalid request
- zero/negative shares invalid request

Fixture work queue:

- [x] `WQ-057` Reuse existing valid fixtures where possible
- [x] `WQ-058` Add missing short-loser fixture
- [x] `WQ-059` Add repeated-adds-before-reduction fixture
- [x] `WQ-060` Add inconsistent-share-sizing fixture
- [x] `WQ-061` Add rapid-fire-execution-cluster fixture
- [x] `WQ-062` Add invalid execution-only fixture cases
- [x] `WQ-063` Add fixture contract tests

Detailed fixture hardening plan:

- Keep fixture files in `src/docs/trade-analysis-request-fixtures/` so full
  trade analysis and execution-only feedback share the same public request
  shape.
- Reuse existing fixtures for broad compatibility checks:
  - `long-winner.json`
  - `long-loser.json`
  - `short-winner.json`
  - `open-position.json`
  - `partial-exits.json`
- Add new valid fixtures:
  - `short-loser.json`: short opens with sell, covers higher, should produce
    gross negative execution-only P/L and a losing reduction point.
  - `repeated-adds-before-reduction.json`: long adds at progressively worse
    execution prices before any reduction, should produce
    `size_expansion_after_adverse_price`,
    `multiple_adds_before_first_reduction`, and `overbuilt_position`.
  - `inconsistent-share-sizing.json`: long entry-side sizes vary enough to
    produce `inconsistent_share_sizing`.
  - `rapid-fire-execution-cluster.json`: execution timestamps are clustered
    within seconds, should produce `rapid_fire_execution_cluster`.
- Add invalid fixture collection:
  - `invalid-execution-only-requests.json`: multiple bad request examples for
    exit-before-entry, mixed symbols, invalid timestamp, invalid side, invalid
    shares, and invalid price.
- Add fixture contract tests that prove:
  - existing valid fixtures still validate through the shared request contract
    and can run through `runExecutionFeedback(...)`.
  - new valid fixtures produce the expected primary focus or required point IDs.
  - invalid execution-only fixtures remain local validation failures and do not
    build summaries.
  - no execution-feedback fixture requires candles or provider calls.
  - fixture summaries preserve the execution-only limitations.

Fixture storage:

```text
src/docs/trade-analysis-request-fixtures/
```

Do not move existing fixtures unless a later broader fixture taxonomy is needed.

## Open Questions

- [x] `OQ-001` Should execution feedback use the existing Layer 2/Layer 3 pattern system, or
  should it have a smaller dedicated execution-feedback pattern layer first?
- [x] `OQ-002` Should execution feedback be part of the current coaching output immediately,
  or exposed as a separate debug/report contract first?
- [x] `OQ-003` Should execution-only P/L be included if commissions/fees are not available?
- [x] `OQ-004` Should the system classify adding at a worse price as "averaging down" for
  both long and short trades, or use a more neutral phrase until candle context
  is available?
- [x] `OQ-005` How should partial fills from the same order be grouped?
- [x] `OQ-006` Do broker execution IDs or order IDs need to be preserved in summaries?

Default assumptions until answered:

- `OQ-001`: Use a dedicated execution-feedback point layer first, then bridge
  into existing Layer 2/Layer 3 only after the summary contract is stable.
- `OQ-002`: Keep execution feedback separate from coaching until Phase 4 proves
  the summary contract is stable.
- `OQ-003`: Include gross execution-only P/L only if clearly labeled as
  commissions/fees excluded.
- `OQ-004`: Prefer neutral names like `size_expansion_after_adverse_price`
  before using stronger words like averaging down.
- `OQ-005`: Preserve individual fills first; grouping can be added later if
  order IDs prove reliable.
- `OQ-006`: Preserve broker/order IDs in debug/evidence payloads, but do not
  require them for pattern detection.

Resolved current-version answers:

- `OQ-001`: Use the dedicated execution-feedback fact/point layer first. The
  existing Layer 2/Layer 3 pattern system remains for candle-aware full trade
  analysis.
- `OQ-002`: Keep execution feedback separate from coaching for now. It is
  exposed through `execution_feedback_summary_v1`, the debug API, the debug UI,
  and the separate `executionFeedback` section in full trade-analysis summaries.
- `OQ-003`: Include gross execution-only P/L, explicitly labeled as excluding
  commissions, fees, borrow costs, and slippage.
- `OQ-004`: Use neutral wording such as
  `size_expansion_after_adverse_price`; do not call it averaging down or
  revenge adding without candle/market context.
- `OQ-005`: Preserve individual fills in the current version. Grouping by order
  ID can be added later if real broker data proves the IDs are reliable and
  grouping improves the read.
- `OQ-006`: Preserve broker/order IDs in execution evidence and debug payloads,
  but do not require them for fact building or point detection.

## Continuous Work Queue

Use this queue when continuing work without interruption.

### Phase 1 Queue

- [x] `WQ-001` Inventory execution-derived fields in raw timeline output.
  - Read raw timeline types and builders.
  - List fields that come entirely from executions.
  - List fields that require candles.
  - Record findings in `src/docs/execution-data-feedback-inventory.md`.
- [x] `WQ-002` Inventory execution-derived fields in PatternInput.
  - Read PatternInput types and builder.
  - Mark fields as execution-only, candle-only, or mixed.
  - Record findings in the inventory doc.
- [x] `WQ-003` Inventory Layer 2 pattern IDs.
  - Read pattern files listed in this plan.
  - Categorize existing pattern IDs as execution-only safe, candle-required, or
    mixed.
  - Record rationale for each category.
- [x] `WQ-004` Inventory downstream behavior/coaching consumers.
  - Read behavior analysis and coaching builders.
  - Note which current outputs could consume execution-only feedback later.
- [x] `WQ-005` Decide the execution-feedback builder boundary.
  - Prefer the smallest safe builder that does not require candles.
  - Document the decision and alternatives.
- [x] `WQ-006` Update this plan.
  - Mark Phase 1 completed if done.
  - Set current task pointer to `WQ-010`.
  - Add verification results.

### Phase 2 Queue

- [x] `WQ-010` Create module folders and types.
- [x] `WQ-011` Implement lifecycle facts.
- [x] `WQ-012` Implement sizing facts.
- [x] `WQ-013` Implement sequencing facts.
- [x] `WQ-014` Implement execution-price facts.
- [x] `WQ-015` Implement risk facts.
- [x] `WQ-016` Add focused fact tests.
- [x] `WQ-017` Run focused tests and `npx tsc --noEmit`.
- [x] `WQ-018` Update this plan and set current task pointer to `WQ-022`.

### Phase 3 Queue

- [x] `WQ-022` Define execution feedback point contract.
- [x] `WQ-023` Implement neutral context points.
- [x] `WQ-024` Implement strength points.
- [x] `WQ-025` Implement risk points.
- [x] `WQ-026` Implement deterministic priority ordering.
- [x] `WQ-027` Add pattern tests.
- [x] `WQ-028` Run focused tests and `npx tsc --noEmit`.
- [x] `WQ-029` Update this plan and set current task pointer to `WQ-033`.

### Phase 4 Queue

- [x] `WQ-033` Implement summary contract.
- [x] `WQ-034` Implement runner.
- [x] `WQ-035` Add summary snapshots.
- [x] `WQ-036` Add limitation text tests.
- [x] `WQ-037` Run focused tests and `npx tsc --noEmit`.
- [x] `WQ-038` Update this plan and set current task pointer to `WQ-041`.

### Phase 5 Queue

- [x] `WQ-041` Implement execution-feedback batch runner.
- [x] `WQ-042` Implement API route.
- [x] `WQ-043` Implement debug page.
- [x] `WQ-044` Add API/page tests.
- [x] `WQ-045` Run `npm run build` and `npm run lint`.
- [x] `WQ-046` Update docs and set current task pointer to `WQ-050`.

### Phase 6 Queue

- [x] `WQ-050` Design trade-analysis summary integration.
- [x] `WQ-051` Implement integration behind stable contract/versioning.
- [x] `WQ-052` Add combined-analysis tests.
- [x] `WQ-053` Run full verification.
- [x] `WQ-054` Update docs and mark this roadmap branch complete.

## Completion Rules

The execution-data feedback lane is complete when:

- execution-only requests can be validated without candle/provider calls
- execution facts can be built without `levels-system`
- execution behavior points can be emitted without candle-dependent claims
- `execution_feedback_summary_v1` is stable and snapshot-tested
- an API route and debug page can run execution-only feedback
- full trade-analysis output can include execution feedback separately from
  candle/market context
- all relevant tests, TypeScript, build, and lint checks pass

## Current Progress Log

### 2026-05-02

- Created this roadmap/tracker.
- Expanded it into a continuous work queue with task IDs, stop conditions,
  verification ladder, phase definitions of done, open-question defaults, and
  completion rules.
- Completed Phase 1 inventory and boundary decision in
  `src/docs/execution-data-feedback-inventory.md`.
- Decision: Phase 2 will use a dedicated execution-only fact builder that
  reuses request validation, execution normalization, and trade-state math, but
  does not call candles, PatternInput, support/resistance, market structure, or
  `levels-system`.
- Completed Phase 2 execution fact summary:
  - added `src/lib/execution-feedback/build-execution-feedback-facts.ts`
  - added `src/lib/execution-feedback/types/execution-feedback-facts.ts`
  - added `src/lib/execution-feedback/index.ts`
  - added focused fact coverage in
    `src/lib/execution-feedback/__tests__/build-execution-feedback-facts.test.ts`
  - verified long and short direction math, partial exits, open positions,
    execution sorting, adverse-price adds, gross realized P/L, and no
    candle/provider dependency
  - focused test passed: `1` file / `5` tests
  - `npx tsc --noEmit` passed
- Completed Phase 3 execution-only behavior points:
  - added `src/lib/execution-feedback/execution-behavior-patterns.ts`
  - added `src/lib/execution-feedback/types/execution-feedback-point.ts`
  - points now emit deterministic neutral context, strengths, and risks
  - tests cover clean single-entry exits, favorable scale-ins, adverse adds,
    repeated adds before reductions, open-position leftovers, small first
    reductions, late adds, rapid execution clusters, short-side adverse-price
    logic, and forbidden candle-dependent wording
  - focused tests passed: `2` files / `11` tests
  - `npx tsc --noEmit` passed
- Completed Phase 4 summary and runner:
  - added `src/lib/execution-feedback/summary/build-execution-feedback-summary.ts`
  - added `src/lib/execution-feedback/run-execution-feedback.ts`
  - `execution_feedback_summary_v1` now exposes lifecycle, sizing, sequencing,
    gross execution-only P/L, risk facts, context, strengths, risks,
    primary focus, warnings, and explicit limitations
  - coaching remains unchanged for now; execution feedback stays separate until
    the API/debug surface and full-analysis integration are stable
  - focused tests passed: `4` files / `16` tests
  - `npx tsc --noEmit` passed
- Completed Phase 5 API and debug UI:
  - added `src/lib/execution-feedback/batch/run-execution-feedback-batch.ts`
  - added `app/api/execution-feedback/debug/route.ts`
  - added `app/debug/execution-feedback/page.tsx`
  - added `app/debug/execution-feedback/execution-feedback-debug-client.tsx`
  - linked the execution debug page from `app/page.tsx`
  - added focused batch/API tests
  - focused execution-feedback tests passed: `6` files / `23` tests
  - `npx tsc --noEmit` passed
  - `npm run build` passed and produced `/api/execution-feedback/debug` and
    `/debug/execution-feedback`
  - `npm run lint` passed with `0` errors and `4` pre-existing warnings
- Completed Phase 6 full trade-analysis integration:
  - `buildTradeAnalysisSummary(...)` now includes an `executionFeedback`
    section built from executions only
  - execution feedback is marked `marketContextUsed: false` and
    `separatedFromMarketContext: true`
  - support/resistance and market structure remain separate summary sections
  - market structure remains observational with `usedForScoring: false`
  - focused integration tests passed: `10` files / `34` tests
  - `npx tsc --noEmit` passed
- Final verification completed:
  - `npm run verify:all` passed with `66` files / `615` tests, plus
    `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  - `npx tsc --noEmit` passed
  - `npm run build` passed and listed `/api/execution-feedback/debug`,
    `/debug/execution-feedback`, `/api/trade-analysis/debug`, and
    `/debug/trade-analysis`
  - `npm run lint` passed with `0` errors and `4` pre-existing warnings
  - an existing Next dev server for this repo was already running on
    `http://localhost:3000`; a second server on `3001` was refused by Next
    because the project already had an active dev server
  - smoke checks passed:
    `GET http://localhost:3000/api/execution-feedback/debug`,
    `GET http://localhost:3000/debug/execution-feedback`, and a sample
    execution-feedback `POST`
- Completed fixture hardening:
  - reused existing valid fixtures through execution feedback
  - added `short-loser.json`
  - added `repeated-adds-before-reduction.json`
  - added `inconsistent-share-sizing.json`
  - added `rapid-fire-execution-cluster.json`
  - added `invalid-execution-only-requests.json`
  - added fixture contract coverage in
    `src/lib/execution-feedback/__tests__/execution-feedback-request-fixtures.test.ts`
  - updated trade-analysis request fixture coverage for the new fixture files
  - focused fixture verification passed with `8` files / `51` tests
  - `npx tsc --noEmit` passed
- Fixture hardening final verification completed:
  - `npm run verify:all` passed with `67` files / `636` tests, plus
    `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  - `npx tsc --noEmit` passed
  - `npm run build` passed
  - `npm run lint` passed with `0` errors and `4` pre-existing warnings
- Current task pointer is complete.

## Update Protocol

This file should be updated when:

- a phase starts or completes
- a design decision changes
- new execution-only patterns are added
- tests reveal an assumption is wrong
- the feedback contract changes
- API/debug routes are added
- execution feedback is integrated into full trade analysis

This file does not need to be updated for tiny implementation details, but it
should always reflect the current roadmap branch and best next step for the
execution-data feedback lane.

## Current Best Next Step

Execution-data feedback lane complete.

Use `http://localhost:3000/debug/execution-feedback` to test execution-only
requests and `http://localhost:3000/debug/trade-analysis` to test full
market-context analysis with the separate execution-feedback section included.
