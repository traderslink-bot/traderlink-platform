// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { browserDataSession } from "./server/browser-data-session";
import { parseVwapSeedRequest, vwapSeedStart } from "@/src/modules/scanner/alpaca/chart-vwap-seed";
import { vwapAnchorKey } from "@/src/modules/scanner/alpaca/chart-indicators";
import { PRICE_SOURCES } from "@/src/modules/scanner/alpaca/chart-preferences";
import { easternClock } from "@/src/modules/scanner/live/sessions";

const state=vi.hoisted(()=>({selection:{provider:"alpaca" as "alpaca"|"moomoo",revision:0},authenticated:true,sharedChart:true,gateway:vi.fn(),alternative:vi.fn()}));
vi.mock('@/src/modules/market-data/server/chart-dashboard-access',()=>({hasSharedChartDataAccess:()=>state.sharedChart}));
vi.mock("./server/provider-settings",()=>({marketDataSelection:()=>({...state.selection})}));
vi.mock("@/src/modules/scanner/alpaca/client",()=>({requestAlpacaGateway:state.gateway}));
vi.mock("./server/moomoo-chart-response",()=>({readMoomooChartVwapSeed:state.alternative}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope",()=>({requireTraderLinkPlatformRequestIdentity:()=>{if(!state.authenticated)throw Error();return {};}}));
import { GET } from "@/app/api/charts/vwap-seed/route";

const parameters=()=>new URLSearchParams({symbol:"SHFS",timeframe:"5m",anchor:"Session",before:String(Math.floor(Date.now()/1000)-60),premarket:"1",regular:"1",postmarket:"1"});
function seed(query:URLSearchParams){
 const request=parseVwapSeedRequest(query),basisDate=easternClock(Date.now()).date;
 return {complete:true,request,basisDate,anchorKey:vwapAnchorKey(easternClock(request.before*1000).date,request.anchor),start:vwapSeedStart(request),volume:100,sums:Object.fromEntries(PRICE_SOURCES.map(source=>[source,200]))};
}
afterEach(()=>{state.selection={provider:"alpaca",revision:0};state.authenticated=true;state.sharedChart=true;state.gateway.mockReset();state.alternative.mockReset();});

it("keeps VWAP sums identical across sources while its browser generation stays neutral",async()=>{
 const params=parameters(),expected=seed(params);
 state.gateway.mockResolvedValue(expected);state.alternative.mockResolvedValue(expected);
 for(const [provider,revision] of [["alpaca",0],["moomoo",1],["alpaca",2]] as const){
  state.selection={provider,revision};params.set("generation",browserDataSession("charts",state.selection).generation);
  const response=await GET(new Request("https://app.example/api/charts/vwap-seed?"+params));
  expect(response.status).toBe(200);expect(await response.json()).toEqual(expected);
 }
 expect(state.gateway).toHaveBeenCalledTimes(2);expect(state.alternative).toHaveBeenCalledTimes(1);
});

it("rejects stale and in-flight changed sessions without returning the old sums",async()=>{
 const params=parameters(),old=browserDataSession("charts",state.selection).generation;params.set("generation",old);
 state.selection={provider:"moomoo",revision:1};
 expect((await GET(new Request("https://app.example/api/charts/vwap-seed?"+params))).status).toBe(409);
 expect(state.gateway).not.toHaveBeenCalled();expect(state.alternative).not.toHaveBeenCalled();
 state.selection={provider:"alpaca",revision:0};
 state.gateway.mockImplementation(async()=>{state.selection={provider:"moomoo",revision:2};return seed(params);});
 expect((await GET(new Request("https://app.example/api/charts/vwap-seed?"+params))).status).toBe(409);
 state.authenticated=false;
 expect((await GET(new Request("https://app.example/api/charts/vwap-seed?"+params))).status).toBe(401);
});

it('strips extra seed metadata and contains both sources thrown failures',async()=>{
 const params=parameters(),expected=seed(params);state.gateway.mockResolvedValue({...expected,provider:'alpaca',sourceUrl:'https://private.invalid',request:{...expected.request,provider:'alpaca'}});
 expect(await(await GET(new Request('https://app.example/api?'+params))).json()).toEqual(expected);
 for(const provider of ['alpaca','moomoo'] as const){state.selection={provider,revision:3};state.gateway.mockRejectedValue(Error('Alpaca private-value'));state.alternative.mockRejectedValue(Error('Moomoo private-value'));
  const response=await GET(new Request('https://app.example/api?'+params));expect(response.status).toBe(503);expect(await response.json()).toEqual({error:'vwap_history_unavailable'});}
});

it("denies a VWAP seed before reading either provider without shared chart access", async () => {
  state.sharedChart = false;
  const request = new Request("https://app.example/api/charts/vwap-seed?" + parameters());
  expect((await GET(request)).status).toBe(403);
  expect(state.gateway).not.toHaveBeenCalled();
  expect(state.alternative).not.toHaveBeenCalled();
});
