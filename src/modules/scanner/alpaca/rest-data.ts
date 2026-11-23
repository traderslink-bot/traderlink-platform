import type { AcceptedInput, AcceptedSeriesPublisher, QualifiedInputSeries } from "../../market-data/accepted-series/publisher";
import {easternClock} from "../live/sessions";
import { alpacaCandle, chartSymbol, type Candle } from "./candles";

export const ALPACA_HISTORY_FRAMES = ["1Min", "5Min", "15Min", "1Hour", "4Hour", "1Day"] as const;
export type AlpacaHistoryFrame = typeof ALPACA_HISTORY_FRAMES[number];
type HistoryAdjustment = "split" | "raw";
export const ALPACA_REGULAR_FOUR_HOUR_DATASET = "alpaca-sip:regular-et-0930-4h:v1";
export const ALPACA_NATIVE_DAILY_DATASET = "alpaca-sip:native-et-day:v1";
export type AlpacaHistoryRequest = {
  acceptedEvidence?: true; adjustment?: HistoryAdjustment; sessionMode?: "regular";
  symbol: string; timeframe: AlpacaHistoryFrame; start: number; end: number;
};
export type AlpacaHistoryResult = { basisDate?: string; symbol: string; feed: "sip" | "boats"; adjustment: HistoryAdjustment; bars: Candle[]; complete: boolean; nextPageToken: string | null; acceptedInput?: AcceptedInput };

export function parseHistoryRequest(query: URLSearchParams): AlpacaHistoryRequest {
  const symbol = chartSymbol(query.get("symbol") ?? "");
  const timeframe = query.get("timeframe") as AlpacaHistoryFrame;
  const start = Number(query.get("start")), end = Number(query.get("end"));
  if (!ALPACA_HISTORY_FRAMES.includes(timeframe) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)
    || start <= 0 || end <= start || end > Date.now() + 60_000 || end - start > (timeframe === "1Day" ? 3650 : 180) * 86_400_000) throw Error("invalid_history_request");
  const adjustment = query.get("adjustment");
  const evidence = query.get("acceptedEvidence");
  const session = query.get("sessionMode");
  if (evidence !== null && (evidence !== "1" || adjustment !== null || !["1Day", "4Hour"].includes(timeframe)))
    throw Error("invalid_history_request");
  if (session !== null && (session !== "regular" || evidence !== "1" || timeframe !== "4Hour" ||
    query.getAll("sessionMode").length !== 1)) throw Error("invalid_history_request");
  const rawDays = timeframe === "1Min" ? 1 : timeframe === "1Day" ? 370 : 0;
  if (adjustment !== null && (adjustment !== "raw" || end - start > rawDays * 86_400_000)) {
    throw Error("invalid_history_request");
  }
  return { symbol, timeframe, start, end, ...(evidence === "1" ? { acceptedEvidence: true as const } : {}),
    ...(session === "regular" ? { sessionMode: session } : {}), ...(adjustment === "raw" ? { adjustment } : {}) };
}

/** Attach an acceptance only when it describes the exact normalized bars in this reply. */
export function bindHistoryAcceptance(
  request: AlpacaHistoryRequest,
  history: AlpacaHistoryResult,
  qualified: QualifiedInputSeries | undefined,
  publisher: AcceptedSeriesPublisher,
): AcceptedInput | undefined {
  const exact = exactHistoryAcceptance(request, history, qualified);
  return exact && publisher.publish(exact);
}

/** Check receipt inputs before a single or paired publication. */
export function exactHistoryAcceptance(request: AlpacaHistoryRequest, history: AlpacaHistoryResult,
  qualified: QualifiedInputSeries | undefined): QualifiedInputSeries | undefined {
  if (!request.acceptedEvidence || !qualified || !history.complete || history.nextPageToken !== null ||
    history.feed !== "sip" || history.adjustment !== "split" ||
    request.symbol !== history.symbol || history.symbol !== qualified.symbol ||
    (request.timeframe === "1Day" ? qualified.frame !== "daily" : request.timeframe !== "4Hour" || qualified.frame !== "4h") ||
    (request.sessionMode === "regular" && (qualified.datasetId !== ALPACA_REGULAR_FOUR_HOUR_DATASET ||
      qualified.sessionMode !== "regular")) ||
    qualified.completedThroughMs > request.end ||
    history.bars.length !== qualified.rows.length) return;
  if (history.bars.some(({ time, open, high, low, close, volume }, index) => {
    const [start, end, acceptedOpen, acceptedHigh, acceptedLow, acceptedClose, acceptedVolume] = qualified.rows[index];
    return start < request.start || end > request.end || start !== time * 1_000 || open !== acceptedOpen || high !== acceptedHigh ||
      low !== acceptedLow || close !== acceptedClose || volume !== acceptedVolume;
  })) return;
  return qualified;
}

/** Shared by scanner/Watchlist consumers. Provider keys exist only in the VPS process. */
export class AlpacaRestData {
  private windowStart = Date.now();
  private requests = 0;
  private readonly cache = new Map<string, { at: number; result: AlpacaHistoryResult }>();
  private readonly pending = new Map<string, Promise<AlpacaHistoryResult>>();
  constructor(private readonly credentials: { keyId: string; secretKey: string },
    private readonly transport: typeof fetch = fetch, private readonly feed: "sip" | "boats" = "sip",
    private readonly backgroundHistoryConcurrency: 1 | 2 | 4 = 1) {}
  async get(path: string, parameters: URLSearchParams, signal?: AbortSignal): Promise<unknown> {
    signal?.throwIfAborted();
    if (Date.now() - this.windowStart >= 60_000) { this.windowStart = Date.now(); this.requests = 0; }
    if (++this.requests > 8000) throw Error("busy");
    const url = new URL(path, "https://data.alpaca.markets"); url.search = parameters.toString();
    const timeout = AbortSignal.timeout(20_000);
    const response = await this.transport(url, { headers: { "APCA-API-KEY-ID": this.credentials.keyId, "APCA-API-SECRET-KEY": this.credentials.secretKey },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout, redirect: "error" });
    if (!response.ok) throw Error(response.status === 429 ? "busy" : "provider_unavailable");
    return response.json();
  }
  async history(request: AlpacaHistoryRequest, background = false): Promise<AlpacaHistoryResult> {
    const basisDate=easternClock(Date.now()).date;
    const adjustment = request.adjustment ?? "split";
    const key = JSON.stringify([basisDate, adjustment, request.symbol, request.timeframe, request.start, request.end]);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < 30_000) return cached.result;
    const pending = this.pending.get(key); if (pending) return pending;
    if (this.pending.size >= (background ? this.backgroundHistoryConcurrency : 4)) throw Error("busy");
    const load = async () => {
      const bars = new Map<number, Candle>(); let token: string | null = null;
      for (let page = 0; page < 20; page++) {
        const query = new URLSearchParams({ symbols: request.symbol, timeframe: request.timeframe, start: new Date(request.start).toISOString(), end: new Date(request.end).toISOString(), feed: this.feed, adjustment, sort: "asc", limit: "10000" });
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
      if(easternClock(Date.now()).date!==basisDate)throw Error("adjustment_basis_changed");
      const result: AlpacaHistoryResult = { basisDate, symbol: request.symbol, feed: this.feed, adjustment, bars: [...bars.values()].sort((a, b) => a.time - b.time), complete: !token, nextPageToken: token };
      this.cache.set(key, { at: Date.now(), result });
      while (this.cache.size > 32 || [...this.cache.values()].reduce((sum, value) => sum + value.result.bars.length, 0) > 150_000) this.cache.delete(this.cache.keys().next().value!);
      return result;
    };
    const operation = load().finally(() => this.pending.delete(key)); this.pending.set(key, operation); return operation;
  }
}
