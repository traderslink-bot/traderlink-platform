import "server-only";

import { dirname } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { chartCatchUpWindow, chartHistoryPage, chartHistoryWindow } from "@/src/modules/scanner/alpaca/chart-history";
import type { AlpacaHistoryRequest } from "@/src/modules/scanner/alpaca/rest-data";
import { AlpacaVwapHistory } from "@/src/modules/scanner/alpaca/chart-vwap-history";
import type { VwapSeedRequest } from "@/src/modules/scanner/alpaca/chart-vwap-seed";
import { MoomooChartHistory } from "./moomoo-chart-history";
import { MoomooChartStream } from "./moomoo-chart-stream";
import { requestMoomooMarketData } from "./moomoo-bridge";
import { marketDataSelection, type MarketDataFeature } from "./provider-settings";

const shared = globalThis as typeof globalThis & {
  traderlinkMoomooCharts?: Map<string, { history: MoomooChartHistory; stream: MoomooChartStream; vwap: AlpacaVwapHistory }>;
};
function services(environment: NodeJS.ProcessEnv = process.env) {
  const key = dirname(resolvePlatformDatabaseConfig({ environment }).databasePath);
  const registry: NonNullable<typeof shared.traderlinkMoomooCharts> = shared.traderlinkMoomooCharts ??= new Map();
  let current = registry.get(key);
  if (!current) {
    const history = new MoomooChartHistory(request => requestMoomooMarketData(request, environment));
    const rest = { history: (request: AlpacaHistoryRequest) => {
      if (request.timeframe !== "1Min" && request.timeframe !== "1Day") throw Error("invalid_history_timeframe");
      return history.history({ ...request, timeframe: request.timeframe });
    } };
    const vwap = new AlpacaVwapHistory(rest, history, Date.now, { read: (symbol, anchor) => history.readEvents(symbol, anchor) }, "moomoo");
    current = { history, stream: new MoomooChartStream(environment), vwap };
    registry.set(key, current);
  }
  return current;
}
export const readMoomooChartCalendar = (year: number) => services().history.forYear(year);
export const readMoomooChartVwapSeed = (request: VwapSeedRequest) => services().vwap.read(request);

export async function moomooChartResponse(request: Request, stream: boolean, symbol: string, daily: boolean, feature:MarketDataFeature="charts"): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store" }, query = new URL(request.url).searchParams;
  const selection = marketDataSelection(feature);
  const current = () => { const now = marketDataSelection(feature); return now.provider === selection.provider && now.revision === selection.revision; };
  if (query.get("overnight") === "1") return Response.json({ error: "overnight_unavailable" }, { status: 404, headers });
  if (!stream) {
    const from = query.get("catchUpFrom"), paged = query.get("history") === "1";
    if (from !== null && (!paged || daily || query.has("before") || query.has("recent"))) throw Error("invalid_history_range");
    const window = from === null ? chartHistoryWindow(query.get("before"), daily, Date.now(), query.get("recent") === "1") : chartCatchUpWindow(from);
    const history = services().history;
    const result = await history.history({ symbol, timeframe: daily ? "1Day" : "1Min", start: window.start, end: window.end });
    const calendar = daily ? { calendars: await history.forHistory(result.bars) } : { calendar: await history.forBars(result.bars) };
    if (!current()) return Response.json({ error: "provider_changed" }, { status: 409, headers });
    return Response.json({ ...result, ...(paged ? chartHistoryPage(result.bars, window, daily) : { baseTimeframe: daily ? "1D" : "1m" }),
      ...(from !== null ? { catchUpFrom: window.start } : {}), ...calendar }, { headers });
  }
  let close = () => {};
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false, release = () => {};
      const timers: { check?: ReturnType<typeof setInterval> } = {};
      close = () => {
        if (closed) return;
        closed = true; clearInterval(timers.check); release();
        request.signal.removeEventListener("abort", close);
        if (controller.desiredSize !== null) controller.close();
      };
      request.signal.addEventListener("abort", close, { once: true });
      if (request.signal.aborted) { close(); return; }
      release = services().stream.subscribe(symbol, daily, event => {
        if (closed) return;
        if (!current() || (controller.desiredSize ?? 0) < -16) { close(); return; }
        controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`));
      });
      if (closed) { release(); return; }
      timers.check = setInterval(() => {
        if (closed) return;
        if (!current()) { close(); return; }
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 5_000);
    },
    cancel() { close(); },
  });
  return new Response(body, { headers: { ...headers, "Content-Type": "text/event-stream", "X-Accel-Buffering": "no" } });
}
