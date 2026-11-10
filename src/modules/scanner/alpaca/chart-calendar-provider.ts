import type {Candle} from './candles';
import {easternClock} from '../live/sessions';
import {parseCalendarSessions,type ChartCalendar,type ChartMarketSession} from './chart-calendar';
/** Calendar-only Trading API access; never queries accounts or trading operations. */
export class AlpacaChartCalendar{
 private years=new Map<number,{at:number;rows:ChartMarketSession[]}>();
 private pending=new Map<number,Promise<ChartMarketSession[]>>();
 constructor(private readonly credentials:{keyId:string;secretKey:string},private readonly transport:typeof fetch=fetch,private readonly now:()=>number=Date.now){}
 async forYear(year:number):Promise<ChartCalendar>{
  if(!Number.isInteger(year)||year<1970||year>9999)throw Error('invalid_calendar_year');
  try{return {available:true,start:`${year}-01-01`,end:`${year}-12-31`,sessions:await this.year(year)};}catch{return {available:false};}
 }
 async forHistory(bars:readonly Candle[]):Promise<ChartCalendar[]>{
  if(!bars.length)return [];
  const first=Number(easternClock(bars.reduce((value,bar)=>Math.min(value,bar.time),Infinity)*1000).date.slice(0,4));
  const last=Number(easternClock(bars.reduce((value,bar)=>Math.max(value,bar.time),-Infinity)*1000).date.slice(0,4));
  if(!Number.isInteger(first)||!Number.isInteger(last)||last-first>10)return [{available:false}];
  const result:ChartCalendar[]=[];
  for(let year=first;year<=last;year++){
   try{result.push({available:true,start:`${year}-01-01`,end:`${year}-12-31`,sessions:await this.year(year)});}
   catch{result.push({available:false});}
  }
  return result;
 }
 async forBars(bars:readonly Candle[]):Promise<ChartCalendar>{
  if(!bars.length)return {available:false};
  const first=easternClock(bars.reduce((value,bar)=>Math.min(value,bar.time),Infinity)*1000).date,last=easternClock(bars.reduce((value,bar)=>Math.max(value,bar.time),-Infinity)*1000).date,startYear=Number(first.slice(0,4)),endYear=Number(last.slice(0,4));
  if(!Number.isInteger(startYear)||!Number.isInteger(endYear)||endYear-startYear>1)return {available:false};
  try{
   const rows:ChartMarketSession[]=[];for(let year=startYear;year<=endYear;year++)rows.push(...await this.year(year));
   return {available:true,start:`${startYear}-01-01`,end:`${endYear}-12-31`,sessions:rows};
  }catch{return {available:false};}
 }
 private async year(year:number):Promise<ChartMarketSession[]>{
  const cached=this.years.get(year);if(cached&&this.now()-cached.at<86_400_000)return cached.rows;
  const current=this.pending.get(year);if(current)return current;
  if(this.pending.size>=2)throw Error('chart_calendar_busy');
  const load=async()=>{
   const start=`${year}-01-01`,end=`${year}-12-31`,url=new URL('https://paper-api.alpaca.markets/v2/calendar');url.search=new URLSearchParams({start,end}).toString();
   const response=await this.transport(url,{method:'GET',headers:{'APCA-API-KEY-ID':this.credentials.keyId,'APCA-API-SECRET-KEY':this.credentials.secretKey},redirect:'error',signal:AbortSignal.timeout(10_000)});
   if(!response.ok)throw Error('chart_calendar_unavailable');
   const rows=parseCalendarSessions(await response.json(),start,end);if(rows.length<200)throw Error('chart_calendar_incomplete');
   this.years.set(year,{at:this.now(),rows});while(this.years.size>32)this.years.delete(this.years.keys().next().value!);return rows;
  };
  const request=load().finally(()=>this.pending.delete(year));this.pending.set(year,request);return request;
 }
}
