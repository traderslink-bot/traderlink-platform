import type { PlatformMigration } from "../platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

const sql = `CREATE TABLE platform_broker_connection_attempts (
  connection_attempt_id TEXT PRIMARY KEY ${uuidCheck("connection_attempt_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  provider TEXT NOT NULL CHECK (provider = 'moomoo'),
  connection_id TEXT ${uuidCheck("connection_id")},
  attempt_channel TEXT NOT NULL CHECK (attempt_channel IN ('authorization', 'reauthorization')),
  outcome TEXT NOT NULL CHECK (outcome IN ('connected', 'failed', 'cancelled')),
  safe_reason_category TEXT CHECK (
    safe_reason_category IS NULL OR (
      length(safe_reason_category) BETWEEN 1 AND 64
      AND safe_reason_category = lower(safe_reason_category)
      AND safe_reason_category NOT GLOB '*[^a-z0-9_-]*'
    )
  ),
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (connection_id) REFERENCES platform_broker_connections(connection_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CHECK (
    (outcome = 'failed' AND safe_reason_category IS NOT NULL)
    OR (outcome <> 'failed' AND safe_reason_category IS NULL)
  )
) STRICT;

CREATE INDEX platform_broker_connection_attempts_user_chronology
  ON platform_broker_connection_attempts(user_id, occurred_at_utc DESC, connection_attempt_id);

CREATE INDEX platform_broker_connection_attempts_workspace_provider
  ON platform_broker_connection_attempts(workspace_id, provider, occurred_at_utc DESC, connection_attempt_id);

CREATE TRIGGER platform_broker_connection_attempts_no_update
BEFORE UPDATE ON platform_broker_connection_attempts BEGIN
  SELECT RAISE(ABORT, 'platform_broker_connection_attempt_immutable');
END;

CREATE TRIGGER platform_broker_connection_attempts_no_delete
BEFORE DELETE ON platform_broker_connection_attempts BEGIN
  SELECT RAISE(ABORT, 'platform_broker_connection_attempt_immutable');
END;

CREATE TABLE platform_user_control_audit_events (
  user_control_audit_event_id TEXT PRIMARY KEY ${uuidCheck("user_control_audit_event_id")},
  actor_user_id TEXT NOT NULL ${uuidCheck("actor_user_id")},
  target_user_id TEXT NOT NULL ${uuidCheck("target_user_id")},
  action TEXT NOT NULL CHECK (action IN ('disable', 'enable', 'sign_out_all')),
  reason_code TEXT NOT NULL CHECK (
    length(reason_code) BETWEEN 1 AND 64
    AND reason_code = lower(reason_code)
    AND reason_code NOT GLOB '*[^a-z0-9_-]*'
  ),
  sessions_revoked INTEGER NOT NULL CHECK (sessions_revoked >= 0),
  resulting_status TEXT NOT NULL CHECK (resulting_status IN ('active', 'disabled')),
  correlation_ref_sha256 TEXT NOT NULL CHECK (
    length(correlation_ref_sha256) = 64
    AND correlation_ref_sha256 = lower(correlation_ref_sha256)
    AND correlation_ref_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (target_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (actor_user_id, correlation_ref_sha256)
) STRICT;

CREATE INDEX platform_user_control_audit_events_target_chronology
  ON platform_user_control_audit_events(target_user_id, created_at_utc DESC, user_control_audit_event_id);

CREATE TRIGGER platform_user_control_audit_events_no_update
BEFORE UPDATE ON platform_user_control_audit_events BEGIN
  SELECT RAISE(ABORT, 'platform_user_control_audit_immutable');
END;

CREATE TRIGGER platform_user_control_audit_events_no_delete
BEFORE DELETE ON platform_user_control_audit_events BEGIN
  SELECT RAISE(ABORT, 'platform_user_control_audit_immutable');
END;`;

export const platformBrokerConnectionAttemptsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0084_platform_broker_connection_attempts",
  executionOrder: 84,
  statements: Object.freeze([sql]),
});
