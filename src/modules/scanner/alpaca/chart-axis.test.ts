import {expect,it} from "vitest";
import {chartTickLabel,firstVisibleChartTime,isChartDateStart} from "./chart-axis";
import type {UTCTimestamp} from "lightweight-charts";
const time=(s:string)=>Date.parse(s)/1000;
it("pins the first visible date even when the visible window starts inside its day",()=>{
 const points=[{time:time("2026-11-05T09:00Z")},{time:time("2026-11-05T18:00Z")},{time:time("2026-11-06T09:00Z")},{time:time("2026-11-06T18:00Z")}];
 expect(firstVisibleChartTime(points,{from:0.5,to:3})).toBe(points[1].time);
 expect(firstVisibleChartTime(points,{from:3,to:4})).toBe(points[3].time);
 expect(firstVisibleChartTime(points,{from:5,to:6})).toBeUndefined();
 expect(firstVisibleChartTime(points,{from:-2,to:-1})).toBeUndefined();
});
it("labels 4h day boundaries and intraday grid ticks",()=>{
 expect(chartTickLabel(time("2026-11-06T09:00Z") as UTCTimestamp,"4h",true)).toBe("Nov 6");
 expect(chartTickLabel(time("2026-11-06T17:00Z") as UTCTimestamp,"4h",false)).toBe("12:00 PM");
 expect(chartTickLabel(time("2026-11-06T17:00Z") as UTCTimestamp,"1m",false)).toBe("12:00 PM");
 expect(chartTickLabel(time("2026-11-06T09:00Z") as UTCTimestamp,"1m",true)).toBe("Nov 6");
 expect(chartTickLabel(time("2026-11-06T09:00Z") as UTCTimestamp,"1h",true)).toBe("Nov 6");
 expect(chartTickLabel(time("2026-11-06T05:00Z") as UTCTimestamp,"1D",true)).toBe("Nov 6");
});

it("honors the chosen display timezone without changing candle timestamps",()=>{
 const timestamp=time("2026-11-07T00:30Z") as UTCTimestamp;
 expect(chartTickLabel(timestamp,"1D",true,"UTC")).toBe("Nov 7");
 expect(chartTickLabel(timestamp,"1D",true,"America/New_York")).toBe("Nov 6");
});


it("keeps a UTC midnight tick within the same displayed New York date", () => {
 const dates = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });
 const points = ["2026-11-06T23:00Z", "2026-11-07T00:00Z", "2026-11-07T15:00Z"].map(value => ({ time: time(value) }));
 const dayKey = (timestamp: number) => dates.format(timestamp * 1000);
 expect(isChartDateStart(points, points[0].time, dayKey)).toBe(true);
 expect(isChartDateStart(points, points[1].time, dayKey)).toBe(false);
 expect(isChartDateStart(points, points[2].time, dayKey)).toBe(true);
});
