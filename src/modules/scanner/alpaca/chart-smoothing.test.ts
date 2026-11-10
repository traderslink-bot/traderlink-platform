// @vitest-environment node
import {expect,it} from 'vitest';
import {CHART_TIMEFRAMES,type Candle} from './candles';
import {MA_TYPES,type MaType,type ChartIndicator} from './chart-preferences';
import {indicatorValues} from './chart-indicators';
function reference(x:number[],v:number[],length:number,type:MaType):(number|null)[]{
 return x.map((_,n)=>{
  if(type==='EMA'||type==='RMA'){
   const start=type==='EMA'?0:length-1;
   if(n<start)return null;
   const alpha=type==='EMA'?2/(length+1):1/length;
   const seed=type==='EMA'?x[0]:x.slice(0,length).reduce((a,b)=>a+b,0)/length;
   let result=seed*(1-alpha)**(n-start);
   for(let j=start+1;j<=n;j++)result+=alpha*x[j]*(1-alpha)**(n-j);
   return result;
  }
  if(n<length-1)return null;
  let sum=0,weight=0;
  for(let k=0;k<length;k++){const j=n-length+1+k,w=type==='WMA'?k+1:type==='VWMA'?v[j]:1;sum+=x[j]*w;weight+=w;}
  return weight?sum/weight:null;
 });
}
for(const frame of CHART_TIMEFRAMES)for(const type of ['EMA','SMA','RSI'] as const)for(const smoothing of [...MA_TYPES,'SMA+BB','None'] as const){
 it(`${type} optional ${smoothing} smoothing on ${frame}`,()=>{
  const step={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1D':86400}[frame];
  const bars:Candle[]=Array.from({length:60},(_,n)=>{const close=10+(n*17)%31;return {time:1700000000+n*step,open:close,high:close+1,low:close-1,close,volume:n%7?100+n:0};});
  const study:ChartIndicator={id:'smoothing',type,period:7,color:'#2962ff',width:2};
  const original=indicatorValues(bars,study,frame);
  const actual=indicatorValues(bars,{...study,smoothing:{type:smoothing,length:5,deviation:1.5}},frame);
  expect(actual.slice(0,original.length)).toEqual(original);
  if(smoothing==='None'){expect(actual).toEqual(original);return;}
  const primary=original[0].points,values=primary.map(point=>point.value),volumes=primary.map(point=>bars.find(bar=>bar.time===point.time)!.volume);
  const expected=reference(values,volumes,5,smoothing==='SMA+BB'?'SMA':smoothing);
  const expectedPoints=expected.flatMap((value,n)=>value===null?[]:[{time:primary[n].time,value}]);
  const line=actual.find(part=>part.key==='smoothing')!;
  expect(line.points).toHaveLength(expectedPoints.length);
  expectedPoints.forEach((point,n)=>{expect(line.points[n].time).toBe(point.time);expect(line.points[n].value).toBeCloseTo(point.value,9);});
  if(smoothing==='SMA+BB')for(const [key,sign]of [['smoothing-upper',1],['smoothing-lower',-1]] as const){
   const points=actual.find(part=>part.key===key)!.points;
   expectedPoints.forEach((point,n)=>{
    const window=values.slice(n,n+5),sd=Math.sqrt(window.reduce((sum,value)=>sum+(value-point.value)**2,0)/5);
    expect(points[n].time).toBe(point.time);expect(points[n].value).toBeCloseTo(point.value+sign*1.5*sd,9);
   });
  }
 });
}
