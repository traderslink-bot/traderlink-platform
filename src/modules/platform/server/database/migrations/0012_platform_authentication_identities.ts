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

function requiredUtcCheck(column: string): string {
  return utcCheck(column).replace(`${column} IS NULL OR (`, "(");
}

function providerCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*'
  )`;
}

function sha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

const sql = `CREATE TABLE platform_auth_identities (
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  auth_provider TEXT NOT NULL ${providerCheck("auth_provider")},
  auth_subject TEXT NOT NULL CHECK (length(auth_subject) BETWEEN 1 AND 255),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  linked_by_user_id TEXT NOT NULL ${uuidCheck("linked_by_user_id")},
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${requiredUtcCheck("updated_at_utc")},
  last_authenticated_at_utc TEXT ${utcCheck("last_authenticated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  CHECK (
    last_authenticated_at_utc IS NULL
    OR last_authenticated_at_utc >= created_at_utc
  ),
  PRIMARY KEY (auth_provider, auth_subject),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (linked_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE UNIQUE INDEX platform_auth_identities_active_user_provider
  ON platform_auth_identities(user_id, auth_provider)
  WHERE status = 'active';

CREATE INDEX platform_auth_identities_active_user
  ON platform_auth_identities(user_id, auth_provider)
  WHERE status = 'active';

INSERT INTO platform_auth_identities (
  user_id, auth_provider, auth_subject, status, linked_by_user_id,
  created_at_utc, updated_at_utc, last_authenticated_at_utc
)
SELECT user_id, auth_provider, auth_subject, 'active', user_id,
  created_at_utc, updated_at_utc, NULL
FROM platform_users;

CREATE TABLE platform_auth_sessions (
  session_id TEXT PRIMARY KEY ${uuidCheck("session_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  auth_provider TEXT NOT NULL ${providerCheck("auth_provider")},
  auth_subject TEXT NOT NULL CHECK (length(auth_subject) BETWEEN 1 AND 255),
  token_sha256 TEXT NOT NULL UNIQUE ${sha256Check("token_sha256")},
  created_at_utc TEXT NOT NULL ${requiredUtcCheck("created_at_utc")},
  expires_at_utc TEXT NOT NULL ${requiredUtcCheck("expires_at_utc")},
  last_seen_at_utc TEXT NOT NULL ${requiredUtcCheck("last_seen_at_utc")},
  revoked_at_utc TEXT ${utcCheck("revoked_at_utc")},
  CHECK (expires_at_utc > created_at_utc),
  CHECK (last_seen_at_utc >= created_at_utc),
  CHECK (revoked_at_utc IS NULL OR revoked_at_utc >= created_at_utc),
  FOREIGN KEY (auth_provider, auth_subject)
    REFERENCES platform_auth_identities(auth_provider, auth_subject)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX platform_auth_sessions_active_user
  ON platform_auth_sessions(user_id, expires_at_utc DESC, session_id)
  WHERE revoked_at_utc IS NULL;

CREATE TRIGGER platform_auth_identities_valid_update
BEFORE UPDATE ON platform_auth_identities
WHEN NEW.user_id IS NOT OLD.user_id
  OR NEW.auth_provider IS NOT OLD.auth_provider
  OR NEW.auth_subject IS NOT OLD.auth_subject
  OR NEW.linked_by_user_id IS NOT OLD.linked_by_user_id
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR (OLD.status = 'revoked' AND NEW.status <> 'revoked')
BEGIN
  SELECT RAISE(ABORT, 'platform_auth_identity_invalid_update');
END;

CREATE TRIGGER platform_auth_identities_no_delete
BEFORE DELETE ON platform_auth_identities BEGIN
  SELECT RAISE(ABORT, 'platform_auth_identity_immutable');
END;

CREATE TRIGGER platform_auth_sessions_identity_must_be_active
BEFORE INSERT ON platform_auth_sessions
WHEN NOT EXISTS (
  SELECT 1 FROM platform_auth_identities identity
  WHERE identity.auth_provider = NEW.auth_provider
    AND identity.auth_subject = NEW.auth_subject
    AND identity.user_id = NEW.user_id
    AND identity.status = 'active'
)
BEGIN
  SELECT RAISE(ABORT, 'platform_auth_session_identity_inactive');
END`;

export const platformAuthenticationIdentitiesMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "platform",
    migrationId: "0012_platform_authentication_identities",
    executionOrder: 12,
    statements: Object.freeze([sql]),
  });
