import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

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

const channelCheck = `CHECK (channel IN (
  'news_filtered', 'market_cap_under_30m',
  'market_cap_30m_to_50m', 'market_cap_50m_to_100m'
))`;

const sql = `CREATE TABLE news_article_read_receipts (
  article_id TEXT NOT NULL CHECK (
    length(article_id) BETWEEN 1 AND 64 AND instr(article_id, char(0)) = 0
  ),
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  read_at_utc TEXT NOT NULL ${utcCheck("read_at_utc")},
  PRIMARY KEY (article_id, user_id),
  FOREIGN KEY (article_id) REFERENCES news_articles(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) WITHOUT ROWID, STRICT;

CREATE INDEX news_article_read_receipts_user
  ON news_article_read_receipts(user_id, read_at_utc DESC);

CREATE TRIGGER news_article_read_receipts_no_update
BEFORE UPDATE ON news_article_read_receipts BEGIN
  SELECT RAISE(ABORT, 'news_article_read_receipt_immutable');
END;

CREATE TRIGGER news_article_read_receipts_no_delete
BEFORE DELETE ON news_article_read_receipts BEGIN
  SELECT RAISE(ABORT, 'news_article_read_receipt_history_required');
END;

CREATE TABLE news_press_release_push_preferences (
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  channel TEXT NOT NULL ${channelCheck},
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  PRIMARY KEY (user_id, channel),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) WITHOUT ROWID, STRICT;

CREATE TABLE news_press_release_push_deliveries (
  delivery_id TEXT PRIMARY KEY ${uuidCheck("delivery_id")},
  article_id TEXT NOT NULL CHECK (
    length(article_id) BETWEEN 1 AND 64 AND instr(article_id, char(0)) = 0
  ),
  subscription_id TEXT NOT NULL ${uuidCheck("subscription_id")},
  channel TEXT NOT NULL ${channelCheck},
  destination_path TEXT NOT NULL CHECK (
    length(destination_path) BETWEEN 1 AND 512
    AND substr(destination_path, 1, 1) = '/'
    AND substr(destination_path, 1, 2) <> '//'
    AND instr(destination_path, char(92)) = 0
    AND instr(destination_path, '://') = 0
  ),
  notification_title TEXT NOT NULL CHECK (
    length(notification_title) BETWEEN 1 AND 80
    AND instr(notification_title, char(0)) = 0
  ),
  notification_body TEXT NOT NULL CHECK (
    length(notification_body) BETWEEN 1 AND 240
    AND instr(notification_body, char(0)) = 0
  ),
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
  UNIQUE (article_id, subscription_id),
  FOREIGN KEY (article_id) REFERENCES news_articles(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (subscription_id) REFERENCES platform_web_push_subscriptions(subscription_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX news_press_release_push_delivery_queue
  ON news_press_release_push_deliveries(state, available_at_utc, created_at_utc)
  WHERE state IN ('pending', 'sending');

CREATE TRIGGER news_press_release_push_deliveries_guard_update
BEFORE UPDATE ON news_press_release_push_deliveries
WHEN NEW.delivery_id IS NOT OLD.delivery_id
  OR NEW.article_id IS NOT OLD.article_id
  OR NEW.subscription_id IS NOT OLD.subscription_id
  OR NEW.channel IS NOT OLD.channel
  OR NEW.destination_path IS NOT OLD.destination_path
  OR NEW.notification_title IS NOT OLD.notification_title
  OR NEW.notification_body IS NOT OLD.notification_body
  OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc < OLD.updated_at_utc
  OR NEW.attempt_count < OLD.attempt_count
  OR (OLD.state IN ('delivered', 'expired', 'failed') AND NEW.state IS NOT OLD.state)
BEGIN
  SELECT RAISE(ABORT, 'news_press_release_push_delivery_invalid_update');
END;

CREATE TRIGGER news_press_release_push_deliveries_no_delete
BEFORE DELETE ON news_press_release_push_deliveries BEGIN
  SELECT RAISE(ABORT, 'news_press_release_push_delivery_history_required');
END;`;

export const newsPressReleaseDashboardMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0070_news_press_release_dashboard",
  executionOrder: 70,
  statements: Object.freeze([sql]),
});
