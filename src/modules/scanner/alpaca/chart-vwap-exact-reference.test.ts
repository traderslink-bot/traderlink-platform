// @vitest-environment node
import {expect,it} from 'vitest';
import {CHART_TIMEFRAMES,type Candle} from './candles';
import {defaultVwapBands,PRICE_SOURCES,type ChartIndicator,type PriceSource} from './chart-preferences';
import {indicatorValues} from './chart-indicators';

// Independent rational oracle: all eight OHLC sources are exact multiples of
// 1/12 for integer input prices. Keep sums and squared sums in BigInt so this
// reference neither shares the production source helper nor its moment method.
function numerator(bar:Candle,source:PriceSource):bigint{
 const o=BigInt(bar.open),h=BigInt(bar.high),l=BigInt(bar.low),c=BigInt(bar.close);
 switch(source){
  case 'open':return BigInt(12)*o;
  case 'high':return BigInt(12)*h;
  case 'low':return BigInt(12)*l;
  case 'close':return BigInt(12)*c;
  case 'hl2':return BigInt(6)*(h+l);
  case 'hlc3':return BigInt(4)*(h+l+c);
  case 'ohlc4':return BigInt(3)*(o+h+l+c);
  case 'hlcc4':return BigInt(3)*(h+l+BigInt(2)*c);
 }
}
for(const frame of CHART_TIMEFRAMES)for(const source of PRICE_SOURCES){
 it(`matches exact weighted rational reference for ${source} on ${frame}`,()=>{
  const step={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1D':86400}[frame];
  const start=Date.parse('2026-11-09T15:00:00Z')/1000;
  const bars:Candle[]=Array.from({length:16},(_,n)=>{
   const low=80+(n*37)%59,high=low+4+(n*13)%31;
   return {time:start+n*step,low,high,open:low+(n*7)%(high-low+1),close:low+(n*11)%(high-low+1),volume:n%5===0?0:1+(n*7919)%100003};
  });
  const study:ChartIndicator={id:'exact',type:'VWAP',period:20,color:'#2962ff',width:1,anchor:'Month',source,vwapBands:defaultVwapBands()};
  for(const level of study.vwapBands!.levels)level.enabled=true;
  for(const mode of ['Standard deviation','Percentage'] as const){
   study.vwapBands!.mode=mode;
   const plots=indicatorValues(bars,study,frame);
   let weight=BigInt(0),sum=BigInt(0),square=BigInt(0),outputIndex=0;
   for(const bar of bars){
    const value=numerator(bar,source),w=BigInt(bar.volume);
    weight+=w;sum+=w*value;square+=w*value*value;
    if(!weight)continue;
    const mean=Number(sum)/Number(BigInt(12)*weight);
    const variance=Number(square*weight-sum*sum)/Number(BigInt(144)*weight*weight);
    const unit=mode==='Percentage'?mean/100:Math.sqrt(variance);
    expect(plots[0].points[outputIndex].time).toBe(bar.time);
    expect(plots[0].points[outputIndex].value).toBeCloseTo(mean,10);
    for(let band=1;band<=3;band++){
     expect(plots[2*band-1].points[outputIndex].value).toBeCloseTo(mean+band*unit,9);
     expect(plots[2*band].points[outputIndex].value).toBeCloseTo(mean-band*unit,9);
    }
    outputIndex++;
   }
   expect(plots.every(plot=>plot.points.length===outputIndex)).toBe(true);
  }
 });
}
