import { alpacaCandle, chartSymbol, type Candle } from "./candles";

export const ALPACA_HISTORY_FRAMES = ["1Min", "5Min", "15Min", "1Hour", "4Hour", "1Day"] as const;
export type AlpacaHistoryFrame = typeof ALPACA_HISTORY_FRAMES[number];
export type AlpacaHistoryRequest = { symbol: string; timeframe: AlpacaHistoryFrame; start: number; end: number };
export type AlpacaHistoryResult = { symbol: string; feed: "sip"; adjustment: "split"; bars: Candle[]; complete: boolean; nextPageToken: string | null };

export function parseHistoryRequest(query: URLSearchParams): AlpacaHistoryRequest {
  const symbol = chartSymbol(query.get("symbol") ?? "");
  const timeframe = query.get("timeframe") as AlpacaHistoryFrame;
  const start = Number(query.get("start")), end = Number(query.get("end"));
  if (!ALPACA_HISTORY_FRAMES.includes(timeframe) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)
    || start <= 0 || end <= start || end > Date.now() + 60_000 || end - start > (timeframe === "1Day" ? 3650 : 180) * 86_400_000) throw Error("invalid_history_request");
  return { symbol, timeframe, start, end };
}

/** Shared by scanner/Watchlist consumers. Provider keys exist only in the VPS process. */
export class AlpacaRestData {
  private windowStart = Date.now();
  private requests = 0;
  private readonly cache = new Map<string, { at: number; result: AlpacaHistoryResult }>();
  private readonly pending = new Map<string, Promise<AlpacaHistoryResult>>();
  constructor(private readonly credentials: { keyId: string; secretKey: string }, private readonly transport: typeof fetch = fetch) {}
  async get(path: string, parameters: URLSearchParams): Promise<unknown> {
    if (Date.now() - this.windowStart >= 60_000) { this.windowStart = Date.now(); this.requests = 0; }
    if (++this.requests > 8000) throw Error("busy");
    const url = new URL(path, "https://data.alpaca.markets"); url.search = parameters.toString();
    const response = await this.transport(url, { headers: { "APCA-API-KEY-ID": this.credentials.keyId, "APCA-API-SECRET-KEY": this.credentials.secretKey }, signal: AbortSignal.timeout(20_000), redirect: "error" });
    if (!response.ok) throw Error(response.status === 429 ? "busy" : "provider_unavailable");
    return response.json();
  }
  async history(request: AlpacaHistoryRequest): Promise<AlpacaHistoryResult> {
    const key = JSON.stringify(request);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < 30_000) return cached.result;
    const pending = this.pending.get(key); if (pending) return pending;
    if (this.pending.size >= 4) throw Error("busy");
    const load = async () => {
      const bars = new Map<number, Candle>(); let token: string | null = null;
      for (let page = 0; page < 20; page++) {
        const query = new URLSearchParams({ symbols: request.symbol, timeframe: request.timeframe, start: new Date(request.start).toISOString(), end: new Date(request.end).toISOString(), feed: "sip", adjustment: "split", sort: "asc", limit: "10000" });
        if (token) query.set("page_token", token);
        const payload = await this.get("/v2/stocks/bars", query) as { bars?: Record<string, unknown[]>; next_page_token?: unknown };
        if (!payload.bars || !Array.isArray(payload.bars[request.symbol] ?? [])) throw Error("provider_unavailable");
        for (const raw of payload.bars[request.symbol] ?? []) {
          const bar = alpacaCandle(raw); if (!bar) throw Error("provider_unavailable");
          if (bar.time * 1000 >= request.start && bar.time * 1000 <= request.end) bars.set(bar.time, bar);
        }
        if (payload.next_page_token !== null && payload.next_page_token !== undefined && typeof payload.next_page_token !== "string") throw Error("provider_unavailable");
        const next = typeof payload.next_page_token === "string" && payload.next_page_token ? payload.next_page_token : null;
        if (next === token && next !== null) throw Error("provider_unavailable");
        token = next;
        if (!token) break;
      }
      const result: AlpacaHistoryResult = { symbol: request.symbol, feed: "sip", adjustment: "split", bars: [...bars.values()].sort((a, b) => a.time - b.time), complete: !token, nextPageToken: token };
      this.cache.set(key, { at: Date.now(), result });
      while (this.cache.size > 32 || [...this.cache.values()].reduce((sum, value) => sum + value.result.bars.length, 0) > 150_000) this.cache.delete(this.cache.keys().next().value!);
      return result;
    };
    const operation = load().finally(() => this.pending.delete(key)); this.pending.set(key, operation); return operation;
  }
}
