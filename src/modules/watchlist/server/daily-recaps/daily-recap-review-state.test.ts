import { describe, expect, it } from "vitest";

import { transitionDailyWatchlistRecapReview } from "./daily-recap-review-state";

describe("transitionDailyWatchlistRecapReview", () => {
  it("retains the correction reason and optional owner note", () => {
    expect(transitionDailyWatchlistRecapReview("unreviewed", {
      note: "The later price is wrong.",
      reason: "incorrect_price_sequence",
      type: "needs_correction",
    })).toEqual({
      correction: { note: "The later price is wrong.", reason: "incorrect_price_sequence" },
      postedReceiptId: null,
      reviewState: "needs_correction",
    });
  });

  it("cannot mark an unselected recap as posted", () => {
    expect(() => transitionDailyWatchlistRecapReview("unreviewed", {
      postedReceiptId: "discord-message-receipt",
      type: "mark_posted",
    })).toThrow("watchlist_daily_recap_post_requires_selected_review");
  });

  it("requires a receipt and then makes the posted review immutable", () => {
    const posted = transitionDailyWatchlistRecapReview("add_to_recap", {
      postedReceiptId: "discord-message-receipt",
      type: "mark_posted",
    });
    expect(posted.reviewState).toBe("posted");
    expect(() => transitionDailyWatchlistRecapReview("posted", { type: "dont_use" }))
      .toThrow("watchlist_daily_recap_posted_review_is_immutable");
  });
});
