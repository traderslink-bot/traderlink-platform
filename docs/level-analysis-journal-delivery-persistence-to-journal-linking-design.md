# Level Analysis Delivery To Journal Linking Design

## Purpose

Gate `journal_level_analysis_delivery_persistence_to_journal_linking_design`
defines how accepted levels-system delivery facts should link to journal trades,
accounts, and review workflows after durable ingestion exists.

This is a design gate. It does not add production UI, durable link tables, route
handlers, LevelEngine changes, or levels-system changes.

## Current State

Completed journal-side gates:

- `journal_level_analysis_delivery_ingestion`
- `journal_level_analysis_delivery_persistence_or_api_design`
- `journal_level_analysis_delivery_persistence_contract`
- `journal_level_analysis_delivery_persistence_implementation`

The journal app can now:

- ingest old `LevelAnalysisSnapshot` v1 payloads
- ingest current packaged review delivery payloads with `entries[]`
- preserve raw source payloads
- persist accepted and quarantined delivery records
- persist accepted per-symbol summaries
- retrieve latest delivery and latest symbol facts through feature-gated APIs

Current saved trade data is account/user scoped. Saved trades have:

- `id`
- `userId`
- `accountId`
- `importBatchId`
- `symbol`
- `sessionDate`
- execution-analysis request data
- review status and notes

The level-analysis delivery tables are currently source/delivery scoped, not
trade scoped. They intentionally do not infer whether a level fact was relevant
to a specific execution.

## Design Options

### A. Runtime Symbol Lookup Only

When a trade detail or review workflow needs level facts, query the latest
accepted symbol summary by `symbol` and `provider`.

Complexity: low.

Auditability: weak for historical review because the attached facts can drift
as new deliveries arrive.

Queryability: good for latest symbol facts, weak for trade-specific history.

Risk: high risk of accidentally showing facts generated after the trade context
unless every caller applies an as-of rule.

Recommendation: not sufficient as the durable journal link model.

### B. Explicit Trade-To-Delivery Link Records

Create a separate link table that stores which accepted delivery symbol summary
was attached to a saved trade, with match metadata, as-of policy, limitations,
and an immutable snapshot of the compact linked summary.

Complexity: medium.

Auditability: strong because a trade review can always show which delivery and
symbol summary were attached at review time.

Queryability: strong for trade detail, review queues, and audit reports.

Risk: bounded if the link resolver is explicit and facts-only.

Recommendation: preferred.

### C. Import-Batch Level Attachment

Attach one delivery package to an import batch and then let trades in that batch
resolve symbol summaries from that package.

Complexity: medium.

Auditability: good for batch workflows, weaker for trades whose best facts come
from a later accepted delivery.

Queryability: good by import batch, less direct by trade.

Risk: can overattach symbols if the package includes symbols unrelated to a
saved trade.

Recommendation: useful as an optional batch source hint, not the primary link.

### D. Workspace/Account Symbol Cache

Maintain a scoped latest symbol-facts cache per workspace/account/provider.

Complexity: medium to high.

Auditability: weak unless combined with explicit trade links.

Queryability: strong for dashboards and readiness badges.

Risk: cache invalidation and historical as-of rules can become implicit.

Recommendation: defer until trade links are locked.

## Recommended Path

Use explicit trade-to-delivery link records.

The journal app should create immutable links from saved trades to accepted
delivery symbol summaries only after a resolver confirms:

- the delivery is accepted
- the symbol matches exactly after normalization
- the provider is allowed for the account/workspace
- the summary as-of timestamp satisfies the selected policy
- 15m status remains context-only or explicitly marked as not supplied for old
  v1 snapshots
- the linked summary is facts-only and contains no trusted quarantine data

The link should preserve enough compact facts to render/replay the attached
state even if future source deliveries add fields or the symbol summary contract
evolves.

## Proposed Link Record

```ts
interface JournalLevelAnalysisTradeLinkRecord {
  contractVersion: "journal_level_analysis_trade_link_v1";
  id: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  accountId: string;
  userId: string;
  savedTradeId: string;
  importBatchId?: string;
  symbol: string;
  provider: string;
  linkStatus: "linked" | "unlinked" | "blocked";
  linkSource: "manual_review" | "import_batch_hint" | "resolver";
  deliveryId: string;
  rawPayloadHash: string;
  sourceKind: "single_snapshot_v1" | "packaged_review_delivery";
  deliveryGeneratedAt?: string;
  symbolSummaryAsOfTimestamp: number;
  symbolSummaryAsOfIso?: string;
  matchPolicy: JournalLevelAnalysisTradeLinkMatchPolicy;
  matchResult: JournalLevelAnalysisTradeLinkMatchResult;
  linkedSymbolSummary: JournalLevelAnalysisLinkedSymbolSummary;
  limitations: JournalLevelAnalysisTradeLinkLimitation[];
  safetyFlags: unknown;
  auditTrail: JournalLevelAnalysisTradeLinkAuditEntry[];
}
```

The linked summary should be a compact immutable copy of the selected
`JournalLevelAnalysisDeliverySymbolSummary`, not a pointer-only read. The raw
source payload remains preserved in `JournalLevelAnalysisDeliveryRecord`.

## Match Policy

```ts
interface JournalLevelAnalysisTradeLinkMatchPolicy {
  policyVersion: "journal_level_analysis_trade_link_match_policy_v1";
  symbolMatch: "exact_uppercase";
  providerMatch: "account_allowed_provider" | "explicit_provider";
  asOfPolicy:
    | "latest_before_or_equal_trade_end"
    | "latest_before_or_equal_review_time"
    | "manual_delivery_selection";
  allowSameDayAfterTradeEnd: boolean;
  allowFutureAsOfForHistoricalTrade: false;
  requireAcceptedDelivery: true;
  requireContextOnly15m: true;
}
```

Default policy for journal trade attachment should be
`latest_before_or_equal_trade_end` when trade end time is known. If trade end
time is not available, the resolver should not silently attach future facts; it
should return a blocked match result requiring an explicit policy decision.

## Match Result

```ts
interface JournalLevelAnalysisTradeLinkMatchResult {
  status: "matched" | "blocked" | "not_found";
  reason:
    | "symbol_provider_asof_match"
    | "no_accepted_symbol_summary"
    | "as_of_after_allowed_boundary"
    | "provider_not_allowed"
    | "trade_timestamp_missing"
    | "delivery_quarantined"
    | "fifteen_minute_not_context_only";
  candidateDeliveryId?: string;
  candidateSummaryAsOfTimestamp?: number;
  checkedAt: string;
}
```

Blocked and not-found results should be persistable as link attempts only if
the product needs an audit trail. They should not create trusted level context
on the trade.

## Linked Symbol Summary

The link stores a compact immutable facts-only view:

- symbol
- provider
- as-of timestamp / ISO
- reference price
- nearest support/resistance
- bucket counts
- extension counts
- diagnostics
- density metric summary
- candidate inventory gap summary
- volume/session context summary
- source files
- cache/source-integrity summary
- 15m context-only status
- missing facts and limitations
- safety flags

It must not store recommendations, trade advice, coaching, grading, P/L,
giveback, behavior scoring, or buy/sell/hold decisions.

## Proposed Storage Shape

Future implementation should add:

```sql
CREATE TABLE journal_level_analysis_trade_links (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  saved_trade_id TEXT NOT NULL,
  import_batch_id TEXT,
  symbol TEXT NOT NULL,
  provider TEXT NOT NULL,
  link_status TEXT NOT NULL,
  link_source TEXT NOT NULL,
  delivery_id TEXT NOT NULL,
  raw_payload_hash TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  delivery_generated_at TEXT,
  symbol_summary_as_of_timestamp INTEGER NOT NULL,
  symbol_summary_as_of_iso TEXT,
  match_policy_json TEXT NOT NULL,
  match_result_json TEXT NOT NULL,
  linked_symbol_summary_json TEXT NOT NULL,
  limitations_json TEXT NOT NULL,
  safety_flags_json TEXT NOT NULL,
  audit_trail_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX journal_level_analysis_trade_links_active_unique
  ON journal_level_analysis_trade_links(saved_trade_id, provider, symbol)
  WHERE link_status = 'linked';

CREATE INDEX journal_level_analysis_trade_links_trade
  ON journal_level_analysis_trade_links(saved_trade_id, created_at DESC);

CREATE INDEX journal_level_analysis_trade_links_delivery
  ON journal_level_analysis_trade_links(delivery_id);
```

The table should live beside the level-analysis delivery tables and reuse the
existing SQLite migration pattern.

## Resolver Contract

Future pure helper:

```ts
resolveJournalLevelAnalysisTradeLinkCandidate({
  trade,
  provider,
  deliveryRepository,
  policy,
  now,
}): JournalLevelAnalysisTradeLinkResolution
```

The resolver should:

1. Normalize the trade symbol and provider.
2. Determine the allowed as-of boundary from the trade lifecycle.
3. Query accepted symbol summaries at or before that boundary.
4. Reject quarantined or unsafe deliveries.
5. Return a factual matched/blocked/not-found result.

Current implementation only supports latest symbol lookup. The next contract
gate should add deterministic fixtures for as-of resolution before code
implements the resolver.

## API Design

Future feature-gated routes:

- `POST /api/level-analysis/trade-links/resolve`
- `POST /api/level-analysis/trade-links`
- `GET /api/trades/[tradeId]/level-analysis`
- `DELETE /api/level-analysis/trade-links/[linkId]`
- `GET /api/admin/level-analysis/trade-links/[linkId]`

### Validate/Resolve Without Persistence

Request:

```json
{
  "savedTradeId": "trade_123",
  "provider": "ibkr",
  "policy": {
    "asOfPolicy": "latest_before_or_equal_trade_end"
  }
}
```

Response:

```json
{
  "contractVersion": "journal_level_analysis_trade_link_resolution_api_v1",
  "status": "matched",
  "savedTradeId": "trade_123",
  "candidate": {
    "deliveryId": "lad_...",
    "symbol": "DEVS",
    "provider": "ibkr",
    "asOfTimestamp": 1780329600000,
    "fifteenMinuteContextOnlyStatus": "context_only"
  },
  "limitations": []
}
```

### Persist Link

Request:

```json
{
  "savedTradeId": "trade_123",
  "deliveryId": "lad_...",
  "symbol": "DEVS",
  "provider": "ibkr",
  "matchPolicy": {
    "asOfPolicy": "manual_delivery_selection"
  }
}
```

Response:

```json
{
  "contractVersion": "journal_level_analysis_trade_link_api_v1",
  "status": "linked",
  "linkId": "jlatl_...",
  "savedTradeId": "trade_123",
  "deliveryId": "lad_...",
  "symbol": "DEVS"
}
```

### Trade Read

`GET /api/trades/[tradeId]/level-analysis` should return only compact linked
facts and limitations. Raw source payload reads remain admin/debug only.

## Review Queue Integration

Do not add production UI in the next implementation step. Once link persistence
is locked, the review queue can display a factual availability state:

- no level facts attached
- level facts attached
- level facts blocked by as-of policy
- level facts unavailable for symbol/provider
- level facts quarantined

These states must not affect trade quality scoring or coaching until a separate
calibrated product gate explicitly defines that behavior.

## Compatibility Rules

- Old `LevelAnalysisSnapshot` v1 remains supported.
- Current packaged review delivery remains supported.
- Link records point to accepted delivery records only.
- Raw source payload stays preserved only on the delivery record.
- Unknown additive source fields remain tolerated by ingestion/persistence.
- Links store compact immutable facts to protect historical journal review.
- Re-linking creates a new audit entry and should preserve prior link history.
- Workspace/account scoping is required before multi-user production use.

## Safety Boundaries

- Never turn levels facts into trade recommendations.
- No buy/sell/hold language.
- No coaching, grading, P/L, giveback, or behavior-scoring fields.
- Do not infer user execution quality from level facts.
- Treat 15m as context-only.
- Do not use quarantined payloads for trade links.
- Do not expose raw payloads in user-facing trade routes.
- Do not wire production UI until the link contract and fixtures are locked.

## Future Test Plan

The next contract gate should add deterministic fixtures for:

- successful trade-to-delivery link
- old v1 snapshot trade link
- symbol not found
- provider mismatch
- delivery after allowed as-of boundary
- missing trade timestamp
- quarantined delivery rejected
- 15m not context-only rejected
- duplicate link idempotency or replacement behavior
- raw payload remains delivery-only
- no advice/coaching/grading/P/L/giveback/behavior-scoring wording

## Recommended Next Gate

`journal_level_analysis_delivery_journal_linking_contract`

Reason: the linking approach should be locked with type contracts and
deterministic fixtures before adding link tables, resolver code, API routes, or
review-queue integration.
