# Level Analysis Journal Delivery Persistence Or API Design

## Gate

`journal_level_analysis_delivery_persistence_or_api_design`

## Purpose

This gate defines how TraderLink Intelligence should persist and expose
validated levels-system journal delivery payloads after ingestion, before any
production UI or live journal workflow depends on them.

This is a design gate. It does not add durable storage, API route handlers, UI
wiring, LevelEngine changes, support/resistance tuning, or trade interpretation
behavior.

## Current Ingestion Status

The journal app now has a source-preserving ingestion adapter at:

```text
src/lib/level-analysis/level-analysis-journal-delivery-adapter.ts
```

It supports both delivery shapes:

- `single_snapshot_v1`: old single `LevelAnalysisSnapshot` v1 payloads,
  delegated through the existing
  `src/lib/level-analysis/level-analysis-snapshot-adapter.ts` validator path.
- `packaged_review_delivery`: current `level-quality-review-process/v1`
  packages with `entries[]`.

Accepted payloads return:

- `sourcePayload`: the original parsed source payload, preserved separately.
- `views`: compact factual `LevelAnalysisJournalChartContextView` values.
- `packageMetadata`: top-level package metadata for packaged deliveries.
- `limitations`: factual source limitations from the payload.

Quarantined payloads return validation errors and no derived views.

The current compact packaged fixture is:

```text
src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json
```

The source artifact to consume first remains the levels-system packaged review
delivery artifact referenced by that fixture metadata:

```text
docs/examples/level-analysis-snapshot/level-candidate-inventory-visibility/volume-session-context/latest-level-candidate-inventory-volume-session-context-review-wiring.json
```

Existing v1 snapshot attachment, storage, and execution-context read-model
contracts remain separate and should not be removed as part of this work.

## Existing App Patterns To Follow

The app already uses thin App Router route handlers under `app/api/...`.
Relevant route handlers export:

```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

They parse requests in `src/lib` services, return JSON with a
`contractVersion`, and keep repository/database logic outside route files.

The durable local persistence pattern is SQLite through
`SqliteImportCommitRepository`:

- indexed columns for lookup fields
- serialized JSON payload columns for full records
- migration IDs recorded in `schema_migrations`
- `INSERT OR REPLACE` or explicit conflict handling for idempotent writes
- repository methods that hide physical storage details from route handlers

The existing level-analysis storage helpers also preserve raw source payloads,
store accepted and quarantined records separately by status, keep audit trails,
and expose latest/nearest retrieval helpers by owner, symbol, and as-of time.

## Design Options

| Option | Complexity | Auditability | Queryability | Replay/debug value | Risk | Migration needs | v1 compatibility | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Persist raw source payload only | Low | Strong, because the full source artifact is retained | Weak, because every screen/API must derive views on read | Strong for replay, weak for search | Read-time drift if derivation code changes; inefficient symbol/latest queries | Minimal table with raw JSON and status | Compatible if raw v1 snapshots use the same envelope or remain in old storage | Not recommended as the main path |
| B. Persist normalized compact summary plus raw source payload | Medium | Strong, because raw source remains immutable | Strong, because symbols, timestamps, provider, status, cache summaries, and per-symbol facts are queryable | Strong, because raw and derived facts can be compared | Requires a stable contract and migrations, but risk is bounded by fixtures | Add record table plus optional symbol-summary table/index | Best compatibility: one envelope can represent v1 and packaged deliveries while old v1 storage remains intact | Recommended |
| C. API-only pass-through initially | Low | Weak unless callers store the payload elsewhere | Weak; no historical latest/as-of query | Weak for replay after process restart or artifact loss | Easy to wire too early into UI without durable history | None initially | Compatible with both shapes through the adapter | Useful only as a temporary integration probe |
| D. Deferred persistence | Lowest now | None beyond source files | None | None in the journal app | Delays the next product decision and can hide schema problems until UI work | None now, larger later | Existing v1 path continues, new package remains ingestion-only | Acceptable only if product requirements are not ready |

## Recommendation

Use option B: persist a normalized compact summary plus the raw source payload.

The journal app needs stable facts for retrieval, API responses, and eventual UI
workflows, but the raw source payload must remain available for audit, replay,
deduplication, and future levels-system schema changes.

The next gate should lock this as a deterministic contract before adding
durable storage:

```text
journal_level_analysis_delivery_persistence_contract
```

## Proposed Persisted Record

Conceptual type:

```ts
interface JournalLevelAnalysisDeliveryRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  workspaceId?: string;
  accountId?: string;
  userId?: string;
  sourceSystem: "levels-system";
  sourceKind: "single_snapshot_v1" | "packaged_review_delivery";
  sourceSchemaVersion: string;
  sourceArtifactPath?: string;
  sourceArtifactCommit?: string;
  sourceCommit?: string;
  provider?: string;
  generatedAt?: string;
  reviewedSymbols: string[];
  supplied15mSymbols: string[];
  baselineMismatchCount: number | null;
  validationStatus: "accepted" | "quarantined";
  prohibitedLanguageStatus: "clear" | "hits_present" | "unknown";
  rawPayloadHash: string;
  rawPayload: unknown;
  compactSummary: JournalLevelAnalysisDeliveryCompactSummary | null;
  perSymbolSummary: JournalLevelAnalysisSymbolSummary[];
  safetyFlags: unknown;
  limitations: JournalLevelAnalysisLimitation[];
  quarantineReasons: JournalLevelAnalysisQuarantineReason[];
  auditTrail: JournalLevelAnalysisDeliveryAuditEntry[];
}
```

Accepted records should store both `rawPayload` and derived summaries.
Quarantined records should store `rawPayload`, validation errors, and no
trusted derived symbol summaries.

## Compact Summary

```ts
interface JournalLevelAnalysisDeliveryCompactSummary {
  packageGeneratedAt?: string;
  provider?: string;
  symbolCount: number;
  sourceKind: "single_snapshot_v1" | "packaged_review_delivery";
  cacheFingerprintSummary?: unknown;
  cacheFingerprintCounts?: {
    totalFingerprints: number;
    levelEngineInputCount: number;
    contextOnlyCount: number;
    fifteenMinuteContextOnlyCount: number;
    validationIssueCount: number;
  };
  mismatchCount: number | null;
  prohibitedLanguageHitCount: number | null;
  allFifteenMinuteContextOnly: boolean | null;
  limitationCount: number;
  safetySummary: unknown;
}
```

For old single-snapshot v1 payloads, cache-fingerprint fields are absent unless
future v1-compatible source metadata adds them. That absence is a limitation,
not a failed record.

## Per-Symbol Summary

Per-symbol summaries remain facts-only:

```ts
interface JournalLevelAnalysisSymbolSummary {
  deliveryId: string;
  symbol: string;
  provider?: string;
  asOfTimestamp: number;
  asOfIso?: string;
  referencePrice?: number;
  previousClose?: number;
  nearestSupport: unknown;
  nearestResistance: unknown;
  bucketCounts: Record<string, number>;
  extensionCoverage?: unknown;
  syntheticContinuationMapSummary: {
    count: number;
    supportCount?: number;
    resistanceCount?: number;
    clearlyMarkedCount?: number;
  };
  diagnostics: string[];
  diagnosticSemantics?: unknown;
  densityMetricSummary?: unknown;
  candidateInventoryGapSummary?: unknown;
  volumeSessionContextSummary?: unknown;
  sourceFiles?: Record<string, unknown>;
  cacheFingerprintSourceIntegrity?: unknown;
  fifteenMinuteContextOnlyStatus:
    | "context_only"
    | "not_supplied"
    | "not_declared_by_single_snapshot_v1";
  missingFacts: string[];
  limitations: JournalLevelAnalysisLimitation[];
  safetyFlags: unknown;
}
```

These fields should be derived from `LevelAnalysisJournalChartContextView`.
They should not include trade performance, trader behavior scoring, coaching,
or execution-quality inference.

## Physical Storage Shape

Start with two durable tables when implementation begins:

```sql
CREATE TABLE level_analysis_delivery_records (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  account_id TEXT,
  user_id TEXT,
  source_system TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_schema_version TEXT NOT NULL,
  provider TEXT,
  generated_at TEXT,
  validation_status TEXT NOT NULL,
  prohibited_language_status TEXT NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  reviewed_symbols_json TEXT NOT NULL,
  compact_summary_json TEXT,
  raw_payload_json TEXT NOT NULL,
  safety_flags_json TEXT,
  quarantine_reasons_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX level_analysis_delivery_raw_hash_unique
  ON level_analysis_delivery_records(raw_payload_hash);

CREATE TABLE level_analysis_delivery_symbol_summaries (
  id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  provider TEXT,
  as_of_timestamp INTEGER NOT NULL,
  as_of_iso TEXT,
  validation_status TEXT NOT NULL,
  summary_json TEXT NOT NULL
);

CREATE INDEX level_analysis_delivery_symbol_latest
  ON level_analysis_delivery_symbol_summaries(symbol, provider, as_of_timestamp DESC);
```

This mirrors the existing app style: query-critical columns are indexed, while
the full record and compact view remain serialized JSON.

If the app later moves from SQLite to Postgres/Neon for Trader Intelligence,
the same logical shape can become JSONB-backed without changing API contracts.

## Idempotency And Deduplication

Use a deterministic `rawPayloadHash` computed from canonical JSON after parsing
but before mutation. Because ingestion already avoids mutating source payloads,
the hash can serve as the primary dedupe key.

For accepted packaged deliveries, record identity should also surface:

- `sourceKind`
- `sourceSchemaVersion`
- `provider`
- `generatedAt`
- `reviewedSymbols`
- `sourceArtifactPath` and `sourceArtifactCommit` when present

If an identical payload is ingested twice, return the existing record with
`duplicate: true` instead of creating a second record.

If the same package identity appears with a different `rawPayloadHash`, keep the
new payload quarantined until a contract explicitly permits source replacement.

## Proposed API Routes

Route handlers should remain thin App Router handlers under `app/api/...`.
Validation, persistence, and hashing belong in `src/lib/level-analysis`.

### Validate Without Persistence

```text
POST /api/level-analysis/deliveries/validate
```

Request:

```json
{
  "payload": { "schemaVersion": "level-quality-review-process/v1" },
  "allowedPackagedProviders": ["ibkr"]
}
```

Response for accepted payloads:

```json
{
  "contractVersion": "level_analysis_delivery_validate_api_v1",
  "status": "accepted",
  "sourceKind": "packaged_review_delivery",
  "packageMetadata": {},
  "compactSummary": {},
  "perSymbolSummary": []
}
```

Response for quarantined payloads:

```json
{
  "contractVersion": "level_analysis_delivery_validate_api_v1",
  "status": "quarantined",
  "errors": []
}
```

This route does not persist raw payloads, quarantine records, or derived views.

### Ingest And Persist

```text
POST /api/level-analysis/deliveries
```

Request:

```json
{
  "payload": {},
  "sourceArtifactPath": "docs/examples/level-analysis-snapshot/...",
  "sourceArtifactCommit": "f57e8efe9954388ba44adea8bffde180cf6e4c73"
}
```

Accepted response:

```json
{
  "contractVersion": "level_analysis_delivery_ingest_api_v1",
  "status": "accepted",
  "deliveryId": "lad_...",
  "duplicate": false,
  "compactSummary": {},
  "perSymbolSummary": []
}
```

Quarantined response:

```json
{
  "contractVersion": "level_analysis_delivery_ingest_api_v1",
  "status": "quarantined",
  "deliveryId": "laq_...",
  "errors": []
}
```

Invalid JSON should return `400`. Valid JSON that fails contract validation
should be quarantined and return a non-success status chosen by implementation
contract, preferably `202` if the quarantine record was stored or `422` if
quarantine persistence is disabled.

### Retrieve Latest Delivery Summary

```text
GET /api/level-analysis/deliveries/latest?provider=ibkr
```

Response:

```json
{
  "contractVersion": "level_analysis_delivery_latest_api_v1",
  "status": "found",
  "deliveryId": "lad_...",
  "sourceKind": "packaged_review_delivery",
  "compactSummary": {},
  "symbols": ["DEVS", "QUBT"]
}
```

Only accepted records should be returned by default.

### Retrieve Latest Symbol Summary

```text
GET /api/level-analysis/deliveries/latest/symbols/[symbol]?provider=ibkr
```

Response:

```json
{
  "contractVersion": "level_analysis_delivery_symbol_latest_api_v1",
  "status": "found",
  "deliveryId": "lad_...",
  "symbol": "DEVS",
  "summary": {}
}
```

This endpoint should return a compact factual symbol summary, not the raw source
payload.

### Retrieve Raw Source Payload

```text
GET /api/admin/level-analysis/deliveries/[deliveryId]/raw
```

This should be admin/debug only and should not be consumed by production UI.
The response may include `rawPayloadHash`, source metadata, validation status,
and the preserved raw payload. It should be protected by app authentication or
an internal ingestion/admin token before implementation.

## Authorization And Feature Flags

Do not expose ingest or raw retrieval publicly.

Recommended assumptions for implementation:

- `POST /api/level-analysis/deliveries` requires an internal ingestion token or
  authenticated admin user.
- raw source retrieval requires admin/debug access.
- read-summary endpoints require the same user/workspace/account model used by
  the journal workflow once that model is locked.
- all new routes should be behind a feature flag such as
  `LEVEL_ANALYSIS_JOURNAL_DELIVERY_API_ENABLED` until persistence is verified.
- raw payload retrieval can have a stricter flag such as
  `LEVEL_ANALYSIS_JOURNAL_DELIVERY_RAW_DEBUG_ENABLED`.

## Quarantine Rules

The persistence/API layer should use the existing ingestion quarantine rules and
must not coerce malformed payloads into accepted summaries.

Quarantine persisted records should include:

- `validationStatus: "quarantined"`
- raw payload when valid JSON was supplied
- validation errors
- source schema/provider when safely readable
- no trusted `perSymbolSummary`

Quarantine cases include:

- unsupported schema/package shape
- missing required fields
- non-IBKR packaged provider unless explicitly configured
- missing or empty `entries[]`
- nonzero package mismatch count
- prohibited wording hits
- missing safety flags
- unsafe safety flags
- missing `fifteenMinuteContext`
- 15m context not marked context-only
- 15m cache fingerprint marked as a LevelEngine input
- malformed candidate inventory visibility
- malformed candidate volume/session context

## Safety And Compatibility Rules

- Preserve the old `LevelAnalysisSnapshot` v1 ingestion path.
- Preserve the raw source payload for accepted and valid-JSON quarantined
  deliveries.
- Treat unknown additive source fields as allowed and retained in raw payloads.
- Do not mutate source payloads.
- Do not infer trader execution quality from the levels-system payload.
- Do not turn factual support/resistance context into recommendations.
- Do not introduce buy/sell/hold wording.
- Do not add coaching, grading, P/L, giveback analysis, behavior scoring, or
  trade-advice behavior.
- Treat 15m data as context-only.
- Keep levels-system responsible for source generation, support/resistance,
  density metrics, candidate inventory, volume/session context, cache
  fingerprints, and safety flags.
- Keep TraderLink Intelligence responsible for validation, quarantine,
  persistence, API contracts, raw payload preservation, and eventual UI display.
- Do not wire production UI to these routes until the persistence/API contract
  is locked and tested.

## Migration Considerations

The first implementation should add new storage alongside the existing v1
snapshot storage instead of replacing it.

Recommended migration path:

1. Add contract fixtures for `JournalLevelAnalysisDeliveryRecord` and
   `JournalLevelAnalysisSymbolSummary`.
2. Add type-only contracts and deterministic hash helpers.
3. Add repository interface and in-memory tests.
4. Add SQLite migrations and repository tests.
5. Add API validate/ingest/read route tests behind a feature flag.
6. Keep old `LevelAnalysisSnapshot` v1 storage available until a later gate
   proves a safe read-model replacement.

Backfilling old v1 snapshots into the new delivery table is optional. If done,
it should store `sourceKind: "single_snapshot_v1"` with exactly one symbol
summary per snapshot while preserving the old storage record.

## Future Test Plan

The next implementation gates should test:

- old single-snapshot v1 creates an accepted delivery record
- packaged review delivery creates one record and one symbol summary per entry
- raw payload hash is stable and raw payload remains unmutated
- duplicate payload ingestion returns the existing delivery record
- unknown additive fields are preserved in `rawPayload`
- malformed payloads persist as quarantine records with no symbol summaries
- nonzero mismatch count is quarantined
- 15m context-only status is enforced
- cache fingerprint summary is persisted and surfaced
- density metric summary is persisted and surfaced
- candidate inventory gap summary is persisted and surfaced
- volume/session context summary is persisted and surfaced
- latest package and latest symbol retrieval return accepted records only
- raw payload endpoint is admin/debug only
- route responses include stable `contractVersion` values
- no recommendation, coaching, grading, P/L, giveback, behavior scoring,
  buy/sell/hold, or trade-advice fields or wording appear in derived summaries

## Recommended Next Gate

```text
journal_level_analysis_delivery_persistence_contract
```

Reason: after this design is accepted, lock the persisted record and API
contract with deterministic fixtures before implementing durable storage or
production API wiring.
