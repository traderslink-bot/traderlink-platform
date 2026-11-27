import { afterEach, expect, it, vi } from "vitest";
const shared = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/src/modules/platform/server/broker-connections/moomoo-shared-transport",()=>({sharedMoomooFetch:shared.fetch}));
vi.mock("@/src/modules/watchlist/server/moomoo-watchlist-candle-bridge",()=>({withWatchlistIndicatorMoomooAccess:async(callback:(access:{token:string})=>unknown)=>callback({token:"fixture-private"})}));
import { moomooRequest, requestAuthorizedMoomooMarketData, requestMoomooMarketData } from "./server/moomoo-bridge";
afterEach(()=>{shared.fetch.mockReset();vi.unstubAllGlobals();});
function transportWith(response: Response) {
 const statuses: number[] = [];
 vi.stubGlobal("fetch", vi.fn(async () => response));
 shared.fetch.mockImplementation(async (url, init, options) => {
  const upstream = await options.fetcher(url, init);
  statuses.push(upstream.status);
  return upstream;
 });
 return statuses;
}
it("preserves raw extended-hours history, cursor pagination, and bounded snapshot batches",()=>{
 const start=Date.parse("2026-11-17T14:30:00Z"),end=Date.parse("2026-11-17T21:00:00Z");
 const query=new URL(moomooRequest({operation:"history",symbol:"AAA",timeframe:"1Min",start,end,nextTime:start+60000,pageToken:"a".repeat(48)}).url).searchParams;
 expect(Object.fromEntries(query)).toEqual({start:"2026-11-17",end:"2026-11-18",ktype:"1",autype:"0",num:"370",extended_time:"1",next_time:String(start+60000),page_token:"a".repeat(48)});
 expect(JSON.parse(moomooRequest({operation:"snapshots",symbols:["AAA","AAA","BBB"]}).body!)).toEqual({code_list:["US.AAA","US.BBB"]});
 expect(()=>moomooRequest({operation:"snapshots",symbols:Array(401).fill("AAA")})).toThrow("invalid_market_data_request");
 expect(()=>moomooRequest({operation:"calendar",start:"2026-02-31",end:"2026-03-04"})).toThrow("invalid_market_data_request");
});
it("always uses the existing shared budget, with scanner priority available and no upstream credentials returned",async()=>{
 transportWith(Response.json({ret_code:0,data:{snapshot_list:[]}}));
 const env={NODE_ENV:"development",TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED:"false"} as NodeJS.ProcessEnv;
 const result=await requestMoomooMarketData({operation:"snapshots",symbols:["AAA"]},env,undefined,"scanner");
 const [url,request,budget]=shared.fetch.mock.calls[0];
 expect(url).toBe("https://webapi.moomoo.com/api/v1.0/quote/snapshot");
 expect(request.headers.Authorization).toBe("Bearer fixture-private");
 expect(budget).toMatchObject({priority:"scanner",requireEnabled:true,environment:{TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED:"true"}});
 expect(env.TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED).toBe("false");expect(JSON.stringify(result)).not.toContain("fixture-private");
 transportWith(Response.json({ret_code:-1}));
 await expect(requestMoomooMarketData({operation:"rehab",symbol:"AAA"},env)).rejects.toThrow("moomoo_market_data_unavailable");
});
it.each([
 [429, "ret_code"],
 [200, "ret_code"],
 [200, "code"],
])("counts HTTP %i quota responses with %s toward the shared cooldown", async (status, field) => {
 const decisions = transportWith(Response.json({[field]:-11}, {status, headers: {"Retry-After": "37"}}));
 await expect(requestAuthorizedMoomooMarketData({operation:"rehab",symbol:"AAA"},"fixture"))
   .rejects.toMatchObject({message:"moomoo_market_data_rate_limited",retryAfter:"37"});
 expect(decisions).toEqual([429]);
});
