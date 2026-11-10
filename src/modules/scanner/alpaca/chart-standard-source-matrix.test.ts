// @vitest-environment node
import {expect,it} from 'vitest';
import {CHART_TIMEFRAMES,type Candle} from './candles';
import {PRICE_SOURCES,type PriceSource,type ChartIndicator} from './chart-preferences';
import {indicatorValues} from './chart-indicators';
const referenceSource=(b:Candle,s:PriceSource)=>{
 switch(s){case 'open':return b.open;case 'high':return b.high;case 'low':return b.low;case 'close':return b.close;case 'hl2':return (b.high+b.low)/2;case 'hlc3':return (b.high+b.low+b.close)/3;case 'ohlc4':return (b.open+b.high+b.low+b.close)/4;case 'hlcc4':return (b.high+b.low+2*b.close)/4;}
};
// Finite weighted expansion rather than the production recursive EMA loop.
const ema=(x:readonly number[],p:number)=>x.map((_,n)=>{
 const a=2/(p+1);let sum=x[0]*(1-a)**n;
 for(let j=1;j<=n;j++)sum+=a*x[j]*(1-a)**(n-j);
 return sum;
});
const sma=(x:readonly number[],p:number)=>x.flatMap((_,n)=>n<p-1?[]:[x.slice(n-p+1,n+1).reduce((a,b)=>a+b,0)/p]);
const rsi=(x:readonly number[],p:number)=>{
 const changes=x.slice(1).map((value,n)=>value-x[n]),g=changes.map(v=>Math.max(v,0)),l=changes.map(v=>Math.max(-v,0));
 const seed=(v:number[])=>v.slice(0,p).reduce((a,b)=>a+b,0)/p;
 return changes.flatMap((_,n)=>{
  if(n<p-1)return [];
  const k=n-p+1,a=1/p;let gain=seed(g)*(1-a)**k,loss=seed(l)*(1-a)**k;
  for(let j=p;j<=n;j++){gain+=a*g[j]*(1-a)**(n-j);loss+=a*l[j]*(1-a)**(n-j);}
  return [loss===0?100:100-100/(1+gain/loss)];
 });
};
for(const frame of CHART_TIMEFRAMES)for(const source of PRICE_SOURCES)it(`standard studies honour ${source} on ${frame}`,()=>{
 const step={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1D':86400}[frame];
 const bars:Candle[]=Array.from({length:45},(_,n)=>{const low=10+(n*17)%23;return {time:1700000000+n*step,low,high:low+9,open:low+n%7,close:low+(n*3)%8,volume:100+n};});
 const x=bars.map(bar=>referenceSource(bar,source));
 const study=(type:ChartIndicator['type'],extra:Partial<ChartIndicator>={}):ChartIndicator=>({id:'matrix',type,period:7,source,color:'#2962ff',width:2,...extra});
 const compare=(actual:readonly {value:number}[],expected:number[])=>{expect(actual).toHaveLength(expected.length);expected.forEach((value,n)=>expect(actual[n].value).toBeCloseTo(value,10));};
 compare(indicatorValues(bars,study('EMA'),frame)[0].points,ema(x,7));
 compare(indicatorValues(bars,study('SMA'),frame)[0].points,sma(x,7));
 compare(indicatorValues(bars,study('RSI'),frame)[0].points,rsi(x,7));
 const fast=ema(x,3),slow=ema(x,7),line=fast.map((value,n)=>value-slow[n]),signal=ema(line,4);
 const macd=indicatorValues(bars,study('MACD',{fastLength:3,slowLength:7,signalLength:4}),frame);
 compare(macd[0].points,line);compare(macd[1].points,signal);compare(macd[2].points,line.map((value,n)=>value-signal[n]));
 const middle=sma(x,7),spread=middle.map((mean,n)=>1.5*Math.sqrt(x.slice(n,n+7).reduce((sum,value)=>sum+(value-mean)**2,0)/7));
 const bb=indicatorValues(bars,study('Bollinger',{deviation:1.5}),frame);
 compare(bb[0].points,middle);compare(bb[1].points,middle.map((v,n)=>v+spread[n]));compare(bb[2].points,middle.map((v,n)=>v-spread[n]));
});
