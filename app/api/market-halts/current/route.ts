import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { listMarketHaltDashboard } from "@/src/modules/news/server/market-halt-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasWatchlistDashboardNavigationAccess(identity)) return Response.json({ error: "not_found" }, { status: 404 });
    const model = withReadonlyPlatformDatabase({}, (database) => listMarketHaltDashboard(database));
    return Response.json(model, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "private, no-store" } });
  }
}
