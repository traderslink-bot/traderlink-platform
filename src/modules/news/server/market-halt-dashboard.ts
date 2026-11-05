import "server-only";

import type Database from "better-sqlite3";

import type { MarketHaltDashboardReadModel, MarketHaltDashboardRow } from "../contracts/market-halt-dashboard-contracts";

type StoredHalt = Readonly<{
  halt_id: string;
  source: "nasdaq" | "nyse";
  halt_date_et: string;
  halt_time_et: string;
  ticker: string;
  market: string;
  reason_code: string;
  reason_description: string;
  resumption_quote_time_et: string | null;
  resumption_trade_time_et: string | null;
  source_url: string;
  updated_at_utc: string;
}>;

export function easternTradingDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function canonicalDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) return value;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  return match ? `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}` : "";
}
function possibleResumptionTime(haltTime: string, resumptionTime: string | null): string | null {
  return resumptionTime&&resumptionTime.slice(0,8)>=haltTime.slice(0,8)?resumptionTime:null;
}

export function listMarketHaltDashboard(
  database: Database.Database,
  now = new Date(),
  limit = 20,
): MarketHaltDashboardReadModel {
  const tradingDate = easternTradingDate(now);
  const stored = database.prepare<[], StoredHalt>(`SELECT halt_id, source, halt_date_et, halt_time_et,
 ticker, market, reason_code, reason_description, resumption_quote_time_et,
 resumption_trade_time_et, source_url, updated_at_utc
FROM news_market_halt_events
ORDER BY updated_at_utc DESC
LIMIT 250`).all();
  const today = stored
    .filter((row) => canonicalDate(row.halt_date_et) === tradingDate)
    .sort((left, right) => right.halt_time_et.localeCompare(left.halt_time_et))
    .slice(0, Math.max(1, Math.min(50, Math.trunc(limit))));
  const rows: readonly MarketHaltDashboardRow[] = Object.freeze(today.map((row) => Object.freeze({
    id: row.halt_id,
    ticker: row.ticker,
    market: row.market,
    haltTimeEt: row.halt_time_et,
    reasonCode: row.reason_code,
    reason: row.reason_description,
    quoteTimeEt: possibleResumptionTime(row.halt_time_et,row.resumption_quote_time_et),
    tradeTimeEt: possibleResumptionTime(row.halt_time_et,row.resumption_trade_time_et),
    source: row.source,
    sourceUrl: row.source_url,
  })));
  return Object.freeze({ tradingDate, updatedAtUtc: today[0]?.updated_at_utc ?? null, rows });
}
