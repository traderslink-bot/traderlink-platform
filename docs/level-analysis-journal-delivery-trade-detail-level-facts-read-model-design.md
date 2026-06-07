# Level Analysis Delivery Trade Detail Level Facts Read Model Design

## Purpose

Gate `journal_level_analysis_delivery_trade_detail_level_facts_read_model_design`
defines how a saved trade detail page should read and present persisted
level-analysis facts after a trade link exists.

This is a design gate. It does not add production UI wiring, route handlers,
storage migrations, resolver behavior, LevelEngine changes, or levels-system
changes.

## Current State

Completed journal-side gates now provide:

- source-preserving ingestion for old `LevelAnalysisSnapshot` v1 payloads and
  packaged review delivery payloads
- durable delivery persistence and feature-gated delivery APIs
- durable trade-link persistence and feature-gated trade-link APIs
- a saved review queue level-facts read model behind
  `LEVEL_ANALYSIS_JOURNAL_REVIEW_QUEUE_LEVEL_FACTS_ENABLED=1`

The trade detail page already has evidence boundary sections:

- `What This Review Can Use`
- `Supporting Evidence`

The existing trade-level API is:

`GET /api/trades/[tradeId]/level-analysis`

That route returns the latest persisted `JournalLevelAnalysisTradeLinkRecord`
when `LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED=1`. The route is useful for
debug and early integration, but a trade-detail display model should not consume
the full persisted link directly because it includes audit, match-policy, and
storage-oriented fields that are not the UI contract.

## Design Options

### A. Render The Existing Trade-Link API Response Directly

The trade page fetches or reads `JournalLevelAnalysisTradeLinkRecord` and maps
fields inline.

Complexity: low.

Auditability: good because the record is complete.

Risk: medium. It exposes storage shape to UI, encourages raw internals in
render code, and makes it easier to leak non-display fields.

Recommendation: do not use as the display boundary.

### B. Add A Dedicated Trade Detail Level-Facts Read Model

Build a compact server-side read model from the latest persisted trade link for
the saved trade.

Complexity: low to medium.

Auditability: strong because the link ID, delivery ID, raw payload hash, and
source kind remain visible without exposing raw payloads.

Risk: bounded if the read model stays facts-only and feature-gated.

Recommendation: preferred.

### C. Reuse The Queue Availability State Only

Show only `SavedReviewQueueLevelFactsState` on the trade detail page.

Complexity: low.

Auditability: moderate.

Risk: weak display value because the trade detail page cannot show nearest
support/resistance, density, inventory gaps, or volume/session context.

Recommendation: use queue availability as the header state, but add compact
detail sections for attached facts.

### D. Defer Trade Detail Until UI Implementation

Leave the API and queue read model as-is and decide the display shape during UI
work.

Complexity: none now.

Auditability: unchanged.

Risk: higher chance that UI work reaches directly into persisted records.

Recommendation: not preferred.

## Recommended Path

Add a dedicated trade detail level-facts read model.

The read model should:

- read the latest persisted trade link for the saved trade
- derive the same factual availability state used by the queue
- include compact linked facts only when `linkStatus === "linked"`
- keep blocked/unavailable states factual and compact
- avoid raw payloads and storage internals
- remain behind a display feature flag until UI copy and placement are reviewed

## Proposed Read Model

Recommended contract name:

`TradeDetailLevelFactsReadModel`

Proposed shape:

```ts
interface TradeDetailLevelFactsReadModel {
  contractVersion: "trade_detail_level_facts_read_model_v1";
  savedTradeId: string;
  featureEnabled: boolean;
  availability: SavedReviewQueueLevelFactsState;
  display: {
    shouldShowFactsPanel: boolean;
    sectionLabel: "level facts";
    evidenceBoundaryLabel: string;
  };
  attachedFacts?: TradeDetailAttachedLevelFacts;
  blockedFacts?: TradeDetailBlockedLevelFacts;
  limitations: Array<{ code: string; field?: string; message: string }>;
}
```

Attached facts:

```ts
interface TradeDetailAttachedLevelFacts {
  linkId: string;
  deliveryId: string;
  rawPayloadHash: string;
  sourceKind: "single_snapshot_v1" | "packaged_review_delivery";
  provider: string;
  symbol: string;
  asOfIso?: string;
  asOfTimestamp: number | null;
  referencePrice: number;
  previousClose?: number;
  nearestSupport?: CompactLevelFact;
  nearestResistance?: CompactLevelFact;
  bucketCounts?: Record<string, number>;
  extensionCounts?: Record<string, number>;
  extensionCoverage?: unknown;
  syntheticContinuationMapSummary?: unknown;
  diagnostics: string[];
  diagnosticSemantics?: unknown;
  densityMetricSummary?: unknown;
  candidateInventoryGapSummary?: unknown;
  volumeSessionContextSummary?: unknown;
  sourceFiles?: Record<string, string>;
  cacheFingerprintSourceIntegrity?: unknown;
  fifteenMinuteContextOnlyStatus: string;
  missingFacts: string[];
  safetyFlags: unknown;
}
```

Blocked facts:

```ts
interface TradeDetailBlockedLevelFacts {
  linkId?: string;
  deliveryId?: string;
  rawPayloadHash?: string;
  sourceKind?: "single_snapshot_v1" | "packaged_review_delivery";
  provider?: string;
  symbol?: string;
  asOfIso?: string;
  asOfTimestamp?: number | null;
  matchReason: string;
  checkedAt?: string;
}
```

Compact levels should carry only factual fields already present in the linked
symbol summary, such as level ID, bucket, price/representative price, zone
bounds, distance, strength label, and `isExtension`.

## API Design

Preferred next API shape:

`GET /api/trades/[tradeId]/level-analysis/facts`

Response:

```json
{
  "contractVersion": "trade_detail_level_facts_read_model_v1",
  "savedTradeId": "trade_DEVS_2026_06_01_001",
  "featureEnabled": true,
  "availability": {
    "availability": "attached",
    "label": "Level facts attached"
  },
  "attachedFacts": {
    "symbol": "DEVS",
    "provider": "ibkr",
    "asOfIso": "2026-06-01T16:00:00.000Z",
    "referencePrice": 0.2705
  }
}
```

The existing `GET /api/trades/[tradeId]/level-analysis` route can remain as a
trade-link route for compatibility. The new `/facts` route should be the
display-oriented route.

Feature flags:

- keep `LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED=1` for trade-link route
  access
- add or reuse a display/read-model flag for trade detail, such as
  `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED=1`

## Trade Detail Placement

Preferred placement:

1. Add the availability state to `What This Review Can Use` as an evidence
   capability line.
2. Add an attached facts panel under `Supporting Evidence` only when facts are
   attached and the display flag is enabled.
3. Show blocked/unavailable state as factual availability metadata, not as a
   review conclusion.

The panel should surface:

- symbol, provider, and as-of timestamp
- nearest support and nearest resistance
- density metric summary when present
- candidate inventory gap summary when present
- volume/session context summary when present
- extension coverage and synthetic continuation summary when present
- source file metadata when present
- cache fingerprint/source-integrity summary when present
- limitations and missing facts
- 15m context-only status

## Safety Boundaries

- Preserve old `LevelAnalysisSnapshot` v1 compatibility.
- Preserve packaged review delivery compatibility.
- Preserve raw source payload only on delivery records.
- Do not expose raw payloads through trade detail UI or user-facing APIs.
- Do not auto-resolve or auto-persist links during trade detail reads.
- Do not change grade, score, coaching, review checklist status, P/L, giveback,
  behavior scoring, or review priority.
- Treat 15m as context-only.
- Do not infer whether the trader should have used a level differently.
- Do not add buy/sell/hold, recommendation, or trade-advice wording.

## Migration Considerations

No database migration is required for the next implementation. The existing
`journal_level_analysis_trade_links` table stores the latest persisted link and
linked symbol summary needed by the compact trade-detail read model.

Future implementation may add:

- a pure `buildTradeDetailLevelFactsReadModel` helper
- compact fixtures for attached, old snapshot, blocked, not found, and feature
  disabled states
- a feature-gated `/facts` route
- trade-detail tests that verify raw payload exclusion and safety wording

## Future Test Plan

Implementation tests should cover:

- feature flag off returns `feature_disabled`
- no link returns `not_checked`
- attached packaged delivery returns compact facts with context-only 15m status
- old `LevelAnalysisSnapshot` v1 returns compact attached facts
- blocked as-of link returns blocked facts without linked summary fields
- raw payload is absent
- cache fingerprint, density, inventory gap, and volume/session summaries are
  surfaced when present
- no grade, coaching, P/L, giveback, behavior scoring, recommendation, or
  trade-advice fields are introduced
- route remains feature-gated

## Recommended Next Gate

`journal_level_analysis_delivery_trade_detail_level_facts_read_model_contract`

Reason: lock the trade-detail read-model contract and compact fixtures before
adding a feature-gated route or any production trade-detail UI wiring.
