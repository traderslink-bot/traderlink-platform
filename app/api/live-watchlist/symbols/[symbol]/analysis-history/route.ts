import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeWatchlistMemberRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import type { AnalysisHistoryRow } from "@/src/lib/live-watchlist/analysis-publication-history";
import { requestWatchlistRuntimeRaw } from "@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Shared across viewers; cache only public date/price rows, never the private audit.
const cache = new Map<string, { expires: number; rows: Promise<AnalysisHistoryRow[]> }>();

export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const auth = await authorizeWatchlistMemberRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { symbol } = await context.params;
  if (!/^[A-Za-z0-9.^-]{1,16}$/.test(symbol)) return NextResponse.json({ error: "Invalid ticker." }, { status: 400 });
  const state = await new LiveWatchlistStore().getSymbol(symbol);
  const body = state?.cards.tradersLinkAiRead?.body;
  if (!body || state?.status === "deactivated") return NextResponse.json({ rows: [] });
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const key = `${state.symbol}:${bodyHash}`;
  let entry = cache.get(key);
  if (!entry || entry.expires <= Date.now()) {
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    const rows = (async () => {
      const response = await requestWatchlistRuntimeRaw({ method: "GET", timeoutMs: 8000,
        path: `/api/watchlist/published-analysis-history?symbol=${encodeURIComponent(state.symbol)}&bodyHash=${bodyHash}` });
      if (!response.ok) return [];
      try {
        const value = JSON.parse(response.body);
        if (!Array.isArray(value.rows)) return [];
        return value.rows.filter((row: AnalysisHistoryRow | null) => row &&
          Number.isFinite(row.generatedAt) && row.generatedAt > 0 && Number.isFinite(row.price) && row.price > 0)
          .map((row: AnalysisHistoryRow) => ({ generatedAt: row.generatedAt, price: row.price }));
      } catch { return []; }
    })();
    entry = { expires: Date.now() + 60_000, rows };
    cache.set(key, entry);
  }
  return NextResponse.json({ rows: await entry.rows }, { headers: { "Cache-Control": "private, no-store" } });
}
