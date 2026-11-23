import { createHash } from "node:crypto";
import {calendarDate} from './chart-calendar';
import {chartSymbol} from './candles';
import {easternClock} from '../live/sessions';
export type VwapCorporateAnchor='Splits'|'Dividends';
export type VwapCorporateEvents={symbol:string;anchor:VwapCorporateAnchor;basisDate:string;dates:string[]};
export type AlpacaSplitEvent = Readonly<{
 providerEventId: string; kind: "forward" | "reverse"; reportedSymbol: string; successorSymbol: string | null;
 effectiveDate: string; processedDate: string; oldShares: number; newShares: number;
}>;
export type AlpacaSplitHistory = Readonly<{
 symbol: string; basisDate: string; revision: string; events: readonly AlpacaSplitEvent[];
}>;
type EventEntry = VwapCorporateEvents & { revision: string; splitEvents: readonly AlpacaSplitEvent[] };
const exactTicker = /^[A-Z][A-Z0-9.-]{0,15}$/u;
const groups={Splits:['forward_splits','reverse_splits'],Dividends:['cash_dividends','stock_dividends']} as const;
const types={Splits:'forward_split,reverse_split',Dividends:'cash_dividend,stock_dividend'} as const;
/** Read-only event facts. Processing dates are never substituted for ex-dates. */
export class AlpacaVwapCorporateEvents{
 private cache=new Map<string,{at:number;value:EventEntry}>();
 private pending=new Map<string,Promise<EventEntry>>();
 constructor(private readonly credentials:{keyId:string;secretKey:string},private readonly transport:typeof fetch=fetch,private readonly now:()=>number=Date.now){}
 async read(symbol:string,anchor:VwapCorporateAnchor):Promise<VwapCorporateEvents>{
  const entry=await this.readEntry(symbol,anchor);
  return {symbol:entry.symbol,anchor:entry.anchor,basisDate:entry.basisDate,dates:entry.dates};
 }
 async splitRevision(symbol:string):Promise<string>{return (await this.readEntry(symbol,"Splits")).revision;}
 async splitHistory(symbol: string): Promise<AlpacaSplitHistory> {
  const { symbol: requested, basisDate, revision, splitEvents } = await this.readEntry(symbol, "Splits");
  return { symbol: requested, basisDate, revision, events: splitEvents };
 }
 private async readEntry(symbol:string,anchor:VwapCorporateAnchor):Promise<EventEntry>{
  symbol=chartSymbol(symbol);if(anchor!=='Splits'&&anchor!=='Dividends')throw Error('vwap_event_type_unavailable');
  const basisDate=easternClock(this.now()).date,key=JSON.stringify([symbol,anchor,basisDate]),cached=this.cache.get(key);
  if(cached&&this.now()-cached.at<300_000)return structuredClone(cached.value);
  const current=this.pending.get(key);if(current)return structuredClone(await current);
  if(this.pending.size>=2)throw Error('vwap_events_busy');
  const operation=this.load(symbol,anchor,basisDate).then(value=>{this.cache.set(key,{at:this.now(),value});while(this.cache.size>128)this.cache.delete(this.cache.keys().next().value!);return value;}).finally(()=>this.pending.delete(key));
  this.pending.set(key,operation);return structuredClone(await operation);
 }
 private async load(symbol:string,anchor:VwapCorporateAnchor,basisDate:string):Promise<EventEntry>{
  const began=this.now(),dates=new Set<string>(),effective=new Map<string,string>(),ids=new Map<string,string>(),tokens=new Set<string>();let token:string|undefined;
  const splitEvents = new Map<string, AlpacaSplitEvent>();
  for(let page=0;page<32;page++){
   const remaining=30_000-(this.now()-began);if(remaining<=0||easternClock(this.now()).date!==basisDate)throw Error('vwap_events_unavailable');
   const url=new URL('https://data.alpaca.markets/v1/corporate-actions');url.search=new URLSearchParams({symbols:symbol,types:types[anchor],start:'1970-01-01',end:basisDate,sort:'asc',limit:'1000',data_quality:'complete',...(token?{page_token:token}:{})}).toString();
   const response=await this.transport(url,{method:'GET',headers:{'APCA-API-KEY-ID':this.credentials.keyId,'APCA-API-SECRET-KEY':this.credentials.secretKey},redirect:'error',signal:AbortSignal.timeout(Math.min(10_000,remaining))});
   if(!response.ok)throw Error('vwap_events_unavailable');
   const payload=await response.json() as {corporate_actions?:unknown;next_page_token?:unknown};
   if(!payload||typeof payload!=='object'||!payload.corporate_actions||typeof payload.corporate_actions!=='object'||Array.isArray(payload.corporate_actions))throw Error('vwap_events_incomplete');
   let count=0;
   for(const [group,values]of Object.entries(payload.corporate_actions)){
    if(!Array.isArray(values)||values.length>1000)throw Error('vwap_events_incomplete');count+=values.length;if(count>1000)throw Error('vwap_events_incomplete');
    if(!groups[anchor].some(expected=>expected===group)){if(values.length)throw Error('vwap_events_wrong_type');continue;}
    for(const raw of values){
     if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('vwap_event_invalid');const row=raw as Record<string,unknown>;
     const renamed = group === "reverse_splits" && row.symbol !== symbol && row.new_symbol === symbol &&
       typeof row.symbol === "string" && exactTicker.test(row.symbol);
     if(typeof row.id!=='string'||!row.id||row.id.length>128||typeof row.symbol !== "string"||
       (row.symbol!==symbol && !renamed)||!calendarDate(row.ex_date)||!calendarDate(row.process_date)||row.process_date<'1970-01-01'||row.process_date>basisDate)throw Error('vwap_event_invalid');
     if(anchor==='Splits'&&(!Number.isFinite(row.old_rate)||Number(row.old_rate)<=0||!Number.isFinite(row.new_rate)||Number(row.new_rate)<=0)||anchor==='Dividends'&&(!Number.isFinite(row.rate)||Number(row.rate)<0))throw Error('vwap_event_invalid');
     const fields = [group, row.symbol, row.ex_date, row.process_date, row.old_rate, row.new_rate, row.rate];
     if (renamed) fields.push(row.new_symbol);
     const identity=JSON.stringify(fields);const previous=ids.get(row.id);if(previous!==undefined&&previous!==identity)throw Error('vwap_event_conflict');ids.set(row.id,identity);
     if (row.ex_date <= basisDate) {
      dates.add(row.ex_date);
      effective.set(row.id, identity);
      if (anchor === "Splits") {
       splitEvents.set(row.id, {
        providerEventId: row.id, kind: group === "reverse_splits" ? "reverse" : "forward", reportedSymbol: row.symbol,
        successorSymbol: typeof row.new_symbol === "string" && exactTicker.test(row.new_symbol) ? row.new_symbol : null,
        effectiveDate: row.ex_date, processedDate: row.process_date,
        oldShares: Number(row.old_rate), newShares: Number(row.new_rate),
       });
      }
     }
    }
   }
   const next=payload.next_page_token;
   if (next === null || next === undefined) {
    if (easternClock(this.now()).date !== basisDate) throw Error("vwap_events_unavailable");
    return {
     symbol, anchor, basisDate, dates: [...dates].sort(), revision: createHash("sha256").update(JSON.stringify([...effective].sort())).digest("hex"),
     splitEvents: [...splitEvents.values()].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate) ||
      a.providerEventId.localeCompare(b.providerEventId)),
    };
   }
   if(typeof next!=='string'||!next||next.length>4096||tokens.has(next))throw Error('vwap_events_pagination_invalid');tokens.add(next);token=next;
  }
  throw Error('vwap_events_incomplete');
 }
}
