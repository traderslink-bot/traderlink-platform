# Execution Level Context Input Contract

## Purpose

This document defines the factual `ExecutionAnalysisLevelContextInput` contract
for future execution-analysis consumption of `LevelAnalysisSnapshot` v1 context.

This gate defines input shape and builders only. It does not wire level context
into execution analysis, trade grading, coaching, P/L analysis, giveback
analysis, behavior scoring, recommendations, trade advice, or UI behavior.

## Why This Input Exists

The journal app can now validate, attach, store, retrieve, audit, and quarantine
`LevelAnalysisSnapshot` v1 records from `levels-system`. Execution analysis will
eventually need a compact factual view of that context. The input contract
provides that bridge while preserving the boundary between chart facts and
execution interpretation.

The input is factual market-structure context. It is not a conclusion about the
trade.

## Source Records And Attachments

The input can be built from:

- accepted `LevelAnalysisSnapshotAttachment` values
- accepted `LevelAnalysisSnapshotStorageRecord` values
- nearest-as-of lookup across stored snapshot records

Quarantined attachments and quarantined storage records do not produce accepted
execution level context input.

## Accepted Input Shape

The contract lives at:

```text
src/lib/level-analysis/execution-level-context-input.ts
```

The accepted input includes:

- snapshot contract identity
- attachment key and optional storage key
- owner reference
- symbol
- `asOfTimestamp`
- reference price
- nearest support and nearest resistance
- level bucket counts
- extension counts
- synthetic continuation-map summary
- fact presence summary
- diagnostics
- limitations
- safety flags
- quality/audit context
- compatibility metadata

The input does not include execution conclusions.

## Unavailable And Quarantined Behavior

Builders return `status: "unavailable"` when:

- the source attachment is quarantined
- the source storage record is quarantined
- no accepted stored snapshot matches the lookup query
- no-lookahead safety is false
- synthetic continuation-map rows are present but not clearly marked

Unavailable results carry factual reasons, validation errors, and limitations
where available. They do not create fallback interpretation.

## Safe Factual Fields

Future execution-analysis code may read these as context facts:

- symbol
- `asOfTimestamp`
- reference price
- nearest support/resistance
- factual distance from reference price to nearest levels
- canonical support/resistance bucket counts
- extension counts
- synthetic continuation-map count and metadata
- diagnostics
- limitations
- safety flags
- quality audit warnings
- market/session/volume fact presence
- no-lookahead status

These fields are context facts only.

## Forbidden Inferences

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

Any future interpretive use needs a separate implementation gate with explicit
rules and tests.

## Synthetic Continuation-Map Handling

Synthetic continuation-map rows stay marked as:

```text
extensionSource: synthetic_continuation_map
```

They remain forward-planning chart-map levels only. The input preserves their
metadata and evidence limitations, including `not_historical_support_resistance`
when present.

Synthetic rows are not historical support/resistance and are not execution
instructions.

## LevelQualityAudit Handling

`LevelQualityAudit` appears only as diagnostics and quality context. Extension
coverage warnings and quality diagnostics are carried forward so future
consumers can understand data completeness and chart-analysis limitations.

Audit findings are not trading instructions.

## No-Lookahead Requirement

Execution-level context for journal/replay usage requires:

```text
safety.noLookaheadApplied = true
```

Nearest-as-of lookup uses the existing storage retrieval behavior and does not
select future snapshots by default.

## Future Execution-Analysis Consumption

Future execution analysis should consume this input by:

1. retrieving an accepted snapshot storage record at or before the relevant
   execution/trade timestamp
2. deriving `ExecutionAnalysisLevelContextInput`
3. passing the factual input alongside execution facts without changing existing
   scoring or summary behavior
4. preserving raw snapshot access in storage for auditability
5. treating limitations and diagnostics as context only

The next implementation should be pipeline plumbing, not scoring.

## What Is Intentionally Not Implemented

This gate does not:

- change execution-analysis behavior
- change scoring modules
- create trade grades
- create coaching output
- calculate P/L
- calculate giveback
- score behavior
- add recommendations
- add trade advice
- add journal UI behavior
- change `levels-system`

## Recommended Next Gate

Recommended next gate:
`journal_execution_level_context_pipeline_adapter`.

Reason: the factual input contract now exists. The next safe step is a pipeline
adapter that can pass this input alongside execution analysis without changing
existing scoring, summaries, or user-facing behavior.
