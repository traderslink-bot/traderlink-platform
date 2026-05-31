# LevelAnalysisSnapshot Storage Contract

## Purpose

This document defines the app-side storage and retrieval contract for attached
`LevelAnalysisSnapshot` v1 records. The storage layer exists so TraderLink
Intelligence can preserve factual candle-data chart context from `levels-system`
before any later execution-analysis planning decides how that context may be
used.

This gate is storage and retrieval plumbing only. It does not interpret
execution quality and does not turn level data into trade conclusions.

## Why This Contract Exists

The journal app now has three separate factual boundaries:

1. The `LevelAnalysisSnapshot` adapter validates and derives a read-only
   connector view from a v1 snapshot.
2. The attachment layer binds that validated snapshot to a trade/session-like
   owner as factual chart context.
3. The storage layer stores, versions, retrieves, audits, and quarantines those
   attachments without mutating the raw snapshot.

Keeping storage separate from interpretation makes the downstream integration
auditable and replay-safe.

## Storage Record Lifecycle

An accepted record is created from an accepted
`LevelAnalysisSnapshotAttachment`.

Accepted records include:

- deterministic `storageKey`
- owner reference
- symbol
- `asOfTimestamp`
- `schemaVersion`
- `producer`
- source type
- validation status
- raw snapshot
- factual connector view
- attachment
- diagnostics
- limitations
- created and updated timestamps
- version
- audit trail

The raw snapshot is preserved unchanged. Unknown/additive fields stay on the raw
snapshot for forward compatibility.

## Accepted Versus Quarantined Records

Accepted records are safe factual chart-context records. They include a raw
snapshot and a factual connector view.

Quarantined records are invalid or unsafe payloads. They preserve the raw
payload when available and carry validation errors as quarantine reasons, but
they do not expose a factual connector view.

Quarantine is expected for cases such as:

- missing or unsupported schema version
- wrong producer
- missing required identity or snapshot fields
- unsafe no-lookahead flags for journal/replay usage
- malformed nearest-level shape
- synthetic continuation-map rows without clear safety marking

## Raw Snapshot Preservation

Storage helpers must not mutate:

- the raw snapshot
- `levelEngineOutput`
- the factual connector view
- the attachment
- existing execution/trade/session fields

Retrieval returns stored records without deriving new interpretation.

## Versioning Rules

Storage records carry an app-side numeric `version`. The initial version is `1`
unless a caller supplies another deterministic value.

The version is the storage-record version, not the snapshot schema version.
Snapshot compatibility is still governed by `schemaVersion`, which must start
with `level-analysis-snapshot/v1`.

## Retrieval Rules

The storage contract uses pure collection helpers. The current implementation is
array-based and can later be mapped onto a database or repository without
changing the contract.

Supported retrieval modes:

- by deterministic storage key
- by owner id
- by symbol
- latest accepted snapshot for owner and symbol
- nearest as-of snapshot for owner and/or symbol
- list quarantined records

Duplicate storage keys are deterministic: a later stored record with the same
key replaces the existing record at the same collection position.

## No-Lookahead Retrieval Rule

Nearest-as-of retrieval does not return future snapshots by default. It returns
the closest record at or before the requested `asOfTimestamp`.

Future snapshots are only eligible when the caller explicitly passes
`allowFuture: true`. Journal/replay usage should leave this disabled.

## Audit Trail Rules

Audit entries are factual lifecycle events only. They can record creation,
storage, retrieval, quarantine, or audit append events.

Audit entries must not contain execution interpretation, user-facing
instructions, or journal-owned conclusions.

## Synthetic Continuation-Map Handling

Synthetic continuation-map levels remain factual forward-planning chart-map
levels from `levels-system`. Storage preserves their metadata and does not treat
them as historical support/resistance.

The storage layer depends on adapter and attachment validation to quarantine
snapshots when synthetic rows are present but the safety flags do not mark them
clearly.

## LevelQualityAudit Handling

`LevelQualityAudit` remains diagnostics and quality context only. Storage keeps
audit-derived counts, limitations, and diagnostics available for later factual
review.

Quality findings are not execution instructions.

## What Is Intentionally Not Done

The storage contract does not:

- grade trades
- coach users
- calculate P/L
- calculate giveback
- score behavior
- provide recommendations
- make buy/sell/hold decisions
- produce entry or exit decisions
- alter support/resistance detection
- mutate `LevelAnalysisSnapshot`
- mutate `LevelEngineOutput`
- consume snapshots in execution analysis

## Next Recommended Gate

Recommended next gate:
`journal_execution_analysis_integration_planning`.

Reason: validated snapshots can now be attached, stored, retrieved, audited, and
quarantined safely. The next safe step is planning how future execution analysis
may consume factual level context while preserving the boundary that journal
interpretation remains downstream and separate from levels-system output.
