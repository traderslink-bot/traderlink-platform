import { timingSafeEqual } from "node:crypto";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { acceptLiveScreenerFrame, LIVE_SCREENER_MAX_BYTES, parseLiveScreenerFrame } from "@/src/modules/stock-screeners/live-screener-book";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const token = process.env.TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN;
  if (process.env.TRADERLINK_STOCK_SCREENERS_LIVE_WORKER !== "1" || !token || token.length < 32) return false;
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from("Bearer " + token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 404 });
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
    const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)));
    const selection = marketDataSelection("screeners");
    if ((body?.provider ?? "alpaca") !== selection.provider || (body?.revision ?? 0) !== selection.revision)
      return new Response(null, { status: 409 });
    const frame = parseLiveScreenerFrame(body, now, selection);
    const result = acceptLiveScreenerFrame(frame, now);
    return new Response(null, { status: result === "accepted" ? 204 : 409, headers: { "Cache-Control": "no-store" } });
  } catch {
    return new Response(null, { status: 400 });
  } finally {
    reader.releaseLock();
  }
}
