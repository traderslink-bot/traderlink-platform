# Execution Level Context Observation Layer

## Purpose

This document describes the neutral observation layer for factual
`ExecutionAnalysisLevelContextInput` data.

The layer turns accepted level context into structured facts-only observations.
It does not change execution-analysis outputs, scoring, coaching, grading, P/L,
giveback analysis, behavior scoring, recommendations, trade advice, journal UI
behavior, or `levels-system`.

## What Observations Are

Observations are structured records that describe what factual level context is
available.

They can state that:

- factual level context is available or unavailable
- nearest support or resistance exists or is missing
- extension coverage exists
- synthetic continuation-map context exists
- quality coverage notes exist
- diagnostics exist
- limitations exist
- replay safety is missing
- optional factual sections are missing

Observations are context facts. They are not execution conclusions.

## What Observations Are Not

Observations are not:

- trade grades
- coaching messages
- P/L calculations
- giveback analysis
- behavior scores
- recommendations
- trade advice
- entry or exit decisions
- good-trade or bad-trade labels
- mistake or discipline labels

Future scoring or user-facing interpretation must be introduced by a separate
explicit gate with its own evidence rules and tests.

## Module

The module lives at:

```text
src/lib/level-analysis/execution-level-context-observations.ts
```

It exposes pure helpers to:

- build observations from `ExecutionAnalysisLevelContextInput`
- build unavailable observations
- summarize observations
- filter observations by kind
- check whether an observation kind exists
- assert observations remain factual-only

The module stays in the level-analysis lane and does not import execution
feedback, trade-analysis, coaching, scoring, or pattern implementation modules.

## Observation Kinds

Current neutral observation kinds:

- `level_context_available`
- `level_context_unavailable`
- `nearest_support_available`
- `nearest_resistance_available`
- `nearest_support_missing`
- `nearest_resistance_missing`
- `extension_coverage_available`
- `synthetic_continuation_map_present`
- `quality_warnings_present`
- `diagnostics_present`
- `limitations_present`
- `not_replay_safe`
- `optional_facts_missing`

These names intentionally avoid interpretive execution terms.

## Synthetic Continuation-Map Observation Rules

Synthetic continuation-map observations may report:

- synthetic count
- support and resistance side counts
- `synthetic_continuation_map` source marker
- evidence limitations such as `not_historical_support_resistance`

They must remain factual forward-planning chart context only. They must not
create historical support/resistance evidence and must not become execution
instructions.

## Quality Diagnostics And Limitations Rules

Quality observations surface `LevelQualityAudit` coverage notes as factual
quality context only.

Diagnostics and limitations are passed through so future consumers can see:

- snapshot diagnostics
- quality diagnostics
- validation error counts
- limitation counts and messages
- missing optional factual sections

These records describe data availability and coverage. They are not trading
instructions.

## Unavailable And Quarantine Rules

Unavailable or quarantined context produces `level_context_unavailable`.

Unsafe context can also produce `not_replay_safe`.

Unavailable observations do not produce `level_context_available`, and they do
not create fallback interpretation.

## Future Execution-Analysis Consumption

Future execution analysis may consume observations only as factual context.

The next integration should keep observation output adjacent to the execution
pipeline and prove output parity before any observation-aware reader is added.
If future scoring ever reads observations, that must be a separate gate with
explicit rules for allowed evidence, prohibited inferences, no-lookahead safety,
and user-facing language.

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
`journal_level_context_observation_pipeline_parity`.

Reason: before observations are passed near execution analysis, the app should
prove that carrying observations alongside the pipeline does not change existing
execution outputs.
