import { browserDataRead } from "@/src/modules/market-data/server/browser-data-errors";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { hasChartsDashboardAccess } from "@/src/modules/market-data/server/chart-dashboard-access";
import { hasSharedWorkspaceAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { companySymbol,readCompanySnapshot } from "@/src/modules/company/server/company-snapshot";
import { companyUniverseEntry,hasCompanyMarketSymbol } from "@/src/modules/company/server/company-market-data";
import { companyTechnicalSample } from "@/src/modules/company/server/company-technical-samples";

async function readGET(request:Request){
  const headers={"Cache-Control":"private, no-store"};
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
  let identity;
  try{identity=requireTraderLinkPlatformRequestIdentity(request.headers);}
  catch{return reply({},401);}
  if(!hasChartsDashboardAccess(identity)&&!hasSharedWorkspaceAccess(identity))return reply({},404);
  const query=new URL(request.url).searchParams;
  const symbol=companySymbol(query.get("symbol")??"");
  const view=query.get("view");
  if(!symbol)return reply({},404);
  const local=identity.mode==="local_development"&&process.env.NODE_ENV!=="production";
  const readNews=()=>hasPressReleaseDashboardAccess(identity)?withReadonlyPlatformDatabase({},db=>
    new PressReleaseDashboardRepository(db).list({scope:identity.scope,channel:"all",ticker:symbol,limit:50})
      .map(article=>({id:article.id,title:article.headline,date:article.publishedAt,href:article.publicPath}))):[];
  if(view==="news")return reply({news:readNews()});
  const entry=await companyUniverseEntry(symbol);
  const company=await readCompanySnapshot(symbol,view==="overview"?"overview":"full",!entry);
  if(!entry&&!company.cik&&!company.profile&&!company.companyProfile&&!await hasCompanyMarketSymbol(symbol))return reply({},404);
  const technicalSample=local&&!process.env.TRADERLINK_ALPACA_GATEWAY_URL?companyTechnicalSample(symbol):undefined;
  const details={company,technicalSample,scannerMember:Boolean(entry)};
  return reply(view==="company"||view==="overview"?details:{...details,news:readNews()});
}

export const GET = browserDataRead("company_details_unavailable", (request: Request) => readGET(request));
