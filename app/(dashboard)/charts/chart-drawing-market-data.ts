import type {DisplayCandle} from "@/src/modules/scanner/alpaca/candles";

export type PatternBar = Pick<DisplayCandle,"open"|"high"|"low"|"close"> & {offset:number};
export const maxPatternBars=512;

function firstBarAtOrAfter(bars:readonly DisplayCandle[],time:number):number{
  let left=0,right=bars.length;
  while(left<right){
    const mid=Math.floor((left+right)/2);
    if(bars[mid].time<time)left=mid+1;
    else right=mid;
  }
  return left;
}

export function copyPattern(bars:readonly DisplayCandle[],first:number,last:number){
  const start=Math.min(first,last),end=Math.max(first,last);
  const selected:DisplayCandle[]=[];
  for(let index=firstBarAtOrAfter(bars,start);index<bars.length&&bars[index].time<=end;index++){
    if(bars[index].carried)continue;
    selected.push(bars[index]);
    if(selected.length>maxPatternBars)return {error:`Select up to ${maxPatternBars} traded bars.`} as const;
  }
  if(selected.length<2)return {error:"Select a range with at least two traded bars."} as const;
  const {time,open:price}=selected[0];
  return {origin:{time,price},bars:selected.map(bar=>({
    offset:bar.time-time,open:bar.open-price,high:bar.high-price,low:bar.low-price,close:bar.close-price,
  }))} as const;
}

export function validPattern(value:unknown):value is PatternBar[]{
  return Array.isArray(value)&&value.length>=2&&value.length<=maxPatternBars&&value.every((bar,index)=>
    bar&&[bar.offset,bar.open,bar.high,bar.low,bar.close].every(Number.isFinite)&&
    (index===0?bar.offset===0&&bar.open===0:bar.offset>value[index-1].offset)&&
    bar.low<=Math.min(bar.open,bar.close)&&bar.high>=Math.max(bar.open,bar.close));
}

export function forecastOutcome(bars:readonly DisplayCandle[],start:number,deadline:number,entry:number,target:number){
  const latest=bars.findLast(bar=>!bar.carried);
  if(!latest||latest.time<=start)return "Pending";
  const direction=target>=entry?"up":"down";
  for(let i=firstBarAtOrAfter(bars,start+1);i<bars.length&&bars[i].time<deadline;i++){
    const bar=bars[i];
    if(!bar.carried&&(direction==="up"?bar.high>=target:bar.low<=target))return "Target reached";
  }
  if(latest.time<deadline)return "Pending";
  return bars[0].time<=start?"Target missed":"History unavailable";
}

export type GhostSettings = {count:number;range:number};
const maxGhostCandles=256;

export function ghostSettings(bars:readonly DisplayCandle[],startTime:number,startPrice:number,slots:number):GhostSettings{
  let sum=0,samples=0;
  for(let i=firstBarAtOrAfter(bars,startTime)-1;i>=0&&samples<20;i--){
    const bar=bars[i];
    if(bar.carried)continue;
    sum+=bar.high-bar.low;
    samples++;
  }
  return {count:Math.min(maxGhostCandles,Math.max(1,Math.round(slots))),
    range:(samples&&sum>0?sum/samples:Math.max(startPrice*.005,.0001))};
}

export function validGhostSettings(value:unknown):value is GhostSettings{
  if(!value||typeof value!=="object")return false;
  const {count,range}=value as GhostSettings;
  return Number.isInteger(count)&&count>=1&&count<=maxGhostCandles&&Number.isFinite(range)&&range>0;
}

export function ghostCandles(start:number,end:number,{count,range}:GhostSettings){
  let open=start;
  const floor=Math.min(start,end)*.01;
  return Array.from({length:count},(_,i)=>{
    const progress=(i+1)/count;
    const variation=Math.sin((i+1)*2.4)*Math.sin(progress*Math.PI)*range*.25;
    const close=progress===1?end:Math.max(floor,start+(end-start)*progress+variation);
    const wick=range*.5;
    const candle={open,close,high:Math.max(open,close)+wick,low:Math.max(floor,Math.min(open,close)-wick)};
    open=close;
    return candle;
  });
}
