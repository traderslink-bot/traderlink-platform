import { advanceIndicator,createIndicatorCheckpoint,type IndicatorCandle,type IndicatorResult } from "../../market-data/indicators/indicator-engine";
import { indicatorMarketDate,indicatorSessionWindow,indicatorTradingDay,type IndicatorCalendar } from "../../market-data/indicators/indicator-sessions";
import calendar from "../../coach/server/market-calendar/us-equities-review-calendar.v1.json";
import { movingAverage } from "../alpaca/chart-indicators";
import { rollingDeviation } from "../alpaca/rolling-deviation";
import type { Candle } from "../alpaca/candles";
import type { ScanIndicatorFacts,ScanSignalFrame,ScanSignalKind } from "./signal-filters";

export function scanCandleCalendar(frame:ScanSignalFrame) {
  const matches=new Map<number,string|null>();
  const width=parseInt(frame,10)*60_000;
  return (start:number) => {
    const cached=matches.get(start);
    if(cached!==undefined)return cached;
    const day=indicatorTradingDay(calendar as IndicatorCalendar,indicatorMarketDate(start));
    const segment=day&&indicatorSessionWindow(day,start);
    const key=segment&&(start-segment.start)%width===0&&start+width<=segment.end?segment.key:null;
    if(matches.size>=12_000)matches.delete(matches.keys().next().value!);
    matches.set(start,key);
    return key;
  };
}

export function scanIndicatorFacts(bars:readonly Candle[],frame:ScanSignalFrame,through:number,
  calendarKey=scanCandleCalendar(frame)):ScanIndicatorFacts|undefined {
  const width=parseInt(frame,10)*60_000;
  const candles:Candle[]=[];
  let checkpoint=createIndicatorCheckpoint(frame,"scanner");
  let latest:IndicatorResult|undefined;
  const events:ScanIndicatorFacts["events"]={};
  const priceToEma:(number|null)[]=[];
  for(const bar of bars){
    const start=bar.time*1000, end=start+width, sessionKey=calendarKey(start);
    if(!sessionKey||end>through)continue;
    const candle:IndicatorCandle={...bar,start,end,sessionKey};
    const advanced=advanceIndicator(checkpoint,candle,through);
    checkpoint=advanced.checkpoint;
    latest=advanced.result;
    for(const event of Object.values(latest.signals??{}))if(event?.at===end)events[event.kind]=event.at;
    priceToEma.push(latest.ema20===null?null:bar.close-latest.ema20);
    candles.push(bar);
  }
  if(!latest)return;
  const close=candles.map(bar=>bar.close);
  const fast=movingAverage(close,12,"EMA"),slow=movingAverage(close,26,"EMA");
  const macd=close.map((_,index)=>fast[index]!-slow[index]!);
  const macdSignal=movingAverage(macd,9,"EMA");
  const sma50=movingAverage(close,50,"SMA"), middle=movingAverage(close,20,"SMA"), deviation=rollingDeviation(close,20);
  const stochastic=close.map((value,index)=>{
    if(index<13)return null;
    let low=Infinity,high=-Infinity;
    for(let i=index-13;i<=index;i++){low=Math.min(low,candles[i].low);high=Math.max(high,candles[i].high);}
    return high>low?(value-low)/(high-low)*100:null;
  });
  let histogram:number|null=null,percentB:number|null=null;
  let lastK:number|null=null;
  const compare = (a:number|null,b:number|null,at:number,up:ScanSignalKind,down:ScanSignalKind) => {
    if(a===null||b===null)return;
    if(a<=0&&b>0)events[up]=at;
    if(a>=0&&b<0)events[down]=at;
  };
  let histogramBefore:number|null=null,macdBefore:number|null=null,bandBefore:number|null=null,stochasticBefore:number|null=null;
  let stochasticDeltaBefore:number|null=null,priceSmaBefore:number|null=null;
  for(let i=0;i<close.length;i++){
    const at=candles[i].time*1000+width;
    histogram=i>=33?macd[i]-macdSignal[i]!:null;
    const main=i>=25?macd[i]:null;
    const variance=deviation[i];
    percentB=variance!==null&&variance>0?(close[i]-(middle[i]!-2*variance))/(4*variance)*100:null;
    const k=stochastic[i],a=stochastic[i-1],b=stochastic[i-2];
    lastK=k;
    const stochasticDelta=k!=null&&a!=null&&b!=null?k-(k+a+b)/3:null;
    const priceSma=sma50[i]===null?null:close[i]-sma50[i]!;
    compare(histogramBefore,histogram,at,"macdCrossUp","macdCrossDown");
    compare(macdBefore,main,at,"macdZeroUp","macdZeroDown");
    compare(bandBefore===null?null:bandBefore-100,percentB===null?null:percentB-100,at,"upperBandBreak","upperBandReentry");
    compare(bandBefore,percentB,at,"lowerBandReentry","lowerBandBreak");
    compare(stochasticDeltaBefore,stochasticDelta,at,"stochasticCrossUp","stochasticCrossDown");
    if(stochasticBefore!==null&&k!==null){
      if(stochasticBefore<=20&&k>20)events.stochasticOversoldExit=at;
      if(stochasticBefore>=80&&k<80)events.stochasticOverboughtExit=at;
    }
    compare(priceToEma[i-1]??null,priceToEma[i],at,"priceEma20Up","priceEma20Down");
    compare(priceSmaBefore,priceSma,at,"priceSma50Up","priceSma50Down");
    histogramBefore=histogram;macdBefore=main;bandBefore=percentB;stochasticBefore=k;
    stochasticDeltaBefore=stochasticDelta;priceSmaBefore=priceSma;
  }
  const lastDeviation = deviation.at(-1), lastMiddle = middle.at(-1);
  return {dataThrough:latest.dataThrough,rsi14:latest.rsi14,atrPercent:latest.atrPercent,
    rsiChange:latest.rsiChange,ema9SlopeAtr:latest.ema9SlopeAtr,ema20SlopeAtr:latest.ema20SlopeAtr,
    atrRatio:latest.atrRatio,bollingerBandwidth:lastDeviation != null && lastMiddle != null && lastMiddle > 0
      ? 4 * lastDeviation / lastMiddle * 100 : null,
    emaSpread:latest.ema9!==null&&latest.ema20!==null&&latest.ema20>0?(latest.ema9/latest.ema20-1)*100:null,
    indicatorVolumeRatio:latest.volumeRatio,macdHistogramPercent:histogram===null?null:histogram/latest.close*100,
    bollingerPercentB:percentB,stochasticK:lastK,sma50Ready:priceSmaBefore!==null,events};
}
