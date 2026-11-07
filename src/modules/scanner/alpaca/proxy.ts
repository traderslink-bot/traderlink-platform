import "server-only";
import { readFile } from "node:fs/promises";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { chartSymbol } from "./candles";

export async function proxyAlpacaChart(request: Request, stream: boolean): Promise<Response> {
  const safeHeaders = { "Cache-Control": "private, no-store" };
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const local = identity.mode === "local_development" && process.env.NODE_ENV !== "production";
    if (!local && (!process.env.TRADERLINK_ALPACA_OWNER_USER_ID || identity.scope.userId !== process.env.TRADERLINK_ALPACA_OWNER_USER_ID)) return Response.json({ error: "owner_only" }, { status: 403, headers: safeHeaders });
    const query = new URL(request.url).searchParams;
    let symbol: string;
    try { symbol = chartSymbol(query.get("symbol") ?? ""); } catch { return Response.json({ error: "invalid_symbol" }, { status: 400, headers: safeHeaders }); }
    const configured = process.env.TRADERLINK_ALPACA_GATEWAY_URL;
    let token = process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN;
    if (local && process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE) {
      token = JSON.parse(await readFile(process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE, "utf8")).token;
    }
    if (!configured || !token) return Response.json({ error: "not_configured" }, { status: 503, headers: safeHeaders });
    const base = new URL(configured);
    if (base.username || base.password || base.search || base.hash || (base.protocol !== "https:" && !(local && base.protocol === "http:" && base.hostname === "127.0.0.1"))) throw Error("invalid_gateway");
    const upstreamUrl = new URL(stream ? "stream" : "bars", configured.endsWith("/") ? configured : `${configured}/`);
    upstreamUrl.searchParams.set("symbol", symbol);
    if (!stream && query.get("daily") === "1") upstreamUrl.searchParams.set("daily", "1");
    const cancellation = new AbortController();
    const abort = () => cancellation.abort();
    request.signal.addEventListener("abort", abort, { once: true });
    if (request.signal.aborted) abort();
    const timeout = setTimeout(abort, stream ? 15_000 : 25_000);
    let upstream: Response;
    try { upstream = await fetch(upstreamUrl, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: cancellation.signal, redirect: "error" }); }
    catch { clearTimeout(timeout); request.signal.removeEventListener("abort", abort); throw Error("gateway_unavailable"); }
    clearTimeout(timeout);
    if (!upstream.ok || !upstream.body) {
      request.signal.removeEventListener("abort", abort); await upstream.body?.cancel();
      return Response.json({ error: upstream.status === 429 ? "busy" : "gateway_unavailable" }, { status: upstream.status === 429 ? 429 : 502, headers: safeHeaders });
    }
    if (!stream) { try { return Response.json(await upstream.json(), { headers: safeHeaders }); } finally { request.signal.removeEventListener("abort", abort); } }
    const reader = upstream.body.getReader();
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) { request.signal.removeEventListener("abort", abort); controller.close(); }
          else controller.enqueue(value);
        } catch { request.signal.removeEventListener("abort", abort); controller.error(Error("Chart connection interrupted")); }
      },
      async cancel() { cancellation.abort(); request.signal.removeEventListener("abort", abort); await reader.cancel().catch(() => {}); },
    });
    return new Response(body, { headers: { ...safeHeaders, "Content-Type": "text/event-stream", "X-Accel-Buffering": "no" } });
  } catch { return Response.json({ error: "chart_unavailable" }, { status: 503, headers: safeHeaders }); }
}
