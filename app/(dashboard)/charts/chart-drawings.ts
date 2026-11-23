import type { IPanePrimitive, IPanePrimitivePaneView, IPrimitivePaneRenderer, Logical, PaneAttachedParameter, Time, UTCTimestamp } from "lightweight-charts";

import {patternGeometry,patternTools,type PatternTool} from "./chart-drawing-patterns";

import { chartCalendarPosition, chartCalendarTime, isCalendarChartTimeframe, nextChartCalendarPeriod, type CalendarChartTimeframe, type Candle, type DisplayCandle } from "@/src/modules/scanner/alpaca/candles";
import {copyPattern,forecastOutcome,ghostCandles,ghostSettings,validGhostSettings,validPattern,type GhostSettings,type PatternBar} from "./chart-drawing-market-data";

import {defaultRegression,regressionTrend,validRegressionSettings,type RegressionSettings} from "./chart-drawing-regression";
import {AnchoredVwapValues,candleIndexAtOrAfter,fixedRangeVolumeProfile} from "./chart-drawing-volume";

const pitchforkTools = {
  pitchfork:"Pitchfork",
  schiffPitchfork:"Schiff Pitchfork",
  modifiedSchiffPitchfork:"Modified Schiff Pitchfork",
  insidePitchfork:"Inside Pitchfork",
} as const;

type PitchforkTool = keyof typeof pitchforkTools;
export const isPitchfork = (tool: Tool | "select"): tool is PitchforkTool =>
  Object.hasOwn(pitchforkTools,tool);

const gannTools = {
  gannBox:"Gann Box",
  gannSquareFixed:"Gann Square Fixed",
  gannSquare:"Gann Square",
  gannFan:"Gann Fan",
} as const;
type GannTool = keyof typeof gannTools;
export const isGann = (tool:Tool|"select"|undefined):tool is GannTool =>
  tool!==undefined&&Object.hasOwn(gannTools,tool);

export type GannStyle = Partial<Record<"levels"|"angles"|"arcs"|"background"|"labels"|"reverse",boolean>>;
export function gannStyleControls(tool:GannTool):ReadonlyArray<readonly [keyof GannStyle,string]>{
  if(tool==="gannFan")return [["labels","Labels"],["background","Background"]];
  const controls=[["levels","Levels"],["angles","Angles"],["arcs","Arcs"],["labels","Labels"],
    ["background","Background"],["reverse","Reverse"]] as const;
  return tool==="gannBox"?controls.filter(([key])=>key!=="arcs"):controls;
}
export function gannStyleValue(style:GannStyle|undefined,key:keyof GannStyle){
  return style?.[key]??(key!=="reverse");
}
function validGannStyle(tool:GannTool,style:unknown):boolean{
  if(!style||typeof style!=="object"||Array.isArray(style))return false;
  const keys=gannStyleControls(tool).map(([key])=>key);
  return Object.entries(style).every(([key,value])=>keys.some(allowed=>allowed===key)&&typeof value==="boolean");
}

const fibonacciProjectionTools = {
  fibChannel:"Fibonacci Channel",
  fibTimeZone:"Fibonacci Time Zone",
  fibSpeedResistanceFan:"Fibonacci Speed Resistance Fan",
  trendBasedFibTime:"Trend-Based Fib Time",
} as const;
type FibonacciProjectionTool = keyof typeof fibonacciProjectionTools;
export const isFibonacciProjection = (tool:Tool|"select"|undefined):tool is FibonacciProjectionTool =>
  tool!==undefined&&Object.hasOwn(fibonacciProjectionTools,tool);

const fibonacciCurveTools = {
  fibCircles:"Fib Circles",
  fibSpiral:"Fib Spiral",
  fibSpeedResistanceArcs:"Fib Speed Resistance Arcs",
  fibWedge:"Fib Wedge",
} as const;
type FibonacciCurveTool = keyof typeof fibonacciCurveTools;
export const isFibonacciCurve = (tool:Tool|"select"|undefined):tool is FibonacciCurveTool =>
  tool!==undefined&&Object.hasOwn(fibonacciCurveTools,tool);

type FibonacciTool = FibonacciProjectionTool | FibonacciCurveTool;
export const isFibonacciDrawing = (tool:Tool|"select"|undefined):tool is FibonacciTool =>
  isFibonacciProjection(tool)||isFibonacciCurve(tool);

export type FibonacciStyle = Partial<Record<"labels"|"background"|"trendLine"|"extendLeft"|"extendRight"|"grid"|"reverse"|
  "counterclockwise"|"fullCircles"|"percentLabels",boolean>>;
export function fibonacciStyleControls(tool:FibonacciTool):ReadonlyArray<readonly [keyof FibonacciStyle,string]>{
  const appearance=[["labels","Labels"],["background","Background"]] as const;
  if(tool==="fibChannel")return [...appearance,["extendLeft","Extend left"],["extendRight","Extend right"]];
  if(tool==="fibSpeedResistanceFan")return [...appearance,["grid","Grid"],["reverse","Reverse"]];
  if(tool==="fibSpiral")return [["counterclockwise","Counterclockwise"]];
  const withTrend=[...appearance,["trendLine","Trend line"]] as const;
  if(tool==="fibCircles")return [...withTrend,["percentLabels","Percent labels"]];
  if(tool==="fibSpeedResistanceArcs")return [...withTrend,["fullCircles","Full circles"]];
  return withTrend;
}
export function fibonacciStyleValue(style:FibonacciStyle|undefined,key:keyof FibonacciStyle){
  return style?.[key]??(key!=="extendLeft"&&key!=="reverse"&&key!=="counterclockwise"&&
    key!=="fullCircles"&&key!=="percentLabels");
}
function validFibonacciStyle(tool:FibonacciTool,style:unknown):boolean{
  if(!style||typeof style!=="object"||Array.isArray(style))return false;
  const controls=fibonacciStyleControls(tool);
  return Object.entries(style).every(([key,value])=>controls.some(([setting])=>setting===key)&&typeof value==="boolean");
}

export const drawingStamps = {
  icon:["★","◆","●","✓","!","⚑","↑","↓"],
  sticker:["🎯","📌","🚀","💡","📈","📉","🔥","⚠️"],
  emoji:["🙂","🤔","🎉","👀","👍","👎","💪","💰"],
} as const;
export const isDrawingStamp=(tool:Tool|"select"|undefined):tool is keyof typeof drawingStamps=>
  tool!==undefined&&Object.hasOwn(drawingStamps,tool);

export const drawingTools = {
  trendline:"Trendline", infoLine:"Info Line", extendedLine:"Extended Line", trendAngle:"Trend Angle", crossline:"Crossline", horizontal:"Horizontal line", ray:"Ray", horizontalRay:"Horizontal ray",
  vertical:"Vertical line", arrow:"Arrow", arrowMarker:"Arrow Marker", arrowUp:"Arrow up", arrowDown:"Arrow down",
  arrowLeft:"Arrow left", arrowRight:"Arrow right", parallel:"Parallel channel",
  flat:"Flat top/bottom", disjoint:"Disjoint channel", ...pitchforkTools, rectangle:"Rectangle",
  path:"Path", circle:"Circle", ellipse:"Ellipse", triangle:"Triangle",
  rotatedRectangle:"Rotated rectangle", polyline:"Polyline", arc:"Arc", curve:"Curve", doubleCurve:"Double curve",
  fibRetracement:"Fibonacci retracement", fibExtension:"Fibonacci extension",
  ...fibonacciProjectionTools, ...fibonacciCurveTools, pitchfan:"Pitchfan", ...gannTools,
  ...patternTools, cyclicLines:"Cyclic Lines", timeCycles:"Time Cycles", sineLine:"Sine Line", sector:"Sector", priceRange:"Price range", dateRange:"Date range", datePriceRange:"Date and price range", brush:"Brush", highlighter:"Highlighter", text:"Text",
  note:"Note", anchoredNote:"Anchored note", callout:"Callout", priceLabel:"Price label",
  priceNote:"Price note", signpost:"Signpost", comment:"Comment", flagMark:"Flag mark",
  pin:"Pin", table:"Table", icon:"Icon", sticker:"Sticker", emoji:"Emoji",
  longPosition:"Long position", shortPosition:"Short position", positionForecast:"Position forecast", barsPattern:"Bars pattern", ghostFeed:"Ghost feed", projection:"Projection",
  anchoredVwap:"Anchored VWAP", fixedRangeProfile:"Fixed Range Volume Profile",
  anchoredVolumeProfile:"Anchored Volume Profile", regressionTrend:"Regression Trend",
} as const;
export type Tool = keyof typeof drawingTools;
export const anchorCounts: Record<Exclude<Tool, "brush" | "highlighter" | "path" | "polyline">, number> = {
  trendline:2, infoLine:2, extendedLine:2, trendAngle:2, crossline:1, arrowMarker:2,
  xabcd:5, cypher:5, abcd:4, trianglePattern:4, threeDrives:7, headAndShoulders:7,
  elliottImpulse:6, elliottCorrection:4, elliottTriangle:6, elliottDouble:4, elliottTriple:6,
  pitchfan:3, cyclicLines:2, timeCycles:2, sineLine:2, sector:3, pin:1, table:1, icon:1, sticker:1, emoji:1,
  horizontal:1, ray:2, horizontalRay:1, vertical:1, arrow:2,
  arrowUp:1, arrowDown:1, arrowLeft:1, arrowRight:1, parallel:3, flat:3, disjoint:3, pitchfork:3, schiffPitchfork:3, modifiedSchiffPitchfork:3, insidePitchfork:3, rectangle:2,
  fibRetracement:2, fibExtension:3, fibChannel:3, fibTimeZone:2, fibSpeedResistanceFan:2, trendBasedFibTime:3,
  fibCircles:2, fibSpiral:2, fibSpeedResistanceArcs:2, fibWedge:3, gannBox:2, gannSquareFixed:2, gannSquare:2, gannFan:2, priceRange:2, dateRange:2, datePriceRange:2,
  circle:2, ellipse:3, triangle:3, rotatedRectangle:3, arc:3, curve:3, doubleCurve:4, text:1,
  note:1, anchoredNote:0, callout:2, priceLabel:1, priceNote:2, signpost:2, comment:1, flagMark:1, longPosition:3, shortPosition:3, positionForecast:2, barsPattern:1, ghostFeed:2, projection:3, anchoredVwap:1, fixedRangeProfile:2, anchoredVolumeProfile:1, regressionTrend:2,
};
export const isPatternTool=(tool:Tool):tool is PatternTool=>Object.hasOwn(patternTools,tool);

export const MAX_STROKE_POINTS = 512;
export const MAX_PATH_POINTS = 512;
export const isPolyline = (tool: Tool | "select"): tool is "path" | "polyline" =>
  tool==="path" || tool==="polyline";
type PositionTool = "longPosition" | "shortPosition";
export const isPosition = (tool: Tool | "select"): tool is PositionTool =>
  tool==="longPosition" || tool==="shortPosition";

export function positionLevels(tool:PositionTool,entry:number,target:number,stop:number){
  if(![entry,target,stop].every(price=>Number.isFinite(price)&&price>0))return null;
  const direction=tool==="longPosition"?1:-1;
  const reward=(target-entry)*direction,risk=(entry-stop)*direction;
  if(reward<=0||risk<=0||!Number.isFinite(reward/risk))return null;
  return {reward,risk,rewardRisk:reward/risk};
}

export function validPositionAnchor(tool:PositionTool,anchors:Anchor[],anchor:Anchor){
  if(anchor.price<=0)return false;
  if(!anchors.length)return true;
  const [entry,target]=anchors;
  if(!target)return anchor.time!==entry.time&&(tool==="longPosition"?anchor.price>entry.price:anchor.price<entry.price);
  return positionLevels(tool,entry.price,target.price,anchor.price)!==null;
}

export const isFreehand = (tool: Tool | "select"): tool is "brush" | "highlighter" =>
  tool==="brush" || tool==="highlighter";
export type Anchor = {time:number;price:number};
export type Drawing = {id:string;tool:Tool;anchors:Anchor[];color:string;text:string;closed?:boolean;viewportAnchor?:Point;pattern?:readonly PatternBar[];ghost?:GhostSettings;volumeInterval?:number;volumeTimeframe?:CalendarChartTimeframe;regression?:RegressionSettings;gann?:GannStyle;fibonacci?:FibonacciStyle};
export type Point = {x:number;y:number};
const annotationTools = new Set<Tool>(["note","anchoredNote","callout","priceLabel","priceNote","signpost","comment","flagMark"]);
const hasPriceCaption = (tool: Tool) => tool==="priceLabel" || tool==="priceNote";
export const isAnnotation = (tool: Tool) => annotationTools.has(tool);
export const isTextDrawing = (tool: Tool) => tool==="text" || tool==="table" || tool==="pin" || tool==="arrowMarker" || isAnnotation(tool)&&tool!=="priceLabel"&&tool!=="flagMark";

export function viewportPosition(point:Point,w:number,h:number):Point {
  return {x:Math.max(0,Math.min(1,point.x/w)),y:Math.max(0,Math.min(1,point.y/h))};
}

type Segment = [Point,Point];
type Measurement = { point:Point; lines:string[]; align?:"left"|"center" };
type Oval = { center:Point; radiusX:number; radiusY:number; angle:number };
type Arc = { center:Point; radius:number; start:number; sweep:number };
type EllipseArc = {center:Point;radiusX:number;radiusY:number;start:number;end:number;anticlockwise:boolean};
type Bezier = { start:Point; end:Point; control:Point; secondControl?:Point };
type PositionBox = {left:number;right:number;top:number;bottom:number};
type GhostBody = {x:number;y:number;width:number;height:number};
type ProfileRow = GhostBody & {inValueArea:boolean;isPoc:boolean};
type Shape = { lines:Segment[]; guides?:Segment[]; stamp?:{point:Point;text:string}; pin?:Point; table?:string[][]; centerLine?:Segment; profileRows?:ProfileRow[]; handles?:Point[]; ghostBodies?:GhostBody[]; position?:PositionBox; fill?:Point[]; bands?:Point[][]; oval?:Oval; arc?:Arc; ellipseArcs?:EllipseArc[]; arcBands?:[EllipseArc,EllipseArc][]; path?:Point[]; extent?:Point[]; bezier?:Bezier; label?:Point; measurements?:Measurement[] };

function rotatedRectangle(a:Point,b:Point,c?:Point):Shape{
  const dx=b.x-a.x,dy=b.y-a.y;
  const lengthSquared=dx*dx+dy*dy;
  if(!c||lengthSquared<0.001)return {lines:[[a,b]]};
  const offset=((c.y-a.y)*dx-(c.x-a.x)*dy)/lengthSquared;
  const fourth={x:a.x-dy*offset,y:a.y+dx*offset};
  const third={x:b.x-dy*offset,y:b.y+dx*offset};
  return {lines:[[a,b],[b,third],[third,fourth],[fourth,a]],fill:[a,b,third,fourth]};
}

const fullTurn=Math.PI*2;
const positiveAngle=(angle:number)=>((angle%fullTurn)+fullTurn)%fullTurn;

function arcThrough(start:Point,end:Point,bend?:Point):Shape {
  if(!bend)return {lines:[[start,end]]};
  const ax=end.x-start.x,ay=end.y-start.y,bx=bend.x-start.x,by=bend.y-start.y;
  const cross=ax*by-ay*bx;
  if(Math.abs(cross)<Math.max(0.001,Math.hypot(ax,ay)*0.5))return {lines:[[start,bend],[bend,end]]};
  const a2=ax*ax+ay*ay,b2=bx*bx+by*by;
  const center={x:start.x+(by*a2-ay*b2)/(2*cross),y:start.y+(ax*b2-bx*a2)/(2*cross)};
  const angle=(point:Point)=>Math.atan2(point.y-center.y,point.x-center.x);
  const first=angle(start),endAngle=positiveAngle(angle(end)-first),bendAngle=positiveAngle(angle(bend)-first);
  const sweep=bendAngle<=endAngle?endAngle:endAngle-fullTurn;
  return {lines:[],arc:{center,radius:Math.hypot(start.x-center.x,start.y-center.y),start:first,sweep}};
}

function onArcAngle(angle:number,arc:Arc):boolean{
  return arc.sweep>=0?positiveAngle(angle-arc.start)<=arc.sweep
    :positiveAngle(arc.start-angle)<=-arc.sweep;
}

function arcExtent(arc:Arc):Point[]{
  return [0,Math.PI/2,Math.PI,Math.PI*1.5].filter(angle=>onArcAngle(angle,arc)).map(angle=>({
    x:arc.center.x+arc.radius*Math.cos(angle),y:arc.center.y+arc.radius*Math.sin(angle),
  }));
}

function nearArc(point:Point,arc:Arc):boolean{
  const dx=point.x-arc.center.x,dy=point.y-arc.center.y;
  return Math.abs(Math.hypot(dx,dy)-arc.radius)<=7&&onArcAngle(Math.atan2(dy,dx),arc);
}

function traceBezier(context:CanvasRenderingContext2D,{start,end,control,secondControl}:Bezier){
  context.moveTo(start.x,start.y);
  if(secondControl){
    context.bezierCurveTo(control.x,control.y,secondControl.x,secondControl.y,end.x,end.y);
  }else context.quadraticCurveTo(control.x,control.y,end.x,end.y);
}

function ovalFor(tool:"circle"|"ellipse",a:Point,b:Point,c?:Point):Shape {
  const dx=b.x-a.x,dy=b.y-a.y;
  const diameter=Math.hypot(dx,dy);
  if(diameter<0.001||tool==="ellipse"&&!c)return {lines:[[a,b]]};
  if(!c){
    return {lines:[],oval:{center:a,radiusX:diameter,radiusY:diameter,angle:0}};
  }
  const radiusY=Math.abs((c.y-a.y)*dx-(c.x-a.x)*dy)/diameter;
  if(radiusY<0.001)return {lines:[[a,b]]};
  return {lines:[],oval:{center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},
    radiusX:diameter/2,radiusY,angle:Math.atan2(dy,dx)}};
}

function ovalExtent({center,radiusX,radiusY,angle}:Oval):Point[]{
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const x=Math.hypot(radiusX*cos,radiusY*sin),y=Math.hypot(radiusX*sin,radiusY*cos);
  return [{x:center.x-x,y:center.y-y},{x:center.x+x,y:center.y+y}];
}

function withinOval(point:Point,{center,radiusX,radiusY,angle}:Oval):boolean{
  const dx=point.x-center.x,dy=point.y-center.y;
  const cos=Math.cos(angle),sin=Math.sin(angle);
  return Math.hypot((dx*cos+dy*sin)/(radiusX+6),(dy*cos-dx*sin)/(radiusY+6))<=1;
}

const retracementLevels = [0, .236, .382, .5, .618, .786, 1];
const extensionLevels = [0, .618, 1, 1.272, 1.618, 2, 2.618];
const priceFormat = new Intl.NumberFormat("en-US", {
  style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:4,
});
const changeFormat = new Intl.NumberFormat("en-US", {
  style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:4, signDisplay:"exceptZero",
});
const percentFormat = new Intl.NumberFormat("en-US", {
  style:"percent", maximumFractionDigits:2, signDisplay:"exceptZero",
});

export function fibonacciLevels(tool:"fibRetracement"|"fibExtension", start:number, end:number, pullback=start) {
  return tool==="fibRetracement"
    ? retracementLevels.map(ratio=>({ratio,price:end+(start-end)*ratio}))
    : extensionLevels.map(ratio=>({ratio,price:pullback+(end-start)*ratio}));
}

export function drawingDuration(seconds:number) {
  let remainder=Math.abs(seconds);
  const parts:string[]=[];
  for(const [unit,amount] of [["d",86400],["h",3600],["m",60],["s",1]] as const){
    const value=Math.floor(remainder/amount);
    if(value)parts.push(`${value}${unit}`);
    remainder%=amount;
  }
  return parts.join(" ")||"0m";
}

function rectangle(from:Point,to:Point) {
  const upper={x:to.x,y:from.y},lower={x:from.x,y:to.y};
  return {lines:[[from,upper],[upper,to],[to,lower],[lower,from]] as Segment[],fill:[from,upper,to,lower]};
}

function projectionShape(drawing:Drawing,points:Point[]):Shape {
  const [origin,deadline,target]=points;
  if(drawing.anchors[1].time<=drawing.anchors[0].time)return {lines:[]};
  if(!target)return {lines:[[origin,deadline]]};
  const [start,end,estimate]=drawing.anchors;
  const change=percentFormat.format((estimate.price-start.price)/start.price);
  return {lines:[[origin,deadline],[deadline,target],...arrowLines(origin,target)],
    fill:[origin,deadline,target],
    measurements:[{point:{x:target.x,y:Math.min(deadline.y,target.y)-23},align:"center",
      lines:[`${priceFormat.format(estimate.price)} · ${change}`,drawingDuration(end.time-start.time)]}]};
}

function rangeShape(tool:"priceRange"|"dateRange"|"datePriceRange",drawing:Drawing,points:Point[],bars:number|null):Shape {
  const [from,to]=points;
  const [first,last]=drawing.anchors;
  const showPrice=tool!=="dateRange",showDate=tool!=="priceRange";
  const start={...from},end={...to};
  // Give the single-axis tools a readable band even when the user places the anchors in a straight line.
  if(!showDate && Math.abs(end.x-start.x)<12){start.x=from.x-12;end.x=from.x+12;}
  if(!showPrice && Math.abs(end.y-start.y)<12){start.y=from.y-12;end.y=from.y+12;}
  const box=rectangle(start,end);
  const middle={x:(start.x+end.x)/2,y:(start.y+end.y)/2};
  const lines:string[]=[];
  if(showPrice){
    const change=last.price-first.price;
    const percent=first.price>0?` (${percentFormat.format(change/first.price)})`:"";
    lines.push(`${changeFormat.format(change)}${percent}`);
    box.lines.push(...arrowLines({x:middle.x,y:from.y},{x:middle.x,y:to.y}));
  }
  if(showDate){
    const count=bars===null?"":`${bars.toLocaleString("en-US")} ${bars===1?"bar":"bars"} · `;
    lines.push(count+drawingDuration(last.time-first.time));
    box.lines.push(...arrowLines({x:from.x,y:middle.y},{x:to.x,y:middle.y}));
  }
  return {...box,measurements:[{point:{x:middle.x,y:Math.max(start.y,end.y)+6},lines,align:"center"}]};
}

function fibShape(tool:"fibRetracement"|"fibExtension",drawing:Drawing,points:Point[],toY:(price:number)=>number|null,w:number,h:number):Shape{
  const [a,b,c]=points;
  const lines:Segment[]=c?[[a,b],[b,c]]:[[a,b]];
  if(tool==="fibExtension"&&!c)return {lines};
  const [start,end,pullback]=drawing.anchors;
  const left=tool==="fibExtension"?c.x:Math.min(a.x,b.x);
  const right=tool==="fibExtension"?w:Math.max(a.x,b.x);
  if(left>w||right<0)return {lines};
  const measurements:Measurement[]=[];
  for(const {ratio,price} of fibonacciLevels(tool,start.price,end.price,pullback?.price)){
    const y=toY(price);
    if(y===null||!Number.isFinite(y)||y<0||y>h)continue;
    lines.push([{x:left,y},{x:right,y}]);
    if(measurements.every(label=>Math.abs(label.point.y-(y-16))>=18)){
      measurements.push({point:{x:Math.max(2,left)+4,y:y-16},lines:[`${Number((ratio*100).toFixed(2))}% · ${priceFormat.format(price)}`]});
    }
  }
  return {lines,measurements};
}

function paintMeasurements(context:CanvasRenderingContext2D,measurements:Measurement[],w:number,h:number,dark:boolean){
  context.font="11px sans-serif";
  context.textBaseline="top";
  for(const {point,lines,align} of measurements){
    const width=Math.min(w,Math.max(...lines.map(line=>context.measureText(line).width))+10);
    const height=lines.length*14+4;
    const x=Math.max(0,Math.min(w-width,point.x-(align==="center"?width/2:0)));
    const y=Math.max(0,Math.min(h-height,point.y));
    context.fillStyle=dark?"#182437":"#f4f7fc";
    context.fillRect(x,y,width,height);
    context.fillStyle=dark?"#f1f5f9":"#16233a";
    lines.forEach((line,index)=>context.fillText(line,x+5,y+3+index*14,Math.max(1,width-10)));
  }
}

const positionPercent = new Intl.NumberFormat("en-US",{style:"percent",maximumFractionDigits:2});
const positionRatio = new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
const positionColors = {target:"#16875d",stop:"#d0444f"};
export const positionDefaultColor="#64748b";
const positionCaptions = new WeakMap<Drawing, {target:string;entry:string;stop?:string}>();

function getPositionCaptions(drawing:Drawing,tool:PositionTool){
  const cached=positionCaptions.get(drawing);
  if(cached)return cached;
  const [entry,target,stop]=drawing.anchors;
  const levels=stop?positionLevels(tool,entry.price,target.price,stop.price):null;
  const result={
    target:`Target ${priceFormat.format(target.price)} · +${positionPercent.format(Math.abs(target.price-entry.price)/entry.price)}`,
    entry:`Entry ${priceFormat.format(entry.price)}${levels?` · ${positionRatio.format(levels.rewardRisk)} R`:""}`,
    stop:levels?`Stop ${priceFormat.format(stop.price)} · −${positionPercent.format(levels.risk/entry.price)}`:undefined,
  };
  positionCaptions.set(drawing,result);
  return result;
}

function paintPosition(context:CanvasRenderingContext2D,drawing:Drawing,tool:PositionTool,points:Point[],
  w:number,h:number,dark:boolean,selected:boolean):Shape|null {
  const [entry,target,stop]=points;
  const [entryAnchor,targetAnchor,stopAnchor]=drawing.anchors;
  if(!target||!validPositionAnchor(tool,[entryAnchor],targetAnchor))return null;
  const showStop=stop&&positionLevels(tool,entryAnchor.price,targetAnchor.price,stopAnchor.price);
  const left=Math.min(entry.x,target.x),right=Math.max(entry.x,target.x);
  const top=Math.min(entry.y,target.y,showStop?stop.y:entry.y);
  const bottom=Math.max(entry.y,target.y,showStop?stop.y:entry.y);
  const levels:{point:Point;color:string;key:"target"|"entry"|"stop"}[]=[
    {point:target,color:positionColors.target,key:"target"},
    {point:entry,color:drawing.color,key:"entry"},
  ];
  if(showStop)levels.push({point:stop,color:positionColors.stop,key:"stop"});
  if(right<0||left>w||bottom<0||top>h)return null;

  context.save();
  for(const {point,color,key} of levels){
    if(key==="entry")continue;
    context.fillStyle=color;
    context.globalAlpha=.18;
    context.fillRect(left,Math.min(entry.y,point.y),right-left,Math.abs(point.y-entry.y));
  }
  context.globalAlpha=1;
  context.lineWidth=selected?1.5:1;
  for(const {point,color} of levels){
    context.strokeStyle=color;
    context.beginPath();
    context.moveTo(left,point.y);
    context.lineTo(right,point.y);
    context.stroke();
    if(selected&&point.x>=0&&point.x<=w&&point.y>=0&&point.y<=h){
      context.fillStyle=color;
      context.beginPath();
      context.arc(point.x,point.y,4,0,Math.PI*2);
      context.fill();
    }
  }

  const captions=getPositionCaptions(drawing,tool);
  const visible=levels.filter(({point})=>point.y>=0&&point.y<=h).sort((a,b)=>a.point.y-b.point.y);
  context.font="11px sans-serif";
  context.textBaseline="top";
  const lines=visible.map(({point,key,color})=>({y:point.y-8,text:captions[key]??"",color}));
  let bottomEdge=h;
  for(let i=lines.length-1;i>=0;i--){
    lines[i].y=Math.max(i*18,Math.min(lines[i].y,bottomEdge-18));
    bottomEdge=lines[i].y;
  }
  for(const {y,text,color} of lines){
    const width=Math.min(w,context.measureText(text).width+10);
    const x=Math.max(0,Math.min(w-width,left+3));
    context.fillStyle=dark?"#162133":"#ffffff";
    context.fillRect(x,y,width,17);
    context.fillStyle=color;
    context.fillRect(x,y,2,17);
    context.fillStyle=dark?"#eff4fa":"#172432";
    context.fillText(text,x+5,y+2,Math.max(1,width-9));
  }
  context.restore();
  return {lines:[],position:{left,right,top,bottom}};
}

type AnnotationBox = { x:number; y:number; width:number; height:number; leader?:Segment };
type AnnotationText = { maxWidth:number; lines:string[]; widths:number[] };
const annotationText = new WeakMap<Drawing,AnnotationText>();
const annotationLineHeight=15;

function fitAnnotationText(context:CanvasRenderingContext2D,drawing:Drawing,maxWidth:number):AnnotationText {
  const cached=annotationText.get(drawing);
  if(cached?.maxWidth===maxWidth)return cached;
  const note=drawing.text.trim();
  const caption=hasPriceCaption(drawing.tool)
    ? [priceFormat.format(drawing.anchors[0].price),note].filter(Boolean).join("\n")
    :note||drawingTools[drawing.tool];
  const lines:string[]=[];
  for(const paragraph of caption.split("\n")){
    let line="";
    for(const word of paragraph.trim().split(/\s+/u)){
      const next=line?line+" "+word:word;
      if(context.measureText(next).width<=maxWidth){line=next;continue;}
      if(line)lines.push(line);
      line=word;
      while(line.length>1&&context.measureText(line).width>maxWidth){
        let count=1;
        while(count<line.length-1&&context.measureText(line.slice(0,count+1)).width<=maxWidth)count++;
        lines.push(line.slice(0,count));
        line=line.slice(count);
      }
    }
    lines.push(line);
  }
  const layout={maxWidth,lines,widths:lines.map(line=>context.measureText(line).width)};
  annotationText.set(drawing,layout);
  return layout;
}

function paintAnnotation(context:CanvasRenderingContext2D,drawing:Drawing,points:Point[],
  paneWidth:number,paneHeight:number,dark:boolean,selected:boolean):AnnotationBox|null {
  const [anchor,label]=points;
  if(paneWidth<24||paneHeight<24||(!drawing.viewportAnchor&&(
    points.every(point=>point.x<0)||points.every(point=>point.x>paneWidth)||
    points.every(point=>point.y<0)||points.every(point=>point.y>paneHeight))))return null;

  if(drawing.tool==="flagMark")return paintFlagMark(context,anchor,drawing.color,selected);
  const signpost=drawing.tool==="signpost";
  const comment=drawing.tool==="comment";
  context.save();
  context.font=hasPriceCaption(drawing.tool)?"600 12px sans-serif":"12px sans-serif";
  context.textBaseline="top";
  const maxWidth=Math.min(comment?128:172,Math.floor(paneWidth-18));
  const layout=fitAnnotationText(context,drawing,maxWidth);
  const capacity=Math.max(1,Math.floor((paneHeight-16)/annotationLineHeight));
  const lines=layout.lines.length>capacity
    ? [...layout.lines.slice(0,capacity-1),layout.lines[capacity-1]+"…"] : layout.lines;
  const width=Math.min(maxWidth,Math.max(...layout.widths.slice(0,capacity))+(lines===layout.lines?0:8))+12;
  const height=lines.length*annotationLineHeight+8;
  const labelPoint=label??anchor;
  const labelX=signpost?anchor.x-width/2:labelPoint.x+(label||drawing.viewportAnchor?0:10);
  const labelY=signpost&&labelPoint.y<anchor.y?labelPoint.y-height
    :comment?anchor.y-height-6:labelPoint.y-(label||drawing.viewportAnchor?0:height/2);
  const x=Math.max(2,Math.min(paneWidth-width-2,labelX));
  const y=Math.max(2,Math.min(paneHeight-height-2,labelY));
  const nearest={x:Math.max(x,Math.min(x+width,anchor.x)),y:Math.max(y,Math.min(y+height,anchor.y))};
  const leader:Segment|undefined=drawing.viewportAnchor?undefined:[anchor,signpost?{x:anchor.x,y:nearest.y}:nearest];
  context.strokeStyle=drawing.color;
  context.lineWidth=selected?2:1;
  const background=dark?"#162133":"#ffffff";
  if(leader&&!comment){
    context.beginPath();
    context.moveTo(anchor.x,anchor.y);
    context.lineTo(leader[1].x,leader[1].y);
    context.stroke();
    context.fillStyle=drawing.color;
    context.beginPath();
    context.arc(anchor.x,anchor.y,selected?4:2.5,0,Math.PI*2);
    context.fill();
  }
  context.fillStyle=background;
  context.fillRect(x,y,width,height);
  context.strokeRect(x,y,width,height);
  if(comment&&leader){
    const tipOnTop=anchor.y<nearest.y;
    const tailY=tipOnTop?y:y+height;
    const tailX=Math.max(x+5,Math.min(x+width-5,nearest.x));
    context.beginPath();
    context.moveTo(tailX-4,tailY);
    context.lineTo(anchor.x,anchor.y);
    context.lineTo(tailX+4,tailY);
    context.fill();
    context.stroke();
  }
  context.fillStyle=dark?"#eff4fa":"#172432";
  lines.forEach((line,index)=>context.fillText(line,x+6,y+5+index*annotationLineHeight,width-12));
  if(selected&&label){
    context.fillStyle=drawing.color;
    context.beginPath();
    context.arc(signpost?anchor.x:label.x,label.y,4,0,Math.PI*2);
    context.fill();
  }
  context.restore();
  return {x,y,width,height,leader};
}

function paintFlagMark(context:CanvasRenderingContext2D,anchor:Point,color:string,selected:boolean):AnnotationBox {
  const {x,y}=anchor;
  context.save();
  context.strokeStyle=color;
  context.fillStyle=color;
  context.lineWidth=selected?2.5:1.5;
  context.beginPath();
  context.moveTo(x,y);
  context.lineTo(x,y-19);
  context.stroke();
  context.beginPath();
  context.moveTo(x,y-19);
  context.lineTo(x+14,y-19);
  context.lineTo(x+10,y-15);
  context.lineTo(x+14,y-11);
  context.lineTo(x,y-11);
  context.closePath();
  context.fill();
  context.restore();
  return {x:x-3,y:y-21,width:20,height:24};
}

function raySegment(start:Point,end:Point,w:number,h:number):Segment[] {
  const dx=end.x-start.x,dy=end.y-start.y;
  if(dx===0&&dy===0)return [];
  let first=0,last=Infinity;
  for(const [origin,delta,max] of [[start.x,dx,w],[start.y,dy,h]]){
    if(!delta){
      if(origin<0||origin>max)return [];
      continue;
    }
    const a=-origin/delta,b=(max-origin)/delta;
    first=Math.max(first,Math.min(a,b));
    last=Math.min(last,Math.max(a,b));
  }
  if(first>last)return [];
  const at=(t:number)=>({x:start.x+t*dx,y:start.y+t*dy});
  return [[at(first),at(last)]];
}

export function pitchforkGeometry(tool:PitchforkTool,a:Point,b:Point,c:Point){
  const firstSwing={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const secondSwing={x:(b.x+c.x)/2,y:(b.y+c.y)/2};
  const origin=tool==="pitchfork"?a:tool==="schiffPitchfork"?{x:a.x,y:firstSwing.y}:firstSwing;
  const inside=tool==="insidePitchfork";
  const through=inside?c:secondSwing;
  const rails=inside?[a,b]:[b,c];
  return {origin,through,rails};
}

function pitchforkShape(tool:PitchforkTool,a:Point,b:Point,c:Point|undefined,w:number,h:number):Shape{
  if(!c)return {lines:[[a,b]]};
  const {origin,through,rails}=pitchforkGeometry(tool,a,b,c);
  const dx=through.x-origin.x;
  if(Math.abs(dx)<.0001)return {lines:[[a,b],[b,c]]};
  const slope=(through.y-origin.y)/dx;
  const forward=(start:Point)=>raySegment(start,{x:start.x+1,y:start.y+slope},w,h);
  const [first,second]=rails;
  const left=Math.max(0,first.x,second.x);
  const project=(start:Point,x:number)=>({x,y:start.y+(x-start.x)*slope});
  const fill=left<w?[project(first,left),project(first,w),project(second,w),project(second,left)]:undefined;
  return {lines:[...forward(first),...forward(second)],centerLine:forward(origin)[0],fill};
}

// Ratios are time to price. The second anchor calibrates the 1:1 ray.
const gannRatios=[[1,8],[1,4],[1,3],[1,2],[1,1],[2,1],[3,1],[4,1],[8,1]] as const;
const gannSquareRadii=[1,Math.SQRT2,1.5,2,Math.hypot(2,1),3,Math.hypot(3,1),4,Math.hypot(4,1),5,Math.hypot(5,1)]
  .map(radius=>radius/5);

export function validGannAnchors(a:Anchor,b:Anchor){
  return a.time!==b.time&&a.price!==b.price;
}

export function gannFixedCorner(origin:Point,pointer:Point,ratio:number,w:number,h:number):Point{
  const xDirection=Math.sign(pointer.x-origin.x)||1,yDirection=Math.sign(pointer.y-origin.y)||1;
  const length=Math.hypot(1,ratio);
  const xVector=xDirection/length,yVector=yDirection*ratio/length;
  const along=(pointer.x-origin.x)*xVector+(pointer.y-origin.y)*yVector;
  // Keep the constrained handle inside the chart pane.
  const xLimit=Math.max(0,xDirection>0?w-1-origin.x:origin.x)/Math.abs(xVector);
  const yLimit=Math.max(0,yDirection>0?h-1-origin.y:origin.y)/Math.abs(yVector);
  const distance=Math.min(along,xLimit,yLimit);
  return {x:origin.x+distance*xVector,y:origin.y+distance*yVector};
}

function ellipseArcPoint({center,radiusX,radiusY}:EllipseArc,angle:number):Point{
  return {x:center.x+radiusX*Math.cos(angle),y:center.y+radiusY*Math.sin(angle)};
}
function appendEllipseArc(context:CanvasRenderingContext2D,{center,radiusX,radiusY,start,end,anticlockwise}:EllipseArc){
  context.ellipse(center.x,center.y,radiusX,radiusY,0,start,end,anticlockwise);
}
function traceEllipseArc(context:CanvasRenderingContext2D,arc:EllipseArc){
  const start=ellipseArcPoint(arc,arc.start);
  context.moveTo(start.x,start.y);
  appendEllipseArc(context,arc);
}
function onEllipseArcAngle(angle:number,{start,end,anticlockwise}:EllipseArc){
  if(Math.abs(end-start)>=fullTurn)return true;
  const sweep=anticlockwise?positiveAngle(start-end):positiveAngle(end-start);
  const delta=anticlockwise?positiveAngle(start-angle):positiveAngle(angle-start);
  return delta<=sweep;
}
function nearEllipseArc(point:Point,arc:EllipseArc){
  const {center,radiusX,radiusY}=arc;
  const angle=Math.atan2((point.y-center.y)/radiusY,(point.x-center.x)/radiusX);
  const edge=ellipseArcPoint(arc,angle);
  return onEllipseArcAngle(angle,arc)&&Math.hypot(point.x-edge.x,point.y-edge.y)<=7;
}
function ellipseArcExtent(arc:EllipseArc):Point[]{
  const angles=[0,Math.PI/2,Math.PI,Math.PI*1.5].filter(angle=>onEllipseArcAngle(angle,arc));
  return [arc.start,arc.end,...angles].map(angle=>ellipseArcPoint(arc,angle));
}

export function gannShape(tool:GannTool,first:Point,second:Point,style:GannStyle|undefined,w:number,h:number,bars:number|null=null,priceRange?:number):Shape{
  const [a,b]=gannStyleValue(style,"reverse")?[second,first]:[first,second];
  const dx=b.x-a.x,dy=b.y-a.y;
  if(Math.abs(dx)<.001||Math.abs(dy)<.001)return {lines:[[a,b]]};
  const at=(x:number,y:number):Point=>({x:a.x+x*dx,y:a.y+y*dy});
  const measurements:Measurement[]=[];
  const label=(point:Point,text:string)=>{
    if(point.x<0||point.y<0||point.x>w||point.y>h)return;
    const position={x:Math.max(0,Math.min(w-text.length*7-12,point.x+3)),
      y:Math.max(0,Math.min(h-18,point.y-16))};
    if(measurements.every(({point:p})=>Math.abs(p.y-position.y)>=18||
      Math.abs(p.x-position.x)>=Math.max(text.length,6)*7+10)){
      measurements.push({point:position,lines:[text]});
    }
  };
  const background=gannStyleValue(style,"background");
  const labels=gannStyleValue(style,"labels");
  if(tool==="gannFan"){
    const lines:Segment[]=[];
    let centerLine:Segment|undefined;
    for(const [time,price] of gannRatios){
      const [segment]=raySegment(a,at(time,price),w,h);
      if(!segment)continue;
      if(time===price)centerLine=segment;
      else lines.push(segment);
      if(labels&&time!==price)label(segment[1],time+"/"+price);
    }
    if(labels&&centerLine){
      const [start,end]=centerLine;
      label({x:(start.x+end.x)/2,y:(start.y+end.y)/2},"1/1");
    }
    const horizontal=(dx>0?w-a.x:-a.x)/dx;
    const fill=background&&horizontal>0?[a,at(horizontal,horizontal/8),at(horizontal,horizontal*8)]:undefined;
    return {lines,centerLine,fill,measurements};
  }
  const corners=[a,at(1,0),b,at(0,1)];
  const lines:Segment[]=corners.map((point,i)=>[point,corners[(i+1)%corners.length]]);
  const box=tool==="gannBox";
  const divisions=box?4:5;
  if(gannStyleValue(style,"levels")){
    for(let i=1;i<divisions;i++){
      const fraction=i/divisions;
      lines.push([at(fraction,0),at(fraction,1)],[at(0,fraction),at(1,fraction)]);
      if(labels&&box){
        label(at(fraction,0),i*25+"%");
        label(at(0,fraction),i*25+"%");
      }
    }
  }
  const angles=gannStyleValue(style,"angles");
  if(angles){
    if(box)lines.push([corners[1],corners[3]]);
    else lines.push([a,at(.5,1)],[a,at(1,.5)]);
  }
  if(labels&&!box&&priceRange!==undefined&&bars){
    label(b,priceFormat.format(priceRange)+" / "+bars+" bars");
    if(tool==="gannSquare")label(a,priceFormat.format(priceRange/bars)+"/bar");
  }
  const ellipseArcs=box||!gannStyleValue(style,"arcs")?undefined:gannSquareRadii.map(radius=>{
    const start=radius>1?Math.acos(1/radius):0;
    const end=radius>1?Math.asin(1/radius):Math.PI/2;
    const offset=dx<0?Math.PI:0;
    const direction=Math.sign(dx*dy);
    return {center:a,radiusX:Math.abs(dx)*radius,radiusY:Math.abs(dy)*radius,
      start:offset+start*direction,end:offset+end*direction,anticlockwise:direction<0};
  });
  return {lines,centerLine:angles?[a,b]:undefined,ellipseArcs,fill:background?corners:undefined,measurements};
}

const fibonacciTimeSequence=[0,1,2,3,5,8,13,21,34,55,89,144,233];
const trendTimeRatios=[0,.382,.618,1,1.382,1.618,2,2.382,2.618,3,3.618,4.236];
const fibonacciChannelRatios=[...retracementLevels,1.272,1.618,2,2.618,3.618,4.236];
const speedFanRatios=[.25,.382,.5,.618,.75];

export function validFibonacciBase(tool:FibonacciProjectionTool,a:Anchor,b:Anchor){
  return a.time!==b.time&&(tool!=="fibSpeedResistanceFan"||a.price!==b.price);
}

function fibonacciChannelWidth(a:Point,b:Point,c:Point){
  return c.y-a.y-(c.x-a.x)*(b.y-a.y)/(b.x-a.x);
}
export function validFibonacciChannelWidth(a:Point,b:Point,c:Point){
  const dx=b.x-a.x,dy=b.y-a.y;
  return Math.abs(dx)>.001&&Math.abs(fibonacciChannelWidth(a,b,c)*dx)>=Math.hypot(dx,dy);
}

export function fibonacciProjectionShape(tool:FibonacciProjectionTool,points:Point[],style:FibonacciStyle|undefined,w:number,h:number):Shape{
  const [a,b,c]=points;
  if(!b)return {lines:[]};
  const dx=b.x-a.x,dy=b.y-a.y;
  if(Math.abs(dx)<.001)return {lines:[[a,b]]};
  const labels=fibonacciStyleValue(style,"labels");
  const background=fibonacciStyleValue(style,"background");
  const measurements:Measurement[]=[];
  const label=(x:number,y:number,ratio:number)=>{
    if(!labels||x<0||x>w||y<0||y>h)return;
    const text=String(ratio);
    const point={x:Math.max(0,Math.min(w-text.length*7-10,x+4)),y:Math.max(0,Math.min(h-18,y))};
    if(measurements.every(({point:p})=>Math.abs(p.y-point.y)>=18||Math.abs(p.x-point.x)>=32)){
      measurements.push({point,lines:[text]});
    }
  };
  if(tool==="fibTimeZone"||tool==="trendBasedFibTime"){
    const guide=fibonacciStyleValue(style,"trendLine")?[a,b] as Segment:undefined;
    const start=tool==="fibTimeZone"?a:c;
    if(!start)return {lines:[],centerLine:guide};
    const ratios=tool==="fibTimeZone"?fibonacciTimeSequence:trendTimeRatios;
    const levels=ratios.map(ratio=>({x:start.x+ratio*dx,ratio}));
    const lines:Segment[]=[],bands:Point[][]=[];
    for(const [index,{x,ratio}] of levels.entries()){
      if(x>=0&&x<=w){
        lines.push([{x,y:0},{x,y:h}]);
        label(x,h-18,ratio);
      }
      if(background&&index%2===1){
        const last=levels[index-1].x;
        const left=Math.max(0,Math.min(last,x)),right=Math.min(w,Math.max(last,x));
        if(right>left)bands.push([{x:left,y:0},{x:right,y:0},{x:right,y:h},{x:left,y:h}]);
      }
    }
    return {lines,centerLine:guide,bands,measurements};
  }
  if(tool==="fibChannel"){
    if(!c)return {lines:[[a,b]]};
    const width=fibonacciChannelWidth(a,b,c),slope=dy/dx;
    if(Math.abs(width)<.001)return {lines:[[a,b]]};
    const left=fibonacciStyleValue(style,"extendLeft")?0:Math.max(0,Math.min(a.x,b.x));
    const right=fibonacciStyleValue(style,"extendRight")?w:Math.min(w,Math.max(a.x,b.x));
    if(left>=right)return {lines:[]};
    const at=(x:number,ratio:number):Point=>({x,y:a.y+(x-a.x)*slope+ratio*width});
    const lines:Segment[]=[],bands:Point[][]=[];
    for(const [index,ratio] of fibonacciChannelRatios.entries()){
      const first=at(left,ratio),last=at(right,ratio);
      if(!(first.y<0&&last.y<0||first.y>h&&last.y>h)){
        lines.push([first,last]);
        const labelX=last.y>=0&&last.y<=h?Math.max(left,right-44):Math.max(left,Math.min(right, left+(h*.5-first.y)/slope));
        label(labelX,at(labelX,ratio).y-13,ratio);
      }
      if(background&&index%2===1){
        const previous=fibonacciChannelRatios[index-1];
        bands.push([at(left,previous),at(right,previous),last,first]);
      }
    }
    return {lines,bands,measurements};
  }
  if(Math.abs(dy)<.001)return {lines:[[a,b]]};
  const [origin,end]=fibonacciStyleValue(style,"reverse")?[b,a]:[a,b];
  const horizontal=end.x-origin.x,vertical=end.y-origin.y;
  const at=(x:number,y:number):Point=>({x:origin.x+x*horizontal,y:origin.y+y*vertical});
  const lines:Segment[]=[...raySegment(origin,at(1,0),w,h),...raySegment(origin,at(0,1),w,h)];
  const centerLine=raySegment(origin,end,w,h)[0];
  const grid=fibonacciStyleValue(style,"grid");
  const raySlopes=[0,1,...speedFanRatios.flatMap(ratio=>[1-ratio,1/(1-ratio)])].sort((m,n)=>m-n);
  const bands:Point[][]=[];
  const horizontalLimit=Math.max(0,(horizontal>0?w-origin.x:-origin.x)/horizontal);
  const verticalLimit=Math.max(0,(vertical>0?h-origin.y:-origin.y)/vertical);
  // All outer points stay at or beyond the viewport, including steep rays that exit through the price edge.
  const limit=Math.max(horizontalLimit,verticalLimit);
  if(background&&limit>0){
    for(let index=1;index<raySlopes.length;index+=2){
      bands.push([origin,at(limit,limit*raySlopes[index-1]),at(limit,limit*raySlopes[index])]);
    }
  }
  if(grid)lines.push([at(1,0),end],[at(0,1),end]);
  label(end.x,end.y-15,0);
  label(origin.x,origin.y-16,1);
  for(const ratio of speedFanRatios){
    const fraction=1-ratio;
    const price=at(1,fraction),time=at(fraction,1);
    lines.push(...raySegment(origin,price,w,h),...raySegment(origin,time,w,h));
    if(grid)lines.push([at(0,fraction),price],[at(fraction,0),time]);
    label(price.x,price.y-15,ratio);
    label(time.x,time.y-15,ratio);
  }
  return {lines,centerLine,bands,measurements};
}

const fibonacciCurveRatios=[.236,.382,.5,.618,.786,1,1.618,2.618,3.618,4.236,4.618];
const goldenRatio=(1+Math.sqrt(5))/2;
const spiralVectors=Array.from({length:241},(_,index)=>{
  const turns=(index-150)/60;
  const radius=goldenRatio**(4*turns);
  return {x:radius*Math.cos(turns*fullTurn),y:radius*Math.sin(turns*fullTurn)};
});

export function validFibonacciCurveBase(tool:FibonacciCurveTool,first:Anchor,second:Anchor){
  const time=first.time!==second.time,price=first.price!==second.price;
  return tool==="fibCircles"?time&&price:time||price;
}

function fibonacciWedgeSweep(origin:Point,edge:Point,width:Point){
  const base=Math.atan2(edge.y-origin.y,edge.x-origin.x);
  const end=Math.atan2(width.y-origin.y,width.x-origin.x);
  return positiveAngle(end-base+Math.PI)-Math.PI;
}
export function validFibonacciWedge(origin:Point,edge:Point,width:Point){
  return Math.hypot(width.x-origin.x,width.y-origin.y)>1&&
    Math.abs(fibonacciWedgeSweep(origin,edge,width))*Math.hypot(edge.x-origin.x,edge.y-origin.y)>1;
}

export function fibonacciCurveShape(tool:FibonacciCurveTool,points:Point[],style:FibonacciStyle|undefined,w:number,h:number):Shape{
  const [a,b,c]=points;
  if(!b)return {lines:[]};
  const dx=b.x-a.x,dy=b.y-a.y,radius=Math.hypot(dx,dy);
  if(radius<.001)return {lines:[]};

  if(tool==="fibSpiral"){
    const direction=fibonacciStyleValue(style,"counterclockwise")?-1:1;
    const path=spiralVectors.map(({x,y})=>({x:a.x+dx*x-dy*y*direction,y:a.y+dy*x+dx*y*direction}));
    return {lines:[],path};
  }

  const wedge=tool==="fibWedge",circles=tool==="fibCircles";
  const showGuide=fibonacciStyleValue(style,"trendLine");
  if(wedge&&!c)return {lines:showGuide?[[a,b]]:[]};
  const center=circles?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:a;
  const radiusX=circles?Math.abs(dx)/2:radius,radiusY=circles?Math.abs(dy)/2:radius;
  if(radiusX<.001||radiusY<.001)return {lines:showGuide?[[a,b]]:[]};
  const full=circles||!wedge&&fibonacciStyleValue(style,"fullCircles");
  const start=full?0:wedge?Math.atan2(dy,dx):dy<=0?Math.PI:0;
  const sweep=full?fullTurn:wedge?fibonacciWedgeSweep(a,b,c):Math.PI;
  if(Math.abs(sweep)<.0001)return {lines:showGuide?[[a,b]]:[]};
  const ellipseArcs:EllipseArc[]=[],arcBands:[EllipseArc,EllipseArc][]=[],measurements:Measurement[]=[];
  const levels=wedge?fibonacciCurveRatios.slice(0,6):fibonacciCurveRatios;
  const showBackground=fibonacciStyleValue(style,"background");
  const showLabels=fibonacciStyleValue(style,"labels");
  const percent=fibonacciStyleValue(style,"percentLabels");
  const labelAngle=circles?Math.PI/2:full?Math.PI*1.5:start+sweep/2;
  for(const [index,ratio] of levels.entries()){
    const arc={center,radiusX:radiusX*ratio,radiusY:radiusY*ratio,start,end:start+sweep,anticlockwise:sweep<0};
    ellipseArcs.push(arc);
    if(showBackground&&index%2===1)arcBands.push([ellipseArcs[index-1],arc]);
    if(!showLabels)continue;
    const p=ellipseArcPoint(arc,labelAngle);
    if(p.x<0||p.x>w||p.y<0||p.y>h||measurements.some(({point})=>
      Math.abs(point.y-p.y+8)<18&&Math.abs(point.x-p.x)<46))continue;
    const text=percent?`${Number((ratio*100).toFixed(2))}%`:String(ratio);
    measurements.push({point:{x:p.x,y:p.y-8},lines:[text],align:"center"});
  }
  const outer=ellipseArcs[ellipseArcs.length-1];
  const sides:Segment[]=wedge&&showGuide?[[a,b],[a,ellipseArcPoint(outer,outer.end)]]:[];
  return {lines:sides,centerLine:showGuide&&!wedge?[a,b]:undefined,ellipseArcs,arcBands,measurements,
    extent:ellipseArcExtent(outer)};
}

function arrowLines(start:Point,end:Point):Segment[] {
  const angle=Math.atan2(end.y-start.y,end.x-start.x);
  const length=Math.min(10,Math.hypot(end.x-start.x,end.y-start.y));
  const head=(offset:number)=>({x:end.x-length*Math.cos(angle+offset),y:end.y-length*Math.sin(angle+offset)});
  return [[start,end],[head(-.55),end],[end,head(.55)]];
}

function extendedLine(a:Point,b:Point,w:number,h:number):Segment[]{
  return [...raySegment(a,b,w,h),...raySegment(a,{x:2*a.x-b.x,y:2*a.y-b.y},w,h)];
}

function pitchfanShape(points:Point[],w:number,h:number):Shape{
  const [origin,trend,pullback]=points;
  if(!pullback)return {lines:[[origin,trend]]};
  const lines:Segment[]=[];
  const guides:Segment[]=[[trend,pullback]];
  const measurements:Measurement[]=[];
  for(const ratio of retracementLevels){
    const target={x:trend.x+(pullback.x-trend.x)*ratio,y:trend.y+(pullback.y-trend.y)*ratio};
    const ray=raySegment(origin,target,w,h)[0];
    if(!ray)continue;
    lines.push(ray);
    if(target.x>=0&&target.x<=w&&target.y>=0&&target.y<=h&&
      measurements.every(({point})=>Math.hypot(point.x-target.x,point.y+15-target.y)>=23)){
      measurements.push({point:{x:target.x,y:target.y-15},lines:[String(ratio)],align:"center"});
    }
  }
  return {lines,guides,measurements};
}

export function isCycleTool(tool:Tool|"select"|undefined):tool is "cyclicLines"|"timeCycles"|"sineLine"{
  return tool==="cyclicLines"||tool==="timeCycles"||tool==="sineLine";
}

function cycleShape(tool:"cyclicLines"|"timeCycles"|"sineLine",a:Point,b:Point,w:number,h:number):Shape{
  const period=Math.abs(b.x-a.x);
  if(period<1)return {lines:[]};
  if(tool==="sineLine"){
    const middle=(a.y+b.y)/2,amplitude=(a.y-b.y)/2;
    const step=Math.max(1,Math.min(4,period/8));
    const path:Point[]=[];
    for(let x=0;x<=w+step;x+=step)path.push({x,y:middle+amplitude*Math.cos(Math.PI*(x-a.x)/period)});
    return {lines:[],path};
  }
  // Show only the visible cycles. Thin projected lines when their original spacing falls below four pixels.
  const stride=Math.max(1,Math.ceil(4/period))*period;
  const lines:Segment[]=[],ellipseArcs:EllipseArc[]=[],bands:Point[][]=[];
  const startIndex=tool==="cyclicLines"?Math.max(0,Math.ceil(-a.x/stride)):Math.floor(-a.x/stride);
  const radius=stride/2;
  for(let x=a.x+startIndex*stride;x<=w;x+=stride){
    if(tool==="cyclicLines")lines.push([{x,y:0},{x,y:h}]);
    else {
      const center={x:x+radius,y:a.y};
      const arc={center,radiusX:radius,radiusY:radius,start:Math.PI,end:fullTurn,anticlockwise:false};
      ellipseArcs.push(arc);
      const band=Array.from({length:13},(_,index)=>ellipseArcPoint(arc,Math.PI+Math.PI*index/12));
      bands.push(band);
    }
  }
  return {lines,ellipseArcs,bands,handles:tool==="timeCycles"?[a,{x:b.x,y:a.y}]:undefined,
    extent:tool==="timeCycles"?[{x:0,y:a.y-radius},{x:w,y:a.y}]:undefined};
}

function sectorShape(a:Point,b:Point,c:Point|undefined):Shape{
  if(!c)return {lines:[[a,b]]};
  const radius=Math.hypot(b.x-a.x,b.y-a.y),start=Math.atan2(b.y-a.y,b.x-a.x);
  if(radius<.001)return {lines:[]};
  const sweep=fibonacciWedgeSweep(a,b,c);
  if(Math.abs(sweep)<.0001)return {lines:[[a,b]]};
  const arc={center:a,radiusX:radius,radiusY:radius,start,end:start+sweep,anticlockwise:sweep<0};
  const fill=[a,...Array.from({length:25},(_,i)=>ellipseArcPoint(arc,start+sweep*i/24))];
  return {lines:[[a,b],[a,fill[fill.length-1]]],ellipseArcs:[arc],fill,extent:ellipseArcExtent(arc),
    measurements:[{point:ellipseArcPoint(arc,start+sweep/2),lines:[`${Math.round(Math.abs(sweep)*180/Math.PI)}°`],align:"center"}]};
}

function informationLine(tool:"infoLine"|"trendAngle",drawing:Drawing,a:Point,b:Point,w:number,bars:number|null):Shape{
  const [from,to]=drawing.anchors;
  const delta=to.price-from.price;
  const angle=Math.atan2(a.y-b.y,Math.abs(b.x-a.x))*180/Math.PI;
  if(tool==="trendAngle"){
    const width=Math.min(w,Math.max(18,Math.abs(b.x-a.x)));
    return {lines:[[a,b]],guides:[[a,{x:a.x+(Math.sign(b.x-a.x)||1)*width,y:a.y}]],
      measurements:[{point:{x:a.x+(b.x-a.x)*.6,y:a.y-17},lines:[`${angle.toFixed(1)}°`],align:"center"}]};
  }
  const change=from.price>0?` (${percentFormat.format(delta/from.price)})`:"";
  const barLabel=bars===null?"":`${bars} ${bars===1?"bar":"bars"} · `;
  return {lines:[[a,b]],measurements:[{point:{x:(a.x+b.x)/2,y:(a.y+b.y)/2+8},align:"center",
    lines:[changeFormat.format(delta)+change,barLabel+drawingDuration(to.time-from.time)]}]};
}

function shapeFor(drawing:Drawing,points:Point[],w:number,h:number,toY:(price:number)=>number|null,bars:number|null):Shape {
  const [a,b,c,d]=points;
  const {tool}=drawing;
  if(isPatternTool(tool))return patternGeometry(tool,points,drawing.anchors);
  if(isDrawingStamp(tool))return {lines:[],stamp:{point:a,text:drawing.text||drawingStamps[tool][0]}};
  switch(tool){
    case "pin":return {lines:[],pin:a};
    case "table":return {lines:[],table:drawing.text.split("\n").slice(0,8).map(row=>row.split(/[,\t]/).slice(0,5))};
    case "infoLine":
    case "trendAngle":return informationLine(tool,drawing,a,b,w,bars);
    case "extendedLine":return {lines:extendedLine(a,b,w,h)};
    case "crossline":return {lines:[[{x:0,y:a.y},{x:w,y:a.y}],[{x:a.x,y:0},{x:a.x,y:h}]]};
    case "arrowMarker":return {lines:arrowLines(a,b),extent:[a,b],
      measurements:drawing.text?[{point:{x:(a.x+b.x)/2,y:(a.y+b.y)/2-19},lines:[drawing.text],align:"center"}]:undefined};
    case "pitchfan":return pitchfanShape(points,w,h);
    case "sector":return sectorShape(a,b,c);
    case "cyclicLines":
    case "timeCycles":
    case "sineLine":return cycleShape(tool,a,b,w,h);
    case "horizontal":return {lines:[[{x:0,y:a.y},{x:w,y:a.y}]]};
    case "horizontalRay":return {lines:raySegment(a,{x:a.x+1,y:a.y},w,h)};
    case "vertical":return {lines:[[{x:a.x,y:0},{x:a.x,y:h}]]};
    case "ray":return {lines:raySegment(a,b,w,h)};
    case "arrow":return {lines:arrowLines(a,b)};
    case "arrowUp":return {lines:arrowLines({x:a.x,y:a.y+18},a)};
    case "arrowDown":return {lines:arrowLines({x:a.x,y:a.y-18},a)};
    case "arrowLeft":return {lines:arrowLines({x:a.x+18,y:a.y},a)};
    case "arrowRight":return {lines:arrowLines({x:a.x-18,y:a.y},a)};
    case "pitchfork":
    case "schiffPitchfork":
    case "modifiedSchiffPitchfork":
    case "insidePitchfork":return pitchforkShape(tool,a,b,c,w,h);
    case "fibCircles":
    case "fibSpiral":
    case "fibSpeedResistanceArcs":
    case "fibWedge":return fibonacciCurveShape(tool,points,drawing.fibonacci,w,h);
    case "fibChannel":
    case "fibTimeZone":
    case "fibSpeedResistanceFan":
    case "trendBasedFibTime":return fibonacciProjectionShape(tool,points,drawing.fibonacci,w,h);
    case "gannBox":
    case "gannSquareFixed":
    case "gannSquare":
    case "gannFan":return b?gannShape(tool,a,b,drawing.gann,w,h,bars,
      Math.abs(drawing.anchors[1].price-drawing.anchors[0].price)):{lines:[]};
    case "rectangle":return rectangle(a,b);
    case "circle":
    case "ellipse":return ovalFor(tool,a,b,c);
    case "triangle":return c?{lines:[[a,b],[b,c],[c,a]],fill:[a,b,c]}:{lines:[[a,b]]};
    case "rotatedRectangle":return rotatedRectangle(a,b,c);
    case "arc":return arcThrough(a,b,c);
    case "curve":
    case "doubleCurve":return c?{lines:[],bezier:{start:a,end:b,control:c,secondControl:d}}:{lines:[[a,b]]};
    case "path":
    case "polyline":{
      const lines:Segment[]=[];
      for(let i=1;i<points.length-1;i++)lines.push([points[i-1],points[i]]);
      if(points.length>=2){
        const last:Segment=[points[points.length-2],points[points.length-1]];
        if(tool==="path")lines.push(...arrowLines(...last));
        else lines.push(last);
      }
      if(tool==="polyline"&&drawing.closed&&points.length>=3){
        lines.push([points[points.length-1],a]);
        return {lines,fill:points};
      }
      return {lines};
    }
    case "fibRetracement":
    case "fibExtension":return fibShape(tool,drawing,points,toY,w,h);
    case "priceRange":
    case "dateRange":
    case "datePriceRange":return rangeShape(tool,drawing,points,bars);
    case "parallel":
    case "flat":
    case "disjoint":{
      if(!c)return {lines:[[a,b]]};
      const dx=b.x-a.x,dy=b.y-a.y;
      if(dx===0)return {lines:[[a,b]]};
      const offset=c.y-(a.y+(c.x-a.x)*dy/dx);
      const otherStart=tool==="disjoint"?c:{x:a.x,y:tool==="flat"?c.y:a.y+offset};
      const otherEnd=tool==="disjoint"?{x:c.x+dx,y:c.y+dy}:{x:b.x,y:tool==="flat"?c.y:b.y+offset};
      return {lines:[[a,b],[otherStart,otherEnd]],fill:[a,b,otherEnd,otherStart]};
    }
    case "trendline":return {lines:[[a,b]]};
    case "text":return {lines:[],label:a};
    case "note":
    case "anchoredNote":
    case "callout":
    case "priceLabel":
    case "priceNote":
    case "signpost":
    case "comment":
    case "flagMark":
    case "longPosition":
    case "positionForecast":
    case "ghostFeed":
    case "projection":
    case "barsPattern":
    case "anchoredVwap":
    case "fixedRangeProfile":
    case "anchoredVolumeProfile":
    case "regressionTrend":
    case "shortPosition":return {lines:[]};
    case "brush":
    case "highlighter":return {lines:[]};
  }
}

function nearSegment(point:Point,a:Point,b:Point,distance=7):boolean{
  const dx=b.x-a.x,dy=b.y-a.y;
  const len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/len)):0;
  return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy)<=distance;
}

function withinPolygon(point:Point,polygon:Point[]):boolean{
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

const empty:readonly Drawing[]=[];
export const drawingStoragePrefix="traderslink.drawings.v1:";
type DrawingStore={drawings:readonly Drawing[];saved:readonly Drawing[];raw:string|null;dirty:boolean};
const cache=new Map<string,DrawingStore>();
const listeners=new Set<()=>void>();

function decodeDrawings(raw:string|null):readonly Drawing[]{
  try {
    const data:unknown=JSON.parse(raw??"null");
    if(Array.isArray(data))return data.filter(d=>d&&Object.hasOwn(drawingTools,d.tool)&&typeof d.id==="string"&&
      typeof d.color==="string"&&/^#[\da-f]{6}$/i.test(d.color)&&typeof d.text==="string"&&Array.isArray(d.anchors)&&
      (d.tool==="anchoredNote"
        ? d.viewportAnchor && [d.viewportAnchor.x,d.viewportAnchor.y].every(value=>Number.isFinite(value)&&value>=0&&value<=1)
        : d.viewportAnchor===undefined)&&
      (d.fibonacci===undefined||isFibonacciDrawing(d.tool)&&validFibonacciStyle(d.tool,d.fibonacci))&&
      (!isFibonacciProjection(d.tool)||d.anchors[0]&&d.anchors[1]&&validFibonacciBase(d.tool,d.anchors[0],d.anchors[1]))&&
      (!isFibonacciCurve(d.tool)||d.anchors[0]&&d.anchors[1]&&validFibonacciCurveBase(d.tool,d.anchors[0],d.anchors[1]))&&
      (!isDrawingStamp(d.tool)||(drawingStamps[d.tool as keyof typeof drawingStamps] as readonly string[]).includes(d.text))&&
      (!isPatternTool(d.tool)||d.anchors.every((anchor:Anchor,index:number)=>index===0||Boolean(anchor&&d.anchors[index-1]&&
        anchor.time>d.anchors[index-1].time)))&&
      (d.gann===undefined||isGann(d.tool)&&validGannStyle(d.tool,d.gann))&&
      (!isGann(d.tool)||d.anchors.length===2&&d.anchors[0]&&d.anchors[1]&&validGannAnchors(d.anchors[0],d.anchors[1]))&&
      (d.regression===undefined||d.tool==="regressionTrend"&&validRegressionSettings(d.regression))&&
      (d.tool==="fixedRangeProfile"
        ? [60,300,900,1800,3600,14400,86400].includes(d.volumeInterval)&&
          (d.volumeTimeframe===undefined||d.volumeInterval===86400&&isCalendarChartTimeframe(d.volumeTimeframe))
        : d.volumeInterval===undefined&&d.volumeTimeframe===undefined)&&
      (d.tool==="barsPattern"?validPattern(d.pattern):d.pattern===undefined)&&
      (d.tool==="ghostFeed"?validGhostSettings(d.ghost)&&d.anchors[0]?.time!==d.anchors[1]?.time&&
        d.anchors[0]?.price>0&&d.anchors[1]?.price>0:d.ghost===undefined)&&
      (d.tool!=="projection"||d.anchors.length===3&&d.anchors[1]?.time>d.anchors[0]?.time&&
        d.anchors[1]?.price===d.anchors[0]?.price&&d.anchors[2]?.time===d.anchors[1]?.time&&
        d.anchors[0]?.price>0&&d.anchors[2]?.price>0)&&
      (d.tool!=="positionForecast"||d.anchors.length===2&&d.anchors[1]?.time>d.anchors[0]?.time&&
        d.anchors[0]?.price>0&&d.anchors[1]?.price>0)&&
      (!isPosition(d.tool)||(d.anchors.length===3&&d.anchors.every((a:Anchor)=>a&&Number.isFinite(a.time)&&Number.isFinite(a.price))&&
        d.anchors[0].time!==d.anchors[1].time&&d.anchors[1].time===d.anchors[2].time&&
        positionLevels(d.tool,d.anchors[0].price,d.anchors[1].price,d.anchors[2].price)!==null))&&
      (d.closed===undefined||d.tool==="polyline"&&d.closed===true&&d.anchors.length>=3)&&
      (isPolyline(d.tool)||isFreehand(d.tool)
        ? d.anchors.length>=2&&d.anchors.length<=(isPolyline(d.tool)?MAX_PATH_POINTS:MAX_STROKE_POINTS)
        : d.anchors.length===anchorCounts[d.tool as keyof typeof anchorCounts])&&d.anchors.every((a:Anchor)=>a&&Number.isFinite(a.time)&&Number.isFinite(a.price)));
  }catch{/* Treat invalid browser storage as an empty drawing set. */}
  return empty;
}

function getDrawingStore(key:string):DrawingStore{
  const cached=cache.get(key);
  if(cached)return cached;
  let raw:string|null=null;
  try{raw=localStorage.getItem(key);}catch{/* Browser storage may be unavailable. */}
  const drawings=decodeDrawings(raw);
  const entry={drawings,saved:drawings,raw,dirty:false};
  cache.set(key,entry);
  return entry;
}

// Apply only the changed drawing IDs so an edit or undo leaves unrelated work intact.
export function applyDrawingChanges(current:readonly Drawing[],before:readonly Drawing[],after:readonly Drawing[]):readonly Drawing[]{
  const previous=new Map(before.map(drawing=>[drawing.id,drawing]));
  const next=new Map(after.map(drawing=>[drawing.id,drawing]));
  const currentIds=new Set(current.map(drawing=>drawing.id));
  const retained=current.flatMap(drawing=>{
    const old=previous.get(drawing.id);
    const replacement=next.get(drawing.id);
    if(!old||replacement===old)return [drawing];
    return replacement?[replacement]:[];
  });
  // Restore missing drawings before the next surviving drawing in the saved order.
  const insertions=new Map<string|undefined,Drawing[]>();
  let nextId:string|undefined;
  for(let index=after.length-1;index>=0;index--){
    const drawing=after[index];
    if(currentIds.has(drawing.id))nextId=drawing.id;
    else if(!previous.has(drawing.id)){
      const group=insertions.get(nextId)??[];
      group.push(drawing);
      insertions.set(nextId,group);
    }
  }
  if(!insertions.size)return retained;
  const ordered:Drawing[]=[];
  for(const drawing of retained){
    ordered.push(...(insertions.get(drawing.id)?.reverse()??[]),drawing);
  }
  ordered.push(...(insertions.get(undefined)?.reverse()??[]));
  return ordered;
}

function refreshDrawingStore(key:string,entry:DrawingStore):boolean{
  const raw=localStorage.getItem(key);
  if(raw===entry.raw)return false;
  const saved=decodeDrawings(raw);
  entry.drawings=entry.dirty?applyDrawingChanges(saved,entry.saved,entry.drawings):saved;
  entry.saved=saved;
  entry.raw=raw;
  return true;
}

function notifyDrawingChanges(){listeners.forEach(listener=>listener());}

function syncDrawingStorage(event:StorageEvent){
  if(event.key!==null&&!event.key.startsWith(drawingStoragePrefix))return;
  try{
    if(event.storageArea!==localStorage)return;
    const keys=event.key===null?[...cache.keys()]:[event.key];
    let changed=false;
    for(const key of keys){
      const entry=cache.get(key);
      if(entry&&refreshDrawingStore(key,entry))changed=true;
    }
    if(changed)notifyDrawingChanges();
  }catch{/* Drawing edits remain available in memory when browser storage is blocked. */}
}

export function subscribeDrawings(listener:()=>void){
  if(!listeners.size&&typeof window!=="undefined"){
    window.addEventListener("storage",syncDrawingStorage);
    try{for(const [key,entry] of cache)refreshDrawingStore(key,entry);}catch{/* Storage may be blocked. */}
  }
  listeners.add(listener);
  return ()=>{
    listeners.delete(listener);
    if(!listeners.size&&typeof window!=="undefined")window.removeEventListener("storage",syncDrawingStorage);
  };
}
export function readDrawings(key:string){return getDrawingStore(key).drawings;}

export function saveDrawings(key:string,drawings:readonly Drawing[],autosave:boolean){
  const entry=getDrawingStore(key);
  entry.drawings=drawings;
  entry.dirty=true;
  const saved=autosave&&persistDrawings(key);
  notifyDrawingChanges();
  return saved;
}

export function drawingsNeedSaving(key:string){return getDrawingStore(key).dirty;}

export function persistDrawings(key:string){
  const entry=getDrawingStore(key);
  let changed=false;
  try{
    changed=refreshDrawingStore(key,entry);
    const raw=JSON.stringify(entry.drawings);
    localStorage.setItem(key,raw);
    entry.raw=raw;
    entry.saved=entry.drawings;
    entry.dirty=false;
    return true;
  }catch{
    return false;
  }finally{
    if(changed)notifyDrawingChanges();
  }
}
export function serverDrawings(){return empty;}

export class ChartDrawings implements IPanePrimitive<Time>{
  private attachedTo:PaneAttachedParameter<Time>|null=null;
  private drawings:readonly Drawing[]=empty;
  private selection="";
  private openPin="";
  private readonly anchoredVwap=new AnchoredVwapValues();
  private readonly regressionCache=new WeakMap<Drawing,{
    bars:readonly DisplayCandle[];last:DisplayCandle|undefined;fit:ReturnType<typeof regressionTrend>;
  }>();
  private readonly profileCache=new WeakMap<Drawing,{
    bars:readonly Candle[];last:Candle|undefined;profile:ReturnType<typeof fixedRangeVolumeProfile>;
  }>();
  private readonly ghostCache=new WeakMap<Drawing,ReturnType<typeof ghostCandles>>();
  private readonly forecastCache=new WeakMap<Drawing,{
    bars:readonly DisplayCandle[];last:DisplayCandle|undefined;status:string;
  }>();
  private drawn:{id:string;points:Point[];shape?:Shape;strokeWidth?:number;annotation?:AnnotationBox}[]=[];
  private hitContext:CanvasRenderingContext2D|null=null;

  private paintStroke(context:CanvasRenderingContext2D,drawing:Drawing,points:Point[],w:number,h:number){
    const highlight=drawing.tool==="highlighter";
    const width=highlight?14:2.5;
    const margin=width/2;
    if(points.every(p=>p.x< -margin)||points.every(p=>p.x>w+margin)||
      points.every(p=>p.y< -margin)||points.every(p=>p.y>h+margin))return;
    context.save();
    context.strokeStyle=drawing.color;
    context.lineWidth=width+(this.selection===drawing.id?1:0);
    context.lineCap="round";
    context.lineJoin="round";
    context.globalAlpha=highlight ? .28 : 1;
    context.beginPath();
    context.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++)context.lineTo(points[i].x,points[i].y);
    context.stroke();
    context.restore();
    this.drawn.push({id:drawing.id,points,strokeWidth:width});
  }
  private readonly renderer:IPrimitivePaneRenderer={draw:target=>{
    if(!this.drawings.length)return;
    target.useMediaCoordinateSpace(({context,mediaSize})=>{
      this.drawn=[];
      this.hitContext=context;
      for(const drawing of this.drawings){
        if(isAnnotation(drawing.tool)){
          const {width,height}=mediaSize;
          const position=drawing.viewportAnchor;
          const projected=position?[{x:position.x*width,y:position.y*height}]
            :drawing.anchors.map(anchor=>this.project(anchor));
          if(projected.every((point):point is Point=>point!==null)){
            const annotation=paintAnnotation(context,drawing,projected,width,height,this.dark,drawing.id===this.selection);
            if(annotation)this.drawn.push({id:drawing.id,points:projected,annotation});
          }
          continue;
        }
        const freehand=isFreehand(drawing.tool);
        const forecast=drawing.tool==="positionForecast";
        const gann=isGann(drawing.tool);
        const fibonacci=isFibonacciDrawing(drawing.tool);
        const projectedTime=isCycleTool(drawing.tool)||isPatternTool(drawing.tool)||drawing.tool==="pitchfan";
        const projected=drawing.anchors.map(a=>this.project(a,freehand||gann||fibonacci||projectedTime||isPitchfork(drawing.tool),
          forecast||gann||fibonacci||projectedTime||drawing.tool==="barsPattern"||drawing.tool==="ghostFeed"||drawing.tool==="projection"));
        if(projected.some(point=>point===null))continue;
        const points=projected as Point[];
        if(freehand){
          this.paintStroke(context,drawing,points,mediaSize.width,mediaSize.height);
          continue;
        }
        if(isPosition(drawing.tool)){
          const shape=paintPosition(context,drawing,drawing.tool,points,mediaSize.width,mediaSize.height,this.dark,drawing.id===this.selection);
          if(shape)this.drawn.push({id:drawing.id,points,shape});
          continue;
        }
        let bars:number|null=null;
        if(points.length>1&&(drawing.tool==="dateRange"||drawing.tool==="datePriceRange"||drawing.tool==="infoLine"||
          (drawing.tool==="gannSquare"||drawing.tool==="gannSquareFixed")&&gannStyleValue(drawing.gann,"labels"))){
          const scale=this.attachedTo?.chart.timeScale();
          const from=scale?.coordinateToLogical(points[0].x),to=scale?.coordinateToLogical(points[1].x);
          if(from!=null&&to!=null)bars=Math.abs(Math.round(to)-Math.round(from));
        }
        const shape=forecast?this.forecastShape(drawing,points,mediaSize.width,mediaSize.height)
          :drawing.tool==="barsPattern"?this.patternShape(drawing,points[0],mediaSize.width)
          :drawing.tool==="ghostFeed"?this.ghostShape(drawing,points,mediaSize.width)
          :drawing.tool==="projection"&&points.length>=2?projectionShape(drawing,points)
          :drawing.tool==="anchoredVwap"?this.anchoredVwapShape(drawing,mediaSize.width)
          :drawing.tool==="fixedRangeProfile"||drawing.tool==="anchoredVolumeProfile"
            ?this.volumeProfileShape(drawing,points,mediaSize.width,mediaSize.height)
          :drawing.tool==="regressionTrend"?this.regressionShape(drawing,points,mediaSize.height)
          :shapeFor(drawing,points,mediaSize.width,mediaSize.height,this.toY,bars);
        if(!shape)continue;
        const position=shape.position;
        const extent=position?[{x:position.left,y:position.top},{x:position.right,y:position.bottom}]
          :shape.oval?[...points,...ovalExtent(shape.oval)]
          :shape.arc?[...points,...arcExtent(shape.arc)]
          :[...(shape.handles??points),...shape.lines.flat(),...(shape.centerLine??[]),...(shape.guides?.flat()??[]),...(shape.fill??[]),...(shape.bands?.flat()??[]),...(shape.extent??[]),...(shape.path??[])];
        if(!shape.label&&(extent.every(p=>p.x< -8)||extent.every(p=>p.x>mediaSize.width+8)||
          extent.every(p=>p.y< -8)||extent.every(p=>p.y>mediaSize.height+8)))continue;
        const selected=drawing.id===this.selection;
        context.save();
        context.strokeStyle=drawing.color;
        context.fillStyle=drawing.color;
        context.lineWidth=selected?2:1.5;
        if(shape.fill){
          const [start,...rest]=shape.fill;
          context.globalAlpha=.13;
          context.beginPath();
          context.moveTo(start.x,start.y);
          for(const p of rest)context.lineTo(p.x,p.y);
          context.closePath();
          context.fill();
          context.globalAlpha=1;
        }
        if(shape.bands?.length){
          context.globalAlpha=.08;
          context.beginPath();
          for(const [start,...points] of shape.bands){
            context.moveTo(start.x,start.y);
            for(const point of points)context.lineTo(point.x,point.y);
            context.closePath();
          }
          context.fill();
          context.globalAlpha=1;
        }
        if(shape.arcBands?.length){
          context.globalAlpha=.08;
          context.beginPath();
          for(const [inner,outer] of shape.arcBands){
            traceEllipseArc(context,outer);
            if(Math.abs(outer.end-outer.start)>=fullTurn)traceEllipseArc(context,inner);
            else appendEllipseArc(context,{...inner,start:inner.end,end:inner.start,anticlockwise:!inner.anticlockwise});
            context.closePath();
          }
          context.fill("evenodd");
          context.globalAlpha=1;
        }
        if(shape.profileRows){
          for(const row of shape.profileRows){
            context.globalAlpha=row.isPoc ? .7 : row.inValueArea ? .4 : .18;
            context.fillRect(row.x,row.y,row.width,row.height);
          }
          context.globalAlpha=1;
        }
        context.beginPath();
        if(shape.oval){
          const {center,radiusX,radiusY,angle}=shape.oval;
          context.ellipse(center.x,center.y,radiusX,radiusY,angle,0,Math.PI*2);
          context.globalAlpha=.13;
          context.fill();
          context.globalAlpha=1;
        }
        if(shape.arc){
          const {center,radius,start,sweep}=shape.arc;
          context.arc(center.x,center.y,radius,start,start+sweep,sweep<0);
        }
        if(shape.ellipseArcs)for(const arc of shape.ellipseArcs)traceEllipseArc(context,arc);
        if(shape.bezier)traceBezier(context,shape.bezier);
        if(shape.path){
          const [start,...rest]=shape.path;
          context.moveTo(start.x,start.y);
          for(const point of rest)context.lineTo(point.x,point.y);
        }
        for(const [a,b] of shape.lines){
          context.moveTo(a.x,a.y);
          context.lineTo(b.x,b.y);
        }
        context.stroke();
        if(shape.centerLine||shape.guides?.length){
          const guides=shape.centerLine?[shape.centerLine,...shape.guides??[]]:shape.guides??[];
          context.beginPath();
          context.setLineDash([4,3]);
          for(const [start,end] of guides){
            context.moveTo(start.x,start.y);
            context.lineTo(end.x,end.y);
          }
          context.stroke();
          context.setLineDash([]);
        }
        if(shape.ghostBodies){
          context.globalAlpha=.28;
          for(const {x,y,width,height} of shape.ghostBodies){
            context.fillRect(x,y,width,height);
            context.strokeRect(x,y,width,height);
          }
          context.globalAlpha=1;
        }
        if(shape.pin){
          const {x,y}=shape.pin;
          context.beginPath();
          context.arc(x,y-8,5,Math.PI*.78,Math.PI*2.22);
          context.lineTo(x,y);
          context.closePath();
          context.fill();
          if(drawing.text&&(this.openPin===drawing.id||selected)){
            context.font="11px sans-serif";
            const note=fitAnnotationText(context,drawing,Math.max(8,Math.min(160,mediaSize.width-18)));
            paintMeasurements(context,[{point:{x:x+9,y:y-14},lines:note.lines.slice(0,8)}],mediaSize.width,mediaSize.height,this.dark);
          }
        }
        if(shape.stamp){
          context.font="23px sans-serif";
          context.textAlign="center";
          context.textBaseline="middle";
          context.fillText(shape.stamp.text,shape.stamp.point.x,shape.stamp.point.y);
        }
        if(shape.table){
          const columns=Math.max(...shape.table.map(row=>row.length));
          const width=Math.min(mediaSize.width/columns,85),height=18;
          const x=Math.max(0,Math.min(points[0].x,mediaSize.width-width*columns));
          const y=Math.max(0,Math.min(points[0].y,mediaSize.height-height*shape.table.length));
          context.font="11px sans-serif";
          context.textBaseline="middle";
          shape.table.forEach((row,i)=>{
            for(let column=0;column<columns;column++){
              const left=x+column*width,top=y+i*height;
              context.fillStyle=this.dark?"#182437":"#f4f7fc";
              context.fillRect(left,top,width,height);
              context.strokeRect(left,top,width,height);
              context.fillStyle=this.dark?"#f1f5f9":"#16233a";
              context.fillText(row[column]??"",left+4,top+height/2,width-8);
            }
          });
          shape.position={left:x,right:x+width*columns,top:y,bottom:y+height*shape.table.length};
        }
        if(shape.label){
          context.font="13px sans-serif";
          context.fillText(drawing.text,shape.label.x+5,shape.label.y-5);
        }
        if(shape.measurements)paintMeasurements(context,shape.measurements,mediaSize.width,mediaSize.height,this.dark);
        if(selected){
          context.fillStyle=drawing.color;
          for(const p of shape.handles??points){
            context.beginPath();context.arc(p.x,p.y,4,0,Math.PI*2);context.fill();
          }
        }
        context.restore();
        this.drawn.push({id:drawing.id,points:shape.handles??points,shape});
      }
    });
  }};
  private readonly views:IPanePrimitivePaneView[]=[{zOrder:()=>"top",renderer:()=>this.renderer}];
  constructor(private readonly toPrice:(y:number)=>number|null,private readonly toY:(price:number)=>number|null,
    private readonly dark:boolean,private readonly getCandles:()=>readonly DisplayCandle[],readonly interval:number,private readonly getVolumeCandles:()=>readonly Candle[],
    readonly calendarFrame:CalendarChartTimeframe|null=null,
    private readonly ensureVolumeCoverage?:(start:number,end:number)=>boolean){}

  capturePattern(first:number,last:number){
    return copyPattern(this.getCandles(),first,last);
  }

  private forecastShape(drawing:Drawing,points:Point[],width:number,height:number):Shape|null{
    const [start,end]=points;
    if(!end)return null;
    const [source,target]=drawing.anchors;
    if(target.time<=source.time||source.price<=0||target.price<=0)return null;
    const bars=this.getCandles(),last=bars.at(-1);
    let result=this.forecastCache.get(drawing);
    if(!result||result.bars!==bars||result.last!==last){
      result={bars,last,status:forecastOutcome(bars,source.time,target.time,source.price,target.price)};
      this.forecastCache.set(drawing,result);
    }
    const measurements:Measurement[]=[];
    for(const [point,label] of [[start,`Entry ${priceFormat.format(source.price)}`],
      [end,`Target ${priceFormat.format(target.price)}`]] as const){
      if(point.x>=0&&point.x<=width&&point.y>=0&&point.y<=height){
        measurements.push({point:{x:point.x,y:point.y-21},lines:[label],align:"center"});
      }
    }
    const midpoint={x:(start.x+end.x)/2,y:(start.y+end.y)/2};
    if(midpoint.x>=0&&midpoint.x<=width&&midpoint.y>=0&&midpoint.y<=height){
      const change=percentFormat.format((target.price-source.price)/source.price);
      measurements.push({point:{x:midpoint.x,y:midpoint.y+9},align:"center",
        lines:[`${change} · ${drawingDuration(target.time-source.time)}`,result.status]});
    }
    return {lines:arrowLines(start,end),measurements};
  }

  private anchoredVwapShape(drawing:Drawing,width:number):Shape|null{
    const axis=this.getCandles(),scale=this.attachedTo?.chart.timeScale();
    const view=scale?.getVisibleLogicalRange();
    const start=drawing.anchors[0].time;
    if(!axis.length||!scale||!view||start<axis[0].time||this.ensureVolumeCoverage?.(start,Infinity)===false)return null;
    let first=candleIndexAtOrAfter(axis,start);
    const barEnd=(time:number)=>this.calendarFrame?nextChartCalendarPeriod(time,this.calendarFrame):time+this.interval;
    if(first>0&&barEnd(axis[first-1].time)>start)first--;
    if(first>=axis.length)return null;
    const bars=this.getVolumeCandles();
    const fromIndex=candleIndexAtOrAfter(bars,start);
    const firstVisible=Math.max(first,Math.floor(view.from)-1);
    const lastVisible=Math.min(axis.length-1,Math.ceil(view.to)+1);
    if(firstVisible>lastVisible)return null;
    this.anchoredVwap.update(bars);
    const pointAt=(index:number):Point|null=>{
      const time=axis[index].time;
      const through=Math.min(barEnd(time),axis[index+1]?.time??Infinity);
      const value=this.anchoredVwap.value(fromIndex,candleIndexAtOrAfter(bars,through));
      const x=scale.timeToCoordinate(time as UTCTimestamp),y=value===null?null:this.toY(value);
      return x!==null&&y!==null?{x,y}:null;
    };
    const stride=Math.max(1,Math.floor((lastVisible-firstVisible)/Math.max(1,width*2)));
    const lines:Segment[]=[];
    let previous:Point|null=null,lastPoint:Point|null=null;
    for(let i=firstVisible;i<=lastVisible;i=Math.min(i+stride,lastVisible)){
      const point=pointAt(i);
      if(point&&previous)lines.push([previous,point]);
      if(point){previous=point;lastPoint=point;}
      if(i===lastVisible)break;
    }
    if(!lastPoint)return null;
    if(!lines.length)lines.push([{x:lastPoint.x-4,y:lastPoint.y},{x:lastPoint.x+4,y:lastPoint.y}]);
    const handle=pointAt(first);
    const value=this.anchoredVwap.value(fromIndex,bars.length);
    const measurements=lastVisible===axis.length-1&&value!==null
      ? [{point:{x:Math.max(0,lastPoint.x-106),y:lastPoint.y-21},lines:[`AVWAP ${priceFormat.format(value)}`]}]
      : [];
    return {lines,measurements,handles:handle?[handle]:[]};
  }

  private regressionShape(drawing:Drawing,points:Point[],height:number):Shape|null{
    if(points.length!==2)return null;
    const bars=this.getCandles(),settings=drawing.regression??defaultRegression;
    const start=Math.min(drawing.anchors[0].time,drawing.anchors[1].time);
    const end=Math.max(drawing.anchors[0].time,drawing.anchors[1].time);
    if(!bars.length||start<bars[0].time||start===end)return null;
    const last=bars[candleIndexAtOrAfter(bars,end+1)-1];
    let cached=this.regressionCache.get(drawing);
    if(!cached||cached.bars!==bars||cached.last!==last){
      cached={bars,last,fit:regressionTrend(bars,start,end,settings.source)};
      this.regressionCache.set(drawing,cached);
    }
    const fit=cached.fit;
    if(!fit)return null;
    const [left,right]=points[0].x<=points[1].x?points:[points[1],points[0]];
    const segment=(offset:number):Segment|null=>{
      const y1=this.toY(fit.start+offset),y2=this.toY(fit.end+offset);
      return y1!==null&&y2!==null&&Number.isFinite(y1)&&Number.isFinite(y2)
        ?[{x:left.x,y:y1},{x:right.x,y:y2}]:null;
    };
    const base=segment(0);
    if(!base)return null;
    const upper=fit.deviation>0&&settings.upper>0?segment(fit.deviation*settings.upper):null;
    const lower=fit.deviation>0&&settings.lower>0?segment(-fit.deviation*settings.lower):null;
    const lines=[...(upper?[upper]:[]),...(lower?[lower]:[])];
    const top=upper??base,bottom=lower??base;
    const fill=upper||lower?[top[0],top[1],bottom[1],bottom[0]]:undefined;
    const labelY=Math.max(0,Math.min(height-21,top[0].y-21));
    const measurements=fit.correlation===null?[]:[{point:{x:Math.max(0,left.x+3),y:labelY},
      lines:[`R ${fit.correlation.toFixed(3)}`]}];
    return {lines,centerLine:base,fill,measurements,handles:points[0].x<=points[1].x?base:[base[1],base[0]]};
  }

  private volumeProfileShape(drawing:Drawing,points:Point[],w:number,h:number):Shape|null{
    const anchored=drawing.tool==="anchoredVolumeProfile";
    if(!anchored&&(points.length!==2||!drawing.volumeInterval))return null;
    const halfBar=(this.attachedTo?.chart.timeScale().options().barSpacing??0)/2;
    const left=(anchored?points[0].x:Math.min(points[0].x,points[1].x))-halfBar;
    const right=anchored?w-2:Math.max(points[0].x,points[1].x)+halfBar;
    const axis=this.getCandles();
    const start=anchored?drawing.anchors[0].time:Math.min(drawing.anchors[0].time,drawing.anchors[1].time);
    const lastAnchor=anchored?start:Math.max(drawing.anchors[0].time,drawing.anchors[1].time);
    const end=anchored?Infinity:drawing.volumeTimeframe
      ?nextChartCalendarPeriod(lastAnchor,drawing.volumeTimeframe):lastAnchor+drawing.volumeInterval!;
    if(!axis.length||start<axis[0].time||!anchored&&(right<0||left>w)||this.ensureVolumeCoverage?.(start,end)===false)return null;
    const bars=this.getVolumeCandles();
    const last=anchored?bars.at(-1):bars[candleIndexAtOrAfter(bars,end)-1];
    let cached=this.profileCache.get(drawing);
    if(!cached||cached.bars!==bars||cached.last!==last){
      cached={bars,last,profile:fixedRangeVolumeProfile(bars,start,end)};
      this.profileCache.set(drawing,cached);
    }
    const profile=cached.profile;
    if(!profile)return null;
    const {rows,pointOfControl,valueLow,valueHigh}=profile;
    const max=rows[pointOfControl].volume;
    const maxWidth=Math.max(3,Math.min((anchored?w:right-left)*.36,130));
    const profileRows:ProfileRow[]=[];
    for(const [i,row] of rows.entries()){
      const top=this.toY(row.high),bottom=this.toY(row.low);
      if(top===null||bottom===null||bottom<0||top>h||row.volume<=0)continue;
      const width=maxWidth*(row.volume/max);
      profileRows.push({x:anchored?right-width:left,y:top,width,
        height:Math.max(2,bottom-top-1),inValueArea:i>=valueLow&&i<=valueHigh,isPoc:i===pointOfControl});
    }
    const top=this.toY(rows.at(-1)!.high),bottom=this.toY(rows[0].low);
    if(top===null||bottom===null||top>h||bottom<0)return null;
    const center=(rows[pointOfControl].high+rows[pointOfControl].low)/2;
    const levels=[["VAH",rows[valueHigh].high],["POC",center],["VAL",rows[valueLow].low]] as const;
    const lines:Segment[]=[],measurements:Measurement[]=[];
    const x=Math.max(0,Math.min(w-78,anchored?right-maxWidth-78:right-74));
    // Draw the value-area boundaries, and always give the POC label priority on compact charts.
    const labels=[levels[1],levels[0],levels[2]];
    for(const [name,price] of labels){
      const y=this.toY(price);
      if(y===null||y<0||y>h)continue;
      const lineStart=anchored?Math.max(left,0):left;
      if(lineStart<right&&!lines.some(([a])=>Math.abs(a.y-y)<.1))lines.push([{x:lineStart,y},{x:right,y}]);
      if(measurements.every(label=>Math.abs(label.point.y-y+18)>=18)){
        measurements.push({point:{x,y:y-18},lines:[`${name} ${priceFormat.format(price)}`]});
      }
    }
    const middle=(top+bottom)/2;
    const handles=points.map(point=>({x:point.x,y:Math.max(3,Math.min(h-3,middle))}));
    return {lines,measurements,handles,profileRows,
      position:{left:anchored?right-maxWidth:left,right,top:top-3,bottom:bottom+3}};
  }

  getGhostSettings(start:Anchor,end:Anchor):GhostSettings{
    const scale=this.attachedTo?.chart.timeScale();
    const x1=this.drawingX(start.time,true),x2=this.drawingX(end.time,true);
    const spacing=scale?.options().barSpacing;
    const slots=x1!==null&&x2!==null&&spacing?Math.abs(x2-x1)/spacing:1;
    return ghostSettings(this.getCandles(),start.time,start.price,slots);
  }

  private ghostShape(drawing:Drawing,points:Point[],width:number):Shape|null{
    const [start,end]=points;
    if(!end||!drawing.ghost||start.x===end.x)return null;
    let candles=this.ghostCache.get(drawing);
    if(!candles){
      candles=ghostCandles(drawing.anchors[0].price,drawing.anchors[1].price,drawing.ghost);
      this.ghostCache.set(drawing,candles);
    }
    const lines:Segment[]=[],ghostBodies:GhostBody[]=[];
    const step=(end.x-start.x)/candles.length;
    const bodyWidth=Math.max(1,Math.min(16,Math.abs(step)*.62));
    candles.forEach((candle,index)=>{
      const x=start.x+step*(index+1);
      if(x< -bodyWidth||x>width+bodyWidth)return;
      const high=this.toY(candle.high),low=this.toY(candle.low),open=this.toY(candle.open),close=this.toY(candle.close);
      if(high===null||low===null||open===null||close===null||![high,low,open,close].every(Number.isFinite))return;
      lines.push([{x,y:high},{x,y:low}]);
      ghostBodies.push({x:x-bodyWidth/2,y:Math.min(open,close),width:bodyWidth,height:Math.max(1,Math.abs(open-close))});
    });
    return lines.length?{lines,ghostBodies}:null;
  }

  private patternShape(drawing:Drawing,origin:Point,width:number):Shape|null{
    if(!drawing.pattern)return null;
    const base=drawing.anchors[0],scale=this.attachedTo?.chart.timeScale();
    const tick=Math.max(1,Math.min(5,(scale?.options().barSpacing??4)/3));
    const lines:Segment[]=[];
    for(const bar of drawing.pattern){
      const x=bar.offset===0?origin.x:this.drawingX(base.time+bar.offset,true);
      if(x===null||x< -6||x>width+6)continue;
      const high=this.toY(base.price+bar.high),low=this.toY(base.price+bar.low);
      const open=this.toY(base.price+bar.open),close=this.toY(base.price+bar.close);
      if(high===null||low===null||open===null||close===null||
        ![high,low,open,close].every(Number.isFinite))continue;
      lines.push([{x,y:high},{x,y:low}],[{x:x-tick,y:open},{x,y:open}],
        [{x,y:close},{x:x+tick,y:close}]);
    }
    return lines.length?{lines}:null;
  }
  attached(parameter:PaneAttachedParameter<Time>){this.attachedTo=parameter;}
  detached(){this.attachedTo=null;this.hitContext=null;}
  paneViews(){return this.views;}
  update(drawings:readonly Drawing[],selection:string){
    this.drawings=drawings;this.selection=selection;
    if(!drawings.length)this.drawn=[];
    this.attachedTo?.requestUpdate();
  }
  size(){
    return {w:this.attachedTo?.chart.timeScale().width()??0,h:this.attachedTo?.chart.panes()[0].getHeight()??0};
  }
  togglePin(point:Point){
    const target=this.drawn.findLast(entry=>entry.shape?.pin&&
      Math.hypot(entry.shape.pin.x-point.x,entry.shape.pin.y-5-point.y)<=11)?.id??"";
    const next=this.openPin===target?"":target;
    if(this.openPin===next)return;
    this.openPin=next;
    this.attachedTo?.requestUpdate();
  }
  zoomTo(first:Anchor,last:Anchor){
    const scale=this.attachedTo?.chart.timeScale();
    const x1=this.drawingX(first.time,true),x2=this.drawingX(last.time,true);
    if(!scale||x1===null||x2===null)return;
    const from=scale.coordinateToLogical(Math.min(x1,x2));
    const to=scale.coordinateToLogical(Math.max(x1,x2));
    if(from!==null&&to!==null&&to>from)scale.setVisibleLogicalRange({from,to});
  }
  hasVolumeAnchor(time:number):boolean{
    const candles=this.getCandles();
    return candles.length>0&&time>=candles[0].time&&time<=(candles.at(-1)?.time??0);
  }
  snapDrawingPoint(point:Point,mode:"off"|"weak"|"strong"):Point{
    if(mode==="off")return point;
    const time=this.attachedTo?.chart.timeScale().coordinateToTime(point.x);
    if(typeof time!=="number")return point;
    const candles=this.getCandles();
    const candle=candles[candleIndexAtOrAfter(candles,time)];
    if(!candle||candle.time!==time||candle.carried)return point;
    let distance=mode==="strong"?Infinity:12;
    let result=point;
    for(const price of [candle.open,candle.high,candle.low,candle.close]){
      const y=this.toY(price);
      if(y===null||Math.abs(y-point.y)>=distance)continue;
      distance=Math.abs(y-point.y);
      result={x:point.x,y};
    }
    return result;
  }
  anchor(point:Point,freehand=false,future=false):Anchor|null{
    const scale=this.attachedTo?.chart.timeScale();
    const price=this.toPrice(point.y);
    let time=scale?.coordinateToTime(point.x);
    if(freehand&&scale){
      const logical=scale.coordinateToLogical(point.x);
      if(logical!==null){
        const center=scale.logicalToCoordinate(logical);
        const index=Number(logical)-(center!==null&&point.x<center?1:0);
        const left=scale.logicalToCoordinate(index as Logical);
        const right=scale.logicalToCoordinate((index+1) as Logical);
        const from=left===null?null:scale.coordinateToTime(left);
        const to=right===null?null:scale.coordinateToTime(right);
        if(typeof from==="number"&&typeof to==="number"&&left!==null&&right!==null&&left!==right){
          time=(from+(to-from)*((point.x-left)/(right-left))) as UTCTimestamp;
        }
      }
    }
    if(future&&typeof time!=="number"&&scale){
      const last=this.getCandles().at(-1),logical=scale.coordinateToLogical(point.x);
      const lastIndex=last?scale.timeToIndex(last.time as UTCTimestamp):null;
      if(last&&lastIndex!==null&&logical!==null&&logical>Number(lastIndex)){
        let index=Number(logical);
        if(freehand){
          const center=scale.logicalToCoordinate(logical),next=scale.logicalToCoordinate((index+1) as Logical);
          if(center!==null&&next!==null&&next!==center)index+=(point.x-center)/(next-center);
        }
        const offset=index-Number(lastIndex);
        time=(this.calendarFrame
          ?chartCalendarTime(last.time,offset,this.calendarFrame):last.time+offset*this.interval) as UTCTimestamp;
      }
    }
    return typeof time==="number"&&price!==null&&Number.isFinite(price)?{time,price}:null;
  }
  private drawingX(time:number,future:boolean):number|null{
    const scale=this.attachedTo?.chart.timeScale();
    if(!scale)return null;
    if(future){
      const last=this.getCandles().at(-1);
      const lastIndex=last?scale.timeToIndex(last.time as UTCTimestamp):null;
      if(last&&lastIndex!==null&&time>last.time){
        const offset=this.calendarFrame
          ?chartCalendarPosition(last.time,time,this.calendarFrame):(time-last.time)/this.interval;
        return scale.logicalToCoordinate((Number(lastIndex)+offset) as Logical);
      }
    }
    const index=scale.timeToIndex(time as UTCTimestamp,true);
    return index===null?null:scale.logicalToCoordinate(Number(index) as Logical);
  }
  project(a:Anchor,freehand=false,future=false):Point|null{
    const scale=this.attachedTo?.chart.timeScale();
    const index=freehand?scale?.timeToIndex(a.time as UTCTimestamp,true):null;
    let x=this.drawingX(a.time,future);
    if(freehand&&scale&&index!=null&&x!==null){
      const time=scale.coordinateToTime(x);
      if(typeof time==="number"&&time!==a.time){
        const direction=a.time>time?1:-1;
        const otherX=scale.logicalToCoordinate((Number(index)+direction) as Logical);
        const otherTime=otherX===null?null:scale.coordinateToTime(otherX);
        if(otherX!==null&&typeof otherTime==="number"&&otherTime!==time){
          const fraction=(a.time-time)/(otherTime-time);
          if(fraction>=0&&fraction<=1)x+=(otherX-x)*fraction;
        }
      }
    }
    const y=this.toY(a.price);
    return x!==null&&y!==null&&Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null;
  }
  private nearBezier(point:Point,bezier:Bezier):boolean {
    const context=this.hitContext;
    if(!context)return false;
    context.save();
    context.resetTransform();
    context.lineWidth=14;
    context.beginPath();
    traceBezier(context,bezier);
    const near=context.isPointInStroke(point.x,point.y);
    context.beginPath();
    context.restore();
    return near;
  }
  hit(point:Point, selected:string){
    for(let i=this.drawn.length-1;i>=0;i--){
      const {id,points,shape,strokeWidth,annotation}=this.drawn[i];
      if(annotation){
        const index=points.findIndex((p,index)=>(index===0||id===selected)&&Math.hypot(p.x-point.x,p.y-point.y)<=9);
        if(index>=0)return {id,index};
        if(point.x>=annotation.x&&point.x<=annotation.x+annotation.width&&
          point.y>=annotation.y&&point.y<=annotation.y+annotation.height)return {id,index:points.length===2?1:undefined};
        if(annotation.leader&&nearSegment(point,...annotation.leader))return {id,index:undefined};
        continue;
      }
      if(!shape){
        if(points.some((p,index)=>index>0&&nearSegment(point,points[index-1],p,(strokeWidth??0)/2+6)))
          return {id,index:undefined};
        continue;
      }
      if(id===selected){
        const index=points.findIndex(p=>Math.hypot(p.x-point.x,p.y-point.y)<=9);
        if(index>=0)return {id,index};
      }
      const position=shape.position;
      if(position&&point.x>=position.left-6&&point.x<=position.right+6&&
        point.y>=position.top-6&&point.y<=position.bottom+6)return {id,index:undefined};
      const label=shape.label;
      if(shape.lines.some(([a,b])=>nearSegment(point,a,b))||
        (shape.centerLine&&nearSegment(point,...shape.centerLine))||
        shape.guides?.some(([a,b])=>nearSegment(point,a,b))||
        (shape.pin&&Math.hypot(point.x-shape.pin.x,point.y-shape.pin.y+5)<=11)||
        (shape.stamp&&Math.hypot(point.x-shape.stamp.point.x,point.y-shape.stamp.point.y)<=17)||
        shape.ghostBodies?.some(body=>point.x>=body.x&&point.x<=body.x+body.width&&
          point.y>=body.y&&point.y<=body.y+body.height)||
        (shape.oval&&withinOval(point,shape.oval))||
        (shape.arc&&nearArc(point,shape.arc))||
        shape.ellipseArcs?.some(arc=>nearEllipseArc(point,arc))||
        shape.path?.some((p,index)=>index>0&&nearSegment(point,shape.path![index-1],p))||
        (shape.bezier&&this.nearBezier(point,shape.bezier))||
        (shape.fill&&withinPolygon(point,shape.fill))||
        (label&&Math.hypot(point.x-label.x,point.y-label.y)<=22))return {id,index:undefined};
    }
    return null;
  }
}
