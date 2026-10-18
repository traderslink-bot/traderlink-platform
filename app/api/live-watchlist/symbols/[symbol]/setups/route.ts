import type { NextRequest } from "next/server";
import { readWatchlistFeatureAccess } from "@/src/modules/watchlist/server/access/watchlist-feature-access";
import { authorizeWatchlistMemberRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { canViewWatchlistAnalysisPrices, canViewWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { readWatchlistSetupSnapshot } from "@/src/modules/watchlist/server/setups/setup-runtime";
import { savedSetupPublicationIdentity } from "@/src/modules/watchlist/server/setups/setup-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff" };

/** Access checked before reading cached setup evidence; never initiates a refresh. */
export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }): Promise<Response> {
  const access = await authorizeWatchlistMemberRequest(request);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status, headers });
  const plan = readWatchlistFeatureAccess(access.principal.platformUserId);
  if (!plan.tickerDetails || !plan.tradeAnalysis) return Response.json({ code: "membership_required" }, { status: 403, headers });
  const symbol = (await context.params).symbol.toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol) || !canViewWatchlistTicker(request.headers, symbol)
    || !canViewWatchlistAnalysisPrices(request.headers, symbol)) return Response.json({ snapshot: null }, { headers });
  try {
    const ticker = await new LiveWatchlistStore().getSymbol(symbol);
    if (!ticker || ticker.status === "deactivated" || !ticker.firstPostedAt) return Response.json({ snapshot: null }, { headers });
    // The producer's persisted identity, not a reconstructed symbol/posted time.
    const identity = (ticker as typeof ticker & { indicatorPublicationIdentity?: unknown }).indicatorPublicationIdentity;
    if (typeof identity !== "string" || !savedSetupPublicationIdentity.test(identity)) return Response.json({ snapshot: null }, { headers });
    return Response.json({ snapshot: await readWatchlistSetupSnapshot(symbol, identity) }, { headers });
  } catch { return Response.json({ error: "Setup readings are unavailable." }, { status: 503, headers }); }
}
