"use client";

import type { Candle } from "@/src/modules/scanner/alpaca/candles";
import { readChartArchivePage, type ChartArchiveWindow } from "@/src/modules/scanner/alpaca/chart-archive-history";
// Page-local only: neither a cross-user cache nor an additional provider connection.
type SharedStream = {
  source: EventSource;
  clients: Set<ChartStreamHandle>;
  latest: Map<string, MessageEvent>;
  keepDuringTransition: boolean;
  idleClose?: ReturnType<typeof setTimeout>;
};
const streams = new Map<string, SharedStream>();
const eventTypes = ["status", "price", "bar", "trading-status", "chart-correction", "history-correction", "overnight-status", "overnight-price", "overnight-bar"];
const DAILY_STREAM_HANDOFF_MS = 1_000;
export class ChartStreamHandle extends EventTarget {
  onerror: ((event: Event) => void) | null = null;
  private closed = false;
  constructor(private readonly url: string, private readonly shared: SharedStream) { super(); }
  reconnectIfClosed() {
    if (!this.closed && this.shared.source.readyState === EventSource.CLOSED) connectStream(this.url, this.shared);
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.shared.clients.delete(this);
    if (this.shared.clients.size) return;
    const release = () => {
      this.shared.idleClose = undefined;
      if (this.shared.clients.size || streams.get(this.url) !== this.shared) return;
      this.shared.source.close();
      streams.delete(this.url);
    };
    // Daily-based views replace the renderer together. Keep the current bar and connection during that handoff.
    if (this.shared.keepDuringTransition) this.shared.idleClose = setTimeout(release, DAILY_STREAM_HANDOFF_MS);
    else release();
  }
}
function connectStream(url: string, current: SharedStream, source = new EventSource(url)) {
  current.source = source;
  current.latest.clear();
  for (const type of eventTypes) source.addEventListener(type, event => {
    if (current.source !== source) return;
    const message = event as MessageEvent;
    let key = type;
    if (type === "chart-correction") {
      try { key = type + ":" + JSON.parse(message.data).minute; } catch { return; }
      while (current.latest.size > 1000) current.latest.delete(current.latest.keys().next().value!);
    }
    current.latest.set(key, message);
    for (const client of current.clients) client.dispatchEvent(new MessageEvent(type, { data: message.data }));
  });
  source.onerror = event => {
    if (current.source !== source) return;
    current.latest.clear();
    for (const client of current.clients) client.onerror?.(event);
  };
}
export function sharedChartStream(url: string, keepDuringTransition = false): ChartStreamHandle {
  let shared = streams.get(url);
  if (!shared) {
    const source = new EventSource(url);
    shared = { source, clients: new Set(), latest: new Map(), keepDuringTransition };
    streams.set(url, shared);
    connectStream(url, shared, source);
  }
  clearTimeout(shared.idleClose);
  shared.idleClose = undefined;
  const client = new ChartStreamHandle(url, shared); shared.clients.add(client);
  const current = shared;
  queueMicrotask(() => { if (current.clients.has(client)) for (const event of current.latest.values()) client.dispatchEvent(new MessageEvent(event.type, { data: event.data })); });
  return client;
}
const pending = new Map<string, { controller: AbortController; result: Promise<Response>; users: number }>();
export async function sharedChartFetch(url: string, init: RequestInit = {}, requestKey = url): Promise<Response> {
  if (init.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  let entry = pending.get(requestKey);
  if (!entry) {
    const controller = new AbortController();
    const created = { controller, users: 0, result: Promise.resolve(null as unknown as Response) };
    created.result = fetch(url, { ...init, signal: controller.signal }).finally(() => { if (pending.get(requestKey) === created) pending.delete(requestKey); });
    entry = created; pending.set(requestKey, created);
  }
  entry.users++; const current = entry;
  let abort: (() => void) | undefined;
  try {
    const response = await Promise.race([current.result, new Promise<never>((_resolve, reject) => {
      abort = () => reject(new DOMException("Aborted", "AbortError")); init.signal?.addEventListener("abort", abort, { once: true });
    })]);
    return response.clone();
  } finally {
    if (abort) init.signal?.removeEventListener("abort", abort);
    current.users--; if (!current.users && pending.get(requestKey) === current) { pending.delete(requestKey); current.controller.abort(); }
  }
}

type CandleHistory = {
  bars: Candle[];
  adjustment?: "raw" | "split";
  basisDate: string;
  nextBefore: number | null;
  catchUpFrom?: number;
  complete?: boolean;
  calendar?: unknown;
  calendars?: unknown[];
};
const dailyHistory = new Map<string, { history: CandleHistory; savedAt: number }>();
const DAILY_HISTORY_LIFETIME = 60_000;
const MAX_DAILY_HISTORY_WINDOWS = 8;

/** Reuse the same adjusted daily rows across frames while each pane keeps its own viewport. */
export async function readChartCandleHistory(
  url: string,
  signal: AbortSignal,
  dailyScope?: { owner: string; basisDate: string; reuse: boolean },
): Promise<CandleHistory> {
  signal.throwIfAborted();
  const key = dailyScope ? JSON.stringify([dailyScope.owner, dailyScope.basisDate, url]) : null;
  const cached = key && dailyScope?.reuse ? dailyHistory.get(key) : undefined;
  if (cached && Date.now() - cached.savedAt < DAILY_HISTORY_LIFETIME) return cached.history;
  const response = await sharedChartFetch(url, { signal, credentials: "same-origin" }, key ?? url);
  if (!response.ok) {
    throw Error(response.status === 429 ? "Chart requests are busy. Try again shortly." : "Candles unavailable. Try again.");
  }
  const history = await response.json() as CandleHistory;
  const expected = new URLSearchParams(url.split("?")[1]).get("adjustment") ?? "split";
  if ((history.adjustment ?? "split") !== expected) throw Error("Candles unavailable for the selected historical price setting.");
  signal.throwIfAborted();
  if (key && history.complete !== false && history.basisDate === dailyScope?.basisDate && Array.isArray(history.bars)) {
    dailyHistory.delete(key);
    dailyHistory.set(key, { history, savedAt: Date.now() });
    while (dailyHistory.size > MAX_DAILY_HISTORY_WINDOWS) dailyHistory.delete(dailyHistory.keys().next().value!);
  }
  return history;
}

/** A separate completed-bucket lane. Missing or incompatible archives use base history. */
export async function readCompletedChartHistory(
  symbol: string, window: ChartArchiveWindow, providerQuery: string, signal: AbortSignal,
) {
  const query = new URLSearchParams({
    archive: "1", symbol, frame: window.frame, session: window.session,
    start: String(window.start), end: String(window.end),
  });
  try {
    const response = await sharedChartFetch(`/api/screeners/charts/bars?${query}&${providerQuery}`,
      { signal, credentials: "same-origin", cache: "no-store" });
    return response.ok ? readChartArchivePage(await response.json(), window) : null;
  } catch {
    signal.throwIfAborted();
    return null;
  }
}

// The chart gateway can calculate two distinct VWAP seeds at a time.
const vwapSeedLanes = [Promise.resolve(), Promise.resolve()];
let nextVwapSeedLane = 0;
export function readChartVwapSeed<T>(url: string, signal: AbortSignal, parse: (response: Response) => Promise<T>): Promise<T> {
  const lane = nextVwapSeedLane++ % vwapSeedLanes.length;
  const result = vwapSeedLanes[lane].then(async () => {
    signal.throwIfAborted();
    return parse(await sharedChartFetch(url, { credentials: "same-origin", signal, cache: "no-store" }));
  });
  vwapSeedLanes[lane] = result.then(() => {}, () => {});
  return result;
}
