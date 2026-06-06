# Level Analysis Delivery Journal Linking Persistence Implementation

## Purpose

Gate `journal_level_analysis_delivery_journal_linking_persistence_implementation`
implements durable storage and feature-gated APIs for attaching accepted
levels-system delivery symbol facts to saved journal trades.

This gate implements the contract from
`docs/level-analysis-journal-delivery-journal-linking-contract.md`.

It does not wire production UI, does not change LevelEngine behavior, does not
modify the levels-system repo, and does not turn level facts into trade advice.

## Implemented Boundary

The journal app can now persist `JournalLevelAnalysisTradeLinkRecord` records
that attach one saved trade to one accepted delivery symbol summary.

Storage keeps:

- trade/workspace/account/user identifiers
- delivery ID and `rawPayloadHash`
- source kind and delivery generated time
- selected symbol as-of timestamp / ISO
- match policy and match result
- compact linked symbol summary for linked records
- limitations, safety flags, and audit trail

Raw source payloads remain preserved only on
`JournalLevelAnalysisDeliveryRecord`; trade-link records do not copy raw
payloads.

## Storage

New module:

`src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage.ts`

Table:

- `journal_level_analysis_trade_links`

Migration marker:

- `005_level_analysis_trade_link_persistence`

Indexes:

- idempotency by saved trade, delivery, provider, and symbol
- latest lookup by saved trade
- delivery lookup
- active linked lookup by saved trade/provider/symbol

Idempotency is keyed by:

- `savedTradeId`
- `deliveryId`
- normalized `symbol`
- `provider`

Saving the same link intent returns the existing record with
`status: "duplicate"`.

## Resolver

New module:

`src/lib/level-analysis/level-analysis-journal-delivery-trade-link-api-service.ts`

The resolver:

1. normalizes the symbol
2. applies the configured match policy
3. requires a trade end/as-of boundary for
   `latest_before_or_equal_trade_end`
4. searches accepted symbol summaries at or before the boundary
5. blocks candidates after the boundary
6. blocks quarantined delivery records
7. enforces context-only 15m status for packaged review deliveries
8. returns facts-only matched, blocked, or not-found responses

Old `LevelAnalysisSnapshot` v1 summaries remain linkable. Their 15m status can
be `not_supplied`.

## API

The API is feature-gated by:

- `LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED=1`
- `LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_ADMIN_DEBUG_ENABLED=1` for admin/debug link
  reads

Routes:

- `POST /api/level-analysis/trade-links/resolve`
- `POST /api/level-analysis/trade-links`
- `GET /api/trades/[tradeId]/level-analysis`
- `GET /api/admin/level-analysis/trade-links/[linkId]`

The route handlers are `nodejs` runtime and `force-dynamic`, matching the
existing delivery API implementation.

## Request Shape

Resolve or persist requests accept:

```json
{
  "savedTradeId": "trade_DEVS_2026_06_01_001",
  "workspaceId": "local-demo-workspace",
  "accountId": "local-demo-account",
  "userId": "local-demo-user",
  "importBatchId": "import_batch_2026_06_01_001",
  "symbol": "DEVS",
  "provider": "ibkr",
  "deliveryId": "optional_manual_selection",
  "tradeEndedAt": "2026-06-01T16:05:00.000Z",
  "asOfBoundaryTimestamp": 1780329900000,
  "matchPolicy": {
    "asOfPolicy": "latest_before_or_equal_trade_end"
  }
}
```

When `deliveryId` is supplied, the persist route uses manual delivery selection
after validating that the delivery is accepted and the symbol summary belongs to
that delivery.

## Safety Boundaries

The implementation stays facts-only:

- no recommendations
- no buy/sell/hold decisions
- no coaching
- no grading
- no P/L
- no giveback analysis
- no behavior scoring
- no execution-quality inference
- 15m data remains context-only
- quarantined deliveries cannot create linked facts
- raw source payloads are not exposed on trade-level routes

## Verification Plan

Implemented tests cover:

- SQLite linked record persistence
- duplicate trade-link idempotency
- blocked attempt persistence without trusted linked facts
- old `LevelAnalysisSnapshot` v1 link persistence
- malformed link rejection
- route-level resolve, persist, duplicate, trade read, and admin read behavior
- blocked as-of candidate responses
- feature flag blocking
- raw payload exclusion from trade-link responses
- facts-only wording boundaries

Recommended validation commands:

- `npm install`
- `npx vitest run src/lib/level-analysis/__tests__`
- `npx tsc --noEmit --pretty false`
- focused ESLint for touched files
- `git diff --check`
- `git diff --cached --check`

## Recommended Next Gate

`journal_level_analysis_delivery_review_queue_linking_design`

Reason: durable trade-link storage and feature-gated APIs now exist. The next
decision is how review queues or trade detail workflows should surface factual
link availability without adding scoring, coaching, trade advice, or production
UI coupling prematurely.
