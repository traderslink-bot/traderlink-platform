// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {AlpacaScannerStream} from './scanner-stream';
import {ScannerStreamHub} from './scanner-stream-hub';
import {createAlpacaGateway} from './gateway';
import type {ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';
import {EventEmitter} from 'node:events';
const environment:NodeJS.ProcessEnv={NODE_ENV:'production',TRADERLINK_ALPACA_GATEWAY_URL:'https://gateway.example/',TRADERLINK_ALPACA_GATEWAY_TOKEN:'private-bearer'};
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals()});
it('uses one shared authenticated stream, merges updates, expires stale state and clears on disconnect',async()=>{
 let output!:ReadableStreamDefaultController<Uint8Array>;const cancel=vi.fn();
 const transport=vi.fn(async(_url:unknown,options?:RequestInit)=>{
   const stream=new ReadableStream<Uint8Array>({start(controller){output=controller;options?.signal?.addEventListener('abort',()=>{try{controller.error(Error('aborted'));}catch{}},{once:true});},cancel});
   return new Response(stream,{headers:{'Content-Type':'text/event-stream'}});
 });
 const source=new AlpacaScannerStream(environment,transport as typeof fetch);let changes=0;const unsubscribe=source.subscribe(()=>changes++);
 try{
  source.configure(['AAA','BBB'],'2026-11-06',960);await vi.waitFor(()=>expect(transport).toHaveBeenCalledTimes(1));source.configure(['BBB','AAA'],'2026-11-06',960);expect(transport).toHaveBeenCalledTimes(1);
  const send=(frame:unknown)=>output.enqueue(new TextEncoder().encode('event: snapshots\ndata: '+JSON.stringify(frame)+'\n\n'));
  send({feed:'sip',connected:true,at:Date.now(),snapshots:{AAA:{latestQuote:{bp:1,ap:1.01}}},sessionTotals:{AAA:null}});await vi.waitFor(()=>expect(source.read(['AAA']).connected).toBe(true));
  expect(source.read(['AAA']).snapshots.AAA?.latestQuote?.bp).toBe(1);expect(source.read(['AAA'],Date.now()+11000).connected).toBe(false);
  source.configure(['AAA','BBB','CCC'],'2026-11-06',960);expect(source.read(['AAA']).snapshots.AAA?.latestQuote?.bp).toBe(1);await vi.waitFor(()=>expect(transport).toHaveBeenCalledTimes(2));
  send({feed:'sip',connected:false,at:Date.now(),snapshots:{},sessionTotals:{}});await vi.waitFor(()=>expect(source.read(['AAA']).connected).toBe(false));expect(source.read(['AAA']).snapshots).toEqual({});
  expect(transport.mock.calls[0][1]?.headers).toMatchObject({Authorization:'Bearer private-bearer'});expect(JSON.parse(String(transport.mock.calls[0][1]?.body)).symbols).toEqual(['AAA','BBB']);expect(changes).toBeGreaterThan(1);
 }finally{unsubscribe();source.stop();}
});
it('coalesces same-symbol bursts and delivers no faster than 250ms with bounded fanout',async()=>{
 vi.useFakeTimers();let bp=1;const renew=vi.fn();
 const hub=new ScannerStreamHub(symbols=>({feed:'sip',connected:true,snapshots:Object.fromEntries(symbols.map(symbol=>[symbol,{latestQuote:{bp,ap:bp+.01}}])),sessionTotals:{}}),renew);
 const response=Object.assign(new EventEmitter(),{writeHead:vi.fn(),write:vi.fn(),end:vi.fn(),destroy:vi.fn(),destroyed:false,writableLength:0});
 try{hub.add(['AAA'],960,response as unknown as ServerResponse);response.write.mockClear();for(let i=0;i<100;i++){bp++;hub.mark('AAA');}await vi.advanceTimersByTimeAsync(249);expect(response.write).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(1);expect(response.write).toHaveBeenCalledOnce();expect(response.write.mock.calls[0][0]).toContain('"bp":101');response.emit('close');await vi.advanceTimersByTimeAsync(5000);expect(response.write).toHaveBeenCalledOnce();}finally{hub.close();}
});
it('authenticates and bounds the new gateway endpoint before opening any provider connection',async()=>{
 const gateway=createAlpacaGateway({keyId:'fake',secretKey:'fake',token:'gateway-test'});await new Promise<void>(resolve=>gateway.server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}/scanner-stream`;
 try{expect((await fetch(url,{method:'POST',body:'{}'})).status).toBe(401);expect((await fetch(url,{method:'POST',headers:{Authorization:'Bearer gateway-test'},body:JSON.stringify({symbols:['../BAD'],regularClose:960})})).status).toBe(400);}finally{gateway.close();gateway.server.closeAllConnections();}
});
it('spreads a large initial universe across bounded frames without losing deferred symbols',async()=>{
 vi.useFakeTimers();const symbols=Array.from({length:600},(_,index)=>'S'+index);
 const hub=new ScannerStreamHub(wanted=>({feed:'sip',connected:true,snapshots:Object.fromEntries(wanted.map(symbol=>[symbol,{latestQuote:{bp:1,ap:1.01}}])),sessionTotals:{}}),()=>{});
 const response=Object.assign(new EventEmitter(),{writeHead:vi.fn(),write:vi.fn(),end:vi.fn(),destroy:vi.fn(),destroyed:false,writableLength:0});
 const received=()=>response.write.mock.calls.flatMap(call=>{const line=String(call[0]).split('\n').find(line=>line.startsWith('data: '));return line?Object.keys(JSON.parse(line.slice(6)).snapshots):[]});
 try{hub.add(symbols,960,response as unknown as ServerResponse);expect(received()).toHaveLength(400);await vi.advanceTimersByTimeAsync(250);expect(new Set(received()).size).toBe(600);expect(response.destroy).not.toHaveBeenCalled();}finally{hub.close();}
});
