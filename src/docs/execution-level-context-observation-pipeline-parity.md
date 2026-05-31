# Execution Level Context Observation Pipeline Parity

## Purpose

This document records the parity-test gate for carrying neutral
`ExecutionLevelContextObservationSet` data alongside execution-analysis inputs.

This gate proves that factual level context and neutral observations can sit
next to execution pipeline inputs without changing current execution-feedback
outputs.

It does not make execution analysis consume observations for scoring, coaching,
grading, P/L, giveback analysis, behavior scoring, recommendations, trade
advice, UI behavior, or `levels-system`.

## What Observation Pipeline Parity Means

Parity means:

- baseline `runExecutionFeedback(input)` output is captured
- attaching factual `levelAnalysisContext` does not mutate the original input
- attaching neutral `levelAnalysisObservations` does not mutate the original
  input
- stripping context and observations restores the original input shape
- running execution feedback after stripping matches the baseline
- direct extended-input execution feedback also matches the baseline while the
  current entry point ignores unknown fields
- execution output does not leak level context or observation carrier fields

## Adapter

Observation carrier helpers live at:

```text
src/lib/level-analysis/execution-level-context-observation-pipeline-adapter.ts
```

The safe optional field is:

```text
levelAnalysisObservations
```

The existing factual context field remains:

```text
levelAnalysisContext
```

The observation adapter is generic, pure, and copy-only. It does not import
execution feedback, trade-analysis, coaching, scoring, or pattern implementation
modules.

## Scenarios Covered

The parity test uses the same deterministic execution-feedback fixtures as the
context pipeline parity test:

- `long-winner.json`
- `rapid-fire-execution-cluster.json`
- `open-position.json`

For each fixture, the test proves parity for:

- factual context alone
- neutral observations alone
- factual context plus neutral observations
- stripped input shape
- direct extended input, because current request validation ignores unknown
  carrier fields
- original input immutability
- context immutability
- observation set immutability

## Why Observations Are Not Consumed Yet

The observation layer is still factual plumbing. Execution analysis must not
read observations as scoring evidence until a future gate defines explicit
allowed evidence, no-lookahead requirements, and prohibited inference guards.

This gate only proves observations can be carried safely.

## Stripping Strategy

The adapter exposes helpers to strip:

- only `levelAnalysisObservations`
- both `levelAnalysisContext` and `levelAnalysisObservations`

The strip-both helper supports parity tests and future non-consuming pipeline
passes.

## Direct Extended-Input Strategy

Current `runExecutionFeedback` validation ignores unknown fields. The parity
test therefore also runs direct extended inputs containing context and
observations and verifies the output remains identical to baseline.

If future execution validation becomes stricter, direct extended-input parity
should be revisited while strip-based parity remains the baseline guard.

## Boundary Guard

The parity test verifies execution output does not contain:

- `levelAnalysisContext`
- `levelAnalysisObservations`
- level snapshot attachment or storage keys
- synthetic continuation-map metadata
- new interpretation fields

Observation payloads are also guarded against journal-owned interpretation
language.

## What Is Intentionally Not Implemented

This gate does not:

- make execution analysis consume observations
- change execution-analysis outputs
- change scoring
- add trade grading
- add coaching
- add P/L analysis
- add giveback analysis
- add behavior scoring
- add recommendations
- add trade advice
- add journal UI behavior
- change `levels-system`

## Recommended Next Gate

Recommended next gate:
`journal_level_context_observation_read_model`.

Reason: parity is now protected. The next safe step is to shape neutral
observations for display, storage, or inspection without scoring or coaching.
