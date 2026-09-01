import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function tokenCheck(column: string): string {
  return `CHECK (length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^a-z0-9_]*')`;
}

function sha256Check(column: string): string {
  return `CHECK (length(${column}) = 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^0-9a-f]*')`;
}

const sql = `PRAGMA defer_foreign_keys = ON;

DROP TRIGGER IF EXISTS journal_trade_style_plans_no_delete;
DROP TRIGGER IF EXISTS journal_trade_style_plan_events_no_update;
DROP TRIGGER IF EXISTS journal_trade_style_plan_events_no_delete;
DROP INDEX IF EXISTS journal_trade_style_plans_account_state;
DROP INDEX IF EXISTS journal_trade_style_plans_open_status;
DROP INDEX IF EXISTS journal_trade_style_plan_events_chronology;

ALTER TABLE journal_trade_style_plans RENAME TO journal_trade_style_plans_0108_old;
ALTER TABLE journal_trade_style_plan_events RENAME TO journal_trade_style_plan_events_0108_old;

CREATE TABLE journal_trade_style_plans (
  trade_style_plan_id TEXT PRIMARY KEY ${uuidCheck("trade_style_plan_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  trade_style TEXT NOT NULL CHECK (trade_style IN ('day_trade', 'swing', 'other')),
  open_status TEXT NOT NULL CHECK (open_status IN ('day_trade_still_open', 'swing', 'unplanned_hold', 'other', 'unclassified', 'closed')),
  planned_from_entry INTEGER NOT NULL CHECK (planned_from_entry IN (0, 1)),
  claimed_effective_at_utc TEXT NOT NULL ${utcCheck("claimed_effective_at_utc")},
  declared_at_utc TEXT NOT NULL ${utcCheck("declared_at_utc")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'closed', 'needs_relink')),
  current_revision INTEGER NOT NULL CHECK (current_revision > 0),
  current_event_id TEXT NOT NULL ${uuidCheck("current_event_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  entry_reason_text TEXT CHECK (
    entry_reason_text IS NULL OR (length(entry_reason_text) BETWEEN 1 AND 12000 AND instr(entry_reason_text, char(0)) = 0)
  ),
  has_upcoming_catalyst INTEGER CHECK (
    has_upcoming_catalyst IS NULL OR has_upcoming_catalyst IN (0, 1)
  ),
  catalyst_details_text TEXT CHECK (
    catalyst_details_text IS NULL OR (length(catalyst_details_text) BETWEEN 1 AND 12000 AND instr(catalyst_details_text, char(0)) = 0)
  ),
  planned_hold_trading_days INTEGER CHECK (
    planned_hold_trading_days IS NULL OR planned_hold_trading_days BETWEEN 1 AND 252
  ),
  CHECK (updated_at_utc >= created_at_utc AND declared_at_utc >= claimed_effective_at_utc),
  CHECK ((lifecycle_state = 'closed' AND open_status = 'closed') OR lifecycle_state <> 'closed'),
  UNIQUE (workspace_id, account_id, round_trip_id),
  UNIQUE (workspace_id, account_id, trade_style_plan_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id) REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, trade_style_plan_id, current_event_id) REFERENCES journal_trade_style_plan_events(workspace_id, account_id, trade_style_plan_id, trade_style_plan_event_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE journal_trade_style_plan_events (
  trade_style_plan_event_id TEXT PRIMARY KEY ${uuidCheck("trade_style_plan_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trade_style_plan_id TEXT NOT NULL ${uuidCheck("trade_style_plan_id")},
  event_sequence INTEGER NOT NULL CHECK (event_sequence > 0),
  event_type TEXT NOT NULL CHECK (event_type IN ('declared', 'reclassified', 'closed', 'relinked', 'needs_relink')),
  prior_trade_style TEXT CHECK (prior_trade_style IS NULL OR prior_trade_style IN ('day_trade', 'swing', 'other')),
  new_trade_style TEXT NOT NULL CHECK (new_trade_style IN ('day_trade', 'swing', 'other')),
  prior_open_status TEXT CHECK (prior_open_status IS NULL OR prior_open_status IN ('day_trade_still_open', 'swing', 'unplanned_hold', 'other', 'unclassified', 'closed')),
  new_open_status TEXT NOT NULL CHECK (new_open_status IN ('day_trade_still_open', 'swing', 'unplanned_hold', 'other', 'unclassified', 'closed')),
  claimed_effective_at_utc TEXT NOT NULL ${utcCheck("claimed_effective_at_utc")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  source_ui TEXT NOT NULL CHECK (source_ui IN ('day_trade_tracker', 'swing_trade_tracker', 'open_positions', 'ai_chat', 'workspace')),
  expected_revision INTEGER NOT NULL CHECK (expected_revision >= 0),
  idempotency_sha256 TEXT NOT NULL ${sha256Check("idempotency_sha256")},
  actor_user_id TEXT NOT NULL ${uuidCheck("actor_user_id")},
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  entry_reason_text TEXT CHECK (
    entry_reason_text IS NULL OR (length(entry_reason_text) BETWEEN 1 AND 12000 AND instr(entry_reason_text, char(0)) = 0)
  ),
  has_upcoming_catalyst INTEGER CHECK (
    has_upcoming_catalyst IS NULL OR has_upcoming_catalyst IN (0, 1)
  ),
  catalyst_details_text TEXT CHECK (
    catalyst_details_text IS NULL OR (length(catalyst_details_text) BETWEEN 1 AND 12000 AND instr(catalyst_details_text, char(0)) = 0)
  ),
  planned_hold_trading_days INTEGER CHECK (
    planned_hold_trading_days IS NULL OR planned_hold_trading_days BETWEEN 1 AND 252
  ),
  CHECK ((event_sequence = 1 AND event_type = 'declared' AND prior_trade_style IS NULL AND prior_open_status IS NULL AND expected_revision = 0) OR (event_sequence > 1 AND event_type <> 'declared' AND prior_trade_style IS NOT NULL AND prior_open_status IS NOT NULL AND expected_revision = event_sequence - 1)),
  CHECK (occurred_at_utc >= claimed_effective_at_utc),
  UNIQUE (workspace_id, account_id, trade_style_plan_id, event_sequence),
  UNIQUE (workspace_id, account_id, trade_style_plan_id, trade_style_plan_event_id),
  UNIQUE (workspace_id, account_id, actor_user_id, idempotency_sha256),
  FOREIGN KEY (workspace_id, account_id, trade_style_plan_id) REFERENCES journal_trade_style_plans(workspace_id, account_id, trade_style_plan_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id, account_id, round_trip_version_id) REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

INSERT INTO journal_trade_style_plans (
  trade_style_plan_id, user_id, workspace_id, account_id, round_trip_id, round_trip_version_id,
  trade_style, open_status, planned_from_entry, claimed_effective_at_utc, declared_at_utc,
  lifecycle_state, current_revision, current_event_id, created_at_utc, updated_at_utc,
  entry_reason_text, has_upcoming_catalyst, catalyst_details_text, planned_hold_trading_days
)
SELECT
  trade_style_plan_id, user_id, workspace_id, account_id, round_trip_id, round_trip_version_id,
  trade_style, open_status, planned_from_entry, claimed_effective_at_utc, declared_at_utc,
  lifecycle_state, current_revision, current_event_id, created_at_utc, updated_at_utc,
  entry_reason_text, has_upcoming_catalyst, catalyst_details_text, planned_hold_trading_days
FROM journal_trade_style_plans_0108_old;

INSERT INTO journal_trade_style_plan_events (
  trade_style_plan_event_id, workspace_id, account_id, trade_style_plan_id, event_sequence,
  event_type, prior_trade_style, new_trade_style, prior_open_status, new_open_status,
  claimed_effective_at_utc, round_trip_version_id, reason_code, source_ui, expected_revision,
  idempotency_sha256, actor_user_id, occurred_at_utc, entry_reason_text, has_upcoming_catalyst,
  catalyst_details_text, planned_hold_trading_days
)
SELECT
  trade_style_plan_event_id, workspace_id, account_id, trade_style_plan_id, event_sequence,
  event_type, prior_trade_style, new_trade_style, prior_open_status, new_open_status,
  claimed_effective_at_utc, round_trip_version_id, reason_code, source_ui, expected_revision,
  idempotency_sha256, actor_user_id, occurred_at_utc, entry_reason_text, has_upcoming_catalyst,
  catalyst_details_text, planned_hold_trading_days
FROM journal_trade_style_plan_events_0108_old;
DROP TABLE journal_trade_style_plan_events_0108_old;
DROP TABLE journal_trade_style_plans_0108_old;

CREATE INDEX journal_trade_style_plans_account_state ON journal_trade_style_plans(workspace_id, account_id, lifecycle_state, trade_style, updated_at_utc DESC, trade_style_plan_id);
CREATE INDEX journal_trade_style_plans_open_status ON journal_trade_style_plans(workspace_id, account_id, open_status, updated_at_utc DESC, trade_style_plan_id) WHERE lifecycle_state = 'active';
CREATE INDEX journal_trade_style_plan_events_chronology ON journal_trade_style_plan_events(workspace_id, account_id, trade_style_plan_id, event_sequence, trade_style_plan_event_id);

CREATE TRIGGER journal_trade_style_plans_no_delete BEFORE DELETE ON journal_trade_style_plans BEGIN SELECT RAISE(ABORT, 'journal_trade_style_plan_history_required'); END;
CREATE TRIGGER journal_trade_style_plan_events_no_update BEFORE UPDATE ON journal_trade_style_plan_events BEGIN SELECT RAISE(ABORT, 'journal_trade_style_plan_event_immutable'); END;
CREATE TRIGGER journal_trade_style_plan_events_no_delete BEFORE DELETE ON journal_trade_style_plan_events BEGIN SELECT RAISE(ABORT, 'journal_trade_style_plan_event_immutable'); END;`;

export const journalWorkspaceTradeStyleSourceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0108_journal_workspace_trade_style_source",
  executionOrder: 108,
  statements: Object.freeze([sql]),
});
