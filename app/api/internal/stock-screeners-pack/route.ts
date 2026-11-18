import { timingSafeEqual } from "node:crypto";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { isObject } from "@/src/modules/stock-screeners/contracts";
import { publishScreenerPack } from "@/src/modules/stock-screeners/provider-pack-store";
import { stockScreenersDirectory } from "@/src/modules/stock-screeners/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    stage = "selection";
    const selection = marketDataSelection("screeners");
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
