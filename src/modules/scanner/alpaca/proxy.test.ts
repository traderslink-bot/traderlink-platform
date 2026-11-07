// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const identity = vi.hoisted(() => vi.fn());
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({ requireTraderLinkPlatformRequestIdentity: identity }));
import { proxyAlpacaChart } from "./proxy";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); identity.mockReset(); });
function configure() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_ALPACA_OWNER_USER_ID", "owner-test");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_URL", "https://private-gateway.example/market/");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_TOKEN", "private-gateway-token");
  identity.mockReturnValue({ mode: "platform_session", scope: { userId: "owner-test" } });
}
describe("owner chart proxy", () => {
  it("blocks other authenticated users and missing owner configuration before contacting gateway", async () => {
    configure(); identity.mockReturnValue({ mode: "platform_session", scope: { userId: "someone-else" } });
    const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
    expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), false)).status).toBe(403);
    vi.stubEnv("TRADERLINK_ALPACA_OWNER_USER_ID", "");
    expect((await proxyAlpacaChart(new Request("https://app.example/api?symbol=AAPL"), false)).status).toBe(403);
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
