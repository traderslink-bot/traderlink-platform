import "server-only";

type HaltSubscription=Readonly<{id:string;ticker:string}>;
type TrackedHalt=HaltSubscription&Readonly<{subscribedAfter:number}>;
type SocketLike=Pick<WebSocket,"close"|"readyState"|"send">&{
  addEventListener(type:"open"|"message"|"close"|"error",listener:(event:Event|MessageEvent)=>void):void;
};
type SocketFactory=(url:string)=>SocketLike;

const OPEN=1;
const RECONNECT_MS=2_000;
const MAX_RECONNECT_MS=60_000;

export class EodhdHaltResumptionMonitor {
  private socket:SocketLike|null=null;
  private reconnect:ReturnType<typeof setTimeout>|null=null;
  private tracked=new Map<string,TrackedHalt>();
  private resumed=new Set<string>();
  private stopped=false;
  private reconnectDelay=RECONNECT_MS;
  constructor(private readonly token:string|undefined,private readonly socketFactory:SocketFactory=url=>new WebSocket(url)){}
  sync(halts:readonly HaltSubscription[]):void{
    const latest=new Map<string,HaltSubscription>();
    for(const halt of halts)if(!latest.has(halt.ticker))latest.set(halt.ticker,halt);
    const validIds=new Set([...latest.values()].map(halt=>halt.id));
    for(const id of this.resumed)if(!validIds.has(id))this.resumed.delete(id);
    const removed=[...this.tracked.keys()].filter(ticker=>!latest.has(ticker));
    const added=[...latest].filter(([ticker,halt])=>this.tracked.get(ticker)?.id!==halt.id&&!this.resumed.has(halt.id)).map(([ticker])=>ticker);
    const now=Date.now();
    this.tracked=new Map([...latest].filter(([,halt])=>!this.resumed.has(halt.id)).map(([ticker,halt])=>{
      const previous=this.tracked.get(ticker);
      return [ticker,previous?.id===halt.id?previous:{...halt,subscribedAfter:now}];
    }));
    if(removed.length)this.command("unsubscribe",removed);
    if(!this.token||this.tracked.size===0){if(this.tracked.size===0)this.disconnect();return;}
    if(!this.socket)this.connect();else if(added.length)this.command("subscribe",added);
  }
  resumedHaltIds():ReadonlySet<string>{return new Set(this.resumed);}
  stop():void{this.stopped=true;this.disconnect();}
  private connect():void{
    if(!this.token||this.socket||this.stopped||this.tracked.size===0)return;
    const url=`wss://ws.eodhistoricaldata.com/ws/us?api_token=${encodeURIComponent(this.token)}`;
    const socket=this.socketFactory(url);this.socket=socket;
    socket.addEventListener("open",()=>{if(this.socket===socket){this.reconnectDelay=RECONNECT_MS;this.command("subscribe",[...this.tracked.keys()]);}});
    socket.addEventListener("message",event=>{if(this.socket!==socket||!("data" in event))return;this.receive(String(event.data));});
    const closed=()=>{if(this.socket!==socket)return;this.socket=null;if(!this.stopped&&this.tracked.size&&!this.reconnect){const delay=this.reconnectDelay;this.reconnectDelay=Math.min(MAX_RECONNECT_MS,this.reconnectDelay*2);this.reconnect=setTimeout(()=>{this.reconnect=null;this.connect();},delay);}};
    socket.addEventListener("close",closed);socket.addEventListener("error",closed);
  }
  private receive(raw:string):void{
    try{
      const event=JSON.parse(raw) as {s?:unknown;t?:unknown;p?:unknown;v?:unknown};
      if(typeof event.s!=="string"||typeof event.t!=="number"||typeof event.p!=="number"||typeof event.v!=="number"||event.t<=0||event.p<=0||event.v<=0)return;
      const ticker=event.s.trim().toUpperCase(),halt=this.tracked.get(ticker);if(!halt||event.t<halt.subscribedAfter)return;
      this.resumed.add(halt.id);this.tracked.delete(ticker);this.command("unsubscribe",[ticker]);
    }catch{/* Ignore authorization, status and malformed frames. */}
  }
  private command(action:"subscribe"|"unsubscribe",symbols:readonly string[]):void{
    if(!symbols.length||this.socket?.readyState!==OPEN)return;
    this.socket.send(JSON.stringify({action,symbols:symbols.join(",")}));
  }
  private disconnect():void{if(this.reconnect){clearTimeout(this.reconnect);this.reconnect=null;}this.socket?.close();this.socket=null;this.reconnectDelay=RECONNECT_MS;}
}

const state=globalThis as typeof globalThis&{__traderlinkEodhdHaltMonitor?:EodhdHaltResumptionMonitor};
export function eodhdHaltResumptionMonitor(environment:NodeJS.ProcessEnv=process.env):EodhdHaltResumptionMonitor{
  return state.__traderlinkEodhdHaltMonitor??=new EodhdHaltResumptionMonitor(environment.EODHD_API_TOKEN?.trim());
}
export function eodhdResumedHaltIds():ReadonlySet<string>{return state.__traderlinkEodhdHaltMonitor?.resumedHaltIds()??new Set();}
