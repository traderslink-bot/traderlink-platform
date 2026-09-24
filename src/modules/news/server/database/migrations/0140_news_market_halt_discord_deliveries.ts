import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `CREATE TABLE news_market_halt_discord_deliveries (
  delivery_id TEXT PRIMARY KEY CHECK (length(delivery_id) = 36),
  halt_id TEXT NOT NULL CHECK (length(halt_id) = 36),
  channel_id TEXT NOT NULL CHECK (length(channel_id) BETWEEN 1 AND 32 AND channel_id NOT GLOB '*[^0-9]*'),
  notification_stage TEXT NOT NULL CHECK (notification_stage IN ('initial', 'quote_time', 'trade_time')),
  notification_revision INTEGER NOT NULL CHECK (notification_revision >= 0),
  notification_title TEXT NOT NULL CHECK (length(notification_title) BETWEEN 1 AND 120),
  notification_body TEXT NOT NULL CHECK (length(notification_body) BETWEEN 1 AND 500),
  state TEXT NOT NULL CHECK (state IN ('pending', 'sending', 'delivered', 'expired', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  available_at_utc TEXT NOT NULL CHECK (length(available_at_utc) = 24),
  expires_at_utc TEXT NOT NULL CHECK (length(expires_at_utc) = 24),
  blocked_until_utc TEXT,
  last_attempt_at_utc TEXT,
  delivered_at_utc TEXT,
  discord_message_id TEXT,
  failure_code TEXT,
  created_at_utc TEXT NOT NULL CHECK (length(created_at_utc) = 24),
  updated_at_utc TEXT NOT NULL CHECK (length(updated_at_utc) = 24),
  UNIQUE (halt_id, channel_id, notification_stage, notification_revision),
  FOREIGN KEY (halt_id) REFERENCES news_market_halt_events(halt_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX news_market_halt_discord_queue
ON news_market_halt_discord_deliveries(channel_id, created_at_utc, notification_stage, notification_revision)
WHERE state IN ('pending', 'sending');

CREATE INDEX news_market_halt_discord_cooldown
ON news_market_halt_discord_deliveries(channel_id, blocked_until_utc);`;

export const newsMarketHaltDiscordDeliveriesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0140_news_market_halt_discord_deliveries",
  executionOrder: 140,
  statements: Object.freeze([sql]),
});
