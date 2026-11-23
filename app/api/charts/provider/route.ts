import { hasSharedChartDataAccess } from "@/src/modules/market-data/server/chart-dashboard-access";
import { hasMarketToolsDashboardReadAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { browserDataSession } from "@/src/modules/market-data/server/browser-data-session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  let identity: ReturnType<typeof requireTraderLinkPlatformRequestIdentity>;
  try { identity = requireTraderLinkPlatformRequestIdentity(request.headers); }
  catch { return Response.json({ error: "not_authenticated" }, { status: 401, headers }); }
  const feature=new URL(request.url).searchParams.get("feature")??"charts";
  if(feature!=="charts"&&feature!=="scanners")return Response.json({error:"invalid_feature"},{status:400,headers});
  try {
    const allowed = feature === "charts" ? hasSharedChartDataAccess(identity) : hasMarketToolsDashboardReadAccess(identity);
    if (!allowed) return Response.json({ error: "chart_access_denied" }, { status: 403, headers });
    return Response.json(browserDataSession(feature, marketDataSelection(feature)), { headers });
  }
  catch { return Response.json({ error: "selection_unavailable" }, { status: 503, headers }); }
}
