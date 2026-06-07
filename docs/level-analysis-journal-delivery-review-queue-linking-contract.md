# Level Analysis Delivery Review Queue Linking Contract

## Purpose

Gate `journal_level_analysis_delivery_review_queue_linking_contract` locks the
facts-only availability contract for showing persisted level-analysis trade
links in saved review queues and trade-detail workflows.

This is a contract, fixture, and pure-helper gate. It does not add production
UI wiring, route handlers, storage migrations, resolver behavior, LevelEngine
changes, or levels-system changes.

## Dependencies

This gate depends on:

- `journal_level_analysis_delivery_review_queue_linking_design`
- `journal_level_analysis_delivery_journal_linking_persistence_implementation`
- the existing saved review queue read model in
  `src/lib/trader-analytics/server/saved-review-queue.ts`

The contract lives in:

`src/lib/level-analysis/level-analysis-review-queue-linking-contract.ts`

## Contract Version

`journal_level_analysis_review_queue_linking_v1`

## Availability States

Supported queue availability states:

- `attached`
- `available_to_attach`
- `blocked_by_as_of_policy`
- `unavailable_for_symbol_provider`
- `quarantined_or_unsafe`
- `not_checked`
- `feature_disabled`

These states are factual availability labels only. They must not change review
queue priority, score, grade, coaching, P/L interpretation, or trade behavior
classification.

## State Shape

`SavedReviewQueueLevelFactsState` includes:

- `contractVersion`
- `availability`
- `label`
- `detail`
- `scopeLabel`
- `nextAction`
- optional link metadata: `linkId`, `deliveryId`, `rawPayloadHash`
- optional source metadata: `sourceKind`, `provider`, `symbol`
- optional as-of metadata: `asOfIso`, `asOfTimestamp`
- optional `fifteenMinuteContextOnlyStatus`
- `limitationCount`
- compact `limitations`

The state must not include:

- raw source payloads
- linked symbol summary blobs
- priority scores
- journal-owned evaluation fields
- recommendations or trade advice

## Batch Read Model

`SavedReviewQueueLevelFactsReadModel` includes:

- `contractVersion`
- `source: "level_analysis_trade_links"`
- `featureEnabled`
- `statesByTradeId`
- `counts`

Helper:

```ts
buildSavedReviewQueueLevelFactsReadModel({
  tradeIds,
  linksByTradeId,
  featureEnabled,
})
```

This helper is deterministic and does not read storage. Future implementation
can wire it to a repository batch method.

## Classification Rules

The pure helper classifies trade links as:

- linked record with compact facts: `attached`
- blocked record with `as_of_after_allowed_boundary`:
  `blocked_by_as_of_policy`
- blocked record with `delivery_quarantined` or
  `fifteen_minute_not_context_only`: `quarantined_or_unsafe`
- blocked/not-found record with `no_accepted_symbol_summary`:
  `unavailable_for_symbol_provider`
- missing link: `not_checked`
- feature flag disabled: `feature_disabled`

Old `LevelAnalysisSnapshot` v1 links remain valid and may carry
`fifteenMinuteContextOnlyStatus: "not_supplied"`.

Packaged review delivery links require
`fifteenMinuteContextOnlyStatus: "context_only"` when attached.

## Fixture List

Fixtures live under:

`src/lib/level-analysis/__fixtures__/review-queue-linking-contract/`

Fixtures:

- `level-facts-state.attached.compact.json`
- `level-facts-state.old-snapshot-attached.compact.json`
- `level-facts-state.blocked-asof.compact.json`
- `level-facts-state.unavailable.compact.json`
- `level-facts-state.feature-disabled.compact.json`
- `queue-level-facts-read-model.compact.json`

All fixtures are compact and facts-only.

## Safety Boundaries

- Preserve old `LevelAnalysisSnapshot` v1 compatibility.
- Preserve current packaged review delivery compatibility.
- Preserve raw source payload only on delivery records.
- Do not expose raw payloads in user-facing queue or trade-detail state.
- Do not auto-attach links during queue reads.
- Do not change review priority from level-facts availability.
- Treat 15m as context-only.
- Do not link quarantined or unsafe deliveries.
- Do not infer execution quality from level facts.
- Do not add recommendation, trade advice, coaching, grading, P/L, giveback, or
  behavior-scoring behavior.

## Test Coverage

Focused tests cover:

- fixture validation
- attached packaged delivery classification
- old v1 attached classification
- blocked as-of classification
- unavailable, feature-disabled, and available-to-attach states
- deterministic batch read-model counts
- feature-disabled batch behavior
- malformed state rejection
- raw payload exclusion
- no recommendation/coaching/grading/P/L/giveback/behavior/priority wording

## Recommended Next Gate

`journal_level_analysis_delivery_review_queue_linking_read_model_implementation`

Reason: the availability contract is now locked. The next step is to implement
a server-side batch read model that joins saved review queue items to persisted
trade-link records behind a display feature flag, still without production UI
wiring.
