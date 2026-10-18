import { describe, expect, it } from "vitest";
import type { LiveWatchlistSymbolState } from "./live-watchlist-types";
import { watchlistDetailProjection } from "./watchlist-member-projection";
describe("Watchlist indicator permission", () => {
  it("removes indicator content and visibility without changing the saved ticker or other allowed cards", () => {
    const state = { cards: { technicalContext: { body: "private indicator content" }, companyInfo: { body: "company" } }, indicatorCardVisible: true } as unknown as LiveWatchlistSymbolState;
    const denied = watchlistDetailProjection(state, true, true, true, undefined, false);
    expect(denied.cards.technicalContext).toBeUndefined();
    expect(denied.indicatorCardVisible).toBe(false);
    expect(denied.membershipIndicatorsAllowed).toBe(false);
    expect(denied.cards.companyInfo).toEqual(state.cards.companyInfo);
    expect(state.cards.technicalContext).toBeDefined();
    expect(watchlistDetailProjection(denied, true).membershipIndicatorsAllowed).toBe(false);
    expect(watchlistDetailProjection(state, true, true, true, undefined, true).cards.technicalContext).toBeDefined();
  });
});
