import type { Time } from "lightweight-charts";
import type { ChartTimeframe } from "./candles";
const date = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"short",day:"numeric"});
const clock = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"});
export function chartTickLabel(time: Time, timeframe: ChartTimeframe, dayBoundary: boolean, timezone="America/New_York"): string {
  if(timeframe==="4h"||(timeframe!=="1D"&&dayBoundary))return "";
  if(typeof time!=="number")return String(time);
  return (timezone==="America/New_York"?(timeframe==="1D"?date:clock):new Intl.DateTimeFormat("en-US",{timeZone:timezone,...(timeframe==="1D"?{month:"short",day:"numeric"} as const:{hour:"numeric",minute:"2-digit"} as const)})).format(time*1000);
}
export function visibleChartDates(points:readonly {time:number}[],range:{from:number;to:number}|null,starts:readonly {index:number}[],coordinate:(index:number)=>number|null) {
  if(!range||!points.length)return [];
  const first=Math.max(0,Math.ceil(range.from));
  if(first>=points.length||range.to<0)return [];
  const entries=[{time:points[first].time,left:0},...starts.filter(day=>day.index>first&&day.index<=range.to).flatMap(day=>{const x=coordinate(day.index);return x===null?[]:[{time:points[day.index].time,left:x}];})];
  let previous=-85;
  return entries.filter((entry,index)=>{if(index===0||entry.left-previous>=85){previous=entry.left;return true;}return false;});
}
