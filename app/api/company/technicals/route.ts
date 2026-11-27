import { browserDataRead } from "@/src/modules/market-data/server/browser-data-errors";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasChartsDashboardAccess } from "@/src/modules/market-data/server/chart-dashboard-access";
import { hasMarketToolsDashboardReadAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { companySymbol } from "@/src/modules/company/server/company-snapshot";
import { companyUniverseEntry,readCompanyTechnicals,readCompanyYearRange } from "@/src/modules/company/server/company-market-data";

export const runtime="nodejs";
export const dynamic="force-dynamic";

async function readGET(request:Request){
  const headers={"Cache-Control":"private, no-store"};
  try{
    const identity=requireTraderLinkPlatformRequestIdentity(request.headers);
    if(!hasChartsDashboardAccess(identity)&&!hasMarketToolsDashboardReadAccess(identity)){
      return Response.json({}, {status:404,headers});
    }
  }
  catch{return Response.json({error:"Sign in required"},{status:401,headers});}
  const query=new URL(request.url).searchParams;
  const symbol=companySymbol(query.get("symbol")??"");
  const entry=symbol?await companyUniverseEntry(symbol):undefined;
  if(!symbol||!entry)return Response.json({error:"Ticker outside the Scanner universe"},{status:404,headers});
  if(query.get("range")==="52w")return Response.json({yearRange:await readCompanyYearRange(symbol,query.get("adjustment")==="split")},{headers});
  return Response.json(await readCompanyTechnicals(symbol,entry),{headers});
}

export const GET = browserDataRead("company_technicals_unavailable", (request: Request) => readGET(request));
