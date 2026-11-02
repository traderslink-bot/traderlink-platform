import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { scannerAuditRecorder } from "@/src/modules/scanner/live/server/runtime";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request):Promise<Response>{
  try{const identity=requireTraderLinkPlatformRequestIdentity(request.headers);if(!hasWatchlistDashboardNavigationAccess(identity))throw Error("not_found");}
  catch{return Response.json({code:"not_found"},{status:404});}
  try{
    const url=new URL(request.url),date=url.searchParams.get("date")??"",symbol=(url.searchParams.get("symbol")??"").trim().toUpperCase();
    const beforeUtc=url.searchParams.get("before")??undefined;
    const page=await scannerAuditRecorder().timeline(date,symbol,{beforeUtc,limit:250});
    return Response.json({date,symbol,...page},{headers:{"cache-control":"private, no-store, max-age=0"}});
  }catch(error){return Response.json({code:error instanceof Error&&error.message==="scanner_audit_query_invalid"?"invalid_query":"audit_unavailable"},
    {status:error instanceof Error&&error.message==="scanner_audit_query_invalid"?400:503});}
}
