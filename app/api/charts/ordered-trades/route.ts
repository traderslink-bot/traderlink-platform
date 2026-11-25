import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { proxyOrderedChartTrades } from "@/src/modules/scanner/alpaca/ordered-chart-trade-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let identity: ReturnType<typeof requireTraderLinkPlatformRequestIdentity>;
  try {
    identity = requireTraderLinkPlatformRequestIdentity(request.headers);
  } catch {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  return proxyOrderedChartTrades(request, identity);
}
