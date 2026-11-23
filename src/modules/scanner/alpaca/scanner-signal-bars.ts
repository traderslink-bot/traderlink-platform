import { DEFAULT_SIGNAL_HISTORY, MAX_CUSTOM_PERIOD } from "../custom/custom-indicator";
import { alpacaCandle, chartSymbol, easternDayStart, type Candle } from "./candles";
import type { AlpacaRestData } from "./rest-data";
import { scanSignalFrames, SIGNAL_LOOKBACK_MINUTES,type ScanSignalFrame } from "../custom/signal-filters";
import { easternClock } from "../live/sessions";

export const SCANNER_SIGNAL_BATCH_SIZE = 50;
export const SCANNER_SIGNAL_CONCURRENCY = 4;
export const MAX_SIGNAL_BARS = DEFAULT_SIGNAL_HISTORY;
export const MAX_CUSTOM_SIGNAL_BARS=MAX_CUSTOM_PERIOD+SIGNAL_LOOKBACK_MINUTES+2;
export const SIGNAL_BOOTSTRAP_DAYS = 7;
export type ScannerSignalBar = Candle & { vwap?: number };
export const scanVwapStart = (time:number) => easternDayStart(time/1000)*1000+4*3_600_000;
export type ScannerSignalBars = {
  symbols:string[]; frame:ScanSignalFrame; start:number; end:number; sessionVwap?:true; historyBars?:number;
};
export type ScannerSignalBarsResult = {
  feed:"sip"; adjustment:"split"; frame:ScanSignalFrame; basisDate:string; end:number;
  bars:Record<string,ScannerSignalBar[]>; sessionVwap?:true; historyBars?:number;
  coverage?:Record<string,{status:"complete"|"partial";completedThroughMs:number}>;
};
export function parseScannerSignalBars(value:URLSearchParams, now=Date.now()):ScannerSignalBars {
  const frame=scanSignalFrames.find(frame=>frame===value.get("frame"));
  const symbols=value.get("symbols")?.split(",").map(chartSymbol)??[];
  const start=Number(value.get("start")),end=Number(value.get("end"));
  if (!frame || !symbols.length || symbols.length>SCANNER_SIGNAL_BATCH_SIZE || new Set(symbols).size!==symbols.length ||
    !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start<=0 || start>=end || end>now ||
    end-start>SIGNAL_BOOTSTRAP_DAYS*86_400_000) throw Error("invalid_scanner_signal_bars");
  const sessionVwap=value.get("sessionVwap");
  if(sessionVwap!==null&&sessionVwap!=="1")throw Error("invalid_scanner_signal_bars");
  const history=value.get("historyBars");
  const historyBars=history===null?undefined:Number(history);
  if(historyBars!==undefined&&(!Number.isSafeInteger(historyBars)||historyBars<MAX_SIGNAL_BARS||historyBars>MAX_CUSTOM_SIGNAL_BARS))
    throw Error("invalid_scanner_signal_bars");
  return {symbols:symbols.sort(),frame,start,end,...(sessionVwap==="1"?{sessionVwap:true}:{}),...(historyBars?{historyBars}:{})};
}

export function validateScannerSignalBars(result: unknown, request: ScannerSignalBars): ScannerSignalBarsResult {
  if (typeof result !== "object" || !result || Array.isArray(result)) throw Error("invalid_scanner_signal_reply");
  const reply = result as ScannerSignalBarsResult;
  if (reply.feed !== "sip" || reply.adjustment !== "split" || reply.frame !== request.frame || reply.end !== request.end ||
    reply.basisDate !== easternClock(request.end - 1).date || reply.sessionVwap !== request.sessionVwap ||
    reply.historyBars !== request.historyBars || !reply.bars || !reply.coverage ||
    Object.keys(reply.bars).length !== request.symbols.length ||
    Object.keys(reply.coverage).length !== request.symbols.length) throw Error("invalid_scanner_signal_reply");
  const width = parseInt(request.frame, 10) * 60;
  for (const symbol of request.symbols) {
    const bars = reply.bars[symbol];
    const coverage = reply.coverage[symbol];
    if (!Array.isArray(bars) || coverage?.status !== "complete" || coverage.completedThroughMs !== request.end) {
      throw Error("invalid_scanner_signal_coverage");
    }
    let previous = -Infinity;
    for (const bar of bars) {
      if (!bar || !Number.isSafeInteger(bar.time) || bar.time % width || bar.time <= previous ||
        bar.time * 1000 < request.start || (bar.time + width) * 1000 > request.end ||
        ![bar.open, bar.high, bar.low, bar.close].every(value => Number.isFinite(value) && value > 0) ||
        bar.low > Math.min(bar.open, bar.close) || bar.high < Math.max(bar.open, bar.close) ||
        !Number.isFinite(bar.volume) || bar.volume < 0 ||
        (bar.vwap !== undefined && (!Number.isFinite(bar.vwap) || bar.vwap <= 0))) throw Error("invalid_scanner_signal_bar");
      previous = bar.time;
    }
  }
  return reply;
}

/** A bounded complete SIP read. Never publish a partial page as an entire batch. */
export async function readScannerSignalBars(rest:Pick<AlpacaRestData,"get">, request:ScannerSignalBars, now=Date.now):Promise<ScannerSignalBarsResult> {
  const basisDate=easternClock(now()).date;
  const lastBar=new Map(request.symbols.map(symbol=>[symbol,new Map<number,ScannerSignalBar>()]));
  const params=new URLSearchParams({symbols:request.symbols.join(","),timeframe:parseInt(request.frame,10)+"Min",
    start:new Date(request.start).toISOString(),end:new Date(request.end-1).toISOString(),
    feed:"sip",adjustment:"split",limit:"10000",sort:"desc"});
  const sessionStart=request.sessionVwap?scanVwapStart(request.end-1):Infinity;
  const keepBars=request.historyBars??MAX_SIGNAL_BARS;
  const visited=new Set<string>();
  for(let pages=0;pages<35;pages++){
    const payload=await rest.get("/v2/stocks/bars",params) as {bars?:Record<string,unknown>;next_page_token?:unknown};
    if(!payload||!payload.bars||typeof payload.bars!=="object"||Array.isArray(payload.bars))throw Error("invalid_scanner_signal_reply");
    for(const [symbol,list] of Object.entries(payload.bars)){
      const bars=lastBar.get(symbol);
      if(!bars || !Array.isArray(list))throw Error("invalid_scanner_signal_symbol");
      for(const raw of list){
        const bar=alpacaCandle(raw);
        if(!bar)throw Error("invalid_scanner_signal_bar");
        const start=bar.time*1000;
        if(start<request.start||start>=request.end||(bars.size>=keepBars&&start<sessionStart))continue;
        const vwap=(raw as {vw?:unknown}).vw;
        bars.set(bar.time,typeof vwap==="number"&&Number.isFinite(vwap)&&vwap>0?{...bar,vwap}:bar);
      }
    }
    const next=payload.next_page_token;
    if(next==null||next===""){
      if(easternClock(now()).date!==basisDate)throw Error("scanner_signal_date_changed");
      return {feed:"sip",adjustment:"split",frame:request.frame,basisDate,end:request.end,...(request.sessionVwap?{sessionVwap:true}:{}),...(request.historyBars?{historyBars:request.historyBars}:{}),
        coverage:Object.fromEntries(request.symbols.map(symbol=>[symbol,{status:"complete",completedThroughMs:request.end}])),
        bars:Object.fromEntries([...lastBar].map(([symbol,bars])=>[symbol,[...bars.values()].sort((a,b)=>a.time-b.time)]))};
    }
    if(typeof next!=="string"||visited.has(next))throw Error("scanner_signal_pagination");
    visited.add(next);params.set("page_token",next);
  }
  throw Error("scanner_signal_batch_incomplete");
}
