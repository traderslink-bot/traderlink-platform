import {
  assessCoachPeriodicEvidenceSufficiencyV2,
  type CoachAiReviewEvidenceSufficiencyV2,
} from "./coach-ai-review-evidence-sufficiency";
import type {
  CoachPeriodicAiReviewSnapshotV2,
} from "./coach-weekly-ai-review-input-runtime";
import type {
  CoachAiReviewTimingModeV2,
} from "./coach-weekly-review-schedule-repository";

export type CoachPeriodicReviewEligibilityV2 = Readonly<{
  eligible: boolean;
  generationMode: "automatic" | "manual" | null;
  reason: "eligible" | "period_not_sealed" | "insufficient_evidence" |
    "manual_generation_required";
  automaticAtUtc: string | null;
  evidence: CoachAiReviewEvidenceSufficiencyV2;
}>;

export const COACH_PERIODIC_REFLECTION_WINDOW_MILLISECONDS = 12 * 60 * 60 * 1_000;

export function assessCoachPeriodicReviewEligibilityV2(
  snapshot: CoachPeriodicAiReviewSnapshotV2,
  now: Date,
  timing?: Readonly<{
    mode: CoachAiReviewTimingModeV2;
    followingTradingWeekSealedAtUtc: string;
  }>,
): CoachPeriodicReviewEligibilityV2 {
  const evidence = assessCoachPeriodicEvidenceSufficiencyV2(snapshot.input);
  const sealedAt = snapshot.input.period.cohorts.at(-1)?.sealedAtUtc;
  if (!sealedAt || now.getTime() < new Date(sealedAt).getTime()) {
    return Object.freeze({
      eligible: false,
      generationMode: null,
      reason: "period_not_sealed",
      automaticAtUtc: null,
      evidence,
    });
  }
  if (!evidence.sufficient) {
    return Object.freeze({
      eligible: false,
      generationMode: null,
      reason: "insufficient_evidence",
      automaticAtUtc: null,
      evidence,
    });
  }
  const factDates = new Set(snapshot.input.reviewPeriodMarketFacts.days.map((day) =>
    day.reviewMarketDate));
  const hasIncompleteCreatedReview = snapshot.input.reflectionCoverage.some((coverage) =>
    coverage.reflectionState === "incomplete" ||
    (factDates.has(coverage.reviewMarketDate) && coverage.reflectionState === "not_created"));
  const automaticAt = timing
    ? timing.mode === "automatic_after_12_hours"
      ? new Date(new Date(sealedAt).getTime() + COACH_PERIODIC_REFLECTION_WINDOW_MILLISECONDS)
      : new Date(hasIncompleteCreatedReview ? timing.followingTradingWeekSealedAtUtc : sealedAt)
    : new Date(new Date(sealedAt).getTime() +
        (hasIncompleteCreatedReview ? COACH_PERIODIC_REFLECTION_WINDOW_MILLISECONDS : 0));
  if (now.getTime() >= automaticAt.getTime()) {
    return Object.freeze({
      eligible: true,
      generationMode: "automatic",
      reason: "eligible",
      automaticAtUtc: automaticAt.toISOString(),
      evidence,
    });
  }
  return Object.freeze({
    eligible: true,
    generationMode: "manual",
    reason: "manual_generation_required",
    automaticAtUtc: automaticAt.toISOString(),
    evidence,
  });
}
