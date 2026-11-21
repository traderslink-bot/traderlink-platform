import { browserDataRead } from "@/src/modules/market-data/server/browser-data-errors";
import {browserVwapSeed} from "@/src/modules/market-data/server/browser-vwap-seed";
import {marketDataSelection} from "@/src/modules/market-data/server/provider-settings";
import {matchesBrowserDataSession} from "@/src/modules/market-data/server/browser-data-session";
import {requireTraderLinkPlatformRequestIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {requestAlpacaGateway} from '@/src/modules/scanner/alpaca/client';
import {parseVwapSeedRequest,validVwapSeed} from '@/src/modules/scanner/alpaca/chart-vwap-seed';
import {easternClock} from '@/src/modules/scanner/live/sessions';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function readGET(request:Request){
 try{requireTraderLinkPlatformRequestIdentity(request.headers);}catch{return reply({error:'not_authenticated'},401);}
 let query:ReturnType<typeof parseVwapSeedRequest>;
 try{query=parseVwapSeedRequest(new URL(request.url).searchParams);}catch{return reply({error:'invalid_vwap_seed'},400);}
 const selection=marketDataSelection("charts"),params=new URL(request.url).searchParams;
 if(!matchesBrowserDataSession(params,"charts",selection))return reply({error:"provider_changed"},409);
 const selectedReply=(value:unknown)=>{const current=marketDataSelection("charts");return current.provider===selection.provider&&current.revision===selection.revision?reply(value):reply({error:"provider_changed"},409);};
 try{
  if(selection.provider==="moomoo"){
    const {readMoomooChartVwapSeed}=await import("@/src/modules/market-data/server/moomoo-chart-response");
    return selectedReply(browserVwapSeed(await readMoomooChartVwapSeed(query)));
  }
  const result=await requestAlpacaGateway('vwap-seed',new URLSearchParams(Object.entries(query).map(([key,value])=>[key,typeof value==='boolean'?value?'1':'0':String(value)])),process.env,request.signal);if(!validVwapSeed(result,query,easternClock(Date.now()).date))throw Error();return selectedReply(browserVwapSeed(result));}catch{return reply({error:'vwap_history_unavailable'},503);}
}

export const GET = browserDataRead("vwap_history_unavailable", (request: Request) => readGET(request));
