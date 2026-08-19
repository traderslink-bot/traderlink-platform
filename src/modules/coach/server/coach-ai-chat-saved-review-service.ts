import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type { CoachAiReviewKindV2 } from "./coach-ai-review-repository";
import type {
  CoachAiReviewGenerationCompatibilityRepository,
} from "./coach-ai-review-generation-compatibility";

function publicReview(review: ReturnType<
  CoachAiReviewGenerationCompatibilityRepository["readIssuedReviewOutput"]
>) {
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
  constructor(private readonly reviews: Pick<
    CoachAiReviewGenerationCompatibilityRepository,
    "listIssuedReviewOutputs" | "readIssuedReviewOutput"
  >) {}

  list(
    scope: WorkspaceAccessScope,
    input: Readonly<{ reviewKind?: CoachAiReviewKindV2; limit: number }>,
  ): readonly unknown[] {
    if (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 20) {
      throw new Error("TRADERLINK_COACH_FACTUAL_TOOL_INVALID");
    }
    return Object.freeze(this.reviews.listIssuedReviewOutputs(scope, {
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
    return publicReview(this.reviews.readIssuedReviewOutput(scope, reviewId));
  }
}
