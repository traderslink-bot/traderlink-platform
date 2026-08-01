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

const sql = `CREATE TABLE journal_data_decisions (
  decision_id TEXT PRIMARY KEY ${uuidCheck("decision_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  issue_code TEXT NOT NULL ${tokenCheck("issue_code")},
  state TEXT NOT NULL CHECK (state IN ('pending', 'resolved', 'superseded')),
  target_kind TEXT NOT NULL CHECK (
    target_kind IN ('source_issue', 'execution', 'position_fact', 'overlap_set', 'chain')
  ),
  source_issue_id TEXT ${uuidCheck("source_issue_id")},
  execution_id TEXT ${uuidCheck("execution_id")},
  position_fact_id TEXT ${uuidCheck("position_fact_id")},
  overlap_key_sha256 TEXT ${sha256Check("overlap_key_sha256")},
  chain_key_sha256 TEXT ${sha256Check("chain_key_sha256")},
  effect_code TEXT NOT NULL ${tokenCheck("effect_code")},
  revision INTEGER NOT NULL CHECK (revision > 0),
  current_event_id TEXT NOT NULL ${uuidCheck("current_event_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  CHECK (
    (source_issue_id IS NOT NULL) + (execution_id IS NOT NULL)
    + (position_fact_id IS NOT NULL) + (overlap_key_sha256 IS NOT NULL)
    + (chain_key_sha256 IS NOT NULL) = 1
  ),
  CHECK (
    (target_kind = 'source_issue' AND source_issue_id IS NOT NULL)
    OR (target_kind = 'execution' AND execution_id IS NOT NULL)
    OR (target_kind = 'position_fact' AND position_fact_id IS NOT NULL)
    OR (target_kind = 'overlap_set' AND overlap_key_sha256 IS NOT NULL)
    OR (target_kind = 'chain' AND chain_key_sha256 IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, decision_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, source_issue_id) REFERENCES journal_source_row_issues(workspace_id, account_id, source_issue_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, execution_id) REFERENCES journal_executions(workspace_id, account_id, execution_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, position_fact_id) REFERENCES journal_position_facts(workspace_id, account_id, position_fact_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, decision_id, current_event_id) REFERENCES journal_data_decision_events(workspace_id, account_id, decision_id, decision_event_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE UNIQUE INDEX journal_pending_decision_target
  ON journal_data_decisions(
    workspace_id, account_id, target_kind,
    ifnull(source_issue_id, ''), ifnull(execution_id, ''),
    ifnull(position_fact_id, ''), ifnull(overlap_key_sha256, ''),
    ifnull(chain_key_sha256, '')
  )
  WHERE state = 'pending';

CREATE INDEX journal_data_decisions_account_state
  ON journal_data_decisions(workspace_id, account_id, state, effect_code, updated_at_utc);

CREATE TABLE journal_data_decision_events (
  decision_event_id TEXT PRIMARY KEY ${uuidCheck("decision_event_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  decision_id TEXT NOT NULL ${uuidCheck("decision_id")},
  event_sequence INTEGER NOT NULL CHECK (event_sequence > 0),
  action TEXT NOT NULL CHECK (
    action IN (
      'opened', 'correct_execution_fact', 'add_missing_execution',
      'set_execution_order', 'exclude_execution', 'restore_execution',
      'merge_supported_duplicate', 'keep_distinct',
      'supply_opening_inventory', 'correct_position_fact',
      'confirm_legitimate_open_position'
    )
  ),
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('system', 'user')),
  actor_user_id TEXT ${uuidCheck("actor_user_id")},
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  reason_text TEXT CHECK (reason_text IS NULL OR length(reason_text) BETWEEN 1 AND 2000),
  prior_execution_version_id TEXT ${uuidCheck("prior_execution_version_id")},
  resulting_execution_version_id TEXT ${uuidCheck("resulting_execution_version_id")},
  prior_position_fact_id TEXT ${uuidCheck("prior_position_fact_id")},
  resulting_position_fact_id TEXT ${uuidCheck("resulting_position_fact_id")},
  counterpart_execution_id TEXT ${uuidCheck("counterpart_execution_id")},
  resulting_state TEXT NOT NULL CHECK (resulting_state IN ('pending', 'resolved', 'superseded')),
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  CHECK (
    (actor_kind = 'system' AND actor_user_id IS NULL AND action = 'opened')
    OR (actor_kind = 'user' AND actor_user_id IS NOT NULL AND action <> 'opened')
  ),
  UNIQUE (workspace_id, account_id, decision_id, event_sequence),
  UNIQUE (workspace_id, account_id, decision_event_id),
  UNIQUE (workspace_id, account_id, decision_id, decision_event_id),
  FOREIGN KEY (workspace_id, account_id, decision_id) REFERENCES journal_data_decisions(workspace_id, account_id, decision_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, prior_execution_version_id) REFERENCES journal_execution_versions(workspace_id, account_id, execution_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, resulting_execution_version_id) REFERENCES journal_execution_versions(workspace_id, account_id, execution_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, prior_position_fact_id) REFERENCES journal_position_facts(workspace_id, account_id, position_fact_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, resulting_position_fact_id) REFERENCES journal_position_facts(workspace_id, account_id, position_fact_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, counterpart_execution_id) REFERENCES journal_executions(workspace_id, account_id, execution_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_data_decision_events_decision
  ON journal_data_decision_events(workspace_id, account_id, decision_id, event_sequence)`;

export const journalDataDecisionsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0005_journal_data_decisions",
  executionOrder: 5,
  statements: Object.freeze([sql]),
});
