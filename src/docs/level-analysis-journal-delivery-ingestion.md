# Level Analysis Journal Delivery Ingestion

## Gate

`journal_level_analysis_delivery_ingestion`

## Purpose

This gate updates TraderLink Intelligence / journal-side ingestion so it can
accept both levels-system payload shapes:

1. the older single `LevelAnalysisSnapshot` v1 payload
2. the current packaged review delivery payload with `entries[]`

The work stays at the ingestion, validation, fixture, and normalized
chart-context-view boundary. It does not wire production UI, persistence, or API
fetching for the new package.

## Source Artifacts

Old compact parser fixture:

```text
levels-system/docs/examples/level-analysis-snapshot/journal-connector-contract/journal-connector-level-analysis-snapshot-v1.json
```

Current delivery package to consume first:

```text
levels-system/docs/examples/level-analysis-snapshot/level-candidate-inventory-visibility/volume-session-context/latest-level-candidate-inventory-volume-session-context-review-wiring.json
```

Contract and handoff:

```text
levels-system/docs/146_LEVEL_ANALYSIS_SNAPSHOT_JOURNAL_DELIVERY_CONTRACT.md
levels-system/docs/147_LEVEL_ANALYSIS_SNAPSHOT_JOURNAL_DELIVERY_HANDOFF.md
```

The app-side compact packaged fixture is:

```text
src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json
```

It preserves source path and commit metadata in `fixtureMetadata` and omits raw
candles, full snapshots, raw cache wrapper payloads, and provider responses.

## Existing Ingestion

The existing base parser path remains:

```text
src/lib/level-analysis/level-analysis-snapshot-adapter.ts
```

It accepts `schemaVersion` starting with `level-analysis-snapshot/v1`, requires
`producer: "levels-system"`, validates snapshot identity, nearest
support/resistance, `levelEngineOutput`, `levelQualityAudit`, diagnostics, and
safety flags, and preserves the raw snapshot object.

Existing downstream boundaries remain v1-only:

- snapshot attachment:
  `src/lib/level-analysis/level-analysis-snapshot-attachment.ts`
- snapshot storage:
  `src/lib/level-analysis/level-analysis-snapshot-storage.ts`
- execution context input/read model:
  `src/lib/level-analysis/execution-level-context-input.ts`
  and related observation/read-model files

This gate does not change those persistence or execution-consumption contracts.

## New Ingestion Entry Point

The additive journal delivery adapter is:

```text
src/lib/level-analysis/level-analysis-journal-delivery-adapter.ts
```

Use:

```ts
loadLevelAnalysisJournalPayloadForJournal(rawJson)
validateLevelAnalysisJournalPayload(parsedPayload)
```

The adapter dispatches by `schemaVersion`:

- `level-analysis-snapshot/v1...` -> existing v1 snapshot validator
- `level-quality-review-process/v1...` -> packaged review delivery validator

## Packaged Delivery Requirements

The new package must include:

- `schemaVersion`
- `generatedAt`
- `provider`
- `reviewedSymbols`
- `supplied15mSymbols`
- `summary`
- `cacheFingerprintSet`
- `cacheFingerprintSummary`
- `entries[]`
- `prohibitedLanguageHits`
- `safety`

Each entry must include factual chart-context fields such as `sourceFiles`,
`nearestLevels`, `bucketCounts`, `extensionCoverage`,
`syntheticContinuationMap`, `qualityAudit`, `diagnosticSemantics`,
`fifteenMinuteContext`, `candidateInventoryVisibility`,
`candidateVolumeSessionContext`, `parity`, `mismatches`, and `safety`.

By default the packaged provider must be `ibkr`. Alternate providers require an
explicit `allowedPackagedProviders` option and must be consistent across package,
entries, cache fingerprints, and candidate contexts.

## Normalized View Shape

Accepted payloads produce `LevelAnalysisJournalChartContextView` values. Old
single snapshots produce one view. Packaged review deliveries produce one view
per `entries[]` item and carry top-level package metadata.

The view is factual and compact:

- `sourceKind`: `single_snapshot_v1` or `packaged_review_delivery`
- symbol, provider, as-of timestamp/ISO, reference price, previous close
- nearest support/resistance
- bucket counts
- extension coverage
- synthetic continuation-map summary
- quality diagnostics and density metric when present
- candidate inventory gap summary when present
- volume/session context summary when present
- source file metadata when present
- cache fingerprint/source-integrity summary when present
- 15m context-only status
- limitations
- safety flags

The view intentionally does not add recommendations, coaching, grading, P/L,
giveback analysis, behavior scoring, execution-quality inference, or
buy/sell/hold decisions.

## Source Preservation

Accepted results keep the raw source payload object in `sourcePayload` while
returning separately derived chart-context views.

The adapter does not mutate source payloads. Unknown additive fields are
tolerated and preserved in `sourcePayload`.

## Quarantine Rules

Malformed or unsafe payloads are quarantined, not coerced.

Quarantine cases include:

- unsupported schema or package shape
- missing required fields
- non-IBKR packaged provider unless explicitly configured
- inconsistent provider across package, entries, fingerprints, or candidate
  contexts
- missing or empty `entries[]`
- nonzero `summary.mismatchCount`
- non-empty per-entry `mismatches[]`
- non-empty `prohibitedLanguageHits`
- missing safety flags
- unsafe safety flags
- missing per-entry `fifteenMinuteContext`
- `fifteenMinuteContext.stillContextOnly !== true`
- 15m cache fingerprint marked as LevelEngine input
- malformed cache fingerprint set or summary
- malformed candidate inventory visibility
- malformed candidate volume/session context

## Boundaries

Levels-system owns:

- source artifact generation
- support/resistance output
- density metric
- candidate inventory visibility
- candidate volume/session context
- cache fingerprints
- facts-only safety flags

TraderLink Intelligence owns:

- journal ingestion
- quarantine handling
- persistence design
- API fetching
- UI presentation
- journal record linking
- any future user-specific interpretation layer

This gate does not modify levels-system, LevelEngine behavior, support/resistance
generation, runtime defaults, monitoring, Discord, alerts, or production
website UI.

## Next Recommended Gate

Recommended next gate:

```text
journal_level_analysis_delivery_persistence_or_api_design
```

Reason: ingestion is now validated against both payload shapes. The next step
should design how the website/backend persists, fetches, or links the validated
chart-context source package without widening the ingestion boundary.
