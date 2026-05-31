# LevelAnalysisSnapshot Trade Context Attachment

## Purpose

This gate adds the app-side attachment boundary for validated `LevelAnalysisSnapshot` v1 payloads.

The attachment exists so TraderLink Intelligence / the journal app can associate factual chart-analysis context with a trade or session context before any downstream execution interpretation consumes it.

It does not add trade grading, coaching, P/L analysis, giveback analysis, behavior scoring, recommendations, trade advice, or journal UI behavior.

## Why Attachment Exists

`LevelAnalysisSnapshot` v1 is produced by `levels-system` as factual candle-data support/resistance context. The journal app needs a safe way to:

- validate the snapshot contract
- preserve the raw snapshot unchanged
- expose a factual connector view
- keep diagnostics, limitations, and safety flags visible
- attach the context to a trade/session owner reference

The attachment layer is the boundary between imported chart context and later journal-specific workflows.

## What Is Attached

The attachment model lives in:

```text
src/lib/level-analysis/level-analysis-snapshot-attachment.ts
```

An accepted attachment includes:

- deterministic `attachmentKey`
- owner reference, such as a trade id or session id
- `symbol`
- `asOfTimestamp`
- `sourceType: level-analysis-snapshot-v1`
- `validationStatus: accepted`
- raw `LevelAnalysisSnapshot` v1 object
- factual connector view
- limitations
- diagnostics
- caller-supplied `attachedAt`
- `schemaVersion`
- `producer`

Quarantined attachments keep validation errors and any available raw payload metadata without exposing a connector view.

## Raw Snapshot Preservation

The attachment stores the accepted raw snapshot object unchanged. Unknown additive fields are preserved by the adapter and remain available for audit.

Attachment helpers return new trade/session context objects instead of mutating existing execution or trade fields.

## Factual Connector View Usage

The connector view can be used as factual context for:

- contract identity
- symbol/as-of/reference price
- input summary
- nearest support/resistance
- level bucket counts
- extension counts
- fact presence summary
- diagnostics counts
- safety flags
- quality context
- synthetic continuation-map summary
- data limitations

It is not an execution interpretation layer.

## Validation And Quarantine Rules

Attachment creation uses the existing app-side adapter:

```text
src/lib/level-analysis/level-analysis-snapshot-adapter.ts
```

Snapshots are quarantined when they are missing required v1 fields, have the wrong producer, use an unsupported schema version, are unsafe for replay/journal use, contain malformed nearest-level fields, or contain synthetic rows while `safety.syntheticExtensionsClearlyMarked` is false.

Accepted snapshots require no-lookahead safety for normal journal attachment use.

## Synthetic Continuation-Map Handling

Synthetic continuation-map rows stay factual and visibly marked.

The attachment carries the adapter's synthetic summary and preserves each row's metadata, including:

```text
extensionMetadata.extensionSource = synthetic_continuation_map
```

Synthetic rows are forward-planning chart map levels only. They are not historical support/resistance and are not execution instructions.

## LevelQualityAudit Handling

`LevelQualityAudit` is carried as quality and diagnostic context only.

Audit findings should be used to understand coverage, data completeness, and chart-analysis quality. They should not be converted into trading instructions or journal conclusions by this attachment layer.

## What Is Intentionally Not Done

This gate intentionally does not:

- change `levels-system`
- alter support/resistance detection
- store attachments in a database
- add app UI
- feed snapshots into execution interpretation
- grade trades
- coach users
- calculate P/L
- calculate giveback
- score behavior
- produce recommendations
- produce entry or exit decisions
- produce trade advice

## Current Integration Shape

The helper can attach an accepted snapshot to any existing trade/session object by returning a copy with:

```text
levelAnalysisSnapshots: LevelAnalysisSnapshotAttachment[]
```

No production `TradeTimeline` or trade-analysis request type was changed in this gate. That keeps the boundary small until storage and retrieval semantics are defined.

## Next Recommended Gate

Recommended next gate:

```text
journal_level_analysis_storage_contract
```

Reason: before execution interpretation consumes snapshots, the app should define how attached snapshots are stored, versioned, retrieved, and audited across trade/session records.
