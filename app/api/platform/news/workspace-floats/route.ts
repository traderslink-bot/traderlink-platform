import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { hasSharedWorkspaceAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readLiveScannerRuntime, scannerSettingsStore, scannerUniverseStore } from "@/src/modules/scanner/live/server/runtime";
import { readCompanyData } from "@/src/lib/news/company-data-gateway";
import { readMarketEventsFloats } from "@/src/modules/news/server/market-events-floats";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request):Promise<Response>{
  const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"private, no-store"}});
  const authorized=()=>{
    const identity=requireTraderLinkPlatformRequestIdentity(request.headers);
    if(!hasPressReleaseDashboardAccess(identity)||
      !(hasSharedWorkspaceAccess(identity)||hasWatchlistDashboardNavigationAccess(identity)))throw new Error("Unavailable");
    return identity.scope.userId;
  };
  let actor:string;
  try{actor=authorized();}catch{return reply({},404);}
  const symbols=[...new Set((new URL(request.url).searchParams.get("symbols")??"").split(","))];
  if(!symbols.length||symbols.length>10||symbols.some(symbol=>!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol)))return reply({},400);
  try{
    const tradingDate=readLiveScannerRuntime().tradingDate;
    const [universe,floats]=await Promise.all([
      scannerUniverseStore().readLatestOnOrBefore(tradingDate),
      readMarketEventsFloats(symbols,{
        cached:requested=>scannerSettingsStore().readFloatFacts(tradingDate,requested),
        profile:symbol=>readCompanyData<{ticker?:string;floatingShare?:number}>("profile",symbol),
      }),
    ]);
    if(authorized()!==actor)return reply({},404);
    const requested=new Set(symbols);
    const exchanges=Object.fromEntries((universe?.stocks??[]).filter(stock=>requested.has(stock.symbol)).map(stock=>[stock.symbol,stock.exchange]));
    return reply({tradingDate,exchanges,floats});
  }catch{return reply({},503);}
}
