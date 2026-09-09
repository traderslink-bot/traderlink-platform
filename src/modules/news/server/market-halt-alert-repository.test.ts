import Database from "better-sqlite3";

import type { MarketHalt } from "./market-halt-feed";
import { MarketHaltAlertRepository } from "./market-halt-alert-repository";

function halt(overrides: Partial<MarketHalt> = {}): MarketHalt {
  return Object.freeze({
    haltDateEt: "09/04/2026",
    haltTimeEt: "10:21:15.490",
    issueName: "Example issuer",
    market: "NASDAQ",
    reasonCode: "LUDP",
    reasonDescription: "Volatility Trading Pause",
    resumptionQuoteTimeEt: null,
    resumptionTradeTimeEt: null,
    source: "nasdaq",
    ticker: "ATXG",
    ...overrides,
  });
}

function fixture(): Readonly<{
  database: Database.Database;
  enableRecipient(): void;
  repository: MarketHaltAlertRepository;
}> {
  const database = new Database(":memory:");
  database.exec(`CREATE TABLE news_market_halt_events (
  halt_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  halt_date_et TEXT NOT NULL,
  halt_time_et TEXT NOT NULL,
  ticker TEXT NOT NULL,
  issue_name TEXT NOT NULL,
  market TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  reason_description TEXT NOT NULL,
  resumption_quote_time_et TEXT,
  resumption_trade_time_et TEXT,
  source_url TEXT NOT NULL,
  first_seen_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  UNIQUE (halt_date_et, halt_time_et, ticker)
) STRICT`);
  database.exec(`CREATE TABLE news_market_halt_ticker_day_alert_sequences (
  ticker TEXT NOT NULL, halt_date_et TEXT NOT NULL, first_halt_id TEXT NOT NULL,
  initial_notified_at_utc TEXT NOT NULL, last_notified_quote_time_et TEXT,
  last_notified_trade_time_et TEXT, quote_time_revision INTEGER NOT NULL,
  trade_time_revision INTEGER NOT NULL, ended_at_utc TEXT,
  PRIMARY KEY (ticker, halt_date_et)
) STRICT;
CREATE TABLE news_market_halt_preferences (user_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL) STRICT;
CREATE TABLE news_market_halt_muted_tickers (
  user_id TEXT NOT NULL, ticker TEXT NOT NULL, muted_at_utc TEXT NOT NULL, expires_at_utc TEXT NOT NULL,
  PRIMARY KEY (user_id, ticker)
) STRICT;
CREATE TABLE platform_web_push_subscriptions (
  subscription_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, state TEXT NOT NULL
) STRICT;
CREATE TABLE news_market_halt_push_deliveries (
  delivery_id TEXT PRIMARY KEY, halt_id TEXT NOT NULL, subscription_id TEXT NOT NULL,
  notification_stage TEXT NOT NULL, notification_revision INTEGER NOT NULL,
  notification_title TEXT NOT NULL, notification_body TEXT NOT NULL, state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL, available_at_utc TEXT NOT NULL, last_attempt_at_utc TEXT,
  delivered_at_utc TEXT, failure_code TEXT, created_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL,
  UNIQUE (halt_id, subscription_id, notification_stage, notification_revision)
) STRICT;`);
  const enableRecipient = () => {
    database.prepare(`INSERT INTO news_market_halt_preferences (user_id, enabled) VALUES ('00000000-0000-4000-8000-000000000001', 1)`).run();
    database.prepare(`INSERT INTO platform_web_push_subscriptions (subscription_id, user_id, state)
VALUES ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'active')`).run();
  };
  return Object.freeze({ database, enableRecipient, repository: new MarketHaltAlertRepository(database) });
}

describe("MarketHaltAlertRepository lifecycle reconciliation", () => {
  it("merges ATXG-shaped sparse and revised snapshots into one alert lifecycle", () => {
    const { database, repository } = fixture();
    try {
      const observedAtUtc = "2026-09-04T14:21:00.000Z";
      const first = repository.upsert({
        halt: halt(),
        observedAtUtc,
        sourceUrl: "https://example.test/nasdaq.xml",
      });
      const revised = repository.upsert({
        halt: halt({
          haltTimeEt: "10:22:00.000",
          resumptionQuoteTimeEt: "10:22:00",
          resumptionTradeTimeEt: "10:26:00",
        }),
        observedAtUtc: "2026-09-04T14:22:00.000Z",
        sourceUrl: "https://example.test/nasdaq.xml",
      });

      expect(first.inserted).toBe(true);
      expect(revised).toEqual({ haltId: first.haltId, inserted: false });
      expect(database.prepare(`SELECT halt_time_et, resumption_quote_time_et, resumption_trade_time_et
FROM news_market_halt_events`).all()).toEqual([{
        halt_time_et: "10:21:15.490",
        resumption_quote_time_et: "10:22:00",
        resumption_trade_time_et: "10:26:00",
      }]);
    } finally {
      database.close();
    }
  });

  it("preserves richer lifecycle details for NINI and WLYP-shaped sparse repeats", () => {
    const { database, repository } = fixture();
    try {
      const first = repository.upsert({
        halt: halt({
          resumptionQuoteTimeEt: "10:05:00",
          resumptionTradeTimeEt: "10:10:00",
          ticker: "NINI",
        }),
        observedAtUtc: "2026-09-04T14:05:00.000Z",
        sourceUrl: "https://example.test/nasdaq.xml",
      });
      const sparseRepeat = repository.upsert({
        halt: halt({ haltTimeEt: "10:06:00.000", ticker: "NINI" }),
        observedAtUtc: "2026-09-04T14:06:00.000Z",
        sourceUrl: "https://example.test/nasdaq.xml",
      });

      expect(sparseRepeat).toEqual({ haltId: first.haltId, inserted: false });
      expect(database.prepare(`SELECT resumption_quote_time_et, resumption_trade_time_et
FROM news_market_halt_events WHERE ticker = 'NINI'`).get()).toEqual({
        resumption_quote_time_et: "10:05:00",
        resumption_trade_time_et: "10:10:00",
      });
    } finally {
      database.close();
    }
  });

  it("updates a halt reason without inserting the same exchange event twice", () => {
    const { database, repository } = fixture();
    try {
      const first = repository.upsert({
        halt: halt({ reasonCode: "T1", reasonDescription: "News pending", ticker: "HAO" }),
        observedAtUtc: "2026-09-04T14:21:00.000Z",
        sourceUrl: "https://example.test/nasdaq.xml",
      });
      const revised = repository.upsert({
        halt: halt({ reasonCode: "T2", reasonDescription: "News released", ticker: "HAO" }),
        observedAtUtc: "2026-09-04T14:22:00.000Z",
        sourceUrl: "https://example.test/nasdaq.xml",
      });

      expect(revised).toEqual({ haltId: first.haltId, inserted: false });
      expect(database.prepare(`SELECT source, reason_code, reason_description
FROM news_market_halt_events WHERE ticker = 'HAO'`).get()).toEqual({
        reason_code: "T2",
        reason_description: "News released",
        source: "nasdaq",
      });
    } finally {
      database.close();
    }
  });

  it("merges a secondary exchange copy into the Nasdaq lifecycle", () => {
    const { database, repository } = fixture();
    try {
      const first = repository.upsert({
        halt: halt({ ticker: "RIBBU" }),
        observedAtUtc: "2026-09-04T14:21:00.000Z",
        sourceUrl: "https://example.test/nasdaq.xml",
      });
      const secondary = repository.upsert({
        halt: halt({
          market: "NYSE Arca",
          reasonCode: "NYSE LULD",
          reasonDescription: "Volatility trading pause",
          source: "nyse",
          ticker: "RIBBU",
        }),
        observedAtUtc: "2026-09-04T14:21:30.000Z",
        sourceUrl: "https://example.test/nyse.csv",
      });

      expect(secondary).toEqual({ haltId: first.haltId, inserted: false });
      expect(database.prepare(`SELECT COUNT(*) AS count FROM news_market_halt_events WHERE ticker = 'RIBBU'`).get()).toEqual({ count: 1 });
      expect(database.prepare(`SELECT source, reason_code FROM news_market_halt_events WHERE ticker = 'RIBBU'`).get()).toEqual({
        reason_code: "LUDP",
        source: "nasdaq",
      });
    } finally {
      database.close();
    }
  });

  it("keeps a genuine later halt after resumption as a new lifecycle", () => {
    const { database, repository } = fixture();
    try {
      const first = repository.upsert({
        halt: halt({
          resumptionQuoteTimeEt: "10:22:00",
          resumptionTradeTimeEt: "10:26:00",
          ticker: "WLYP",
        }),
        observedAtUtc: "2026-09-04T14:21:00.000Z",
        sourceUrl: "https://example.test/nasdaq.xml",
      });
      const later = repository.upsert({
        halt: halt({ haltTimeEt: "10:27:00.000", ticker: "WLYP" }),
        observedAtUtc: "2026-09-04T14:27:00.000Z",
        sourceUrl: "https://example.test/nasdaq.xml",
      });

      expect(first.inserted).toBe(true);
      expect(later.inserted).toBe(true);
      expect(later.haltId).not.toBe(first.haltId);
    } finally {
      database.close();
    }
  });
});

describe("MarketHaltAlertRepository daily delivery lifecycle", () => {
  it("sends one staged sequence for the first ticker halt and records a later halt silently", () => {
    const { database, enableRecipient, repository } = fixture();
    try {
      enableRecipient();
      const first = repository.upsert({ halt: halt({ ticker: "FCUV" }), observedAtUtc: "2026-09-04T14:21:00.000Z", sourceUrl: "https://example.test" });
      expect(repository.reconcileDeliveryLifecycle({ haltId: first.haltId, observedAtUtc: "2026-09-04T14:21:00.000Z" })).toBe(1);
      const quote = repository.upsert({ halt: halt({ ticker: "FCUV", resumptionQuoteTimeEt: "10:25:00" }), observedAtUtc: "2026-09-04T14:22:00.000Z", sourceUrl: "https://example.test" });
      expect(repository.reconcileDeliveryLifecycle({ haltId: quote.haltId, observedAtUtc: "2026-09-04T14:22:00.000Z" })).toBe(1);
      const trade = repository.upsert({ halt: halt({ ticker: "FCUV", resumptionQuoteTimeEt: "10:25:00", resumptionTradeTimeEt: "10:30:00" }), observedAtUtc: "2026-09-04T14:23:00.000Z", sourceUrl: "https://example.test" });
      expect(repository.reconcileDeliveryLifecycle({ haltId: trade.haltId, observedAtUtc: "2026-09-04T14:23:00.000Z" })).toBe(1);
      const later = repository.upsert({ halt: halt({ ticker: "FCUV", haltTimeEt: "10:31:00.000" }), observedAtUtc: "2026-09-04T14:31:00.000Z", sourceUrl: "https://example.test" });
      expect(repository.reconcileDeliveryLifecycle({ haltId: later.haltId, observedAtUtc: "2026-09-04T14:31:00.000Z" })).toBe(0);
      expect(database.prepare(`SELECT notification_stage, notification_revision FROM news_market_halt_push_deliveries ORDER BY created_at_utc, notification_stage`).all()).toEqual([
        { notification_stage: "initial", notification_revision: 0 },
        { notification_stage: "quote_time", notification_revision: 1 },
        { notification_stage: "trade_time", notification_revision: 1 },
      ]);
    } finally {
      database.close();
    }
  });

  it("sends only a trade update when both expected times first appear together and ends silently", () => {
    const { database, enableRecipient, repository } = fixture();
    try {
      enableRecipient();
      const initial = repository.upsert({ halt: halt({ ticker: "YMAT" }), observedAtUtc: "2026-09-04T14:21:00.000Z", sourceUrl: "https://example.test" });
      repository.reconcileDeliveryLifecycle({ haltId: initial.haltId, observedAtUtc: "2026-09-04T14:21:00.000Z" });
      const scheduled = repository.upsert({ halt: halt({ ticker: "YMAT", resumptionQuoteTimeEt: "10:25:00", resumptionTradeTimeEt: "10:30:00" }), observedAtUtc: "2026-09-04T14:22:00.000Z", sourceUrl: "https://example.test" });
      expect(repository.reconcileDeliveryLifecycle({ haltId: scheduled.haltId, observedAtUtc: "2026-09-04T14:22:00.000Z" })).toBe(1);
      expect(repository.reconcileDeliveryLifecycle({ haltId: scheduled.haltId, observedAtUtc: "2026-09-04T14:31:00.000Z" })).toBe(0);
      expect(database.prepare(`SELECT notification_stage FROM news_market_halt_push_deliveries ORDER BY created_at_utc, notification_stage`).all()).toEqual([
        { notification_stage: "initial" },
        { notification_stage: "trade_time" },
      ]);
      expect(database.prepare(`SELECT ended_at_utc FROM news_market_halt_ticker_day_alert_sequences WHERE ticker = 'YMAT'`).get()).toEqual({
        ended_at_utc: "2026-09-04T14:31:00.000Z",
      });
    } finally {
      database.close();
    }
  });
});
