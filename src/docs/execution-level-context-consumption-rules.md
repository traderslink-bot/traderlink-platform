# Execution Level Context Consumption Rules

## Purpose

This document defines the rules and guardrails for future execution-analysis
use of factual `ExecutionAnalysisLevelContextInput` data.

This gate does not make execution analysis consume level context for scoring.
It does not change execution-analysis outputs, scoring, coaching, grading, P/L,
giveback analysis, behavior scoring, recommendations, trade advice, UI
behavior, or `levels-system`.

## Why These Rules Exist

The app can now validate, attach, store, retrieve, and carry
`LevelAnalysisSnapshot` v1 context. Pipeline parity tests prove that attaching
`levelAnalysisContext` does not change current execution-feedback output.

Before future code reads this context, it needs an explicit rules layer that
separates factual chart context from execution interpretation.

## Rules Module

The rules live at:

```text
src/lib/level-analysis/execution-level-context-consumption-rules.ts
```

The module exposes pure helpers to:

- list allowed factual fields
- list forbidden direct inferences
- assess whether context is ready for future consumption
- assert that payloads remain factual-only
- describe the consumption boundary without adding scoring behavior

The module remains in the level-analysis lane and does not import execution
feedback, trade-analysis, coaching, scoring, or pattern implementation modules.

## Allowed Facts

Future execution-analysis code may read these values as context facts only:

- symbol
- `asOfTimestamp`
- reference price
- nearest support
- nearest resistance
- distance to nearest support/resistance
- canonical support/resistance bucket counts
- extension counts
- synthetic continuation-map count and metadata
- diagnostics
- limitations
- safety flags
- quality/audit warnings
- fact presence summary

These fields describe the factual chart-analysis context available at the
snapshot boundary. They are not conclusions about the execution.

## Forbidden Direct Inferences

Future execution analysis must not directly infer:

- trade grade
- mistake label
- discipline label
- coaching message
- P/L
- pnl
- giveback analysis
- behavior score
- recommendation
- buy/sell/hold
- entry decision
- exit decision
- trade advice
- good trade or bad trade
- should have bought or should have sold

Any future interpretive use must be introduced by a separate explicit gate with
its own rules, evidence requirements, parity checks, and tests.

## Readiness Requirements

Context is consumable only when:

- context exists
- the context build result is available
- `safety.noLookaheadApplied` is true
- synthetic continuation-map rows are clearly marked when present
- quarantined or unavailable context is rejected
- limitations are surfaced
- diagnostics are surfaced
- the compatibility marker remains factual-only

Contexts with limitations can still be consumable. The limitation messages must
remain visible to future consumers.

## Synthetic Continuation-Map Rules

Synthetic continuation-map rows remain factual forward-planning chart-map
context only.

Future consumers must preserve:

- synthetic count
- side counts
- level metadata
- `extensionSource: synthetic_continuation_map`
- evidence limitations such as `not_historical_support_resistance`

Synthetic rows must not be treated as historical support/resistance evidence or
execution instructions.

## LevelQualityAudit Rules

`LevelQualityAudit` remains diagnostics and quality context only.

Quality warnings can help future code understand chart-analysis completeness,
but they are not trading instructions and must not be converted directly into
grades, coaching, recommendations, or execution decisions.

## Diagnostics And Limitations Rules

Diagnostics and limitations must be passed through, not hidden.

Future consumers should preserve:

- snapshot diagnostics
- quality diagnostics
- validation error counts
- limitation messages
- source attachment/storage identifiers

Missing optional sections should become limitations where the existing context
builder already represents them that way.

## Future Scoring Gate Requirement

Any future scoring-aware implementation must be gated by a new task that
defines:

- allowed evidence
- required counter-evidence
- no-lookahead requirements
- parity requirements
- fixture coverage
- prohibited inference guards
- user-facing language rules

This rules gate intentionally does not provide those scoring rules.

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
`journal_level_context_observation_layer`.

Reason: the next safe implementation step is not scoring. It is a neutral
observation layer that can combine execution facts and factual level context
into non-interpretive observations while preserving existing output behavior and
keeping grading/coaching decisions out of scope.
