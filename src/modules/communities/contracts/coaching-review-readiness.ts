import type { TraderLinkCommunityTradeReview } from "./traderlink-community-platform-contracts";

type ReviewContent = Pick<TraderLinkCommunityTradeReview,
  "agreedTradeCount" | "acceptanceState" | "coachFeedback" | "wentWell" | "needsWork" |
  "nextFocus" | "previousFocusAssessment" | "focusFeedback"> & Partial<Pick<TraderLinkCommunityTradeReview,"workspaceKind"|"focusAreas"|"dayAssessments">>;

export function coachingReviewReadiness(
  review: ReviewContent,
  trades: readonly { workflowState: string }[],
  actions: readonly { status: string }[],
  availableTradeCount:number|null=null,
) {
  const activeTrades = trades.filter(trade => trade.workflowState !== "removed");
  const saved = activeTrades.filter(trade => trade.workflowState === "saved").length;
  const required = review.agreedTradeCount ?? 0;
  const effectiveRequired=availableTradeCount===null?required:Math.min(required,availableTradeCount);
  const shortfall=availableTradeCount===null?0:Math.max(0,required-availableTradeCount);
  // Extra selected trades also need feedback; removing them cannot erase agreed work.
  const total = Math.max(required, activeTrades.length);
  const hasContent = [review.coachFeedback, review.wentWell, review.needsWork,
    review.nextFocus, review.previousFocusAssessment, ...Object.values(review.focusFeedback ?? {})]
    .some(value => Boolean(value?.trim())) || actions.some(action => action.status !== "cancelled") || Boolean(review.dayAssessments?.some(day=>day.assessment.trim()));
  const focusComplete=(review.focusAreas??[]).filter(key=>!["overall","next_steps"].includes(key)&&(review.workspaceKind!=="trade"||key==="goals")).every(key=>review.workspaceKind==="trading_day"?Boolean(review.dayAssessments?.length)&&review.dayAssessments!.every(day=>Boolean(day.focusFeedback[key]?.trim())):Boolean(review.focusFeedback?.[key]?.trim()));
  const ready = focusComplete && review.acceptanceState !== "pending" && saved >= effectiveRequired &&
    saved === activeTrades.length && (saved > 0 || hasContent);
  return { saved, required, effectiveRequired, availableTradeCount, shortfall, total, selected: activeTrades.length, hasContent, focusComplete, ready };
}

export function coachingReviewReadinessMessage(
  progress: ReturnType<typeof coachingReviewReadiness>,
  journalAccess: boolean,
): string | null {
  if (progress.ready) return progress.shortfall>0?`${progress.saved} of ${progress.required} agreed trade reviews completed. Only ${progress.availableTradeCount} eligible shared trades are available; the shortage will be recorded with delivery.`:null;
  if(!progress.focusComplete)return "Complete the agreed focus assessments before sending this review.";
  if (progress.saved < progress.effectiveRequired) {
    const count = `This agreement requires ${progress.required} trade ${progress.required === 1 ? "review" : "reviews"}; ${progress.saved} saved.`;
    return journalAccess
      ? `${count} Select and save the remaining required trade reviews before sending or completing this review.`
      : `${count} Journal access is off. Ask the student to share trades for this coaching relationship, then select and save the required trade reviews. Only the student can grant Journal access.`;
  }
  if (progress.saved < progress.selected) return "Save feedback for every selected trade before sending or completing this review.";
  return "Add review feedback or a student action before sending this review.";
}
