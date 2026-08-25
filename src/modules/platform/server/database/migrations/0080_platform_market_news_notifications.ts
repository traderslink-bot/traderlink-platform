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

const sql = `DROP TRIGGER platform_notifications_no_update;
DROP TRIGGER platform_notifications_no_delete;
DROP TRIGGER platform_notification_receipts_guard_update;
DROP TRIGGER platform_notification_receipts_no_delete;
DROP TRIGGER platform_notification_delivery_preferences_guard_update;
DROP TRIGGER platform_notification_delivery_preferences_no_delete;

CREATE TABLE platform_notifications_0080 (
  notification_id TEXT PRIMARY KEY ${uuidCheck("notification_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  recipient_user_id TEXT NOT NULL ${uuidCheck("recipient_user_id")},
  journal_account_id TEXT ${uuidCheck("journal_account_id")},
  category TEXT NOT NULL CHECK (category IN (${categoryCheck})),
  kind TEXT NOT NULL CHECK (kind IN (
    'ai_review_ready', 'ai_review_needs_attention',
    'broker_connection_reauthorization_required',
    'broker_import_completed', 'broker_import_failed', 'chart_update_ready',
    'data_decision_needs_review', 'statement_import_completed',
    'statement_import_needs_action', 'statement_ai_repair_started',
    'statement_ai_repair_completed', 'statement_ai_repair_failed',
    'week_ahead_ready'
  )),
  source_event_key TEXT NOT NULL CHECK (
    length(source_event_key) BETWEEN 1 AND 128
    AND source_event_key NOT GLOB '*[^a-z0-9_-]*'
  ),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 500),
  destination_path TEXT CHECK (
    destination_path IS NULL OR (
      length(destination_path) BETWEEN 1 AND 512
      AND substr(destination_path, 1, 1) = '/'
      AND instr(destination_path, '://') = 0
      AND instr(destination_path, char(10)) = 0
      AND instr(destination_path, char(13)) = 0
    )
  ),
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, recipient_user_id, source_event_key),
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (recipient_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (journal_account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

INSERT INTO platform_notifications_0080 (
  notification_id, workspace_id, recipient_user_id, journal_account_id,
  category, kind, source_event_key, title, summary, destination_path,
  occurred_at_utc, created_at_utc
)
SELECT notification_id, workspace_id, recipient_user_id, journal_account_id,
  category, kind, source_event_key, title, summary, destination_path,
  occurred_at_utc, created_at_utc
FROM platform_notifications;

CREATE TABLE platform_notification_receipts_0080 (
  notification_id TEXT NOT NULL ${uuidCheck("notification_id")},
  recipient_user_id TEXT NOT NULL ${uuidCheck("recipient_user_id")},
  read_at_utc TEXT ${utcCheck("read_at_utc", true)},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  PRIMARY KEY (notification_id, recipient_user_id),
  FOREIGN KEY (notification_id) REFERENCES platform_notifications_0080(notification_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (recipient_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO platform_notification_receipts_0080 (
  notification_id, recipient_user_id, read_at_utc, created_at_utc
)
SELECT notification_id, recipient_user_id, read_at_utc, created_at_utc
FROM platform_notification_receipts;

CREATE TABLE platform_notification_delivery_preferences_0080 (
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  category TEXT NOT NULL CHECK (category IN (${categoryCheck})),
  discord_dm_enabled INTEGER NOT NULL CHECK (discord_dm_enabled IN (0, 1)),
  web_push_enabled INTEGER NOT NULL DEFAULT 0 CHECK (web_push_enabled IN (0, 1)),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  PRIMARY KEY (user_id, category),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO platform_notification_delivery_preferences_0080 (
  user_id, category, discord_dm_enabled, web_push_enabled, updated_at_utc
)
SELECT user_id, category, discord_dm_enabled, web_push_enabled, updated_at_utc
FROM platform_notification_delivery_preferences;

DROP TABLE platform_notification_receipts;
DROP TABLE platform_notification_delivery_preferences;
DROP TABLE platform_notifications;

ALTER TABLE platform_notifications_0080 RENAME TO platform_notifications;
ALTER TABLE platform_notification_receipts_0080 RENAME TO platform_notification_receipts;
ALTER TABLE platform_notification_delivery_preferences_0080 RENAME TO platform_notification_delivery_preferences;

CREATE INDEX platform_notifications_recipient_feed
  ON platform_notifications(
    workspace_id, recipient_user_id, occurred_at_utc DESC, notification_id DESC
  );

CREATE INDEX platform_notification_receipts_unread
  ON platform_notification_receipts(recipient_user_id, read_at_utc)
  WHERE read_at_utc IS NULL;

CREATE TRIGGER platform_notifications_no_update
BEFORE UPDATE ON platform_notifications BEGIN
  SELECT RAISE(ABORT, 'platform_notification_immutable');
END;

CREATE TRIGGER platform_notifications_no_delete
BEFORE DELETE ON platform_notifications BEGIN
  SELECT RAISE(ABORT, 'platform_notification_history_required');
END;

CREATE TRIGGER platform_notification_receipts_guard_update
BEFORE UPDATE ON platform_notification_receipts
WHEN NEW.notification_id IS NOT OLD.notification_id
  OR NEW.recipient_user_id IS NOT OLD.recipient_user_id
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR (OLD.read_at_utc IS NOT NULL AND NEW.read_at_utc IS NOT OLD.read_at_utc)
  OR (NEW.read_at_utc IS NOT NULL AND NEW.read_at_utc < OLD.created_at_utc)
BEGIN
  SELECT RAISE(ABORT, 'platform_notification_receipt_invalid_update');
END;

CREATE TRIGGER platform_notification_receipts_no_delete
BEFORE DELETE ON platform_notification_receipts BEGIN
  SELECT RAISE(ABORT, 'platform_notification_receipt_history_required');
END;

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
END;`;

export const platformMarketNewsNotificationsMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "platform",
    migrationId: "0080_platform_market_news_notifications",
    executionOrder: 80,
    requiresForeignKeysDisabled: true,
    statements: Object.freeze([sql]),
  });
