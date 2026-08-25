import type { PlatformMigration } from "../platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string, nullable = false): string {
  const value = `length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${value}${nullable ? ")" : ")"})`;
}

const categoryCheck = `'ai_review', 'broker_connection', 'broker_import', 'chart_update',
    'data_decision', 'statement_import', 'market_news'`;

const sql = `DROP TRIGGER platform_notification_delivery_preferences_guard_update;
DROP TRIGGER platform_notification_delivery_preferences_no_delete;

CREATE TABLE platform_notification_delivery_preferences_0083 (
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  category TEXT NOT NULL CHECK (category IN (${categoryCheck})),
  discord_dm_enabled INTEGER NOT NULL CHECK (discord_dm_enabled IN (0, 1)),
  web_push_enabled INTEGER NOT NULL DEFAULT 0 CHECK (web_push_enabled IN (0, 1)),
  email_enabled INTEGER NOT NULL DEFAULT 0 CHECK (email_enabled IN (0, 1)),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  PRIMARY KEY (user_id, category),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO platform_notification_delivery_preferences_0083 (
  user_id, category, discord_dm_enabled, web_push_enabled, email_enabled,
  updated_at_utc
)
SELECT user_id, category, discord_dm_enabled, web_push_enabled, 0, updated_at_utc
FROM platform_notification_delivery_preferences;

DROP TABLE platform_notification_delivery_preferences;
ALTER TABLE platform_notification_delivery_preferences_0083
  RENAME TO platform_notification_delivery_preferences;

CREATE TRIGGER platform_notification_delivery_preferences_guard_update
BEFORE UPDATE ON platform_notification_delivery_preferences
WHEN NEW.user_id IS NOT OLD.user_id
  OR NEW.category IS NOT OLD.category
  OR NEW.updated_at_utc < OLD.updated_at_utc
BEGIN
  SELECT RAISE(ABORT, 'platform_notification_preference_invalid_update');
END;

CREATE TRIGGER platform_notification_delivery_preferences_no_delete
BEFORE DELETE ON platform_notification_delivery_preferences BEGIN
  SELECT RAISE(ABORT, 'platform_notification_preference_history_required');
END;

CREATE TABLE platform_notification_email_addresses (
  email_address_id TEXT PRIMARY KEY ${uuidCheck("email_address_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  address_hash TEXT NOT NULL CHECK (
    length(address_hash) = 64 AND address_hash NOT GLOB '*[^0-9a-f]*'
  ),
  key_version TEXT NOT NULL CHECK (
    length(key_version) BETWEEN 1 AND 64
    AND key_version NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  initialization_vector TEXT NOT NULL CHECK (
    length(initialization_vector) BETWEEN 16 AND 32
    AND initialization_vector NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  ciphertext TEXT NOT NULL CHECK (
    length(ciphertext) BETWEEN 4 AND 2048
    AND ciphertext NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  authentication_tag TEXT NOT NULL CHECK (
    length(authentication_tag) BETWEEN 16 AND 32
    AND authentication_tag NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  state TEXT NOT NULL CHECK (state IN (
    'pending_confirmation', 'confirmed', 'superseded', 'disabled'
  )),
  confirmation_token_sha256 TEXT CHECK (
    confirmation_token_sha256 IS NULL OR (
      length(confirmation_token_sha256) = 64
      AND confirmation_token_sha256 NOT GLOB '*[^0-9a-f]*'
    )
  ),
  confirmation_expires_at_utc TEXT ${utcCheck("confirmation_expires_at_utc", true)},
  confirmed_at_utc TEXT ${utcCheck("confirmed_at_utc", true)},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX platform_notification_email_address_pending_user
  ON platform_notification_email_addresses(user_id)
  WHERE state = 'pending_confirmation';
CREATE UNIQUE INDEX platform_notification_email_address_confirmed_user
  ON platform_notification_email_addresses(user_id)
  WHERE state = 'confirmed';
CREATE INDEX platform_notification_email_address_user_history
  ON platform_notification_email_addresses(user_id, updated_at_utc DESC);

CREATE TABLE platform_notification_remote_deliveries (
  delivery_id TEXT PRIMARY KEY ${uuidCheck("delivery_id")},
  notification_id TEXT NOT NULL ${uuidCheck("notification_id")},
  recipient_user_id TEXT NOT NULL ${uuidCheck("recipient_user_id")},
  channel TEXT NOT NULL CHECK (channel IN ('discord_dm', 'email')),
  target_ref TEXT NOT NULL ${uuidCheck("target_ref")},
  state TEXT NOT NULL CHECK (state IN (
    'pending', 'sending', 'delivered', 'failed', 'cancelled'
  )),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  available_at_utc TEXT NOT NULL ${utcCheck("available_at_utc")},
  last_attempt_at_utc TEXT ${utcCheck("last_attempt_at_utc", true)},
  delivered_at_utc TEXT ${utcCheck("delivered_at_utc", true)},
  provider_message_id TEXT CHECK (length(provider_message_id) BETWEEN 1 AND 255),
  failure_code TEXT CHECK (
    failure_code IS NULL OR (
      length(failure_code) BETWEEN 1 AND 64
      AND failure_code NOT GLOB '*[^a-z0-9_]*'
    )
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  UNIQUE (notification_id, channel, target_ref),
  FOREIGN KEY (notification_id) REFERENCES platform_notifications(notification_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (recipient_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX platform_notification_remote_delivery_queue
  ON platform_notification_remote_deliveries(state, available_at_utc, created_at_utc)
  WHERE state IN ('pending', 'sending');

CREATE TRIGGER platform_notification_email_addresses_guard_update
BEFORE UPDATE ON platform_notification_email_addresses
WHEN NEW.email_address_id IS NOT OLD.email_address_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.address_hash IS NOT OLD.address_hash
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR (OLD.state IN ('superseded', 'disabled') AND NEW.state IS NOT OLD.state)
BEGIN
  SELECT RAISE(ABORT, 'platform_notification_email_address_invalid_update');
END;

CREATE TRIGGER platform_notification_email_addresses_no_delete
BEFORE DELETE ON platform_notification_email_addresses BEGIN
  SELECT RAISE(ABORT, 'platform_notification_email_address_history_required');
END;

CREATE TRIGGER platform_notification_remote_deliveries_guard_update
BEFORE UPDATE ON platform_notification_remote_deliveries
WHEN NEW.delivery_id IS NOT OLD.delivery_id
  OR NEW.notification_id IS NOT OLD.notification_id
  OR NEW.recipient_user_id IS NOT OLD.recipient_user_id
  OR NEW.channel IS NOT OLD.channel
  OR NEW.target_ref IS NOT OLD.target_ref
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR NEW.attempt_count < OLD.attempt_count
  OR (OLD.state IN ('delivered', 'failed', 'cancelled') AND NEW.state IS NOT OLD.state)
BEGIN
  SELECT RAISE(ABORT, 'platform_notification_remote_delivery_invalid_update');
END;

CREATE TRIGGER platform_notification_remote_deliveries_no_delete
BEFORE DELETE ON platform_notification_remote_deliveries BEGIN
  SELECT RAISE(ABORT, 'platform_notification_remote_delivery_history_required');
END;`;

export const platformNotificationRemoteDeliveryMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0083_platform_notification_remote_delivery",
  executionOrder: 83,
  statements: Object.freeze([sql]),
});
