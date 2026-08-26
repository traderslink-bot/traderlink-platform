import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import {
  readWatchlistRuntimeConsoleDocument,
  type WatchlistRuntimeConsoleView,
} from "@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-document";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VIEWS = new Set<WatchlistRuntimeConsoleView>([
  "ai-clean-read",
  "trade-plan-review",
]);

function authorized(request: Request): boolean {
  try {
    return hasWatchlistDashboardNavigationAccess(
      requireTraderLinkPlatformRequestIdentity(request.headers),
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ view: string }> }>,
): Promise<Response> {
  if (!authorized(request)) return new Response("Not found.", { status: 404 });
  const { view } = await context.params;
  if (!VIEWS.has(view as WatchlistRuntimeConsoleView)) {
    return new Response("Not found.", { status: 404 });
  }
  const result = await readWatchlistRuntimeConsoleDocument(
    view as WatchlistRuntimeConsoleView,
  );
  return new Response(result.body, {
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "content-type": result.contentType,
      "x-content-type-options": "nosniff",
    },
    status: result.status,
  });
}
