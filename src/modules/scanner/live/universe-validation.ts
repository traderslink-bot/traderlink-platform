import { createHash } from "node:crypto";
import type { UniverseStock, UniverseUpload } from "./contracts";

export const MAX_UNIVERSE_ROWS = 4000;
export const MAX_UPLOAD_BYTES = 512_000;
export const MAX_UNIVERSE_MARKET_CAP = 500_000_000;
const SYMBOL = /^[A-Z][A-Z0-9.-]{0,15}$/u;
const WARRANT_SUFFIX = /^[A-Z0-9]{4}W$/u;
export function scannerUniverseSymbolEligible(symbol: string): boolean { return SYMBOL.test(symbol)&&!WARRANT_SUFFIX.test(symbol); }
function fail(reason: string): never { throw new Error("scanner_universe_" + reason); }
export function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value)
    && !Number.isNaN(Date.parse(value + "T00:00:00Z"))
    && new Date(value + "T00:00:00Z").toISOString().slice(0,10) === value;
}
function isoTimestamp(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    && Number.isFinite(Date.parse(value));
}
function cell(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.includes('"')) return trimmed;
  if (!/^"[^"\r\n]*"$/u.test(trimmed)) fail("csv_invalid");
  return trimmed.slice(1,-1).trim();
}
export function parseUniverseCsv(csv: string): readonly UniverseStock[] {
  if (typeof csv !== "string" || Buffer.byteLength(csv) > MAX_UPLOAD_BYTES || csv.includes("\0")) fail("csv_invalid");
  const lines = csv.replace(/^\uFEFF/u,"").trim().split(/\r?\n/u);
  if (lines.length < 2 || lines.length > MAX_UNIVERSE_ROWS + 1
    || lines[0].split(",").map(cell).join(",") !== "symbol,exchange,market_cap") fail("csv_invalid");
  const symbols = new Set<string>();
  return lines.slice(1).map(line => {
    const parts = line.split(",").map(cell);
    if (parts.length !== 3) fail("csv_invalid");
    const [symbol, exchange, cap] = parts;
    if (!SYMBOL.test(symbol) || (exchange !== "NASDAQ" && exchange !== "NYSE" && exchange !== "AMEX")
      || !/^\d+$/u.test(cap)) fail("row_invalid");
    const marketCapAtCollection = Number(cap);
    if (!Number.isSafeInteger(marketCapAtCollection) || marketCapAtCollection <= 0 || marketCapAtCollection > MAX_UNIVERSE_MARKET_CAP) fail("market_cap_invalid");
    if (symbols.has(symbol)) fail("duplicate_symbol");
    symbols.add(symbol);
    return { symbol, exchange: exchange as "NASDAQ" | "NYSE" | "AMEX", marketCapAtCollection };
  }).sort((a,b) => a.symbol.localeCompare(b.symbol));
}
export function validateUniverseUpload(value: unknown, now: number): Readonly<{ input: UniverseUpload; stocks: readonly UniverseStock[]; hash: string }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("request_invalid");
  const input = value as UniverseUpload;
  if (!validDate(input.tradingDate) || typeof input.csv !== "string") fail("request_invalid");
  const meta = input.metadata;
  if (!meta || meta.completeness_status !== "complete" || !["https://stockanalysis.com/stocks/screener/","https://api.nasdaq.com/api/screener/stocks"].includes(meta.source_url)
    || !isoTimestamp(meta.collection_started_at_utc) || !isoTimestamp(meta.collection_finished_at_utc)) fail("metadata_invalid");
  const start = Date.parse(meta.collection_started_at_utc), end = Date.parse(meta.collection_finished_at_utc);
  if (start > end || end > now + 120_000 || now - end > 24*60*60_000) fail("collection_time_invalid");
  const easternDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(end));
  if (easternDate !== input.tradingDate) fail("collection_date_mismatch");
  const filters = meta.applied_filters;
  const expectedCap=meta.source_url === "https://api.nasdaq.com/api/screener/stocks" ? 500_000_000 : 100_000_000;
  if (!filters || filters.market_cap_max !== expectedCap || !Array.isArray(filters.exchanges)
    || ![2,3].includes(filters.exchanges.length) || new Set(filters.exchanges).size !== filters.exchanges.length
    || filters.exchanges.some(exchange => !["NASDAQ","NYSE","AMEX"].includes(exchange))
    || !filters.exchanges.includes("NASDAQ") || !filters.exchanges.includes("NYSE")) fail("filters_invalid");
  const stocks = parseUniverseCsv(input.csv);
  if(stocks.some(stock=>!filters.exchanges.includes(stock.exchange)))fail("filters_invalid");
  if(stocks.some(stock=>stock.marketCapAtCollection>expectedCap))fail("market_cap_invalid");
  if (!Number.isSafeInteger(meta.displayed_total) || meta.displayed_total !== stocks.length
    || meta.extracted_unique_count !== stocks.length) fail("count_mismatch");
  const hash = createHash("sha256").update(JSON.stringify({ tradingDate: input.tradingDate, stocks })).digest("hex");
  return { input, stocks, hash };
}
