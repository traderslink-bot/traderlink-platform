import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `CREATE TABLE news_market_halt_ticker_day_alert_sequences (
  ticker TEXT NOT NULL CHECK (length(ticker) BETWEEN 1 AND 24 AND ticker GLOB '[A-Z0-9.-]*'),
  halt_date_et TEXT NOT NULL CHECK (length(halt_date_et) = 10),
  first_halt_id TEXT NOT NULL CHECK (length(first_halt_id) = 36),
  initial_notified_at_utc TEXT NOT NULL CHECK (length(initial_notified_at_utc) = 24),
  last_notified_quote_time_et TEXT,
  last_notified_trade_time_et TEXT,
  quote_time_revision INTEGER NOT NULL DEFAULT 0 CHECK (quote_time_revision >= 0),
  trade_time_revision INTEGER NOT NULL DEFAULT 0 CHECK (trade_time_revision >= 0),
  ended_at_utc TEXT,
  PRIMARY KEY (ticker, halt_date_et),
  UNIQUE (first_halt_id),
  FOREIGN KEY (first_halt_id) REFERENCES news_market_halt_events(halt_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX news_market_halt_events_ticker_day_first
ON news_market_halt_events(ticker, halt_date_et, halt_time_et, first_seen_at_utc, halt_id);

CREATE TABLE news_market_halt_push_deliveries_0121 (
  delivery_id TEXT PRIMARY KEY CHECK (length(delivery_id) = 36),
  halt_id TEXT NOT NULL CHECK (length(halt_id) = 36),
  subscription_id TEXT NOT NULL CHECK (length(subscription_id) = 36),
  notification_stage TEXT NOT NULL CHECK (notification_stage IN ('initial', 'quote_time', 'trade_time')),
  notification_revision INTEGER NOT NULL CHECK (notification_revision >= 0),
  notification_title TEXT NOT NULL CHECK (length(notification_title) BETWEEN 1 AND 120),
  notification_body TEXT NOT NULL CHECK (length(notification_body) BETWEEN 1 AND 240),
  state TEXT NOT NULL CHECK (state IN ('pending', 'sending', 'delivered', 'expired', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 10),
  available_at_utc TEXT NOT NULL CHECK (length(available_at_utc) = 24),
  last_attempt_at_utc TEXT, delivered_at_utc TEXT, failure_code TEXT,
  created_at_utc TEXT NOT NULL CHECK (length(created_at_utc) = 24),
  updated_at_utc TEXT NOT NULL CHECK (length(updated_at_utc) = 24),
  UNIQUE (halt_id, subscription_id, notification_stage, notification_revision),
  FOREIGN KEY (halt_id) REFERENCES news_market_halt_events(halt_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (subscription_id) REFERENCES platform_web_push_subscriptions(subscription_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

WITH legacy_deliveries AS (
  SELECT event.halt_id, MIN(delivery.created_at_utc) AS initial_notified_at_utc,
    MAX(CASE
      WHEN instr(delivery.notification_body, 'Quotes expected at ') > 0
        AND instr(delivery.notification_body, 'Quotes expected at an unposted time ET') = 0
      THEN substr(
        delivery.notification_body,
        instr(delivery.notification_body, 'Quotes expected at ') + length('Quotes expected at '),
        instr(substr(delivery.notification_body, instr(delivery.notification_body, 'Quotes expected at ') + length('Quotes expected at ')), ' ET.') - 1
      )
    END) AS notified_quote_time_et,
    MAX(CASE
      WHEN instr(delivery.notification_body, 'Trading expected at ') > 0
        AND instr(delivery.notification_body, 'Trading expected at an unposted time ET') = 0
      THEN substr(
        delivery.notification_body,
        instr(delivery.notification_body, 'Trading expected at ') + length('Trading expected at '),
        instr(substr(delivery.notification_body, instr(delivery.notification_body, 'Trading expected at ') + length('Trading expected at ')), ' ET.') - 1
      )
    END) AS notified_trade_time_et
  FROM news_market_halt_events event
  JOIN news_market_halt_push_deliveries delivery ON delivery.halt_id = event.halt_id
  GROUP BY event.halt_id
)
INSERT INTO news_market_halt_ticker_day_alert_sequences (
  ticker, halt_date_et, first_halt_id, initial_notified_at_utc,
  last_notified_quote_time_et, last_notified_trade_time_et,
  quote_time_revision, trade_time_revision, ended_at_utc
)
SELECT event.ticker, event.halt_date_et, event.halt_id, legacy.initial_notified_at_utc,
  CASE WHEN event.resumption_quote_time_et = legacy.notified_quote_time_et THEN legacy.notified_quote_time_et END,
  CASE WHEN event.resumption_trade_time_et = legacy.notified_trade_time_et THEN legacy.notified_trade_time_et END,
  0, 0, NULL
FROM news_market_halt_events event
JOIN legacy_deliveries legacy ON legacy.halt_id = event.halt_id
WHERE NOT EXISTS (
  SELECT 1 FROM news_market_halt_events earlier
  WHERE earlier.ticker = event.ticker AND earlier.halt_date_et = event.halt_date_et
    AND (earlier.halt_time_et < event.halt_time_et
      OR (earlier.halt_time_et = event.halt_time_et AND earlier.first_seen_at_utc < event.first_seen_at_utc)
      OR (earlier.halt_time_et = event.halt_time_et AND earlier.first_seen_at_utc = event.first_seen_at_utc AND earlier.halt_id < event.halt_id))
);

INSERT INTO news_market_halt_push_deliveries_0121 (
  delivery_id, halt_id, subscription_id, notification_stage, notification_revision,
  notification_title, notification_body, state, attempt_count, available_at_utc,
  last_attempt_at_utc, delivered_at_utc, failure_code, created_at_utc, updated_at_utc
)
SELECT delivery_id, halt_id, subscription_id, 'initial', 0,
  notification_title, notification_body, state, attempt_count, available_at_utc,
  last_attempt_at_utc, delivered_at_utc, failure_code, created_at_utc, updated_at_utc
FROM news_market_halt_push_deliveries;

DROP TABLE news_market_halt_push_deliveries;
ALTER TABLE news_market_halt_push_deliveries_0121 RENAME TO news_market_halt_push_deliveries;

CREATE INDEX news_market_halt_push_delivery_queue
ON news_market_halt_push_deliveries(state, available_at_utc, created_at_utc)
WHERE state IN ('pending', 'sending');`;

export const newsMarketHaltDeliveryLifecycleMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0121_news_market_halt_delivery_lifecycle",
  executionOrder: 121,
  statements: Object.freeze([sql]),
});
