import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { scannerAuditRecorder } from "@/src/modules/scanner/live/server/runtime";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request):Promise<Response>{
  try{const identity=requireTraderLinkPlatformRequestIdentity(request.headers);if(!hasWatchlistDashboardNavigationAccess(identity))throw Error("not_found");}
  catch{return Response.json({code:"not_found"},{status:404});}
  try{
    const query=new URL(request.url).searchParams,date=query.get("date")??"",scannerValue=query.get("scanner"),scanner=scannerValue==="gainers"?"gainers":scannerValue==="momentum"?"momentum":null;
    if(scanner===null)throw Error("scanner_audit_query_invalid");
    const page=await scannerAuditRecorder().rejections(date,{scanner,session:query.get("session")??undefined,reason:query.get("reason")??undefined,
      symbol:query.get("symbol")??undefined,cursor:query.get("cursor")??undefined,limit:50});
    return Response.json({date,scanner,...page},{headers:{"cache-control":"private, no-store, max-age=0"}});
  }catch(error){const invalid=error instanceof Error&&error.message==="scanner_audit_query_invalid";return Response.json({code:invalid?"invalid_query":"audit_unavailable"},{status:invalid?400:503});}
}
