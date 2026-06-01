# Execution Level Context UI Contract

## Purpose

This contract shapes neutral `ExecutionLevelContextObservationReadModel` records
for future journal display and inspection.

It lets UI work consume a stable factual display model without turning
`LevelAnalysisSnapshot` v1 context into scoring, coaching, grading, P/L,
giveback analysis, behavior scoring, recommendations, trade advice, or
execution conclusions.

## What This Contract Is

The UI contract is a non-rendering display contract. It is a pure data shape
with section ids, rows, values, badges, status, source identity, and summary
counts.

It is intended for future screens, storage inspection, and QA fixtures. It does
not implement React components or journal UI behavior in this gate.

## What This Contract Is Not

The contract is not:

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
src/lib/level-analysis/execution-level-context-ui-contract.ts
```

It exposes pure helpers to:

- build a UI contract from a read model
- build a UI contract from a read-model storage record
- build an unavailable UI contract
- summarize a UI contract
- assert the UI contract remains factual-only

The module remains in the level-analysis lane and does not import execution
feedback, trade-analysis, coaching, scoring, React, or component modules.

## Allowed Display Sections

The contract may expose these factual sections:

- `overview`
- `nearestLevels`
- `extensions`
- `syntheticContinuationMap`
- `quality`
- `diagnostics`
- `limitations`
- `safety`
- `dataCompleteness`
- `source`

These sections describe context availability, source identity, level-map facts,
coverage, diagnostics, limitations, and safety state.

## Forbidden Display Sections

The contract must not expose sections for:

- grades
- coaching
- recommendations
- trade advice
- P/L
- giveback
- behavior scoring
- entry decisions
- exit decisions

Future UI code should keep those concerns outside this display contract unless
a separate, explicit interpretation system is designed and tested.

## Statuses

UI contract statuses:

- `available`: factual context is available and replay safe with no surfaced
  limitations
- `limited`: factual context is replay safe but has limitations or missing
  optional facts
- `not_replay_safe`: context exists but no-lookahead safety is false
- `unavailable`: context is missing, quarantined, or otherwise unavailable

Unavailable and unsafe statuses are display states only. They do not create
fallback interpretation.

## Synthetic Continuation-Map Display

Synthetic continuation-map data is displayed as forward-planning context only.

The UI contract preserves:

- synthetic count
- support and resistance side counts
- marked status
- `synthetic_forward_planning` context type
- limitations such as `not_historical_support_resistance`
- `historicalEvidence: false`

Synthetic rows must not be displayed as historical support/resistance evidence
or execution instructions.

## Quality Diagnostics And Limitations

Quality warnings are displayed as quality context from `LevelQualityAudit`.
Diagnostics are displayed as diagnostics. Limitations are displayed as known
factual limitations.

Missing optional facts should be visible so future screens can explain data
coverage without hiding uncertainty.

## Future UI Guidance

Future UI components should consume the contract as read-only data:

1. Load or build a stored read model.
2. Build the UI contract.
3. Render the allowed sections.
4. Preserve source keys and safety flags for auditability.
5. Keep interpretation, scoring, and user guidance in separate future systems
   with explicit tests.

## Anti-Goals

This gate does not:

- create React components
- add journal UI behavior
- change execution-analysis output
- feed read models into scoring
- create trade grades
- create coaching
- calculate P/L
- calculate giveback
- score behavior
- create recommendations or trade advice
- modify `levels-system`

## Recommended Next Gate

`journal_level_context_ui_contract_fixture_pack`

Reason: before building UI, create a small fixture pack for
available/limited/unavailable/not-replay-safe UI contracts so future UI work is
easy to verify and stays factual.
