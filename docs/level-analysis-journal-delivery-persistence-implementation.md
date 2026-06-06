# Level Analysis Journal Delivery Persistence Implementation

## Purpose

Gate `journal_level_analysis_delivery_persistence_implementation` implements
durable journal-side storage and feature-gated API endpoints for validated
levels-system journal delivery payloads.

This gate implements the contract from
`docs/level-analysis-journal-delivery-persistence-contract.md`. It does not
wire production UI, does not change LevelEngine behavior, and does not modify
the levels-system repo.

## Implemented Boundary

The journal app now stores `JournalLevelAnalysisDeliveryRecord` records in
SQLite after the existing ingestion adapter accepts or quarantines a payload.

Storage keeps:

- the full source-preserved `rawPayload`
- the deterministic `rawPayloadHash`
- compact package/read-model metadata
- one searchable per-symbol summary row per accepted symbol
- quarantine reasons for rejected payloads

The old single `LevelAnalysisSnapshot` v1 ingestion path remains valid and can
be persisted through the same repository/API path.

## Storage

New module:

`src/lib/level-analysis/level-analysis-journal-delivery-persistence-storage.ts`

Tables:

- `level_analysis_delivery_records`
- `level_analysis_delivery_symbol_summaries`

Migration marker:

- `004_level_analysis_delivery_persistence`

Idempotency is keyed by `raw_payload_hash`. A second ingest with the same raw
payload hash returns the existing durable record and reports `duplicate: true`
through the API response.

Quarantined records are persisted for audit/debug, but they do not write trusted
symbol summary rows.

## API

The API is feature-gated by:

- `LEVEL_ANALYSIS_JOURNAL_DELIVERY_API_ENABLED=1`
- `LEVEL_ANALYSIS_JOURNAL_DELIVERY_RAW_DEBUG_ENABLED=1` for admin raw payload
  reads

Routes:

- `POST /api/level-analysis/deliveries/validate`
- `POST /api/level-analysis/deliveries`
- `GET /api/level-analysis/deliveries/latest?provider=ibkr`
- `GET /api/level-analysis/deliveries/latest/symbols/[symbol]?provider=ibkr`
- `GET /api/admin/level-analysis/deliveries/[deliveryId]/raw`

Request bodies may be either the source payload directly or:

```json
{
  "payload": {},
  "allowedPackagedProviders": ["ibkr"],
  "sourceArtifactCommit": "optional",
  "sourceCommit": "optional",
  "sourceArtifactPath": "optional"
}
```

Malformed or unsafe payloads return quarantine responses. The ingest route
returns HTTP `422` for quarantined payloads while preserving the payload in the
quarantine record.

## Safety Boundaries

The implementation stays facts-only:

- no recommendations
- no buy/sell/hold decisions
- no coaching
- no grading
- no P/L
- no giveback analysis
- no behavior scoring
- 15m data remains context-only
- raw source payload preservation remains required

## Verification Plan

Implemented tests cover:

- SQLite accepted-record persistence
- per-symbol latest retrieval
- duplicate raw payload hash idempotency
- quarantine persistence without trusted symbol rows
- malformed record rejection
- old `LevelAnalysisSnapshot` v1 persistence compatibility
- validate/ingest/latest/symbol/raw API route behavior
- feature flag blocking
- raw source payload preservation
- facts-only response wording

Recommended validation commands:

- `npm install`
- `npx vitest run src/lib/level-analysis/__tests__`
- `npx tsc --noEmit --pretty false`
- focused ESLint for touched files
- `git diff --check`
- `git diff --cached --check`

## Recommended Next Gate

`journal_level_analysis_delivery_persistence_to_journal_linking_design`

Reason: durable delivery storage and API access are now available behind feature
flags. The next decision is how accepted symbol summaries should be linked to
journal entries, trades, accounts, or workspaces without wiring UI prematurely
or turning facts into trade advice.
