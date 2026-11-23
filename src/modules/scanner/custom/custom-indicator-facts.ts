import { movingAverage } from "../alpaca/chart-indicators";
import type { ScannerSignalBar } from "../alpaca/scanner-signal-bars";
import type { CustomIndicator, IndicatorMatch } from "./custom-indicator";

function indicators() {
  let result:IndicatorMatch|undefined;
  return {
    next(value:number, comparison:number, at:number) {
      const before = result?.comparison;
      result ??= {value,comparison,readyToCross:false};
      result.value=value;
      result.closedAt=at;
      result.comparison=comparison;
      if(before===undefined)return;
      result.readyToCross=true;
      if(before<=0 && comparison>0)result.crossUp=at;
      if(before>=0 && comparison<0)result.crossDown=at;
    },
    result:()=>result,
  };
}

export function readCustomAverage(
  bars:Float64Array, stride:number, candleMs:number, config:Exclude<CustomIndicator,{kind:"vwap"}>,
):IndicatorMatch|undefined {
  const tracker=indicators();
  if (config.kind === "priceEma" || config.kind === "priceSma") {
    const closes = Array.from({ length: bars.length / stride }, (_, index) => bars[index * stride + 4]);
    const average = movingAverage(closes, config.period, config.kind === "priceEma" ? "EMA" : "SMA");
    for (let index = config.period - 1; index < closes.length; index++) {
      const basis = average[index];
      if (basis !== null && basis > 0) {
        const close = closes[index];
        tracker.next((close / basis - 1) * 100, close - basis, bars[index * stride] * 1000 + candleMs);
      }
    }
  } else if(config.kind==="sma"){
    const closes = Array.from({ length: bars.length / stride }, (_, index) => bars[index * stride + 4]);
    const fast = movingAverage(closes, config.fast, "SMA");
    const slow = movingAverage(closes, config.slow, "SMA");
    for (let index = config.slow - 1; index < closes.length; index++) {
      const fastValue = fast[index], slowValue = slow[index];
      if (fastValue !== null && slowValue !== null && slowValue > 0) {
        tracker.next((fastValue / slowValue - 1) * 100, fastValue - slowValue, bars[index * stride] * 1000 + candleMs);
      }
    }
  }else if(config.kind==="ema"){
    let fast=bars[4],slow=fast;
    const fastWeight=2/(config.fast+1),slowWeight=2/(config.slow+1);
    for(let i=stride,count=2;i<bars.length;i+=stride,count++){
      const close=bars[i+4];
      fast+=(close-fast)*fastWeight;
      slow+=(close-slow)*slowWeight;
      if(count>=config.slow&&slow>0)tracker.next((fast/slow-1)*100,fast-slow,bars[i]*1000+candleMs);
    }
  }else if (config.kind === "rsi"){
    let gain=0,loss=0;
    for(let i=stride,count=1;i<bars.length;i+=stride,count++){
      const change=bars[i+4]-bars[i-stride+4];
      const up=Math.max(change,0),down=Math.max(-change,0);
      if(count<=config.period){
        gain+=up;loss+=down;
        if(count<config.period)continue;
        gain/=config.period;loss/=config.period;
      }else{
        gain+=(up-gain)/config.period;loss+=(down-loss)/config.period;
      }
      const value=loss>0?100-100/(1+gain/loss):gain>0?100:50;
      tracker.next(value,value-config.level,bars[i]*1000+candleMs);
    }
  }
  return tracker.result();
}

/** Use the provider's volume-weighted bars from this trading day's first print. */
export function readCustomVwap(bars:readonly ScannerSignalBar[], candleMs:number, preOpen:number, through:number) {
  const tracker=indicators();
  let total=0,volume=0;
  for(const bar of bars){
    const start=bar.time*1000;
    if(start<preOpen || start+candleMs>through || bar.volume===0)continue;
    if(bar.vwap===undefined)return undefined;
    total+=bar.vwap*bar.volume;
    volume+=bar.volume;
    const value=total/volume;
    tracker.next(value,bar.close-value,start+candleMs);
  }
  return tracker.result();
}
