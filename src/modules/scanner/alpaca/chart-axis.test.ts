import {expect,it} from "vitest";
import {chartTickLabel,visibleChartDates} from "./chart-axis";
import type {UTCTimestamp} from "lightweight-charts";
const time=(s:string)=>Date.parse(s)/1000;
it("pins the first visible date even when the visible window starts inside its day",()=>{
 const points=[{time:time("2026-11-05T09:00Z")},{time:time("2026-11-05T18:00Z")},{time:time("2026-11-06T09:00Z")},{time:time("2026-11-06T18:00Z")}];
 expect(visibleChartDates(points,{from:1,to:3},[{index:0},{index:2}],i=>i*100)).toEqual([{time:points[1].time,left:0},{time:points[2].time,left:200}]);
 expect(visibleChartDates(points,{from:3,to:4},[{index:0},{index:2}],i=>i*100)).toEqual([{time:points[3].time,left:0}]);
});
it("omits colliding or unpositioned boundary labels and empty ranges",()=>{
 const points=[{time:1},{time:2},{time:3},{time:4}];expect(visibleChartDates(points,{from:0,to:3},[{index:1},{index:2},{index:3}],i=>i===3?null:i*50)).toEqual([{time:1,left:0},{time:3,left:100}]);
 expect(visibleChartDates(points,{from:5,to:6},[],()=>0)).toEqual([]);
});
it("uses no repeated native clock ticks on 4h, leaving dates to the date layer",()=>{
 for(const day of ["2026-10-30","2026-11-06"])for(const hour of [9,13,17,21])expect(chartTickLabel(time(`${day}T${String(hour).padStart(2,"0")}:00Z`) as UTCTimestamp,"4h",false)).toBe("");
 expect(chartTickLabel(time("2026-11-06T17:00Z") as UTCTimestamp,"1m",false)).toBe("12:00 PM");
 expect(chartTickLabel(time("2026-11-06T09:00Z") as UTCTimestamp,"1m",true)).toBe("");
 expect(chartTickLabel(time("2026-11-06T05:00Z") as UTCTimestamp,"1D",true)).toBe("Nov 6");
});

it("honors the chosen display timezone without changing candle timestamps",()=>{
 const timestamp=time("2026-11-07T00:30Z") as UTCTimestamp;
 expect(chartTickLabel(timestamp,"1D",true,"UTC")).toBe("Nov 7");
 expect(chartTickLabel(timestamp,"1D",true,"America/New_York")).toBe("Nov 6");
});
