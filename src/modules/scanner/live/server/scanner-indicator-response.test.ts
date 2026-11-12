import { expect, it, vi } from "vitest";
import { scannerIndicatorResponse } from "./scanner-indicator-response";

vi.mock("server-only", () => ({}));
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
    expect(load).toHaveBeenCalledTimes(1);
    expect((await scannerIndicatorResponse(request("5m"), load)).status).toBe(404);
    expect((await scannerIndicatorResponse(request("1m", "first"), load)).status).toBe(200);
    vi.advanceTimersByTime(5 * 60_000);
    expect((await scannerIndicatorResponse(request("5m", "second"), load)).status).toBe(200);
    expect(load).toHaveBeenCalledTimes(3);
  } finally { vi.useRealTimers(); }
});
