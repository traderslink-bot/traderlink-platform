# Execution Level Context Consumption Adapter

## Purpose

The consumption adapter projects stored or derived level-context data into a small allowed-facts view for future execution-analysis integration. It defines what execution analysis may read later without changing execution-analysis behavior in this gate.

## Why This Exists

The app can already validate `LevelAnalysisSnapshot` v1 payloads, attach them to trade/session context, store snapshots, derive factual execution-level context, build neutral observations, build a neutral read model, and store that read model. The next boundary is an explicit consumption adapter so future execution code receives only factual fields and never raw snapshot internals or execution conclusions by accident.

## What It Exposes

The allowed view may expose:

- symbol
- as-of timestamp
- reference price
- availability/readiness status
- nearest support and resistance factual values
- canonical bucket counts
- extension counts
- synthetic continuation-map summary
- diagnostics
- limitations
- safety flags
- quality warning counts and labels
- fact presence summary
- read-model or observation status
- source attachment or storage keys

## What It Does Not Expose

The view does not expose raw snapshots by default. It does not expose raw `levelEngineOutput`. It does not expose execution conclusions, scoring-ready verdicts, trade grading, coaching, P/L, giveback, behavior scoring, recommendations, trade advice, entry decisions, or exit decisions.

## Supported Inputs

The adapter can build a view from:

- `ExecutionAnalysisLevelContextInput`
- `ExecutionLevelContextObservationReadModel`
- `ExecutionLevelContextReadModelStorageRecord`

Quarantined read-model storage records return unavailable results.

## Available, Limited, And Unavailable Behavior

- Available context produces an `available` view.
- Available context with surfaced limitations produces an `available_with_limitations` view.
- Unavailable read models remain unavailable.
- Not-replay-safe read models remain unavailable.
- Quarantined records remain unavailable.
- Synthetic continuation-map rows require explicit marking before the view is available.

## Synthetic Continuation-Map Handling

Synthetic continuation-map data is exposed only as factual forward-planning context. The view preserves counts, side counts, marked status, limitations, and `synthetic_forward_planning` context. Synthetic levels are not historical support/resistance evidence and are not execution instructions.

## Quality, Diagnostics, And Limitations

LevelQualityAudit data remains quality context. Diagnostics and limitations are carried forward visibly. They are not converted into trading conclusions.

## Raw Snapshot Rule

Raw snapshots and raw `levelEngineOutput` stay outside the allowed consumption view. Consumers that need auditability should keep the stored snapshot and read model records separately, then pass only the allowed view into future execution-analysis integration points.

## Future Integration Path

1. Build or retrieve a stored read model.
2. Project it through the consumption adapter.
3. Attach the allowed view beside execution-analysis input.
4. Prove parity before any execution-analysis module reads the view.
5. Add explicit future tests before using any field in scoring or interpretation.

## Anti-Goals

This gate does not:

- change execution-analysis output
- feed level context into scoring
- create trade grades
- create coaching
- calculate P/L
- calculate giveback
- score behavior
- create recommendations or trade advice
- add journal UI behavior
- modify `levels-system`

## Recommended Next Gate

`journal_execution_level_context_consumption_adapter_parity`

Reason: before any execution code reads the allowed view, prove carrying the allowed consumption view still does not change existing execution-analysis outputs.
