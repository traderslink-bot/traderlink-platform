import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const fixture = vi.hoisted(() => ({ list: vi.fn(), symbol: vi.fn(), health: vi.fn() }));
vi.mock("./watchlist-access-service", () => ({
  authorizeWatchlistPageAccess: async () => ({ ok: false, status: 403, reason: "membership_required", error: "Upgrade" }),
  authorizeWatchlistRequest: async () => ({ ok: false, status: 403, reason: "membership_required", error: "Upgrade" }),
}));
vi.mock("@/src/lib/live-watchlist/live-watchlist-store", () => ({ LiveWatchlistStore: class { listSymbols = fixture.list; getSymbol = fixture.symbol; getHealth = fixture.health; } }));
vi.mock("@/app/watchlist/watchlist-membership-notice", () => ({ WatchlistMembershipNotice: () => null }));
vi.mock("@/app/watchlist/watchlist-homepage-shell", () => ({ WatchlistHomepageShell: () => null }));
vi.mock("@/app/watchlist/live-watchlist-client", () => ({ LiveWatchlistIndexClient: () => null }));
vi.mock("@/app/watchlist/watchlist-visit-recorder", () => ({ WatchlistVisitRecorder: () => null }));
vi.mock("@/app/watchlist/watchlist-dashboard-frame", () => ({ WatchlistDashboardFrame: () => null }));
vi.mock("@/app/watchlist/watchlist-public-preview", () => ({ WatchlistPublicPreview: () => null }));
import Page from "@/app/watchlist/page";
import { WatchlistMembershipNotice } from "@/app/watchlist/watchlist-membership-notice";
import { GET as list } from "@/app/api/live-watchlist/route";
import { GET as detail } from "@/app/api/live-watchlist/symbols/[symbol]/route";

describe("Watchlist parent protects current data before storage reads", () => {
  it("renders the upgrade view before reading the index", async () => {
    const page = await Page({ searchParams: Promise.resolve({}) });
    expect(page.type).toBe(WatchlistMembershipNotice);
    expect(fixture.list).not.toHaveBeenCalled();
  });
  it("denies direct index and ticker APIs before reading list, details or health", async () => {
    expect((await list(new NextRequest("https://example.test/api/live-watchlist"))).status).toBe(403);
    expect((await detail(new NextRequest("https://example.test/api/live-watchlist/symbols/QA"), { params: Promise.resolve({symbol:"QA"}) })).status).toBe(403);
    expect(fixture.list).not.toHaveBeenCalled();
    expect(fixture.symbol).not.toHaveBeenCalled();
    expect(fixture.health).not.toHaveBeenCalled();
  });
});
