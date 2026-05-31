# Execution Level Context Pipeline Parity Tests

## Purpose

This document records the parity-test gate for carrying factual
`ExecutionAnalysisLevelContextInput` through execution-analysis pipeline inputs.

The goal is to prove that attaching `levelAnalysisContext` does not change
existing execution-analysis behavior while the context remains unconsumed.

## What Parity Means

Parity means:

- running execution analysis without level context produces a baseline output
- attaching factual level context does not mutate the original input
- stripping attached context restores the original input shape
- running execution analysis on the stripped input matches the baseline output
- running execution analysis on the extended input also matches the baseline
  when the current entry point safely ignores unknown fields
- execution output does not leak level snapshot attachment/storage fields

## Scenarios Covered

The focused parity test uses the existing deterministic `runExecutionFeedback`
entry point with fixed `generatedAt`.

Covered fixtures:

- `long-winner.json`
- `rapid-fire-execution-cluster.json`
- `open-position.json`

These cover a normal completed execution-only run, a rapid execution cluster,
and an open-position warning case.

## Boundary Protected

The test protects the current boundary:

- level context can be attached to a copied pipeline input
- existing execution-feedback behavior stays unchanged
- execution modules still do not import the level-analysis lane
- level-analysis helpers do not call scoring, coaching, trade-analysis, or
  execution-feedback modules

The field being carried is:

```text
levelAnalysisContext
```

## How This Prepares Future Integration

Future work can use these parity tests as a safety net before adding an explicit
reader for factual level context. The tests show that carrying the context is
safe before any consumption rules exist.

The next step should define what execution analysis is allowed to read and how
that read is tested. It should not infer conclusions from level proximity by
default.

## What Is Intentionally Not Implemented

This gate does not:

- make execution analysis consume level context
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
`journal_execution_level_context_consumption_rules`.

Reason: parity is now protected. Before execution analysis consumes level
context, the app needs explicit rules and tests for what consumption is allowed
and what remains forbidden.
