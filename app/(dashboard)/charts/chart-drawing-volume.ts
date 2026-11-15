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

export function fixedRangeVolumeProfile(bars:readonly Candle[],start:number,end:number){
  const first=candleIndexAtOrAfter(bars,start),last=candleIndexAtOrAfter(bars,end);
  let low=Infinity,high=-Infinity;
  for(let i=first;i<last;i++){
    if(bars[i].volume<=0)continue;
    low=Math.min(low,bars[i].low);
    high=Math.max(high,bars[i].high);
  }
  if(!Number.isFinite(low)||!Number.isFinite(high))return null;

  const count=high===low?1:24,step=(high-low)/count;
  const volume=Array<number>(count).fill(0),interior=Array<number>(count+1).fill(0);
  const row=(price:number)=>step===0?0:Math.max(0,Math.min(count-1,Math.floor((price-low)/step)));
  let total=0;
  for(let i=first;i<last;i++){
    const bar=bars[i];
    if(bar.volume<=0)continue;
    total+=bar.volume;
    const bottom=row(bar.low),top=row(bar.high);
    if(bottom===top){volume[bottom]+=bar.volume;continue;}
    // Candle volume is apportioned by overlap with each row. Add full interior rows using a difference array.
    const rate=bar.volume/(bar.high-bar.low);
    volume[bottom]+=rate*(low+(bottom+1)*step-bar.low);
    volume[top]+=rate*(bar.high-(low+top*step));
    interior[bottom+1]+=rate*step;
    interior[top]-=rate*step;
  }

  let running=0,pointOfControl=0;
  for(let i=0;i<count;i++){
    running+=interior[i];
    volume[i]=Math.max(0,volume[i]+running);
    if(volume[i]>volume[pointOfControl])pointOfControl=i;
  }
  let valueLow=pointOfControl,valueHigh=pointOfControl,covered=volume[pointOfControl];
  while(covered<total*.7&&(valueLow>0||valueHigh<count-1)){
    const down=valueLow>0?volume[valueLow-1]:-1;
    const up=valueHigh<count-1?volume[valueHigh+1]:-1;
    covered+=up>=down?volume[++valueHigh]:volume[--valueLow];
  }
  return {rows:volume.map((value,i)=>({low:low+i*step,high:low+(i+1)*step,volume:value})),
    pointOfControl,valueLow,valueHigh,total};
}
