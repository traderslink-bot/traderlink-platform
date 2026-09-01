import "server-only";

import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

export const NASDAQ_TRADE_HALTS_RSS_URL = "https://nasdaqtrader.com/rss.aspx?feed=tradehalts";
export const NYSE_TRADE_HALTS_CSV_URL = "https://www.nyse.com/api/trade-halts/current/download?format=csv";
export type MarketHaltSource = "nasdaq" | "nyse";
export type MarketHaltSourceFailureCode = "connection" | "dns" | "timeout" | "tls";
export type MarketHalt = Readonly<{ haltDateEt: string; haltTimeEt: string; issueName: string; market: string; reasonCode: string; reasonDescription: string; resumptionQuoteTimeEt: string | null; resumptionTradeTimeEt: string | null; source: MarketHaltSource; ticker: string }>;
export type MarketHaltSourceStatus = Readonly<{
  available: boolean;
  failureCode?: MarketHaltSourceFailureCode;
  httpStatus: number | null;
  source: MarketHaltSource;
}>;
export type OfficialMarketHalts = Readonly<{
  halts: readonly MarketHalt[];
  sources: readonly MarketHaltSourceStatus[];
}>;

const nasdaqReasons: Readonly<Record<string, string>> = Object.freeze({ T1: "News pending", T2: "News released", T5: "Single-stock trading pause", T6: "Extraordinary market activity", T12: "Nasdaq requested additional information", LUDP: "Volatility trading pause", LUDS: "Volatility trading pause — straddle condition", M: "Volatility trading pause" });
const nyseReasonMap: readonly [RegExp, string, string][] = Object.freeze([
  [/news pending/i, "NYSE News Pending", "News pending"], [/news dissemination|news released/i, "NYSE News Dissemination", "News released"],
  [/single.stock trading pause/i, "NYSE Single Stock Pause", "Single-stock trading pause"], [/extraordinary market activity/i, "NYSE Extraordinary Market Activity", "Extraordinary market activity"],
  [/information requested/i, "NYSE Information Requested", "Information requested"], [/straddle/i, "NYSE Volatility Pause Straddle", "Volatility trading pause — straddle condition"], [/limit up.limit down|luld|volatility trading pause/i, "NYSE LULD", "Volatility trading pause"],
]);
function clean(value: string): string { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, "$1").replace(/&amp;/gu, "&").replace(/&lt;/gu, "<").replace(/&gt;/gu, ">").replace(/&quot;/gu, '"').replace(/&#39;/gu, "'").replace(/\s+/gu, " ").trim(); }
function xmlTag(item: string, name: string): string | null { const escaped = name.replace(/:/gu, "\\:"); const match = item.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}>`, "iu")); return match ? clean(match[1]) || null : null; }
function validTicker(value: string | null): value is string { return !!value && /^[A-Z0-9.-]{1,24}$/u.test(value); }
function errorCode(value: unknown): string | null { return value && typeof value === "object" && "code" in value && typeof value.code === "string" ? value.code : null; }
function networkFailureCode(error: unknown): MarketHaltSourceFailureCode {
  const code = errorCode(error) ?? (error instanceof Error ? errorCode(error.cause) : null) ?? "";
  if (/DNS|ENOTFOUND|EAI_AGAIN/iu.test(code)) return "dns";
  if (/TIMEOUT|ETIMEDOUT/iu.test(code)) return "timeout";
  if (/CERT|SIGNATURE|TLS/iu.test(code)) return "tls";
  return "connection";
}
function nasdaqHaltRelayConfiguration(): Readonly<{ secret: string; url: string }> | null {
  const url = process.env.NASDAQ_HALT_RELAY_URL?.trim();
  const secret = process.env.NASDAQ_HALT_RELAY_SECRET?.trim();
  return url && secret ? Object.freeze({ secret, url }) : null;
}
export function parseNasdaqTradeHalts(xml: string): readonly MarketHalt[] { return Object.freeze((xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/giu) ?? []).flatMap((item) => { const ticker = xmlTag(item, "ndaq:IssueSymbol"); const haltDateEt = xmlTag(item, "ndaq:HaltDate"); const haltTimeEt = xmlTag(item, "ndaq:HaltTime"); const reasonCode = xmlTag(item, "ndaq:ReasonCode"); const description = reasonCode ? nasdaqReasons[reasonCode] : null; if (!validTicker(ticker) || !haltDateEt || !haltTimeEt || !reasonCode || !description || (reasonCode === "T1" && /^07:50:00(?:\.\d+)?$/u.test(haltTimeEt))) return []; return [Object.freeze({ haltDateEt, haltTimeEt, issueName: xmlTag(item, "ndaq:IssueName") ?? ticker, market: xmlTag(item, "ndaq:Market") ?? "NASDAQ", reasonCode, reasonDescription: description, resumptionQuoteTimeEt: xmlTag(item, "ndaq:ResumptionQuoteTime"), resumptionTradeTimeEt: xmlTag(item, "ndaq:ResumptionTradeTime"), source: "nasdaq" as const, ticker })]; })); }
function csvRows(value: string): readonly string[][] { const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false; for (let index = 0; index < value.length; index++) { const char = value[index]; if (char === '"') { if (quoted && value[index + 1] === '"') { cell += char; index++; } else quoted = !quoted; } else if (char === "," && !quoted) { row.push(clean(cell)); cell = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && value[index + 1] === "\n") index++; row.push(clean(cell)); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; } else cell += char; } row.push(clean(cell)); if (row.some(Boolean)) rows.push(row); return Object.freeze(rows); }
function splitEasternDateTime(value: string): Readonly<{ date: string; time: string }> | null { const match = value.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)/u); if (!match) return null; const [month, day, year] = match[1].includes("/") ? match[1].split("/") : [match[1].slice(5, 7), match[1].slice(8, 10), match[1].slice(0, 4)]; return Object.freeze({ date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`, time: match[2].padStart(8, "0") }); }
export function parseNyseTradeHalts(csv: string): readonly MarketHalt[] { const rows = csvRows(csv); const headers = rows[0]?.map((header) => header.toLowerCase().replace(/[^a-z]/gu, "")) ?? []; const field = (row: readonly string[], ...names: string[]) => { const index = headers.findIndex((header) => names.includes(header)); return index >= 0 ? row[index] ?? "" : ""; }; return Object.freeze(rows.slice(1).flatMap((row) => { const reason = field(row, "reason", "haltreason"); const mapped = nyseReasonMap.find(([pattern]) => pattern.test(reason)); const ticker = field(row, "symbol", "issuesymbol").toUpperCase(); const combined = splitEasternDateTime(field(row, "halt", "haltdatetime", "haltdateandtime")); const haltDateEt = field(row, "haltdate", "date") || combined?.date || ""; const haltTimeEt = field(row, "halttime", "time") || combined?.time || ""; if (!mapped || !validTicker(ticker) || !haltDateEt || !haltTimeEt) return []; return [Object.freeze({ haltDateEt, haltTimeEt, issueName: field(row, "company", "issuename", "name") || ticker, market: field(row, "market", "exchange") || "NYSE", reasonCode: mapped[1], reasonDescription: mapped[2], resumptionQuoteTimeEt: field(row, "quotetime", "resumptionquotetime") || null, resumptionTradeTimeEt: field(row, "resumetime", "resumptiontradetime") || null, source: "nyse" as const, ticker })]; })); }
async function fetchMarketHaltSource(input: Readonly<{
  parse: (body: string) => readonly MarketHalt[];
  source: MarketHaltSource;
  url: string;
}>): Promise<Readonly<{ halts: readonly MarketHalt[]; status: MarketHaltSourceStatus }>> {
  try {
    const response = await fetch(input.url, {
      cache: "no-store",
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, text/csv",
        "User-Agent": "TradersLinkPlatform/1.0",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return Object.freeze({
        halts: Object.freeze([]),
        status: Object.freeze({ available: false, httpStatus: response.status, source: input.source }),
      });
    }
    return Object.freeze({
      halts: input.parse(await response.text()),
      status: Object.freeze({ available: true, httpStatus: response.status, source: input.source }),
    });
  } catch (error) {
    return Object.freeze({
      halts: Object.freeze([]),
      status: Object.freeze({ available: false, failureCode: networkFailureCode(error), httpStatus: null, source: input.source }),
    });
  }
}

async function fetchNasdaqTradeHalts(): Promise<Readonly<{ halts: readonly MarketHalt[]; status: MarketHaltSourceStatus }>> {
  const relay = nasdaqHaltRelayConfiguration();
  if (relay) return fetchNasdaqTradeHaltsThroughRelay(relay);
  try {
    const response = await new Promise<Readonly<{ body: string; statusCode: number }>>((resolve, reject) => {
      const request = httpsRequest(NASDAQ_TRADE_HALTS_RSS_URL, {
        family: 4,
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml",
          "User-Agent": "TradersLinkPlatform/1.0",
        },
        method: "GET",
        timeout: 15_000,
      }, (incoming) => {
        const chunks: Buffer[] = [];
        incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
        incoming.once("error", reject);
        incoming.once("end", () => resolve(Object.freeze({
          body: Buffer.concat(chunks).toString("utf8"),
          statusCode: incoming.statusCode ?? 0,
        })));
      });
      request.once("error", reject);
      request.once("timeout", () => request.destroy(new Error("Nasdaq Trade Halt RSS request timed out.")));
      request.end();
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return Object.freeze({
        halts: Object.freeze([]),
        status: Object.freeze({ available: false, httpStatus: response.statusCode || null, source: "nasdaq" }),
      });
    }
    return Object.freeze({
      halts: parseNasdaqTradeHalts(response.body),
      status: Object.freeze({ available: true, httpStatus: response.statusCode, source: "nasdaq" }),
    });
  } catch (error) {
    return Object.freeze({
      halts: Object.freeze([]),
      status: Object.freeze({ available: false, failureCode: networkFailureCode(error), httpStatus: null, source: "nasdaq" }),
    });
  }
}

async function fetchNasdaqTradeHaltsThroughRelay(input: Readonly<{ secret: string; url: string }>): Promise<Readonly<{ halts: readonly MarketHalt[]; status: MarketHaltSourceStatus }>> {
  try {
    const response = await new Promise<Readonly<{ body: string; statusCode: number }>>((resolve, reject) => {
      const request = httpRequest(input.url, {
        agent: false,
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml",
          Authorization: `Bearer ${input.secret}`,
          Connection: "close",
          "User-Agent": "TradersLinkPlatform/1.0",
        },
        method: "GET",
        timeout: 30_000,
      }, (incoming) => {
        const chunks: Buffer[] = [];
        incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
        incoming.once("error", reject);
        incoming.once("end", () => resolve(Object.freeze({
          body: Buffer.concat(chunks).toString("utf8"),
          statusCode: incoming.statusCode ?? 0,
        })));
      });
      request.once("error", reject);
      request.once("timeout", () => request.destroy(new Error("Nasdaq halt relay request timed out.")));
      request.end();
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return Object.freeze({
        halts: Object.freeze([]),
        status: Object.freeze({ available: false, httpStatus: response.statusCode || null, source: "nasdaq" }),
      });
    }
    return Object.freeze({
      halts: parseNasdaqTradeHalts(response.body),
      status: Object.freeze({ available: true, httpStatus: response.statusCode, source: "nasdaq" }),
    });
  } catch (error) {
    console.warn("nasdaq_halt_relay_request_failed", { code: errorCode(error) });
    return Object.freeze({
      halts: Object.freeze([]),
      status: Object.freeze({ available: false, failureCode: networkFailureCode(error), httpStatus: null, source: "nasdaq" }),
    });
  }
}

export async function fetchOfficialMarketHalts(): Promise<OfficialMarketHalts> {
  const [nasdaq, nyse] = await Promise.all([
    fetchNasdaqTradeHalts(),
    fetchMarketHaltSource({
      parse: parseNyseTradeHalts,
      source: "nyse",
      url: NYSE_TRADE_HALTS_CSV_URL,
    }),
  ]);
  return Object.freeze({
    halts: Object.freeze([...nasdaq.halts, ...nyse.halts]),
    sources: Object.freeze([nasdaq.status, nyse.status]),
  });
}
