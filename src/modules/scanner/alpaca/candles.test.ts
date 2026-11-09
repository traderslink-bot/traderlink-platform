import { describe, expect, it } from "vitest";
import { aggregateCandles, displayCandles, candleBucket, alpacaCandle, chartSymbol, chartTimeframe, type Candle } from "./candles";

const bar = (time: number, close: number, volume = 10): Candle => ({ time, open: close, high: close + 1, low: close - 1, close, volume });
describe("Alpaca chart candles", () => {
  it("normalizes symbols and rejects paths, query injection and unsupported intervals", () => {
    expect(chartSymbol(" brk.b ")).toBe("BRK.B");
    for (const value of ["", "AAPL&feed=iex", "../AAPL", "NASDAQ:AAPL"]) expect(() => chartSymbol(value)).toThrow();
    expect(chartTimeframe("5m")).toBe("5m");
    expect(chartTimeframe("4h")).toBe("4h");
    expect(() => chartTimeframe("10s")).toThrow();
  });
  it("uses UTC seconds and rejects malformed OHLCV", () => {
    expect(alpacaCandle({ t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 15 })?.time).toBe(1793975400);
    expect(alpacaCandle({ t: "invalid", o: 1, h: 2, l: 0.5, c: 1, v: 15 })).toBeNull();
    expect(alpacaCandle({ t: "2026-11-06T14:30:00Z", o: 1, h: 0.8, l: 0.5, c: 1, v: 15 })).toBeNull();
  });
  it("sorts, deduplicates corrected minutes and recomputes bucket volume without double counting", () => {
    const input = [bar(120, 4), bar(60, 2), bar(60, 3, 50), bar(300, 8)];
    expect(aggregateCandles(input, "5m")).toEqual([
      { time: 0, open: 3, high: 5, low: 2, close: 4, volume: 60 },
      { time: 300, open: 8, high: 9, low: 7, close: 8, volume: 10 },
    ]);
    expect(aggregateCandles(input, "4h")).toEqual([{ time: candleBucket(60, "4h"), open: 3, high: 9, low: 2, close: 8, volume: 70 }]);
    expect(aggregateCandles(input, "1m")).toHaveLength(3);
    expect(aggregateCandles(input, "1D")).toHaveLength(3);
  });
});

it("anchors 4h candles to 04/08/12/16 Eastern on both sides of daylight saving", () => {
 const utc=(s:string)=>Date.parse(s)/1000;
 expect(candleBucket(utc("2026-10-30T09:47:00Z"),"4h")).toBe(utc("2026-10-30T08:00:00Z"));
 expect(candleBucket(utc("2026-11-06T10:47:00Z"),"4h")).toBe(utc("2026-11-06T09:00:00Z"));
 const bars=[bar(utc("2026-11-06T09:00:00Z"),2,10),bar(utc("2026-11-06T12:59:00Z"),3,20),bar(utc("2026-11-06T13:00:00Z"),4,30)];
 const result=aggregateCandles(bars,"4h");expect(result.map(b=>b.time)).toEqual([utc("2026-11-06T09:00:00Z"),utc("2026-11-06T13:00:00Z")]);expect(result.map(b=>b.volume)).toEqual([30,30]);
});
it("keeps missing minutes absent instead of inventing candles",()=>{
 const result=aggregateCandles([bar(60,2),bar(600,3)],"1m");expect(result.map(b=>b.time)).toEqual([60,600]);
});

describe("chart-only missing-interval marks",()=>{
 const utc=(s:string)=>Date.parse(s)/1000;
 it("preserves every minute at the previous close without adding traded volume or mutating facts",()=>{
  const input=[bar(utc("2026-11-06T15:00:00Z"),2,10),bar(utc("2026-11-06T15:03:00Z"),4,20)];
  const result=displayCandles(input,"1m");expect(result).toHaveLength(4);
  expect(result[1]).toEqual({time:utc("2026-11-06T15:01:00Z"),open:2,high:2,low:2,close:2,volume:0,carried:true});
  expect(result[2].carried).toBe(true);expect(result[3].carried).toBe(false);expect(input).toHaveLength(2);expect(result.reduce((s,b)=>s+b.volume,0)).toBe(30);
 });
 it.each([['5m',300],['15m',900],['1h',3600],['4h',14400]] as const)("fills %s intervals using the selected duration",(frame,step)=>{
  const start=utc("2026-11-06T09:00:00Z");const result=displayCandles([bar(start,2),bar(start+step*2,3)],frame);expect(result.map(b=>b.time)).toEqual([start,start+step,start+step*2]);expect(result[1].carried).toBe(true);
 });
 it("replaces a placeholder with a late candle and propagates its close through following gaps",()=>{
  const start=utc("2026-11-06T15:00:00Z"),input=[bar(start,2),bar(start+240,4),bar(start+60,3,20)];
  const result=displayCandles(aggregateCandles(input,"1m"),"1m");expect(result[1].carried).toBe(false);expect(result[2].close).toBe(3);expect(result[3].close).toBe(3);
 });
 it("does not generate overnight, weekend or daily candles",()=>{
  const input=[bar(utc("2026-11-06T23:59:00Z"),2),bar(utc("2026-11-09T09:00:00Z"),3)];expect(displayCandles(input,"1m")).toHaveLength(2);expect(displayCandles(input,"1D")).toHaveLength(2);
 });
});

it("extends connected chart positions through completed intervals only on the same observed day",()=>{
 const start=Date.parse("2026-11-06T15:00:00Z")/1000;
 expect(displayCandles([bar(start,2)],"1m",start+180)).toHaveLength(4);
 expect(displayCandles([bar(start,2)],"1m",start+86400)).toHaveLength(1);
});

it("anchors daily trade construction to New York midnight across daylight saving changes",async()=>{
 const {easternDayStart}=await import('./candles');
 for(const [input,expected] of [["2026-03-08T14:30:00Z","2026-03-08T05:00:00Z"],["2026-11-01T14:30:00Z","2026-11-01T04:00:00Z"],["2026-11-09T14:30:00Z","2026-11-09T05:00:00Z"]])expect(easternDayStart(Date.parse(input)/1000)).toBe(Date.parse(expected)/1000);
});
