import type { DailyUniverse, DeclineRow, NormalizedSnapshot, PremarketPullbackControls, PremarketPullbackResults, PremarketPullbackRow, RollingActivity, ScannerSession } from "./contracts";
import type { FloatFact } from "./engine";
import { SNAPSHOT_MAX_AGE_MS } from "./snapshots";

export const DEFAULT_PREMARKET_PULLBACK_CONTROLS:PremarketPullbackControls=Object.freeze({
  enabled:true,displayLimit:20,minimumPullbackPercent:20,removeWithinPercent:18,
});
type Reference={high:number;volume:number|null;frozen:boolean};
type SessionHighs={regular:number|null;afterHours:number|null};
const positive=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value)&&value>0;
const volume=(value:unknown):number|null=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0?value:null;

/** Current-day session highs and pullbacks from the greatest available reference. */
export class PremarketPullbackBook {
  private date="";
  private session:ScannerSession|null=null;
  private references=new Map<string,Reference>();
  private sessionHighs=new Map<string,SessionHighs>();
  private quotes=new Map<string,NormalizedSnapshot>();
  private included=new Set<string>();
  private selectionKey="";
  clear(){this.date="";this.session=null;this.references.clear();this.sessionHighs.clear();this.quotes.clear();this.included.clear();this.selectionKey="";}
  evaluate(input:{universe:DailyUniverse;session:ScannerSession;now:number;snapshots:readonly NormalizedSnapshot[];
    floats:ReadonlyMap<string,FloatFact>;activity:(symbol:string)=>RollingActivity;rapidDrops?:readonly DeclineRow[];controls?:PremarketPullbackControls}):PremarketPullbackResults{
    const controls=input.controls??DEFAULT_PREMARKET_PULLBACK_CONTROLS;
    if(this.date!==input.universe.tradingDate){this.clear();this.date=input.universe.tradingDate;}
    const key=`${controls.minimumPullbackPercent}:${controls.removeWithinPercent}`;
    if(key!==this.selectionKey){this.included.clear();this.selectionKey=key;}
    if(this.session!==input.session){this.quotes.clear();this.session=input.session;}
    const members=new Map(input.universe.stocks.map(stock=>[stock.symbol,stock]));
    for(const map of [this.references,this.sessionHighs,this.quotes])for(const symbol of map.keys())if(!members.has(symbol))map.delete(symbol);
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
      if(positive(quote.premarketHigh)&&(quote.provider==="alpaca"||!reference?.frozen)){
        // At/after the open, latch the provider's final PM aggregate, not its
        // largest regular-session price and not merely the first observed price.
        const high=input.session==="premarket"&&quote.provider!=="alpaca"?Math.max(reference?.high??0,quote.premarketHigh):quote.premarketHigh;
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
      const highs=this.sessionHighs.get(quote.symbol)??{regular:null,afterHours:null};
      if(input.session!=="premarket"&&positive(quote.regularHigh)) highs.regular=quote.regularHigh;
      else if(input.session==="regular"&&quote.provider!=="alpaca") highs.regular=Math.max(highs.regular??0,quote.price);
      if(input.session==="after_hours"){
        if(positive(quote.postMarketHigh)) highs.afterHours=quote.postMarketHigh;
        else if(quote.provider!=="alpaca") highs.afterHours=Math.max(highs.afterHours??0,quote.price);
      }
      this.sessionHighs.set(quote.symbol,highs);
      this.quotes.set(quote.symbol,quote);
    }
    const rapidBySymbol=new Map((input.rapidDrops??[]).filter(row=>row.drop).map(row=>[row.symbol,row.drop!]));
    const rows:PremarketPullbackRow[]=[];let missingReferenceCount=0;
    for(const [symbol,quote]of this.quotes){
      if(input.now-quote.receivedAt>SNAPSHOT_MAX_AGE_MS||quote.priceTimeBasis!=="session_observation"&&input.now-quote.providerAt>SNAPSHOT_MAX_AGE_MS){this.included.delete(symbol);continue;}
      const ref=this.references.get(symbol),highs=this.sessionHighs.get(symbol)??{regular:null,afterHours:null};
      const premarketHigh=ref&&(input.session==="premarket"||ref.frozen)?ref.high:null;
      const candidates=[
        premarketHigh===null?null:{session:"premarket" as const,high:premarketHigh},
        highs.regular===null?null:{session:"regular" as const,high:highs.regular},
        highs.afterHours===null?null:{session:"after_hours" as const,high:highs.afterHours},
      ].filter((item):item is NonNullable<typeof item>=>item!==null);
      const reference=candidates.reduce<(typeof candidates)[number]|null>((best,item)=>!best||item.high>best.high?item:best,null);
      if(!reference){missingReferenceCount++;this.included.delete(symbol);continue;}
      const below=(1-quote.price/reference.high)*100,rapidDrop=rapidBySymbol.get(symbol);
      const boundary=this.included.has(symbol)?controls.removeWithinPercent:controls.minimumPullbackPercent;
      if(below+1e-9<boundary||below<=0){this.included.delete(symbol);continue;}
      this.included.add(symbol);
      const fact=input.floats.get(symbol),at=fact?Date.parse(fact.retrievedAtUtc):NaN;
      const activity=input.activity(symbol);
      const comparison=input.session==="after_hours"?quote.regularClosePrice:quote.baseline;
      const validComparison=typeof comparison==="number"&&Number.isFinite(comparison)&&comparison>0?comparison:null;
      rows.push({symbol,exchange:members.get(symbol)!.exchange,company:quote.company,price:quote.price,
        premarketHigh,regularHigh:highs.regular,postMarketHigh:highs.afterHours,referenceSession:reference.session,referenceHigh:reference.high,
        premarketVolume:ref?.volume??null,sessionVolume:quote.volume,
        float:fact&&Number.isSafeInteger(fact.shares)&&fact.shares>0&&at<=input.now&&input.now-at<=30*60*60000?fact.shares:null,
        changePercent:validComparison===null?null:(quote.price/validComparison-1)*100,
        belowHighPercent:below,backToHighPercent:(reference.high/quote.price-1)*100,
        oneMinuteVolume:activity.oneMinuteVolume,fiveMinuteVolume:activity.fiveMinuteVolume,
        spreadPercent:quote.bid!==null&&quote.ask!==null&&quote.bid>0&&quote.ask>=quote.bid?(quote.ask-quote.bid)/((quote.ask+quote.bid)/2)*100:null,
        receivedAtUtc:new Date(quote.receivedAt).toISOString(),news:[],...(rapidDrop?{rapidDrop}:{})});
    }
    rows.sort((a,b)=>b.belowHighPercent-a.belowHighPercent||a.symbol.localeCompare(b.symbol));
    return {rows:rows.slice(0,controls.displayLimit),total:rows.length,missingReferenceCount,controls};
  }
}
