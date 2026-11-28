import type { Candle } from "@/src/modules/scanner/alpaca/candles";
import type { ChartMarketSession } from "@/src/modules/scanner/alpaca/chart-calendar";
import type { LiveScannerRow } from "@/src/modules/scanner/live/contracts";
import { easternClock } from "@/src/modules/scanner/live/sessions";

export const sessionNames = ["Premarket", "Regular", "Post-market"] as const;
export type SessionRange = { open:number; high:number; low:number; close:number; volume:number };
export type CompanySessionDay = { date:string; ranges:(SessionRange|null)[] };
type YearRange = {high:number;low:number;highDate?:string;lowDate?:string};
export type CompanyTechnicals = {
  days:CompanySessionDay[]; row:LiveScannerRow|null; scannerSignals:string[];
  revisedRangeDates?:string[];
  dayVolume?:number|null; sessionVolume?:number;
  dollarVolume?:number; relativeVolume?:number; sessionVwap?:number;
  candleActivity?:{oneMinuteGain?:number; fiveMinuteGain?:number; oneMinuteVolume:number; fiveMinuteVolume?:number; fiveMinuteVolumeSpike?:number; volumeAcceleration?:number; intervalVolumeRate:number};
  listedFloat?:number; listedMarketCap?:number;
  yearRange?:YearRange;
  splitAdjustedYearRange?:YearRange;
  bid?:number; ask?:number; sample?:boolean;
};

export function companySessionRanges(bars: readonly Candle[], sessions: readonly ChartMarketSession[]): CompanySessionDay[] {
  const days=sessions.map(session=>({date:session.date,ranges:[null,null,null] as (SessionRange|null)[]}));
  const lookup=new Map(days.map((day,i)=>[day.date,{day,close:sessions[i].close==="13:00"?780:960}]));
  for(const bar of [...bars].sort((a,b)=>a.time-b.time)){
    const {date,minute}=easternClock(bar.time*1000);
    const entry=lookup.get(date);
    if(!entry||minute<240||minute>=(entry.close===780?1020:1200))continue;
    const index=minute<570?0:minute<entry.close?1:2;
    const range=entry.day.ranges[index];
    entry.day.ranges[index]=range?{...range,high:Math.max(range.high,bar.high),low:Math.min(range.low,bar.low),close:bar.close,volume:range.volume+bar.volume}:
      {open:bar.open,high:bar.high,low:bar.low,close:bar.close,volume:bar.volume};
  }
  return days;
}
