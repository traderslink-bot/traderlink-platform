# End-User Database Schema Plan

Date: 2026-05-02

## Purpose

This file defines the planned database shape for the end-user product.

It is a schema contract, not a database vendor decision. The same tables could
be implemented in Postgres, Supabase, Neon, Prisma-backed Postgres, or another
relational store later.

The product stance is:

- users import execution data into the app
- users return to the app to view trades, reports, notes, focus queues, and
  action plans
- production UX should not add user-facing CSV, spreadsheet, raw JSON, or bulk
  export controls for saved app data
- internal fingerprints and diagnostics exist for reconciliation, support, and
  data quality, not as user-facing data ownership/export features

## Ownership Boundary

`trader-intelligence-v2` owns these stored records:

- workspaces and users
- trading accounts
- broker execution import batches
- normalized executions
- grouped saved trades
- import repair/review state
- execution-feedback summaries
- trader analytics reports
- notes, rules, action plans, review state, and UI workflow state

`levels-system` owns candle data, support/resistance generation, VWAP/EMA,
market structure, and future chart-reading data. This app can store the result
of a completed trade analysis later, but it should not become the candle
database.

## Core Tables

### `workspaces`

Purpose: top-level product/account container.

Suggested fields:

- `id`
- `name`
- `owner_user_id`
- `created_at`
- `updated_at`
- `sample_data`
- `deleted_at`

Indexes:

- primary key on `id`
- index on `owner_user_id`

### `users`

Purpose: product user profile linked to auth provider identity.

Suggested fields:

- `id`
- `auth_provider_user_id`
- `display_name`
- `email`
- `role`
- `created_at`
- `updated_at`
- `deleted_at`

Indexes/constraints:

- unique `auth_provider_user_id`
- unique `email` when present

### `workspace_memberships`

Purpose: allow future team/admin support without changing the core model.

Suggested fields:

- `id`
- `workspace_id`
- `user_id`
- `role`
- `created_at`
- `updated_at`

Indexes/constraints:

- unique `(workspace_id, user_id)`
- index on `user_id`

### `trading_accounts`

Purpose: user-visible trading account/import scope.

Suggested fields:

- `id`
- `workspace_id`
- `label`
- `broker_label`
- `timezone`
- `base_currency`
- `created_at`
- `updated_at`
- `archived_at`
- `sample_data`

Notes:

- `timezone` should default to an IANA value such as `America/New_York`.
- The account timezone is used to interpret broker-local CSV timestamps unless
  the import explicitly overrides it.
- `broker_label` is display/product metadata. It does not make this app the
  candle-data provider.

Indexes:

- index on `workspace_id`
- index on `(workspace_id, archived_at)`

## Import Tables

### `broker_import_batches`

Purpose: one uploaded broker CSV/import attempt.

Suggested fields:

- `id`
- `workspace_id`
- `account_id`
- `user_id`
- `broker_key`
- `broker_label`
- `file_fingerprint`
- `file_name`
- `file_size_bytes`
- `timestamp_timezone`
- `options_handling`
- `column_mapping_json`
- `trade_grouping_rules_json`
- `mapping_confidence_level`
- `mapping_confidence_score`
- `row_count`
- `accepted_execution_count`
- `rejected_row_count`
- `skipped_row_count`
- `request_count`
- `status`
- `created_at`
- `updated_at`

Recommended `status` values:

- `previewed`
- `needs_repair`
- `ready_to_save`
- `saved`
- `discarded`
- `failed`

Indexes/constraints:

- index on `(workspace_id, account_id, created_at)`
- unique `(account_id, file_fingerprint)` when duplicate-file prevention is
  enabled

Retention stance:

- storing the original raw CSV file is optional and should be a deliberate
  privacy/retention decision
- storing the file fingerprint is enough for same-file duplicate warning
- raw row JSON can be retained temporarily for repair workflow if product/legal
  policy allows it

### `broker_import_rows`

Purpose: row-level preview/repair/audit state.

Suggested fields:

- `id`
- `import_batch_id`
- `row_index`
- `status`
- `symbol`
- `raw_row_json`
- `normalized_execution_id`
- `created_at`
- `updated_at`

Recommended `status` values:

- `accepted`
- `rejected`
- `skipped`
- `repaired`
- `discarded`

Indexes/constraints:

- unique `(import_batch_id, row_index)`
- index on `(import_batch_id, status)`

Privacy note:

- `raw_row_json` may contain broker/account details. Keep it optional and set a
  retention policy before production.

### `broker_import_issues`

Purpose: structured row/import issues shown by repair workflow.

Suggested fields:

- `id`
- `import_batch_id`
- `row_id`
- `request_index`
- `severity`
- `issue_code`
- `field`
- `message`
- `created_at`

Indexes:

- index on `(import_batch_id, severity)`
- index on `(row_id)`

### `broker_import_repair_items`

Purpose: user-facing in-app repair checklist state.

Suggested fields:

- `id`
- `import_batch_id`
- `row_id`
- `request_index`
- `symbol`
- `severity`
- `action_kind`
- `issue_code`
- `field`
- `title`
- `detail`
- `suggested_fix`
- `status`
- `resolved_by_user_id`
- `resolved_at`
- `created_at`
- `updated_at`

Recommended `status` values:

- `open`
- `resolved`
- `skipped`
- `dismissed`

Indexes:

- index on `(import_batch_id, status)`
- index on `(severity, action_kind)`

Action kinds should include:

- edit row field
- choose timezone
- choose options handling
- skip row
- skip duplicate
- review broker mapping
- review trade grouping
- review P/L reconciliation

### `broker_mapping_learning_signals`

Purpose: internal review queue for generic, low-confidence, or problematic CSV
imports.

Suggested fields:

- `id`
- `import_batch_id`
- `broker_key`
- `confidence_level`
- `confidence_score`
- `header_fingerprint`
- `headers_json`
- `detected_fields_json`
- `missing_required_fields_json`
- `issue_codes_json`
- `review_status`
- `created_at`
- `reviewed_at`

Product rule:

- this is internal product quality data
- do not expose it as a user export
- promote a first-class broker mapper only after enough safe evidence exists

### `options_quarantine_items`

Purpose: park recognized options rows outside the stock analytics lane.

Suggested fields:

- `id`
- `import_batch_id`
- `row_id`
- `row_index`
- `action`
- `issue_code`
- `message`
- `created_at`

Recommended actions:

- `rejected`
- `skipped`
- `allowed`

Product rule:

- options rows should remain separate from stock analytics until options
  analytics has its own contract.

## Execution And Trade Tables

### `executions`

Purpose: normalized buy/sell execution rows.

Suggested fields:

- `id`
- `workspace_id`
- `account_id`
- `import_batch_id`
- `import_row_id`
- `symbol`
- `timestamp`
- `side`
- `shares`
- `price`
- `execution_index`
- `order_id`
- `broker_execution_id`
- `commission`
- `fees`
- `net_amount`
- `currency`
- `source`
- `notes`
- `created_at`

Important money fields:

- `commission`: broker commission charged for the execution when present
- `fees`: regulatory/exchange/broker fees when present
- `net_amount`: broker-provided signed cash amount when present
- if `net_amount` exists on all executions in a closed trade, use it for the
  highest-confidence net P/L preview
- if `net_amount` is missing, use gross buy/sell cash flow minus known
  commissions/fees only as a preview and mark the source clearly

Indexes:

- index on `(account_id, symbol, timestamp)`
- index on `import_batch_id`
- index on `broker_execution_id` when present

### `saved_trades`

Purpose: grouped execution lifecycle that feeds analysis.

Suggested fields:

- `id`
- `workspace_id`
- `account_id`
- `import_batch_id`
- `request_index`
- `trade_fingerprint`
- `symbol`
- `trade_direction`
- `session_date`
- `session_bucket`
- `lifecycle_status`
- `opened_at`
- `closed_at`
- `gross_realized_pnl`
- `net_pnl_preview`
- `net_pnl_source`
- `pnl_reconciliation_status`
- `pnl_reconciliation_difference`
- `currency`
- `review_status`
- `sample_data`
- `created_at`
- `updated_at`
- `deleted_at`

Indexes/constraints:

- index on `(account_id, symbol, opened_at)`
- index on `(workspace_id, review_status)`
- unique `(account_id, trade_fingerprint)` for duplicate-trade detection when
  enabled

### `saved_trade_executions`

Purpose: join executions to saved grouped trades in order.

Suggested fields:

- `id`
- `saved_trade_id`
- `execution_id`
- `sequence_index`
- `split_source_execution_id`
- `split_reason`

Indexes/constraints:

- unique `(saved_trade_id, sequence_index)`
- unique `(saved_trade_id, execution_id, sequence_index)`

### `trade_grouping_diagnostics`

Purpose: preserve how the importer grouped executions into trades.

Suggested fields:

- `id`
- `import_batch_id`
- `saved_trade_id`
- `request_index`
- `symbol`
- `trade_direction`
- `lifecycle_status`
- `grouping_reason`
- `row_indexes_json`
- `execution_count`
- `first_timestamp`
- `last_timestamp`
- `final_position_shares`
- `notes_json`
- `created_at`

Recommended use:

- show open-position groups for review
- show over-reduction splits for review
- show max-gap and session-boundary safety splits for review
- keep these diagnostics visible in admin/support/debug tools
- do not let diagnostics override the trade-analysis engine by themselves

## Analysis Tables

### `trade_analysis_jobs`

Purpose: async queue from saved trades to generated summaries.

Suggested fields:

- `id`
- `workspace_id`
- `account_id`
- `saved_trade_id`
- `status`
- `failure_code`
- `failure_message`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

Recommended `status` values:

- `queued`
- `processing`
- `completed`
- `failed`
- `needs_user_fix`

### `execution_feedback_summaries`

Purpose: durable execution-only feedback for one saved trade.

Suggested fields:

- `id`
- `saved_trade_id`
- `contract_version`
- `generated_at`
- `summary_json`
- `warnings_json`
- `limitations_json`

Indexes:

- index on `saved_trade_id`
- index on `generated_at`

### `trade_analysis_summaries`

Purpose: durable full trade-analysis summary after candle context is available.

Suggested fields:

- `id`
- `saved_trade_id`
- `contract_version`
- `levels_system_context_version`
- `market_structure_observed`
- `market_structure_used_for_scoring`
- `generated_at`
- `summary_json`
- `warnings_json`
- `limitations_json`

Important constraint:

- `market_structure_used_for_scoring` should remain false until real saved
  trade calibration promotes it.

### `trader_analytics_reports`

Purpose: saved multi-trade analytics report.

Suggested fields:

- `id`
- `workspace_id`
- `account_id`
- `user_id`
- `report_period_start`
- `report_period_end`
- `label`
- `contract_version`
- `source_trade_ids_json`
- `completed_trade_count`
- `gross_total_realized_pnl`
- `net_total_pnl_preview`
- `generated_at`
- `report_json`
- `review_status`
- `sample_data`

Indexes:

- index on `(account_id, generated_at)`
- index on `(workspace_id, report_period_start, report_period_end)`

## Product Workflow Tables

### `report_notes`

Purpose: in-app notes attached to reports.

Fields:

- `id`
- `report_id`
- `user_id`
- `body`
- `created_at`
- `updated_at`
- `deleted_at`

### `trade_notes`

Purpose: in-app notes attached to saved trades.

Fields:

- `id`
- `saved_trade_id`
- `user_id`
- `body`
- `created_at`
- `updated_at`
- `deleted_at`

### `review_items`

Purpose: focus queue/review workflow state.

Fields:

- `id`
- `workspace_id`
- `account_id`
- `target_kind`
- `target_id`
- `title`
- `summary`
- `priority`
- `status`
- `created_at`
- `updated_at`

Recommended `target_kind` values:

- `trade`
- `report`
- `rule`
- `import_batch`
- `action_plan`

### `rules`

Purpose: trader-created behavior rules.

Fields:

- `id`
- `workspace_id`
- `account_id`
- `user_id`
- `template_id`
- `label`
- `enabled`
- `parameters_json`
- `created_at`
- `updated_at`

### `rule_evaluations`

Purpose: saved report-specific rule results.

Fields:

- `id`
- `rule_id`
- `report_id`
- `passed_trade_count`
- `violated_trade_count`
- `violation_trade_ids_json`
- `summary`
- `created_at`

### `action_plan_items`

Purpose: in-app action plan tasks generated from analytics.

Fields:

- `id`
- `workspace_id`
- `account_id`
- `report_id`
- `behavior_id`
- `title`
- `measurement_window`
- `success_metric`
- `related_trade_ids_json`
- `priority`
- `status`
- `created_at`
- `updated_at`

### `journal_prompts`

Purpose: persistent prompt state when the product turns analytics into review
questions.

Fields:

- `id`
- `workspace_id`
- `account_id`
- `target_kind`
- `target_id`
- `label`
- `prompt`
- `related_trade_ids_json`
- `created_at`

## Market Context Calibration Tables

### `market_context_calibration_runs`

Purpose: internal calibration records for shared market structure from
`levels-system`.

Fields:

- `id`
- `workspace_id`
- `account_id`
- `status`
- `source_trade_count`
- `reviewed_trade_count`
- `pass_count`
- `review_count`
- `blocker_count`
- `started_at`
- `completed_at`
- `evaluation_json`
- `report_markdown`

### `market_context_observations`

Purpose: per-trade market-structure observations before promotion.

Fields:

- `id`
- `calibration_run_id`
- `saved_trade_id`
- `symbol`
- `market_structure_present`
- `confidence`
- `classification_json`
- `diagnostics_json`
- `used_for_scoring`
- `created_at`

Constraint:

- `used_for_scoring` must remain false while the feature is observational.

## Import Repair Workflow

The app-side importer now produces enough data to drive these screens later:

- summary cards:
  - rows accepted/rejected/skipped
  - grouped trades
  - broker mapping confidence
  - timestamp timezone
  - fees/commissions
  - duplicates
  - options handling
- repair items:
  - edit a bad row field
  - choose timezone
  - choose options handling
  - skip duplicate
  - review broker mapping
  - review trade grouping
- grouping diagnostics:
  - closed at flat
  - open at end of symbol
  - split at over-reduction

Database implication:

- store the import batch before save
- store repair/review items before grouped trades are committed
- commit saved trades only after the user confirms the preview

## Product Privacy And Retention

Required production decisions:

- whether raw uploaded files are stored at all
- how long `raw_row_json` is retained
- whether admin/support can inspect raw rows
- how users delete an account and all related trades/reports
- how fingerprints are retained after deletion
- whether generated reports are hard-deleted or tombstoned

Recommended default:

- store normalized executions and saved trades
- store file fingerprints for duplicate detection
- avoid storing raw files unless the product explicitly needs repair/retry
  workflows that require them
- keep raw-row retention shorter than saved normalized trade retention
- keep user-facing analytics inside the app instead of adding export controls

## Implementation Order

1. Add database provider and migration tool.
2. Create workspace/user/account tables.
3. Create import batch, row, issue, and repair item tables.
4. Create execution and saved trade tables.
5. Add duplicate constraints around file and trade fingerprints.
6. Create analysis job and summary tables.
7. Create report, note, rule, review, and action-plan tables.
8. Add market-context calibration tables after real saved trades exist.
9. Add retention/delete policies before production launch.
10. Wire the import UI to preview first, save second, analyze third.

## Current App Readiness

The current code is ready for a thin persistence layer because it already
produces:

- normalized executions
- grouped trade requests
- file fingerprints
- request fingerprints
- import issues
- mapping confidence
- grouping diagnostics
- repair workflow items
- summary cards
- net P/L preview

The app still needs real auth/database choices before these contracts become
production storage.

Current implementation bridge:

- See `src/docs/persistence-read-model-and-import-commit-plan-2026-05-07.md`
  for the narrowed next coding branch: repository contracts, import commit
  state machine, saved read models, decision-review snapshot persistence, and
  acceptance tests.
