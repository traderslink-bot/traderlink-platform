import {easternDayStart} from './candles';
import type {Candle} from './candles';
export type ChartMarketSession={date:string;open:string;close:string};
export type ChartSessionInterval={session:ChartMarketSession;start:number;end:number;closeMinute:number};
export type ChartCalendar={available:true;start:string;end:string;sessions:ChartMarketSession[]}|{available:false};
export function calendarDate(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function parseCalendarSessions(value:unknown,start:string,end:string):ChartMarketSession[]{
 if(!calendarDate(start)||!calendarDate(end)||start>end||!Array.isArray(value)||value.length>550)throw Error('invalid_chart_calendar');
 const rows=new Map<string,ChartMarketSession>();
 for(const raw of value){if(!raw||typeof raw!=='object')throw Error('invalid_chart_calendar');const row=raw as ChartMarketSession;if(!calendarDate(row.date)||row.date<start||row.date>end||!/^\d{2}:\d{2}$/.test(row.open)||!/^\d{2}:\d{2}$/.test(row.close)||row.open!=='09:30'||!['13:00','16:00'].includes(row.close)||rows.has(row.date))throw Error('invalid_chart_calendar');rows.set(row.date,{date:row.date,open:row.open,close:row.close});}
 return [...rows.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function calendarForBars(bars:readonly Candle[],calendar:ChartCalendar):boolean{
 if(!calendar.available)return false;
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
 return bars.every(bar=>{const date=fmt.format(bar.time*1000);return date>=calendar.start&&date<=calendar.end;});
}

/** Carries verified session facts across history pages; never guesses missing dates. */
export class ChartSessionCalendar{
 private sessions=new Map<string,ChartMarketSession>();
 private ranges:{start:string;end:string;from:number;to:number}[]=[];
 private intervals:ChartSessionInterval[]|null=null;
 merge(value:unknown):void{
  if(!value||typeof value!=='object')return;
  const payload=value as ChartCalendar;if(!payload.available)return;
  let rows:ChartMarketSession[];try{rows=parseCalendarSessions(payload.sessions,payload.start,payload.end);}catch{return;}
  for(const row of rows){const previous=this.sessions.get(row.date);if(!previous||previous.open!==row.open||previous.close!==row.close)this.intervals=null;this.sessions.set(row.date,row);}
  if(!this.ranges.some(range=>range.start===payload.start&&range.end===payload.end))this.ranges.push({start:payload.start,end:payload.end,from:easternDayStart(Date.parse(payload.start+"T12:00:00Z")/1000),to:easternDayStart((Date.parse(payload.end+"T12:00:00Z")+86_400_000)/1000)});
 }
 covers(time:number):boolean{return this.ranges.some(range=>time>=range.from&&time<range.to);}
 session(date:string):ChartMarketSession|null{return this.sessions.get(date)??null;}
 knownSessions():ChartMarketSession[]{return [...this.sessions.values()].sort((a,b)=>a.date.localeCompare(b.date));}
 /** Numeric lookup avoids repeated timezone formatting for every streamed bar. */
 sessionAt(time:number):ChartSessionInterval|null{
  if(!Number.isFinite(time))return null;
  if(!this.intervals)this.intervals=this.knownSessions().map(session=>{
   const start=easternDayStart(Date.parse(session.date+'T12:00:00Z')/1000);
   return {session,start,end:easternDayStart(start+36*3600),closeMinute:Number(session.close.slice(0,2))*60+Number(session.close.slice(3))};
  });
  let low=0,high=this.intervals.length-1;
  while(low<=high){const middle=(low+high)>>>1,entry=this.intervals[middle];if(time<entry.start)high=middle-1;else if(time>=entry.end)low=middle+1;else return entry;}
  return null;
 }
}
