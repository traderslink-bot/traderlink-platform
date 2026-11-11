// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const identity = vi.hoisted(() => vi.fn());
const access = vi.hoisted(() => vi.fn());
vi.mock("@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access", () => ({ hasWatchlistDashboardNavigationAccess: access }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({ requireTraderLinkPlatformRequestIdentity: identity }));
import { proxyAlpacaChart } from "./proxy";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); identity.mockReset(); access.mockReset(); });
function configure() {
  access.mockReturnValue(true);
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_ALPACA_OWNER_USER_ID", "owner-test");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_URL", "https://private-gateway.example/market/");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_TOKEN", "private-gateway-token");
  identity.mockReturnValue({ mode: "platform_session", scope: { userId: "owner-test" } });
}
describe("authenticated chart proxy", () => {
  it("allows both private Scanner accounts through the existing access contract, independent of the obsolete single owner setting", async () => {
    configure(); identity.mockReturnValue({ mode: "platform_session", scope: { userId: "someone-else" } });
    const upstream = vi.fn(async () => Response.json({ bars: [], feed: "sip" })); vi.stubGlobal("fetch", upstream);
    expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), false)).status).toBe(200);
    vi.stubEnv("TRADERLINK_ALPACA_OWNER_USER_ID", "");
    expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), false)).status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(2);
  });
  it("allows chart history and streaming for signed-in accounts outside the scanner allowlist", async () => {
    configure(); access.mockReturnValue(false);
    const upstream = vi.fn(async () => Response.json({ bars: [], feed: "sip" })); vi.stubGlobal("fetch", upstream);
    expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), false)).status).toBe(200);
    const stream = await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), true);
    expect(stream.status).toBe(200);
    await stream.body?.cancel();
    expect(upstream).toHaveBeenCalledTimes(2);
  });
  it("retains the normal authentication boundary", async () => {
    configure(); identity.mockImplementation(() => { throw Error("unauthenticated"); });
    const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
    expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), false)).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("uses only the configured gateway and server bearer token, with no browser cookies forwarded", async () => {
    configure();
    const upstream = vi.fn<typeof fetch>(async () => Response.json({ bars: [], feed: "sip" })); vi.stubGlobal("fetch", upstream);
    const response = await proxyAlpacaChart(new Request("https://app.example/api?symbol=aapl&url=https://attacker.example", { headers: { cookie: "session=private-browser-cookie" } }), false);
    expect(response.status).toBe(200);
    expect(String(upstream.mock.calls[0][0])).toBe("https://private-gateway.example/market/bars?symbol=AAPL");
    expect(upstream.mock.calls[0][1]?.headers).toEqual({ Authorization: "Bearer private-gateway-token" });
    expect(await response.text()).not.toContain("private-gateway-token");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("rejects insecure production transport and malformed symbols without contacting the gateway", async () => {
    configure(); const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
    expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=../AAPL"), false)).status).toBe(400);
    vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_URL", "http://127.0.0.1:3041");
    expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), false)).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("cancels the upstream stream when the chart disconnects", async () => {
    configure(); let cancelled = false;
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }))));
    const response = await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), true);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    await response.body!.cancel(); expect(cancelled).toBe(true);
  });
});

it("pages chart history through the existing gateway and rejects incomplete pages",async()=>{
 configure();const fetcher=vi.fn<typeof fetch>(async()=>Response.json({bars:[],complete:true,adjustment:"split",feed:"sip"}));vi.stubGlobal("fetch",fetcher);
 const response=await proxyAlpacaChart(new Request("https://app.example/api?symbol=NWGL&history=1&before=1794000000000"),false);
 expect(response.status).toBe(200);const url=new URL(String(fetcher.mock.calls[0][0]));expect(url.pathname).toBe("/market/history");expect(url.searchParams.get("timeframe")).toBe("1Min");expect(url.searchParams.get("end")).toBe("1794000000000");expect((await response.json()).nextBefore).toBeLessThan(1794000000000);
 fetcher.mockImplementation(async()=>Response.json({bars:[],complete:false,adjustment:"split",feed:"sip"}));expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=NWGL&history=1"),false)).status).toBe(503);
 expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=NWGL&history=1&before=bad"),false)).status).toBe(400);
});

it("forwards daily live selection so the active daily candle receives trade-built updates",async()=>{
 configure();const upstream=vi.fn<typeof fetch>(async()=>new Response(new ReadableStream({start(controller){controller.close();}})));vi.stubGlobal("fetch",upstream);
 const response=await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAA&daily=1"),true);
 expect(String(upstream.mock.calls[0][0])).toBe("https://private-gateway.example/market/stream?symbol=AAA&daily=1");await response.body!.cancel();
});
