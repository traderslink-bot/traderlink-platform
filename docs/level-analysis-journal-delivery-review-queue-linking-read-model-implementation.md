# Level Analysis Delivery Review Queue Linking Read Model Implementation

## Purpose

Gate `journal_level_analysis_delivery_review_queue_linking_read_model_implementation`
implements the server-side saved review queue read-model join for persisted
level-analysis trade links.

This gate keeps the integration facts-only and feature-gated. It does not add
production UI markup, new route handlers, storage migrations, auto-resolve
behavior, LevelEngine changes, or levels-system changes.

## Implemented Scope

The saved review queue read model now carries compact level-facts availability:

- `SavedReviewQueueReadModel.levelFacts`
- `SavedReviewQueueItem.levelFacts`

The availability state is derived from persisted
`JournalLevelAnalysisTradeLinkRecord` rows through the existing contract in
`src/lib/level-analysis/level-analysis-review-queue-linking-contract.ts`.

The implementation lives in:

- `src/lib/level-analysis/level-analysis-review-queue-linking-read-model.ts`
- `src/lib/level-analysis/level-analysis-journal-delivery-trade-link-storage.ts`
- `src/lib/trader-analytics/server/saved-review-queue.ts`

## Feature Flag

Display/read-model integration is gated by:

`LEVEL_ANALYSIS_JOURNAL_REVIEW_QUEUE_LEVEL_FACTS_ENABLED=1`

When the flag is disabled, each queue item receives the contract's
`feature_disabled` state and the trade-link repository is not read.

## Batch Repository Read

`SqliteJournalLevelAnalysisTradeLinkRepository` now supports:

```ts
getLatestTradeLinksForSavedTrades(
  savedTradeIds: string[],
): Record<string, JournalLevelAnalysisTradeLinkRecord>
```

The method returns the latest stored link per saved trade ID using
`updated_at DESC, id DESC`. It reads compact trade-link records only and does
not read delivery raw payloads.

## Queue Read Model Behavior

The saved review queue builder:

- gathers saved trade IDs from existing decision-review jobs
- builds one batched level-facts read model
- attaches the matching state to each queue item
- preserves the top-level level-facts counts for future API/UI use

It does not:

- auto-resolve missing links
- auto-persist links
- change `priorityScore`, `priorityReason`, filters, lanes, or ordering from
  level-facts availability
- expose raw source payloads

## Compatibility

Both supported source paths remain valid:

- old `LevelAnalysisSnapshot` v1 links surface as `attached` with
  `fifteenMinuteContextOnlyStatus: "not_supplied"`
- packaged review delivery links surface as `attached` only when the persisted
  linked summary is `context_only`

Blocked links keep their factual blocked state, such as
`blocked_by_as_of_policy`, without trusted linked facts.

## Safety Boundaries

- Raw source payloads stay on delivery records only.
- Queue/trade-detail state receives compact availability metadata only.
- 15m remains context-only for packaged delivery facts.
- Quarantined or unsafe candidates do not become attached facts.
- Level facts do not alter review priority, scoring, grading, coaching, P/L,
  giveback, behavior scoring, or trade decisions.
- No buy/sell/hold or trade-advice language is introduced.

## Tests

Focused tests cover:

- display feature flag parsing
- disabled-state behavior without repository reads
- batched availability from persisted trade links
- old `LevelAnalysisSnapshot` v1 batch compatibility
- latest-link selection per saved trade ID
- saved review queue integration without priority changes
- raw payload exclusion and safety wording boundaries

## Recommended Next Gate

`journal_level_analysis_delivery_trade_detail_level_facts_read_model_design`

Reason: the queue read model can now expose factual availability. The next
design step is deciding how trade-detail pages should read and present the
attached compact level facts inside the existing evidence boundary, still behind
a display flag and without raw payload exposure.
