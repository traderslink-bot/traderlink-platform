import {expect,it} from "vitest";
import {chartCatchUpWindow,CHART_HISTORY_FLOOR,chartHistoryPage,chartHistoryWindow} from "./chart-history";
import type {Candle} from "./candles";
const bar=(date:string):Candle=>({time:Date.parse(date)/1000,open:1,high:1,low:1,close:1,volume:10});
it("uses stable whole-market-date starts and validates cursor bounds",()=>{
 const now=Date.parse("2026-11-08T16:12:30Z"),window=chartHistoryWindow(null,false,now);
 expect(window.end).toBe(Date.parse("2026-11-08T16:11:59.999Z"));expect(window.start).toBe(Date.parse("2026-10-18T04:00:00Z"));
 for(const value of ["bad","0",String(now+120000)])expect(()=>chartHistoryWindow(value,false,now)).toThrow();
});
it("retains ten observed sessions initially with an older cursor that loses no excluded bars",()=>{
 const bars=Array.from({length:15},(_,i)=>bar(`2026-10-${String(i+1).padStart(2,"0")}T14:00:00Z`));
 const page=chartHistoryPage(bars,chartHistoryWindow(null,false,Date.parse("2026-10-20T00:00Z")),false);
 expect(page.bars).toHaveLength(10);expect(page.bars[0]).toEqual(bars[5]);expect(page.nextBefore).toBe(bars[5].time*1000-1);
});
it("advances across an empty period and stops at the provider history floor",()=>{
 const w=chartHistoryWindow(String(CHART_HISTORY_FLOOR+86400000),false);expect(chartHistoryPage([],w,false).nextBefore).toBeNull();
 const window=chartHistoryWindow(null,false);expect(chartHistoryPage([],window,false).nextBefore).toBe(window.start-1);
});
it("does not trim older chunks or daily pages to ten sessions",()=>{
 const bars=Array.from({length:15},(_,i)=>bar(`2026-10-${String(i+1).padStart(2,"0")}T14:00:00Z`));
 expect(chartHistoryPage(bars,chartHistoryWindow(String(Date.parse("2026-10-20T00:00Z")),false),false).bars).toHaveLength(15);
 expect(chartHistoryPage(bars,chartHistoryWindow(null,true),true).bars).toHaveLength(15);
});

it("shortens only the first intraday request and preserves its older cursor", () => {
 const now = Date.parse("2026-11-08T16:12:30Z");
 const recent = chartHistoryWindow(null, false, now, true);
 expect(recent.start).toBe(Date.parse("2026-11-01T04:00:00Z"));
 const {nextBefore} = chartHistoryPage([bar("2026-11-06T14:00:00Z")], recent, false);
 expect(nextBefore).toBe(recent.start - 1);
 expect(chartHistoryWindow(String(nextBefore), false, now, true)).toEqual(chartHistoryWindow(String(nextBefore), false, now));
 expect(chartHistoryWindow(null, true, now, true)).toEqual(chartHistoryWindow(null, true, now));
});

it("bounds catch-up to recent minute-aligned history", () => {
 const now = Date.parse("2026-11-12T16:10:20Z");
 expect(chartCatchUpWindow(String(now - 320_000), now)).toEqual({start:now - 320_000,end:now - 20_001,initial:false});
 for (const start of [now, now - 319_999, now - 1_280_000]) expect(() => chartCatchUpWindow(String(start), now)).toThrow();
});
