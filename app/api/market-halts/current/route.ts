import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { easternTradingDate, listMarketHaltDashboard } from "@/src/modules/news/server/market-halt-dashboard";
import { MARKET_HALT_MAXIMUM_MARKET_CAP } from "@/src/modules/news/server/market-halt-universe-filter";
import { scannerUniverseStore } from "@/src/modules/scanner/live/server/runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasWatchlistDashboardNavigationAccess(identity)) return Response.json({ error: "not_found" }, { status: 404 });
    const now=new Date(),tradingDate=easternTradingDate(now);
    const universe=await scannerUniverseStore().readLatestOnOrBefore(tradingDate);
    const eligible=new Set((universe?.stocks??[]).filter(stock=>stock.marketCapAtCollection<=MARKET_HALT_MAXIMUM_MARKET_CAP).map(stock=>stock.symbol));
    const model = withReadonlyPlatformDatabase({}, (database) => listMarketHaltDashboard(database,now,20,eligible));
    return Response.json(model, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "private, no-store" } });
  }
}
