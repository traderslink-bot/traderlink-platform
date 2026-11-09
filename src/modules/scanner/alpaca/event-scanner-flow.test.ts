// @vitest-environment node
import {expect,it,vi} from 'vitest';
import type {AddressInfo} from 'node:net';
import {createAlpacaGateway} from './gateway';
import {AlpacaScannerStream} from './scanner-stream';
import {normalizeAlpacaScannerBatch} from './scanner-snapshots';
import {LiveScannerFeed} from '../live/server/live-feed';
import {initialConfiguration} from '../live/settings';
import type {DailyUniverse} from '../live/contracts';
it('runs gateway → shared stream → scanner with no Moomoo calls, shares chart prices and withholds disconnected data',async()=>{
 let now=Date.parse('2026-11-06T15:00:00Z');const clock=vi.spyOn(Date,'now').mockImplementation(()=>now);const sockets:Socket[]=[];
 class Socket extends EventTarget{
  static OPEN=1;readyState=1;
  constructor(){super();sockets.push(this);queueMicrotask(()=>this.dispatchEvent(new Event('open')));}
  message(messages:unknown){this.dispatchEvent(Object.assign(new Event('message'),{data:JSON.stringify(messages)}));}
  send(value:string){const command=JSON.parse(value);if(command.action==='auth')queueMicrotask(()=>this.message([{T:'success',msg:'authenticated'}]));if(command.action==='subscribe')queueMicrotask(()=>this.message([{T:'subscription',trades:command.trades}]));}
  close(){this.readyState=3;this.dispatchEvent(new Event('close'));}
 }
 vi.stubGlobal('WebSocket',Socket);const nativeFetch=fetch;
 const provider=vi.fn(async(url:URL)=>{
  expect(url.hostname).toBe('data.alpaca.markets');
  if(url.pathname.endsWith('/snapshots'))return Response.json({AAA:{prevDailyBar:{t:'2026-11-05T05:00:00Z',c:1},latestQuote:{t:new Date(now).toISOString(),bp:1.99,ap:2.01}}});
  if(url.pathname.endsWith('/bars'))return Response.json({bars:{AAA:[{t:'2026-11-05T05:00:00Z',o:1,h:1,l:1,c:1,v:100}]}});
  if(url.pathname.endsWith('/trades'))return Response.json({trades:{AAA:[{S:'AAA',t:'2026-11-06T14:59:59Z',p:2,s:500000,i:1,x:'V',c:['@'],z:'C'}]}});
  throw Error('unexpected provider route');
 });
 vi.stubGlobal('fetch',provider);const gateway=createAlpacaGateway({keyId:'test-key',secretKey:'test-secret',token:'scanner-test'});
 await new Promise<void>(resolve=>gateway.server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`;
 const source=new AlpacaScannerStream({NODE_ENV:'development',TRADERLINK_ALPACA_GATEWAY_URL:origin,TRADERLINK_ALPACA_GATEWAY_TOKEN:'scanner-test'},nativeFetch);
 const universe:DailyUniverse={version:1,tradingDate:'2026-11-06',acceptedAtUtc:new Date(now).toISOString(),lastCollectionAtUtc:new Date(now).toISOString(),latestUploadCount:1,sourceHashes:['synthetic'],stocks:[{symbol:'AAA',exchange:'NASDAQ',marketCapAtCollection:10000000}]};
 const feed=new LiveScannerFeed({configuration:async()=>({...initialConfiguration(),enabled:true}),marketDay:async()=>({date:'2026-11-06',verified:true,open:true,regularCloseEastern:'16:00',extendedCloseEastern:'20:00'}),universe:async()=>universe,reserveScannerBudget:async()=>{},snapshotPass:async batches=>{source.configure(batches.flat(),'2026-11-06',960);return batches.map(requestedSymbols=>({requestedSymbols,payload:source.read(requestedSymbols),receivedAt:now}));},floats:async()=>new Map([['AAA',{shares:1000000,retrievedAtUtc:'2026-11-06T14:00:00Z'}]]),news:async()=>new Map(),qualification:()=>({sessionTimestampVerified:true,sessionCountersVerified:true,afterHoursRegularCloseVerified:true}),normalizeBatch:normalizeAlpacaScannerBatch,eventDriven:true,now:()=>now});
 try{
  await feed.scanOnce();await vi.waitFor(()=>expect(sockets.length).toBe(1));now+=5000;
  await vi.waitFor(()=>{now+=250;expect(source.read(['AAA']).sessionTotals?.AAA?.complete).toBe(true);},{timeout:3000});
  expect((await feed.scanOnce()).gainers.rows[0].price).toBe(2);
  const chart=await nativeFetch(origin+'/stream?symbol=AAA',{headers:{Authorization:'Bearer scanner-test'}});const reader=chart.body!.getReader();
  now+=1000;sockets[0].message([{T:'t',S:'AAA',t:new Date(now).toISOString(),p:2.2,s:1000,i:2,x:'V',c:['@'],z:'C'}]);
  await vi.waitFor(()=>expect(source.read(['AAA']).sessionTotals?.AAA?.sessions.regular.price).toBe(2.2));
  const updated=await feed.scanOnce();expect(updated.gainers.rows[0].price).toBe(2.2);expect(updated.gainers.rows[0].volume).toBe(501000);expect(updated.refreshAfterMs).toBe(1000);expect(sockets).toHaveLength(1);
  let text='';while(!text.includes('event: price')){const part=await reader.read();if(part.done)throw Error('chart ended');text+=new TextDecoder().decode(part.value);}expect(text).toContain('"price":2.2');await reader.cancel();
  sockets[0].close();now+=1000;await vi.waitFor(()=>expect(source.read(['AAA']).connected).toBe(false));expect((await feed.scanOnce()).gainers.rows).toEqual([]);expect(provider).toHaveBeenCalled();
 }finally{source.stop();gateway.close();gateway.server.closeAllConnections();clock.mockRestore();vi.unstubAllGlobals();}
},10000);
