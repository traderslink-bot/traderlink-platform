// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { browserDataSession } from "@/src/modules/market-data/server/browser-data-session";
import { proxyOrderedChartTrades } from "./ordered-chart-trade-proxy";

const state = vi.hoisted(() => ({
  selection: { provider: "alpaca" as "alpaca" | "moomoo", revision: 0 },
  authenticated: true,
  review: true,
}));

vi.mock("@/src/modules/market-data/server/chart-dashboard-access", () => ({ hasChartsDashboardAccess: () => state.review }));
vi.mock("@/src/modules/market-data/server/provider-settings", () => ({ marketDataSelection: () => ({ ...state.selection }) }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => {
    if (!state.authenticated) throw Error("unauthenticated");
    return { mode: "platform_session" };
  },
}));

const request = () => new Request("https://app.example/api/charts/ordered-trades?symbol=VIVS&generation=" +
  browserDataSession("charts", state.selection).generation);
const setup = () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_URL", "https://gateway.example/");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_TOKEN", "fixture-only-token");
};
afterEach(() => {
  state.authenticated = true;
  state.review = true;
  state.selection = { provider: "alpaca", revision: 0 };
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("requires app identity, a current generation and the supported provider", async () => {
  setup();
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const previous = request();
  state.authenticated = false;
  expect((await proxyOrderedChartTrades(previous)).status).toBe(401);
  state.authenticated = true;
  state.review = true;
  state.selection = { provider: "moomoo", revision: 1 };
  expect((await proxyOrderedChartTrades(previous)).status).toBe(409);
  expect((await proxyOrderedChartTrades(request())).status).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
});

it("keeps ordered positions and strips upstream-only fields and error bodies", async () => {
  setup();
  const time = "2026-11-19T14:35:00.123456789Z";
  const trades = [0.5, 0.53, 0.5].map((price, index) => ({ time, price, position: index + 1, privateField: "exclude-me" }));
  const tape = { kind: "snapshot", stream: "fixture", through: 3, trades,
    symbol: "VIVS", session: "regular", feed: "sip", date: "2026-11-19", start: time, cutoff: time };
  const fetcher = vi.fn<typeof fetch>(async () => new Response(
    `event: tape\ndata: ${JSON.stringify(tape)}\n\nevent: error\ndata: {"secret":"exclude-me"}\n\n`,
    { headers: { "Content-Type": "text/event-stream" } },
  ));
  vi.stubGlobal("fetch", fetcher);
  const response = await proxyOrderedChartTrades(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const text = await response.text();
  expect(text).not.toMatch(/exclude-me|fixture-only-token|sip/);
  const snapshot = JSON.parse(text.split("\n")[1].slice("data: ".length));
  expect(snapshot.trades).toEqual(trades.map(({ time, price, position }) => ({ time, price, position })));
  expect(text).toContain('event: status\ndata: {"state":"unavailable"}');
  expect(String(fetcher.mock.calls[0][0])).toBe("https://gateway.example/chart-trades/stream?symbol=VIVS");
  expect(fetcher.mock.calls[0][1]?.redirect).toBe("error");
});
