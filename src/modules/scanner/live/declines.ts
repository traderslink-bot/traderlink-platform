import type { DeclineControls, DeclineResults, DeclineRow, DailyUniverse, NormalizedSnapshot, ScannerSession } from "./contracts";
import type { FloatFact } from "./engine";
import { SNAPSHOT_MAX_AGE_MS } from "./snapshots";

export const RAPID_DROP_RETENTION_MINUTES = 5;
export const RAPID_DROP_RECOVERY_PERCENT = 75;

export const DEFAULT_DECLINE_CONTROLS: DeclineControls = Object.freeze({
  enabled:true, displayLimit:20, minimumDropPercent:30, windowMinutes:5, retentionMinutes:RAPID_DROP_RETENTION_MINUTES,
});
type Episode = { start:NormalizedSnapshot; detected:NormalizedSnapshot; low:NormalizedSnapshot };
const percent = (price:number,base:number)=>(price/base-1)*100;

export function rapidDropRecoveryPercent(start: number, low: number, current: number): number {
  return start > low ? Math.max(0, Math.min(100, (current - low) / (start - low) * 100)) : 0;
}

/** Observed traded-price changes only. No quotes/order-book requests, interpolation or volume gating. */
export class DeclineBook {
  private context="";
  private history=new Map<string,NormalizedSnapshot[]>();
  private episodes=new Map<string,Episode>();
  private last=new Map<string,NormalizedSnapshot>();
  private consumedThrough=new Map<string,number>();
  private signature="";
  clear(){this.history.clear();this.episodes.clear();this.last.clear();this.consumedThrough.clear();this.context="";}

  evaluate(input:{universe:DailyUniverse;session:ScannerSession;now:number;snapshots:readonly NormalizedSnapshot[];
    floats:ReadonlyMap<string,FloatFact>;controls?:DeclineControls}):DeclineResults {
    const controls=input.controls??DEFAULT_DECLINE_CONTROLS;
    const context=`${input.universe.tradingDate}:${input.session}`;
    const signature=JSON.stringify(controls);
    if(context!==this.context||signature!==this.signature){this.clear();this.context=context;this.signature=signature;}
    const empty={rapid:[],losers:[],rapidTotal:0,loserTotal:0,controls};
    if(!controls.enabled){this.clear();return empty;}
    const members=new Map(input.universe.stocks.map(stock=>[stock.symbol,stock]));
    for(const map of [this.history,this.episodes,this.last,this.consumedThrough])for(const symbol of map.keys())if(!members.has(symbol))map.delete(symbol);
    for(const quote of input.snapshots){
      if(!members.has(quote.symbol)||quote.session!==input.session||quote.tradingDate!==input.universe.tradingDate
        ||!Number.isFinite(quote.price)||quote.price<=0||!Number.isSafeInteger(quote.receivedAt)||!Number.isSafeInteger(quote.providerAt)
        ||quote.receivedAt<=0||quote.providerAt<=0||quote.receivedAt>input.now||quote.providerAt>input.now
        ||input.now-quote.receivedAt>SNAPSHOT_MAX_AGE_MS
        ||quote.priceTimeBasis!=="session_observation"&&input.now-quote.providerAt>SNAPSHOT_MAX_AGE_MS)continue;
      const previous=this.last.get(quote.symbol);
      if(previous&&(quote.receivedAt<=previous.receivedAt||quote.providerAt<previous.providerAt
        ||quote.priceTimeBasis!=="session_observation"&&quote.providerAt===previous.providerAt&&quote.price!==previous.price))continue;
      let rows=this.history.get(quote.symbol)??[];
      if(previous&&(previous.priceTimeBasis!==quote.priceTimeBasis
        ||previous.volume!==null&&quote.volume!==null&&quote.volume<previous.volume
        ||previous.dollarVolume!==null&&quote.dollarVolume!==null&&quote.dollarVolume<previous.dollarVolume)){
        rows=[];this.episodes.delete(quote.symbol);this.consumedThrough.delete(quote.symbol);
      }
      rows=rows.filter(row=>row.receivedAt>=quote.receivedAt-controls.windowMinutes*60000);
      const peak=rows.filter(row=>row.receivedAt>(this.consumedThrough.get(quote.symbol)??0))
        .reduce<NormalizedSnapshot|null>((best,row)=>!best||row.price>=best.price?row:best,null);
      let episode=this.episodes.get(quote.symbol);
      if(!episode&&peak&&peak.receivedAt>(this.consumedThrough.get(quote.symbol)??0)
        &&percent(quote.price,peak.price)<=-controls.minimumDropPercent+1e-9){
        episode={start:peak,detected:quote,low:quote};
        this.episodes.set(quote.symbol,episode);
      }
      if(episode&&quote.price<episode.low.price)episode.low=quote;
      rows.push(quote);this.history.set(quote.symbol,rows.slice(-1000));this.last.set(quote.symbol,quote);
    }
    for(const [symbol,episode]of this.episodes){
      const latest=this.last.get(symbol)!;
      const recovered=rapidDropRecoveryPercent(episode.start.price,episode.low.price,latest.price)+1e-9>=RAPID_DROP_RECOVERY_PERCENT;
      const expired=input.now-episode.detected.receivedAt>=Math.min(controls.retentionMinutes,RAPID_DROP_RETENTION_MINUTES)*60000;
      if(recovered||expired){
        this.episodes.delete(symbol);
        // Do not recreate the same selloff from the old peak after expiry.
        this.consumedThrough.set(symbol,recovered?latest.receivedAt-1:input.now);
      }
    }
    const makeRow=(quote:NormalizedSnapshot):DeclineRow=>{
      const base=input.session==="after_hours"?quote.regularClosePrice:quote.baseline;
      const validBase=typeof base==="number"&&Number.isFinite(base)&&base>0?base:null;
      const fact=input.floats.get(quote.symbol),at=fact?Date.parse(fact.retrievedAtUtc):NaN;
      return {symbol:quote.symbol,exchange:members.get(quote.symbol)!.exchange,company:quote.company,price:quote.price,
        comparisonPrice:validBase,changePercent:validBase===null?null:percent(quote.price,validBase),volume:quote.volume,
        float:fact&&Number.isSafeInteger(fact.shares)&&fact.shares>0&&at<=input.now&&input.now-at<=30*60*60000?fact.shares:null,
        spreadPercent:quote.bid!==null&&quote.ask!==null&&quote.bid>0&&quote.ask>=quote.bid?(quote.ask-quote.bid)/((quote.ask+quote.bid)/2)*100:null,
        receivedAtUtc:new Date(quote.receivedAt).toISOString(),news:[]};
    };
    // A partial batch must not erase a still-fresh quote from the preceding
    // pass. Preserve its real receipt time; expire it at the same age bound.
    const losers=[...this.last.values()].filter(quote=>input.now-quote.receivedAt<=SNAPSHOT_MAX_AGE_MS
      &&(quote.priceTimeBasis==="session_observation"||input.now-quote.providerAt<=SNAPSHOT_MAX_AGE_MS))
      .map(makeRow).filter(row=>row.changePercent!==null&&row.changePercent<0)
      .sort((a,b)=>a.changePercent!-b.changePercent!||a.symbol.localeCompare(b.symbol));
    const rapid=[...this.episodes.entries()].map(([symbol,episode])=>{
      const quote=this.last.get(symbol)!;
      const volume=episode.start.volume!==null&&episode.low.volume!==null&&episode.low.volume>=episode.start.volume
        ?episode.low.volume-episode.start.volume:null;
      return {...makeRow(quote),drop:{detectedAtUtc:new Date(episode.detected.receivedAt).toISOString(),
        startAtUtc:new Date(episode.start.receivedAt).toISOString(),startPrice:episode.start.price,detectionPrice:episode.detected.price,
        lowPrice:episode.low.price,lowAtUtc:new Date(episode.low.receivedAt).toISOString(),
        dropPercent:percent(quote.price,episode.start.price),maximumDropPercent:percent(episode.low.price,episode.start.price),
        reboundPercent:percent(quote.price,episode.low.price),backToStartPercent:percent(episode.start.price,quote.price),
        durationSeconds:Math.round((episode.low.receivedAt-episode.start.receivedAt)/1000),sharesDuringDrop:volume}};
    }).sort((a,b)=>a.drop.dropPercent-b.drop.dropPercent||a.symbol.localeCompare(b.symbol));
    return {rapid:rapid.slice(0,controls.displayLimit),losers:losers.slice(0,controls.displayLimit),rapidTotal:rapid.length,loserTotal:losers.length,controls};
  }
}
