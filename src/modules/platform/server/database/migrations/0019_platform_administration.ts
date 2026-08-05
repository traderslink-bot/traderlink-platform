import type { PlatformMigration } from "../platform-migration-contract";

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

const sql = `CREATE TABLE platform_operator_grants (
  operator_grant_id TEXT PRIMARY KEY ${uuidCheck("operator_grant_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  authority_key TEXT NOT NULL CHECK (authority_key = 'journal_administration'),
  operator_role TEXT NOT NULL CHECK (operator_role = 'journal_owner_admin'),
  grant_state TEXT NOT NULL CHECK (grant_state IN ('active', 'revoked')),
  granted_by_kind TEXT NOT NULL CHECK (granted_by_kind IN ('bootstrap_console', 'operator')),
  granted_by_user_id TEXT ${uuidCheck("granted_by_user_id")},
  grant_receipt_sha256 TEXT NOT NULL ${sha256Check("grant_receipt_sha256")},
  recovery_of_grant_id TEXT ${uuidCheck("recovery_of_grant_id")},
  granted_at_utc TEXT NOT NULL ${utcCheck("granted_at_utc")},
  revoked_by_kind TEXT CHECK (revoked_by_kind IN ('bootstrap_console', 'operator')),
  revoked_by_user_id TEXT ${uuidCheck("revoked_by_user_id")},
  revoked_reason_code TEXT ${tokenCheck("revoked_reason_code")},
  revoked_at_utc TEXT ${utcCheck("revoked_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (
    (granted_by_kind = 'bootstrap_console' AND granted_by_user_id IS NULL)
    OR (granted_by_kind = 'operator' AND granted_by_user_id IS NOT NULL)
  ),
  CHECK (
    (grant_state = 'active' AND revoked_by_kind IS NULL
      AND revoked_by_user_id IS NULL AND revoked_reason_code IS NULL
      AND revoked_at_utc IS NULL)
    OR (grant_state = 'revoked' AND revoked_by_kind IS NOT NULL
      AND revoked_reason_code IS NOT NULL AND revoked_at_utc IS NOT NULL
      AND ((revoked_by_kind = 'bootstrap_console' AND revoked_by_user_id IS NULL)
        OR (revoked_by_kind = 'operator' AND revoked_by_user_id IS NOT NULL)))
  ),
  CHECK (updated_at_utc >= granted_at_utc),
  CHECK (revoked_at_utc IS NULL OR (revoked_at_utc >= granted_at_utc AND updated_at_utc = revoked_at_utc)),
  UNIQUE (authority_key, operator_grant_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (granted_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (revoked_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (recovery_of_grant_id) REFERENCES platform_operator_grants(operator_grant_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX platform_operator_grants_single_active_authority
  ON platform_operator_grants(authority_key)
  WHERE grant_state = 'active';

CREATE INDEX platform_operator_grants_user_history
  ON platform_operator_grants(user_id, granted_at_utc DESC, operator_grant_id);

CREATE TRIGGER platform_operator_grants_guard_update
BEFORE UPDATE ON platform_operator_grants
WHEN OLD.grant_state <> 'active'
  OR NEW.grant_state <> 'revoked'
  OR NEW.operator_grant_id IS NOT OLD.operator_grant_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.authority_key IS NOT OLD.authority_key
  OR NEW.operator_role IS NOT OLD.operator_role
  OR NEW.granted_by_kind IS NOT OLD.granted_by_kind
  OR NEW.granted_by_user_id IS NOT OLD.granted_by_user_id
  OR NEW.grant_receipt_sha256 IS NOT OLD.grant_receipt_sha256
  OR NEW.recovery_of_grant_id IS NOT OLD.recovery_of_grant_id
  OR NEW.granted_at_utc IS NOT OLD.granted_at_utc
BEGIN
  SELECT RAISE(ABORT, 'platform_operator_grant_transition_invalid');
END;

CREATE TRIGGER platform_operator_grants_no_delete
BEFORE DELETE ON platform_operator_grants BEGIN
  SELECT RAISE(ABORT, 'platform_operator_grant_immutable');
END;

CREATE TABLE platform_admin_audit_events (
  audit_event_id TEXT PRIMARY KEY ${uuidCheck("audit_event_id")},
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('bootstrap_console', 'platform_user', 'system')),
  actor_user_id TEXT ${uuidCheck("actor_user_id")},
  actor_role TEXT NOT NULL CHECK (actor_role IN (
    'bootstrap_console', 'journal_owner_admin',
    'development_journal_owner_admin', 'authenticated_user', 'system'
  )),
  action TEXT NOT NULL CHECK (action IN (
    'operator_grant_previewed', 'operator_granted', 'operator_recovered',
    'operator_revoked', 'admin_access_allowed', 'admin_access_denied',
    'user_detail_accessed', 'import_detail_accessed',
    'statement_format_transitioned', 'statement_format_merged',
    'developer_package_created', 'consented_source_downloaded',
    'support_consent_granted', 'support_consent_revoked',
    'operational_receipt_recorded'
  )),
  target_kind TEXT NOT NULL CHECK (target_kind IN (
    'authority', 'user', 'import', 'statement_format', 'support_source', 'system', 'none'
  )),
  target_ref_sha256 TEXT ${sha256Check("target_ref_sha256")},
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'denied', 'failed')),
  reason_code TEXT NOT NULL ${tokenCheck("reason_code")},
  correlation_ref_sha256 TEXT NOT NULL ${sha256Check("correlation_ref_sha256")},
  preview_receipt_sha256 TEXT ${sha256Check("preview_receipt_sha256")},
  details_json TEXT NOT NULL CHECK (
    length(details_json) BETWEEN 2 AND 4000
    AND json_valid(details_json) AND json_type(details_json) = 'object'
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (actor_kind = 'platform_user' AND actor_user_id IS NOT NULL
      AND actor_role IN ('journal_owner_admin', 'development_journal_owner_admin', 'authenticated_user'))
    OR (actor_kind = 'bootstrap_console' AND actor_user_id IS NULL AND actor_role = 'bootstrap_console')
    OR (actor_kind = 'system' AND actor_user_id IS NULL AND actor_role = 'system')
  ),
  CHECK (
    (target_kind = 'none' AND target_ref_sha256 IS NULL)
    OR (target_kind <> 'none' AND target_ref_sha256 IS NOT NULL)
  ),
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX platform_admin_audit_events_chronology
  ON platform_admin_audit_events(created_at_utc DESC, audit_event_id);

CREATE INDEX platform_admin_audit_events_action_outcome
  ON platform_admin_audit_events(action, outcome, created_at_utc DESC, audit_event_id);

CREATE INDEX platform_admin_audit_events_actor
  ON platform_admin_audit_events(actor_user_id, created_at_utc DESC, audit_event_id)
  WHERE actor_user_id IS NOT NULL;

CREATE TRIGGER platform_admin_audit_events_no_update
BEFORE UPDATE ON platform_admin_audit_events BEGIN
  SELECT RAISE(ABORT, 'platform_admin_audit_event_immutable');
END;

CREATE TRIGGER platform_admin_audit_events_no_delete
BEFORE DELETE ON platform_admin_audit_events BEGIN
  SELECT RAISE(ABORT, 'platform_admin_audit_event_immutable');
END;

CREATE TABLE platform_operational_events (
  operational_event_id TEXT PRIMARY KEY ${uuidCheck("operational_event_id")},
  operation_kind TEXT NOT NULL CHECK (operation_kind IN (
    'backup', 'restore', 'integrity', 'startup', 'deployment', 'background_job'
  )),
  operation_ref_sha256 TEXT NOT NULL ${sha256Check("operation_ref_sha256")},
  state TEXT NOT NULL CHECK (state IN ('started', 'completed', 'failed', 'unavailable')),
  outcome_code TEXT NOT NULL ${tokenCheck("outcome_code")},
  application_version TEXT CHECK (
    application_version IS NULL OR (
      length(application_version) BETWEEN 1 AND 120
      AND instr(application_version, char(0)) = 0
    )
  ),
  safe_counts_json TEXT NOT NULL CHECK (
    length(safe_counts_json) BETWEEN 2 AND 4000
    AND json_valid(safe_counts_json) AND json_type(safe_counts_json) = 'object'
  ),
  evidence_sha256 TEXT ${sha256Check("evidence_sha256")},
  started_at_utc TEXT NOT NULL ${utcCheck("started_at_utc")},
  completed_at_utc TEXT ${utcCheck("completed_at_utc")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (state = 'started' AND completed_at_utc IS NULL)
    OR (state IN ('completed', 'failed', 'unavailable') AND completed_at_utc IS NOT NULL)
  ),
  CHECK (completed_at_utc IS NULL OR completed_at_utc >= started_at_utc),
  UNIQUE (operation_kind, operation_ref_sha256, state)
) STRICT;

CREATE INDEX platform_operational_events_kind_chronology
  ON platform_operational_events(operation_kind, created_at_utc DESC, operational_event_id);

CREATE INDEX platform_operational_events_state_chronology
  ON platform_operational_events(state, created_at_utc DESC, operational_event_id);

CREATE TRIGGER platform_operational_events_no_update
BEFORE UPDATE ON platform_operational_events BEGIN
  SELECT RAISE(ABORT, 'platform_operational_event_immutable');
END;

CREATE TRIGGER platform_operational_events_no_delete
BEFORE DELETE ON platform_operational_events BEGIN
  SELECT RAISE(ABORT, 'platform_operational_event_immutable');
END`;

export const platformAdministrationMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0019_platform_administration",
  executionOrder: 19,
  statements: Object.freeze([sql]),
});
