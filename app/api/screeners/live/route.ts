import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readLiveScannerRuntime } from "@/src/modules/scanner/live/server/runtime";
import { handleLiveScannerGet } from "@/src/modules/scanner/live/server/backend-http";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  return handleLiveScannerGet(request,{ member: candidate => {
    try { return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(candidate.headers)); } catch { return false; }
  },read: () => readLiveScannerRuntime() });
}
