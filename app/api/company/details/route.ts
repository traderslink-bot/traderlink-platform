import { browserDataRead } from "@/src/modules/market-data/server/browser-data-errors";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { companySymbol,readCompanySnapshot } from "@/src/modules/company/server/company-snapshot";
import { companyUniverseEntry } from "@/src/modules/company/server/company-market-data";
import { companyTechnicalSample } from "@/src/modules/company/server/company-technical-samples";

async function readGET(request:Request){
  const headers={"Cache-Control":"private, no-store"};
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
  let identity;
  try{identity=requireTraderLinkPlatformRequestIdentity(request.headers);}
  catch{return reply({},401);}
  if(!hasWatchlistDashboardNavigationAccess(identity))return reply({},404);
  const symbol=companySymbol(new URL(request.url).searchParams.get("symbol")??"");
  if(!symbol)return reply({},404);
  const local=identity.mode==="local_development"&&process.env.NODE_ENV!=="production";
  const entry=await companyUniverseEntry(symbol);
  if(!entry&&!local)return reply({},404);
  const company=await readCompanySnapshot(symbol);
  if(!entry&&!company.companyProfile)return reply({},404);
  const news=hasPressReleaseDashboardAccess(identity)?withReadonlyPlatformDatabase({},db=>
    new PressReleaseDashboardRepository(db).list({scope:identity.scope,channel:"all",ticker:symbol,limit:50})
      .map(article=>({id:article.id,title:article.headline,date:article.publishedAt,href:article.publicPath}))):[];
  return reply({company,news,technicalSample:local&&!process.env.TRADERLINK_ALPACA_GATEWAY_URL?companyTechnicalSample(symbol):undefined});
}

export const GET = browserDataRead("company_details_unavailable", (request: Request) => readGET(request));
