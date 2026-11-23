// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { browserDataSession } from "./server/browser-data-session";

const state = vi.hoisted(() => ({
  selection: { provider: "alpaca" as "alpaca" | "moomoo", revision: 0 },
  authenticated: true,
  sharedChart: true,
  alternative: vi.fn(),
}));
vi.mock("./server/chart-dashboard-access", () => ({ hasSharedChartDataAccess: () => state.sharedChart }));
vi.mock("./server/provider-settings", () => ({ marketDataSelection: () => ({ ...state.selection }) }));
vi.mock("./server/moomoo-chart-response", () => ({ moomooChartResponse: state.alternative }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => {
    if (!state.authenticated) throw Error("unauthenticated");
    return { mode: "platform_session", scope: { userId: "fixture" } };
  },
}));
import { proxyAlpacaChart } from "@/src/modules/scanner/alpaca/proxy";

const bar = { time: 1_795_000_000, open: .0277, high: .029, low: .027, close: .0288, volume: 12345 };
const request = (generation = browserDataSession("charts", state.selection).generation) =>
  new Request("https://app.example/api/screeners/charts/bars?symbol=SHFS&generation=" + generation);
function configure() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_URL", "https://private-gateway.example/market/");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_TOKEN", "server-only-token");
}
afterEach(() => { state.selection = { provider: "alpaca", revision: 0 }; state.authenticated = true; state.sharedChart = true; state.alternative.mockReset(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("serves identical neutral candle contracts from both sources while leaving internal indicator data intact", async () => {
  configure();
  const history = { symbol: "SHFS", baseTimeframe: "1m", adjustment: "split", basisDate: "2026-11-19", bars: [{ ...bar, provider: "alpaca" }], feed: "sip", provider: "alpaca", privateMetadata: "not-for-browser" };
  const fetcher = vi.fn<typeof fetch>(async () => Response.json(history)); vi.stubGlobal("fetch", fetcher);
  const first = await proxyAlpacaChart(request(), false);
  const a = await first.json();
  expect(a.bars).toEqual([bar]);
  expect(a.feed).toBe("traderslink");
  expect(a).not.toHaveProperty("provider"); expect(a).not.toHaveProperty("privateMetadata");
  expect(JSON.stringify(a)).not.toMatch(/alpaca|moomoo|private-gateway|server-only-token/);
  expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.has("generation")).toBe(false);
  const internal = await proxyAlpacaChart(request(), false, true);
  expect((await internal.json()).feed).toBe("sip");
  state.selection = { provider: "moomoo", revision: 1 };
  state.alternative.mockImplementation(async () => Response.json({ ...history, feed: "moomoo", provider: "moomoo" }));
  expect(await (await proxyAlpacaChart(request(), false)).json()).toEqual(a);
  state.selection = { provider: "alpaca", revision: 2 };
  expect(await (await proxyAlpacaChart(request(), false)).json()).toEqual(a);
});

it("rejects stale generations before I/O and discards a response if the source changes during the request", async () => {
  configure();
  const stale = request(); state.selection = { provider: "moomoo", revision: 1 };
  expect((await proxyAlpacaChart(stale, false)).status).toBe(409);
  expect(state.alternative).not.toHaveBeenCalled();
  state.selection = { provider: "alpaca", revision: 2 };
  const fetcher = vi.fn<typeof fetch>(async () => { state.selection = { provider: "moomoo", revision: 3 }; return Response.json({ bars: [bar], feed: "sip" }); });
  vi.stubGlobal("fetch", fetcher);
  const response = await proxyAlpacaChart(request(), false);
  expect(response.status).toBe(409); expect(await response.text()).not.toContain("0.0288");
});

it("closes an old live stream before forwarding another source's frame and cancels upstream", async () => {
  configure();
  let enqueue!: (frame: Uint8Array) => void;
  const cancelled = vi.fn();
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response(new ReadableStream<Uint8Array>({
    start(controller) { enqueue = frame => controller.enqueue(frame); }, cancel: cancelled,
  }))));
  const response = await proxyAlpacaChart(request(), true);
  const reader = response.body!.getReader();
  const pending = reader.read();
  state.selection = { provider: "moomoo", revision: 1 };
  enqueue(new TextEncoder().encode('event: price\ndata: {"price":0.0288}\n\n'));
  expect(await pending).toEqual({ done: true, value: undefined });
  expect(cancelled).toHaveBeenCalledTimes(1);
});

it("does not expose source data without the existing login boundary", async () => {
  configure(); state.authenticated = false;
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await proxyAlpacaChart(request(), false)).status).toBe(503);
  expect(fetcher).not.toHaveBeenCalled();
});

it('does not forward either source failure bodies, routing headers or error stream payloads',async()=>{
 configure();const failure={message:'Alpaca auth private-value',provider:'alpaca'};
 vi.stubGlobal('fetch',vi.fn<typeof fetch>(async()=>Response.json(failure,{status:429,headers:{'x-provider':'alpaca','www-authenticate':'private-value'}})));
 let response=await proxyAlpacaChart(request(),false);expect(response.status).toBe(429);expect(await response.json()).toEqual({error:'busy'});expect(response.headers.get('x-provider')).toBeNull();expect(response.headers.get('www-authenticate')).toBeNull();
 state.selection={provider:'moomoo',revision:1};state.alternative.mockResolvedValue(Response.json({message:'moomoo private-value'},{status:503,headers:{'x-provider':'moomoo'}}));
 response=await proxyAlpacaChart(request(),false);expect(response.status).toBe(503);expect(await response.json()).toEqual({error:'chart_unavailable'});expect(response.headers.get('x-provider')).toBeNull();
 state.selection={provider:'alpaca',revision:2};vi.stubGlobal('fetch',vi.fn<typeof fetch>(async()=>new Response('event: error\ndata: {"message":"Alpaca private-value","provider":"alpaca"}\n\n')));
 response=await proxyAlpacaChart(request(),true);expect(await response.text()).toBe('event: status\ndata: {"state":"unavailable"}\n\n');
});

it('keeps nested metadata out of paged primary and alternate histories without changing candles or sessions',async()=>{
 configure();const calendar={available:true,start:'2026-11-19',end:'2026-11-19',sessions:[{date:'2026-11-19',open:'09:30',close:'16:00',provider:'moomoo'}],provider:'alpaca'};
 const payload={symbol:'SHFS',complete:true,adjustment:'split',feed:'sip',basisDate:'2026-11-19',bars:[bar],calendar,calendars:[calendar]};
 vi.stubGlobal('fetch',vi.fn<typeof fetch>(async()=>Response.json(payload)));
 const url=new URL(request().url);url.searchParams.set('history','1');
 let response=await proxyAlpacaChart(new Request(url),false);expect(response.status).toBe(200);let result=await response.json();expect(result.bars).toEqual([bar]);expect(result.calendar.sessions[0]).toEqual({date:'2026-11-19',open:'09:30',close:'16:00'});expect(JSON.stringify(result)).not.toMatch(/alpaca|moomoo/);
 state.selection={provider:'moomoo',revision:1};state.alternative.mockResolvedValue(Response.json({...payload,feed:'moomoo'}));url.searchParams.set('generation',browserDataSession('charts',state.selection).generation);
 response=await proxyAlpacaChart(new Request(url),false);result=await response.json();expect(result.bars).toEqual([bar]);expect(JSON.stringify(result)).not.toMatch(/alpaca|moomoo/);
});

it("authenticates completed archive reads and keeps the server-to-server response narrow", async () => {
  configure();
  const start = Date.parse("2026-11-18T14:30:00Z") / 1000;
  const end = start + 1800;
  const query = new URLSearchParams({ archive: "1", frame: "30m", session: "regular", start: String(start), end: String(end) });
  const archived = { ...bar, time: start };
  const fetcher = vi.fn<typeof fetch>(async () => Response.json({
    state: "ready", start, end, basisDate: "2026-11-19",
    bars: [{ ...archived, privateRule: "hidden" }], privateMetadata: "hidden",
  }));
  vi.stubGlobal("fetch", fetcher);
  const archiveRequest = () => new Request(request().url + "&" + query.toString());
  state.authenticated = false;
  expect((await proxyAlpacaChart(archiveRequest(), false)).ok).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
  state.authenticated = true;
  const result = await proxyAlpacaChart(archiveRequest(), false);
  expect(await result.json()).toStrictEqual({ state: "ready", start, end, basisDate: "2026-11-19", bars: [archived] });
  const [url, options] = fetcher.mock.calls[0];
  expect(new URL(String(url)).pathname).toBe("/market/candle-history");
  expect(Object.fromEntries(new URL(String(url)).searchParams)).toStrictEqual({
    symbol: "SHFS", frame: "30m", session: "regular", start: String(start), end: String(end),
  });
  expect(new Headers(options?.headers).get("authorization")).toBe("Bearer server-only-token");
  fetcher.mockResolvedValueOnce(Response.json({ state: "miss" }));
  expect(await (await proxyAlpacaChart(archiveRequest(), false)).json()).toStrictEqual({ state: "miss" });
  state.selection = { provider: "moomoo", revision: 1 };
  expect(await (await proxyAlpacaChart(archiveRequest(), false)).json()).toStrictEqual({ state: "miss" });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(state.alternative).not.toHaveBeenCalled();
});

it("rejects unentitled bars and streams and prevents the raw proxy from selecting Scanner history", async () => {
  configure();
  const fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetcher);
  state.sharedChart = false;
  expect((await proxyAlpacaChart(request(), false)).status).toBe(403);
  expect((await proxyAlpacaChart(request(), true)).status).toBe(403);
  state.sharedChart = true;
  const scannerQuery = new URL(request().url);
  scannerQuery.searchParams.set("scannerIndicators", "1");
  expect((await proxyAlpacaChart(new Request(scannerQuery), false)).status).toBe(400);
  expect((await proxyAlpacaChart(new Request(scannerQuery), true)).status).toBe(400);
  expect(fetcher).not.toHaveBeenCalled();
  expect(state.alternative).not.toHaveBeenCalled();
});
