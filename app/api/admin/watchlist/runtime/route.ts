import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import {
  readWatchlistRuntimeAdminSnapshot,
  requestWatchlistRuntime,
} from "@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-client";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Action =
  | "activate"
  | "deactivate"
  | "move"
  | "refreshLevels"
  | "repostSnapshot"
  | "historicalProvider"
  | "liveProvider"
  | "aiReadModel"
  | "aiReadGeneration"
  | "aiReadExternalResearch"
  | "aiReadCostBudget"
  | "aiReadBoundaryRefreshes"
  | "liveTraderReadCard"
  | "potentialGainCard"
  | "lifecycleLabels"
  | "reversalWatchlist"
  | "topRegularWatchlist"
  | "dayTradeAdapter";

const ACTION_PATHS: Readonly<Record<Action, string>> = Object.freeze({
  activate: "/api/watchlist/activate",
  deactivate: "/api/watchlist/deactivate",
  move: "/api/watchlist/move-to-list",
  refreshLevels: "/api/watchlist/refresh-levels",
  repostSnapshot: "/api/watchlist/repost-snapshot",
  historicalProvider: "/api/runtime/historical-provider",
  liveProvider: "/api/runtime/live-provider",
  aiReadModel: "/api/runtime/ai-read-model",
  aiReadGeneration: "/api/runtime/ai-read-generation",
  aiReadExternalResearch: "/api/runtime/ai-read-external-research",
  aiReadCostBudget: "/api/runtime/ai-read-cost-budget",
  aiReadBoundaryRefreshes: "/api/runtime/ai-read-boundary-refreshes",
  liveTraderReadCard: "/api/runtime/live-trader-read-card",
  potentialGainCard: "/api/runtime/potential-gain-card",
  lifecycleLabels: "/api/runtime/watchlist-lifecycle-labels",
  reversalWatchlist: "/api/runtime/reversal-watchlist",
  topRegularWatchlist: "/api/runtime/top-regular-watchlist",
  dayTradeAdapter: "/api/runtime/day-trade-adapter",
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
  if (!authorized(request)) return Response.json({ code: "not_found" }, { status: 404 });
  const snapshot = await readWatchlistRuntimeAdminSnapshot();
  const available = snapshot.runtime.ok && snapshot.watchlist.ok && snapshot.audit.ok;
  return Response.json(
    { available, snapshot },
    { headers: { "cache-control": "private, no-store, max-age=0" }, status: available ? 200 : 503 },
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ code: "not_found" }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ code: "invalid_request" }, { status: 400 }); }
  if (!isRecord(body) || typeof body.action !== "string" || !(body.action in ACTION_PATHS)) {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }
  const action = body.action as Action;
  const payload = isRecord(body.payload) ? body.payload : {};
  const result = await requestWatchlistRuntime({ body: payload, method: "POST", path: ACTION_PATHS[action] });
  return Response.json(result.body, {
    headers: { "cache-control": "private, no-store, max-age=0" },
    status: result.status,
  });
}
