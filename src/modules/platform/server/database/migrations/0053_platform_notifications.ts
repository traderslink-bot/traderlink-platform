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

const sql = `CREATE TABLE platform_notifications (
  notification_id TEXT PRIMARY KEY ${uuidCheck("notification_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  recipient_user_id TEXT NOT NULL ${uuidCheck("recipient_user_id")},
  journal_account_id TEXT ${uuidCheck("journal_account_id")},
  category TEXT NOT NULL CHECK (category IN (
    'ai_review', 'broker_import', 'chart_update', 'statement_import'
  )),
  kind TEXT NOT NULL CHECK (kind IN (
    'ai_review_ready', 'broker_import_completed', 'broker_import_failed',
    'chart_update_ready', 'statement_import_completed',
    'statement_import_needs_action', 'statement_ai_repair_started',
    'statement_ai_repair_completed', 'statement_ai_repair_failed'
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

CREATE INDEX platform_notifications_recipient_feed
  ON platform_notifications(
    workspace_id, recipient_user_id, occurred_at_utc DESC, notification_id DESC
  );

CREATE TABLE platform_notification_receipts (
  notification_id TEXT NOT NULL ${uuidCheck("notification_id")},
  recipient_user_id TEXT NOT NULL ${uuidCheck("recipient_user_id")},
  read_at_utc TEXT ${utcCheck("read_at_utc", true)},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  PRIMARY KEY (notification_id, recipient_user_id),
  FOREIGN KEY (notification_id) REFERENCES platform_notifications(notification_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (recipient_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_notification_receipts_unread
  ON platform_notification_receipts(recipient_user_id, read_at_utc)
  WHERE read_at_utc IS NULL;

CREATE TABLE platform_notification_delivery_preferences (
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  category TEXT NOT NULL CHECK (category IN (
    'ai_review', 'broker_import', 'chart_update', 'statement_import'
  )),
  discord_dm_enabled INTEGER NOT NULL CHECK (discord_dm_enabled IN (0, 1)),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  PRIMARY KEY (user_id, category),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

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

export const platformNotificationsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0053_platform_notifications",
  executionOrder: 53,
  statements: Object.freeze([sql]),
});
