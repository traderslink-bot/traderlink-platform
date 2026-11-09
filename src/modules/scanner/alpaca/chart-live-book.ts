import type { Candle } from "./candles";
import type { AlpacaRestData } from "./rest-data";
import { alpacaMinuteTradeRules } from "./session-book";
import { priceObservationOrder } from "./live-price-hub";
import { easternDayStart } from "./candles";

// Daily bars have different SIP price eligibility from minute bars.
export function dailyTradeRules(trade: { c?:string[]; z?:string }) {
  const minute=alpacaMinuteTradeRules(trade),conditions=trade.c?.length?trade.c:[trade.z==="C"?"@":" "];
  const blocked=conditions.some(condition=>["C","H","I","M","N","Q","R","T","U","V","W","7"].includes(condition)||(condition==="B"&&trade.z!=="C"));
  return {known:minute.known,volume:minute.volume,highLow:!blocked,openClose:blocked?"none":conditions.some(condition=>["G","P","Z","4"].includes(condition))?"first":"all"};
}

type Trade = { T?: string; S?: string; t: string; p: number; s: number; i: number | string; x: string; c?: string[]; z?: string };
type Minute = { bar: Candle; first: string | null; last: string | null };
/** Chart-only active-minute builder. Official closed bars remain authoritative. */
export class ChartLiveBook {
  private minutes = new Map<number, Minute>();
  private seen = new Set<string>();
  private recentKeys:string[]=[];
  private nextKey=0;
  private dayEnd=0;
  private buffered: Trade[] = [];
  private ready = false;
  private closedThrough = 0;
  private start = 0;
  private generation = 0;
  private warming = false;
  private historyLoading = false;
  private retryAt = 0;
  private dirty = new Set<number>();
  constructor(private readonly symbol: string, private readonly rest: Pick<AlpacaRestData, "get">, private readonly daily=false) {}

  invalidate() { this.generation++; this.ready = false; this.warming = false; this.buffered = []; this.minutes.clear(); this.seen.clear(); this.recentKeys=[];this.nextKey=0;this.dirty.clear(); }
  seal(time: number) { this.closedThrough = Math.max(this.closedThrough, time); this.minutes.delete(time); this.dirty.delete(time); }
  observe(value: unknown) {
    const trade = value as Trade;
    if (trade?.S !== this.symbol) return;
    if (trade.T === "c" || trade.T === "x") { this.invalidate(); return; }
    if (trade.T !== "t") return;
    if (!this.ready) {
      this.buffered.push(trade);
      if (this.buffered.length > 100_000) this.invalidate();
    } else this.apply(trade);
  }
  private apply(trade: Trade) {
    const at = Date.parse(trade.t), minute = this.daily ? this.start/1000 : Math.floor(at / 60_000) * 60;
    if (!Number.isFinite(at) || !Number.isFinite(trade.p) || trade.p <= 0
      || !Number.isSafeInteger(trade.s) || trade.s < 0 || !["number", "string"].includes(typeof trade.i) || typeof trade.x !== "string") { this.invalidate(); return; }
    if(at<this.start||minute<=this.closedThrough)return;
    if(this.daily&&at>=this.dayEnd){this.invalidate();return;}
    const rules = this.daily ? dailyTradeRules(trade) : {...alpacaMinuteTradeRules(trade),highLow:alpacaMinuteTradeRules(trade).prices,openClose:alpacaMinuteTradeRules(trade).prices?"all":"none"};
    if (!rules.known) { this.invalidate(); return; }
    const key = `${trade.x}:${trade.i}:${trade.t}`;
    if (this.seen.has(key)) return;
    if(!this.historyLoading){
      const expired=this.recentKeys[this.nextKey];if(expired)this.seen.delete(expired);
      this.recentKeys[this.nextKey]=key;this.nextKey=(this.nextKey+1)%100_000;
    }
    this.seen.add(key);
    if(this.historyLoading&&this.seen.size>2_000_000){this.invalidate();return;}
    // Fixed-width fractional time preserves sub-millisecond ordering.
    const order = new Date(at).toISOString().slice(0, 19) + (trade.t.match(/\.(\d+)/)?.[1] ?? "").padEnd(9, "0");
    let item = this.minutes.get(minute);
    if (!item) { item = { bar: { time: minute, open: 0, high: 0, low: 0, close: 0, volume: 0 }, first: null, last: null }; this.minutes.set(minute, item); }
    if (rules.volume) item.bar.volume += trade.s;
    if(!Number.isSafeInteger(item.bar.volume)){this.invalidate();return;}
    if (rules.highLow) {
      item.bar.high = Math.max(item.bar.high, trade.p); item.bar.low = item.bar.low ? Math.min(item.bar.low, trade.p) : trade.p;
    }
    if (rules.openClose!=="none") {
      if (item.first === null || rules.openClose==="all" && order < item.first) { item.first = order; item.bar.open = trade.p; }
      if (item.last === null || rules.openClose==="all" && order >= item.last) { item.last = order; item.bar.close = trade.p; }
    }
    if (item.first !== null) this.dirty.add(minute);
    for (const time of this.minutes.keys()) if (time < minute - 120) { this.minutes.delete(time); this.dirty.delete(time); }
  }
  async warm(now = Date.now()) {
    if (this.ready || this.warming || now < this.retryAt) return;
    this.warming = true;
    const generation = this.generation;
    this.start = this.daily ? easternDayStart(now/1000)*1000 : Math.floor(now / 60_000) * 60_000;
    this.dayEnd=this.daily?easternDayStart(this.start/1000+36*3600)*1000:0;
    const rebuilt = new ChartLiveBook(this.symbol,this.rest,this.daily);
    rebuilt.start=this.start;rebuilt.dayEnd=this.dayEnd;rebuilt.closedThrough=this.closedThrough;rebuilt.ready=true;rebuilt.historyLoading=true;
    const cutoff=priceObservationOrder(new Date(now).toISOString());
    const tokens = new Set<string>();
    let token: string | null = null;
    try {
      for (let page = 0; page < (this.daily?200:20); page++) {
        const query = new URLSearchParams({ symbols: this.symbol, start: new Date(this.start).toISOString(), end: new Date(now).toISOString(), feed: "sip", sort: "asc", limit: "10000" });
        if (token) query.set("page_token", token);
        const result = await this.rest.get("/v2/stocks/trades", query) as { trades?: Record<string, Trade[]>; next_page_token?: unknown };
        if (generation !== this.generation) return;
        if (!result.trades || !Array.isArray(result.trades[this.symbol] ?? [])) throw Error("incomplete_chart_trades");
        for(const trade of result.trades[this.symbol]??[]){
          if(priceObservationOrder(trade.t)<=cutoff)rebuilt.apply(trade);
          if(!rebuilt.ready)throw Error("invalid_chart_trade");
        }
        const next = result.next_page_token;
        if (next === null || next === undefined || next === "") {
          for (const trade of this.buffered) {rebuilt.apply(trade);if(!rebuilt.ready)throw Error("invalid_chart_trade");}
          const retained:string[]=[];let discard=Math.max(0,rebuilt.seen.size-100_000);
          for(const key of rebuilt.seen){if(discard>0){discard--;continue;}retained.push(key);}
          this.minutes=rebuilt.minutes;this.seen=new Set(retained);this.recentKeys=retained;this.nextKey=retained.length%100_000;this.dirty=rebuilt.dirty;this.ready=true;
          this.buffered = []; return;
        }
        if (typeof next !== "string" || tokens.has(next)) throw Error("incomplete_chart_trades");
        tokens.add(next); token = next;
      }
      throw Error("incomplete_chart_trades");
    } catch { if (generation === this.generation) { this.ready = false; this.minutes.clear(); this.seen.clear(); this.recentKeys=[];this.nextKey=0;this.dirty.clear(); this.retryAt = Date.now() + 5_000; } }
    finally { if (generation === this.generation) this.warming = false; }
  }
  covers(time:number):boolean {return this.ready&&this.daily&&this.start/1000===time;}
  snapshot(): Candle[] { return this.ready ? [...this.minutes.values()].filter(value=>value.first!==null&&value.bar.volume>0).map(value=>({...value.bar})).sort((a,b)=>a.time-b.time) : []; }
  drain(): Candle[] {
    if (!this.ready) return [];
    const result = [...this.dirty].sort((a,b) => a-b).flatMap(time => { const bar = this.minutes.get(time)?.bar; return bar&&bar.volume>0 ? [{ ...bar }] : []; });
    this.dirty.clear(); return result;
  }
}
