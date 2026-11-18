import { afterEach, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({selection:{provider:"alpaca",revision:0},owner:true,changed:vi.fn(),bridge:vi.fn(),profile:{profile:"alpaca",revision:2,changing:false,synchronized:true},profileChange:vi.fn(),universe:vi.fn(),latest:vi.fn()}));
vi.mock("./server/provider-settings",()=>({MARKET_DATA_FEATURES:["scanners","screeners","charts","trade-analyzer","watchlist"],marketDataSelection:()=>state.selection,changeMarketDataProvider:state.changed}));
vi.mock("./server/moomoo-bridge",()=>({requestMoomooMarketData:state.bridge}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope",()=>({requireTraderLinkPlatformRequestIdentity:()=>{if(!state.owner)throw Error();return{};}}));
vi.mock("@/src/modules/platform/server/authentication/platform-mutation-request-security",()=>({requirePlatformMutationRequest:()=>{}}));
vi.mock("@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access",()=>({hasWatchlistDashboardNavigationAccess:()=>state.owner}));
vi.mock("@/src/modules/watchlist/server/moomoo-watchlist-candle-bridge",()=>({withWatchlistIndicatorMoomooAccess:async(callback:()=>unknown)=>callback()}));
vi.mock("@/src/modules/watchlist/server/watchlist-market-data-profile",()=>({readWatchlistMarketDataProfile:async()=>state.profile,changeWatchlistMarketDataProfile:state.profileChange}));
vi.mock("@/src/modules/scanner/live/server/universe-store",()=>({UniverseStore:class {read=state.universe;readLatestOnOrBefore=state.latest;}}));
vi.mock("@/src/modules/platform/server/database/platform-database-config",()=>({resolvePlatformDatabaseConfig:()=>({databasePath:"/tmp/provider-route-fixture/platform.sqlite"})}));
import {GET as internalGet,POST as internalPost} from "@/app/api/internal/market-data/route";
import {GET as adminGet,POST as adminPost} from "@/app/api/admin/market-data/route";
const token="f".repeat(48);
const post=(body:unknown)=>new Request("https://fixture.invalid/api",{method:"POST",headers:{authorization:"Bearer "+token},body:JSON.stringify(body)});
afterEach(()=>{vi.unstubAllEnvs();state.selection={provider:"alpaca",revision:0};state.owner=true;state.changed.mockReset();state.bridge.mockReset();state.profileChange.mockReset();state.profile={profile:"alpaca",revision:2,changing:false,synchronized:true};});
it("keeps internal selection/data behind the worker token and rejects stale source work before and after requests",async()=>{
 vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER","1");vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN",token);
 expect((await internalGet(new Request("https://fixture.invalid?feature=screeners"))).status).toBe(404);
 expect((await internalGet(new Request("https://fixture.invalid?feature=screeners",{headers:{authorization:"Bearer "+token}}))).status).toBe(200);
 const input={feature:"screeners",provider:"moomoo",revision:1,operation:"snapshots",symbols:["AAA"]};
 expect((await internalPost(post(input))).status).toBe(409);expect(state.bridge).not.toHaveBeenCalled();
 state.selection={provider:"moomoo",revision:1};state.bridge.mockImplementation(async()=>{state.selection={provider:"alpaca",revision:2};return {ret_code:0,data:{}};});
 expect((await internalPost(post(input))).status).toBe(409);
});
it("limits admin access and delegates Watchlist to its atomic profile facade",async()=>{
 state.owner=false;expect((await adminGet(new Request("https://fixture.invalid"))).status).toBe(404);expect((await adminPost(post({feature:"watchlist",provider:"moomoo",revision:2}))).status).toBe(404);
 state.owner=true;expect((await adminPost(post({feature:"watchlist",provider:"moomoo",revision:2}))).status).toBe(200);
 expect(state.profileChange).toHaveBeenCalledWith("previous",2);expect(state.changed).not.toHaveBeenCalled();
 expect((await adminPost(post({feature:"charts",provider:"moomoo",revision:0}))).status).toBe(200);
 expect(state.changed).toHaveBeenCalledWith("charts",0,"moomoo");
});
it("reports stale admin revisions without treating a failed switch as successful",async()=>{
 state.changed.mockRejectedValue(Error("provider_selection_conflict"));
 expect((await adminPost(post({feature:"charts",provider:"moomoo",revision:0}))).status).toBe(409);
 expect((await adminPost(post({feature:"charts",provider:"eodhd",revision:0}))).status).toBe(400);
});

it("returns the same persisted daily universe and configured pacing without collecting a separate roster",async()=>{
 vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER","1");vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN",token);
 vi.stubEnv("TRADERLINK_SCANNER_SNAPSHOT_SPACING_MS","2000");
 state.universe.mockResolvedValue(null);state.latest.mockResolvedValue({tradingDate:"2026-11-10",stocks:[{symbol:"AAA",exchange:"NASDAQ",marketCapAtCollection:10000000}]});
 const request=new Request("https://fixture.invalid?feature=screeners&operation=universe",{headers:{authorization:"Bearer "+token}});
 const response=await internalGet(request);expect(response.status).toBe(200);
 expect(await response.json()).toMatchObject({provider:"alpaca",revision:0,sourceTradingDate:"2026-11-10",stocks:[{symbol:"AAA"}]});
 expect(state.latest).toHaveBeenCalled();expect(state.bridge).not.toHaveBeenCalled();
 state.universe.mockImplementation(async()=>{state.selection={provider:"moomoo",revision:1};return {tradingDate:"2026-11-17",stocks:[]};});
 expect((await internalGet(request)).status).toBe(409);
});
