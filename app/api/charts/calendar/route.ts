import {hasSharedChartDataAccess} from "@/src/modules/market-data/server/chart-dashboard-access";
import { browserDataRead } from "@/src/modules/market-data/server/browser-data-errors";
import {marketDataSelection} from "@/src/modules/market-data/server/provider-settings";
import {matchesBrowserDataSession} from "@/src/modules/market-data/server/browser-data-session";
import {requireTraderLinkPlatformRequestIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {requestAlpacaGateway} from '@/src/modules/scanner/alpaca/client';
import {parseChartCalendarYear,readChartCalendarYear} from '@/src/modules/scanner/alpaca/chart-calendar-request';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function readGET(request:Request){
 let identity: ReturnType<typeof requireTraderLinkPlatformRequestIdentity>;
 try{identity=requireTraderLinkPlatformRequestIdentity(request.headers);}catch{return reply({error:'not_authenticated'},401);}
 if(!hasSharedChartDataAccess(identity))return reply({error:'chart_access_denied'},403);
 let year:number;try{year=parseChartCalendarYear(new URL(request.url).searchParams);}catch{return reply({error:'invalid_calendar_year'},400);}
 const selection=marketDataSelection("charts"),params=new URL(request.url).searchParams;
 if(!matchesBrowserDataSession(params,"charts",selection))return reply({error:"provider_changed"},409);
 const selectedReply=(value:unknown)=>{const current=marketDataSelection("charts");return current.provider===selection.provider&&current.revision===selection.revision?reply(value):reply({error:"provider_changed"},409);};
 try{
  if(selection.provider==="moomoo"){
    const {readMoomooChartCalendar}=await import("@/src/modules/market-data/server/moomoo-chart-response");
    return selectedReply(await readMoomooChartCalendar(year));
  }
  const result=await requestAlpacaGateway('calendar',new URLSearchParams({year:String(year)}),process.env,AbortSignal.any([request.signal,AbortSignal.timeout(12_000)]));return selectedReply(readChartCalendarYear(result,year));}catch{return reply({error:'chart_calendar_unavailable'},503);}
}

export const GET = browserDataRead("chart_calendar_unavailable", (request: Request) => readGET(request));
