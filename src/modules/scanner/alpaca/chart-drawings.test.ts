import { drawingGroups } from "@/app/(dashboard)/charts/chart-drawing-groups";
import { patternGeometry, patternMeasurements } from "@/app/(dashboard)/charts/chart-drawing-patterns";
import { regressionTrend, validRegressionSettings } from "@/app/(dashboard)/charts/chart-drawing-regression";
import { AnchoredVwapValues, fixedRangeVolumeProfile } from "@/app/(dashboard)/charts/chart-drawing-volume";
import { describe, expect, it } from "vitest";
import { copyPattern, forecastOutcome, ghostCandles, ghostSettings, validGhostSettings, validPattern } from "@/app/(dashboard)/charts/chart-drawing-market-data";
import { applyDrawingChanges, drawingStoragePrefix, subscribeDrawings, drawingTools, drawingDuration, drawingsNeedSaving, fibonacciLevels, fibonacciCurveShape, validFibonacciWedge, fibonacciProjectionShape, validFibonacciBase, validFibonacciChannelWidth, gannFixedCorner, gannShape, pitchforkGeometry, positionLevels, validPositionAnchor, persistDrawings, readDrawings, saveDrawings, type Drawing } from "@/app/(dashboard)/charts/chart-drawings";

describe("chart drawing calculations", () => {
  it("scales Fib Circles from opposing corners and speed arcs from the first anchor",()=>{
    const a={x:20,y:110},b={x:80,y:30};
    const circles=fibonacciCurveShape("fibCircles",[a,b],{percentLabels:true},600,600);
    expect(circles.ellipseArcs).toHaveLength(11);
    expect(circles.ellipseArcs?.[5]).toEqual({center:{x:50,y:70},radiusX:30,radiusY:40,start:0,end:2*Math.PI,anticlockwise:false});
    expect(circles.measurements?.every(label=>label.lines[0].endsWith("%"))).toBe(true);
    const arcs=fibonacciCurveShape("fibSpeedResistanceArcs",[a,b],undefined,600,600);
    expect(arcs.ellipseArcs?.[5]).toEqual({center:a,radiusX:100,radiusY:100,start:Math.PI,end:2*Math.PI,anticlockwise:false});
    expect(arcs.extent?.some(point=>point.y<a.y)).toBe(true);
    const down=fibonacciCurveShape("fibSpeedResistanceArcs",[b,a],{trendLine:false},600,600);
    expect(down.ellipseArcs?.[5]).toMatchObject({center:b,start:0,end:Math.PI});
    expect(down.centerLine).toBeUndefined();
    const full=fibonacciCurveShape("fibSpeedResistanceArcs",[a,b],{fullCircles:true,background:false},600,600);
    expect(full.ellipseArcs?.[5]).toMatchObject({start:0,end:2*Math.PI});
    expect(full.arcBands).toEqual([]);
  });

  it("keeps the spiral on its second anchor with golden-ratio growth each quarter turn",()=>{
    const center={x:10,y:10},anchor={x:30,y:10};
    const clockwise=fibonacciCurveShape("fibSpiral",[center,anchor],undefined,600,600).path!;
    const counter=fibonacciCurveShape("fibSpiral",[center,anchor],{counterclockwise:true},600,600).path!;
    expect(clockwise[150]).toEqual(anchor);
    const quarter=clockwise[165];
    expect(quarter.x).toBeCloseTo(center.x);
    expect((quarter.y-center.y)/(anchor.x-center.x)).toBeCloseTo(1.61803399);
    expect(counter[165].y-center.y).toBeCloseTo(center.y-quarter.y);
  });

  it("takes the shortest wedge angle and sets its outer arc through the second anchor",()=>{
    const a={x:170,y:160},b={x:90,y:170},c={x:120,y:140};
    const wedge=fibonacciCurveShape("fibWedge",[a,b,c],undefined,600,600);
    expect(wedge.ellipseArcs).toHaveLength(6);
    const outer=wedge.ellipseArcs![5];
    expect(outer.center).toEqual(a);
    expect(outer.radiusX).toBeCloseTo(Math.hypot(b.x-a.x,b.y-a.y));
    expect(outer.end-outer.start).toBeGreaterThan(0);
    expect(outer.end-outer.start).toBeLessThan(Math.PI/2);
    expect(wedge.lines[0]).toEqual([a,b]);
    expect(validFibonacciWedge(a,b,{x:130,y:165})).toBe(false);
    expect(validFibonacciWedge(a,b,c)).toBe(true);
  });

  it("anchors Fib Time Zone and Trend-Based Fib Time to their respective starting points",()=>{
    const a={x:20,y:90},b={x:60,y:50},c={x:90,y:75};
    const zone=fibonacciProjectionShape("fibTimeZone",[a,b],undefined,240,120);
    expect(zone.lines.map(([point])=>point.x)).toEqual([20,60,100,140,220]);
    expect(zone.lines.every(([start,end])=>start.x===end.x&&start.y===0&&end.y===120)).toBe(true);
    expect(zone.bands?.map(band=>band.slice(0,2).map(point=>point.x))).toEqual([[20,60],[100,140],[220,240]]);
    const trend=fibonacciProjectionShape("trendBasedFibTime",[a,b,c],{background:false,trendLine:false},240,120);
    expect(trend.lines[0][0].x).toBe(90);
    expect(trend.lines[1][0].x).toBeCloseTo(105.28);
    expect(trend.lines[3][0].x).toBe(130);
    expect(trend.centerLine).toBeUndefined();
    expect(trend.bands).toEqual([]);
    const reverse=fibonacciProjectionShape("fibTimeZone",[b,a],undefined,240,120);
    expect(reverse.lines.map(([point])=>point.x)).toEqual([60,20]);
  });

  it("sets Fib Channel 1.0 through the third anchor and extends in either direction",()=>{
    const a={x:40,y:80},b={x:80,y:60},c={x:50,y:95};
    const shape=fibonacciProjectionShape("fibChannel",[a,b,c],{extendLeft:true,extendRight:false},180,150);
    expect(shape.lines[0]).toEqual([{x:0,y:100},{x:80,y:60}]);
    const [one]=shape.lines.filter(([first])=>first.y===120);
    expect(one).toEqual([{x:0,y:120},{x:80,y:80}]);
    expect((one[0].y+one[1].y)/2).toBe(100);
    expect(one[0].y+(one[1].y-one[0].y)*c.x/80).toBe(c.y);
    expect(validFibonacciChannelWidth(a,b,{x:60,y:70})).toBe(false);
    expect(validFibonacciChannelWidth(a,b,c)).toBe(true);
  });

  it("projects Fib Speed Resistance Fan rays through the time and price retracements",()=>{
    const a={x:20,y:100},b={x:100,y:60};
    const fan=fibonacciProjectionShape("fibSpeedResistanceFan",[a,b],{grid:false},200,200);
    expect(fan.lines).toHaveLength(12);
    expect(fan.centerLine).toEqual([a,{x:200,y:10}]);
    const [throughPrice,throughTime]=fan.lines.slice(2,4);
    const atX=([p,q]:typeof throughPrice,x:number)=>p.y+(q.y-p.y)*(x-p.x)/(q.x-p.x);
    expect(atX(throughPrice,100)).toBeCloseTo(70);
    expect(atX(throughTime,80)).toBeCloseTo(60);
    const reverse=fibonacciProjectionShape("fibSpeedResistanceFan",[a,b],{reverse:true,grid:false},200,200);
    expect(reverse.centerLine).toEqual([b,{x:0,y:110}]);
    expect(validFibonacciBase("fibSpeedResistanceFan",{time:0,price:10},{time:20,price:10})).toBe(false);
    expect(validFibonacciBase("fibTimeZone",{time:0,price:10},{time:20,price:10})).toBe(true);
  });

  it("renders distinct Gann grids, bounded square arcs and nine projected fan angles",()=>{
    const origin={x:20,y:140},opposite={x:120,y:60};
    const box=gannShape("gannBox",origin,opposite,undefined,220,180);
    expect(box.lines).toHaveLength(11);
    expect(box.lines).toContainEqual([{x:45,y:140},{x:45,y:60}]);
    expect(box.ellipseArcs).toBeUndefined();
    for(const tool of ["gannSquareFixed","gannSquare"] as const){
      const square=gannShape(tool,origin,opposite,undefined,220,180);
      expect(square.lines).toHaveLength(14);
      expect(square.centerLine).toEqual([origin,opposite]);
      expect(square.ellipseArcs).toHaveLength(11);
      expect(square.ellipseArcs?.[0]).toMatchObject({center:origin,radiusX:20,radiusY:16,anticlockwise:true});
      expect(gannShape(tool,origin,opposite,{reverse:true},220,180).ellipseArcs?.[0]?.center).toEqual(opposite);
      const outline=gannShape(tool,origin,opposite,{levels:false,angles:false,arcs:false,background:false},220,180);
      expect(outline.lines).toHaveLength(4);
      expect(outline.fill).toBeUndefined();
      expect(outline.ellipseArcs).toBeUndefined();
    }
    const fan=gannShape("gannFan",origin,opposite,undefined,220,180);
    expect(fan.lines).toHaveLength(8);
    expect(fan.centerLine).toEqual([origin,{x:195,y:0}]);
    expect(fan.measurements?.some(label=>label.lines.includes("1/1"))).toBe(true);
    expect(gannShape("gannFan",opposite,origin,{labels:false},220,180).measurements).toEqual([]);
  });

  it("constrains fixed Gann square placement and resizing to the selected ratio",()=>{
    const origin={x:80,y:80};
    const left=gannFixedCorner(origin,{x:10,y:60},1,190,150);
    expect(origin.x-left.x).toBeCloseTo(origin.y-left.y);
    const bottom=gannFixedCorner(origin,{x:10,y:149},2,190,150);
    expect(bottom.y).toBeCloseTo(149);
    expect((bottom.y-origin.y)/(origin.x-bottom.x)).toBeCloseTo(2);
  });

  it("gives each pitchfork its median and symmetric parallel rails",()=>{
    const a={x:4,y:12},b={x:12,y:4},c={x:18,y:10};
    const cases=[
      ["pitchfork",a,{x:15,y:7},[b,c]],
      ["schiffPitchfork",{x:4,y:8},{x:15,y:7},[b,c]],
      ["modifiedSchiffPitchfork",{x:8,y:8},{x:15,y:7},[b,c]],
      ["insidePitchfork",{x:8,y:8},c,[a,b]],
    ] as const;
    for(const [tool,origin,through,rails] of cases){
      const geometry=pitchforkGeometry(tool,a,b,c);
      expect(geometry).toEqual({origin,through,rails});
      const slope=(through.y-origin.y)/(through.x-origin.x);
      const railOffset=(point:{x:number;y:number})=>point.y-origin.y-(point.x-origin.x)*slope;
      expect(railOffset(rails[0])).toBeCloseTo(-railOffset(rails[1]));
      expect(Math.abs(railOffset(rails[0]))).toBeGreaterThan(0);
    }
  });

  it("measures bullish and bearish retracements from the end of the move", () => {
    const retracement = (start: number, end: number, ratio: number) =>
      fibonacciLevels("fibRetracement", start, end).find(level => level.ratio === ratio)?.price;

    expect(retracement(1, 2, 0)).toBe(2);
    expect(retracement(1, 2, 1)).toBe(1);
    expect(retracement(1, 2, .618)).toBeCloseTo(1.382);
    expect(retracement(2, 1, .618)).toBeCloseTo(1.618);
  });

  it("projects the original move from the pullback in either direction", () => {
    const extension = (start: number, end: number, pullback: number) =>
      fibonacciLevels("fibExtension", start, end, pullback).find(level => level.ratio === 1.618)?.price;

    expect(extension(1, 2, 1.5)).toBeCloseTo(3.118);
    expect(extension(2, 1, 1.5)).toBeCloseTo(-.118);
  });

  it("calculates the reward and risk for long and short drawings", () => {
    expect(positionLevels("longPosition", 4, 5, 3.5)).toEqual({reward:1,risk:.5,rewardRisk:2});
    expect(positionLevels("shortPosition", 4, 3, 4.5)).toEqual({reward:1,risk:.5,rewardRisk:2});
    expect(positionLevels("longPosition", 4, 3, 3.5)).toBeNull();
    expect(positionLevels("shortPosition", 4, 3, 3.5)).toBeNull();
    expect(positionLevels("longPosition", 4, 5, 4)).toBeNull();
    expect(positionLevels("shortPosition", 4, 0, 4.5)).toBeNull();
  });

  it("requires a different bar for the target and keeps the stop on the loss side", () => {
    const entry={time:60,price:4},target={time:120,price:5};
    expect(validPositionAnchor("longPosition",[entry],{...target,time:60})).toBe(false);
    expect(validPositionAnchor("longPosition",[entry],target)).toBe(true);
    expect(validPositionAnchor("longPosition",[entry,target],{time:120,price:4.5})).toBe(false);
    expect(validPositionAnchor("longPosition",[entry,target],{time:120,price:3.5})).toBe(true);
  });

  it("reports elapsed calendar time in either drag direction", () => {
    expect(drawingDuration(90061)).toBe("1d 1h 1m 1s");
    expect(drawingDuration(-3600)).toBe("1h");
    expect(drawingDuration(0)).toBe("0m");
  });
});

it("keeps edits in memory until saved and isolates saved strokes by ticker", () => {
  const key = "drawing-test:SHFS";
  const other = "drawing-test:OMH";
  const brush: Drawing = {
    id: "stroke", tool: "brush", color: "#123abc", text: "",
    anchors: [{time: 1500.3, price: 1}, {time: 1501.9, price: 1.2}, {time: 1503.2, price: 1.1}],
  };
  expect(saveDrawings(key, [brush], false)).toBe(false);
  expect(readDrawings(key)).toEqual([brush]);
  expect(readDrawings(other)).toEqual([]);
  expect(localStorage.getItem(key)).toBeNull();
  expect(drawingsNeedSaving(key)).toBe(true);
  expect(persistDrawings(key)).toBe(true);
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([brush]);
  expect(drawingsNeedSaving(key)).toBe(false);
  expect(saveDrawings(key, [], false)).toBe(false);
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([brush]);
  expect(saveDrawings(key, [], true)).toBe(true);
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([]);
  localStorage.removeItem(key);
});


describe("market-data drawings", () => {
  const bar=(time:number,open:number,high:number,low:number,close:number,carried=false)=>
    ({time,open,high,low,close,volume:carried?0:100,carried});

  it("snapshots traded OHLC bars and preserves spacing across carried gaps", () => {
    const source=[bar(60,4,5,3,4),bar(120,4,4,4,4,true),bar(180,5,6,4,5)];
    const pattern=copyPattern(source,180,60);
    expect(pattern.origin).toEqual({time:60,price:4});
    expect(pattern.bars).toEqual([
      {offset:0,open:0,high:1,low:-1,close:0},
      {offset:120,open:1,high:2,low:0,close:1},
    ]);
    expect(validPattern(pattern.bars)).toBe(true);
    expect(validPattern([{offset:0,open:0,high:0,low:0,close:0}, {offset:0,open:0,high:0,low:0,close:0}])).toBe(false);
    expect(copyPattern(source,60,120).error).toBeDefined();
  });

  it("uses actual candles inside the forecast window and keeps an open forecast pending", () => {
    const source=[bar(60,4,8,1,4),bar(120,4,5,3,4),bar(180,4,7,2,4,true),bar(240,4,8,1,4)];
    expect(forecastOutcome(source,60,240,4,5)).toBe("Target reached");
    expect(forecastOutcome(source,60,240,4,3)).toBe("Target reached");
    expect(forecastOutcome(source,60,240,4,7)).toBe("Target missed");
    expect(forecastOutcome(source.slice(0,3),60,240,4,7)).toBe("Pending");
    expect(forecastOutcome(source.slice(1),60,240,4,7)).toBe("History unavailable");
  });

  it("builds repeatable ghost candles from preceding traded ranges and the chosen endpoints", () => {
    const source=[bar(60,4,5,3,4),bar(120,4,8,1,4,true),bar(180,5,15,2,5)];
    const settings=ghostSettings(source,180,4,5);
    expect(settings).toEqual({count:5,range:2});
    expect(validGhostSettings(settings)).toBe(true);
    expect(validGhostSettings({...settings,count:0})).toBe(false);

    for(const [start,end] of [[4,6],[6,4],[.0000005,.0000002]]){
      const candles=ghostCandles(start,end,settings);
      expect(candles).toEqual(ghostCandles(start,end,settings));
      expect(candles[0].open).toBe(start);
      expect(candles.at(-1)?.close).toBe(end);
      for(const [index,candle] of candles.entries()){
        if(index>0)expect(candle.open).toBe(candles[index-1].close);
        expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open,candle.close));
        expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open,candle.close));
        expect(candle.low).toBeGreaterThan(0);
      }
    }
  });

});

describe("volume drawings", () => {
  const bar=(time:number,low:number,high:number,close:number,volume:number)=>({time,open:close,high,low,close,volume});

  it("uses the anchor, includes positive volume, and replaces the active candle correctly", () => {
    const bars=[bar(60,10,10,10,900),bar(120,2,4,3,10),bar(180,5,8,5,30)];
    const vwap=new AnchoredVwapValues();
    vwap.update(bars);
    expect(vwap.value(1,2)).toBe(3);
    expect(vwap.value(1,3)).toBe(5.25);
    bars[2]=bar(180,4,4,4,30);
    bars.push(bar(240,9,9,9,0));
    vwap.update(bars);
    expect(vwap.value(1,4)).toBe(3.75);
    expect(vwap.value(3,4)).toBeNull();
    vwap.update([...bars.slice(0,2),bar(180,5,5,5,30),bars[3]]);
    expect(vwap.value(1,4)).toBe(4.5);
  });

  it("conserves total volume and uses contiguous value-area rows around the POC", () => {
    const bars=[bar(0,20,22,21,1000),bar(60,1,25,2,240),bar(120,12.5,12.5,12.5,100),
      bar(180,6,7,6,70),bar(240,8,9,8,0)];
    const profile=fixedRangeVolumeProfile(bars,60,180)!;
    expect(profile.total).toBe(340);
    expect(profile.rows.reduce((sum,row)=>sum+row.volume,0)).toBeCloseTo(340);
    expect(profile.rows[profile.pointOfControl]).toEqual({low:12,high:13,volume:110});
    expect(profile.valueLow).toBeLessThanOrEqual(profile.pointOfControl);
    expect(profile.valueHigh).toBeGreaterThanOrEqual(profile.pointOfControl);
    expect(profile.rows.slice(profile.valueLow,profile.valueHigh+1).reduce((sum,row)=>sum+row.volume,0))
      .toBeGreaterThanOrEqual(profile.total*.7);
    expect(fixedRangeVolumeProfile(bars,240,300)).toBeNull();
    expect(fixedRangeVolumeProfile(bars,120,180)?.rows).toEqual([{low:12.5,high:12.5,volume:100}]);
  });
});

describe("regression trend drawing",()=>{
  const candle=(time:number,close:number,carried=false)=>({time,open:close+1,high:close+1,
    low:close,close,volume:carried?0:100,carried});

  it("fits only traded candles while keeping carried slots on the time axis",()=>{
    const bars=[candle(60,90),candle(120,1),candle(180,90,true),candle(240,5),candle(300,7)];
    const close=regressionTrend(bars,120,300,"close");
    expect(close?.start).toBeCloseTo(1);
    expect(close?.end).toBeCloseTo(7);
    expect(close?.deviation).toBeCloseTo(0);
    expect(close?.correlation).toBeCloseTo(1);
    expect(regressionTrend(bars,120,300,"open")?.start).toBeCloseTo(2);
    expect(regressionTrend(bars,120,180,"close")).toBeNull();
  });

  it("calculates signed correlation and residual deviation and validates drawing settings",()=>{
    const bars=[candle(60,5),candle(120,6),candle(180,1)];
    const fit=regressionTrend(bars,60,180,"close");
    expect(fit?.start).toBeCloseTo(6);
    expect(fit?.end).toBeCloseTo(2);
    expect(fit?.correlation).toBeCloseTo(-Math.sqrt(4/7));
    expect(fit?.deviation).toBeCloseTo(Math.sqrt(2));
    expect(validRegressionSettings({source:"close",upper:2,lower:0})).toBe(true);
    expect(validRegressionSettings({source:"close",upper:Infinity,lower:2})).toBe(false);
    expect(validRegressionSettings({source:"unknown",upper:2,lower:2})).toBe(false);
  });
});

describe("complete drawing menu",()=>{
  it("lists every tool exactly once",()=>{
    const keys=drawingGroups.flatMap(([,tools])=>tools);
    expect(keys.slice().sort()).toEqual(Object.keys(drawingTools).sort());
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("measures Cypher retracement against XC and projects the triangle apex",()=>{
    const anchors=[8,18,13,21,10.782].map((price,i)=>({price,time:i*60}));
    expect(patternMeasurements("cypher",anchors).map(({ratio})=>ratio)).toEqual([.5,1.3,.786]);
    const points=[{x:0,y:10},{x:10,y:90},{x:30,y:30},{x:40,y:70}];
    const shape=patternGeometry("trianglePattern",points,anchors.slice(0,4));
    expect(shape.guides[0][1].x).toBeCloseTo(65);
    expect(shape.guides[1][1]).toEqual(shape.guides[0][1]);
    expect(shape.measurements.map(label=>label.lines[0])).toEqual(["A","B","C","D"]);
  });
});

describe("open-tab drawing preservation", ()=>{
  const line=(id:string):Drawing=>({id,tool:"horizontal",anchors:[{time:60,price:20}],color:"#38bdf8",text:""});

  it("keeps an unsaved edit when a second tab saves a drawing",()=>{
    const key=`${drawingStoragePrefix}qa:MERGE-DRAFT`;
    const original=line("shared"), draft={...original,color:"#ff0000"}, remote=line("remote");
    const off=subscribeDrawings(()=>{});
    try{
      saveDrawings(key,[original],true);
      saveDrawings(key,[draft],false);
      const raw=JSON.stringify([original,remote]);
      localStorage.setItem(key,raw);
      window.dispatchEvent(new StorageEvent("storage",{key,newValue:raw,storageArea:localStorage}));
      expect(readDrawings(key)).toEqual([draft,remote]);
      expect(drawingsNeedSaving(key)).toBe(true);
      expect(persistDrawings(key)).toBe(true);
      expect(JSON.parse(localStorage.getItem(key)!)).toEqual([draft,remote]);
    }finally{off();localStorage.removeItem(key);}
  });

  it("restores the order of deleted drawings without rearranging another tab's additions",()=>{
    const first=line("first"), second=line("second"), middle=line("middle"), fourth=line("fourth"), last=line("last");
    const remote=line("remote");
    expect(applyDrawingChanges([middle,remote,last],[middle,last],[first,second,middle,fourth,last]))
      .toEqual([first,second,middle,remote,fourth,last]);
  });

  it("reads a newly saved drawing before writing and keeps it through a local undo",()=>{
    const key=`${drawingStoragePrefix}qa:UNDO-MERGE`;
    const local=line("local"),remote=line("remote");
    expect(readDrawings(key)).toEqual([]);
    localStorage.setItem(key,JSON.stringify([remote]));
    expect(saveDrawings(key,[local],true)).toBe(true);
    expect(readDrawings(key)).toEqual([remote,local]);
    expect(applyDrawingChanges(readDrawings(key),[local],[])).toEqual([remote]);
    localStorage.removeItem(key);
  });
});
