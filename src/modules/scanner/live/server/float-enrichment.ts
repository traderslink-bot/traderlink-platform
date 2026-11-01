import "server-only";
import Decimal from "decimal.js";
import type { FloatFact } from "../engine";

const SYMBOL = /^[A-Z][A-Z0-9.-]{0,15}$/u;
const EODHD_MAX_BATCH = 100;
const DEFAULT_FINNHUB_SPACING_MS = 1_050;
type FloatCacheRecord = Readonly<{ tradingDate: string; facts: Readonly<Record<string,FloatFact>> }>;
export type FloatCachePersistence = Readonly<{
  read: (tradingDate: string) => Promise<unknown>;
  write: (record: FloatCacheRecord) => Promise<void>;
}>;

function validFact(value: unknown): value is FloatFact {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const fact = value as FloatFact;
  return Number.isSafeInteger(fact.shares) && fact.shares > 0 && typeof fact.retrievedAtUtc === "string" && Number.isFinite(Date.parse(fact.retrievedAtUtc));
}
function parseCache(value: unknown, tradingDate: string): Map<string,FloatFact> {
  const result = new Map<string,FloatFact>();
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  const record = value as Partial<FloatCacheRecord>;
  if (record.tradingDate !== tradingDate || !record.facts || typeof record.facts !== "object" || Array.isArray(record.facts)) return result;
  for (const [symbol,fact] of Object.entries(record.facts)) if (SYMBOL.test(symbol) && validFact(fact)) result.set(symbol,fact);
  return result;
}
function positiveSafeInteger(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  try {
    const decimal = new Decimal(value);
    if (!decimal.isInteger() || decimal.isZero() || !decimal.isPositive() || decimal.gt(Number.MAX_SAFE_INTEGER)) return null;
    return decimal.toNumber();
  } catch { return null; }
}
function finnhubShares(payload: unknown, symbol: string): number | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const row = payload as Record<string,unknown>;
  if (typeof row.ticker !== "string" || row.ticker.trim().toUpperCase() !== symbol) return null;
  if (typeof row.floatingShare !== "number" && typeof row.floatingShare !== "string") return null;
  try {
    const shares = new Decimal(row.floatingShare).times(1_000_000);
    if (!shares.isInteger() || shares.isZero() || !shares.isPositive() || shares.gt(Number.MAX_SAFE_INTEGER)) return null;
    return shares.toNumber();
  } catch { return null; }
}
function eodhdRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as Record<string,unknown>).data;
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return Object.entries(data as Record<string,unknown>).map(([code,value]) =>
    value && typeof value === "object" && !Array.isArray(value) ? { code,...value as Record<string,unknown> } : null);
}
function parseEodhd(payload: unknown, requested: ReadonlySet<string>, retrievedAtUtc: string): Map<string,FloatFact> {
  const candidates = new Map<string,FloatFact[]>();
  for (const row of eodhdRows(payload)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const value = row as Record<string,unknown>;
    const rawCode = typeof value.code === "string" ? value.code : typeof value.symbol === "string" ? value.symbol : "";
    const symbol = rawCode.trim().toUpperCase().replace(/\.US$/u,"");
    const shares = positiveSafeInteger(value.sharesFloat);
    if (!requested.has(symbol) || shares === null) continue;
    candidates.set(symbol,[...(candidates.get(symbol) ?? []),{ shares,retrievedAtUtc }]);
  }
  const facts = new Map<string,FloatFact>();
  for (const [symbol,matches] of candidates) if (matches.length === 1) facts.set(symbol,matches[0]);
  return facts;
}

export class DailyFloatEnricher {
  constructor(private readonly input: Readonly<{
    finnhubToken?: string;
    eodhdToken?: string;
    persistence: FloatCachePersistence;
    request?: typeof fetch;
    now?: () => number;
    pause?: (milliseconds: number) => Promise<void>;
    finnhubSpacingMs?: number;
  }>) {}
  async load(tradingDate: string, symbols: readonly string[]): Promise<ReadonlyMap<string,FloatFact>> {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(tradingDate) || symbols.length > 4000 || symbols.some(symbol => !SYMBOL.test(symbol))) throw Error("scanner_float_request_invalid");
    const facts = parseCache(await this.input.persistence.read(tradingDate),tradingDate);
    let missing = [...new Set(symbols)].filter(symbol => !facts.has(symbol));
    const request = this.input.request ?? fetch;
    const now = this.input.now ?? Date.now;
    const pause = this.input.pause ?? (milliseconds => new Promise(resolve => setTimeout(resolve,milliseconds)));
    const finnhubToken = this.input.finnhubToken?.trim();
    if (finnhubToken) {
      const spacing = this.input.finnhubSpacingMs ?? DEFAULT_FINNHUB_SPACING_MS;
      for (let index=0; index<missing.length; index+=1) {
        if (index > 0 && spacing > 0) await pause(spacing);
        const symbol = missing[index];
        const endpoint = new URL("https://finnhub.io/api/v1/stock/profile2");
        endpoint.searchParams.set("symbol",symbol);
        endpoint.searchParams.set("token",finnhubToken);
        try {
          const response = await request(endpoint,{ cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15_000) });
          if (!response.ok) continue;
          const shares = finnhubShares(await response.json(),symbol);
          if (shares !== null) facts.set(symbol,{ shares,retrievedAtUtc:new Date(now()).toISOString() });
        } catch { continue; }
      }
      missing = missing.filter(symbol => !facts.has(symbol));
    }
    const eodhdToken = this.input.eodhdToken?.trim();
    if (eodhdToken) for (let index=0; index<missing.length; index+=EODHD_MAX_BATCH) {
      const batch = missing.slice(index,index+EODHD_MAX_BATCH);
      const endpoint = new URL("https://eodhd.com/api/us-quote-delayed");
      endpoint.searchParams.set("s",batch.map(symbol => `${symbol}.US`).join(","));
      endpoint.searchParams.set("fields","sharesFloat");
      endpoint.searchParams.set("api_token",eodhdToken);
      endpoint.searchParams.set("fmt","json");
      try {
        const response = await request(endpoint,{ cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15_000) });
        if (!response.ok) continue;
        const retrievedAtUtc = new Date(now()).toISOString();
        for (const [symbol,fact] of parseEodhd(await response.json(),new Set(batch),retrievedAtUtc)) facts.set(symbol,fact);
      } catch { continue; }
    }
    await this.input.persistence.write({ tradingDate,facts:Object.freeze(Object.fromEntries(facts)) });
    return facts;
  }
}
