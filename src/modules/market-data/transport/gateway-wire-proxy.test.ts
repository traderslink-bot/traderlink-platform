// @vitest-environment node
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({selection:{provider:'alpaca' as const,revision:0}}));
vi.mock('@/src/modules/market-data/server/chart-dashboard-access',()=>({hasSharedChartDataAccess:()=>true}));
vi.mock('@/src/modules/market-data/server/provider-settings',()=>({marketDataSelection:()=>state.selection}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformRequestIdentity:()=>({mode:'platform_session',scope:{userId:'fixture-owner'}})}));
import {proxyAlpacaChart} from '../../scanner/alpaca/proxy';
import {AlpacaScannerStream} from '../../scanner/alpaca/scanner-stream';
import {encodeGatewayWire} from './gateway-wire';
const bar={time:1795104000,open:.0277,high:.0295,low:.0265,close:.029,volume:1234};
beforeEach(()=>{state.selection={provider:'alpaca',revision:0};vi.stubEnv('NODE_ENV','production');vi.stubEnv('TRADERLINK_GATEWAY_CONTRACT','traderslink.market.1');vi.stubEnv('TRADERLINK_ALPACA_GATEWAY_URL','https://gateway.example/market/');vi.stubEnv('TRADERLINK_ALPACA_GATEWAY_TOKEN','fixture-only');});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('versioned gateway consumer integration',()=>{
 it("uses the archive page start for the older Daily cursor without sending it to the browser", async () => {
  const pageStart = bar.time * 1000;
  const fetcher = vi.fn<typeof fetch>(async request => {
    expect(new URL(String(request)).searchParams.get("initialDaily")).toBe("1");
    return Response.json(encodeGatewayWire("history", {
      symbol:"SHFS", feed:"sip", adjustment:"split", complete:true, bars:[bar], chartPageStart:pageStart,
    }));
  });
  vi.stubGlobal("fetch", fetcher);
  const url = "https://app.example/api?symbol=SHFS&history=1&daily=1";
  const response = await proxyAlpacaChart(new Request(url+"&dailyStartup=1"), false);
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.nextBefore).toBe(pageStart-1);
  expect(data).not.toHaveProperty("chartPageStart");
  for (const suffix of ["&before="+pageStart,"&adjustment=raw"]) {
    expect((await proxyAlpacaChart(new Request(url+"&dailyStartup=1"+suffix), false)).status).toBe(400);
  }
  expect(fetcher).toHaveBeenCalledOnce();
  fetcher.mockImplementation(async () => Response.json(encodeGatewayWire("history", {
    symbol:"SHFS", feed:"sip", adjustment:"split", complete:true, bars:[bar], chartPageStart:pageStart+1000,
  })));
  expect((await proxyAlpacaChart(new Request(url+"&dailyStartup=1"), false)).status).toBe(503);
 });

 it('paints the browser contract from distinct wire candle names with no extra request',async()=>{const fetcher=vi.fn<typeof fetch>(async()=>Response.json(encodeGatewayWire('bars',{symbol:'SHFS',feed:'sip',adjustment:'split',bars:[bar],basisDate:'2026-11-19'})));vi.stubGlobal('fetch',fetcher);const response=await proxyAlpacaChart(new Request('https://app.example/api?symbol=SHFS'),false);expect(response.status).toBe(200);expect((await response.json()).bars).toEqual([bar]);expect(fetcher).toHaveBeenCalledTimes(1);expect(String(fetcher.mock.calls[0][0])).toBe('https://gateway.example/market/traderslink/v1/market/recent-candles?ticker=SHFS');});
 it('preserves paged history window and generation guard',async()=>{const fetcher=vi.fn<typeof fetch>(async()=>Response.json(encodeGatewayWire('history',{symbol:'SHFS',feed:'sip',adjustment:'split',bars:[bar],complete:true})));vi.stubGlobal('fetch',fetcher);const response=await proxyAlpacaChart(new Request('https://app.example/api?symbol=SHFS&history=1&before=1795104000000'),false);expect(response.status).toBe(200);expect((await response.json()).bars).toEqual([bar]);const url=new URL(String(fetcher.mock.calls[0][0]));expect(url.searchParams.get('resolution')).toBe('1Min');expect(url.searchParams.get('until')).toBe('1795104000000');fetcher.mockImplementation(async()=>{state.selection={provider:'alpaca',revision:1};return Response.json(encodeGatewayWire('history',{feed:'sip',adjustment:'split',bars:[bar],complete:true}));});expect((await proxyAlpacaChart(new Request('https://app.example/api?symbol=SHFS&history=1'),false)).status).toBe(409);});
 it('decodes price/bar events and cancels the existing upstream stream on chart close',async()=>{let controller!:ReadableStreamDefaultController<Uint8Array>;const cancel=vi.fn();const fetcher=vi.fn<typeof fetch>(async()=>new Response(new ReadableStream({start(c){controller=c;c.enqueue(new TextEncoder().encode('event: bar\ndata: '+JSON.stringify(encodeGatewayWire('stream',{bar,daily:false,provisional:true}))+'\n\n'));},cancel})));vi.stubGlobal('fetch',fetcher);const response=await proxyAlpacaChart(new Request('https://app.example/api?symbol=SHFS'),true),reader=response.body!.getReader();const first=await reader.read();expect(new TextDecoder().decode(first.value)).toContain(JSON.stringify(bar));expect(new TextDecoder().decode(first.value)).not.toContain('traderslink.market.1');await reader.cancel();expect(cancel).toHaveBeenCalled();expect(controller).toBeDefined();});
 it('contains a wrong resource or malformed reply in the existing fixed chart error',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>Response.json({schema:'traderslink.market.1',resource:'market-state',data:{error:'alpaca private url'}})));const response=await proxyAlpacaChart(new Request('https://app.example/api?symbol=SHFS'),false);expect(response.status).toBe(503);expect(await response.json()).toEqual({error:'chart_unavailable'});});
 it('merges versioned Scanner updates through one existing shared stream',async()=>{let output!:ReadableStreamDefaultController<Uint8Array>;const transport=vi.fn<typeof fetch>(async(_url,options)=>new Response(new ReadableStream<Uint8Array>({start(c){output=c;options?.signal?.addEventListener('abort',()=>{try{c.close();}catch{}});}})));const source=new AlpacaScannerStream({...process.env,TRADERLINK_GATEWAY_CONTRACT:'traderslink.market.1'},transport);try{source.configure(['SHFS'],'2026-11-19',960);await vi.waitFor(()=>expect(transport).toHaveBeenCalledOnce());output.enqueue(new TextEncoder().encode('event: snapshots\ndata: '+JSON.stringify(encodeGatewayWire('scanner-stream',{feed:'sip',connected:true,at:Date.now(),snapshots:{SHFS:{latestQuote:{bp:.0289,ap:.0291}}},sessionTotals:{SHFS:null}}))+'\n\n'));await vi.waitFor(()=>expect(source.read(['SHFS']).connected).toBe(true));expect(source.read(['SHFS']).snapshots.SHFS?.latestQuote?.bp).toBe(.0289);expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual({tickers:['SHFS'],closeMinute:960});}finally{source.stop();}});
});
