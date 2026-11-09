import {requireTraderLinkPlatformRequestIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {requirePlatformMutationRequest} from '@/src/modules/platform/server/authentication/platform-mutation-request-security';
import {hasWatchlistDashboardNavigationAccess} from '@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access';
import {scannerConnection} from '@/src/modules/scanner/live/server/scanner-connection';
import type {ScannerProvider} from '@/src/modules/scanner/live/server/provider-store';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
function owner(request:Request){try{return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(request.headers));}catch{return false;}}
export async function GET(request:Request){if(!owner(request))return reply({error:'not_found'},404);try{return reply(scannerConnection());}catch{return reply({error:'connection_unavailable'},503);}}
export async function POST(request:Request){
  if(!owner(request))return reply({error:'not_found'},404);
  try{requirePlatformMutationRequest(request);}catch{return reply({error:'invalid_request'},403);}
  try{
    const reader=request.body?.getReader();if(!reader)return reply({error:'invalid_request'},400);let text='';
    try{for(;;){const {done,value}=await reader.read();if(done)break;text+=new TextDecoder().decode(value);if(text.length>1024){await reader.cancel();return reply({error:'invalid_request'},400);}}}finally{reader.releaseLock();}
    const value=JSON.parse(text) as {provider:ScannerProvider;revision:number};
    if(!['alpaca','moomoo'].includes(value.provider)||!Number.isSafeInteger(value.revision))return reply({error:'invalid_request'},400);
    const {changeScannerConnection}=await import("@/src/modules/scanner/live/server/runtime");
    return reply(await changeScannerConnection(value.provider,value.revision));
  }catch(error){const code=error instanceof Error?error.message:'';return reply({error:['scanner_connection_conflict','scanner_connection_busy','scanner_connection_not_configured'].includes(code)?code:'connection_unavailable'},code==='scanner_connection_conflict'||code==='scanner_connection_busy'?409:code==='scanner_connection_not_configured'?400:503);}
}
