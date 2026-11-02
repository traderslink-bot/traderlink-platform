import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readWatchlistRuntimeConsoleDocument } from "@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-document";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  try {
    return hasWatchlistDashboardNavigationAccess(
      requireTraderLinkPlatformRequestIdentity(request.headers),
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return new Response("Not found.", { status: 404 });
  const result = await readWatchlistRuntimeConsoleDocument("manual-watchlist");
  return new Response(result.body, {
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "content-type": result.contentType,
      "x-content-type-options": "nosniff",
    },
    status: result.status,
  });
}
