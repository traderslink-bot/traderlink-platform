import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { scannerAuditRecorder } from "@/src/modules/scanner/live/server/runtime";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request):Promise<Response>{
  try{const identity=requireTraderLinkPlatformRequestIdentity(request.headers);if(!hasWatchlistDashboardNavigationAccess(identity))throw Error("not_found");}
  catch{return Response.json({code:"not_found"},{status:404});}
  try{const date=new URL(request.url).searchParams.get("date")??"";return Response.json({review:scannerAuditRecorder().dailyReview(date)},{headers:{"cache-control":"private, no-store, max-age=0"}});}
  catch(error){const invalid=error instanceof Error&&error.message==="scanner_audit_query_invalid";return Response.json({code:invalid?"invalid_query":"audit_unavailable"},{status:invalid?400:503});}
}
