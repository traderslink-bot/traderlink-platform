import { calendarDate } from "../scanner/alpaca/chart-calendar";
import { scannerSnapshotSpacing } from "../scanner/live/server/snapshot-pacing";
import { scannerUniverseSymbolEligible } from "../scanner/live/universe-validation";
import { isObject, tickerPattern, type Listing, type MarketPack, type ScreenerProviderSelection } from "./contracts";

export function parseScreenerMoomooUniverse(value: unknown, selection: ScreenerProviderSelection, date: string) {
  if (!isObject(value) || value.provider !== selection.provider || value.revision !== selection.revision)
    throw Error("screener_provider_changed");
  if (value.tradingDate !== date || !calendarDate(value.sourceTradingDate) || value.sourceTradingDate > date
    || !Array.isArray(value.stocks) || value.stocks.length < 1 || value.stocks.length > 4_000
    || typeof value.spacingMs !== "number") throw Error("screener_universe_invalid");
  const spacingMs = scannerSnapshotSpacing({ NODE_ENV: "development", TRADERLINK_SCANNER_SNAPSHOT_SPACING_MS: String(value.spacingMs) });
  const stocks: Listing[] = [];
  const seen = new Set<string>();
  for (const stock of value.stocks) {
    if (!isObject(stock) || typeof stock.symbol !== "string" || !tickerPattern.test(stock.symbol) || seen.has(stock.symbol)
      || !["NASDAQ", "NYSE", "AMEX"].includes(String(stock.exchange))
      || !Number.isSafeInteger(stock.marketCapAtCollection) || Number(stock.marketCapAtCollection) <= 0)
      throw Error("screener_universe_invalid");
    seen.add(stock.symbol);
    if (Number(stock.marketCapAtCollection) > 200_000_000 || !scannerUniverseSymbolEligible(stock.symbol)) continue;
    stocks.push({ symbol: stock.symbol, name: stock.symbol, exchange: stock.exchange as Listing["exchange"], marketCap: Number(stock.marketCapAtCollection) });
  }
  if (!stocks.length) throw Error("screener_universe_unavailable");
  return { stocks, listingDate: value.sourceTradingDate, partialCaps: value.sourceTradingDate !== date, spacingMs };
}

export type MoomooScreenerOperation = {
  operation: "history"; symbol: string; timeframe: "1Min" | "5Min" | "15Min" | "1Day";
  start: number; end: number; nextTime?: number; pageToken?: string;
} | { operation: "snapshots"; symbols: string[] }
  | { operation: "rehab"; symbol: string }
  | { operation: "calendar"; start: string; end: string };

/** The VPS receives market data. Owner OAuth credentials stay inside Platform. */
export class ScreenerProviderTransport {
  private readonly endpoint: URL;
  private readonly packEndpoint: URL;
  constructor(origin: string, private readonly token: string, private readonly request: typeof fetch = fetch) {
    const url = new URL(origin);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash
      || url.pathname !== "/" || token.length < 32) throw Error("invalid_screener_provider_transport");
    this.endpoint = new URL("/api/internal/market-data?feature=screeners", url);
    this.packEndpoint = new URL("/api/internal/stock-screeners-pack", url);
  }

  private async fetch(url: URL, signal: AbortSignal, body?: unknown) {
    const response = await this.request(url, {
      method: body === undefined ? "GET" : "POST", redirect: "error", cache: "no-store",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.any([signal, AbortSignal.timeout(70_000)]),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw Error(response.status === 409 ? "screener_provider_changed" : "screener_provider_transport_unavailable");
    }
    return response;
  }

  async selection(signal: AbortSignal): Promise<ScreenerProviderSelection> {
    const value: unknown = await (await this.fetch(this.endpoint, signal)).json();
    if (!isObject(value) || !["alpaca", "moomoo"].includes(String(value.provider))
      || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0) throw Error("screener_provider_invalid_selection");
    return { provider: value.provider as ScreenerProviderSelection["provider"], revision: Number(value.revision) };
  }

  async moomoo(selection: ScreenerProviderSelection, operation: MoomooScreenerOperation, signal: AbortSignal): Promise<unknown> {
    if (selection.provider !== "moomoo") throw Error("screener_provider_invalid_selection");
    const value: unknown = await (await this.fetch(this.endpoint, signal, { feature: "screeners", ...selection, ...operation })).json();
    if (!isObject(value) || value.provider !== selection.provider || value.revision !== selection.revision)
      throw Error("screener_provider_changed");
    return value.payload;
  }

  async universe(selection: ScreenerProviderSelection, date: string, signal: AbortSignal) {
    const endpoint = new URL(this.endpoint);
    endpoint.searchParams.set("operation", "universe");
    const value: unknown = await (await this.fetch(endpoint, signal)).json();
    return parseScreenerMoomooUniverse(value, selection, date);
  }

  async publish(pack: MarketPack, selection: ScreenerProviderSelection, signal: AbortSignal, initial = false) {
    await this.fetch(this.packEndpoint, signal, { ...selection, initial, pack: { ...pack, selection } });
  }
}
