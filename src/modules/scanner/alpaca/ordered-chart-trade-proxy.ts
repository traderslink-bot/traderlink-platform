import "server-only";

import { readFile } from "node:fs/promises";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { browserDataSession, matchesBrowserDataSession } from "@/src/modules/market-data/server/browser-data-session";
import { hasChartsDashboardAccess } from "@/src/modules/market-data/server/chart-dashboard-access";
import { BrowserChartFrames } from "@/src/modules/market-data/server/browser-chart-events";
import { readChartTradeReplayFrame } from "./chart-trade-replay";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { chartSymbol } from "./candles";

const headers = { "Cache-Control": "private, no-store" };
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

export async function proxyOrderedChartTrades(request: Request, identity: TraderLinkPlatformRequestIdentity) {

  if (!hasChartsDashboardAccess(identity)) return failure("chart_access_denied", 403);

  const query = new URL(request.url).searchParams;
  let symbol: string;
  try { symbol = chartSymbol(query.get("symbol") ?? ""); }
  catch { return failure("invalid_symbol", 400); }

  const selection = marketDataSelection("charts");
  if (!query.has("generation") || !matchesBrowserDataSession(query, "charts", selection)) return failure("provider_changed", 409);
  if (selection.provider !== "alpaca") return failure("ordered_trades_unavailable", 404);
  const generation = browserDataSession("charts", selection).generation;
  const current = () => browserDataSession("charts", marketDataSelection("charts")).generation === generation;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15_000);
  try {
    const configured = process.env.TRADERLINK_ALPACA_GATEWAY_URL;
    let token = process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN;
    if (process.env.NODE_ENV !== "production" && process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE) {
      token = JSON.parse(await readFile(process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE, "utf8")).token;
    }
    if (!configured || !token) return failure("ordered_trades_unavailable", 503);
    const base = new URL(configured);
    const isLocal = identity.mode === "local_development" && process.env.NODE_ENV !== "production";
    const loopback = isLocal && base.protocol === "http:" && base.hostname === "127.0.0.1";
    if (base.username || base.password || base.search || base.hash || (base.protocol !== "https:" && !loopback)) {
      return failure("ordered_trades_unavailable", 503);
    }
    const upstream = new URL("chart-trades/stream", configured.endsWith("/") ? configured : configured + "/");
    upstream.searchParams.set("symbol", symbol);
    const result = await fetch(upstream, {
      headers: { Authorization: `Bearer ${token}` }, redirect: "error", cache: "no-store",
      signal: AbortSignal.any([request.signal, abort.signal]),
    });
    if (!result.ok || !result.body || !result.headers.get("content-type")?.startsWith("text/event-stream") || !current()) {
      await result.body?.cancel();
      return failure("ordered_trades_unavailable", result.status === 429 ? 429 : 503);
    }
    const reader = result.body.getReader();
    const states = ["warming", "unavailable", "limit", "closed"];
    const frames = new BrowserChartFrames((type, input) => {
      if (!input || typeof input !== "object") throw Error("invalid_trade_event");
      if (type === "status" && "state" in input && typeof input.state === "string" && states.includes(input.state)) {
        return { type, data: { state: input.state } };
      }
      if (type !== "tape") throw Error("invalid_trade_event");
      const data = readChartTradeReplayFrame(input);
      if (data.kind !== "snapshot") return { type, data };
      if (!("symbol" in input) || input.symbol !== symbol || !("feed" in input) || input.feed !== "sip" ||
          !("session" in input) || input.session !== "regular" ||
          !("date" in input) || typeof input.date !== "string" ||
          !("start" in input) || typeof input.start !== "string" ||
          !("cutoff" in input) || typeof input.cutoff !== "string") throw Error("invalid_trade_coverage");
      return { type, data: { ...data, symbol, session: "regular", date: input.date, start: input.start, cutoff: input.cutoff } };
    }, 8_000_000);
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done || !current()) {
              controller.close();
              await reader.cancel().catch(() => {});
              return;
            }
            const output = frames.write(value);
            if (output.byteLength) { controller.enqueue(output); return; }
          }
        } catch {
          abort.abort();
          await reader.cancel().catch(() => {});
          controller.error(new Error("Ordered trade connection interrupted"));
        }
      },
      async cancel() {
        abort.abort();
        await reader.cancel().catch(() => {});
      },
    });
    return new Response(body, { headers: { ...headers, "Content-Type": "text/event-stream", "X-Accel-Buffering": "no" } });
  } catch { return failure("ordered_trades_unavailable", 503); }
  finally { clearTimeout(timeout); }
}
