# Level Analysis Delivery Review Queue Linking Design

## Purpose

Gate `journal_level_analysis_delivery_review_queue_linking_design` defines how
persisted level-analysis trade links should surface in saved review queues and
trade-detail workflows.

This is a design gate. It does not add production UI wiring, route handlers,
migrations, resolver behavior, LevelEngine changes, or levels-system changes.

## Current State

Completed journal-side gates now provide:

- source-preserving ingestion for old `LevelAnalysisSnapshot` v1 and current
  packaged review delivery payloads
- durable delivery persistence
- feature-gated delivery APIs
- durable trade-link persistence
- feature-gated trade-link resolve, persist, trade read, and admin/debug APIs

The existing saved review queue read model lives in
`src/lib/trader-analytics/server/saved-review-queue.ts`.

Current queue items already track:

- saved trade ID, import batch ID, symbol, status, lane, and priority
- chart review snapshot availability
- chart diagnostics / technical follow-up
- review status and notes count
- queue copy for chart evidence, missing chart data, queued work, open trades,
  and analysis failures

Trade detail already has a "What This Review Can Use" evidence boundary that
separates chart evidence from execution-only fallback. Level facts should join
that evidence boundary as factual availability metadata, not as scoring or
coaching input.

## Design Options

### A. Read Link Status Directly In The Review Queue

The review queue builder checks `GET /api/trades/[tradeId]/level-analysis` or a
server-side repository read and adds level-facts availability to each queue item.

Complexity: low to medium.

Auditability: good when linked records already exist.

Risk: can accidentally create N+1 route/database reads if done naively.

Recommendation: acceptable only through a batch repository helper or route-level
server helper, not per-card client fetches.

### B. Add A Dedicated Review Queue Level-Facts Read Model

Build a compact read model that batches trade IDs and returns level-facts
availability for all queue items.

Complexity: medium.

Auditability: strong because the queue can show attached/blocked/unavailable
states without mutating links.

Risk: bounded if the read model stays facts-only.

Recommendation: preferred.

### C. Auto-Resolve Links While Building The Queue

When the review queue loads, automatically resolve and persist missing links for
each queued trade.

Complexity: medium to high.

Auditability: mixed because a read path mutates state.

Risk: higher; queue reads could attach facts without an explicit user/system
action and could surprise historical review behavior.

Recommendation: defer. Use explicit batch/manual attach actions in a later gate.

### D. Trade Detail Only

Show linked level facts only on the individual trade detail page and leave the
review queue unchanged.

Complexity: low.

Auditability: good on the trade page.

Risk: weak workflow visibility; the queue cannot tell which trades have level
facts ready or blocked.

Recommendation: useful as a first UI slice after queue contract work, but not
the complete queue design.

## Recommended Path

Use a dedicated review queue level-facts read model.

The read model should batch saved trade IDs from the existing queue and join
against persisted `JournalLevelAnalysisTradeLinkRecord` rows. It should expose
only compact availability metadata and linked facts needed for labels,
badges, counts, and drill-down links.

It should not auto-resolve or auto-persist links during a normal queue read.
Automatic attachment can be introduced later as a separate explicit action with
clear audit entries.

## Proposed Queue Availability Contract

Future type:

```ts
type ReviewQueueLevelFactsAvailability =
  | "attached"
  | "available_to_attach"
  | "blocked_by_as_of_policy"
  | "unavailable_for_symbol_provider"
  | "quarantined_or_unsafe"
  | "not_checked"
  | "feature_disabled";

interface SavedReviewQueueLevelFactsState {
  availability: ReviewQueueLevelFactsAvailability;
  label: string;
  detail: string;
  scopeLabel: string;
  nextAction: string;
  linkId?: string;
  deliveryId?: string;
  rawPayloadHash?: string;
  sourceKind?: "single_snapshot_v1" | "packaged_review_delivery";
  provider?: string;
  symbol?: string;
  asOfIso?: string;
  asOfTimestamp?: number;
  fifteenMinuteContextOnlyStatus?: string;
  limitationCount: number;
  limitations: Array<{ code: string; field?: string; message: string }>;
}
```

Future `SavedReviewQueueItem` addition:

```ts
levelFacts: SavedReviewQueueLevelFactsState;
```

Default state when the feature flag is off:

```json
{
  "availability": "feature_disabled",
  "label": "Level facts not shown",
  "detail": "Level facts are available only when the journal level-analysis trade-link feature is enabled.",
  "scopeLabel": "execution and chart review only",
  "nextAction": "Use the existing review queue.",
  "limitationCount": 0,
  "limitations": []
}
```

## Queue Copy Rules

Allowed factual labels:

- `Level facts attached`
- `Level facts available`
- `Level facts blocked by as-of policy`
- `Level facts unavailable`
- `Level facts quarantined`
- `Level facts not checked`

Allowed detail should describe only source state:

- selected delivery ID
- provider
- symbol
- as-of timestamp
- 15m context-only status
- missing facts / limitations count
- whether the existing link is attached, blocked, or unavailable

Disallowed copy:

- trade recommendations
- buy/sell/hold language
- coaching or grading
- P/L interpretation
- giveback analysis
- behavior scoring
- execution-quality inference
- language that says the trade was good, bad, right, wrong, early, late, or
  should have used the levels differently

## Review Queue Integration

Future implementation should add level facts as a supplemental evidence line in
the existing queue card technical details.

Recommended placement:

- queue summary counts: optional small counts for attached, blocked, and
  unavailable level facts
- queue card collapsed view: no new priority or headline by default
- queue card advanced details: a level-facts state tile
- trade detail link: keep the existing trade detail URL and let the trade page
  show the linked facts

Do not let level-facts availability change `priorityScore` in the first UI
integration. Availability can be a filter later, but it should not outrank chart
or technical-review states until product behavior is separately calibrated.

## Trade Detail Integration

Future trade detail should show level facts in the existing evidence boundary:

- "What This Review Can Use"
- "Supporting Evidence"
- advanced evidence details

Recommended card fields:

- availability label
- symbol / provider
- as-of timestamp
- nearest support / resistance
- density classification when present
- candidate inventory summary when present
- volume/session summary when present
- source-kind label
- limitations

The card must remain factual and should link to admin/debug only for users with
debug access. User-facing trade routes must not include raw source payloads.

## Batch Read Model

Future helper:

```ts
buildSavedReviewQueueLevelFactsReadModel({
  tradeIds,
  repository,
  featureEnabled,
}): Map<string, SavedReviewQueueLevelFactsState>
```

Repository needs:

- latest trade link by saved trade ID for many trade IDs
- counts by availability for queue summary
- no raw payload reads

The helper should classify:

- linked record with compact summary: `attached`
- blocked record with reason `as_of_after_allowed_boundary`:
  `blocked_by_as_of_policy`
- blocked record with reason `delivery_quarantined` or
  `fifteen_minute_not_context_only`: `quarantined_or_unsafe`
- no link: `not_checked` unless resolver preview is explicitly requested
- resolver preview not found: `unavailable_for_symbol_provider`
- feature flag off: `feature_disabled`

## API Use

Existing APIs are enough for trade-level reads:

- `GET /api/trades/[tradeId]/level-analysis`
- `POST /api/level-analysis/trade-links/resolve`
- `POST /api/level-analysis/trade-links`

Future queue APIs should not call per-trade route handlers. They should use a
server-side read model and repository batch methods.

Possible future API:

- `GET /api/level-analysis/trade-links/queue-status?importBatchId=...`

This should return compact state by `savedTradeId`, not raw payloads.

## Feature Flags

Initial UI/read-model integration should require:

- `LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED=1` for route access
- a new display/read-model flag such as
  `LEVEL_ANALYSIS_JOURNAL_REVIEW_QUEUE_LEVEL_FACTS_ENABLED=1`

The display flag keeps production review queues stable while the link
availability read model is tested.

## Safety Boundaries

- Preserve old `LevelAnalysisSnapshot` v1 compatibility.
- Preserve current packaged review delivery compatibility.
- Preserve raw source payload only on delivery records.
- Never expose raw payloads through user-facing queue or trade-detail UI.
- Do not auto-attach links during queue reads.
- Do not let level facts change grade, score, coaching, or review priority in
  the first integration.
- Treat 15m as context-only.
- Do not link quarantined or unsafe deliveries.
- Do not infer execution quality from level facts.
- Do not add recommendation, trade advice, coaching, grading, P/L, giveback, or
  behavior-scoring behavior.

## Migration Considerations

No migration is required in this design gate.

Future implementation may add:

- a batch read method on `SqliteJournalLevelAnalysisTradeLinkRepository`
- a queue-level read model helper
- focused tests for availability classification
- feature-gated UI read-model integration

The existing `journal_level_analysis_trade_links` table already stores the
fields needed for linked and blocked availability states.

## Future Test Plan

Next contract/implementation gates should test:

- queue item with attached level facts
- queue item blocked by as-of policy
- queue item unavailable for symbol/provider
- queue item with quarantined/unsafe candidate
- old v1 linked facts in queue state
- packaged delivery linked facts with `context_only` 15m state
- feature flag off state
- batch read avoids raw payloads
- availability does not affect priority score
- no advice/coaching/grading/P/L/giveback/behavior wording

## Recommended Next Gate

`journal_level_analysis_delivery_review_queue_linking_contract`

Reason: lock the queue/trade-detail level-facts availability read model and
fixtures before wiring any production review queue or trade-detail UI.
