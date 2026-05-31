# Execution Level Context Pipeline Adapter

## Purpose

This document describes the thin pipeline adapter that can carry factual
`ExecutionAnalysisLevelContextInput` alongside an execution-analysis input-like
object.

This is boundary-safe plumbing only. It does not change execution-analysis
scoring, coaching, grading, P/L analysis, giveback analysis, behavior scoring,
recommendations, trade advice, or UI behavior.

## Why This Adapter Exists

The app can now derive a factual execution-level context input from accepted
`LevelAnalysisSnapshot` v1 attachments and storage records. The next integration
step needs a safe way to pass that context next to execution-analysis inputs
without letting existing execution-analysis modules consume it yet.

The adapter provides that carrier boundary.

## What It Attaches

The adapter attaches an `ExecutionAnalysisLevelContextInput` inside a factual
pipeline attachment:

```text
levelAnalysisContext
```

The field contains:

- source type
- field name
- factual-only marker
- the factual level context input

It does not contain execution conclusions.

## Where It Sits In The Pipeline

The adapter lives under:

```text
src/lib/level-analysis/execution-level-context-pipeline-adapter.ts
```

It remains on the level-analysis side of the boundary. It does not import
trade-analysis, execution-feedback, pattern scoring, or coaching modules.

Existing execution-analysis modules do not import this adapter in this gate.

## Behavior Parity Rule

Attaching level context must not mutate the original execution-analysis input.

The adapter returns a copied object with the optional `levelAnalysisContext`
field. Stripping the field should restore the original input shape for parity
tests.

When no level context is provided, the adapter returns an equivalent copied
input with no context attached.

## Optional Context Rule

Level context is optional. A pipeline input with no `levelAnalysisContext`
should remain valid for existing execution-analysis behavior.

This gate does not require execution analysis to read, validate, or act on the
attached context.

## Stripping And Parity Strategy

The adapter exposes helpers to:

- attach context
- check whether context is attached
- extract attached context
- strip attached context
- assert the context is factual-only

Future parity tests should run existing execution-analysis paths with a stripped
input and prove output behavior remains unchanged before any reader is added.

## Safe Field Name

The safe carrier field is:

```text
levelAnalysisContext
```

The field is intentionally not named with scoring, grading, coaching, decision,
signal, advice, or recommendation language.

## Forbidden Uses

This adapter must not be used to:

- grade trades
- coach users
- calculate P/L
- calculate giveback
- score behavior
- create recommendations
- create buy/sell/hold decisions
- create entry or exit decisions
- create trade advice
- label mistakes or discipline issues
- mutate `LevelAnalysisSnapshot`
- mutate execution-analysis inputs
- alter existing execution-analysis behavior

## Factual Context Preservation

The adapter preserves the factual context input exactly as supplied.

The attached context keeps:

- safety flags
- diagnostics
- limitations
- synthetic continuation-map summary
- LevelQualityAudit quality context
- source attachment/storage identity

Synthetic continuation-map rows remain factual forward-planning chart-map
context only.

## Future Implementation Path

Recommended sequence:

1. Add pipeline parity tests proving attached-and-stripped inputs match existing
   execution-analysis inputs.
2. Add a non-consuming pipeline pass-through if needed.
3. Only after parity is proven, add explicit readers for factual context.
4. Keep any interpretive use behind a separate gate with explicit rules and
   tests.

## Recommended Next Gate

Recommended next gate:
`journal_execution_level_context_pipeline_parity_tests`.

Reason: before execution analysis reads level context, the app should prove that
attaching the context and stripping it back out preserves existing
execution-analysis behavior.
