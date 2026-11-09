import type { ServerResponse } from "node:http";
import { alpacaMinuteTradeRules } from "./session-book";

export type LivePrice = { price: number; providerObservedAt: string; receiptAt: number };
export type LivePriceFrame = { protocolVersion: 1; feed: "sip"; connected: boolean; kind: "snapshot" | "delta" | "status"; emittedAt: number; prices: Record<string, LivePrice> };
type Consumer = { symbols: readonly string[]; response: ServerResponse; dirty: Set<string>; lastSent: number; initial: boolean };
export function priceObservationOrder(value: string) {
  const at = Date.parse(value);
  return Number.isFinite(at) ? new Date(at).toISOString().slice(0,19) + (value.match(/\.(\d+)Z$/)?.[1] ?? "").padEnd(9,"0") : "";
}
/** Independent Watchlist leases, sharing the gateway's single SIP socket. */
export class LivePriceHub {
  private consumers = new Set<Consumer>();
  private prices = new Map<string, LivePrice>();
  private connected = false;
  private timer: ReturnType<typeof setInterval>;
  constructor(private readonly changed: () => void, private readonly bootstrap: (symbols: readonly string[]) => Promise<void>) {
    this.timer=setInterval(()=>this.flush(),250);this.timer.unref();
  }
  symbols(): string[] { return [...new Set([...this.consumers].flatMap(consumer=>[...consumer.symbols]))]; }
  add(symbols: readonly string[], response: ServerResponse) {
    if(this.consumers.size>=8)throw Error("busy");
    const consumer:Consumer={symbols,response,dirty:new Set(),lastSent:0,initial:true};
    this.consumers.add(consumer);
    response.writeHead(200,{"Content-Type":"text/event-stream","X-Accel-Buffering":"no"});response.write(": live prices\n\n");
    response.on("close",()=>{
      this.consumers.delete(consumer);
      const wanted=new Set(this.symbols());for(const symbol of this.prices.keys())if(!wanted.has(symbol))this.prices.delete(symbol);
      this.changed();
    });
    this.changed();this.send(consumer,"status",{});
    void this.bootstrap(symbols).then(()=>{if(!this.consumers.has(consumer))return;this.snapshot(consumer);}).catch(()=>{ /* Absence stays unavailable; live trades can still populate. */ });
  }
  observe(symbol: string, value: unknown, receiptAt = Date.now()) {
    if(!this.consumers.size||!this.symbols().includes(symbol)||!value||typeof value!=="object")return;
    const trade=value as {p?:unknown;t?:unknown;c?:string[];z?:string};
    if(typeof trade.p!=="number"||!Number.isFinite(trade.p)||trade.p<=0||typeof trade.t!=="string"||!priceObservationOrder(trade.t))return;
    const rules=alpacaMinuteTradeRules(trade);if(!rules.known||!rules.prices)return;
    const previous=this.prices.get(symbol);
    if(previous&&priceObservationOrder(previous.providerObservedAt)>=priceObservationOrder(trade.t))return;
    this.prices.set(symbol,{price:trade.p,providerObservedAt:trade.t,receiptAt});
    for(const consumer of this.consumers)if(consumer.symbols.includes(symbol))consumer.dirty.add(symbol);
  }
  state(connected: boolean) {
    if(this.connected===connected)return;
    this.connected=connected;
    if(!connected)this.prices.clear();
    for(const consumer of this.consumers){consumer.dirty.clear();this.send(consumer,"status",{});}
    if(connected)for(const consumer of this.consumers)this.snapshot(consumer);
  }
  private snapshot(consumer:Consumer) {
    this.send(consumer,"snapshot",Object.fromEntries(consumer.symbols.flatMap(symbol=>{const price=this.prices.get(symbol);return price?[[symbol,price]]:[];})));
    consumer.initial=false;consumer.dirty.clear();
  }
  private flush() {
    for(const consumer of this.consumers){
      if(this.connected&&consumer.dirty.size){
        if(consumer.initial)this.snapshot(consumer);
        else this.send(consumer,"delta",Object.fromEntries([...consumer.dirty].flatMap(symbol=>{const price=this.prices.get(symbol);return price?[[symbol,price]]:[];})));
        consumer.dirty.clear();
      }
      if(Date.now()-consumer.lastSent>=5000)this.send(consumer,"status",{});
    }
  }
  private send(consumer:Consumer,kind:LivePriceFrame["kind"],prices:Record<string,LivePrice>) {
    if(consumer.response.destroyed)return;
    if(consumer.response.writableLength>2_000_000){consumer.response.destroy();return;}
    const frame:LivePriceFrame={protocolVersion:1,feed:"sip",connected:this.connected,kind,emittedAt:Date.now(),prices:this.connected?prices:{}};
    consumer.response.write(`event: prices\ndata: ${JSON.stringify(frame)}\n\n`);consumer.lastSent=frame.emittedAt;
  }
  close(){clearInterval(this.timer);for(const consumer of this.consumers)consumer.response.end();this.consumers.clear();this.prices.clear();}
}
