import {afterEach,describe,it,expect,vi} from "vitest";
import type {AddressInfo} from "node:net";
import {createAlpacaGateway} from "../../scanner/alpaca/gateway";
import {decodeGatewayWire, gatewayWirePath, gatewayWireUrl, encodeGatewayWire, GatewayWireFrames, gatewayWireQuery} from "./gateway-wire";
import {requestAlpacaGateway} from "../../scanner/alpaca/client";
const nativeFetch=globalThis.fetch;
class Socket extends EventTarget {static OPEN=1;readyState=0;send(){}close(){this.readyState=3;}}
afterEach(()=>vi.unstubAllGlobals());
describe("versioned gateway HTTP compatibility",()=>{
 it("serves original-price candles separately from adjusted history", async () => {
  const provider = vi.fn<typeof fetch>(async input => {
   const url = new URL(String(input));
   if (!url.pathname.endsWith("/bars")) return new Response(null, { status: 503 });
   const raw = url.searchParams.get("adjustment") === "raw";
   const price = raw ? 0.1065 : 3.195;
   return Response.json({ bars: { OPTT: [{
    t: "2026-09-11T14:30:00Z", o: price, h: price, l: price, c: price, v: raw ? 300 : 10,
   }] }, next_page_token: null });
  });
  vi.stubGlobal("fetch", provider);
  vi.stubGlobal("WebSocket", Socket);
  const gateway = createAlpacaGateway({ keyId: "fixture", secretKey: "fixture", token: "fixture" });
  await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/`;
  const headers = { Authorization: "Bearer fixture" };
  const query = new URLSearchParams({ symbol: "OPTT", timeframe: "1Min",
   start: String(Date.parse("2026-09-10T00:00:00Z")), end: String(Date.parse("2026-09-15T00:00:00Z")) });
  try {
   for (const [operation, adjustment, close, volume] of [
    ["history", "split", 3.195, 10], ["chart-unadjusted-history", "raw", 0.1065, 300],
   ] as const) {
    const response = await nativeFetch(gatewayWireUrl(base, operation, query), { headers });
    expect(response.status).toBe(200);
    expect(decodeGatewayWire(operation, await response.json())).toMatchObject({ adjustment, bars: [{ close, volume }] });
   }
  } finally {
   gateway.close();
   gateway.server.closeAllConnections();
  }
 });
 it("serves authenticated neutral routes and identical existing legacy history without extra upstream requests",async()=>{
  const provider=vi.fn(async()=>Response.json({bars:{SHFS:[{t:'2026-11-18T14:30:00Z',o:.0277,h:.0295,l:.0265,c:.029,v:12345}]},next_page_token:null}));vi.stubGlobal('fetch',provider);vi.stubGlobal('WebSocket',Socket);
  const gateway=createAlpacaGateway({keyId:'dummy-key',secretKey:'dummy-secret',token:'fixture-only-token'});
  await new Promise<void>(resolve=>gateway.server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/`,headers={Authorization:'Bearer fixture-only-token'};
  try{
   const denied=await nativeFetch(gatewayWireUrl(base,'health'));expect(denied.status).toBe(401);expect(provider).not.toHaveBeenCalled();
   const health=await nativeFetch(gatewayWireUrl(base,'health'),{headers});expect(decodeGatewayWire('health',await health.json())).toEqual({ready:true,feed:'sip'});
   const query=new URLSearchParams({symbol:'SHFS',timeframe:'1Day',start:String(Date.parse('2026-11-17T00:00:00Z')),end:String(Date.parse('2026-11-19T00:00:00Z')),adjustment:'raw'});
   const legacy=await nativeFetch(base+'history?'+query,{headers});const old=await legacy.json();expect(legacy.status).toBe(200);
   const modern=await nativeFetch(gatewayWireUrl(base,'history',query),{headers});const wire=await modern.json();expect(modern.status).toBe(200);expect(decodeGatewayWire('history',wire)).toEqual(old);expect(provider).toHaveBeenCalledTimes(1);
   expect(JSON.stringify(wire)).not.toMatch(/alpaca|APCA|dummy|"feed"|"high"|"low"|"close"|"open"|"volume"|"sip"|nextPageToken/);
  }finally{gateway.close();gateway.server.closeAllConnections();}
 });
 it.each(['scanner-stream','prices'] as const)("serves versioned %s subscriptions with legacy stream values",async operation=>{
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({})));vi.stubGlobal('WebSocket',Socket);
  const gateway=createAlpacaGateway({keyId:'dummy',secretKey:'dummy',token:'fixture-token'});
  await new Promise<void>(resolve=>gateway.server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/`;
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  try{
   const response=await nativeFetch(gatewayWireUrl(base,operation),{method:'POST',headers:{Authorization:'Bearer fixture-token','Content-Type':'application/json'},body:JSON.stringify({tickers:['SHFS'],...(operation==='scanner-stream'?{closeMinute:960}:{})}),signal:AbortSignal.timeout(5000)});
   expect(response.status).toBe(200);reader=response.body!.getReader();let text='';
   while(!/data: (.*)\n\n/.test(text)){const chunk=await reader.read();if(chunk.done)throw Error('missing frame');text+=new TextDecoder().decode(chunk.value);}
   const value=JSON.parse(/data: (.*)\n\n/.exec(text)![1]);expect(value.schema).toBe('traderslink.market.1');const domain=decodeGatewayWire(operation,value) as Record<string,unknown>;expect(domain.feed).toBe('sip');expect(domain.connected).toBe(false);expect(JSON.stringify(value)).not.toMatch(/alpaca|"feed"|"sip"/);
  }finally{await reader?.cancel();gateway.close();gateway.server.closeAllConnections();}
 });
 it("decodes the versioned client response without changing the domain contract or default legacy installation",async()=>{
  const domain={feed:'sip',connected:false,snapshots:{},sessionTotals:{}};const transport=vi.fn<typeof fetch>(async()=>Response.json(encodeGatewayWire('quotes',domain)));vi.stubGlobal('fetch',transport);
  const value=await requestAlpacaGateway('quotes',new URLSearchParams({symbols:'SHFS'}),{NODE_ENV:'production',TRADERLINK_ALPACA_GATEWAY_URL:'https://private.example/',TRADERLINK_ALPACA_GATEWAY_TOKEN:'dummy',TRADERLINK_GATEWAY_CONTRACT:'traderslink.market.1'});
  expect(value).toEqual(domain);expect(String(transport.mock.calls[0][0])).toBe('https://private.example/'+gatewayWirePath('quotes')+'?tickers=SHFS');expect(transport.mock.calls[0][1]?.headers).toEqual({Authorization:'Bearer dummy'});
 });
 it("rejects a monitor request without private authentication or current saved receipts before observing data", async () => {
  const observeScannerLevelsInterval = vi.fn(async () => undefined);
  const gateway = createAlpacaGateway({ keyId: "fixture", secretKey: "fixture", token: "monitor-fixture", observeScannerLevelsInterval });
  await new Promise<void>(resolve => gateway.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/`;
  const body = JSON.stringify({ regularId: "unretained" });
  try {
   expect((await nativeFetch(gatewayWireUrl(base, "accepted-map-monitor"), { method: "POST", body })).status).toBe(401);
   expect((await nativeFetch(gatewayWireUrl(base, "accepted-map-monitor"), {
    method: "POST", headers: { Authorization: "Bearer monitor-fixture" }, body,
   })).status).toBe(409);
   expect(observeScannerLevelsInterval).not.toHaveBeenCalled();
  } finally {
   gateway.close();
   gateway.server.closeAllConnections();
  }
 });
 it("reassembles fragmented JSON events without leaking wire names to chart consumers",()=>{
  const payload={bar:{time:1795000000,open:.0277,high:.0295,low:.0265,close:.029,volume:5000},daily:false};const text='retry: 3000\n\nevent: bar\ndata: '+JSON.stringify(encodeGatewayWire('stream',payload))+'\n\n';const bytes=new TextEncoder().encode(text),frames=new GatewayWireFrames('stream');let output='';for(let i=0;i<bytes.length;i+=7)output+=new TextDecoder().decode(frames.write(bytes.slice(i,i+7)));frames.finish();expect(output).toBe('retry: 3000\n\nevent: bar\ndata: '+JSON.stringify(payload)+'\n\n');
 });
 it("rejects truncated/oversized transport and duplicate query values",()=>{const frames=new GatewayWireFrames('stream');frames.write(new TextEncoder().encode('event: bar\ndata: {'));expect(()=>frames.finish()).toThrow('market_contract_invalid');expect(()=>new GatewayWireFrames('stream').write(new Uint8Array(2_000_001).fill(65))).toThrow('market_contract_invalid');expect(()=>gatewayWireQuery(new URLSearchParams('symbol=AAPL&symbol=SHFS'))).toThrow('market_contract_invalid');});
});
