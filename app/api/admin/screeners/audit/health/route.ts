import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readScannerAuditHealth } from "@/src/modules/scanner/live/server/runtime";

export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request):Promise<Response>{
  try{const identity=requireTraderLinkPlatformRequestIdentity(request.headers);if(!hasWatchlistDashboardNavigationAccess(identity))throw Error("not_found");}
  catch{return Response.json({code:"not_found"},{status:404});}
  try{return Response.json({health:readScannerAuditHealth()},{headers:{"cache-control":"private, no-store, max-age=0"}});}
  catch{return Response.json({code:"audit_unavailable"},{status:503});}
}
