import "server-only";

import { chartSymbol } from "@/src/modules/scanner/alpaca/candles";
import { chartCatchUpWindow, chartHistoryPage, chartHistoryWindow } from "@/src/modules/scanner/alpaca/chart-history";
import { AlpacaVwapHistory } from "@/src/modules/scanner/alpaca/chart-vwap-history";
import { parseVwapSeedRequest, validVwapSeed } from "@/src/modules/scanner/alpaca/chart-vwap-seed";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { browserChartEvent } from "./browser-chart-events";
import { browserChartCalendar, browserChartHistory } from "./browser-chart-history";
import { browserVwapSeed } from "./browser-vwap-seed";
import { adjustMoomooBars, MoomooChartHistory, moomooSplits } from "./moomoo-chart-history";
import { MoomooMarketDataRateLimit } from "./moomoo-bridge";
import { WorkspaceMoomooCandleCache } from "./workspace-moomoo-candle-cache";
import type { readWorkspaceMoomooAccess, WorkspaceMoomooConnection } from "./workspace-moomoo-access";
import { WorkspaceMoomooChartStream } from "./workspace-moomoo-chart-stream";

type Access = ReturnType<typeof readWorkspaceMoomooAccess>;
type ChartQuery = { symbol: string; daily: boolean; adjustment: "split" | "raw" };
const headers = { "Cache-Control": "private, no-store" };
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
const changed = () => reply({ error: "broker_connection_changed" }, 409);
const resources = new Set(["provider", "bars", "stream", "vwap-seed", "calendar", "splits"]);
const streamHeaders = { ...headers, "Content-Type": "text/event-stream", "X-Accel-Buffering": "no" };
type ActiveChart = {
  generation: string;
  symbol: string;
  feed: WorkspaceMoomooChartStream;
  readers: Set<() => void>;
};
type AccountCache = { generation: string; candles: WorkspaceMoomooCandleCache };
const processState = globalThis as typeof globalThis & {
  traderlinkWorkspaceMoomooChartStreams?: Map<string, ActiveChart>;
  traderlinkWorkspaceMoomooCandleCaches?: Map<string, AccountCache>;
};
const chartStreams = processState.traderlinkWorkspaceMoomooChartStreams ??= new Map<string, ActiveChart>();
const chartCaches = processState.traderlinkWorkspaceMoomooCandleCaches ??= new Map<string, AccountCache>();

function candleCache(owner: string, generation: string) {
  const saved = chartCaches.get(owner);
  const current = saved?.generation === generation ? saved : { generation, candles: new WorkspaceMoomooCandleCache() };
  chartCaches.delete(owner);
  chartCaches.set(owner, current);
  while (chartCaches.size > 24) chartCaches.delete(chartCaches.keys().next().value!);
  return current.candles;
}

function openStream(request: Request, owner: string, connection: WorkspaceMoomooConnection, input: ChartQuery) {
  let entry = chartStreams.get(owner);
  if (entry && entry.generation !== connection.generation) {
    for (const release of entry.readers) release();
    entry = undefined;
  }
  // Same ticker readers can share the feed, including its second native frame
  // for calculations. A competing ticker waits without evicting the first.
  if (entry && entry.symbol !== input.symbol) {
    return new Response('retry: 5000\nevent: status\ndata: {"state":"unavailable"}\n\n', { headers: streamHeaders });
  }
  if (!entry) {
    entry = { generation: connection.generation, symbol: input.symbol, feed: new WorkspaceMoomooChartStream(), readers: new Set() };
    chartStreams.set(owner, entry);
  }
  const active = entry;
  let cancel = () => {};
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      const lifetime: { release?: () => void; validation?: ReturnType<typeof setInterval> } = {};
      const finish = (closeBody: boolean) => {
        if (closed) return;
        closed = true;
        clearInterval(lifetime.validation);
        request.signal.removeEventListener("abort", close);
        lifetime.release?.();
        active.readers.delete(close);
        if (active.readers.size === 0 && chartStreams.get(owner) === active) chartStreams.delete(owner);
        if (closeBody) controller.close();
      };
      const close = () => finish(true);
      cancel = () => finish(false);
      active.readers.add(close);
      request.signal.addEventListener("abort", close, { once: true });
      if (request.signal.aborted || !connection.current()) { close(); return; }
      const release = active.feed.subscribe({ ...input, connection, notify(event) {
        if (closed) return;
        if (!connection.current() || (controller.desiredSize ?? 0) < -16) { close(); return; }
        const safe = browserChartEvent(event.type, event.data);
        controller.enqueue(encoder.encode(`event: ${safe.type}\ndata: ${JSON.stringify(safe.data)}\n\n`));
      } });
      lifetime.release = release;
      if (closed) { release(); return; }
      let lastHeartbeat = Date.now();
      lifetime.validation = setInterval(() => {
        if (!connection.current() || (controller.desiredSize ?? 0) < -16) { close(); return; }
        if (Date.now() - lastHeartbeat >= 5000) {
          lastHeartbeat = Date.now();
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }
      }, 1000);
    },
    cancel() { cancel(); },
  });
  return new Response(body, { headers: streamHeaders });
}

function parseChartQuery(query: URLSearchParams): ChartQuery {
  const daily = query.get("daily"), adjustment = query.get("adjustment");
  if (daily !== null && daily !== "0" && daily !== "1") throw Error("invalid_daily");
  if (adjustment !== null && adjustment !== "raw") throw Error("invalid_history_adjustment");
  return { symbol: chartSymbol(query.get("symbol") ?? ""), daily: daily === "1", adjustment: adjustment ?? "split" };
}

const failure = {
  bars: "chart_unavailable", calendar: "calendar_unavailable", splits: "split_history_unavailable", "vwap-seed": "vwap_history_unavailable",
};

export async function workspaceMoomooChartResponse(request: Request, resource: string, access: Access) {
  if (!resources.has(resource)) return reply({ error: "unknown_chart_resource" }, 404);
  if (!access) return reply({ error: "chart_access_denied" }, 403);
  const connection = access.connection;
  if (resource === "provider") {
    if (connection && !connection.current()) return changed();
    return reply({ generation: connection?.generation ?? null, overnight: false, archive: false });
  }
  if (!connection) return reply({ error: "broker_connection_required" }, 403);
  const query = new URL(request.url).searchParams;
  if (query.get("generation") !== connection.generation || !connection.current(true)) return changed();
  const owner = JSON.stringify([access.identity.scope.userId, access.identity.scope.workspaceId]);
  if (query.has("overnight")) return reply({ error: "overnight_unavailable" }, 404);
  if (["archive", "dailyStartup", "scannerIndicators", "feature"].some(key => query.has(key))) {
    return reply({ error: "invalid_chart_request" }, 400);
  }

  let input: ChartQuery | undefined, window: ReturnType<typeof chartHistoryWindow> | undefined;
  let seed: ReturnType<typeof parseVwapSeedRequest> | undefined, year: number | undefined;
  const before = query.get("before"), from = query.get("catchUpFrom"), recent = query.get("recent"), paged = query.get("history");
  try {
    if (resource === "calendar") {
      const value = query.get("year");
      if (!value || !/^\d{4}$/.test(value) || Number(value) < 1970) throw Error("invalid_calendar_year");
      year = Number(value);
    } else if (resource === "vwap-seed") seed = parseVwapSeedRequest(query);
    else {
      input = parseChartQuery(query);
      if (resource === "bars") {
        if (paged !== "1" || recent !== null && recent !== "1" ||
          from !== null && (input.daily || before !== null || recent !== null)) throw Error("invalid_history_range");
        window = from === null ? chartHistoryWindow(before, input.daily, Date.now(), recent === "1") : chartCatchUpWindow(from);
      }
    }
  } catch {
    return reply({ error: "invalid_chart_request" }, 400);
  }
  if (resource === "stream" && input) return openStream(request, owner, connection, input);

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(resource === "vwap-seed" ? 90_000 : 20_000)]);
  const history = new MoomooChartHistory(query => connection.request(query, signal));
  const basisDate = easternClock(Date.now()).date;
  const readHistory = async (query: { symbol: string; timeframe: "1Day" | "1Min"; start: number; end: number; adjustment?: "raw" | "split" }) => {
    const adjustment = query.adjustment ?? "split";
    const cache = candleCache(owner, connection.generation);
    const bars = await cache.read({ ...query, adjustment, basisDate }, signal, () => connection.current(true), async range => {
      // The provider requires a nonempty inclusive range. One uncovered
      // millisecond still represents at most one observed candle start.
      const value = await history.history({ ...query, ...range, end: Math.max(range.end, range.start + 1), adjustment: "raw" });
      if (!value.complete || value.basisDate !== basisDate || value.adjustment !== "raw") throw Error("chart_history_unavailable");
      return value.bars.filter(bar => bar.time * 1000 >= range.start && bar.time * 1000 <= range.end);
    });
    const projected = adjustment === "raw" ? bars : adjustMoomooBars(bars, moomooSplits(await history.corporateActions(query.symbol)), basisDate);
    return { symbol: query.symbol, bars: projected, adjustment, basisDate, feed: "moomoo", complete: true, nextPageToken: null };
  };
  try {
    let result: unknown;
    if (year !== undefined) result = browserChartCalendar(await history.forYear(year));
    else if (seed) {
      const vwap = new AlpacaVwapHistory({ history: query => {
        if (query.timeframe !== "1Min" && query.timeframe !== "1Day") throw Error("invalid_history_timeframe");
        return readHistory({ ...query, timeframe: query.timeframe });
      } }, history, Date.now, { read: (symbol, anchor) => history.readEvents(symbol, anchor) }, "moomoo");
      const value = await vwap.read(seed);
      if (!validVwapSeed(value, seed, basisDate)) throw Error("invalid_vwap_seed");
      result = browserVwapSeed(value);
    } else if (input && window) {
      const { symbol, daily, adjustment } = input;
      const value = await readHistory({ symbol, timeframe: daily ? "1Day" : "1Min", ...window, adjustment });
      if (!value.complete || value.basisDate !== basisDate || value.adjustment !== adjustment) throw Error("chart_history_unavailable");
      const page = chartHistoryPage(value.bars, window, daily);
      const calendar = daily ? { calendars: await history.forHistory(page.bars) } : { calendar: await history.forBars(page.bars) };
      result = browserChartHistory({ ...value, ...page, ...calendar, adjustment, ...(from !== null ? { catchUpFrom: window.start } : {}) });
    } else if (input && resource === "splits") {
      const { symbol } = input;
      const actions = await history.corporateActions(symbol);
      const splits = moomooSplits(actions)
        .filter(event => event.date <= basisDate && event.ratio !== 1)
        .map(({ date, ratio }) => ({
          id: date, date,
          oldShares: ratio > 1 ? ratio : 1,
          newShares: ratio > 1 ? 1 : 1 / ratio,
        }));
      result = { symbol, basisDate, splits };
    } else return reply({ error: "invalid_chart_request" }, 400);
    if (!connection.current(true)) return changed();
    signal.throwIfAborted();
    if (easternClock(Date.now()).date !== basisDate) throw Error("chart_basis_changed");
    return reply(result);
  } catch (error) {
    if (!connection.current(true)) return changed();
    if (error instanceof MoomooMarketDataRateLimit) {
      return Response.json({ error: "chart_requests_busy" }, { status: 429, headers: {
        ...headers, ...(error.retryAfter ? { "Retry-After": error.retryAfter } : {}),
      } });
    }
    return reply({ error: failure[resource as keyof typeof failure] ?? "chart_unavailable" }, 503);
  }
}
