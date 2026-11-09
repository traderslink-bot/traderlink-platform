import type {ServerResponse} from 'node:http';
import type {AlpacaQuoteReply} from './scanner-snapshots';
import {EVENT_GATEWAY_FLUSH_MS} from '../live/event-timing';

type Consumer={symbols:readonly string[];regularClose:number;response:ServerResponse;signatures:Map<string,string>;lastFull:number;lastSent:number};
/** Bounded fan-out over the same quote/session book used by HTTP consumers. */
export class ScannerStreamHub {
  private consumers=new Set<Consumer>();private dirty=new Set<string>();private running=false;
  private timer:ReturnType<typeof setInterval>;
  constructor(private readonly read:(symbols:readonly string[],regularClose:number)=>AlpacaQuoteReply,private readonly renew:(symbols:readonly string[])=>void){
    this.timer=setInterval(()=>this.flush(),EVENT_GATEWAY_FLUSH_MS);this.timer.unref();
  }
  add(symbols:readonly string[],regularClose:number,response:ServerResponse){
    if(this.consumers.size>=2)throw Error('busy');
    const consumer={symbols,regularClose,response,signatures:new Map<string,string>(),lastFull:0,lastSent:0};this.consumers.add(consumer);
    response.writeHead(200,{'Content-Type':'text/event-stream','X-Accel-Buffering':'no'});response.write(': scanner stream\n\n');
    response.on('close',()=>this.consumers.delete(consumer));this.renew(symbols);this.flush();
  }
  mark(symbol:string){this.dirty.add(symbol);}
  refresh(){for(const consumer of this.consumers)for(const symbol of consumer.symbols)this.dirty.add(symbol);}
  private flush(){
    if(this.running)return;this.running=true;const dirty=this.dirty;this.dirty=new Set();
    try{for(const consumer of this.consumers){
      const now=Date.now(),full=now-consumer.lastFull>=5000;
      const wanted=full?consumer.symbols:consumer.symbols.filter(symbol=>dirty.has(symbol));
      if(full){this.renew(consumer.symbols);consumer.lastFull=now;}
      const payload=this.read(wanted,consumer.regularClose);
      if(!payload.connected){consumer.signatures.clear();if(now-consumer.lastSent>=1000)this.send(consumer,{...payload,snapshots:{},sessionTotals:{},at:now});continue;}
      let batch:string[]=[],emitted=0;
      const emit=()=>{if(!batch.length)return;this.send(consumer,{feed:'sip',connected:true,at:now,snapshots:Object.fromEntries(batch.map(symbol=>[symbol,payload.snapshots[symbol]??null])),sessionTotals:Object.fromEntries(batch.map(symbol=>[symbol,payload.sessionTotals?.[symbol]??null]))});batch=[];};
      for(const symbol of wanted){
        const signature=JSON.stringify([payload.snapshots[symbol],payload.sessionTotals?.[symbol]]);
        if(signature===consumer.signatures.get(symbol))continue;
        if(emitted>=400){this.dirty.add(symbol);continue;}
        consumer.signatures.set(symbol,signature);batch.push(symbol);emitted++;if(batch.length===200)emit();
      }
      emit();if(now-consumer.lastSent>=5000)this.send(consumer,{feed:'sip',connected:true,at:now,snapshots:{},sessionTotals:{}});
    }}finally{this.running=false;}
  }
  private send(consumer:Consumer,value:unknown){
    if(consumer.response.destroyed)return;
    if(consumer.response.writableLength>2_000_000){consumer.response.destroy();return;}
    consumer.response.write(`event: snapshots\ndata: ${JSON.stringify(value)}\n\n`);consumer.lastSent=Date.now();
  }
  close(){clearInterval(this.timer);for(const consumer of this.consumers)consumer.response.end();this.consumers.clear();}
}
