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
    ${column} IS NULL OR (
      length(${column}) = 24
      AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
    )
  )`;
}

const sql = `CREATE TABLE platform_broker_connections (
  connection_id TEXT PRIMARY KEY ${uuidCheck("connection_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  provider TEXT NOT NULL CHECK (provider = 'moomoo'),
  connection_state TEXT NOT NULL CHECK (connection_state IN (
    'active', 'reauthorization_required', 'revoked'
  )),
  credential_key_version TEXT NOT NULL CHECK (
    length(credential_key_version) BETWEEN 1 AND 64
    AND credential_key_version NOT GLOB '*[^a-zA-Z0-9_-]*'
  ),
  credential_initialization_vector TEXT NOT NULL CHECK (
    length(credential_initialization_vector) BETWEEN 16 AND 32
    AND credential_initialization_vector NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  credential_ciphertext TEXT NOT NULL CHECK (
    length(credential_ciphertext) BETWEEN 1 AND 8192
    AND credential_ciphertext NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  credential_authentication_tag TEXT NOT NULL CHECK (
    length(credential_authentication_tag) BETWEEN 16 AND 32
    AND credential_authentication_tag NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  access_token_expires_at_utc TEXT NOT NULL ${utcCheck("access_token_expires_at_utc")},
  authorized_scopes TEXT NOT NULL CHECK (
    length(authorized_scopes) BETWEEN 1 AND 1000
    AND json_valid(authorized_scopes) AND json_type(authorized_scopes) = 'array'
  ),
  connected_at_utc TEXT NOT NULL ${utcCheck("connected_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  revoked_at_utc TEXT ${utcCheck("revoked_at_utc")},
  CHECK (updated_at_utc >= connected_at_utc),
  CHECK (
    (connection_state = 'revoked' AND revoked_at_utc IS NOT NULL)
    OR (connection_state <> 'revoked' AND revoked_at_utc IS NULL)
  ),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (user_id, workspace_id, provider)
) STRICT;

CREATE INDEX platform_broker_connections_workspace_state
  ON platform_broker_connections(workspace_id, connection_state, updated_at_utc DESC);

CREATE TRIGGER platform_broker_connections_guard_update
BEFORE UPDATE ON platform_broker_connections
WHEN NEW.connection_id IS NOT OLD.connection_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.provider IS NOT OLD.provider
  OR NEW.connected_at_utc IS NOT OLD.connected_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR OLD.connection_state = 'revoked'
BEGIN
  SELECT RAISE(ABORT, 'platform_broker_connection_invalid_update');
END;

CREATE TRIGGER platform_broker_connections_no_delete
BEFORE DELETE ON platform_broker_connections BEGIN
  SELECT RAISE(ABORT, 'platform_broker_connection_history_required');
END;`;

export const platformMoomooConnectionsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0033_platform_moomoo_connections",
  executionOrder: 33,
  statements: Object.freeze([sql]),
});
