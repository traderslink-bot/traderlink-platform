import "server-only";

export type ChartExchange="NASDAQ"|"NYSE";
type CacheEntry={date:string;exchange:ChartExchange|null;pending:Promise<void>|null;retryAt:number};
const state=globalThis as typeof globalThis&{__traderlinkFinnhubExchangeCacheV1?:Map<string,CacheEntry>};
const cache=state.__traderlinkFinnhubExchangeCacheV1??=new Map();
const SYMBOL=/^[A-Z][A-Z0-9.-]{0,15}$/u;

export function parseFinnhubExchange(payload:unknown,symbol:string):ChartExchange|null{
  if(!payload||typeof payload!=="object"||Array.isArray(payload))return null;
  const row=payload as Record<string,unknown>,ticker=typeof row.ticker==="string"?row.ticker.trim().toUpperCase():"";
  const exchange=typeof row.exchange==="string"?row.exchange.trim().toUpperCase():"";
  if(ticker!==symbol||!exchange)return null;
  if(exchange.includes("NASDAQ"))return "NASDAQ";
  if(exchange==="NYSE"||exchange.includes("NEW YORK STOCK EXCHANGE"))return "NYSE";
  return null;
}
async function lookup(symbol:string,token:string,request:typeof fetch):Promise<ChartExchange|null>{
  const endpoint=new URL("https://finnhub.io/api/v1/stock/profile2");
  endpoint.searchParams.set("symbol",symbol);endpoint.searchParams.set("token",token);
  try{
    const response=await request(endpoint,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(5_000)});
    return response.ok?parseFinnhubExchange(await response.json(),symbol):null;
  }catch{return null;}
}
export function readFinnhubExchanges(input:Readonly<{tradingDate:string;symbols:readonly string[];token?:string;request?:typeof fetch;now?:()=>number}>):ReadonlyMap<string,ChartExchange>{
  const token=input.token?.trim();if(!token)return new Map();
  const request=input.request??fetch,now=input.now??Date.now,symbols=[...new Set(input.symbols)].filter(symbol=>SYMBOL.test(symbol));
  if(cache.size>512)for(const [key,value]of cache)if(value.date!==input.tradingDate)cache.delete(key);
  const result=new Map<string,ChartExchange>();
  for(const symbol of symbols){
    const key=`${input.tradingDate}:${symbol}`;let entry=cache.get(key);
    if(!entry){entry={date:input.tradingDate,exchange:null,pending:null,retryAt:0};cache.set(key,entry);}
    if(entry.exchange){result.set(symbol,entry.exchange);continue;}
    if(!entry.pending&&now()>=entry.retryAt){
      entry.pending=lookup(symbol,token,request).then(exchange=>{entry!.exchange=exchange;entry!.retryAt=exchange?Number.POSITIVE_INFINITY:now()+300_000;}).finally(()=>{entry!.pending=null;});
    }
  }
  return result;
}
