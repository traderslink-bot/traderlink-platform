import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readWatchlistUsageAdminSnapshot } from "@/src/modules/watchlist/server/watchlist-usage-service";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "cache-control": "private, no-store, max-age=0" };

export function GET(request: Request): Response {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasWatchlistDashboardNavigationAccess(identity)) return Response.json({ code: "not_found" }, { status: 404, headers });
  } catch {
    return Response.json({ code: "not_found" }, { status: 404, headers });
  }
  try {
    return Response.json({ usage: readWatchlistUsageAdminSnapshot() }, { headers });
  } catch {
    return Response.json({ code: "usage_unavailable" }, { status: 503, headers });
  }
}
