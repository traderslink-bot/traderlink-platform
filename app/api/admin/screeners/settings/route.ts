import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { scannerSettingsStore } from "@/src/modules/scanner/live/server/runtime";
import { handleScannerSettings } from "@/src/modules/scanner/live/server/backend-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function owner(request: Request): boolean {
  try { return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(request.headers)); }
  catch { return false; }
}
export async function GET(request: Request): Promise<Response> {
  return handleScannerSettings(request,{ owner,mutation: () => false,configuration: () => scannerSettingsStore().configuration(),
    save: (configuration,revision) => scannerSettingsStore().save(configuration,revision,Date.now()) });
}
export async function POST(request: Request): Promise<Response> {
  return handleScannerSettings(request,{ owner,mutation: candidate => {
    try { requirePlatformMutationRequest(candidate); return true; } catch { return false; }
  },configuration: () => scannerSettingsStore().configuration(),
  save: (configuration,revision) => scannerSettingsStore().save(configuration,revision,Date.now()) });
}
