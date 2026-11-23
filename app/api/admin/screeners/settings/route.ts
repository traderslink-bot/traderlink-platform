import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { scannerSettingsStore } from "@/src/modules/scanner/live/server/runtime";
import { handleScannerSettings } from "@/src/modules/scanner/live/server/backend-http";

import { marketEventsPressReleaseMaximumMarketCap, momentumDetectionControls, momentumLiquidityBypassControls } from "@/src/modules/scanner/live/settings";
import { DEFAULT_DECLINE_CONTROLS } from "@/src/modules/scanner/live/declines";
import { DEFAULT_PREMARKET_PULLBACK_CONTROLS } from "@/src/modules/scanner/live/premarket-pullbacks";
import type { ScannerAdminConfiguration, ScannerConfiguration } from "@/src/modules/scanner/live/contracts";

function adminConfiguration(configuration: ScannerConfiguration): ScannerAdminConfiguration {
  return {
    ...configuration,
    momentumDetection: momentumDetectionControls(configuration),
    momentumLiquidityBypass: momentumLiquidityBypassControls(configuration),
    marketEventsPressReleaseMaximumMarketCap: marketEventsPressReleaseMaximumMarketCap(configuration),
    declines: configuration.declines ?? DEFAULT_DECLINE_CONTROLS,
    premarketPullbacks: configuration.premarketPullbacks ?? DEFAULT_PREMARKET_PULLBACK_CONTROLS,
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function owner(request: Request): boolean {
  try { return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(request.headers)); }
  catch { return false; }
}
export async function GET(request: Request): Promise<Response> {
  return handleScannerSettings(request,{ owner,mutation: () => false,configuration: async () => adminConfiguration(await scannerSettingsStore().configuration()),
    save: async (configuration,revision) => adminConfiguration(await scannerSettingsStore().save(configuration,revision,Date.now())) });
}
export async function POST(request: Request): Promise<Response> {
  return handleScannerSettings(request,{ owner,mutation: candidate => {
    try { requirePlatformMutationRequest(candidate); return true; } catch { return false; }
  },configuration: async () => adminConfiguration(await scannerSettingsStore().configuration()),
  save: async (configuration,revision) => adminConfiguration(await scannerSettingsStore().save(configuration,revision,Date.now())) });
}
