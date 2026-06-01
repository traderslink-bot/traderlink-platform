# Execution Level Context Observation Read Model

## Purpose

This document describes the neutral read model for factual
`ExecutionAnalysisLevelContextInput` and `ExecutionLevelContextObservationSet`
data.

The read model gives future storage, inspection, and UI surfaces a compact
summary of level-context availability without changing execution-analysis
outputs or adding scoring, coaching, grading, P/L, giveback analysis, behavior
scoring, recommendations, trade advice, journal UI behavior, or `levels-system`
changes.

## What The Read Model Is

The read model is a serializable factual summary that includes:

- availability status
- source attachment/storage identity
- symbol, `asOfTimestamp`, and reference price
- nearest support and resistance presence
- canonical level bucket counts
- extension counts
- synthetic continuation-map summary
- quality coverage context
- diagnostics
- limitations
- safety flags
- observation summary counts

It is designed for future storage, inspection, and display.

## What The Read Model Is Not

The read model is not:

- trade grading
- coaching
- P/L analysis
- giveback analysis
- behavior scoring
- recommendation output
- buy/sell/hold logic
- entry or exit decision logic
- trade advice
- mistake or discipline labeling

It does not decide whether an execution was right or wrong.

## Module

The module lives at:

```text
src/lib/level-analysis/execution-level-context-observation-read-model.ts
```

It exposes pure helpers to:

- build a read model from factual context
- build a read model from factual context plus observations
- build an unavailable read model
- summarize a read model
- assert the read model remains factual-only

The module remains in the level-analysis lane and does not import execution
feedback, trade-analysis, coaching, scoring, or pattern implementation modules.

## Statuses

Read model statuses:

- `available`: context is available and replay safe with no known limitations
- `limited`: context is replay safe but has surfaced limitations or missing
  optional factual sections
- `not_replay_safe`: context exists but no-lookahead safety is false
- `unavailable`: context is missing, quarantined, or otherwise unavailable

Unavailable and unsafe statuses do not create fallback interpretation.

## Sections Included

The read model includes:

- `identity`: symbol, as-of timestamp, and reference price
- `nearestLevels`: support and resistance presence plus factual level values
- `levelMap`: bucket counts and extension counts
- `synthetic`: synthetic continuation-map count, side counts, marker, and
  limitations
- `quality`: quality coverage notes from `LevelQualityAudit`
- `diagnostics`: snapshot and quality diagnostic counts/messages
- `limitations`: limitation count/messages
- `safety`: no-lookahead and synthetic marking flags
- `factPresence`: session, volume, shelf, market-context, and facts-bundle
  presence
- `observationSummary`: counts by observation kind and severity
- `source`: attachment/storage keys and contract identity

## Synthetic Continuation-Map Treatment

Synthetic continuation-map rows are summarized as factual forward-planning chart
context only.

The read model preserves:

- count
- support and resistance side counts
- marked status
- evidence limitations such as `not_historical_support_resistance`
- `historicalEvidence: false`

Synthetic rows are not historical support/resistance evidence and are not
execution instructions.

## Quality Diagnostics And Limitations Treatment

Quality coverage notes remain quality context only.

Diagnostics and limitations are surfaced, not hidden. Missing optional factual
sections make the read model `limited` when the underlying context is otherwise
available and replay safe.

These sections describe data availability and coverage. They are not trading
instructions.

## Future UI And Storage Usage

Future storage or UI surfaces may use the read model to show what factual level
context was available near a trade/session. They should preserve source keys and
safety flags so users and future systems can audit the context.

Future scoring or user-facing interpretation must be introduced separately with
explicit rules and tests.

## Anti-Goals

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
`journal_level_context_read_model_storage`.

Reason: before UI or scoring, store the neutral read model so future journal
screens and analysis steps can inspect factual level context safely.
