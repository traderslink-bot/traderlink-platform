import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { requestWatchlistRuntimeRaw } from "@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-client";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SupportedMethod = "GET" | "POST";

const GET_PATHS = new Set([
  "/api/ai-clean-read",
  "/api/runtime/ai-read-audit",
  "/api/runtime/day-trade-adapter",
  "/api/runtime/status",
  "/api/trade-plan-review",
  "/api/watchlist",
]);

const POST_PATHS = new Set([
  "/api/ai-clean-read/comments",
  "/api/ai-clean-read/generate",
  "/api/discord/clear-watchlist-channel",
  "/api/runtime/ai-read-boundary-refreshes",
  "/api/runtime/ai-read-cost-budget",
  "/api/runtime/ai-read-external-research",
  "/api/runtime/ai-read-generation",
  "/api/runtime/ai-read-model",
  "/api/runtime/auto-watchlist-selector",
  "/api/runtime/auto-watchlist-selector/preview",
  "/api/runtime/day-trade-adapter",
  "/api/runtime/day-trade-adapter/refresh",
  "/api/runtime/historical-provider",
  "/api/runtime/live-provider",
  "/api/runtime/same-day-candle-provider",
  "/api/runtime/live-trader-read-card",
  "/api/runtime/potential-gain-card",
  "/api/runtime/reversal-watchlist",
  "/api/runtime/top-regular-watchlist",
  "/api/runtime/watchlist-lifecycle-labels",
  "/api/trade-plan-review/notes",
  "/api/watchlist/activate",
  "/api/watchlist/ai-read-dip-buy-visibility",
  "/api/watchlist/ai-read-refresh",
  "/api/watchlist/ai-read-visibility",
  "/api/watchlist/deactivate",
  "/api/watchlist/deactivate-bulk",
  "/api/watchlist/move-to-list",
  "/api/watchlist/refresh-levels",
  "/api/watchlist/remove-from-list",
  "/api/watchlist/repost-snapshot",
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

async function relay(
  request: Request,
  context: Readonly<{ params: Promise<{ path: string[] }> }>,
  method: SupportedMethod,
): Promise<Response> {
  if (!authorized(request)) return Response.json({ code: "not_found" }, { status: 404 });
  const { path: segments } = await context.params;
  if (
    !segments.length ||
    segments.some((segment) => !/^[A-Za-z0-9._-]+$/.test(segment) || segment === "." || segment === "..")
  ) {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }

  const pathname = `/api/${segments.join("/")}`;
  const allowed = method === "GET" ? GET_PATHS.has(pathname) : POST_PATHS.has(pathname);
  if (!allowed) return Response.json({ code: "not_found" }, { status: 404 });

  const incomingUrl = new URL(request.url);
  const result = await requestWatchlistRuntimeRaw({
    body: method === "POST" ? await request.text() : undefined,
    contentType: request.headers.get("content-type") ?? undefined,
    method,
    path: `${pathname}${incomingUrl.search}`,
  });
  return new Response(result.body, {
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "content-type": result.contentType,
      "x-content-type-options": "nosniff",
    },
    status: result.status,
  });
}

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ path: string[] }> }>,
): Promise<Response> {
  return relay(request, context, "GET");
}

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ path: string[] }> }>,
): Promise<Response> {
  return relay(request, context, "POST");
}
