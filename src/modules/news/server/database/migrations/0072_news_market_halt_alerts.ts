import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `CREATE TABLE news_market_halt_preferences (
  user_id TEXT PRIMARY KEY CHECK (length(user_id) = 36),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  updated_at_utc TEXT NOT NULL CHECK (length(updated_at_utc) = 24),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) WITHOUT ROWID, STRICT;

CREATE TABLE news_market_halt_muted_tickers (
  user_id TEXT NOT NULL CHECK (length(user_id) = 36),
  ticker TEXT NOT NULL CHECK (length(ticker) BETWEEN 1 AND 24 AND ticker GLOB '[A-Z0-9.-]*'),
  muted_at_utc TEXT NOT NULL CHECK (length(muted_at_utc) = 24),
  PRIMARY KEY (user_id, ticker),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) WITHOUT ROWID, STRICT;

CREATE TABLE news_market_halt_events (
  halt_id TEXT PRIMARY KEY CHECK (length(halt_id) = 36),
  source TEXT NOT NULL CHECK (source IN ('nasdaq', 'nyse')),
  halt_date_et TEXT NOT NULL CHECK (length(halt_date_et) = 10),
  halt_time_et TEXT NOT NULL CHECK (length(halt_time_et) BETWEEN 8 AND 12),
  ticker TEXT NOT NULL CHECK (length(ticker) BETWEEN 1 AND 24 AND ticker GLOB '[A-Z0-9.-]*'),
  issue_name TEXT NOT NULL CHECK (length(issue_name) BETWEEN 1 AND 240),
  market TEXT NOT NULL CHECK (length(market) BETWEEN 1 AND 32),
  reason_code TEXT NOT NULL CHECK (length(reason_code) BETWEEN 1 AND 64),
  reason_description TEXT NOT NULL CHECK (length(reason_description) BETWEEN 1 AND 240),
  resumption_quote_time_et TEXT,
  resumption_trade_time_et TEXT,
  source_url TEXT NOT NULL CHECK (length(source_url) BETWEEN 1 AND 512),
  first_seen_at_utc TEXT NOT NULL CHECK (length(first_seen_at_utc) = 24),
  updated_at_utc TEXT NOT NULL CHECK (length(updated_at_utc) = 24),
  UNIQUE (halt_date_et, halt_time_et, ticker)
) STRICT;

CREATE TABLE news_market_halt_push_deliveries (
  delivery_id TEXT PRIMARY KEY CHECK (length(delivery_id) = 36),
  halt_id TEXT NOT NULL CHECK (length(halt_id) = 36),
  subscription_id TEXT NOT NULL CHECK (length(subscription_id) = 36),
  notification_title TEXT NOT NULL CHECK (length(notification_title) BETWEEN 1 AND 120),
  notification_body TEXT NOT NULL CHECK (length(notification_body) BETWEEN 1 AND 240),
  state TEXT NOT NULL CHECK (state IN ('pending', 'sending', 'delivered', 'expired', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 10),
  available_at_utc TEXT NOT NULL CHECK (length(available_at_utc) = 24),
  last_attempt_at_utc TEXT, delivered_at_utc TEXT, failure_code TEXT,
  created_at_utc TEXT NOT NULL CHECK (length(created_at_utc) = 24),
  updated_at_utc TEXT NOT NULL CHECK (length(updated_at_utc) = 24),
  UNIQUE (halt_id, subscription_id),
  FOREIGN KEY (halt_id) REFERENCES news_market_halt_events(halt_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (subscription_id) REFERENCES platform_web_push_subscriptions(subscription_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX news_market_halt_push_delivery_queue ON news_market_halt_push_deliveries(state, available_at_utc, created_at_utc) WHERE state IN ('pending', 'sending');`;

export const newsMarketHaltAlertsMigration: PlatformMigration = Object.freeze({ moduleNamespace: "news", migrationId: "0072_news_market_halt_alerts", executionOrder: 72, statements: Object.freeze([sql]) });
