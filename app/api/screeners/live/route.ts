import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { listMarketHaltDashboard } from "@/src/modules/news/server/market-halt-dashboard";
import { selectActiveScannerHalts } from "@/src/modules/scanner/live/active-halts";
import { readLiveScannerMarketMovements, readLiveScannerRuntime, scannerUniverseStore } from "@/src/modules/scanner/live/server/runtime";
import { handleLiveScannerGet } from "@/src/modules/scanner/live/server/backend-http";
import { readFinnhubExchanges } from "@/src/modules/scanner/live/server/finnhub-exchange";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { eodhdResumedHaltIds } from "@/src/modules/news/server/eodhd-halt-resumption-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  return handleLiveScannerGet(request,{ member: candidate => {
    try { return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(candidate.headers)); } catch { return false; }
  },read: async () => {
    const scanner=readLiveScannerRuntime();
    try{
      const now=new Date();
      const halts=withReadonlyPlatformDatabase({},database=>listMarketHaltDashboard(database,now,50).rows);
      const universe=await scannerUniverseStore().readLatestOnOrBefore(scanner.tradingDate);
      const universeExchanges=new Map((universe?.stocks??[]).map(stock=>[stock.symbol,stock.exchange] as const));
      const selected=selectActiveScannerHalts(halts,now,readLiveScannerMarketMovements(),universeExchanges,eodhdResumedHaltIds());
      const missing=selected.filter(halt=>halt.chartExchange===null).map(halt=>halt.ticker);
      const resolved=readFinnhubExchanges({tradingDate:scanner.tradingDate,symbols:missing,token:process.env.FINNHUB_API_KEY});
      const activeHalts=selected.map(halt=>halt.chartExchange?halt:{...halt,chartExchange:resolved.get(halt.ticker)??null});
      return {...scanner,activeHalts};
    }catch{return scanner;}
  } });
}
