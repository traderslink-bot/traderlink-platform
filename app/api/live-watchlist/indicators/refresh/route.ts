import { createHash, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { readSharedWatchlistIndicatorCandles, reconcileWatchlistIndicatorPopulation, refreshWatchlistIndicators } from "@/src/modules/watchlist/server/indicators/indicator-refresh-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff" };
const digest = (value: string) => createHash("sha256").update(value).digest();

async function boundedBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 1024) { await reader.cancel(); return null; }
      chunks.push(chunk.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return null; }
  finally { reader.releaseLock(); }
}

/** Called by the existing publisher's shared ticker poll, never by member page polling. */
export async function POST(request: Request): Promise<Response> {
  const expected = process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim();
  if (!expected) return Response.json({ error: "Refresh is unavailable." }, { status: 503, headers });
  const supplied = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/iu)?.[1]?.trim() ?? "";
  if (!supplied || !timingSafeEqual(digest(supplied), digest(expected))) {
    return Response.json({ error: "Unauthorized." }, { status: 401, headers });
  }
  const body = await boundedBody(request) as { symbol?: unknown; activatedAt?: unknown } | null;
  if (!body || typeof body.symbol !== "string" || !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(body.symbol)
    || typeof body.activatedAt !== "number" || !Number.isSafeInteger(body.activatedAt) || body.activatedAt <= 0) {
    return Response.json({ error: "Invalid refresh request." }, { status: 400, headers });
  }
  const symbol = body.symbol, activatedAt = body.activatedAt;
  try {
    const ticker = await new LiveWatchlistStore().getSymbol(symbol);
    if (!ticker || ticker.status === "deactivated" || ticker.firstPostedAt !== activatedAt) {
      // A review-pending or old activation cannot create public Indicators or cause a provider fetch.
      return Response.json({ handled: true, status: "inactive", candles: null }, { headers });
    }
    const activationId = `${symbol}:${activatedAt}`;
    const candles = readSharedWatchlistIndicatorCandles(symbol, activationId);
    after(async () => {
      // Recheck after response: activation may change while a background operation is queued.
      try {
        const population = await new LiveWatchlistStore().listSymbols();
        const active = population.symbols.filter(ticker => ticker.status !== "deactivated" && ticker.firstPostedAt && Number.isSafeInteger(ticker.firstPostedAt));
        reconcileWatchlistIndicatorPopulation(new Map(active.map(ticker => [ticker.symbol, `${ticker.symbol}:${ticker.firstPostedAt}`])));
        const current = active.find(ticker => ticker.symbol === symbol);
        if (current && current.status !== "deactivated" && current.firstPostedAt === activatedAt) {
          await refreshWatchlistIndicators(symbol, activationId);
        }
      } catch { /* The refresh service records provider failures; never log credentials or raw errors. */ }
    });
    return Response.json({ handled: true, status: candles ? "ready" : "warming", candles }, { headers });
  } catch {
    return Response.json({ error: "Refresh is unavailable." }, { status: 503, headers });
  }
}
