// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const gateway=vi.hoisted(()=>vi.fn());
vi.mock("@/src/modules/scanner/alpaca/client",()=>({alpacaMarketDataEnabled:()=>true,requestAlpacaGateway:gateway}));
vi.mock("./moomoo-watchlist-candle-bridge",()=>({withWatchlistIndicatorMoomooAccess:()=>{throw Error("Alpaca must not request Moomoo authorization");}}));
import { fetchWatchlistOvernightQuote } from "./moomoo-watchlist-overnight-quote";
import { normalizeOvernightLevelReference } from "@/src/lib/live-watchlist/overnight-level-reference";
afterEach(()=>{vi.useRealTimers();gateway.mockReset();});
const now=Date.parse("2026-11-09T03:00:00Z"),resumeAfter=Date.parse("2026-11-09T09:00:00Z");
it("preserves actual BOATS trade time independently from lookup time",async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);
  gateway.mockResolvedValue({feed:"boats",trade:{p:2,t:new Date(now-600000).toISOString()}});
  const result=await fetchWatchlistOvernightQuote("TEST");
  expect(result).toEqual({price:2,checkedAt:now,observedAt:now-600000,resumeAfter});
  expect(normalizeOvernightLevelReference(result)).toEqual(result);
});
it("retains legacy reference compatibility without inventing a trade time",()=>{
  const legacy={price:2,checkedAt:now,resumeAfter};
  expect(normalizeOvernightLevelReference(legacy)).toEqual(legacy);
  expect(normalizeOvernightLevelReference({...legacy,observedAt:now+60000})).toBeNull();
});
it("rejects another feed, a future trade or a trade outside the overnight window",async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);
  for(const value of [{feed:"sip",trade:{p:2,t:new Date(now).toISOString()}},
    {feed:"boats",trade:{p:2,t:new Date(now+60000).toISOString()}},
    {feed:"boats",trade:{p:2,t:"2026-11-06T22:00:00Z"}}]){
    gateway.mockResolvedValue(value);expect(await fetchWatchlistOvernightQuote("TEST")).toBeNull();
  }
});
