import type { TraderLinkCommunityTradeReview } from "./traderlink-community-platform-contracts";

type ReviewContent = Pick<TraderLinkCommunityTradeReview,
  "agreedTradeCount" | "acceptanceState" | "coachFeedback" | "wentWell" | "needsWork" |
  "nextFocus" | "previousFocusAssessment" | "focusFeedback">;

export function coachingReviewReadiness(
  review: ReviewContent,
  trades: readonly { workflowState: string }[],
  actions: readonly { status: string }[],
) {
  const activeTrades = trades.filter(trade => trade.workflowState !== "removed");
  const saved = activeTrades.filter(trade => trade.workflowState === "saved").length;
  const required = review.agreedTradeCount ?? 0;
  // Extra selected trades also need feedback; removing them cannot erase agreed work.
  const total = Math.max(required, activeTrades.length);
  const hasContent = [review.coachFeedback, review.wentWell, review.needsWork,
    review.nextFocus, review.previousFocusAssessment, ...Object.values(review.focusFeedback ?? {})]
    .some(value => Boolean(value?.trim())) || actions.some(action => action.status !== "cancelled");
  const ready = review.acceptanceState !== "pending" && saved >= required &&
    saved === activeTrades.length && (saved > 0 || hasContent);
  return { saved, required, total, selected: activeTrades.length, hasContent, ready };
}

export function coachingReviewReadinessMessage(
  progress: ReturnType<typeof coachingReviewReadiness>,
  journalAccess: boolean,
): string | null {
  if (progress.ready) return null;
  if (progress.saved < progress.required) {
    const count = `This agreement requires ${progress.required} trade ${progress.required === 1 ? "review" : "reviews"}; ${progress.saved} saved.`;
    return journalAccess
      ? `${count} Select and save the remaining required trade reviews before sending or completing this review.`
      : `${count} Journal access is off. Ask the student to share trades for this coaching relationship, then select and save the required trade reviews. Only the student can grant Journal access.`;
  }
  if (progress.saved < progress.selected) return "Save feedback for every selected trade before sending or completing this review.";
  return "Add review feedback or a student action before sending this review.";
}
