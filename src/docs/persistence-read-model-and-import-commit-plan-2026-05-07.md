# Persistence Read Model And Import Commit Plan - 2026-05-07

## Purpose

This is the next implementation bridge from the current dry-run/product
prototype to real saved user data.

The earlier storage docs define the broad schema. This plan narrows the next
coding branch to two things:

- the persisted write model needed for broker CSV imports and saved trades
- the read models needed by `/coach`, `/analytics`, `/trades/[tradeId]`,
  `/review`, and `/import-dry-run` after an import is committed

This plan does not choose a database vendor. The recommended first coding pass
should use a repository interface and an in-memory or file-backed adapter before
locking in Postgres/Supabase/Prisma details.

## Current State

Already implemented and tested:

- broker CSV parsing for supported broker keys and generic mapped CSVs
- dry-run import preview with row repair, mapping, grouping, fees, P/L
  reconciliation, duplicate signals, options quarantine, and anomaly detection
- generated grouped `UserTradeAnalysisRequest` objects
- execution-only feedback preview
- server-side decision-review bridge for completed grouped trades
- evidence-gate states for full daily/4h context, trade-window candles,
  execution-only fallback, market-data unavailable, unsafe candle basis, and
  open-trade skips
- product view models backed by sample/in-memory saved reports and saved trades
- strong synthetic coverage for buy/sell execution safety and coaching evidence

Still missing:

- production auth/user/account boundary
- durable import batches
- durable normalized executions
- durable saved grouped trades
- durable decision-review snapshots and evidence-gate state
- durable analytics report snapshots
- committed-import UI state after the dry-run is confirmed

## Ownership Boundary

Trader Intelligence owns:

- users, workspaces, trading accounts, import batches, import rows, normalized
  executions, saved grouped trades, import repair decisions, duplicate decisions,
  saved reports, review state, rules, notes, and coach summaries

`levels-system` owns:

- candles, candle warehouse, support/resistance, VWAP/EMA, market structure, and
  historical candle hydration

Trader Intelligence can store the result of a completed decision review, but it
must not store raw candle series or reimplement candle/level logic locally.

## Write Model

### Required V1 Tables

Implement these first:

- `workspaces`
- `users`
- `workspace_memberships`
- `trading_accounts`
- `broker_import_batches`
- `broker_import_rows`
- `broker_import_issues`
- `broker_import_repair_items`
- `executions`
- `saved_trades`
- `saved_trade_executions`
- `trade_grouping_diagnostics`
- `execution_feedback_summaries`
- `decision_review_snapshots`
- `decision_review_diagnostics`
- `trader_analytics_reports`

Defer these until after committed imports are stable:

- `rules`
- `rule_evaluations`
- `review_items`
- `trade_notes`
- `report_notes`
- `action_plan_items`
- `journal_prompts`
- `market_context_calibration_runs`
- `market_context_observations`

### New Schema Deltas

The older schema plan includes `trade_analysis_summaries`, but the current app
now needs narrower decision-review persistence too.

Add `decision_review_snapshots`:

- `id`
- `workspace_id`
- `account_id`
- `saved_trade_id`
- `import_batch_id`
- `contract_version`
- `generated_at`
- `market_context_source`
- `trade_window_evidence_source`
- `evidence_gate_status`
- `coaching_headline`
- `fix_first_behavior_id`
- `candle_quality_notes_json`
- `insights_json`
- `summary_json`
- `created_at`

Recommended `evidence_gate_status` values:

- `clear`
- `limited`
- `blocked`
- `pending`

Add `decision_review_diagnostics`:

- `id`
- `workspace_id`
- `account_id`
- `import_batch_id`
- `saved_trade_id`
- `request_index`
- `symbol`
- `code`
- `message`
- `created_at`

Recommended codes:

- `market_context_unavailable`
- `trade_open`
- `analysis_failed`
- `limit_reached`

### Saved Trade Fields To Preserve

Each `saved_trades` row must preserve:

- `trade_fingerprint`
- `symbol`
- `trade_direction`
- `session_date`
- `session_bucket`
- `entry_session_bucket`
- `entry_session_date_et`
- `entry_hour_et`
- `entry_hour_label_et`
- `held_session_buckets_json`
- `held_hour_buckets_et_json`
- `held_premarket_into_open`
- `held_open_into_midday`
- `held_midday_into_postmarket`
- `held_postmarket_into_overnight`
- `held_overnight`
- `lifecycle_status`
- `opened_at`
- `closed_at`
- `gross_realized_pnl`
- `net_pnl_preview`
- `net_pnl_source`
- `pnl_reconciliation_status`
- `pnl_reconciliation_difference`
- `review_status`

This keeps time-of-day intelligence durable and avoids recomputing historical
session buckets differently after future code changes.

## Read Models

### `ImportCommitReadModel`

Used by `/import-dry-run` after a user has a preview ready to save.

Fields:

- import batch status
- commit eligibility
- row counts
- rejected/skipped/accepted counts
- grouped trade counts
- open-position count
- duplicate-file state
- duplicate-trade state
- P/L reconciliation status
- execution anomaly counts
- evidence-gate preview counts
- blocking reasons
- review reasons
- final confirmation copy

### `SavedTradeReadModel`

Used by `/trades/[tradeId]`.

Fields:

- saved trade identity and symbol
- normalized executions in sequence
- gross and net preview values
- session/hour facts
- execution feedback summary
- latest decision-review snapshot
- evidence-gate status
- notes/review state when available
- source import batch link

### `TraderAnalyticsReadModel`

Used by `/analytics`.

Fields:

- latest report snapshot
- source trade IDs
- filtered rows
- time-of-day aggregates
- buy/sell execution aggregates
- evidence-gate aggregate counts
- report limitations
- sample/persistence mode

### `CoachReadModel`

Used by `/coach`.

Fields:

- latest report snapshot
- coach action loop
- coach review queue
- evidence cards
- session prep
- confidence language
- evidence-gate aggregate counts
- persistence mode

### `ReviewReadModel`

Used by `/review`.

Fields:

- review queue
- playbook drafts
- session coach report
- rule drafts
- source trade links
- action-plan items when available

## Import Commit Workflow

### State Machine

Recommended `broker_import_batches.status` values:

- `previewed`
- `needs_repair`
- `ready_to_commit`
- `committing`
- `committed`
- `commit_failed`
- `discarded`
- `superseded`

### Commit Preconditions

The app can commit only when:

- accepted execution count is greater than zero
- rejected row count is zero, or rejected rows are explicitly skipped/dismissed
- required column mapping is complete
- broker/account timezone is resolved
- duplicate file warning has been acknowledged or blocked by policy
- duplicate trade warnings are resolved as skip, replace, or keep separate
- open positions are acknowledged as open and excluded from completed-trade
  decision review
- P/L reconciliation warnings are acknowledged
- options quarantine decisions are resolved

### Commit Transaction

The commit should be one database transaction:

1. Lock or create `broker_import_batches` by `(account_id, file_fingerprint)`.
2. Re-parse the submitted CSV or load the stored preview payload.
3. Validate the preview fingerprint matches the confirmed preview.
4. Insert/update `broker_import_rows`.
5. Insert `broker_import_issues` and `broker_import_repair_items`.
6. Insert normalized `executions`.
7. Insert `saved_trades`.
8. Insert `saved_trade_executions`.
9. Insert `trade_grouping_diagnostics`.
10. Insert `execution_feedback_summaries` for grouped trades where available.
11. Queue decision-review jobs for completed saved trades.
12. Mark the batch `committed`.

If any write fails, the transaction rolls back and the batch becomes
`commit_failed` with a safe diagnostic message.

### Duplicate Handling

File duplicate:

- same `(account_id, file_fingerprint)`
- default action: block exact same file unless user chooses a new import batch
  policy later

Trade duplicate:

- same `(account_id, trade_fingerprint)`
- default action: skip duplicate trade
- future actions: replace, merge, keep separate

Row duplicate:

- same symbol, timestamp, side, shares, and price inside one batch
- default action: keep in preview but mark `duplicate_like_fill` as review
- commit allowed only after acknowledgement

### Rollback And Delete

V1 should support:

- discard preview before commit
- soft-delete committed import batch
- soft-delete saved trades created by that import
- keep a tombstone for duplicate prevention unless account deletion requires
  full removal

Do not expose raw exports as the rollback mechanism.

## API/Repository Boundary

Start with repository interfaces instead of binding UI directly to a database.

Suggested interfaces:

```ts
interface ImportCommitRepository {
  createPreviewBatch(input: CreatePreviewBatchInput): Promise<ImportBatchRecord>;
  getImportBatch(id: string): Promise<ImportBatchRecord | null>;
  commitImportBatch(input: CommitImportBatchInput): Promise<CommitImportBatchResult>;
  discardImportBatch(input: DiscardImportBatchInput): Promise<void>;
}

interface SavedTradingRepository {
  listTrades(query: SavedTradeQuery): Promise<SavedTradeReadModel[]>;
  getTrade(id: string): Promise<SavedTradeReadModel | null>;
  listReports(query: TraderReportQuery): Promise<TraderAnalyticsReadModel[]>;
  getLatestReport(accountId: string): Promise<TraderAnalyticsReadModel | null>;
}
```

Initial API routes:

- `POST /api/import-batches/preview`
- `GET /api/import-batches/:id`
- `POST /api/import-batches/:id/commit`
- `POST /api/import-batches/:id/discard`
- `GET /api/trades`
- `GET /api/trades/:id`
- `GET /api/analytics/latest`
- `GET /api/coach/latest`

Keep `/api/import-dry-run/decision-review` as a preview-only bridge until saved
trade decision-review jobs exist.

## UI Flow

1. User uploads/pastes CSV.
2. App builds dry-run preview.
3. User repairs rows/mapping/grouping decisions.
4. App shows `ready_to_commit`.
5. User clicks `Save Import`.
6. App shows commit confirmation with counts and warnings.
7. Commit transaction runs.
8. App routes to import batch summary.
9. Completed trades are available in `/trades`.
10. Analytics report generation runs.
11. `/analytics`, `/coach`, and `/review` read the saved report instead of sample
    fixtures.

## Coding Phases

### Phase 1: Contracts Only

Status: complete as of 2026-05-07.

- Add TypeScript read/write model types.
- Add repository interfaces.
- Add in-memory adapter for tests.
- Add commit workflow pure function that takes a dry-run experience and returns
  a commit plan/result without production writes.

Acceptance:

- unit tests prove ready, blocked, duplicate, open-position, over-reduction,
  fee warning, and rejected-row branches
- existing dry-run UI remains no-production-write

Implementation notes:

- Added `buildImportCommitPlan()` for durable import-batch/read-model planning
  from `CsvDryRunImportExperience`.
- Added an in-memory import commit repository for tests and future route wiring.
- Generic mapped CSV imports are intentionally review-gated until mapping is
  acknowledged; CSVs without broker net P/L are also P/L-review-gated before
  commit.
- Covered ready, blocked, duplicate file/trade, open-position,
  over-reduction, short-trade, fee/net preview, rejected-row, mapping-review,
  P/L-review, and anomaly acknowledgement branches in unit tests.

### Phase 2: Durable Adapter

- Choose database/migration tool.
- Implement migrations for V1 tables.
- Implement repository adapter.
- Keep raw CSV storage disabled by default.

Acceptance:

- commit transaction creates import batch, rows, executions, saved trades,
  links, diagnostics, and feedback summaries
- duplicate file/trade constraints behave correctly

### Phase 3: Saved Read Models

- Build saved trade read model from repository.
- Build analytics/coach/review read models from latest saved report.
- Keep sample-data fallback only when no saved report exists.

Acceptance:

- `/trades/[tradeId]` reads committed data
- `/analytics` reads latest saved report
- `/coach` reads latest saved report
- sample data remains visibly labeled

### Phase 4: Decision Review Jobs

- Queue completed saved trades after import commit.
- Persist decision-review snapshots and diagnostics.
- Aggregate evidence-gate counts into analytics and coach read models.

Acceptance:

- open trades create `trade_open` diagnostics and do not receive completed
  decision-review snapshots
- market-context unavailable is stored as a diagnostic, not a hidden failure
- evidence-gate UI can render from persisted snapshots

### Phase 5: Product Hardening

- Add import batch summary route.
- Add rollback/discard UI.
- Add account/workspace authorization.
- Add retention/delete policy enforcement.

Acceptance:

- no route exposes raw JSON/export controls
- user can see committed imports and delete/discard inside the app
- data ownership is enforced server-side

## Test Plan

Unit tests:

- commit preconditions
- duplicate file handling
- duplicate trade handling
- open position handling
- over-reduction split persistence
- short trade persistence
- fees/commission/net preview persistence
- evidence-gate snapshot persistence

Integration tests:

- dry-run preview to commit result
- committed import to saved trade read model
- committed import to analytics report snapshot
- decision-review diagnostics stored for open/unavailable trades

Browser tests:

- import dry-run shows `Save Import` only when ready
- rejected rows block commit
- duplicate warning requires acknowledgement
- committed import appears in import history
- `/trades`, `/analytics`, `/coach`, and `/review` load committed data

Regression tests:

- no production write during dry-run
- no raw export controls
- execution-only coaching still avoids market claims unless persisted evidence
  gates support them

## Open Decisions

- Database vendor and migration tool.
- Auth provider.
- Whether raw CSV rows are stored temporarily or never stored.
- Exact retention window for raw rows and repair payloads.
- Whether V1 supports replacing duplicate trades or only skipping them.
- Whether report generation runs synchronously after commit or through a job
  queue.

## Recommended Next Coding Step

Start Phase 2 or Phase 3 depending on product priority.

If persistence is the priority, choose the database/migration tool and implement
the durable repository adapter. If product flow is the priority, wire the
existing in-memory commit repository into a guarded import commit route and UI
smoke path while keeping production writes clearly disabled until the durable
adapter is chosen.
