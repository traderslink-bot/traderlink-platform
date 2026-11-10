import {candleBucket,easternDayStart,type ChartTimeframe} from './candles';
import type {ChartPreferences} from './chart-preferences';
import type {ChartSessionCalendar} from './chart-calendar';
import type {VwapChartSlot} from './chart-vwap-projection';

/** Intraday interval ends use verified session closes, including shortened days. */
export function calculationInterval(time:number,timeframe:Exclude<ChartTimeframe,'1D'>,sessions:Pick<ChartPreferences,'premarket'|'regular'|'postmarket'>,calendar:ChartSessionCalendar):VwapChartSlot{
 if(!Number.isFinite(time)||!calendar.covers(time))throw Error('calculation_session_unavailable');
 const known=calendar.sessionAt(time);
 if(!known)throw Error('calculation_session_closed');
 const midnight=known.start,closeMinute=known.closeMinute;
 // US supported sessions do not cross the DST transition hour within a day.
 const regularOnly=sessions.regular&&!sessions.premarket&&!sessions.postmarket;
 const start=candleBucket(time,timeframe,regularOnly);
 const seconds={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400}[timeframe];
 const segments:[[number,number,boolean],[number,number,boolean],[number,number,boolean]]=[[240,570,sessions.premarket],[570,closeMinute,sessions.regular],[closeMinute,closeMinute+240,sessions.postmarket]];
 let end=-Infinity;
 for(const [from,to,enabled]of segments){
  if(enabled&&Math.max(start,midnight+from*60)<Math.min(start+seconds,midnight+to*60))end=Math.max(end,Math.min(start+seconds,midnight+to*60));
 }
 if(!Number.isFinite(end)||end<=start)throw Error('calculation_outside_sessions');
 return {time:start,close:end};
}

/** Future axis slots are calendar positions only, never synthetic OHLCV data. */
export function futureCalculationAxis(axis:readonly number[],count:number,timeframe:ChartTimeframe,sessions:Pick<ChartPreferences,'premarket'|'regular'|'postmarket'>,calendar:ChartSessionCalendar):number[]{
 if(!Number.isInteger(count)||count<0||count>1000)throw Error('invalid_future_axis_count');
 const result=[...axis];if(!count||!axis.length)return result;
 const last=axis.at(-1)!,regularOnly=sessions.regular&&!sessions.premarket&&!sessions.postmarket;
 const step={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1D':86400}[timeframe];
 for(const row of calendar.knownSessions()){
  const midnight=easternDayStart(Date.parse(row.date+'T12:00:00Z')/1000);
  if(timeframe==='1D'){
   if(midnight>last)result.push(midnight);
  }else{
   const close=Number(row.close.slice(0,2))*60+Number(row.close.slice(3));
   if(midnight+(close+240)*60<=last)continue;
   const segments:[[number,number,boolean],[number,number,boolean],[number,number,boolean]]=[[240,570,sessions.premarket],[570,close,sessions.regular],[close,close+240,sessions.postmarket]];
   for(const [from,to,enabled]of segments){
    if(!enabled)continue;
    for(let time=midnight+from*60;time<midnight+to*60;){
     const bucket=candleBucket(time,timeframe,regularOnly);
     if(bucket>result.at(-1)!)result.push(bucket);
     if(result.length>=axis.length+count)return result;
     time=bucket+step;
    }
   }
  }
  if(result.length>=axis.length+count)return result;
 }
 throw Error('future_session_coverage_unavailable');
}
