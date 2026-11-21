import { expect, it, vi } from "vitest";
import { scannerIndicatorResponse } from "./scanner-indicator-response";
import { browserDataSession } from "@/src/modules/market-data/server/browser-data-session";

const sourceSelection=vi.hoisted(()=>({provider:"alpaca",revision:0}));
vi.mock("server-only", () => ({}));
vi.mock("@/src/modules/market-data/server/provider-settings", () => ({
  marketDataSelection: () => ({...sourceSelection}),
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: (headers: Headers) => headers.get("x-test-viewer"),
}));
vi.mock("@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access", () => ({
  hasWatchlistDashboardNavigationAccess: (viewer: string | null) => Boolean(viewer),
}));

it("coalesces reads across authorized viewers, separates timeframes, and checks access on cache hits", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T15:00:30Z"));
  try {
    const request = (frame: string, viewer?: string) => new Request(
      `https://example.test/api/screeners/charts/bars?symbol=NWGL&frame=${frame}`,
      { headers: viewer ? { "x-test-viewer": viewer } : {} },
    );
    const start = Date.now() / 1000 - 360 * 60;
    const bars = Array.from({ length: 360 }, (_, i) => {
      const close = i < 355 ? 10 - i * 0.01 : 25;
      return { time: start + i * 60, open: close, high: close + 0.1, low: close - 0.1, close, volume: 100 };
    });
    const load = vi.fn(async () => Response.json({ symbol: "NWGL", feed: "sip", adjustment: "split", bars }));
    const [first, second] = await Promise.all([
      scannerIndicatorResponse(request("5m", "first"), load),
      scannerIndicatorResponse(request("5m", "second"), load),
    ]);
    expect(first.status).toBe(200);
    const payload = await first.json();
    expect(payload).toEqual(await second.json());
    expect(payload.rows).toEqual(expect.arrayContaining([expect.objectContaining({ name: "EMA", text: "9 above 20" })]));
    expect(payload).not.toHaveProperty("bars");
    expect(payload).not.toHaveProperty("readings");
    const detailedUrl = new URL(request("5m").url);
    detailedUrl.searchParams.set("details", "1");
    const detailed = await scannerIndicatorResponse(new Request(detailedUrl, { headers: { "x-test-viewer": "first" } }), load);
    expect(detailed.status).toBe(200);
    const { readings, ...compact } = await detailed.json();
    expect(compact).toEqual(payload);
    expect(readings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: "Moving averages", state: "Bullish alignment",
        value: expect.stringContaining("EMA20"),
        explanation: expect.stringContaining("price strength"),
      }),
    ]));
    expect(load).toHaveBeenCalledTimes(1);
    expect((await scannerIndicatorResponse(request("5m"), load)).status).toBe(404);
    expect((await scannerIndicatorResponse(request("1m", "first"), load)).status).toBe(200);
    vi.advanceTimersByTime(5 * 60_000);
    expect((await scannerIndicatorResponse(request("5m", "second"), load)).status).toBe(200);
    expect(load).toHaveBeenCalledTimes(3);
  } finally { vi.useRealTimers(); }
});

it("isolates cached reads by source revision and rejects a mismatched feed",async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-12T15:00:30Z"));
 try{
  sourceSelection.provider="alpaca";sourceSelection.revision=0;
  const request=()=>new Request("https://example.test/api/screeners/charts/bars?symbol=SWITCH&frame=5m",{headers:{"x-test-viewer":"viewer"}});
  const bars=Array.from({length:360},(_,i)=>({time:Date.now()/1000-(360-i)*60,open:2,high:2.1,low:1.9,close:2,volume:100}));
  const load=vi.fn(async(input:Request)=>{
   const query=new URL(input.url).searchParams;
   expect(query.get("provider")).toBe(sourceSelection.provider);
   expect(query.get("providerRevision")).toBe(String(sourceSelection.revision));
   return Response.json({symbol:"SWITCH",feed:sourceSelection.provider==="alpaca"?"sip":"moomoo",adjustment:"split",bars});
  });
  expect((await scannerIndicatorResponse(request(),load)).status).toBe(200);
  sourceSelection.provider="moomoo";sourceSelection.revision=1;
  expect((await scannerIndicatorResponse(request(),load)).status).toBe(200);
  expect((await scannerIndicatorResponse(request(),load)).status).toBe(200);expect(load).toHaveBeenCalledTimes(2);
  sourceSelection.provider="alpaca";sourceSelection.revision=2;
  expect((await scannerIndicatorResponse(request(),load)).status).toBe(200);expect(load).toHaveBeenCalledTimes(3);
  sourceSelection.provider="moomoo";sourceSelection.revision=3;
  load.mockResolvedValueOnce(Response.json({symbol:"SWITCH",feed:"sip",adjustment:"split",bars}));
  expect((await scannerIndicatorResponse(request(),load)).status).toBe(503);
  expect((await scannerIndicatorResponse(request(),load)).status).toBe(200);expect(load).toHaveBeenCalledTimes(5);
 }finally{sourceSelection.provider="alpaca";sourceSelection.revision=0;vi.useRealTimers();}
});

it("rejects a stale neutral generation even when the server has a cached indicator read",async()=>{
 const selection={provider:"alpaca" as const,revision:0};
 const generation=browserDataSession("scanners",selection).generation;
 sourceSelection.provider="moomoo";sourceSelection.revision=1;
 const bars=Array.from({length:360},(_,i)=>({time:Math.floor(Date.now()/60000)*60-(360-i)*60,open:2,high:2.1,low:1.9,close:2,volume:100}));
 const load=vi.fn(async()=>Response.json({symbol:"NEUTRAL",feed:"moomoo",adjustment:"split",bars}));
 try{
  const current=browserDataSession("scanners",{provider:"moomoo",revision:1}).generation;
  const headers={"x-test-viewer":"viewer"};
  expect((await scannerIndicatorResponse(new Request(`https://example.test/api/screeners/charts/bars?symbol=NEUTRAL&frame=5m&generation=${current}`,{headers}),load)).status).toBe(200);
  load.mockClear();
  const response=await scannerIndicatorResponse(new Request(`https://example.test/api/screeners/charts/bars?symbol=NEUTRAL&frame=5m&generation=${generation}`,{headers:{"x-test-viewer":"viewer"}}),load);
  expect(response.status).toBe(409);expect(load).not.toHaveBeenCalled();
 }finally{sourceSelection.provider="alpaca";sourceSelection.revision=0;}
});
