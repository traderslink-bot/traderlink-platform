import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readLiveScannerRuntime,scannerSettingsStore,scannerUniverseStore } from "@/src/modules/scanner/live/server/runtime";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { handleScannerFloatsGet } from "@/src/modules/scanner/live/server/backend-http";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request):Promise<Response>{
  return handleScannerFloatsGet(request,{ owner:candidate=>{
    try{return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(candidate.headers));}
    catch{return false;}
  },read:async symbols=>{
    const tradingDate=readLiveScannerRuntime().tradingDate;
    const universe=await scannerUniverseStore().readLatestOnOrBefore(tradingDate),requested=new Set(symbols);
    const exchanges=Object.fromEntries((universe?.stocks??[]).filter(stock=>requested.has(stock.symbol)).map(stock=>[stock.symbol,stock.exchange]));
    return { tradingDate,exchanges,floats:await scannerSettingsStore().readFloatFacts(tradingDate,symbols) };
  }});
}
