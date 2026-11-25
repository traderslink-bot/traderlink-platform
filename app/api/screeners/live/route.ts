import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { handleLiveScannerGet } from "@/src/modules/scanner/live/server/backend-http";
import { hasMarketToolsDashboardReadAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { subscribeLiveScannerRuntime } from "@/src/modules/scanner/live/server/runtime";
import { readLiveWorkspaceScannerModel } from "@/src/modules/scanner/live/server/live-workspace-model";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  return handleLiveScannerGet(request,{ subscribe:subscribeLiveScannerRuntime, member: candidate => {
    try { return hasMarketToolsDashboardReadAccess(requireTraderLinkPlatformRequestIdentity(candidate.headers)); } catch { return false; }
  }, read: readLiveWorkspaceScannerModel });
}
