import { timingSafeEqual } from "node:crypto";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { isObject } from "@/src/modules/stock-screeners/contracts";
import { publishScreenerPack } from "@/src/modules/stock-screeners/provider-pack-store";
import { stockScreenersDirectory } from "@/src/modules/stock-screeners/service";
import { acceptLiveScreenerFrame, LIVE_SCREENER_MAX_BYTES, parseLiveScreenerFrame } from "@/src/modules/stock-screeners/live-screener-book";
import { dirname,join } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { scannerSnapshotSpacing } from "@/src/modules/scanner/live/server/snapshot-pacing";
import { UniverseStore } from "@/src/modules/scanner/live/server/universe-store";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { requestMoomooMarketData, type MoomooDataRequest } from "@/src/modules/market-data/server/moomoo-bridge";
import { screenerPrivateWireEnabled, decodeScreenerPrivatePackAsync, decodeScreenerPrivateLive, encodeScreenerPrivateSelection, encodeScreenerPrivateUniverse, decodeScreenerPrivateOperation, encodeScreenerPrivateLinkedReply } from "./private-publication-wire";

const reply = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
function authorized(request: Request, wire = false) {
  if (wire && !screenerPrivateWireEnabled()) return false;
  const token = process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN;
  if (process.env.TRADERLINK_STOCK_SCREENERS_LIVE_WORKER !== "1" || !token || token.length < 32) return false;
  const supplied = Buffer.from(request.headers.get("authorization") ?? ""), expected = Buffer.from("Bearer " + token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
export async function screenerControlGet(request: Request, operation?: "selection" | "universe") {
  if (!authorized(request, Boolean(operation))) return reply({ error: "not_found" }, 404);
  if (!operation && new URL(request.url).searchParams.get("feature") !== "screeners") return reply({ error: "invalid_request" }, 400);
  try {
    const selection=marketDataSelection("screeners");
    if(operation === "universe" || !operation && new URL(request.url).searchParams.get("operation")==="universe"){
      const date=easternClock(Date.now()).date;
      const store=new UniverseStore(join(dirname(resolvePlatformDatabaseConfig().databasePath),"scanner-live-v1"));
      const universe=await store.read(date)??await store.readLatestOnOrBefore(date);
      if(!universe)return reply({error:"universe_unavailable"},503);
      const current=marketDataSelection("screeners");
      if(current.provider!==selection.provider||current.revision!==selection.revision)return reply({error:"provider_changed"},409);
      const result = {...selection,tradingDate:date,sourceTradingDate:universe.tradingDate,stocks:universe.stocks,spacingMs:scannerSnapshotSpacing(process.env)};
      return reply(operation ? encodeScreenerPrivateUniverse(result, selection, process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN!) : result);
    }
    return reply(operation ? encodeScreenerPrivateSelection(selection, process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN!) : selection);
  } catch { return reply({ error: "selection_unavailable" }, 503); }
}
export async function screenerControlPost(request: Request, wire = false) {
  if (!authorized(request, wire)) return reply({ error: "not_found" }, 404);
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "invalid_request" }, 400);
  let body: Record<string, unknown>;
  try {
    const chunks: Uint8Array[] = []; let bytes = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 16_384) { await reader.cancel(); return reply({ error: "invalid_request" }, 413); }
      chunks.push(value);
    }
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    if (wire) body = decodeScreenerPrivateOperation(body, marketDataSelection("screeners"), process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN!);
    if (!body || typeof body !== "object" || Array.isArray(body) || body.feature !== "screeners" || body.provider !== "moomoo"
      || !Number.isSafeInteger(body.revision)) return reply({ error: "invalid_request" }, 400);
  } catch (error) { return reply({ error: "invalid_request" }, wire && error instanceof Error && error.message === "screener_provider_changed" ? 409 : 400); }
  finally { reader.releaseLock(); }
  const matches = () => { const current = marketDataSelection("screeners"); return current.provider === body.provider && current.revision === body.revision; };
  try {
    if (!matches()) return reply({ error: "provider_changed" }, 409);
    const payload = await requestMoomooMarketData(body as unknown as MoomooDataRequest, process.env, request.signal);
    if (!matches()) return reply({ error: "provider_changed" }, 409);
    return reply(wire ? encodeScreenerPrivateLinkedReply(body.operation as "snapshots" | "history" | "rehab" | "calendar", payload, {provider:"moomoo",revision:Number(body.revision)}, process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN!) : { provider: body.provider, revision: body.revision, payload });
  } catch (error) {
    const invalid = error instanceof Error && error.message === "invalid_market_data_request";
    return reply({ error: invalid ? "invalid_request" : "market_data_unavailable" }, invalid ? 400 : 503);
  }
}

export async function screenerPackPost(request: Request, wire = false) {
  if (wire && !screenerPrivateWireEnabled()) return new Response(null, { status: 404 });
  const token = process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN;
  if (process.env.TRADERLINK_STOCK_SCREENERS_LIVE_WORKER !== "1" || !token || token.length < 32) return new Response(null, { status: 404 });
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return new Response(null, { status: 404 });
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  let bytes = 0;
  let stage = "body";
  try {
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 128 * 1024 * 1024) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(value);
    }
    let body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    stage = "selection";
    const selection = marketDataSelection("screeners");
    if (wire) body = await decodeScreenerPrivatePackAsync(body, selection, token);
    if (!isObject(body) || body.provider !== selection.provider || body.revision !== selection.revision)
      return new Response(null, { status: 409 });
    if (body.initial !== undefined && typeof body.initial !== "boolean") return new Response(null, { status: 400 });
    stage = "publication";
    await publishScreenerPack(stockScreenersDirectory(), body.pack, selection, process.env, body.initial === true);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const conflict = error instanceof Error && ["screener_provider_changed", "screener_pack_busy", "screener_pack_superseded"].includes(error.message);
    const code = error instanceof SyntaxError ? "invalid_json"
      : error instanceof Error && ["market_pack_invalid", "market_pack_provider_mismatch", "screener_provider_changed", "screener_pack_busy", "screener_pack_superseded"].includes(error.message)
        ? error.message : "publication_failed";
    console.warn("screeners_pack_rejected", { stage, bytes, code });
    return new Response(null, { status: conflict ? 409 : 400 });
  } finally {
    reader.releaseLock();
  }
}

export async function screenerLivePost(request: Request, wire = false) {
  if (!authorized(request, wire)) return new Response(null, { status: 404 });
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const parts: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > LIVE_SCREENER_MAX_BYTES) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      parts.push(value);
    }
    const now = Date.now();
    let body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)));
    const selection = marketDataSelection("screeners");
    if (wire) body = decodeScreenerPrivateLive(body, selection, process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN!);
    if ((body?.provider ?? "alpaca") !== selection.provider || (body?.revision ?? 0) !== selection.revision)
      return new Response(null, { status: 409 });
    const frame = parseLiveScreenerFrame(body, now, selection);
    const result = acceptLiveScreenerFrame(frame, now);
    return new Response(null, { status: result === "accepted" ? 204 : 409, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return new Response(null, { status: wire && error instanceof Error && error.message === "screener_provider_changed" ? 409 : 400 });
  } finally {
    reader.releaseLock();
  }
}
