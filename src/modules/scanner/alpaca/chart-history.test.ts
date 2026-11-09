import {expect,it} from "vitest";
import {CHART_HISTORY_FLOOR,chartHistoryPage,chartHistoryWindow} from "./chart-history";
import type {Candle} from "./candles";
const bar=(date:string):Candle=>({time:Date.parse(date)/1000,open:1,high:1,low:1,close:1,volume:10});
it("uses stable minute-aligned recent windows and validates cursor bounds",()=>{
 const now=Date.parse("2026-11-08T16:12:30Z"),window=chartHistoryWindow(null,false,now);
 expect(window.end).toBe(Date.parse("2026-11-08T16:11:59.999Z"));expect(window.end-window.start).toBe(21*86400000);
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
