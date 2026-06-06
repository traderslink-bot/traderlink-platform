# Level Analysis Delivery Journal Linking Contract

## Purpose

Gate `journal_level_analysis_delivery_journal_linking_contract` locks the
journal-side contract for attaching accepted levels-system delivery symbol facts
to saved journal trades.

This is a contract, fixture, and pure-helper gate. It does not add durable link
storage, migrations, route handlers, production UI wiring, LevelEngine changes,
or levels-system changes.

## Dependencies

This gate depends on the completed journal-side gates:

- `journal_level_analysis_delivery_ingestion`
- `journal_level_analysis_delivery_persistence_or_api_design`
- `journal_level_analysis_delivery_persistence_contract`
- `journal_level_analysis_delivery_persistence_implementation`
- `journal_level_analysis_delivery_persistence_to_journal_linking_design`

The delivery persistence layer remains responsible for preserving the raw
source payload. Trade-link records only keep compact linked symbol facts and the
delivery `rawPayloadHash`.

## Persisted Link Contract

`JournalLevelAnalysisTradeLinkRecord` attaches one saved trade to one accepted
delivery symbol summary.

Required fields:

- `contractVersion`
- `id`
- `createdAt`
- `updatedAt`
- `workspaceId`
- `accountId`
- `userId`
- `savedTradeId`
- `importBatchId` when available
- `symbol`
- `provider`
- `linkStatus`
- `linkSource`
- `deliveryId`
- `rawPayloadHash`
- `sourceKind`
- `deliveryGeneratedAt` when available
- `symbolSummaryAsOfTimestamp`
- `symbolSummaryAsOfIso` when available
- `matchPolicy`
- `matchResult`
- `linkedSymbolSummary`
- `limitations`
- `safetyFlags`
- `auditTrail`

Linked records require:

- `linkStatus: "linked"`
- `matchResult.status: "matched"`
- `matchResult.reason: "symbol_provider_asof_match"`
- a non-null `linkedSymbolSummary`
- accepted delivery source only
- exact uppercase symbol match
- provider match
- package delivery 15m status of `context_only`

Blocked or unlinked records require:

- `matchResult.status: "blocked"` or `"not_found"`
- `linkedSymbolSummary: null`
- no trusted compact facts attached to the trade

## Match Policy

Default policy:

```json
{
  "policyVersion": "journal_level_analysis_trade_link_match_policy_v1",
  "symbolMatch": "exact_uppercase",
  "providerMatch": "account_allowed_provider",
  "asOfPolicy": "latest_before_or_equal_trade_end",
  "allowSameDayAfterTradeEnd": false,
  "allowFutureAsOfForHistoricalTrade": false,
  "requireAcceptedDelivery": true,
  "requireContextOnly15m": true
}
```

Future implementation may allow explicit review-time or manual delivery
selection policies, but it must keep `allowFutureAsOfForHistoricalTrade: false`
unless a separate product gate defines a visible explicit override.

## Match Result

Supported statuses:

- `matched`
- `blocked`
- `not_found`

Supported reasons:

- `symbol_provider_asof_match`
- `no_accepted_symbol_summary`
- `as_of_after_allowed_boundary`
- `provider_not_allowed`
- `trade_timestamp_missing`
- `delivery_quarantined`
- `fifteen_minute_not_context_only`

Blocked and not-found results can be represented for audit, but they must not
attach trusted level facts to the trade.

## Linked Symbol Summary

The linked summary is an immutable compact copy of
`JournalLevelAnalysisDeliverySymbolSummary`.

It includes facts-only fields:

- symbol and provider
- as-of timestamp / ISO
- reference price
- nearest support and resistance
- bucket counts
- extension counts
- diagnostics
- density metric summary when present
- candidate inventory gap summary when present
- volume/session context summary when present
- source file metadata when present
- cache/source-integrity summary when present
- 15m context-only status
- missing facts and limitations
- safety flags

It does not include the raw source payload.

## API Response Contracts

The contract fixtures define future response shapes for:

- resolving a trade link candidate
- persisting a trade link
- returning an idempotent duplicate link match
- returning a blocked candidate
- reading a trade-level linked summary
- reading admin/debug link metadata

This gate does not add route handlers. Future route implementation should remain
feature-gated and use these fixture shapes as the contract.

## Idempotency

A duplicate link is a contract match when the existing and incoming link share:

- `savedTradeId`
- `deliveryId`
- normalized `symbol`
- `provider`

Future persistence can use this to return an idempotent success instead of
creating duplicate active links.

## Quarantine Rules

Trade-link creation must reject:

- quarantined delivery records
- symbol summaries that do not belong to the accepted delivery record
- inconsistent delivery/provider metadata
- packaged review delivery summaries where 15m is not `context_only`
- records that copy `rawPayload`
- records that include journal-owned evaluation fields

Blocked attempts may be represented, but they cannot include trusted linked
symbol facts.

## Compatibility Rules

- Old `LevelAnalysisSnapshot` v1 delivery summaries remain linkable.
- Current packaged review delivery summaries remain linkable.
- Raw source payload preservation remains required on delivery records.
- Trade-link records must not copy raw source payloads.
- Unknown additive source fields remain owned by the delivery ingestion and
  persistence layers.
- Link records preserve compact facts for historical review stability.

## Safety Boundaries

- Never turn level facts into trade recommendations.
- No buy/sell/hold language.
- No coaching, grading, P/L, giveback, or behavior-scoring fields.
- Do not infer user execution quality from level facts.
- Treat 15m as context-only.
- Do not link quarantined deliveries.
- Do not expose raw payloads in user-facing trade routes.
- Do not wire production UI until link persistence and API implementation are
  separately gated.

## Fixture List

Contract fixtures live under
`src/lib/level-analysis/__fixtures__/trade-link-contract/`:

- `trade-link-record.linked.compact.json`
- `trade-link-record.old-snapshot.compact.json`
- `trade-link-record.blocked.compact.json`
- `api-responses.compact.json`

The fixtures are compact and facts-only. They reference delivery IDs and
payload hashes from existing delivery persistence fixtures.

## Test Plan

Current focused tests cover:

- linked packaged delivery fixture validation
- old single-snapshot v1 fixture validation
- blocked attempt fixture validation
- helper-created links from accepted packaged deliveries
- helper-created links from old v1 deliveries
- quarantined delivery rejection
- 15m context-only enforcement
- raw payload separation
- duplicate link idempotency expectations
- API response fixture shape
- absence of advice/coaching/grading/P/L/giveback/behavior fields and wording

Future implementation tests should add repository and route coverage once
durable trade-link storage exists.

## Recommended Next Gate

`journal_level_analysis_delivery_journal_linking_persistence_implementation`

Reason: the link contract is now locked with fixtures and pure validation
helpers, so the next step is implementing durable trade-link storage and
feature-gated APIs against this contract.
