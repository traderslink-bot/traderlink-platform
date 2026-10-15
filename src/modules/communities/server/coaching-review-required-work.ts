import type Database from "better-sqlite3";
import { coachingReviewReadiness } from "../contracts/coaching-review-readiness";
import { platformFailure } from "../../platform/server/database/platform-migration-contract";

/** Use the agreement that generated this occurrence, including superseded agreements. */
export function coachingReviewRequiredTradeCount(db: Database.Database, reviewId: string): number | null {
  const row = db.prepare(`SELECT json_extract(item.value,'$.quantity') quantity
    FROM traderlink_community_coaching_occurrences occurrence
    JOIN traderlink_community_coaching_trade_reviews review ON review.review_id=occurrence.work_id AND review.community_id=occurrence.community_id
    JOIN traderlink_community_coaching_agreements agreement ON agreement.agreement_id=occurrence.agreement_id AND agreement.relationship_id=review.relationship_id AND agreement.community_id=review.community_id,
    json_each(agreement.terms_json,'$.items') item
    WHERE review.review_id=? AND occurrence.work_type='review'
      AND occurrence.item_key=json_extract(item.value,'$.planItemId')
      AND json_extract(item.value,'$.itemType')='trade_review'`).get(reviewId) as { quantity: number } | undefined;
  return row?.quantity ?? null;
}

export function requireCoachingReviewReady(db: Database.Database, reviewId: string): void {
  const review = db.prepare(`SELECT acceptance_state acceptanceState,coach_feedback coachFeedback,
    went_well wentWell,needs_work needsWork,next_focus nextFocus,
    previous_focus_assessment previousFocusAssessment,focus_feedback_json focusFeedbackJson
    FROM traderlink_community_coaching_trade_reviews WHERE review_id=?`).get(reviewId) as {
      acceptanceState: "accepted" | "pending"; coachFeedback: string; wentWell: string;
      needsWork: string; nextFocus: string; previousFocusAssessment: string; focusFeedbackJson: string;
    };
  const trades = db.prepare(`SELECT workflow_state workflowState FROM traderlink_community_coaching_review_trades WHERE review_id=?`).all(reviewId) as { workflowState: string }[];
  const actions = db.prepare(`SELECT status FROM traderlink_community_coaching_review_actions WHERE review_id=?`).all(reviewId) as { status: string }[];
  const progress = coachingReviewReadiness({ ...review,
    agreedTradeCount: coachingReviewRequiredTradeCount(db, reviewId),
    focusFeedback: JSON.parse(review.focusFeedbackJson),
  }, trades, actions);
  if (!progress.ready) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
    field: progress.saved < progress.required ? "requiredTradeReviews" : progress.saved < progress.selected ? "unfinishedTradeReviews" : "emptyReview",
  });
}
