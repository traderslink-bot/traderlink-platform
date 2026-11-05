import {describe,expect,it,vi} from "vitest";
import {EodhdHaltResumptionMonitor} from "./eodhd-halt-resumption-monitor";

class FakeSocket {
  readyState=1;sent:string[]=[];closed=false;listeners=new Map<string,((event:Event|MessageEvent)=>void)[]>();
  addEventListener(type:string,listener:(event:Event|MessageEvent)=>void){this.listeners.set(type,[...(this.listeners.get(type)??[]),listener]);}
  send(value:string){this.sent.push(value);}
  close(){this.closed=true;}
  emit(type:string,event:Event|MessageEvent=new Event(type)){for(const listener of this.listeners.get(type)??[])listener(event);}
}
describe("EODHD halt resumption monitor",()=>{
  it("subscribes once and marks a halt resumed on the first valid US trade",()=>{
    const socket=new FakeSocket(),factory=vi.fn(()=>socket),monitor=new EodhdHaltResumptionMonitor("secret",factory);
    monitor.sync([{id:"halt-1",ticker:"AEHL"}]);socket.emit("open",new Event("open"));
    expect(JSON.parse(socket.sent[0]!)).toEqual({action:"subscribe",symbols:"AEHL"});
    socket.emit("message",new MessageEvent("message",{data:JSON.stringify({s:"AEHL",p:4.2,v:100,t:Date.now(),ms:"open"})}));
    expect([...monitor.resumedHaltIds()]).toEqual(["halt-1"]);
    expect(JSON.parse(socket.sent.at(-1)!)).toEqual({action:"unsubscribe",symbols:"AEHL"});
  });
  it("ignores quote, status and malformed frames that are not actual trades",()=>{
    const socket=new FakeSocket(),monitor=new EodhdHaltResumptionMonitor("secret",()=>socket);
    monitor.sync([{id:"halt-1",ticker:"AEHL"}]);socket.emit("open",new Event("open"));
    for(const data of [{s:"AEHL",ap:4.2,t:1},{s:"AEHL",h:"T",t:1},{s:"AEHL",p:4.2,v:0,t:1}])socket.emit("message",new MessageEvent("message",{data:JSON.stringify(data)}));
    expect(monitor.resumedHaltIds().size).toBe(0);
    socket.emit("message",new MessageEvent("message",{data:JSON.stringify({s:"AEHL",p:4.2,v:1,t:Date.now()-60_000})}));
    expect(monitor.resumedHaltIds().size).toBe(0);
  });
  it("replaces a prior lifecycle when the same ticker halts again",()=>{
    const socket=new FakeSocket(),monitor=new EodhdHaltResumptionMonitor("secret",()=>socket);
    monitor.sync([{id:"halt-1",ticker:"AEHL"}]);socket.emit("open",new Event("open"));socket.emit("message",new MessageEvent("message",{data:JSON.stringify({s:"AEHL",p:4.2,v:1,t:Date.now()})}));
    monitor.sync([{id:"halt-2",ticker:"AEHL"}]);
    expect(monitor.resumedHaltIds().size).toBe(0);expect(JSON.parse(socket.sent.at(-1)!)).toEqual({action:"subscribe",symbols:"AEHL"});
  });
});
