import Decimal from "decimal.js";
import type { Candle } from "@/src/modules/scanner/alpaca/candles";
import { indicatorSource } from "@/src/modules/scanner/alpaca/chart-indicators";

export function candleIndexAtOrAfter(bars:readonly {time:number}[],time:number):number{
  let low=0,high=bars.length;
  while(low<high){
    const mid=Math.floor((low+high)/2);
    if(bars[mid].time<time)low=mid+1;
    else high=mid;
  }
  return low;
}

// The chart replaces the source array on corrections and may append or replace its last bar on a stream update.
export class AnchoredVwapValues {
  private bars:readonly Candle[]=[];
  private last:Candle|undefined;
  private weighted=[0];
  private volume=[0];

  update(bars:readonly Candle[]){
    if(bars===this.bars&&bars.length===this.volume.length-1&&bars.at(-1)===this.last)return;
    const start=bars===this.bars?Math.max(0,this.volume.length-2):0;
    this.weighted.length=start+1;
    this.volume.length=start+1;
    for(let i=start;i<bars.length;i++){
      this.weighted.push(this.weighted[i]+indicatorSource(bars[i],"hlc3")*bars[i].volume);
      this.volume.push(this.volume[i]+bars[i].volume);
    }
    this.bars=bars;
    this.last=bars.at(-1);
  }

  value(fromIndex:number,toIndex:number){
    const volume=this.volume[toIndex]-this.volume[fromIndex];
    return volume>0?(this.weighted[toIndex]-this.weighted[fromIndex])/volume:null;
  }
}

const ProfilePrice = Decimal.clone({ precision: 48 });
type RowPosition = { row: number; below: number; above: number };

export function fixedRangeVolumeProfile(
  bars:readonly Candle[],start:number,end:number,rowCount=24,valueAreaPercent=70,
){
  const first=candleIndexAtOrAfter(bars,start),last=candleIndexAtOrAfter(bars,end);
  let low=Infinity,high=-Infinity;
  for(let i=first;i<last;i++){
    if(bars[i].volume<=0)continue;
    low=Math.min(low,bars[i].low);
    high=Math.max(high,bars[i].high);
  }
  if(!Number.isFinite(low)||!Number.isFinite(high))return null;

  const count=high===low?1:Number.isFinite(rowCount)?Math.max(8,Math.min(96,Math.round(rowCount))):24;
  const base=new ProfilePrice(low),span=new ProfilePrice(high).minus(base);
  const edges=Array.from({length:count+1},(_,i)=>base.plus(span.times(i).div(count)).toNumber());
  // Ordinary quotes fit exactly on a 1e-8 price grid. Only faster when the
  // original values round-trip and every scaled position is a safe integer.
  const scale=100_000_000,lowUnits=Math.round(low*scale),highUnits=Math.round(high*scale);
  const rangeUnits=highUnits-lowUnits;
  const integerGrid=rangeUnits>0&&lowUnits/scale===low&&highUnits/scale===high&&Number.isSafeInteger(highUnits*count);
  const maximum={row:count-1,below:1,above:0};
  const positions=new Map<number,RowPosition>();
  function position(price:number):RowPosition{
    if(price===high)return maximum;
    if(integerGrid){
      const units=Math.round(price*scale);
      if(units/scale===price){
        const distance=(units-lowUnits)*count,remainder=distance%rangeUnits;
        return {row:(distance-remainder)/rangeUnits,below:remainder/rangeUnits,above:(rangeUnits-remainder)/rangeUnits};
      }
    }
    const cached=positions.get(price);
    if(cached)return cached;
    // Work in row-width units from the quoted decimals. Internal boundaries
    // belong to the upper row; the maximum is included in the final row.
    const distance=new ProfilePrice(price).minus(base).times(count);
    const row=distance.divToInt(span).toNumber();
    const remainder=distance.minus(span.times(row));
    const result={
      row,below:remainder.div(span).toNumber(),above:span.minus(remainder).div(span).toNumber(),
    };
    positions.set(price,result);
    return result;
  }
  const volume=Array<number>(count).fill(0),interior=Array<number>(count+1).fill(0);
  let total=0;
  for(let i=first;i<last;i++){
    const bar=bars[i];
    if(bar.volume<=0)continue;
    total+=bar.volume;
    const bottom=position(bar.low),top=position(bar.high);
    if(bottom.row===top.row){volume[bottom.row]+=bar.volume;continue;}
    // Keep both endpoint overlaps even for a narrow range across a row edge.
    const fullRows=top.row-bottom.row-1;
    const perRow=bar.volume/(bottom.above+fullRows+top.below);
    volume[bottom.row]+=perRow*bottom.above;
    volume[top.row]+=perRow*top.below;
    if(fullRows>0){
      interior[bottom.row+1]+=perRow;
      interior[top.row]-=perRow;
    }
  }

  let running=0,pointOfControl=0;
  for(let i=0;i<count;i++){
    running+=interior[i];
    volume[i]=Math.max(0,volume[i]+running);
    if(volume[i]>volume[pointOfControl])pointOfControl=i;
  }
  let valueLow=pointOfControl,valueHigh=pointOfControl,covered=volume[pointOfControl];
  const target=total*(Number.isFinite(valueAreaPercent)?Math.min(100,Math.max(1,valueAreaPercent))/100:.7);
  while(covered<target&&(valueLow>0||valueHigh<count-1)){
    const down=valueLow>0?volume[valueLow-1]:-1;
    const up=valueHigh<count-1?volume[valueHigh+1]:-1;
    covered+=up>=down?volume[++valueHigh]:volume[--valueLow];
  }
  return {rows:volume.map((value,i)=>({low:edges[i],high:edges[i+1],volume:value})),
    pointOfControl,valueLow,valueHigh,total};
}
