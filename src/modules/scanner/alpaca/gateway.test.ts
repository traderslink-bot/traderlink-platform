// @vitest-environment node
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as statusJournal from "./status-journal";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { createAlpacaGateway } from "./gateway";

afterEach(() => vi.unstubAllGlobals());
describe("private Alpaca gateway", () => {
  it("serves a cached exclusion list without treating broker restrictions as listing removals", async () => {
    const nativeFetch = globalThis.fetch;
    const upstream = vi.fn(async (url: string) => {
      expect(new URL(url).pathname).toBe("/v2/assets");
      return Response.json([
        {symbol:"OTCM",exchange:"OTC",status:"active",tradable:false},
        {symbol:"NXXT",exchange:"NASDAQ",status:"active",tradable:false},
        {symbol:"OLD",exchange:"NYSE",status:"inactive",tradable:false},
        {symbol:"OMH",exchange:"NASDAQ",status:"active",tradable:false},
        {symbol:"SMX",exchange:"NASDAQ",status:"inactive",tradable:false},
        {symbol:"SMX",exchange:"NASDAQ",status:"active",tradable:true},
      ]);
    });
    vi.stubGlobal("fetch",upstream);
    const gateway = createAlpacaGateway({keyId:"test",secretKey:"test",token:"test"});
    await new Promise<void>(resolve => gateway.server.listen(0,"127.0.0.1",resolve));
    try {
      const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/scanner-listings`;
      expect((await nativeFetch(url)).status).toBe(401);
      const request = () => nativeFetch(url,{headers:{Authorization:"Bearer test"}}).then(response => response.json());
      expect(await Promise.all([request(),request()])).toEqual([
        {excluded:["OTCM","OLD"]},{excluded:["OTCM","OLD"]},
      ]);
      expect(upstream).toHaveBeenCalledTimes(1);
    } finally { gateway.close(); gateway.server.closeAllConnections(); }
  });

  it("shares one upstream socket and closes it after the last chart disconnects", async () => {
    const sockets: FakeSocket[] = [];
    class FakeSocket extends EventTarget {
      static OPEN = 1;
      readyState = 1;
      sent: { action: string; bars?: string[] }[] = [];
      constructor() { super(); sockets.push(this); queueMicrotask(() => this.dispatchEvent(new Event("open"))); }
      message(data: unknown) { this.dispatchEvent(Object.assign(new Event("message"), { data: JSON.stringify(data) })); }
      send(value: string) {
        const command = JSON.parse(value); this.sent.push(command);
        if (command.action === "auth") queueMicrotask(() => this.message([{ T: "success", msg: "authenticated" }]));
        if (command.action === "subscribe") queueMicrotask(() => this.message([{ T: "subscription" }]));
      }
      close = vi.fn(() => { this.readyState = 3; this.dispatchEvent(new Event("close")); });
    }
    vi.stubGlobal("WebSocket", FakeSocket);
    const gateway = createAlpacaGateway({ keyId: "key", secretKey: "secret", token: "test-token" });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/stream?symbol=AAPL`;
    const auth = { headers: { Authorization: "Bearer test-token" } };
    try {
      const first = await fetch(url, auth), second = await fetch(url, auth);
      expect(sockets).toHaveLength(1);
      await first.body!.cancel();
      await vi.waitFor(() => expect(sockets[0].sent.some(command => command.action === "subscribe")).toBe(true));
      expect(sockets[0].close).not.toHaveBeenCalled();
      const reader = second.body!.getReader();
      sockets[0].message([{ T: "u", S: "AAPL", t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 123 }]);
      let output = "";
      while (!output.includes('"volume":123')) output += new TextDecoder().decode((await reader.read()).value);
      expect(output).toContain("event: bar"); expect(output).toContain('"daily":false');
      await reader.cancel();
      await vi.waitFor(() => expect(sockets[0].close).toHaveBeenCalledOnce());
    } finally { gateway.close(); gateway.server.closeAllConnections(); }
  });
  it("denies unauthenticated requests before provider access, validates symbols, caches history and masks provider errors", async () => {
    const nativeFetch = globalThis.fetch;
    const calendarRows = Array.from({ length: 365 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, index + 1));
      return { date: date.toISOString().slice(0, 10), open: "09:30", close: "16:00", weekday: date.getUTCDay() };
    }).filter(row => row.weekday !== 0 && row.weekday !== 6).map(({ date, open, close }) => ({ date, open, close }));
    const marketData = vi.fn<typeof fetch>(async () => Response.json({ bars: { AAPL: [{ t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 100 }] } }));
    const calendar = vi.fn<typeof fetch>(async () => Response.json(calendarRows));
    const provider = vi.fn<typeof fetch>(async (input, init) => {
      const requested = new URL(String(input));
      if (requested.hostname === "data.alpaca.markets" && requested.pathname === "/v2/stocks/bars") return marketData(input, init);
      if (requested.hostname === "paper-api.alpaca.markets" && requested.pathname === "/v2/calendar") return calendar(input, init);
      throw Error("unexpected_test_provider_request");
    });
    vi.stubGlobal("fetch", provider);
    const gateway = createAlpacaGateway({ keyId: "private-key", secretKey: "private-secret", token: "test-gateway-token" });
    await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`;
    const auth = { headers: { Authorization: "Bearer test-gateway-token" } };
    try {
      expect((await nativeFetch(`${url}/bars?symbol=AAPL`)).status).toBe(401);
      expect(provider).not.toHaveBeenCalled();
      expect((await nativeFetch(`${url}/bars?symbol=../AAPL`, auth)).status).toBe(400);
      expect(provider).not.toHaveBeenCalled();
      const response = await nativeFetch(`${url}/bars?symbol=AAPL`, auth);
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.bars).toHaveLength(1); expect(result.feed).toBe("sip"); expect(result.adjustment).toBe("split");
      expect(result.calendar).toEqual({ available: true, start: "2026-01-01", end: "2026-12-31", sessions: calendarRows });
      const repeated = await nativeFetch(`${url}/bars?symbol=AAPL`, auth);
      expect(repeated.status).toBe(200);
      expect(await repeated.json()).toEqual(result);
      expect(marketData).toHaveBeenCalledTimes(1);
      expect(calendar).toHaveBeenCalledTimes(1);
      expect(provider).toHaveBeenCalledTimes(2);
      const calendarRequest = new URL(String(calendar.mock.calls[0][0]));
      expect(calendarRequest.searchParams.get("start")).toBe("2026-01-01");
      expect(calendarRequest.searchParams.get("end")).toBe("2026-12-31");
      const requested = new URL(String(marketData.mock.calls[0][0]));
      expect(requested.hostname).toBe("data.alpaca.markets");
      expect(requested.searchParams.get("feed")).toBe("sip");
      expect(requested.searchParams.get("adjustment")).toBe("split");
      expect(requested.searchParams.get("sort")).toBe("desc");
      marketData.mockImplementationOnce(async () => { throw Error("private-secret"); });
      const failed = await nativeFetch(`${url}/bars?symbol=MSFT`, auth);
      expect(failed.status).toBe(502);
      expect(await failed.text()).not.toContain("private-secret");
      expect(marketData).toHaveBeenCalledTimes(2);
      expect(calendar).toHaveBeenCalledTimes(1);
    } finally { gateway.close(); gateway.server.closeAllConnections(); }
  });
  it("streams the open candle and volume from trades before any completed minute bar", async () => {
    const nativeFetch = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ trades: { AAA: [] } })));
    const sockets: FakeSocket[] = [];
    class FakeSocket extends EventTarget {
      static OPEN=1; readyState=1;
      constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event("open")));}
      message(data:unknown){this.dispatchEvent(Object.assign(new Event("message"),{data:JSON.stringify(data)}));}
      send(value:string){const command=JSON.parse(value);if(command.action==="auth")queueMicrotask(()=>this.message([{T:"success",msg:"authenticated"}]));if(command.action==="subscribe")queueMicrotask(()=>this.message([{T:"subscription",trades:command.trades}]));}
      close(){this.readyState=3;this.dispatchEvent(new Event("close"));}
    }
    vi.stubGlobal("WebSocket",FakeSocket);
    const gateway=createAlpacaGateway({keyId:"test",secretKey:"test",token:"test"});
    await new Promise<void>(resolve=>gateway.server.listen(0,"127.0.0.1",resolve));
    const abort=new AbortController();
    try{
      const response=await nativeFetch(`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/stream?symbol=AAA`,{headers:{Authorization:"Bearer test"},signal:abort.signal});
      const priceResponse=await nativeFetch(`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/prices`,{method:"POST",headers:{Authorization:"Bearer test","Content-Type":"application/json"},body:JSON.stringify({symbols:["AAA","BBB"]}),signal:abort.signal});
      expect(priceResponse.status).toBe(200);
      const priceReader=priceResponse.body!.getReader();
      const dailyResponse=await nativeFetch(`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/stream?symbol=AAA&daily=1`,{headers:{Authorization:"Bearer test"},signal:abort.signal});
      const dailyReader=dailyResponse.body!.getReader();
      const reader=response.body!.getReader();
      await vi.waitFor(()=>expect(sockets).toHaveLength(1));
      const timestamp=new Date().toISOString();
      sockets[0].message([{T:"t",S:"AAA",i:1,x:"V",p:2,s:100,t:timestamp,c:["@"],z:"C"}]);
      let output="";
      while(!output.includes('"provisional":true'))output+=new TextDecoder().decode((await reader.read()).value);
      expect(output).toContain('event: price');expect(output).toContain('"price":2');expect(output).toContain('"volume":100');expect(output).toContain('"close":2');
      expect(sockets).toHaveLength(1);
      let prices="";
      while(!prices.includes('"price":2'))prices+=new TextDecoder().decode((await priceReader.read()).value);
      expect(prices).toContain('"protocolVersion":1');expect(prices).toContain('"providerObservedAt":"'+timestamp+'"');
      let daily="";while(!daily.includes('"provisional":true'))daily+=new TextDecoder().decode((await dailyReader.read()).value);
      expect(daily).toContain('"daily":true');expect(daily).toContain('"close":2');expect(daily).toContain('"volume":100');
      await reader.cancel();expect(sockets[0].readyState).toBe(1);
      await dailyReader.cancel();expect(sockets[0].readyState).toBe(1);
      await priceReader.cancel();
      await vi.waitFor(()=>expect(sockets[0].readyState).toBe(3));
    }finally{abort.abort();gateway.close();gateway.server.closeAllConnections();}
  });

  it("subscribes to halt status on the existing SIP socket without needing an open chart", async () => {
    const nativeFetch=globalThis.fetch;vi.stubGlobal("fetch",vi.fn(async()=>Response.json({trades:{OMH:[]}})));
    const sockets: FakeSocket[]=[];
    class FakeSocket extends EventTarget {
      static OPEN=1;readyState=1;sent:Record<string,unknown>[]=[];
      constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event("open")));}
      message(data:unknown){this.dispatchEvent(Object.assign(new Event("message"),{data:JSON.stringify(data)}));}
      send(value:string){const command=JSON.parse(value);this.sent.push(command);
        if(command.action==="auth")queueMicrotask(()=>this.message([{T:"success",msg:"authenticated"}]));
        if(command.action==="subscribe")queueMicrotask(()=>this.message([{T:"subscription",statuses:command.statuses,trades:command.trades}]));}
      close(){this.readyState=3;this.dispatchEvent(new Event("close"));}
    }
    vi.stubGlobal("WebSocket",FakeSocket);
    const gateway=createAlpacaGateway({keyId:"test",secretKey:"test",token:"test",haltSource:"alpaca"});
    await new Promise<void>(resolve=>gateway.server.listen(0,"127.0.0.1",resolve));
    const url=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/halts`;
    const auth={headers:{Authorization:"Bearer test"}};
    let chartReader:ReadableStreamDefaultReader<Uint8Array>|undefined;
    try{
      await vi.waitFor(()=>expect(sockets[0]?.sent.some(command=>Array.isArray(command.statuses)&&command.statuses.includes("*"))).toBe(true));
      const chartResponse=await nativeFetch(url.replace("/halts","/stream?symbol=OMH"),auth);chartReader=chartResponse.body!.getReader();
      sockets[0].message([{T:"s",S:"OMH",sc:"H",rc:"LUDP",rm:"Pause",z:"C",t:"2026-11-09T16:20:00Z"}]);
      let chartEvents="";while(!chartEvents.includes('"halted":true'))chartEvents+=new TextDecoder().decode((await chartReader.read()).value);
      expect(chartEvents).toContain("event: trading-status");
      const paused=await (await nativeFetch(url,auth)).json();
      expect(paused).toMatchObject({connected:true,statusesSubscribed:true,statuses:[{symbol:"OMH",halted:true}]});
      sockets[0].message([{T:"s",S:"OMH",sc:"Q",z:"C",t:"2026-11-09T16:24:00Z"}]);
      expect((await (await nativeFetch(url,auth)).json()).statuses[0].halted).toBe(true);
      sockets[0].message([{T:"s",S:"OMH",sc:"T",z:"C",t:"2026-11-09T16:25:00Z"}]);
      expect((await (await nativeFetch(url,auth)).json()).statuses[0].halted).toBe(false);
      expect(sockets).toHaveLength(1);
      expect((await nativeFetch(url)).status).toBe(401);
    }finally{await chartReader?.cancel();gateway.close();gateway.server.closeAllConnections();}
  });

  it.each([409,410])("keeps prices running when the isolated status subscription is rejected with %i", async code=>{
    const nativeFetch=globalThis.fetch;vi.stubGlobal("fetch",vi.fn(async()=>Response.json({})));
    const sockets:FakeSocket[]=[];
    class FakeSocket extends EventTarget{
      static OPEN=1;readyState=1;
      constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event("open")));}
      message(data:unknown){this.dispatchEvent(Object.assign(new Event("message"),{data:JSON.stringify(data)}));}
      send(value:string){const command=JSON.parse(value);
        if(command.action==="auth")queueMicrotask(()=>this.message([{T:"success",msg:"authenticated"}]));
        if(command.action==="subscribe")queueMicrotask(()=>this.message(command.statuses?[{T:"error",code,msg:"status subscription unavailable"}]:[{T:"subscription",statuses:[],trades:command.trades}]));}
      close(){this.readyState=3;this.dispatchEvent(new Event("close"));}
    }
    vi.stubGlobal("WebSocket",FakeSocket);
    const gateway=createAlpacaGateway({keyId:"test",secretKey:"test",token:"test",haltSource:"alpaca"});
    await new Promise<void>(resolve=>gateway.server.listen(0,"127.0.0.1",resolve));
    const url=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`,headers={Authorization:"Bearer test"};
    const abort=new AbortController();
    try{
      const response=await nativeFetch(url+"/prices",{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({symbols:["AAA"]}),signal:abort.signal});
      const reader=response.body!.getReader();
      await vi.waitFor(()=>expect(sockets).toHaveLength(1));
      const status=await(await nativeFetch(url+"/halts",{headers})).json();
      expect(status).toMatchObject({connected:true,statusesSubscribed:false});expect(sockets[0].readyState).toBe(1);
      sockets[0].message([{T:"t",S:"AAA",i:1,x:"V",p:2,s:100,t:new Date().toISOString(),c:["@"],z:"C"}]);
      let output="";while(!output.includes('"price":2'))output+=new TextDecoder().decode((await reader.read()).value);
      expect(output).toContain('"connected":true');
      sockets[0].message([{T:"error",code:402,msg:"auth failed"}]);
      expect(sockets[0].readyState).toBe(3);
      await reader.cancel();
    }finally{abort.abort();gateway.close();gateway.server.closeAllConnections();}
  });

  it.each(["appendFailure","corruptStartup"])("keeps prices healthy and hides unpersisted halt state after %s",async mode=>{
    const nativeFetch=globalThis.fetch;vi.stubGlobal("fetch",vi.fn(async()=>Response.json({trades:{OMH:[]}})));
    const directory=mkdtempSync(join(tmpdir(),"alpaca-journal-boundary-")),journalPath=join(directory,"statuses.jsonl");
    const evidence=JSON.stringify({T:"s",S:"OMH",sc:"H",t:"2026-11-09T16:20:00Z",z:"C",rc:"LUDP",rm:"Pause"})+'\n{"T":"s"';
    if(mode==="corruptStartup")writeFileSync(journalPath,evidence,{mode:0o600});
    const appendMany=vi.fn(()=>{throw Error("simulated fsync failure");});
    const mock=mode==="appendFailure"?vi.spyOn(statusJournal,"openStatusJournal").mockReturnValue({append:vi.fn(),appendMany,close:vi.fn()}):null;
    const sockets:FakeSocket[]=[];
    class FakeSocket extends EventTarget{
      static OPEN=1;readyState=1;statuses:string[]=[];trades:string[]=[];
      constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event("open")));}
      message(data:unknown){this.dispatchEvent(Object.assign(new Event("message"),{data:JSON.stringify(data)}));}
      send(value:string){const command=JSON.parse(value);
        if(command.action==="auth")queueMicrotask(()=>this.message([{T:"success",msg:"authenticated"}]));
        if(command.action==="subscribe"){
          if(command.statuses)this.statuses=command.statuses;if(command.trades)this.trades=command.trades;
          queueMicrotask(()=>this.message([{T:"subscription",statuses:this.statuses,trades:this.trades}]));
        }}
      close(){this.readyState=3;this.dispatchEvent(new Event("close"));}
    }
    vi.stubGlobal("WebSocket",FakeSocket);
    const gateway=createAlpacaGateway({keyId:"test",secretKey:"test",token:"test",haltSource:"alpaca",haltStatusJournal:journalPath});
    await new Promise<void>(resolve=>gateway.server.listen(0,"127.0.0.1",resolve));
    const url=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`,headers={Authorization:"Bearer test"};
    const abort=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
    try{
      const response=await nativeFetch(url+"/stream?symbol=OMH",{headers,signal:abort.signal});reader=response.body!.getReader();
      await vi.waitFor(()=>expect(sockets).toHaveLength(1));
      if(mode==="appendFailure")sockets[0].message([{T:"s",S:"OMH",sc:"H",t:"2026-11-09T16:20:00Z",z:"C",rc:"LUDP",rm:"Pause"},{T:"subscription",statuses:["*"],trades:["OMH"]}]);
      sockets[0].message([{T:"t",S:"OMH",i:1,x:"V",p:2,s:100,t:new Date().toISOString(),c:["@"],z:"C"}]);
      let output="";while(!output.includes("event: price"))output+=new TextDecoder().decode((await reader.read()).value);
      expect(output).not.toContain('"halted":true');expect(output).toContain('"price":2');
      expect(await(await nativeFetch(url+"/halts",{headers})).json()).toMatchObject({connected:true,statusesSubscribed:false});
      expect(sockets[0].readyState).toBe(1);
      if(mode==="appendFailure")expect(appendMany).toHaveBeenCalledOnce();
      else expect(readFileSync(journalPath,"utf8")).toBe(evidence);
    }finally{await reader?.cancel();abort.abort();gateway.close();gateway.server.closeAllConnections();mock?.mockRestore();rmSync(directory,{recursive:true,force:true});}
  });

});
