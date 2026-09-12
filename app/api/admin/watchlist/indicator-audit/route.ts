import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { watchlistIndicatorAuditStore } from "@/src/modules/watchlist/server/indicators/indicator-audit-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const headers = { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff" };

export async function GET(request: Request): Promise<Response> {
  // Check authorization before opening storage or reporting whether an ID exists.
  try {
    if (!hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(request.headers))) {
      return new Response("Not found.", { status: 404, headers });
    }
  } catch { return new Response("Not found.", { status: 404, headers }); }
  const query = new URL(request.url).searchParams;
  const calculationId = query.get("calculation");
  const before = query.get("before");
  const rawLimit = query.get("limit");
  if ((calculationId !== null && !UUID.test(calculationId))
    || (before !== null && !/^\d{13}_[0-9a-f-]{36}\.json$/u.test(before))
    || (rawLimit !== null && (!/^\d{1,3}$/u.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 100))) {
    return Response.json({ error: "Invalid audit request." }, { status: 400, headers });
  }
  try {
    const store = watchlistIndicatorAuditStore();
    if (calculationId) {
      const result = await store.calculation(calculationId);
      return Response.json(result, { status: result.status === "retained" ? 200 : 410,
        headers: { ...headers, "content-disposition": `attachment; filename="watchlist-indicator-calculation-${calculationId}.json"` } });
    }
    return Response.json(await store.history({ ...(before ? { before } : {}), ...(rawLimit ? { limit: Number(rawLimit) } : {}) }), { headers });
  } catch {
    return Response.json({ error: "Indicator audit is unavailable." }, { status: 503, headers });
  }
}
