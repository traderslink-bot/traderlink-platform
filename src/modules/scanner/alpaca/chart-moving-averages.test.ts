// @vitest-environment node
import {expect,it} from 'vitest';
import {CHART_TIMEFRAMES,type Candle} from './candles';
import {DEFAULT_CHART_PREFERENCES,parseChartPreferences,type ChartIndicator} from './chart-preferences';
import {indicatorValues,movingAverage} from './chart-indicators';
const study=(period:number):ChartIndicator=>({id:`ema-${period}`,type:'EMA',period,color:'#2962ff',width:2});
it('distinguishes first-source EMA initialization from SMA-seeded Wilder smoothing',()=>{
 expect(movingAverage([10,20,40,80],3,'EMA')).toEqual([10,15,27.5,53.75]);
 expect(movingAverage([10,20,40,80],3,'RMA')).toEqual([null,null,70/3,380/9]);
 expect(movingAverage([10,20,40,80],1,'EMA')).toEqual([10,20,40,80]);
});
for(const frame of CHART_TIMEFRAMES)it(`supports independent custom EMA periods on ${frame}`,()=>{
 const step={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1D':86400}[frame];
 const bars:Candle[]=Array.from({length:260},(_,n)=>({time:1700000000+n*step,open:10,high:20,low:5,close:n?20:10,volume:100}));
 const studies=[1,9,20,50,200,233].map(study);
 const saved=parseChartPreferences({...DEFAULT_CHART_PREFERENCES,timeframe:frame,indicators:studies});
 expect(saved.indicators).toEqual(studies);
 for(const indicator of saved.indicators){
  const points=indicatorValues(bars,indicator,frame)[0].points;
  expect(points).toHaveLength(260);
  // Closed-form response to a step, independent of the recursive implementation.
  const alpha=2/(indicator.period+1);
  for(const n of [0,1,8,49,199,259])expect(points[n].value).toBeCloseTo(20-10*(1-alpha)**n,11);
 }
 const revised=bars.map(bar=>({...bar}));revised[259].close=30;
 const original=indicatorValues(bars,study(9),frame)[0].points;
 const changed=indicatorValues(revised,study(9),frame)[0].points;
 expect(changed.slice(0,-1)).toEqual(original.slice(0,-1));
 expect(changed.at(-1)!.value-original.at(-1)!.value).toBeCloseTo(2,12);
 expect(indicatorValues(bars,study(9),frame)[0].points).toEqual(original);
});

for(const frame of CHART_TIMEFRAMES)it(`keeps independently selected SMA windows on ${frame}`,()=>{
 const bars:Candle[]=[1,2,4,8,16].map((close,n)=>({time:1700000000+n*86400,open:close,high:close,low:close,close,volume:100}));
 const sma=(period:number)=>indicatorValues(bars,{...study(period),type:'SMA'},frame)[0].points.map(point=>point.value);
 expect(sma(1)).toEqual([1,2,4,8,16]);expect(sma(2)).toEqual([1.5,3,6,12]);expect(sma(3)).toEqual([7/3,14/3,28/3]);expect(sma(200)).toEqual([]);
});

it('matches independent weighted windows across lengths and zero-volume windows',()=>{
 const values=Array.from({length:90},(_,n)=>5+(n*31)%97/10);
 const volumes=values.map((_,n)=>n<12?0:(n*17)%113);
 for(const period of [1,2,9,20,50,90,200])for(const type of ['WMA','VWMA'] as const){
  const actual=movingAverage(values,period,type,volumes);
  for(let index=0;index<values.length;index++){
   if(index<period-1){expect(actual[index]).toBeNull();continue;}
   let numerator=0,denominator=0;
   for(let position=0;position<period;position++){
    const n=index-period+1+position,weight=type==='WMA'?position+1:volumes[n];
    numerator+=values[n]*weight;denominator+=weight;
   }
   if(!denominator)expect(actual[index]).toBeNull();else expect(actual[index]).toBeCloseTo(numerator/denominator,9);
  }
 }
});
it('handles the supported long history and maximum MA period without nested window scans',()=>{
 const values=Array<number>(150000).fill(5),volumes=Array<number>(150000).fill(100);
 for(const type of ['WMA','VWMA'] as const){
  const output=movingAverage(values,10000,type,volumes);
  expect(output).toHaveLength(150000);expect(output[9998]).toBeNull();expect(output[9999]).toBe(5);expect(output.at(-1)).toBe(5);
 }
});
