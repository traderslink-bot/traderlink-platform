import "server-only";
import Decimal from "decimal.js";
import type { FloatFact } from "../engine";

const SYMBOL = /^[A-Z][A-Z0-9.-]{0,15}$/u;
const EODHD_MAX_BATCH = 100;
const DEFAULT_FINNHUB_SPACING_MS = 1_050;
type FloatCacheRecord = Readonly<{ tradingDate: string; facts: Readonly<Record<string,FloatFact>>; countries?: Readonly<Record<string,string|null>> }>;
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
function parseCountries(value: unknown, tradingDate: string): Map<string,string|null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Map();
  const record=value as {tradingDate?:unknown;countries?:unknown};
  if(record.tradingDate!==tradingDate || !record.countries || typeof record.countries!=="object" || Array.isArray(record.countries))return new Map();
  return new Map(Object.entries(record.countries).filter((entry):entry is [string,string|null]=>SYMBOL.test(entry[0])&&(entry[1]===null||typeof entry[1]==="string"&&/^[A-Z]{2}$/.test(entry[1]))));
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
    const stored = await this.input.persistence.read(tradingDate);
    const facts = parseCache(stored,tradingDate);
    const countries = parseCountries(stored,tradingDate);
    let missing = [...new Set(symbols)].filter(symbol => !facts.has(symbol)||!countries.has(symbol));
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
          const payload:unknown = await response.json();
          if(payload && typeof payload==="object" && !Array.isArray(payload)){
            const profile=payload as Record<string,unknown>;
            if(typeof profile.ticker==="string"&&profile.ticker.trim().toUpperCase()===symbol){
              const country=typeof profile.country==="string"?profile.country.trim().toUpperCase():"";
              countries.set(symbol,/^[A-Z]{2}$/.test(country)?country:null);
            }
          }
          const shares = finnhubShares(payload,symbol);
          if (shares !== null) facts.set(symbol,{ shares,retrievedAtUtc:new Date(now()).toISOString() });
        } catch { continue; }
      }
    }
    missing = [...new Set(symbols)].filter(symbol => !facts.has(symbol));
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
    await this.input.persistence.write({ tradingDate,facts:Object.freeze(Object.fromEntries(facts)),countries:Object.freeze(Object.fromEntries(countries)) });
    return facts;
  }
}

/** Float enrichment must never hold up the five-second quote observation loop.
 * Return only persisted facts; a missing fact stays missing while one refresh
 * runs in the background. Failed/missing lookups are retried after five minutes.
 */
export class ScannerFloatFeed {
  private pending: Promise<void> | null = null;
  private lastKey: string | null = null;
  private retryAt = 0;
  constructor(private readonly persistence: FloatCachePersistence,
    private readonly refresh: (date: string, symbols: readonly string[]) => Promise<ReadonlyMap<string,FloatFact>>,
    private readonly now: () => number = Date.now) {}
  async readCountries(date:string):Promise<ReadonlyMap<string,string>> {
    return new Map([...parseCountries(await this.persistence.read(date),date)].filter((entry):entry is [string,string]=>entry[1]!==null));
  }
  async read(date: string, symbols: readonly string[]): Promise<ReadonlyMap<string,FloatFact>> {
    const stored=await this.persistence.read(date);
    const facts = parseCache(stored,date);
    const countries = parseCountries(stored,date);
    if (symbols.every(symbol=>facts.has(symbol)&&countries.has(symbol))) return facts;
    const key = `${date}\u0000${symbols.join("\u0000")}`;
    if (!this.pending && (key !== this.lastKey || this.now() >= this.retryAt)) {
      this.lastKey = key;
      this.pending = this.refresh(date,symbols).then(()=>{},()=>{}).finally(()=>{
        this.retryAt = this.now()+300_000;
        this.pending = null;
      });
    }
    return facts;
  }
}
