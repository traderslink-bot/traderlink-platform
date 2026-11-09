// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("@/src/modules/watchlist/server/moomoo-watchlist-candle-bridge", () => ({ fetchWatchlistMoomooCandles: bridge }));
vi.mock("./client", () => ({ alpacaMarketDataEnabled: () => process.env.TRADERLINK_MARKET_DATA_PROVIDER === "alpaca" }));
import { GET } from "@/app/api/live-watchlist/moomoo-candles/route";

const request = (query = "symbol=NWGL&start=1793975400&end=1793979000", authorized = true) =>
  new NextRequest(`https://fixture.invalid/api/live-watchlist/moomoo-candles?${query}`, {
    headers: authorized ? { authorization: "Bearer offline-fixture" } : {},
  });

beforeEach(() => {
  vi.stubEnv("TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN", "offline-fixture");
  vi.stubEnv("TRADERLINK_MARKET_DATA_PROVIDER", "alpaca");
  bridge.mockReset().mockResolvedValue({ ok: true, candles: [{ time: 1793975400,
    openDecimal: "2.4", highDecimal: "2.5", lowDecimal: "2.3", closeDecimal: "2.45", volumeDecimal: "100" }] });
});
afterEach(() => vi.unstubAllEnvs());

it("keeps publisher authentication and range validation ahead of provider requests", async () => {
  expect((await GET(request(undefined, false))).status).toBe(401);
  expect((await GET(request("symbol=NWGL&start=1&end=999999"))).status).toBe(400);
  expect(bridge).not.toHaveBeenCalled();
});

it("reports Alpaca truthfully while preserving candle values and millisecond timestamps", async () => {
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ready", provider: "alpaca", symbol: "NWGL",
    candles: [{ timestamp: 1793975400000, open: "2.4", high: "2.5", low: "2.3", close: "2.45", volume: "100" }] });
  expect(bridge).toHaveBeenCalledWith({ symbol: "NWGL", interval: "1m", includeExtendedHours: true,
    startTime: 1793975400, endTime: 1793979000 });
});

it("preserves the Moomoo provider identity when selected", async () => {
  vi.stubEnv("TRADERLINK_MARKET_DATA_PROVIDER", "moomoo");
  expect(await (await GET(request())).json()).toMatchObject({ provider: "moomoo_open_api" });
});

it("keeps unavailable results unavailable and identifies the selected provider on thrown failures", async () => {
  bridge.mockResolvedValueOnce({ ok: false, code: "provider_unavailable" });
  let response = await GET(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: "unavailable", code: "provider_unavailable" });
  bridge.mockRejectedValue(Error("offline fixture"));
  response = await GET(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: "unavailable", code: "alpaca_connection_unavailable" });
  vi.stubEnv("TRADERLINK_MARKET_DATA_PROVIDER", "moomoo");
  expect(await (await GET(request())).json()).toEqual({ status: "unavailable", code: "moomoo_connection_unavailable" });
});
