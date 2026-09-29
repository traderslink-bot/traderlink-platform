import { NextResponse, type NextRequest } from "next/server";
import { readWatchlistFeatureAccess } from "@/src/modules/watchlist/server/access/watchlist-feature-access";
import { watchlistDetailProjection } from "@/src/lib/live-watchlist/watchlist-member-projection";

import { authorizeWatchlistMemberRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> },
): Promise<NextResponse> {
  const auth = await authorizeWatchlistMemberRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { symbol } = await context.params;
  const features = readWatchlistFeatureAccess(auth.principal.platformUserId);
  if (!features.tickerDetails) return NextResponse.json({ code: "membership_required", feature: "watchlist.ticker_details" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  const store = new LiveWatchlistStore();
  const [state, health] = await Promise.all([
    store.getSymbol(symbol),
    store.getHealth(),
  ]);
  if (!state) {
    return NextResponse.json({ error: "Ticker was not found." }, { status: 404 });
  }
  return NextResponse.json({
    generatedAt: Date.now(),
    marketDataStatus: health.marketDataStatus,
    marketDataUpdatedAt: health.marketDataUpdatedAt,
    symbol: watchlistDetailProjection(state, features.tradeAnalysis),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
