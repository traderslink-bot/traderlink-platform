import type { DailyUniverse, NormalizedSnapshot, PremarketPullbackControls, PremarketPullbackResults, PremarketPullbackRow, RollingActivity, ScannerSession } from "./contracts";
import type { FloatFact } from "./engine";
import { SNAPSHOT_MAX_AGE_MS } from "./snapshots";

export const DEFAULT_PREMARKET_PULLBACK_CONTROLS:PremarketPullbackControls=Object.freeze({
  enabled:true,displayLimit:20,minimumPullbackPercent:20,removeWithinPercent:18,
});
type Reference={high:number;volume:number|null;frozen:boolean};
const positive=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value)&&value>0;
const volume=(value:unknown):number|null=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0?value:null;

/** Current-day provider premarket aggregates, not historical candles or inferred recovery states. */
export class PremarketPullbackBook {
  private date="";
  private session:ScannerSession|null=null;
  private references=new Map<string,Reference>();
  private quotes=new Map<string,NormalizedSnapshot>();
  private included=new Set<string>();
  private selectionKey="";
  clear(){this.date="";this.session=null;this.references.clear();this.quotes.clear();this.included.clear();this.selectionKey="";}
  evaluate(input:{universe:DailyUniverse;session:ScannerSession;now:number;snapshots:readonly NormalizedSnapshot[];
    floats:ReadonlyMap<string,FloatFact>;activity:(symbol:string)=>RollingActivity;controls?:PremarketPullbackControls}):PremarketPullbackResults{
    const controls=input.controls??DEFAULT_PREMARKET_PULLBACK_CONTROLS;
    if(this.date!==input.universe.tradingDate){this.clear();this.date=input.universe.tradingDate;}
    const key=`${controls.minimumPullbackPercent}:${controls.removeWithinPercent}`;
    if(key!==this.selectionKey){this.included.clear();this.selectionKey=key;}
    if(this.session!==input.session){this.quotes.clear();this.session=input.session;}
    const members=new Map(input.universe.stocks.map(stock=>[stock.symbol,stock]));
    for(const map of [this.references,this.quotes])for(const symbol of map.keys())if(!members.has(symbol))map.delete(symbol);
    for(const symbol of this.included)if(!members.has(symbol))this.included.delete(symbol);
    if(!controls.enabled){this.included.clear();return {rows:[],total:0,missingReferenceCount:0,controls};}
    for(const quote of input.snapshots){
      if(!members.has(quote.symbol)||quote.session!==input.session||quote.tradingDate!==this.date||!positive(quote.price)
        ||!Number.isSafeInteger(quote.receivedAt)||!Number.isSafeInteger(quote.providerAt)||quote.providerAt<=0||quote.receivedAt<=0
        ||quote.receivedAt>input.now||quote.providerAt>input.now||input.now-quote.receivedAt>SNAPSHOT_MAX_AGE_MS
        ||quote.priceTimeBasis!=="session_observation"&&input.now-quote.providerAt>SNAPSHOT_MAX_AGE_MS)continue;
      const previous=this.quotes.get(quote.symbol);
      if(previous&&(quote.receivedAt<=previous.receivedAt||quote.providerAt<previous.providerAt
        ||quote.priceTimeBasis!=="session_observation"&&quote.providerAt===previous.providerAt&&quote.price!==previous.price))continue;
      const reference=this.references.get(quote.symbol);
      if(positive(quote.premarketHigh)&&!reference?.frozen){
        // At/after the open, latch the provider's final PM aggregate, not its
        // largest regular-session price and not merely the first observed price.
        const high=input.session==="premarket"?Math.max(reference?.high??0,quote.premarketHigh):quote.premarketHigh;
        this.references.set(quote.symbol,{high,volume:volume(quote.premarketVolume),frozen:input.session!=="premarket"});
      }else if(reference?.frozen&&quote.premarketHigh===reference.high){
        // The final high is fixed, but its volume may arrive on a later pass.
        // Keep a known counter on omission/reset and do not mix a different
        // high's aggregate into this reference. This uses the existing feed.
        const nextVolume=volume(quote.premarketVolume);
        if(nextVolume!==null&&(reference.volume===null||nextVolume>=reference.volume)){
          this.references.set(quote.symbol,{...reference,volume:nextVolume});
        }
      }
      this.quotes.set(quote.symbol,quote);
    }
    const rows:PremarketPullbackRow[]=[];let missingReferenceCount=0;
    for(const [symbol,quote]of this.quotes){
      if(input.now-quote.receivedAt>SNAPSHOT_MAX_AGE_MS||quote.priceTimeBasis!=="session_observation"&&input.now-quote.providerAt>SNAPSHOT_MAX_AGE_MS){this.included.delete(symbol);continue;}
      const ref=this.references.get(symbol);
      // Do not pretend the final high is known if only a pre-open observation
      // survived and the first regular response lacks its final PM aggregate.
      if(!ref||input.session!=="premarket"&&!ref.frozen){missingReferenceCount++;this.included.delete(symbol);continue;}
      const below=(1-quote.price/ref.high)*100;
      const boundary=this.included.has(symbol)?controls.removeWithinPercent:controls.minimumPullbackPercent;
      if(below+1e-9<boundary||below<=0){this.included.delete(symbol);continue;}
      this.included.add(symbol);
      const fact=input.floats.get(symbol),at=fact?Date.parse(fact.retrievedAtUtc):NaN;
      const activity=input.activity(symbol);
      rows.push({symbol,exchange:members.get(symbol)!.exchange,company:quote.company,price:quote.price,
        premarketHigh:ref.high,premarketVolume:ref.volume,sessionVolume:quote.volume,
        float:fact&&Number.isSafeInteger(fact.shares)&&fact.shares>0&&at<=input.now&&input.now-at<=30*60*60000?fact.shares:null,
        belowHighPercent:below,backToHighPercent:(ref.high/quote.price-1)*100,
        oneMinuteVolume:activity.oneMinuteVolume,fiveMinuteVolume:activity.fiveMinuteVolume,
        spreadPercent:quote.bid!==null&&quote.ask!==null&&quote.bid>0&&quote.ask>=quote.bid?(quote.ask-quote.bid)/((quote.ask+quote.bid)/2)*100:null,
        receivedAtUtc:new Date(quote.receivedAt).toISOString(),news:[]});
    }
    rows.sort((a,b)=>b.backToHighPercent-a.backToHighPercent||a.symbol.localeCompare(b.symbol));
    return {rows:rows.slice(0,controls.displayLimit),total:rows.length,missingReferenceCount,controls};
  }
}
