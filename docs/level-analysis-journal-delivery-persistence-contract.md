# Level Analysis Journal Delivery Persistence Contract

## Gate

`journal_level_analysis_delivery_persistence_contract`

## Purpose

This gate locks the journal-side persisted record and API response contract for
levels-system journal delivery payloads before durable storage or production API
wiring is implemented.

This gate adds type contracts, pure validation/hash helpers, compact fixtures,
and focused tests. It does not add database writes, route handlers, production
UI, LevelEngine changes, support/resistance tuning, or trade interpretation
behavior.

## Dependencies

This contract depends on the two merged gates before it:

- `journal_level_analysis_delivery_ingestion`
- `journal_level_analysis_delivery_persistence_or_api_design`

The ingestion adapter remains the source of truth for accepting or quarantining
source payloads:

```text
src/lib/level-analysis/level-analysis-journal-delivery-adapter.ts
```

The persistence contract is additive and does not replace the old
`LevelAnalysisSnapshot` v1 ingestion path.

## Contract Module

The type and helper contract lives at:

```text
src/lib/level-analysis/level-analysis-journal-delivery-persistence-contract.ts
```

It defines:

- `JournalLevelAnalysisDeliveryRecord`
- `JournalLevelAnalysisDeliverySymbolSummary`
- compact summary and cache fingerprint count types
- API response contract types
- `hashJournalLevelAnalysisRawPayload(...)`
- `isJournalLevelAnalysisDuplicatePayload(...)`
- `createJournalLevelAnalysisDeliveryRecordFromIngestion(...)`
- `validateJournalLevelAnalysisDeliveryRecord(...)`
- `validateJournalLevelAnalysisDeliverySymbolSummary(...)`

The helpers are pure contract helpers. They do not write to durable storage and
do not create production route handlers.

## Persisted Record Contract

`JournalLevelAnalysisDeliveryRecord` is the durable record shape that future
storage should implement.

Required record fields:

```ts
interface JournalLevelAnalysisDeliveryRecord {
  contractVersion: "journal_level_analysis_delivery_persistence_contract_v1";
  id: string;
  rawPayloadHash: string;
  sourceSystem: "levels-system";
  sourceKind: "single_snapshot_v1" | "packaged_review_delivery";
  sourceSchemaVersion: string;
  sourceArtifactPath?: string;
  sourceArtifactCommit?: string;
  sourceCommit?: string;
  provider?: string;
  generatedAt?: string;
  createdAt: string;
  reviewedSymbols: string[];
  baselineMismatchCount: number | null;
  validationStatus: "accepted" | "quarantined";
  prohibitedLanguageStatus: "clear" | "hits_present" | "unknown";
  rawPayload: unknown;
  compactSummary: JournalLevelAnalysisDeliveryCompactSummary | null;
  perSymbolSummary: JournalLevelAnalysisDeliverySymbolSummary[];
  safetyFlags: unknown;
  limitations: LevelAnalysisJournalDeliveryLimitation[];
  quarantineReasons: LevelAnalysisJournalDeliveryValidationError[];
  auditTrail: JournalLevelAnalysisDeliveryAuditEntry[];
}
```

Accepted records require:

- `validationStatus: "accepted"`
- a non-null `compactSummary`
- one or more `perSymbolSummary` rows
- empty `quarantineReasons`
- preserved `rawPayload`
- `rawPayloadHash` matching the canonical raw payload digest

Quarantined records require:

- `validationStatus: "quarantined"`
- `compactSummary: null`
- empty `perSymbolSummary`
- one or more `quarantineReasons`
- preserved raw payload when valid JSON was supplied

## Per-Symbol Summary Contract

`JournalLevelAnalysisDeliverySymbolSummary` is the factual symbol-level read
contract for future storage/API surfaces.

Required symbol fields:

- `deliveryId`
- `symbol`
- provider when present
- as-of timestamp and ISO when present
- reference price and previous close when present
- nearest support and nearest resistance
- bucket counts
- extension counts
- synthetic continuation-map summary
- diagnostics and diagnostic semantics when present
- density metric summary when present
- candidate inventory gap summary when present
- volume/session context summary when present
- source file metadata when present
- cache fingerprint/source-integrity summary when present
- 15m context-only status
- missing facts
- limitations
- safety flags

The symbol summary is factual chart context only. It does not encode user
execution quality, trade outcome, or behavior interpretation.

## API Response Contracts

The contract locks these response shapes for future route implementation.

### Validate Without Persistence

```text
POST /api/level-analysis/deliveries/validate
```

Contract version:

```text
level_analysis_delivery_validate_api_v1
```

Accepted responses include `sourceKind`, `compactSummary`, and
`perSymbolSummary`.

Quarantined responses include `status: "quarantined"` and validation `errors`.

### Ingest And Persist

```text
POST /api/level-analysis/deliveries
```

Contract version:

```text
level_analysis_delivery_ingest_api_v1
```

Accepted responses include `deliveryId`, `duplicate`, `rawPayloadHash`,
`compactSummary`, and `perSymbolSummary`.

Quarantined responses include `deliveryId`, `rawPayloadHash`, and validation
`errors`.

### Latest Delivery Summary

```text
GET /api/level-analysis/deliveries/latest
```

Contract version:

```text
level_analysis_delivery_latest_api_v1
```

Found responses include `deliveryId`, `sourceKind`, `compactSummary`, and
`symbols`.

### Latest Symbol Summary

```text
GET /api/level-analysis/deliveries/latest/symbols/[symbol]
```

Contract version:

```text
level_analysis_delivery_symbol_latest_api_v1
```

Found responses include `deliveryId`, `symbol`, and a compact factual symbol
summary.

### Admin Raw Payload

```text
GET /api/admin/level-analysis/deliveries/[deliveryId]/raw
```

Contract version:

```text
level_analysis_delivery_raw_admin_api_v1
```

This is admin/debug only. It returns the preserved `rawPayload`, its
`rawPayloadHash`, source kind, and validation status when found.

## Idempotency Rules

The contract uses `rawPayloadHash` as the deterministic idempotency key.

Rules:

- compute the hash from canonical JSON of the parsed source payload
- do not mutate the source payload before hashing
- if an incoming payload has the same `rawPayloadHash` as an existing delivery,
  treat the ingest response as `duplicate: true`
- if the same apparent package identity arrives with a different hash, future
  implementation should quarantine or require an explicit replacement policy

The contract helper is:

```ts
hashJournalLevelAnalysisRawPayload(rawPayload)
```

The idempotency helper is:

```ts
isJournalLevelAnalysisDuplicatePayload({
  existingRawPayloadHash,
  incomingRawPayloadHash,
})
```

## Quarantine Rules

The persistence/API contract does not coerce unsafe payloads into accepted
records.

Quarantine records must:

- preserve raw payload when valid JSON was supplied
- include validation errors
- keep `compactSummary` null
- keep `perSymbolSummary` empty
- carry `validationStatus: "quarantined"`

Quarantine cases are inherited from the ingestion gate, including:

- unsupported schema/package shape
- missing required fields
- non-IBKR packaged provider unless explicitly configured
- missing or empty `entries[]`
- nonzero mismatch count
- prohibited wording hits
- missing safety flags
- unsafe safety flags
- missing `fifteenMinuteContext`
- 15m context not marked context-only
- 15m cache fingerprint marked as a LevelEngine input
- malformed candidate inventory visibility
- malformed candidate volume/session context

## Compatibility Rules

- Preserve the existing `LevelAnalysisSnapshot` v1 ingestion path.
- The contract helper can build a record from old single-snapshot v1 ingestion.
- Old v1 records use `sourceKind: "single_snapshot_v1"` and one symbol summary.
- Existing old v1 attachment/storage contracts are not removed by this gate.
- Unknown additive source fields remain allowed and preserved in `rawPayload`.
- Raw source payload preservation is required for accepted and valid-JSON
  quarantined records.

## Safety Boundaries

- Do not modify the levels-system repo.
- Do not change LevelEngine behavior.
- Do not tune support/resistance generation.
- Do not wire production UI.
- Do not implement durable persistence in this gate.
- Do not add trade recommendations or trade-advice behavior.
- Do not add buy/sell/hold decisions.
- Do not add coaching, grading, P/L, giveback analysis, or behavior scoring.
- Do not infer user execution quality from the levels-system payload.
- Treat 15m context as context-only.

## Fixture List

Contract fixtures live at:

```text
src/lib/level-analysis/__fixtures__/persistence-contract/
```

Fixtures:

- `delivery-record.accepted.compact.json`
- `delivery-record.quarantined.compact.json`
- `api-responses.compact.json`
- `README.md`

The accepted fixture represents a compact `DEVS`/`QUBT` packaged delivery
record. The quarantine fixture represents a malformed packaged delivery with
missing entries and nonzero mismatch count. The API fixture locks validate,
ingest, duplicate ingest, quarantine, latest delivery, latest symbol, and
admin/debug raw-payload response shapes.

## Test Coverage

Focused tests live at:

```text
src/lib/level-analysis/__tests__/level-analysis-journal-delivery-persistence-contract.test.ts
```

They cover:

- persisted record fixture validation
- per-symbol summary validation
- malformed record rejection
- duplicate raw-payload hash idempotency expectations
- safe quarantine representation
- API response fixture contracts
- old `LevelAnalysisSnapshot` v1 compatibility
- raw source payload preservation
- prohibited recommendation/coaching/grading/P/L/giveback/behavior-scoring
  field and wording boundaries

## Recommended Next Gate

```text
journal_level_analysis_delivery_persistence_implementation
```

Reason: the persisted record and API response contracts are now locked with
deterministic fixtures. The next gate should implement durable persistence and
feature-gated API endpoints against this contract.
