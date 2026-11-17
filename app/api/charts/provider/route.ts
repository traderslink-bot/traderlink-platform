import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try { requireTraderLinkPlatformRequestIdentity(request.headers); }
  catch { return Response.json({ error: "not_authenticated" }, { status: 401, headers }); }
  const feature=new URL(request.url).searchParams.get("feature")??"charts";
  if(feature!=="charts"&&feature!=="scanners")return Response.json({error:"invalid_feature"},{status:400,headers});
  try { return Response.json(marketDataSelection(feature), { headers }); }
  catch { return Response.json({ error: "selection_unavailable" }, { status: 503, headers }); }
}
