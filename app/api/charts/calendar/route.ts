import {requireTraderLinkPlatformRequestIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {requestAlpacaGateway} from '@/src/modules/scanner/alpaca/client';
import {parseChartCalendarYear,readChartCalendarYear} from '@/src/modules/scanner/alpaca/chart-calendar-request';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){
 try{requireTraderLinkPlatformRequestIdentity(request.headers);}catch{return reply({error:'not_authenticated'},401);}
 let year:number;try{year=parseChartCalendarYear(new URL(request.url).searchParams);}catch{return reply({error:'invalid_calendar_year'},400);}
 try{const result=await requestAlpacaGateway('calendar',new URLSearchParams({year:String(year)}),process.env,AbortSignal.any([request.signal,AbortSignal.timeout(12_000)]));return reply(readChartCalendarYear(result,year));}catch{return reply({error:'chart_calendar_unavailable'},503);}
}
