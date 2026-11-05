import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { listMarketHaltDashboard } from "@/src/modules/news/server/market-halt-dashboard";
import { MARKET_HALT_MAXIMUM_MARKET_CAP } from "@/src/modules/news/server/market-halt-universe-filter";
import { selectActiveScannerHalts } from "@/src/modules/scanner/live/active-halts";
import { readLiveScannerMarketMovements, readLiveScannerRuntime } from "@/src/modules/scanner/live/server/runtime";
import { handleLiveScannerGet } from "@/src/modules/scanner/live/server/backend-http";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  return handleLiveScannerGet(request,{ member: candidate => {
    try { return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(candidate.headers)); } catch { return false; }
  },read: async () => {
    const scanner=readLiveScannerRuntime();
    try{
      const now=new Date();
      const universe=await scannerUniverseStore().readLatestOnOrBefore(scanner.tradingDate);
      const eligible=new Set((universe?.stocks??[]).filter(stock=>stock.marketCapAtCollection<=MARKET_HALT_MAXIMUM_MARKET_CAP).map(stock=>stock.symbol));
      const halts=withReadonlyPlatformDatabase({},database=>listMarketHaltDashboard(database,now,50,eligible).rows);
      const activeHalts=selectActiveScannerHalts(halts,now,readLiveScannerMarketMovements());
      return {...scanner,activeHalts};
    }catch{return scanner;}
  } });
}
