import type { UniverseStock, UniverseUpload } from "../contracts";
import { scannerUniverseSymbolEligible } from "../universe-validation";

const SOURCE_URL="https://api.nasdaq.com/api/screener/stocks" as const;
const MAX_MARKET_CAP=500_000_000 as const;
const MAX_RESPONSE_BYTES=3_000_000;
const SYMBOL=/^[A-Z][A-Z0-9.-]{0,15}$/u;
const RETRY_MS=15*60_000;

type ObjectValue=Record<string,unknown>;
const object=(value:unknown):value is ObjectValue=>Boolean(value&&typeof value==="object"&&!Array.isArray(value));

async function rowsFor(exchange:"NASDAQ"|"NYSE"|"AMEX",request:typeof fetch):Promise<readonly UniverseStock[]> {
  const url=new URL(SOURCE_URL);
  url.searchParams.set("exchange",exchange.toLowerCase());
  url.searchParams.set("download","true");
  const response=await request(url,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(20_000),headers:{
    Accept:"application/json, text/plain, */*",Referer:"https://www.nasdaq.com/","User-Agent":"TraderLink scanner universe/1.0",
  }});
  if(!response.ok)throw Error("scanner_nasdaq_universe_http_unavailable");
  const text=await response.text();
  if(Buffer.byteLength(text)>MAX_RESPONSE_BYTES)throw Error("scanner_nasdaq_universe_response_invalid");
  let payload:unknown;
  try{payload=JSON.parse(text);}catch{throw Error("scanner_nasdaq_universe_response_invalid");}
  if(!object(payload)||!object(payload.data)||!Array.isArray(payload.data.rows)||payload.data.rows.length<1||payload.data.rows.length>10_000)throw Error("scanner_nasdaq_universe_response_invalid");
  const stocks:UniverseStock[]=[];
  for(const value of payload.data.rows){
    if(!object(value)||typeof value.symbol!=="string")continue;
    const symbol=value.symbol.trim().toUpperCase(),cap=typeof value.marketCap==="string"?Number(value.marketCap):value.marketCap;
    if(!SYMBOL.test(symbol)||!scannerUniverseSymbolEligible(symbol)||typeof cap!=="number"||!Number.isFinite(cap)||cap<=0||cap>MAX_MARKET_CAP)continue;
    const marketCapAtCollection=Math.round(cap);
    if(!Number.isSafeInteger(marketCapAtCollection)||marketCapAtCollection<=0)continue;
    stocks.push({symbol,exchange,marketCapAtCollection});
  }
  return stocks;
}

export async function collectNasdaqUniverseUpload(input:Readonly<{tradingDate:string;request?:typeof fetch;now?:()=>number}>):Promise<UniverseUpload>{
  const request=input.request??fetch,started=(input.now??Date.now)();
  const sets=await Promise.all([rowsFor("NASDAQ",request),rowsFor("NYSE",request),rowsFor("AMEX",request)]);
  const bySymbol=new Map<string,UniverseStock>();
  for(const stock of sets.flat()){
    const previous=bySymbol.get(stock.symbol);
    if(previous&&previous.exchange!==stock.exchange)throw Error("scanner_nasdaq_universe_exchange_conflict");
    bySymbol.set(stock.symbol,stock);
  }
  const stocks=[...bySymbol.values()].sort((a,b)=>a.symbol.localeCompare(b.symbol));
  if(stocks.length<100||stocks.length>4000)throw Error("scanner_nasdaq_universe_population_invalid");
  const finished=(input.now??Date.now)();
  return {tradingDate:input.tradingDate,csv:["symbol,exchange,market_cap",...stocks.map(stock=>`${stock.symbol},${stock.exchange},${stock.marketCapAtCollection}`)].join("\n"),metadata:{
    completeness_status:"complete",source_url:SOURCE_URL,collection_started_at_utc:new Date(started).toISOString(),collection_finished_at_utc:new Date(finished).toISOString(),
    displayed_total:stocks.length,extracted_unique_count:stocks.length,applied_filters:{exchanges:["NASDAQ","NYSE","AMEX"],market_cap_max:MAX_MARKET_CAP},
  }};
}

export class NasdaqUniverseRefresher{
  private completedDate:string|null=null;
  private nextAttemptAt=0;
  private running:Promise<void>|null=null;
  constructor(private readonly input:Readonly<{store:{import:(value:unknown,now:number)=>Promise<unknown>};request?:typeof fetch;now?:()=>number}>){ }
  async refresh(tradingDate:string):Promise<void>{
    const now=(this.input.now??Date.now)();
    if(this.completedDate===tradingDate||now<this.nextAttemptAt)return;
    if(this.running)return this.running;
    this.running=(async()=>{
      try{
        const upload=await collectNasdaqUniverseUpload({tradingDate,request:this.input.request,now:this.input.now});
        await this.input.store.import(upload,(this.input.now??Date.now)());
        this.completedDate=tradingDate;
        this.nextAttemptAt=0;
      }catch(error){this.nextAttemptAt=(this.input.now??Date.now)()+RETRY_MS;throw error;}
      finally{this.running=null;}
    })();
    return this.running;
  }
}
