import {expect,it} from "vitest";
import {createChartTickFormatter,firstVisibleChartTime,isChartDateStart} from "./chart-axis";
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
 expect(createChartTickFormatter("4h")(time("2026-11-06T09:00Z") as UTCTimestamp,true)).toBe("Nov 6");
 expect(createChartTickFormatter("4h")(time("2026-11-06T17:00Z") as UTCTimestamp,false)).toBe("12:00 PM");
 expect(createChartTickFormatter("1m")(time("2026-11-06T17:00Z") as UTCTimestamp,false)).toBe("12:00 PM");
 expect(createChartTickFormatter("1m")(time("2026-11-06T09:00Z") as UTCTimestamp,true)).toBe("Nov 6");
 expect(createChartTickFormatter("1h")(time("2026-11-06T09:00Z") as UTCTimestamp,true)).toBe("Nov 6");
 expect(createChartTickFormatter("1D")(time("2026-11-06T05:00Z") as UTCTimestamp,true)).toBe("Nov 6");
});

it("honors the chosen display timezone without changing candle timestamps",()=>{
 const timestamp=time("2026-11-07T00:30Z") as UTCTimestamp;
 expect(createChartTickFormatter("1D","UTC")(timestamp,true)).toBe("Nov 7");
 expect(createChartTickFormatter("1D","America/New_York")(timestamp,true)).toBe("Nov 6");
});


it("keeps a UTC midnight tick within the same displayed New York date", () => {
 const dates = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });
 const points = ["2026-11-06T23:00Z", "2026-11-07T00:00Z", "2026-11-07T15:00Z"].map(value => ({ time: time(value) }));
 const dayKey = (timestamp: number) => dates.format(timestamp * 1000);
 expect(isChartDateStart(points, points[0].time, dayKey)).toBe(true);
 expect(isChartDateStart(points, points[1].time, dayKey)).toBe(false);
 expect(isChartDateStart(points, points[2].time, dayKey)).toBe(true);
});

it("formats weekly, monthly and yearly ticks as periods", () => {
 const timestamp = time("2026-11-02T05:00Z");
 expect(createChartTickFormatter("1W")(timestamp,false)).toBe("Nov 2");
 expect(createChartTickFormatter("1M")(timestamp,false)).toBe("Nov 2026");
 expect(createChartTickFormatter("1Y")(timestamp,false)).toBe("2026");
});

it("formats named cities and their different daylight saving offsets", () => {
 const losAngeles = createChartTickFormatter("1m", "America/Los_Angeles");
 const tokyo = createChartTickFormatter("1m", "Asia/Tokyo");
 const winter = time("2026-01-15T14:30Z"), summer = time("2026-07-15T13:30Z");
 expect(losAngeles(winter, false)).toBe("6:30 AM");
 expect(losAngeles(summer, false)).toBe("6:30 AM");
 expect(tokyo(winter, false)).toBe("11:30 PM");
 expect(tokyo(summer, false)).toBe("10:30 PM");
});
