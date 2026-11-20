import { gatewayWireEnabled, gatewayWireUrl, gatewayWireQuery, decodeGatewayWire, GatewayWireFrames } from "../../market-data/transport/gateway-wire";
import "server-only";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { readFile } from "node:fs/promises";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { chartCatchUpWindow, chartHistoryPage, chartHistoryWindow } from "./chart-history";
import type { Candle } from "./candles";
import { chartSymbol } from "./candles";
import { matchesBrowserDataSession } from "@/src/modules/market-data/server/browser-data-session";
import { browserChartHistory } from "@/src/modules/market-data/server/browser-chart-history";
import { BrowserChartFrames } from "@/src/modules/market-data/server/browser-chart-events";

export async function proxyAlpacaChart(request: Request, stream: boolean, internalHistory = false): Promise<Response> {
  const safeHeaders = { "Cache-Control": "private, no-store" };
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const local = identity.mode === "local_development" && process.env.NODE_ENV !== "production";
    const query = new URL(request.url).searchParams;
    let symbol: string;
    try { symbol = chartSymbol(query.get("symbol") ?? ""); } catch { return Response.json({ error: "invalid_symbol" }, { status: 400, headers: safeHeaders }); }
    const paged = !stream && query.get("history") === "1";
    const daily = query.get("daily") === "1";
    const overnight = query.get("overnight") === "1";
    if (overnight && (daily || !stream && !paged)) {
      return Response.json({ error: "invalid_history_range" }, { status: 400, headers: safeHeaders });
    }
    const from = paged ? query.get("catchUpFrom") : null;
    let window: ReturnType<typeof chartHistoryWindow> | undefined;
    if (paged) { try {
      if (from !== null && (daily || query.has("before") || query.has("recent"))) throw Error("invalid_history_range");
      window = from === null ? chartHistoryWindow(query.get("before"), daily, Date.now(), query.get("recent") === "1") : chartCatchUpWindow(from);
    } catch { return Response.json({error:"invalid_history_range"},{status:400,headers:safeHeaders}); } }
    const feature = query.get("scannerIndicators")==="1"?"scanners":"charts";
    const selection = marketDataSelection(feature);
    const selected = () => { const next=marketDataSelection(feature); return next.provider===selection.provider && next.revision===selection.revision; };
    if (!matchesBrowserDataSession(query, feature, selection)) {
      return Response.json({error:"provider_changed"},{status:409,headers:safeHeaders});
    }
    if(selection.provider==="moomoo"){
      const {moomooChartResponse}=await import("@/src/modules/market-data/server/moomoo-chart-response");
      const result = await moomooChartResponse(request,stream,symbol,daily,feature);
      if (!selected()) { await result.body?.cancel(); return Response.json({ error: "provider_changed" }, { status: 409, headers: safeHeaders }); }
      if (!result.ok) {
        await result.body?.cancel();
        return Response.json({error:result.status===429?"busy":result.status===409?"provider_changed":result.status===404&&overnight?"overnight_unavailable":"chart_unavailable"},
          {status:result.status===429?429:result.status===409?409:result.status===404&&overnight?404:503,headers:safeHeaders});
      }
      if (stream || internalHistory) return result;
      return Response.json(browserChartHistory(await result.json()), { headers: safeHeaders });
    }
    const configured = process.env.TRADERLINK_ALPACA_GATEWAY_URL;
    let token = process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN;
    if (process.env.NODE_ENV !== "production" && process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE) {
      token = JSON.parse(await readFile(process.env.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE, "utf8")).token;
    }
    if (!configured || !token) return Response.json({ error: "not_configured" }, { status: 503, headers: safeHeaders });
    const base = new URL(configured);
    if (base.username || base.password || base.search || base.hash || (base.protocol !== "https:" && !(local && base.protocol === "http:" && base.hostname === "127.0.0.1"))) throw Error("invalid_gateway");
    const endpoint = stream ? "stream" : overnight ? "chart-overnight-history" : paged ? "history" : "bars";
    const wire=gatewayWireEnabled();
    const upstreamUrl = wire?gatewayWireUrl(configured,endpoint):new URL(endpoint, configured.endsWith("/") ? configured : `${configured}/`);
    upstreamUrl.searchParams.set("symbol", symbol);
    if (paged && window) {
      upstreamUrl.searchParams.set("timeframe",daily?"1Day":"1Min");
      upstreamUrl.searchParams.set("start",String(window.start));upstreamUrl.searchParams.set("end",String(window.end));
    } else if (daily) upstreamUrl.searchParams.set("daily", "1");
    if (stream && overnight) upstreamUrl.searchParams.set("overnight", "1");
    if(wire)upstreamUrl.search=gatewayWireQuery(upstreamUrl.searchParams).toString();
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
      if (overnight && upstream.status === 404) return Response.json({ error: "overnight_unavailable" }, { status: 404, headers: safeHeaders });
      return Response.json({ error: upstream.status === 429 ? "busy" : "gateway_unavailable" }, { status: upstream.status === 429 ? 429 : 502, headers: safeHeaders });
    }
    if (!stream) { try {
      const raw=await upstream.json();
      const payload=wire?decodeGatewayWire(endpoint,raw) as Record<string,unknown>:raw;
      if(!selected())return Response.json({error:"provider_changed"},{status:409,headers:safeHeaders});
      if(paged&&window){
        if(payload.complete!==true||payload.adjustment!=="split"||payload.feed!==(overnight?"boats":"sip")||!Array.isArray(payload.bars))throw Error("incomplete_history");
        return Response.json(browserChartHistory({...chartHistoryPage(payload.bars as Candle[],window,daily),basisDate:payload.basisDate,...(from !== null ? {catchUpFrom:window.start} : {}),...(!daily?{calendar:payload.calendar??{available:false}}:{calendars:payload.calendars??[]})}),{headers:safeHeaders});
      }
      return Response.json(internalHistory ? payload : browserChartHistory(payload), { headers: safeHeaders });
    } finally { request.signal.removeEventListener("abort", abort); } }
    const reader = upstream.body.getReader();
    const frames = new BrowserChartFrames();
    const wireFrames=wire?new GatewayWireFrames("stream"):null;
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) { wireFrames?.finish(); request.signal.removeEventListener("abort", abort); controller.close(); return; }
            if(!selected()){request.signal.removeEventListener("abort",abort);await reader.cancel();controller.close();return;}
            const output = frames.write(wireFrames?wireFrames.write(value):value);
            if (output.byteLength) { controller.enqueue(output); return; }
          }
        } catch { request.signal.removeEventListener("abort", abort); cancellation.abort(); await reader.cancel().catch(()=>{}); controller.error(Error("Chart connection interrupted")); }
      },
      async cancel() { cancellation.abort(); request.signal.removeEventListener("abort", abort); await reader.cancel().catch(() => {}); },
    });
    return new Response(body, { headers: { ...safeHeaders, "Content-Type": "text/event-stream", "X-Accel-Buffering": "no" } });
  } catch { return Response.json({ error: "chart_unavailable" }, { status: 503, headers: safeHeaders }); }
}
