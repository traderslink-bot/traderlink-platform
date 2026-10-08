import { canViewPrivateWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { canViewWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import type { NextRequest } from "next/server";
import { readWatchlistFeatureAccess } from "@/src/modules/watchlist/server/access/watchlist-feature-access";
import { authorizeWatchlistMemberRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore, validIndicatorPublicationIdentity } from "@/src/lib/live-watchlist/live-watchlist-store";
import { readCachedWatchlistIndicators } from "@/src/modules/watchlist/server/indicators/indicator-refresh-runtime";
import { memberIndicatorSnapshot } from "@/src/lib/live-watchlist/indicators/indicator-member-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff" };

export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }): Promise<Response> {
  const auth = await authorizeWatchlistMemberRequest(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status, headers });
  if (!readWatchlistFeatureAccess(auth.principal.platformUserId).tickerDetails) return Response.json({ code: "membership_required" }, { status: 403, headers });
  const symbol = (await context.params).symbol.toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol)) return Response.json({ error: "Ticker was not found." }, { status: 404, headers });
  if (!canViewPrivateWatchlistTicker(request.headers, symbol)) return Response.json({error:"Not found."},{status:404,headers:{"Cache-Control":"private, no-store"}});
  if (!canViewWatchlistTicker(request.headers, symbol)) return Response.json({ code: "premium_ticker_required" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  const ticker = await new LiveWatchlistStore().getSymbol(symbol);
  if (!ticker || ticker.status === "deactivated" || !Number.isSafeInteger(ticker.firstPostedAt) || !ticker.firstPostedAt || ticker.firstPostedAt <= 0) {
    return Response.json({ error: "Ticker was not found." }, { status: 404, headers });
  }
  if (ticker.indicatorCardVisible === false || !validIndicatorPublicationIdentity(symbol, ticker.indicatorPublicationIdentity)) return Response.json({ snapshot: null }, { headers });
  const snapshot = readCachedWatchlistIndicators(symbol, ticker.indicatorPublicationIdentity);
  // Explicit projection excludes provider identity, audit IDs, input candles and transport details.
  return Response.json({ snapshot: memberIndicatorSnapshot(snapshot) }, { headers });
}
