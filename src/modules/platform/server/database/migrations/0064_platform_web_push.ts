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

const sql = `ALTER TABLE platform_notification_delivery_preferences
ADD COLUMN web_push_enabled INTEGER NOT NULL DEFAULT 0
CHECK (web_push_enabled IN (0, 1));

CREATE TABLE platform_web_push_subscriptions (
  subscription_id TEXT PRIMARY KEY ${uuidCheck("subscription_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  device_ref TEXT NOT NULL CHECK (
    length(device_ref) = 64 AND device_ref NOT GLOB '*[^0-9a-f]*'
  ),
  endpoint_hash TEXT NOT NULL CHECK (
    length(endpoint_hash) = 64 AND endpoint_hash NOT GLOB '*[^0-9a-f]*'
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
    length(ciphertext) BETWEEN 32 AND 16384
    AND ciphertext NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  authentication_tag TEXT NOT NULL CHECK (
    length(authentication_tag) BETWEEN 16 AND 32
    AND authentication_tag NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  state TEXT NOT NULL CHECK (state IN ('active', 'revoked', 'expired')),
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count BETWEEN 0 AND 1000000),
  last_success_at_utc TEXT ${utcCheck("last_success_at_utc", true)},
  last_failure_at_utc TEXT ${utcCheck("last_failure_at_utc", true)},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  UNIQUE (user_id, device_ref),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX platform_web_push_active_endpoint
  ON platform_web_push_subscriptions(endpoint_hash) WHERE state = 'active';
CREATE INDEX platform_web_push_user_state
  ON platform_web_push_subscriptions(user_id, state, updated_at_utc DESC);

CREATE TABLE platform_web_push_deliveries (
  delivery_id TEXT PRIMARY KEY ${uuidCheck("delivery_id")},
  notification_id TEXT NOT NULL ${uuidCheck("notification_id")},
  subscription_id TEXT NOT NULL ${uuidCheck("subscription_id")},
  state TEXT NOT NULL CHECK (state IN (
    'pending', 'sending', 'delivered', 'expired', 'failed'
  )),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 10),
  available_at_utc TEXT NOT NULL ${utcCheck("available_at_utc")},
  last_attempt_at_utc TEXT ${utcCheck("last_attempt_at_utc", true)},
  delivered_at_utc TEXT ${utcCheck("delivered_at_utc", true)},
  failure_code TEXT CHECK (
    failure_code IS NULL OR (
      length(failure_code) BETWEEN 1 AND 64
      AND failure_code NOT GLOB '*[^a-z0-9_]*'
    )
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  UNIQUE (notification_id, subscription_id),
  FOREIGN KEY (notification_id) REFERENCES platform_notifications(notification_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (subscription_id) REFERENCES platform_web_push_subscriptions(subscription_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX platform_web_push_delivery_queue
  ON platform_web_push_deliveries(state, available_at_utc, created_at_utc)
  WHERE state IN ('pending', 'sending');

CREATE TRIGGER platform_web_push_subscriptions_guard_update
BEFORE UPDATE ON platform_web_push_subscriptions
WHEN NEW.subscription_id IS NOT OLD.subscription_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.device_ref IS NOT OLD.device_ref
  OR NEW.endpoint_hash IS NOT OLD.endpoint_hash
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR NEW.failure_count < OLD.failure_count
BEGIN
  SELECT RAISE(ABORT, 'platform_web_push_subscription_invalid_update');
END;

CREATE TRIGGER platform_web_push_subscriptions_no_delete
BEFORE DELETE ON platform_web_push_subscriptions BEGIN
  SELECT RAISE(ABORT, 'platform_web_push_subscription_history_required');
END;

CREATE TRIGGER platform_web_push_deliveries_guard_update
BEFORE UPDATE ON platform_web_push_deliveries
WHEN NEW.delivery_id IS NOT OLD.delivery_id
  OR NEW.notification_id IS NOT OLD.notification_id
  OR NEW.subscription_id IS NOT OLD.subscription_id
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR NEW.attempt_count < OLD.attempt_count
  OR (OLD.state IN ('delivered', 'expired', 'failed') AND NEW.state IS NOT OLD.state)
BEGIN
  SELECT RAISE(ABORT, 'platform_web_push_delivery_invalid_update');
END;

CREATE TRIGGER platform_web_push_deliveries_no_delete
BEFORE DELETE ON platform_web_push_deliveries BEGIN
  SELECT RAISE(ABORT, 'platform_web_push_delivery_history_required');
END;`;

export const platformWebPushMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0064_platform_web_push",
  executionOrder: 64,
  statements: Object.freeze([sql]),
});
