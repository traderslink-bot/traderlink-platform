import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type { CoachAiReviewKindV2, CoachAiReviewRepository } from "./coach-ai-review-repository";

function publicReview(review: ReturnType<CoachAiReviewRepository["readIssuedReviewV2"]>) {
  return Object.freeze({
    reviewId: review.issuedReviewId,
    reviewKind: review.reviewKind,
    periodStartDate: review.periodStartDate,
    periodEndDate: review.periodEndDate,
    issuedAtUtc: review.issuedAtUtc,
    review: review.output,
  });
}

export class CoachAiChatSavedReviewService {
  constructor(private readonly reviews: Pick<CoachAiReviewRepository,
    "listIssuedReviewsV2" | "readIssuedReviewV2">) {}

  list(
    scope: WorkspaceAccessScope,
    input: Readonly<{ reviewKind?: CoachAiReviewKindV2; limit: number }>,
  ): readonly unknown[] {
    if (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 20) {
      throw new Error("TRADERLINK_COACH_FACTUAL_TOOL_INVALID");
    }
    return Object.freeze(this.reviews.listIssuedReviewsV2(scope, {
      limit: input.limit,
      ...(input.reviewKind ? { reviewKinds: Object.freeze([input.reviewKind]) } : {}),
    }).map((review) => Object.freeze({
      reviewId: review.issuedReviewId,
      reviewKind: review.reviewKind,
      periodStartDate: review.periodStartDate,
      periodEndDate: review.periodEndDate,
      issuedAtUtc: review.issuedAtUtc,
      summary: review.output.reviewSummary,
    })));
  }

  read(scope: WorkspaceAccessScope, reviewId: string): unknown {
    return publicReview(this.reviews.readIssuedReviewV2(scope, reviewId));
  }
}
