import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readWatchlistUsageAdminSnapshot } from "@/src/modules/watchlist/server/watchlist-usage-service";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = { "cache-control": "private, no-store, max-age=0" };

function authorized(request: Request): boolean {
  try {
    return hasWatchlistDashboardNavigationAccess(
      requireTraderLinkPlatformRequestIdentity(request.headers),
    );
  } catch {
    return false;
  }
}

export function GET(request: Request): Response {
  if (!authorized(request)) return new Response("Not found.", { status: 404, headers: noStoreHeaders });
  try {
    return Response.json(readWatchlistUsageAdminSnapshot(), { headers: noStoreHeaders });
  } catch {
    return new Response(null, { status: 503, headers: noStoreHeaders });
  }
}
