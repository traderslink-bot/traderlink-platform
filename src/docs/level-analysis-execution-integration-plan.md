# Level Analysis Execution Integration Plan

## Purpose

This plan defines how TraderLink Intelligence may later allow execution
analysis to read attached and stored `LevelAnalysisSnapshot` v1 context as
factual market-structure context.

This is a planning gate only. It does not wire level context into execution
analysis, trade scoring, coaching, P/L analysis, giveback analysis, behavior
scoring, recommendations, trade advice, or UI behavior.

## Current State

The app-side `LevelAnalysisSnapshot` v1 lane now has:

- a compact v1 fixture for connector tests
- app-side contract types
- a pure adapter that validates, quarantines, preserves, and derives a factual
  connector view
- a trade/session attachment model
- a storage and retrieval contract with accepted and quarantined records
- nearest-as-of retrieval that does not return future snapshots unless
  explicitly allowed
- tests proving raw snapshot preservation and no journal-owned interpretation
  fields

No execution-analysis behavior consumes stored level snapshots yet.

## Why Level Context Is Being Integrated

The long-term goal is better levels-system output. Journal-side integration is
only the downstream consumer path: it lets the journal preserve factual
support/resistance context near the trade/session record so future analysis can
compare execution facts against chart context without recreating or mutating the
levels-system output.

The snapshot should help future execution analysis know what factual chart
context was available as of a specific timestamp. It should not become an
automatic judgment about the trade.

## Source Of Truth: `LevelAnalysisSnapshot` V1

`levels-system` remains the source of truth for candle-data-driven chart
analysis. The journal app consumes the locked v1 snapshot contract through:

```text
src/lib/level-analysis/level-analysis-snapshot-contract.ts
src/lib/level-analysis/level-analysis-snapshot-adapter.ts
src/lib/level-analysis/level-analysis-snapshot-attachment.ts
src/lib/level-analysis/level-analysis-snapshot-storage.ts
```

The journal app must preserve the raw snapshot unchanged for auditability.

## Existing App-Side Artifacts

Adapter and fixture:

- `src/lib/level-analysis/level-analysis-snapshot-contract.ts`
- `src/lib/level-analysis/level-analysis-snapshot-adapter.ts`
- `src/lib/level-analysis/__fixtures__/journal-connector-level-analysis-snapshot-v1.json`

Attachment:

- `src/lib/level-analysis/level-analysis-snapshot-attachment.ts`
- `src/docs/level-analysis-snapshot-trade-context-attachment.md`

Storage and retrieval:

- `src/lib/level-analysis/level-analysis-snapshot-storage.ts`
- `src/docs/level-analysis-snapshot-storage-contract.md`

## Current Execution-Analysis Architecture

The current trade-analysis path is layered:

1. `src/lib/trade-analysis/request/trade-analysis-request-contract.ts`
   validates user trade-analysis requests, executions, session context, and
   levels-system runtime options.
2. `src/lib/trade-analysis/run-trade-analysis.ts` calls the analysis engine in
   either levels-system or provided-candles-only mode.
3. `src/lib/trade-analysis-engine.ts` orchestrates Layer 1 raw timeline,
   pattern input, pattern detection, and pattern normalization.
4. `src/lib/raw-trade-timeline/**` builds factual timeline and structural
   context from executions, candles, session context, and support/resistance
   context.
5. `src/lib/execution-feedback/**` builds execution-only facts, feedback
   points, and summaries from trade-analysis request data.

Current scoring and feedback modules already contain execution interpretation.
This plan does not change them.

## Safe Execution-Analysis Consumption Boundary

Future execution analysis may read level context only through a narrow factual
input derived from an accepted storage record or attachment. The future input
must be read-only and must carry enough provenance to prove:

- the snapshot schema is v1
- the producer is `levels-system`
- the snapshot was accepted by the adapter
- `safety.noLookaheadApplied` is true for journal/replay use
- synthetic continuation-map rows remain clearly marked
- limitations and diagnostics are still visible
- the raw snapshot is preserved elsewhere for audit

The first implementation should create a factual input contract only. Scoring
rules can come later only after explicit planning and tests.

## What Execution Analysis May Read Later

These are context facts, not conclusions:

- symbol
- `asOfTimestamp`
- reference price
- nearest support
- nearest resistance
- distance to nearest support/resistance
- canonical level bucket counts
- extension counts
- synthetic continuation-map count and metadata
- diagnostics
- safety flags
- quality audit warnings and limitations
- market/session/volume fact presence
- no-lookahead status
- data limitations
- storage key or attachment key for traceability

## What Execution Analysis Must Not Infer Directly

Execution analysis must not directly infer:

- good trade or bad trade
- grade
- coaching message
- mistake label
- discipline issue
- P/L
- giveback
- behavior score
- buy/sell/hold recommendation
- entry decision
- exit decision
- trade advice
- that a trader should have bought or sold
- that a trader was wrong because price was near a level

Any future scoring or interpretation must have separate explicit rules,
evidence requirements, and tests. Level proximity alone is not a trade
conclusion.

## Proposed Integration Points

Preferred future integration path:

1. Keep `level-analysis` adapter, attachment, and storage modules as the
   ingestion and preservation boundary.
2. Add a factual execution-level-context input contract near the execution
   analysis boundary.
3. Derive that input from an accepted storage record or attachment.
4. Pass the factual input into execution analysis only after tests prove it is
   read-only and non-interpretive.
5. Keep raw snapshot preservation in storage rather than copying raw
   `LevelAnalysisSnapshot` into execution scoring modules.

Likely future integration surfaces:

- `src/lib/trade-analysis/request/trade-analysis-request-contract.ts` for an
  optional validated level-context reference or payload after the input contract
  exists.
- `src/lib/trade-analysis/run-trade-analysis.ts` for passing validated factual
  context through orchestration without changing scoring.
- `src/lib/trade-analysis-engine.ts` only after the input contract is stable and
  the Layer 1 to Layer 3 boundary remains intact.
- `src/lib/execution-feedback/build-execution-feedback-facts.ts` only if future
  work explicitly decides execution feedback facts should include a factual
  level-context section.

Do not start by threading the full raw snapshot into scoring or summary
builders.

## Proposed Future Input Shape

This is a planning sketch only, not production code:

```ts
type ExecutionAnalysisLevelContextInput = {
  levelSnapshotAttachmentId: string;
  levelSnapshotStorageKey?: string;
  symbol: string;
  asOfTimestamp: number;
  referencePrice?: number;
  nearestSupport: FactualNearestLevel | null;
  nearestResistance: FactualNearestLevel | null;
  levelBucketCounts: {
    majorSupport: number;
    majorResistance: number;
    intermediateSupport: number;
    intermediateResistance: number;
    intradaySupport: number;
    intradayResistance: number;
  };
  extensionCounts: {
    support: number;
    resistance: number;
    synthetic: number;
  };
  factsPresence: {
    hasSessionFacts: boolean;
    hasVolumeFacts: boolean;
    volumeShelfCount: number;
    hasMarketContext: boolean;
    hasFactsBundle: boolean;
  };
  diagnostics: string[];
  limitations: string[];
  safety: {
    noLookaheadApplied: boolean;
    syntheticExtensionsClearlyMarked: boolean;
  };
  compatibility: {
    schemaVersion: string;
    producer: "levels-system";
  };
};
```

The type should remain factual. It should not contain grade, coaching, P/L,
giveback, behavior score, recommendation, entry decision, exit decision, or
trade advice fields.

## Proposed Phase Rollout

1. Define a factual input contract for execution analysis.
2. Add tests proving the input can be derived from accepted storage records
   without mutating the record or raw snapshot.
3. Add quarantine behavior for unsafe or missing level context.
4. Add orchestration plumbing that can pass the factual input through without
   changing existing execution-analysis outputs.
5. Add read-model or debug-only visibility for the factual context if needed.
6. Only after a separate gate, design explicit rules for how any execution
   analysis may use the facts.

## Guardrails Before Implementation

Before implementation begins:

- keep `levels-system` unchanged
- require v1 schema and producer validation
- require no-lookahead safety for journal/replay usage
- preserve raw snapshots in storage
- do not mutate `levelEngineOutput`
- keep synthetic continuation-map rows marked as forward-planning context
- carry `LevelQualityAudit` as diagnostics only
- keep future retrieval opt-in explicit
- do not change existing execution-analysis outputs
- do not derive scoring or conclusions from level proximity

## Future Test Strategy

Future implementation should test:

- accepted storage record can derive factual level-context input
- quarantined storage record cannot derive accepted execution context
- missing optional fields become limitations, not failures, where safe
- nearest support/resistance nullable cases stay valid
- no-lookahead flag is required
- future snapshots are not selected by default
- raw snapshot and `levelEngineOutput` remain unchanged
- synthetic continuation-map metadata remains marked
- existing trade-analysis and execution-feedback results are unchanged when no
  level context is supplied
- no grade/coaching/P&L/giveback/behavior/recommendation fields appear in the
  factual level-context input

## Anti-Goals

This gate does not:

- wire level context into execution scoring
- add scoring rules
- add trade grading
- add coaching
- add P/L analysis
- add giveback analysis
- add behavior scoring
- add recommendations
- add trade advice
- change journal UI behavior
- change `levels-system`
- change support/resistance detection

## Open Questions

- Should the future input contract live under `src/lib/level-analysis` as a
  connector view derivative, or under `src/lib/trade-analysis` as an optional
  execution-analysis input?
- Should future orchestration reference storage records by key, embed a compact
  factual view, or support both?
- Should execution feedback facts eventually include a separate
  `levelContext` section, or should level context remain outside execution
  feedback until explicit scoring rules exist?
- What data retention policy should apply to raw snapshots once persisted
  outside in-memory test collections?
- Should future multi-timeframe hardening happen in `levels-system` before the
  journal app consumes level context operationally?

## Recommended Next Gate

Recommended next gate:
`journal_execution_level_context_input_contract`.

Reason: the app can now validate, attach, store, and retrieve factual
`LevelAnalysisSnapshot` context. The next safe implementation step is to define
a factual input contract for execution analysis without adding scoring,
coaching, grading, P/L, giveback, behavior scoring, recommendations, or trade
advice.
