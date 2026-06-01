# Execution Level Context Read Model Storage

## Purpose

This contract stores neutral `ExecutionLevelContextObservationReadModel` records for journal inspection and later controlled execution-analysis planning. The stored record is factual context derived from `LevelAnalysisSnapshot` v1, not an execution conclusion.

## Why This Exists

The app can now validate, attach, store, observe, and summarize factual level context. This storage layer gives the journal a stable way to persist and retrieve the neutral read model without wiring it into scoring, coaching, grading, P/L, giveback, behavior scoring, recommendations, trade advice, or UI behavior.

## Storage Lifecycle

1. Build an `ExecutionAnalysisLevelContextInput` from an accepted snapshot attachment or storage record.
2. Build neutral observations from that context.
3. Build an `ExecutionLevelContextObservationReadModel`.
4. Store the read model with a deterministic key, owner reference, source snapshot reference, diagnostics, limitations, safety summary, version, and audit trail.
5. Retrieve by key, owner, symbol, latest owner/symbol, or nearest as-of timestamp.
6. Preserve unavailable or unsafe read models as factual records with their status.
7. Preserve invalid payloads as quarantined records with quarantine reasons.

## Statuses

- `accepted`: read model status is `available`.
- `limited`: read model is usable as factual context but includes limitations or missing optional facts.
- `unavailable`: context was unavailable and is stored for auditability.
- `not_replay_safe`: context failed the replay-safety requirement and is stored as unsafe context only.
- `quarantined`: payload could not be stored as a valid read model and is preserved with reasons.

## Preservation

Storage records keep the read model unchanged. Additive fields are tolerated and preserved. Retrieval helpers return stored records without mutating read models, diagnostics, limitations, safety summaries, or audit trails.

## Versioning

Records use source type `execution-level-context-observation-read-model/v1` and a numeric record `version`. Future versions should be additive where possible. Breaking read-model changes should use a new source type and explicit migration path.

## Retrieval Rules

- Storage keys are deterministic from source type, status, owner id, symbol, and as-of timestamp.
- Duplicate keys are replaced deterministically.
- Owner and symbol retrieval can include all stored statuses.
- Latest owner/symbol retrieval returns the latest accepted record.
- Nearest-as-of retrieval defaults to accepted records and does not return future records.
- Future records are returned only when `allowFuture: true` is explicit.

## Audit Trail

Audit entries record factual lifecycle events only:

- `created`
- `stored`
- `retrieved`
- `quarantined`
- `audit_appended`

Audit entries must not contain execution interpretation.

## Synthetic Continuation-Map Handling

Synthetic continuation-map context stays factual. Stored read models preserve synthetic counts, side counts, marking status, limitations, and the `synthetic_forward_planning` context type. Synthetic rows are not historical support/resistance evidence and are not execution instructions.

## Quality, Diagnostics, And Limitations

Quality audit warnings, diagnostics, and limitations are preserved as context only. They can explain completeness, coverage, and safety state, but they do not become scoring or coaching.

## Intentionally Not Done

This storage layer does not:

- change execution-analysis output
- feed read models into scoring
- create trade grades
- create coaching
- calculate P/L
- calculate giveback
- score behavior
- create recommendations or trade advice
- add journal UI behavior
- modify `levels-system`

## Recommended Next Gate

`journal_execution_level_context_consumption_adapter`

Reason: once the neutral read model can be stored and retrieved safely, the next safe step is a controlled consumption adapter that exposes allowed facts to execution analysis without scoring behavior.
