import 'server-only';
import { readFile } from 'node:fs/promises';
import { chartSymbol } from './candles';
import type { AlpacaQuoteReply } from './scanner-snapshots';

export type ScannerStreamFrame=AlpacaQuoteReply & {at:number};
/** One stream per shared scanner runtime, never one per dashboard/browser. */
export class AlpacaScannerStream {
  private key='';private context='';private symbols:readonly string[]=[];private controller:AbortController|undefined;
  private values:AlpacaQuoteReply={feed:'sip',connected:false,snapshots:{},sessionTotals:{}};
  private lastAt=0;private listeners=new Set<()=>void>();
  constructor(private readonly environment:NodeJS.ProcessEnv,private readonly transport:typeof fetch=fetch){}
  subscribe=(notify:()=>void)=>{this.listeners.add(notify);return()=>{this.listeners.delete(notify);};};
  private notify(){for(const listener of this.listeners)listener();}
  configure(symbols:readonly string[],date:string,regularClose:number){
    const wanted=[...new Set(symbols.map(chartSymbol))].sort();
    if(wanted.length>4000||![780,960].includes(regularClose))throw Error('invalid_scanner_subscription');
    const key=JSON.stringify([date,regularClose,wanted]);if(key===this.key)return;
    const context=JSON.stringify([date,regularClose]);
    this.controller?.abort();this.key=key;this.symbols=wanted;
    if(context!==this.context||!wanted.length)this.invalidate();
    else{
      // Membership edits do not discard valid history for unchanged symbols.
      // The existing gateway still owns the same upstream SIP subscription.
      this.values.snapshots=Object.fromEntries(wanted.filter(symbol=>symbol in this.values.snapshots).map(symbol=>[symbol,this.values.snapshots[symbol]]));
      this.values.sessionTotals=Object.fromEntries(wanted.filter(symbol=>symbol in (this.values.sessionTotals??{})).map(symbol=>[symbol,this.values.sessionTotals![symbol]]));
      this.notify();
    }
    this.context=context;
    if(!wanted.length)return;
    const controller=new AbortController();this.controller=controller;
    void this.consume(wanted,regularClose,controller);
  }
  read(requested:readonly string[],now=Date.now()):AlpacaQuoteReply {
    if(!this.values.connected||now-this.lastAt>10_000)return {feed:'sip',connected:false,snapshots:{},sessionTotals:{}};
    return {feed:'sip',connected:true,snapshots:Object.fromEntries(requested.map(symbol=>[symbol,this.values.snapshots[symbol]??null])),sessionTotals:Object.fromEntries(requested.map(symbol=>[symbol,this.values.sessionTotals?.[symbol]??null]))};
  }
  stop(){this.configure([],'',960);}
  private invalidate(){this.values={feed:'sip',connected:false,snapshots:{},sessionTotals:{}};this.lastAt=0;this.notify();}
  private async consume(symbols:readonly string[],regularClose:number,controller:AbortController){
    let failures=0;
    while(!controller.signal.aborted){
      let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
      let idle:ReturnType<typeof setTimeout>|undefined;
      const attempt=new AbortController();
      const abort=()=>attempt.abort();controller.signal.addEventListener('abort',abort,{once:true});
      if(controller.signal.aborted)abort();
      const arm=()=>{clearTimeout(idle);idle=setTimeout(abort,12_000);};
      try{
        const base=this.environment.TRADERLINK_ALPACA_GATEWAY_URL;if(!base)throw Error('gateway_missing');
        const url=new URL('scanner-stream',base.endsWith('/')?base:base+'/');
        const local=this.environment.NODE_ENV!=='production';
        if(url.username||url.password||url.search||url.hash||(url.protocol!=='https:'&&!(local&&url.protocol==='http:'&&url.hostname==='127.0.0.1')))throw Error('invalid_gateway');
        let token=this.environment.TRADERLINK_ALPACA_GATEWAY_TOKEN;
        if(local&&this.environment.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE)token=JSON.parse(await readFile(this.environment.TRADERLINK_ALPACA_GATEWAY_TOKEN_FILE,'utf8')).token;
        if(!token)throw Error('gateway_token_missing');
        arm();const response=await this.transport(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({symbols,regularClose}),signal:attempt.signal,redirect:'error',cache:'no-store'});
        if(!response.ok||!response.body)throw Error('stream_unavailable');
        reader=response.body.getReader();let buffer='';const decoder=new TextDecoder();
        while(!controller.signal.aborted){
          const {value,done}=await reader.read();if(done)throw Error('stream_ended');arm();
          buffer+=decoder.decode(value,{stream:true});if(buffer.length>2_000_000)throw Error('stream_overflow');
          let end:number;
          while((end=buffer.indexOf('\n\n'))>=0){
            const event=buffer.slice(0,end);buffer=buffer.slice(end+2);const line=event.split('\n').find(line=>line.startsWith('data: '));if(!line)continue;
            const frame=JSON.parse(line.slice(6)) as ScannerStreamFrame;
            if(frame.feed!=='sip'||typeof frame.connected!=='boolean'||!Number.isSafeInteger(frame.at)||!frame.snapshots||!frame.sessionTotals)throw Error('invalid_stream_frame');
            if(controller.signal.aborted)return;
            if(!frame.connected){this.invalidate();continue;}
            this.values.connected=true;this.lastAt=Date.now();failures=0;
            for(const symbol of Object.keys(frame.snapshots)){
              if(!this.symbols.includes(symbol))throw Error('unsubscribed_symbol');
              this.values.snapshots[symbol]=frame.snapshots[symbol];this.values.sessionTotals![symbol]=frame.sessionTotals[symbol]??null;
            }
            this.notify();
          }
        }
      }catch{if(!controller.signal.aborted)this.invalidate();}
      finally{clearTimeout(idle);attempt.abort();controller.signal.removeEventListener('abort',abort);await reader?.cancel().catch(()=>{});}
      if(!controller.signal.aborted){
        await new Promise<void>(resolve=>{const finish=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',finish);resolve();};const timer=setTimeout(finish,Math.min(30_000,1000*2**Math.min(failures++,5)));controller.signal.addEventListener('abort',finish,{once:true});});
      }
    }
  }
}
