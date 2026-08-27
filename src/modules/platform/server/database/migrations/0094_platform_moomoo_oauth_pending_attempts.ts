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

const sql = `CREATE TABLE platform_moomoo_oauth_pending_attempts (
  pending_attempt_id TEXT PRIMARY KEY ${uuidCheck("pending_attempt_id")},
  state_sha256 TEXT NOT NULL UNIQUE CHECK (
    length(state_sha256) = 64 AND state_sha256 = lower(state_sha256)
    AND state_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  platform_session_id TEXT ${uuidCheck("platform_session_id")},
  attempt_state TEXT NOT NULL CHECK (attempt_state IN ('pending', 'consumed')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  expires_at_utc TEXT NOT NULL ${utcCheck("expires_at_utc")},
  consumed_at_utc TEXT ${utcCheck("consumed_at_utc")},
  CHECK (expires_at_utc > created_at_utc),
  CHECK (
    (attempt_state = 'pending' AND consumed_at_utc IS NULL)
    OR (attempt_state = 'consumed' AND consumed_at_utc IS NOT NULL)
  ),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (platform_session_id) REFERENCES platform_auth_sessions(session_id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;

CREATE INDEX platform_moomoo_oauth_pending_attempts_pending_expiry
  ON platform_moomoo_oauth_pending_attempts(attempt_state, expires_at_utc, pending_attempt_id);

CREATE TRIGGER platform_moomoo_oauth_pending_attempts_guard_update
BEFORE UPDATE ON platform_moomoo_oauth_pending_attempts
WHEN NEW.pending_attempt_id IS NOT OLD.pending_attempt_id
  OR NEW.state_sha256 IS NOT OLD.state_sha256
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.platform_session_id IS NOT OLD.platform_session_id
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.expires_at_utc IS NOT OLD.expires_at_utc
  OR OLD.attempt_state <> 'pending'
  OR NEW.attempt_state <> 'consumed'
  OR NEW.consumed_at_utc IS NULL
BEGIN
  SELECT RAISE(ABORT, 'platform_moomoo_oauth_pending_attempt_invalid_update');
END;`;

export const platformMoomooOAuthPendingAttemptsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0094_platform_moomoo_oauth_pending_attempts",
  executionOrder: 94,
  statements: Object.freeze([sql]),
});
