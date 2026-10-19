import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const spies = vi.hoisted(() => ({ symbol: vi.fn(), cached: vi.fn() }));
vi.mock("@/src/lib/live-watchlist/live-watchlist-auth", () => ({ authorizeWatchlistMemberRequest: async () => ({ ok: true, principal: { platformUserId: "synthetic-member" } }) }));
vi.mock("@/src/modules/watchlist/server/access/watchlist-feature-access", () => ({ readWatchlistFeatureAccess: () => ({ tickerDetails: true, tradeAnalysis: true, indicators: false }) }));
vi.mock("@/src/lib/live-watchlist/live-watchlist-store", () => ({ LiveWatchlistStore: class { getSymbol = spies.symbol; }, validIndicatorPublicationIdentity: () => true }));
vi.mock("@/src/modules/watchlist/server/indicators/indicator-refresh-runtime", () => ({ readCachedWatchlistIndicators: spies.cached }));
import { GET } from "@/app/api/live-watchlist/symbols/[symbol]/indicators/route";
describe("Watchlist Indicator card access", () => {
  it("denies indicator data even when the member has ticker-detail and analysis access", async () => {
    const response = await GET(new NextRequest("https://example.test/api/live-watchlist/symbols/ABC/indicators"), { params: Promise.resolve({ symbol: "ABC" }) });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ code: "membership_required", feature: "watchlist.indicators" });
    expect(spies.symbol).not.toHaveBeenCalled();
    expect(spies.cached).not.toHaveBeenCalled();
  });
});
