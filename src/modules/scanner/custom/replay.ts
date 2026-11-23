import { scanSignalKinds } from "./signal-filters";
import type { ScanMarketRow } from "./definition";
import { CustomScanMarket } from "./market";

const sample = ["AXSP", "VFLX", "KRML", "PLSX", "NVRX", "VEXT", "MRLT", "TKBR", "XGHT", "CLKR", "MSTRX", "ONVX"];
const second = 1_000;
export function scannerFixtureRow(index: number, occurredAt: number, marketOpenedAt: number): ScanMarketRow {
  const elapsed = (occurredAt - marketOpenedAt) / second;
  const move = Math.sin(elapsed / (28 + index % 11) + index) * (0.02 + index % 5 / 100)
    + Math.tanh(elapsed / 3600) * (index % 3 === 0 ? -0.22 : 0.22);
  const basePrice = 0.6 + (index % 41) * 0.32;
  const price = Math.round((basePrice * (1 + move)) * 10_000) / 10_000;
  const rate = 13 + (index % 124) * 19;
  const volume = Math.floor(elapsed * rate);
  const float = index % 13 === 0 ? null : (index % 48 + 1) * 500_000;
  const high = basePrice * 1.12, low = basePrice * 0.89;
  return {
    symbol: index < sample.length ? sample[index] : "ZX" + String(index).padStart(4, "0"),
    exchange: index % 5 === 0 ? "NYSE" : "NASDAQ", country: index % 5 === 0 ? "CA" : "US", price, volume,
    dollarVolume: Math.floor(volume * basePrice), float,
    marketCap: (index % 95 + 1) * 2_500_000, dayChange: (price - basePrice) / basePrice * 100,
    belowHigh: Math.max(0, (basePrice * 1.12 - price) / (basePrice * 1.12) * 100),
    facts:{
      dayHigh:high,dayLow:low,aboveLow:(price/low-1)*100,dayRange:(high/low-1)*100,
      sessionVwap:basePrice,fromVwap:(price/basePrice-1)*100,
      floatTurnover:float===null?null:volume/float*100,
      premarketVolume:Math.floor(rate*420),premarketHigh:basePrice*1.06,premarketLow:low,
      regularVolume:volume,regularHigh:high,regularLow:basePrice*0.93,
    },
    observedAt: occurredAt,
  };
}

let replayNow=0;
let replayEpoch=0;
const demoSymbols=new Map<string,number>();
export const customScanReplay = new CustomScanMarket({
  attach:()=>()=>{},
  observe(symbols,now){
    replayNow=now;
    let index=0;
    demoSymbols.clear();
    for(const symbol of symbols)demoSymbols.set(symbol,index++);
  },
  pressRelease(symbol){
    const index=demoSymbols.get(symbol);
    return index!==undefined&&index%5===0
      ? {id:"scan-replay-"+symbol,title:"Sample press release for "+symbol,at:replayEpoch-index*90_000,url:"https://traderslink.pro/news"}
      : null;
  },
  customIndicator(symbol,frame,_observedAt,config){
    const index=demoSymbols.get(symbol);
    if(index===undefined)return;
    const duration=parseInt(frame,10)*60_000;
    const time=Math.floor(replayNow/duration)*duration;
    const drift=Math.sin(replayNow/160_000+index);
    const value=config.kind==="rsi"?50+drift*30:(config.kind==="ema"||config.kind==="sma")?drift*4:0.6+(index%41)*0.32;
    const comparison=config.kind==="rsi"?value-config.level:drift;
    return {value,comparison,readyToCross:true,crossUp:time-(index%6)*duration,
      crossDown:time-((index+2)%8)*duration};
  },
  indicator(symbol,frame){
    const index=demoSymbols.get(symbol);
    if(index===undefined)return;
    const wave=Math.sin(replayNow/160_000+index)*18;
    const duration=parseInt(frame,10)*60_000;
    const time=Math.floor(replayNow/duration)*duration;
    const selected=scanSignalKinds.filter((_,offset)=>(index+offset)%7===0);
    return {dataThrough:time,rsi14:50+wave,emaSpread:wave/10,atrPercent:2+index%9,
      indicatorVolumeRatio:0.55+index%10/5,macdHistogramPercent:wave/40,
      bollingerPercentB:50+wave*3,stochasticK:50+wave*2,sma50Ready:true,
      events:Object.fromEntries(selected.map((kind,offset)=>[kind,time-(offset%3)*duration]))};
  },
});
let users = 0;
let timer: ReturnType<typeof setInterval> | undefined;
export function openCustomScanReplay() {
  if (users++ === 0) {
    const epoch = Date.now();
    replayEpoch=epoch;
    const open = epoch - 35 * 60 * second;
    const frame = (time: number) => Array.from({ length:72 }, (_, index) => scannerFixtureRow(index, time, open));
    for (let time = open; time < epoch; time += 5 * second) customScanReplay.set("open", time, String(epoch), frame(time));
    customScanReplay.set("open", epoch, String(epoch), frame(epoch));
    // Advance the synthetic market clock between updates.
    let replayAt = epoch;
    timer = setInterval(() => {
      replayAt += 5 * second;
      customScanReplay.set("open", replayAt, String(epoch), frame(replayAt));
    }, second);
    timer.unref?.();
  }
  return () => {
    if (--users === 0) {
      clearInterval(timer);
      timer = undefined;
      customScanReplay.set("waiting", 0);
    }
  };
}
