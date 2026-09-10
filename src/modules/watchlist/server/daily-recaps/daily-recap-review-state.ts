import type {
  DailyWatchlistRecapCorrectionReason,
  DailyWatchlistRecapReviewState,
} from "./daily-recap-composition";

export type DailyWatchlistRecapReviewAction =
  | Readonly<{ type: "add_to_recap" }>
  | Readonly<{ type: "dont_use" }>
  | Readonly<{ reason: DailyWatchlistRecapCorrectionReason; note?: string; type: "needs_correction" }>
  | Readonly<{ type: "reset_to_unreviewed" }>
  | Readonly<{ postedReceiptId: string; type: "mark_posted" }>;

export type DailyWatchlistRecapReviewTransition = Readonly<{
  correction: Readonly<{
    note: string | null;
    reason: DailyWatchlistRecapCorrectionReason;
  }> | null;
  postedReceiptId: string | null;
  reviewState: DailyWatchlistRecapReviewState;
}>;

function normalizeNote(value: string | undefined): string | null {
  const note = value?.trim() ?? "";
  if (note.length > 4_000) throw new Error("watchlist_daily_recap_correction_note_too_long");
  return note || null;
}

/**
 * This domain transition has no Discord side effect. A caller may mark a recap
 * posted only after the authenticated runtime has returned one durable receipt.
 */
export function transitionDailyWatchlistRecapReview(
  current: DailyWatchlistRecapReviewState,
  action: DailyWatchlistRecapReviewAction,
): DailyWatchlistRecapReviewTransition {
  if (current === "posted") {
    throw new Error("watchlist_daily_recap_posted_review_is_immutable");
  }

  switch (action.type) {
    case "add_to_recap":
      return Object.freeze({ correction: null, postedReceiptId: null, reviewState: "add_to_recap" });
    case "dont_use":
      return Object.freeze({ correction: null, postedReceiptId: null, reviewState: "dont_use" });
    case "needs_correction":
      return Object.freeze({
        correction: Object.freeze({ note: normalizeNote(action.note), reason: action.reason }),
        postedReceiptId: null,
        reviewState: "needs_correction",
      });
    case "reset_to_unreviewed":
      return Object.freeze({ correction: null, postedReceiptId: null, reviewState: "unreviewed" });
    case "mark_posted": {
      const receiptId = action.postedReceiptId.trim();
      if (!receiptId || receiptId.length > 256) {
        throw new Error("watchlist_daily_recap_invalid_post_receipt");
      }
      if (current !== "add_to_recap") {
        throw new Error("watchlist_daily_recap_post_requires_selected_review");
      }
      return Object.freeze({ correction: null, postedReceiptId: receiptId, reviewState: "posted" });
    }
  }
}
