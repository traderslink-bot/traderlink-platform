import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function dateCheck(column: string): string {
  return `CHECK (
    length(${column}) = 10
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  )`;
}

function sha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

function tokenCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*'
  )`;
}

const createDecisionActionExtension = `CREATE TABLE journal_data_decision_event_action_extensions (
  decision_event_id TEXT PRIMARY KEY ${uuidCheck("decision_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  decision_id TEXT NOT NULL ${uuidCheck("decision_id")},
  extended_action TEXT NOT NULL CHECK (extended_action = 'reconcile_grouped_fills'),
  reconciliation_set_id TEXT NOT NULL ${uuidCheck("reconciliation_set_id")},
  evidence_sha256 TEXT NOT NULL ${sha256Check("evidence_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, decision_id, decision_event_id),
  UNIQUE (workspace_id, account_id, reconciliation_set_id, decision_event_id),
  FOREIGN KEY (workspace_id, account_id, decision_id, decision_event_id)
    REFERENCES journal_data_decision_events(
      workspace_id, account_id, decision_id, decision_event_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, reconciliation_set_id)
    REFERENCES journal_execution_reconciliation_sets(
      workspace_id, account_id, reconciliation_set_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX journal_data_decision_event_action_extensions_decision
  ON journal_data_decision_event_action_extensions(
    workspace_id, account_id, decision_id, created_at_utc, decision_event_id
  );

CREATE TRIGGER journal_data_decision_event_action_extensions_no_update
BEFORE UPDATE ON journal_data_decision_event_action_extensions BEGIN
  SELECT RAISE(ABORT, 'journal_data_decision_action_extension_immutable');
END;

CREATE TRIGGER journal_data_decision_event_action_extensions_no_delete
BEFORE DELETE ON journal_data_decision_event_action_extensions BEGIN
  SELECT RAISE(ABORT, 'journal_data_decision_action_extension_immutable');
END`;

const createTrackingTables = `CREATE TABLE journal_trade_style_plans (
  trade_style_plan_id TEXT PRIMARY KEY ${uuidCheck("trade_style_plan_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  trade_style TEXT NOT NULL CHECK (trade_style IN ('day_trade', 'swing', 'other')),
  open_status TEXT NOT NULL CHECK (
    open_status IN ('day_trade_still_open', 'swing', 'unplanned_hold', 'other', 'unclassified', 'closed')
  ),
  planned_from_entry INTEGER NOT NULL CHECK (planned_from_entry IN (0, 1)),
  claimed_effective_at_utc TEXT NOT NULL ${utcCheck("claimed_effective_at_utc")},
  declared_at_utc TEXT NOT NULL ${utcCheck("declared_at_utc")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'closed', 'needs_relink')),
  current_revision INTEGER NOT NULL CHECK (current_revision > 0),
  current_event_id TEXT NOT NULL ${uuidCheck("current_event_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc AND declared_at_utc >= claimed_effective_at_utc),
  CHECK ((lifecycle_state = 'closed' AND open_status = 'closed') OR lifecycle_state <> 'closed'),
  UNIQUE (workspace_id, account_id, round_trip_id),
  UNIQUE (workspace_id, account_id, trade_style_plan_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id)
    REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, trade_style_plan_id, current_event_id)
    REFERENCES journal_trade_style_plan_events(
      workspace_id, account_id, trade_style_plan_id, trade_style_plan_event_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX journal_trade_style_plans_account_state
  ON journal_trade_style_plans(
    workspace_id, account_id, lifecycle_state, trade_style, updated_at_utc DESC, trade_style_plan_id
  );

CREATE INDEX journal_trade_style_plans_open_status
  ON journal_trade_style_plans(workspace_id, account_id, open_status, updated_at_utc DESC, trade_style_plan_id)
  WHERE lifecycle_state = 'active';

CREATE TRIGGER journal_trade_style_plans_no_delete
BEFORE DELETE ON journal_trade_style_plans BEGIN
  SELECT RAISE(ABORT, 'journal_trade_style_plan_history_required');
END;

CREATE TABLE journal_trade_style_plan_events (
  trade_style_plan_event_id TEXT PRIMARY KEY ${uuidCheck("trade_style_plan_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trade_style_plan_id TEXT NOT NULL ${uuidCheck("trade_style_plan_id")},
  event_sequence INTEGER NOT NULL CHECK (event_sequence > 0),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('declared', 'reclassified', 'closed', 'relinked', 'needs_relink')
  ),
  prior_trade_style TEXT CHECK (prior_trade_style IS NULL OR prior_trade_style IN ('day_trade', 'swing', 'other')),
  new_trade_style TEXT NOT NULL CHECK (new_trade_style IN ('day_trade', 'swing', 'other')),
  prior_open_status TEXT CHECK (
    prior_open_status IS NULL OR prior_open_status IN (
      'day_trade_still_open', 'swing', 'unplanned_hold', 'other', 'unclassified', 'closed'
    )
  ),
  new_open_status TEXT NOT NULL CHECK (
    new_open_status IN ('day_trade_still_open', 'swing', 'unplanned_hold', 'other', 'unclassified', 'closed')
  ),
  claimed_effective_at_utc TEXT NOT NULL ${utcCheck("claimed_effective_at_utc")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  source_ui TEXT NOT NULL CHECK (source_ui IN ('day_trade_tracker', 'swing_trade_tracker', 'open_positions')),
  expected_revision INTEGER NOT NULL CHECK (expected_revision >= 0),
  idempotency_sha256 TEXT NOT NULL ${sha256Check("idempotency_sha256")},
  actor_user_id TEXT NOT NULL ${uuidCheck("actor_user_id")},
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  CHECK (
    (event_sequence = 1 AND event_type = 'declared' AND prior_trade_style IS NULL
      AND prior_open_status IS NULL AND expected_revision = 0)
    OR (event_sequence > 1 AND event_type <> 'declared'
      AND prior_trade_style IS NOT NULL AND prior_open_status IS NOT NULL
      AND expected_revision = event_sequence - 1)
  ),
  CHECK (occurred_at_utc >= claimed_effective_at_utc),
  UNIQUE (workspace_id, account_id, trade_style_plan_id, event_sequence),
  UNIQUE (workspace_id, account_id, trade_style_plan_id, trade_style_plan_event_id),
  UNIQUE (workspace_id, account_id, actor_user_id, idempotency_sha256),
  FOREIGN KEY (workspace_id, account_id, trade_style_plan_id)
    REFERENCES journal_trade_style_plans(workspace_id, account_id, trade_style_plan_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id, account_id, round_trip_version_id)
    REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_trade_style_plan_events_chronology
  ON journal_trade_style_plan_events(
    workspace_id, account_id, trade_style_plan_id, event_sequence, trade_style_plan_event_id
  );

CREATE TRIGGER journal_trade_style_plan_events_no_update
BEFORE UPDATE ON journal_trade_style_plan_events BEGIN
  SELECT RAISE(ABORT, 'journal_trade_style_plan_event_immutable');
END;

CREATE TRIGGER journal_trade_style_plan_events_no_delete
BEFORE DELETE ON journal_trade_style_plan_events BEGIN
  SELECT RAISE(ABORT, 'journal_trade_style_plan_event_immutable');
END;

CREATE TABLE journal_swing_daily_notes (
  swing_daily_note_id TEXT PRIMARY KEY ${uuidCheck("swing_daily_note_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  review_date TEXT NOT NULL ${dateCheck("review_date")},
  note_text TEXT NOT NULL CHECK (length(note_text) BETWEEN 1 AND 12000 AND instr(note_text, char(0)) = 0),
  next_session_plan_text TEXT CHECK (
    next_session_plan_text IS NULL OR (
      length(next_session_plan_text) BETWEEN 1 AND 12000 AND instr(next_session_plan_text, char(0)) = 0
    )
  ),
  current_revision INTEGER NOT NULL CHECK (current_revision > 0),
  current_revision_id TEXT NOT NULL ${uuidCheck("current_revision_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, round_trip_id, review_date),
  UNIQUE (workspace_id, account_id, swing_daily_note_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id)
    REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, swing_daily_note_id, current_revision_id)
    REFERENCES journal_swing_daily_note_revisions(
      workspace_id, account_id, swing_daily_note_id, swing_daily_note_revision_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX journal_swing_daily_notes_account_date
  ON journal_swing_daily_notes(workspace_id, account_id, review_date DESC, swing_daily_note_id);

CREATE TRIGGER journal_swing_daily_notes_no_delete
BEFORE DELETE ON journal_swing_daily_notes BEGIN
  SELECT RAISE(ABORT, 'journal_swing_daily_note_history_required');
END;

CREATE TABLE journal_swing_daily_note_revisions (
  swing_daily_note_revision_id TEXT PRIMARY KEY ${uuidCheck("swing_daily_note_revision_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  swing_daily_note_id TEXT NOT NULL ${uuidCheck("swing_daily_note_id")},
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  note_text TEXT NOT NULL CHECK (length(note_text) BETWEEN 1 AND 12000 AND instr(note_text, char(0)) = 0),
  next_session_plan_text TEXT CHECK (
    next_session_plan_text IS NULL OR (
      length(next_session_plan_text) BETWEEN 1 AND 12000 AND instr(next_session_plan_text, char(0)) = 0
    )
  ),
  review_date TEXT NOT NULL ${dateCheck("review_date")},
  actor_user_id TEXT NOT NULL ${uuidCheck("actor_user_id")},
  idempotency_sha256 TEXT NOT NULL ${sha256Check("idempotency_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, swing_daily_note_id, revision_number),
  UNIQUE (workspace_id, account_id, swing_daily_note_id, swing_daily_note_revision_id),
  UNIQUE (workspace_id, account_id, actor_user_id, idempotency_sha256),
  FOREIGN KEY (workspace_id, account_id, swing_daily_note_id)
    REFERENCES journal_swing_daily_notes(workspace_id, account_id, swing_daily_note_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_swing_daily_note_revisions_chronology
  ON journal_swing_daily_note_revisions(
    workspace_id, account_id, swing_daily_note_id, revision_number, swing_daily_note_revision_id
  );

CREATE TRIGGER journal_swing_daily_note_revisions_no_update
BEFORE UPDATE ON journal_swing_daily_note_revisions BEGIN
  SELECT RAISE(ABORT, 'journal_swing_daily_note_revision_immutable');
END;

CREATE TRIGGER journal_swing_daily_note_revisions_no_delete
BEFORE DELETE ON journal_swing_daily_note_revisions BEGIN
  SELECT RAISE(ABORT, 'journal_swing_daily_note_revision_immutable');
END;

CREATE TABLE journal_manual_trade_boundary_assertions (
  boundary_assertion_id TEXT PRIMARY KEY ${uuidCheck("boundary_assertion_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_batch_id TEXT NOT NULL ${uuidCheck("import_batch_id")},
  round_trip_id TEXT ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT ${uuidCheck("round_trip_version_id")},
  relationship TEXT NOT NULL CHECK (
    relationship IN ('start_new_trade', 'continue_tracked_position', 'close_tracked_position')
  ),
  manual_group_ref_sha256 TEXT NOT NULL ${sha256Check("manual_group_ref_sha256")},
  normalized_payload_sha256 TEXT NOT NULL ${sha256Check("normalized_payload_sha256")},
  expected_existing_version INTEGER CHECK (expected_existing_version IS NULL OR expected_existing_version > 0),
  source_ui TEXT NOT NULL CHECK (source_ui IN ('day_trade_tracker', 'swing_trade_tracker')),
  idempotency_sha256 TEXT NOT NULL ${sha256Check("idempotency_sha256")},
  asserted_at_utc TEXT NOT NULL ${utcCheck("asserted_at_utc")},
  CHECK (
    (relationship = 'start_new_trade' AND round_trip_id IS NULL AND round_trip_version_id IS NULL
      AND expected_existing_version IS NULL)
    OR (relationship IN ('continue_tracked_position', 'close_tracked_position')
      AND round_trip_id IS NOT NULL AND round_trip_version_id IS NOT NULL
      AND expected_existing_version IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, user_id, idempotency_sha256),
  UNIQUE (workspace_id, account_id, boundary_assertion_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_batch_id)
    REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id)
    REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_manual_trade_boundary_assertions_batch
  ON journal_manual_trade_boundary_assertions(
    workspace_id, account_id, import_batch_id, asserted_at_utc, boundary_assertion_id
  );

CREATE TRIGGER journal_manual_trade_boundary_assertions_no_update
BEFORE UPDATE ON journal_manual_trade_boundary_assertions BEGIN
  SELECT RAISE(ABORT, 'journal_manual_trade_boundary_assertion_immutable');
END;

CREATE TRIGGER journal_manual_trade_boundary_assertions_no_delete
BEFORE DELETE ON journal_manual_trade_boundary_assertions BEGIN
  SELECT RAISE(ABORT, 'journal_manual_trade_boundary_assertion_immutable');
END;

CREATE TABLE journal_execution_reconciliation_sets (
  reconciliation_set_id TEXT PRIMARY KEY ${uuidCheck("reconciliation_set_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  overlap_key_sha256 TEXT NOT NULL ${sha256Check("overlap_key_sha256")},
  matching_basis_version TEXT NOT NULL CHECK (matching_basis_version = 'manual_broker_reconciliation_v1'),
  state TEXT NOT NULL CHECK (
    state IN ('pending', 'same_execution', 'separate_executions', 'corrected', 'superseded')
  ),
  decision_id TEXT ${uuidCheck("decision_id")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  current_event_id TEXT NOT NULL ${uuidCheck("current_event_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  resolved_at_utc TEXT ${utcCheck("resolved_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  CHECK (
    (state = 'pending' AND resolved_at_utc IS NULL)
    OR (state <> 'pending' AND resolved_at_utc IS NOT NULL AND resolved_at_utc >= created_at_utc)
  ),
  UNIQUE (workspace_id, account_id, reconciliation_set_id),
  UNIQUE (workspace_id, account_id, overlap_key_sha256),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, decision_id)
    REFERENCES journal_data_decisions(workspace_id, account_id, decision_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, reconciliation_set_id, current_event_id)
    REFERENCES journal_execution_reconciliation_events(
      workspace_id, account_id, reconciliation_set_id, reconciliation_event_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX journal_execution_reconciliation_sets_state
  ON journal_execution_reconciliation_sets(
    workspace_id, account_id, state, updated_at_utc DESC, reconciliation_set_id
  );

CREATE TRIGGER journal_execution_reconciliation_sets_no_delete
BEFORE DELETE ON journal_execution_reconciliation_sets BEGIN
  SELECT RAISE(ABORT, 'journal_execution_reconciliation_history_required');
END;

CREATE TABLE journal_execution_reconciliation_members (
  reconciliation_member_id TEXT PRIMARY KEY ${uuidCheck("reconciliation_member_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  reconciliation_set_id TEXT NOT NULL ${uuidCheck("reconciliation_set_id")},
  member_role TEXT NOT NULL CHECK (
    member_role IN ('manual_execution', 'provisional_imported_execution', 'broker_source_row')
  ),
  execution_id TEXT ${uuidCheck("execution_id")},
  source_row_id TEXT ${uuidCheck("source_row_id")},
  evidence_sha256 TEXT NOT NULL ${sha256Check("evidence_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (member_role IN ('manual_execution', 'provisional_imported_execution')
      AND execution_id IS NOT NULL AND source_row_id IS NULL)
    OR (member_role = 'broker_source_row' AND execution_id IS NULL AND source_row_id IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, reconciliation_set_id, reconciliation_member_id),
  FOREIGN KEY (workspace_id, account_id, reconciliation_set_id)
    REFERENCES journal_execution_reconciliation_sets(workspace_id, account_id, reconciliation_set_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, execution_id)
    REFERENCES journal_executions(workspace_id, account_id, execution_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, source_row_id)
    REFERENCES journal_source_rows(workspace_id, account_id, source_row_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX journal_execution_reconciliation_members_execution
  ON journal_execution_reconciliation_members(
    workspace_id, account_id, reconciliation_set_id, member_role, execution_id
  ) WHERE execution_id IS NOT NULL;

CREATE UNIQUE INDEX journal_execution_reconciliation_members_source_row
  ON journal_execution_reconciliation_members(
    workspace_id, account_id, reconciliation_set_id, member_role, source_row_id
  ) WHERE source_row_id IS NOT NULL;

CREATE INDEX journal_execution_reconciliation_members_pending_lookup
  ON journal_execution_reconciliation_members(workspace_id, account_id, execution_id, reconciliation_set_id)
  WHERE member_role = 'provisional_imported_execution';

CREATE TRIGGER journal_execution_reconciliation_members_no_update
BEFORE UPDATE ON journal_execution_reconciliation_members BEGIN
  SELECT RAISE(ABORT, 'journal_execution_reconciliation_member_immutable');
END;

CREATE TRIGGER journal_execution_reconciliation_members_no_delete
BEFORE DELETE ON journal_execution_reconciliation_members BEGIN
  SELECT RAISE(ABORT, 'journal_execution_reconciliation_member_immutable');
END;

CREATE TABLE journal_execution_reconciliation_events (
  reconciliation_event_id TEXT PRIMARY KEY ${uuidCheck("reconciliation_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  reconciliation_set_id TEXT NOT NULL ${uuidCheck("reconciliation_set_id")},
  event_sequence INTEGER NOT NULL CHECK (event_sequence > 0),
  action TEXT NOT NULL CHECK (
    action IN (
      'candidate_created', 'decide_later', 'same_execution', 'separate_executions',
      'correct_manual_entry', 'grouped_fills_reconciled', 'superseded'
    )
  ),
  prior_state TEXT CHECK (
    prior_state IS NULL OR prior_state IN (
      'pending', 'same_execution', 'separate_executions', 'corrected', 'superseded'
    )
  ),
  new_state TEXT NOT NULL CHECK (
    new_state IN ('pending', 'same_execution', 'separate_executions', 'corrected', 'superseded')
  ),
  expected_revision INTEGER NOT NULL CHECK (expected_revision >= 0),
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('system', 'user')),
  actor_user_id TEXT ${uuidCheck("actor_user_id")},
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  evidence_sha256 TEXT NOT NULL ${sha256Check("evidence_sha256")},
  idempotency_sha256 TEXT NOT NULL ${sha256Check("idempotency_sha256")},
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  CHECK (
    (actor_kind = 'system' AND actor_user_id IS NULL AND action IN ('candidate_created', 'superseded'))
    OR (actor_kind = 'user' AND actor_user_id IS NOT NULL AND action NOT IN ('candidate_created', 'superseded'))
  ),
  CHECK (
    (event_sequence = 1 AND action = 'candidate_created' AND prior_state IS NULL
      AND new_state = 'pending' AND expected_revision = 0)
    OR (event_sequence > 1 AND action <> 'candidate_created' AND prior_state IS NOT NULL
      AND expected_revision = event_sequence - 1)
  ),
  UNIQUE (workspace_id, account_id, reconciliation_set_id, event_sequence),
  UNIQUE (workspace_id, account_id, reconciliation_set_id, reconciliation_event_id),
  UNIQUE (workspace_id, account_id, idempotency_sha256),
  FOREIGN KEY (workspace_id, account_id, reconciliation_set_id)
    REFERENCES journal_execution_reconciliation_sets(workspace_id, account_id, reconciliation_set_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_execution_reconciliation_events_chronology
  ON journal_execution_reconciliation_events(
    workspace_id, account_id, reconciliation_set_id, event_sequence, reconciliation_event_id
  );

CREATE TRIGGER journal_execution_reconciliation_events_no_update
BEFORE UPDATE ON journal_execution_reconciliation_events BEGIN
  SELECT RAISE(ABORT, 'journal_execution_reconciliation_event_immutable');
END;

CREATE TRIGGER journal_execution_reconciliation_events_no_delete
BEFORE DELETE ON journal_execution_reconciliation_events BEGIN
  SELECT RAISE(ABORT, 'journal_execution_reconciliation_event_immutable');
END`;

export const journalTradeTrackingAndReconciliationMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0021_journal_trade_tracking_and_reconciliation",
  executionOrder: 21,
  statements: Object.freeze([createTrackingTables, createDecisionActionExtension]),
});
