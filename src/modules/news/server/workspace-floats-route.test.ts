// @vitest-environment node
import {afterEach,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({news:true,watchlist:true,marketTools:false,identity:vi.fn(()=>({scope:{userId:"one"}})),floats:vi.fn(async()=>({AAA:{shares:260000}})),universe:vi.fn(async()=>({stocks:[{symbol:"AAA",exchange:"NASDAQ"},{symbol:"OTHER",exchange:"NYSE"}]}))}));
vi.mock("../../platform/server/authentication/require-platform-request-scope",()=>({requireTraderLinkPlatformRequestIdentity:state.identity}));
vi.mock("@/src/modules/market-data/server/market-tools-dashboard-access",()=>({hasSharedWorkspaceAccess:()=>state.marketTools}));
vi.mock("./press-release-dashboard-access",()=>({hasPressReleaseDashboardAccess:()=>state.news}));
vi.mock("../../watchlist/server/access/watchlist-dashboard-navigation-access",()=>({hasWatchlistDashboardNavigationAccess:()=>state.watchlist}));
vi.mock("../../scanner/live/server/runtime",()=>({readLiveScannerRuntime:()=>({tradingDate:"2026-11-21"}),scannerSettingsStore:()=>({readFloatFacts:vi.fn()}),scannerUniverseStore:()=>({readLatestOnOrBefore:state.universe})}));
vi.mock("@/src/lib/news/company-data-gateway",()=>({readCompanyData:vi.fn()}));
vi.mock("./market-events-floats",()=>({readMarketEventsFloats:state.floats}));
import {GET} from "@/app/api/platform/news/workspace-floats/route";
afterEach(()=>{state.news=true;state.watchlist=true;state.marketTools=false;state.identity.mockReset().mockReturnValue({scope:{userId:"one"}});vi.clearAllMocks();});
const request=(symbols="AAA")=>new Request("https://app.example/api/platform/news/workspace-floats?symbols="+symbols);
it("denies unauthorized and invalid requests before reading data",async()=>{
 state.news=false;expect((await GET(request())).status).toBe(404);state.news=true;state.watchlist=false;expect((await GET(request())).status).toBe(404);state.watchlist=true;
 expect((await GET(request("bad"))).status).toBe(400);expect((await GET(request(Array.from({length:11},(_,i)=>"A"+i).join(",")))).status).toBe(400);
 expect(state.floats).not.toHaveBeenCalled();expect(state.universe).not.toHaveBeenCalled();
});
it("returns only requested metadata under the existing access contract and rechecks access after IO",async()=>{
 const response=await GET(request());expect(response.status).toBe(200);expect(await response.json()).toEqual({tradingDate:"2026-11-21",exchanges:{AAA:"NASDAQ"},floats:{AAA:{shares:260000}}});
 state.identity.mockReturnValueOnce({scope:{userId:"one"}}).mockReturnValueOnce({scope:{userId:"other"}});
 expect((await GET(request())).status).toBe(404);
});

it("enriches Market Events for admitted tools when Watchlist is off and still requires News access", async () => {
  state.watchlist = false;
  state.marketTools = true;
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ floats: { AAA: { shares: 260000 } } });
  state.news = false;
  expect((await GET(request())).status).toBe(404);
  expect(state.floats).toHaveBeenCalledOnce();
});
