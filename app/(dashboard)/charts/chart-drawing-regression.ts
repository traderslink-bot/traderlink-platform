import type { DisplayCandle } from "@/src/modules/scanner/alpaca/candles";
import { indicatorSource } from "@/src/modules/scanner/alpaca/chart-indicators";
import { candleIndexAtOrAfter } from "./chart-drawing-volume";

export const regressionSources = {
  close:"Close",open:"Open",high:"High",low:"Low",hl2:"HL2",hlc3:"HLC3",ohlc4:"OHLC4",hlcc4:"HLCC4",
} as const;
export type RegressionSettings = {source:keyof typeof regressionSources;upper:number;lower:number};
export const defaultRegression: RegressionSettings={source:"close",upper:2,lower:2};

export function validDeviation(value:number){
  return Number.isFinite(value)&&value>=0;
}

export function validRegressionSettings(value:unknown):value is RegressionSettings{
  if(!value||typeof value!=="object")return false;
  const {source,upper,lower}=value as RegressionSettings;
  return typeof source==="string"&&Object.hasOwn(regressionSources,source)&&
    validDeviation(upper)&&validDeviation(lower);
}

export function regressionTrend(bars:readonly DisplayCandle[],start:number,end:number,source:RegressionSettings["source"]){
  const first=candleIndexAtOrAfter(bars,start);
  const last=candleIndexAtOrAfter(bars,end+1);
  let n=0,meanX=0,meanY=0,xx=0,yy=0,xy=0;
  for(let i=first;i<last;i++){
    if(bars[i].carried)continue;
    const x=i-first,y=indicatorSource(bars[i],source);
    n++;
    const dx=x-meanX,dy=y-meanY;
    meanX+=dx/n;
    meanY+=dy/n;
    xx+=dx*(x-meanX);
    yy+=dy*(y-meanY);
    xy+=dx*(y-meanY);
  }
  if(n<2||xx<=0)return null;

  const slope=xy/xx;
  let squaredResiduals=0;
  for(let i=first;i<last;i++){
    if(bars[i].carried)continue;
    const fitted=meanY+slope*(i-first-meanX);
    squaredResiduals+=(indicatorSource(bars[i],source)-fitted)**2;
  }
  const valueAt=(index:number)=>meanY+slope*(index-meanX);
  return {start:valueAt(0),end:valueAt(last-first-1),deviation:Math.sqrt(squaredResiduals/n),
    correlation:yy>0?Math.max(-1,Math.min(1,xy/Math.sqrt(xx*yy))):null};
}
