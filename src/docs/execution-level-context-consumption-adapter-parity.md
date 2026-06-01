# Execution Level Context Consumption Adapter Parity

## Purpose

This gate proves the allowed level-context consumption view can be carried beside execution-analysis inputs without changing existing execution-analysis behavior or output.

## What Consumption-View Parity Means

Parity means the existing `runExecutionFeedback` output stays identical when factual level-analysis carriers are attached, stripped, or passed directly as unknown optional fields. Execution analysis still does not read the carriers for scoring or interpretation.

## Carriers Tested

- `levelAnalysisContext`
- `levelAnalysisObservations`
- `levelAnalysisConsumptionView`

The read model is not carried as its own pipeline field in this gate. It is projected through the allowed consumption view, which is the intended future execution-facing boundary.

## Scenarios Covered

The parity tests use the same deterministic execution fixtures as the earlier pipeline gates:

- `long-winner`
- `rapid-fire-execution-cluster`
- `open-position`

The tests cover:

- factual context alone
- factual observations alone
- read-model-derived allowed consumption view
- allowed consumption view alone
- context plus observations plus allowed consumption view
- no-view adapter behavior
- input, context, observations, read model, and view immutability

## Direct Extended-Input Behavior

Current execution-analysis validation ignores unknown optional fields. The tests therefore pass extended inputs directly to `runExecutionFeedback` and confirm the output is identical to baseline for every fixture.

## Stripping Strategy

The consumption pipeline adapter adds:

- `attachExecutionLevelContextConsumptionViewToPipelineInput`
- `extractExecutionLevelContextConsumptionViewFromPipelineInput`
- `hasExecutionLevelContextConsumptionView`
- `stripExecutionLevelContextConsumptionViewFromPipelineInput`
- `stripAllLevelAnalysisCarriersFromPipelineInput`

The strip-all helper removes context, observations, and consumption view carriers, restoring the original execution input shape.

## Output Boundary Guard

The tests assert execution output does not leak level-analysis carrier fields, snapshot/storage keys, synthetic continuation-map metadata, raw snapshot fields, or raw `levelEngineOutput`.

## Intentionally Not Implemented

This gate does not:

- make execution analysis consume the allowed view
- change execution-analysis output
- change scoring
- create coaching
- create grading
- calculate P/L
- calculate giveback
- score behavior
- create recommendations or trade advice
- add journal UI behavior
- modify `levels-system`

## Recommended Next Gate

`journal_level_context_read_model_ui_contract`

Reason: with parity proven for factual carriers and the allowed view, the safest next step is to define how the neutral read model or allowed view may be displayed or inspected without feeding scoring logic.
