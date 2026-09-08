import Database from "better-sqlite3";

import type { MarketHalt } from "../../market-halt-feed";
import { MarketHaltAlertRepository } from "../../market-halt-alert-repository";
import { newsMarketHaltDeliveryLifecycleMigration } from "./0121_news_market_halt_delivery_lifecycle";

function halt(overrides: Partial<MarketHalt> = {}): MarketHalt {
  return Object.freeze({
    haltDateEt: "09/08/2026",
    haltTimeEt: "10:00:00.000",
    issueName: "Example issuer",
    market: "NASDAQ",
    reasonCode: "LUDP",
    reasonDescription: "Volatility trading pause",
    resumptionQuoteTimeEt: null,
    resumptionTradeTimeEt: null,
    source: "nasdaq",
    ticker: "NINI",
    ...overrides,
  });
}

describe("0121 market halt delivery lifecycle migration", () => {
  it("preserves an existing delivery as initial revision zero and anchors its first ticker-day halt", () => {
    const database = new Database(":memory:");
    try {
      database.exec(`CREATE TABLE news_market_halt_events (
  halt_id TEXT PRIMARY KEY, source TEXT NOT NULL, halt_date_et TEXT NOT NULL,
  halt_time_et TEXT NOT NULL, ticker TEXT NOT NULL, issue_name TEXT NOT NULL,
  market TEXT NOT NULL, reason_code TEXT NOT NULL, reason_description TEXT NOT NULL,
  resumption_quote_time_et TEXT, resumption_trade_time_et TEXT, source_url TEXT NOT NULL,
  first_seen_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL
) STRICT;
CREATE TABLE platform_web_push_subscriptions (
  subscription_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, state TEXT NOT NULL
) STRICT;
CREATE TABLE news_market_halt_preferences (user_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL, updated_at_utc TEXT NOT NULL) STRICT;
CREATE TABLE news_market_halt_muted_tickers (
  user_id TEXT NOT NULL, ticker TEXT NOT NULL, muted_at_utc TEXT NOT NULL, expires_at_utc TEXT NOT NULL,
  PRIMARY KEY (user_id, ticker)
) STRICT;
CREATE TABLE news_market_halt_push_deliveries (
  delivery_id TEXT PRIMARY KEY, halt_id TEXT NOT NULL, subscription_id TEXT NOT NULL,
  notification_title TEXT NOT NULL, notification_body TEXT NOT NULL, state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL, available_at_utc TEXT NOT NULL, last_attempt_at_utc TEXT,
  delivered_at_utc TEXT, failure_code TEXT, created_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL,
  UNIQUE (halt_id, subscription_id)
) STRICT;`);
      const firstHaltId = "00000000-0000-4000-8000-000000000001";
      const laterHaltId = "00000000-0000-4000-8000-000000000002";
      const timestamp = "2026-09-08T14:00:00.000Z";
      database.prepare(`INSERT INTO news_market_halt_events VALUES (?, 'nasdaq', '09/08/2026', '09:56:31.640', 'FCUV', 'Example issuer', 'NASDAQ', 'LUDP', 'Volatility trading pause', '10:01:31', '10:06:31', 'https://example.test', ?, ?)`).run(firstHaltId, timestamp, timestamp);
      database.prepare(`INSERT INTO news_market_halt_events VALUES (?, 'nasdaq', '09/08/2026', '10:08:49.173', 'FCUV', 'Example issuer', 'NASDAQ', 'LUDP', 'Volatility trading pause', NULL, NULL, 'https://example.test', ?, ?)`).run(laterHaltId, "2026-09-08T14:08:00.000Z", "2026-09-08T14:08:00.000Z");
      database.prepare(`INSERT INTO news_market_halt_events VALUES ('00000000-0000-4000-8000-000000000020', 'nasdaq', '09/08/2026', '10:00:00.000', 'NINI', 'Example issuer', 'NASDAQ', 'LUDP', 'Volatility trading pause', NULL, NULL, 'https://example.test', ?, ?)`).run(timestamp, timestamp);
      for (const [index, state] of ["pending", "sending", "delivered", "failed", "expired"].entries()) {
        const subscriptionId = `00000000-0000-4000-8000-${(index + 3).toString().padStart(12, "0")}`;
        const deliveryId = `00000000-0000-4000-8000-${(index + 8).toString().padStart(12, "0")}`;
        database.prepare(`INSERT INTO platform_web_push_subscriptions VALUES (?, '00000000-0000-4000-8000-000000000001', 'active')`).run(subscriptionId);
        database.prepare(`INSERT INTO news_market_halt_push_deliveries VALUES (?, ?, ?, 'FCUV halted', 'Quotes expected at 10:01:31 ET. Trading expected at 10:06:31 ET.', ?, 1, ?, ?, ?, NULL, ?, ?)`)
          .run(deliveryId, firstHaltId, subscriptionId, state, timestamp, timestamp, timestamp, timestamp, timestamp);
      }
      database.prepare(`INSERT INTO news_market_halt_preferences VALUES ('00000000-0000-4000-8000-000000000001', 1, ?)`).run(timestamp);
      database.prepare(`INSERT INTO news_market_halt_push_deliveries VALUES ('00000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000003', 'NINI halted', 'Expected quote and trading times have not been posted.', 'pending', 0, ?, NULL, NULL, NULL, ?, ?)`)
        .run(timestamp, timestamp, timestamp);

      for (const statement of newsMarketHaltDeliveryLifecycleMigration.statements) database.exec(statement);

      expect(database.prepare(`SELECT state, notification_stage, notification_revision FROM news_market_halt_push_deliveries
WHERE halt_id = ? ORDER BY state`).all(firstHaltId)).toEqual([
        { state: "delivered", notification_stage: "initial", notification_revision: 0 },
        { state: "expired", notification_stage: "initial", notification_revision: 0 },
        { state: "failed", notification_stage: "initial", notification_revision: 0 },
        { state: "pending", notification_stage: "initial", notification_revision: 0 },
        { state: "sending", notification_stage: "initial", notification_revision: 0 },
      ]);
      expect(database.prepare(`SELECT ticker, halt_date_et, first_halt_id, last_notified_quote_time_et, last_notified_trade_time_et
FROM news_market_halt_ticker_day_alert_sequences`).all()).toEqual([{
        ticker: "FCUV",
        halt_date_et: "09/08/2026",
        first_halt_id: firstHaltId,
        last_notified_quote_time_et: "10:01:31",
        last_notified_trade_time_et: "10:06:31",
      }]);
      const repository = new MarketHaltAlertRepository(database);
      const beforeUnchangedReconciliation = database.prepare(`SELECT count(*) AS count FROM news_market_halt_push_deliveries`).get() as { count: number };
      expect(repository.reconcileDeliveryLifecycle({ haltId: firstHaltId, observedAtUtc: "2026-09-08T14:10:00.000Z" })).toBe(0);
      expect(database.prepare(`SELECT count(*) AS count FROM news_market_halt_push_deliveries`).get()).toEqual(beforeUnchangedReconciliation);
      expect(database.prepare(`SELECT ended_at_utc FROM news_market_halt_ticker_day_alert_sequences WHERE ticker = 'FCUV'`).get()).toEqual({
        ended_at_utc: "2026-09-08T14:10:00.000Z",
      });
      expect(database.prepare(`SELECT state, notification_stage, notification_revision FROM news_market_halt_push_deliveries
WHERE halt_id = ? ORDER BY state`).all(firstHaltId)).toEqual([
        { state: "delivered", notification_stage: "initial", notification_revision: 0 },
        { state: "expired", notification_stage: "initial", notification_revision: 0 },
        { state: "failed", notification_stage: "initial", notification_revision: 0 },
        { state: "pending", notification_stage: "initial", notification_revision: 0 },
        { state: "sending", notification_stage: "initial", notification_revision: 0 },
      ]);
      const revised = repository.upsert({
        halt: halt({ resumptionTradeTimeEt: "10:30:00" }),
        observedAtUtc: "2026-09-08T14:20:00.000Z",
        sourceUrl: "https://example.test",
      });
      expect(repository.reconcileDeliveryLifecycle({ haltId: revised.haltId, observedAtUtc: "2026-09-08T14:20:00.000Z" })).toBe(1);
      expect(database.prepare(`SELECT notification_stage, notification_revision FROM news_market_halt_push_deliveries
WHERE halt_id = ? ORDER BY notification_stage, notification_revision`).all(revised.haltId)).toEqual([
        { notification_stage: "initial", notification_revision: 0 },
        { notification_stage: "trade_time", notification_revision: 1 },
      ]);
    } finally {
      database.close();
    }
  });
});
