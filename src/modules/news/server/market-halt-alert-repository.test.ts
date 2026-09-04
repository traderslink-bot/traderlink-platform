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

function fixture(): Readonly<{ database: Database.Database; repository: MarketHaltAlertRepository }> {
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
  updated_at_utc TEXT NOT NULL
) STRICT`);
  return Object.freeze({ database, repository: new MarketHaltAlertRepository(database) });
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
