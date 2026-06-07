# Level Analysis Delivery Trade Detail Level Facts Read Model Contract

## Purpose

Gate `journal_level_analysis_delivery_trade_detail_level_facts_read_model_contract`
locks the facts-only trade-detail read-model contract for persisted
level-analysis trade links.

This is a contract, fixture, and pure-helper gate. It does not add production
UI wiring, route handlers, storage migrations, resolver behavior, LevelEngine
changes, or levels-system changes.

## Dependencies

This gate depends on:

- `journal_level_analysis_delivery_trade_detail_level_facts_read_model_design`
- `journal_level_analysis_delivery_review_queue_linking_read_model_implementation`
- persisted `JournalLevelAnalysisTradeLinkRecord` rows
- existing queue availability state from
  `src/lib/level-analysis/level-analysis-review-queue-linking-contract.ts`

The contract lives in:

`src/lib/level-analysis/level-analysis-trade-detail-level-facts-contract.ts`

## Contract Version

`trade_detail_level_facts_read_model_v1`

## Read Model Shape

`TradeDetailLevelFactsReadModel` includes:

- `contractVersion`
- `savedTradeId`
- `featureEnabled`
- `availability`
- `display`
- optional `attachedFacts`
- optional `blockedFacts`
- `limitations`

The `availability` field reuses the factual
`SavedReviewQueueLevelFactsState` contract. This keeps queue and trade-detail
availability labels consistent.

## Attached Facts

`TradeDetailAttachedLevelFacts` is present only when a trusted linked trade-link
record exists and the feature is enabled.

It includes compact factual fields:

- link, delivery, hash, source-kind, provider, symbol, and as-of metadata
- reference price and previous close when present
- nearest support/resistance
- bucket counts and extension counts
- extension coverage and synthetic continuation summary
- diagnostics and diagnostic semantics
- density metric summary
- candidate inventory gap summary
- volume/session context summary
- source files
- cache fingerprint/source-integrity summary
- 15m context-only status
- missing facts, limitations, and safety flags

It does not include raw source payloads, audit trails, match policy internals,
route state, or journal-owned evaluation fields.

## Blocked Facts

`TradeDetailBlockedLevelFacts` is present only for blocked or unavailable
trade-link states.

It includes compact factual fields:

- link, delivery, hash, source-kind, provider, symbol, and as-of metadata when
  available
- match reason
- checked-at timestamp

It does not include `linkedSymbolSummary` or trusted attached facts.

## Builder

Pure helper:

```ts
buildTradeDetailLevelFactsReadModel({
  savedTradeId,
  featureEnabled,
  link,
})
```

Behavior:

- feature disabled -> `feature_disabled`, no attached or blocked facts
- no link -> `not_checked`, no attached or blocked facts
- linked packaged delivery -> attached facts with `context_only` 15m status
- linked old `LevelAnalysisSnapshot` v1 -> attached facts with
  `not_supplied` 15m status
- blocked link -> blocked facts only

The helper does not read storage, call routes, auto-resolve links, or mutate
source records.

## Validation

Validator:

```ts
validateTradeDetailLevelFactsReadModel(payload)
```

Validation rejects:

- unsupported contract version
- malformed availability state
- raw payload copies
- journal-owned evaluation fields
- attached facts on unattached states
- blocked facts on attached states
- attached packaged delivery facts where 15m is not `context_only`
- feature-disabled states that include facts

## Fixture List

Fixtures live under:

`src/lib/level-analysis/__fixtures__/trade-detail-level-facts-contract/`

Fixtures:

- `trade-detail-level-facts.attached.compact.json`
- `trade-detail-level-facts.old-snapshot-attached.compact.json`
- `trade-detail-level-facts.blocked-asof.compact.json`
- `trade-detail-level-facts.not-checked.compact.json`
- `trade-detail-level-facts.feature-disabled.compact.json`

All fixtures are compact and facts-only.

## Safety Boundaries

- Preserve old `LevelAnalysisSnapshot` v1 compatibility.
- Preserve packaged review delivery compatibility.
- Preserve raw source payload only on delivery records.
- Do not expose raw payloads through trade detail state.
- Do not auto-resolve or auto-persist links during trade detail reads.
- Do not change grade, score, coaching, review checklist status, P/L, giveback,
  behavior scoring, or review priority.
- Treat 15m as context-only for packaged delivery facts.
- Do not infer whether the trader should have used a level differently.
- Do not add buy/sell/hold, recommendation, or trade-advice wording.

## Test Coverage

Focused tests cover:

- fixture validation
- attached packaged delivery derivation
- old `LevelAnalysisSnapshot` v1 derivation
- blocked as-of derivation
- not-checked and feature-disabled states
- raw payload rejection
- prohibited journal-owned field rejection
- packaged 15m context-only enforcement
- no recommendation/coaching/grading/P/L/giveback/behavior/priority wording

## Recommended Next Gate

`journal_level_analysis_delivery_trade_detail_level_facts_route_implementation`

Reason: the read-model contract and fixtures are now locked. The next step is
to add a feature-gated `/api/trades/[tradeId]/level-analysis/facts` route and
server read helper against this contract, still without production UI wiring.
