import { dirname,join } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { scannerSnapshotSpacing } from "@/src/modules/scanner/live/server/snapshot-pacing";
import { UniverseStore } from "@/src/modules/scanner/live/server/universe-store";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { timingSafeEqual } from "node:crypto";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { requestMoomooMarketData, type MoomooDataRequest } from "@/src/modules/market-data/server/moomoo-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
function authorized(request: Request) {
  const token = process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN;
  if (process.env.TRADERLINK_STOCK_SCREENERS_LIVE_WORKER !== "1" || !token || token.length < 32) return false;
  const supplied = Buffer.from(request.headers.get("authorization") ?? ""), expected = Buffer.from("Bearer " + token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
export async function GET(request: Request) {
  if (!authorized(request)) return reply({ error: "not_found" }, 404);
  if (new URL(request.url).searchParams.get("feature") !== "screeners") return reply({ error: "invalid_request" }, 400);
  try {
    const selection=marketDataSelection("screeners");
    if(new URL(request.url).searchParams.get("operation")==="universe"){
      const date=easternClock(Date.now()).date;
      const store=new UniverseStore(join(dirname(resolvePlatformDatabaseConfig().databasePath),"scanner-live-v1"));
      const universe=await store.read(date)??await store.readLatestOnOrBefore(date);
      if(!universe)return reply({error:"universe_unavailable"},503);
      const current=marketDataSelection("screeners");
      if(current.provider!==selection.provider||current.revision!==selection.revision)return reply({error:"provider_changed"},409);
      return reply({...selection,tradingDate:date,sourceTradingDate:universe.tradingDate,stocks:universe.stocks,spacingMs:scannerSnapshotSpacing(process.env)});
    }
    return reply(selection);
  } catch { return reply({ error: "selection_unavailable" }, 503); }
}
export async function POST(request: Request) {
  if (!authorized(request)) return reply({ error: "not_found" }, 404);
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
    if (!body || typeof body !== "object" || Array.isArray(body) || body.feature !== "screeners" || body.provider !== "moomoo"
      || !Number.isSafeInteger(body.revision)) return reply({ error: "invalid_request" }, 400);
  } catch { return reply({ error: "invalid_request" }, 400); }
  finally { reader.releaseLock(); }
  const matches = () => { const current = marketDataSelection("screeners"); return current.provider === body.provider && current.revision === body.revision; };
  try {
    if (!matches()) return reply({ error: "provider_changed" }, 409);
    const payload = await requestMoomooMarketData(body as unknown as MoomooDataRequest, process.env, request.signal);
    return matches() ? reply({ provider: body.provider, revision: body.revision, payload }) : reply({ error: "provider_changed" }, 409);
  } catch (error) {
    const invalid = error instanceof Error && error.message === "invalid_market_data_request";
    return reply({ error: invalid ? "invalid_request" : "market_data_unavailable" }, invalid ? 400 : 503);
  }
}
