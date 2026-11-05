// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import { easternTradingDate, listMarketHaltDashboard } from "./market-halt-dashboard";

let database: Database.Database | null = null;
afterEach(() => { database?.close(); database = null; });

describe("market halt dashboard", () => {
  it("uses the Eastern trading date across the UTC date boundary", () => {
    expect(easternTradingDate(new Date("2026-11-05T02:00:00.000Z"))).toBe("2026-11-04");
  });

  it("shows only today's qualifying persisted halts newest first", () => {
    database = new Database(":memory:");
    database.exec(`CREATE TABLE news_market_halt_events (
      halt_id TEXT, source TEXT, halt_date_et TEXT, halt_time_et TEXT, ticker TEXT,
      market TEXT, reason_code TEXT, reason_description TEXT,
      resumption_quote_time_et TEXT, resumption_trade_time_et TEXT,
      source_url TEXT, updated_at_utc TEXT
    )`);
    const insert = database.prepare(`INSERT INTO news_market_halt_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    insert.run("new", "nasdaq", "11/04/2026", "10:15:00", "NEW", "NASDAQ", "LUDP", "Volatility trading pause", null, "10:20:00", "https://example.com/nasdaq", "2026-11-04T15:15:00.000Z");
    insert.run("old", "nyse", "2026-11-04", "09:45:00", "OLD", "NYSE", "NYSE LULD", "Volatility trading pause", null, null, "https://example.com/nyse", "2026-11-04T14:45:00.000Z");
    insert.run("prior", "nasdaq", "11/03/2026", "15:00:00", "PRIOR", "NASDAQ", "T1", "News pending", null, null, "https://example.com/nasdaq", "2026-11-03T20:00:00.000Z");

    const model = listMarketHaltDashboard(database, new Date("2026-11-04T18:00:00.000Z"));
    expect(model.rows.map((row) => row.ticker)).toEqual(["NEW", "OLD"]);
    expect(model.updatedAtUtc).toBe("2026-11-04T15:15:00.000Z");
  });

  it("does not display resumption times that predate a repeated halt",()=>{
    database = new Database(":memory:");
    database.exec(`CREATE TABLE news_market_halt_events (
      halt_id TEXT, source TEXT, halt_date_et TEXT, halt_time_et TEXT, ticker TEXT,
      market TEXT, reason_code TEXT, reason_description TEXT,
      resumption_quote_time_et TEXT, resumption_trade_time_et TEXT,
      source_url TEXT, updated_at_utc TEXT
    )`);
    database.prepare(`INSERT INTO news_market_halt_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("omh-new", "nasdaq", "2026-11-05", "11:05:57.163", "OMH", "NASDAQ", "LUDP", "Volatility trading pause", "09:31:15", "09:42:18", "https://example.com/nasdaq", "2026-11-05T16:06:00.000Z");

    const [row]=listMarketHaltDashboard(database,new Date("2026-11-05T17:00:00.000Z")).rows;
    expect(row).toMatchObject({ticker:"OMH",haltTimeEt:"11:05:57.163",quoteTimeEt:null,tradeTimeEt:null});
  });
});
