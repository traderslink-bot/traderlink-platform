"use server";

import { revalidatePath } from "next/cache";

import type { CoachAiReviewKindV2 } from
  "@/src/modules/coach/server/coach-ai-review-repository";
import {
  CoachAiReviewRequestService,
  type CoachAiReviewManualRequestResultV2,
} from "@/src/modules/coach/server/coach-ai-review-request-service";
import { CoachAiReviewGenerationCoordinatorV2 } from
  "@/src/modules/coach/server/coach-ai-review-generation-coordinator-v2";
import { requireTraderLinkPlatformPageScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { openPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";

const REVIEW_KINDS = new Set<CoachAiReviewKindV2>(["weekly", "two_week", "monthly"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export type RequestAiReviewActionState = Readonly<{
  ok: boolean;
  message: string | null;
}>;

export async function requestAiReview(
  _previous: RequestAiReviewActionState,
  formData: FormData,
): Promise<RequestAiReviewActionState> {
  const reviewKind = formData.get("reviewKind");
  const periodStartDate = formData.get("periodStartDate");
  const periodEndDate = formData.get("periodEndDate");
  if (typeof reviewKind !== "string" ||
      !REVIEW_KINDS.has(reviewKind as CoachAiReviewKindV2) ||
      typeof periodStartDate !== "string" || !DATE_PATTERN.test(periodStartDate) ||
      typeof periodEndDate !== "string" || !DATE_PATTERN.test(periodEndDate)) {
    return Object.freeze({
      ok: false,
      message: "This review period is no longer available. Refresh and try again.",
    });
  }

  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const database = openPlatformDatabase({ mode: "runtime" });
    let result: CoachAiReviewManualRequestResultV2;
    try {
      const gate = new CoachAiReviewGenerationCoordinatorV2(database).readGate(scope);
      if (gate.state === "platform_unavailable") {
        return Object.freeze({
          ok: false,
          message: "AI Reviews are currently unavailable for the platform.",
        });
      }
      if (gate.state === "paid_access_unavailable") {
        return Object.freeze({
          ok: false,
          message: "Connect or renew AI Review access from Account, then try again.",
        });
      }
      result = new CoachAiReviewRequestService(database).requestManual(scope, {
        reviewKind: reviewKind as CoachAiReviewKindV2,
        periodStartDate,
        periodEndDate,
      });
    } finally {
      database.close();
    }
    if (result.state === "not_available") {
      return Object.freeze({
        ok: false,
        message: "This review is not ready yet. Refresh to see its current status.",
      });
    }
    revalidatePath("/ai-reviews");
    return Object.freeze({
      ok: true,
      message: null,
    });
  } catch {
    return Object.freeze({
      ok: false,
      message: "Your AI Review request could not be saved. Try again.",
    });
  }
}
