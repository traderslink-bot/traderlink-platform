/** Portable alias adapter for the separately deployed shared candle cache. */
export const CANDLE_CACHE_WIRE_PATH='/traderslink/v1/market/screening-candles';
const schema='traderslink.market.1',resource='screening-candles';
type Data=Record<string,unknown>;
const object=(value:unknown):Data=>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('candle_contract_invalid');return value as Data;};
const scalar=(value:unknown)=>{if(value!==null&&typeof value!=='string'&&typeof value!=='boolean'&&!(typeof value==='number'&&Number.isFinite(value)))throw Error('candle_contract_invalid');return value;};
function fields(input:unknown,names:Record<string,string>,decode:boolean):Data{const value=object(input);return Object.fromEntries(Object.entries(names).flatMap(([domain,wire])=>{const from=decode?wire:domain;return Object.hasOwn(value,from)&&value[from]!==undefined?[[decode?domain:wire,scalar(value[from])]]:[];}));}
const candleFields=['at','first','peak','trough','last','shares','weighted'] as const;
const domainFields=['time','open','high','low','close','volume','vwap'] as const;
/** Unusable weighted data stays absent so the existing reader marks only that seed partial. */
const usableWeighted=(value:unknown):value is number|null=>value===null||typeof value==='number'&&Number.isFinite(value);
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
function candleRow(value:unknown,decode:boolean):unknown{
 if(decode){
  if(!Array.isArray(value)||![6,7].includes(value.length))throw Error('candle_contract_invalid');
  const bar:Data={};
  for(let index=0;index<6;index++){
   if(finite(value[index]))bar[domainFields[index]]=value[index];
   else if(index===0||index===5)bar[domainFields[index]]=null;
  }
  if(value.length===7&&usableWeighted(value[6]))bar.vwap=value[6];
  return bar;
 }
 const bar=object(value),row=domainFields.slice(0,6).map(key=>finite(bar[key])?bar[key]:null);
 if(Object.hasOwn(bar,'vwap')&&usableWeighted(bar.vwap))row.push(bar.vwap);
 return row;
}
/** Null marks unusable symbol history, never a complete quiet history (which is []). */
function candleSeries(value:unknown,decode:boolean):unknown{
 if(!Array.isArray(value)||value.length>200_000)return null;
 try{return value.map(bar=>candleRow(bar,decode));}catch{return null;}
}
function completion(value:unknown,decode:boolean):unknown{
 try{return fields(value,{status:'state',completedThroughMs:'through'},decode);}catch{return null;}
}
const rootNames={adjustment:'basis',frame:'interval',basisDate:'sessionDate',end:'until',historyBars:'lookback'};
function project(input:unknown,decode:boolean):Data{
 const value=object(input),result=fields(value,rootNames,decode),feed=decode?'coverage':'feed';
 const columns=value.candleFields;
 if(decode&&(!Array.isArray(columns)||columns.length!==candleFields.length||!candleFields.every((name,index)=>columns[index]===name)))throw Error('candle_contract_invalid');
 if(!decode)result.candleFields=[...candleFields];
 if(value[feed]!== (decode?'consolidated':'sip'))throw Error('candle_contract_invalid');
 result[decode?'feed':'coverage']=decode?'sip':'consolidated';
 for(const [domain,wire] of [['bars','candles'],['coverage','completion']] as const){const key=decode?wire:domain;if(!Object.hasOwn(value,key))continue;const entries=object(value[key]);result[decode?domain:wire]=Object.fromEntries(Object.entries(entries).map(([symbol,data])=>{if(!/^[A-Z][A-Z0-9.-]{0,15}$/.test(symbol))throw Error('candle_contract_invalid');return[symbol,domain==='coverage'?completion(data,decode):candleSeries(data,decode)];}));}
 return result;
}
export function encodeCandleCacheReply(value:unknown):unknown{return{schema,resource,data:project(value,false)};}
export function decodeCandleCacheReply(value:unknown):unknown{const body=object(value);if(body.schema!==schema||body.resource!==resource)throw Error('candle_contract_invalid');return project(body.data,true);}
/** Keep the existing authoritative parser as the sole eligibility/coverage gate. */
export function candleCacheWireQuery(query:URLSearchParams,decode=false):URLSearchParams{
 const names={symbols:'tickers',frame:'interval',start:'from',end:'until'},result=new URLSearchParams();
 const allowed=decode?Object.values(names):Object.keys(names);
 if([...query.keys()].some(key=>!allowed.includes(key)))throw Error('invalid_scanner_signal_bars');
 for(const [domain,wire] of Object.entries(names)){const key=decode?wire:domain;if(query.getAll(key).length>1)throw Error('invalid_scanner_signal_bars');if(query.has(key))result.set(decode?domain:wire,query.get(key)!);}
 return result;
}
export function candleCacheWireUrl(base:string,query:URLSearchParams):URL{const url=new URL('traderslink/v1/market/screening-candles',base.endsWith('/')?base:base+'/');url.search=candleCacheWireQuery(query).toString();return url;}
