# LevelAnalysisSnapshot Adapter Start

## Purpose

This app-side adapter starts downstream consumption of the locked `LevelAnalysisSnapshot` v1 contract from `levels-system`.

The adapter lets TraderLink Intelligence / the journal app load, validate, preserve, and derive a factual connector view from a snapshot. It does not implement trade grading, coaching, P/L analysis, giveback analysis, behavior scoring, journal UI behavior, recommendations, or trade advice.

## Source Contract

The upstream source is `levels-system`, where the v1 handoff is complete. Relevant source handoff docs include:

- `docs/79_JOURNAL_CONNECTOR_LEVEL_ANALYSIS_CONTRACT.md`
- `docs/81_LEVEL_ANALYSIS_SNAPSHOT_SCHEMA_V1_LOCK.md`
- `docs/82_LEVEL_ANALYSIS_SNAPSHOT_V1_RELEASE_NOTES.md`
- `docs/83_DOWNSTREAM_CONNECTOR_ADAPTER_BLUEPRINT.md`
- `docs/84_LEVEL_ANALYSIS_SNAPSHOT_V1_HANDOFF_COMPLETE.md`
- `docs/85_PRODUCTION_SNAPSHOT_RUNNER_PACKAGING.md`
- `docs/86_PRODUCTION_SNAPSHOT_RUNNER_SMOKE_TESTS.md`

## Fixture Location

The compact app-side fixture lives at:

```text
src/lib/level-analysis/__fixtures__/journal-connector-level-analysis-snapshot-v1.json
```

It was copied from the upstream compact connector fixture and should remain deterministic for adapter tests.

## Adapter Responsibilities

The adapter may:

- parse snapshot JSON
- validate `schemaVersion` and `producer`
- validate required v1 fields
- require no-lookahead safety for journal/replay use
- preserve the raw snapshot object unchanged
- tolerate additive unknown fields
- tolerate nullable nearest support/resistance
- derive a factual connector view
- expose level bucket counts, extension counts, fact presence, diagnostics counts, safety flags, quality context, limitations, and synthetic continuation-map summaries
- quarantine unsupported or malformed snapshots with explicit validation reasons

## Adapter Anti-Goals

The adapter must not:

- grade trades
- coach users
- calculate P/L
- calculate giveback
- score behavior
- produce buy/sell/hold decisions
- produce entry or exit decisions
- provide trade advice
- mutate or rerank `levelEngineOutput`
- treat synthetic continuation-map rows as historical support/resistance
- treat `LevelQualityAudit` findings as trading instructions

## Validation And Quarantine

Snapshots are accepted only when:

- `schemaVersion` starts with `level-analysis-snapshot/v1`
- `producer` equals `levels-system`
- `symbol`, `asOfTimestamp`, and `referencePrice` are present
- `inputSummary`, `levelEngineOutput`, `levelIntelligenceReport`, `levelQualityAudit`, `diagnostics`, and `safety` are present
- nearest support/resistance are either `null` or valid nearest-level objects
- replay/journal use has `safety.noLookaheadApplied: true`
- synthetic rows, when present, are clearly marked by safety flags and metadata

Malformed or unsupported payloads are quarantined with explicit validation errors.

## Synthetic Continuation-Map Handling

Synthetic continuation-map levels remain factual forward-planning chart map levels. The adapter surfaces their count and metadata but does not convert them into historical support/resistance or trade conclusions.

Required marker:

```text
extensionMetadata.extensionSource = synthetic_continuation_map
```

Expected evidence limitation:

```text
not_historical_support_resistance
```

## Quality Audit Handling

`LevelQualityAudit` is surfaced as quality and coverage context only. Audit findings are diagnostics for the chart-analysis output, not instructions for execution, grading, coaching, or journal conclusions.

## No-Lookahead Requirement

Journal and replay usage must require:

```text
safety.noLookaheadApplied = true
```

The adapter preserves `asOfTimestamp`, candle summaries, diagnostics, and safety flags so downstream systems can audit historical context without looking ahead.

## Downstream Ownership

TraderLink Intelligence / the journal app owns execution interpretation, journal behavior, user-facing workflow, and any future grading/coaching features. This adapter only supplies validated factual market-structure context.

## Next Recommended App-Side Gate

Recommended next gate:

```text
journal_trade_context_snapshot_attachment
```

Reason: the adapter can now validate and derive a factual view from `LevelAnalysisSnapshot` v1. The next app-side step should attach a validated snapshot to a trade/session context before any execution interpretation consumes it.
