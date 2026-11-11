import {requireTraderLinkPlatformRequestIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {requestAlpacaGateway} from '@/src/modules/scanner/alpaca/client';
import {parseVwapSeedRequest,validVwapSeed} from '@/src/modules/scanner/alpaca/chart-vwap-seed';
import {easternClock} from '@/src/modules/scanner/live/sessions';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){
 try{requireTraderLinkPlatformRequestIdentity(request.headers);}catch{return reply({error:'not_authenticated'},401);}
 let query:ReturnType<typeof parseVwapSeedRequest>;
 try{query=parseVwapSeedRequest(new URL(request.url).searchParams);}catch{return reply({error:'invalid_vwap_seed'},400);}
 try{const result=await requestAlpacaGateway('vwap-seed',new URLSearchParams(Object.entries(query).map(([key,value])=>[key,typeof value==='boolean'?value?'1':'0':String(value)])),process.env,request.signal);if(!validVwapSeed(result,query,easternClock(Date.now()).date))throw Error();return reply(result);}catch{return reply({error:'vwap_history_unavailable'},503);}
}
