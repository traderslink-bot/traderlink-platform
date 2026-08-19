import "server-only";

import type Database from "better-sqlite3";

import { CoachAiProviderSettingsRepository } from
  "./coach-ai-provider-settings-repository";
import { CoachAiReviewAuthoredPersistenceRepository } from
  "./coach-ai-review-authored-persistence-repository";
import { buildCoachMonthlyAiReviewEvidencePacketFromPlanV4 } from
  "./coach-monthly-ai-review-evidence-packet-runtime";
import type { CoachMonthlyReviewPlanV2 } from "./coach-monthly-ai-review-runner";
import { buildCoachWeeklyAiReviewEvidencePacketFromPeriodicInputV2 } from
  "./coach-weekly-ai-review-evidence-packet-builder";
import type { CoachPeriodicReviewPlanV2 } from "./coach-weekly-ai-review-runner";

type EligiblePlan = CoachPeriodicReviewPlanV2 | CoachMonthlyReviewPlanV2;

function isMonthlyPlan(plan: EligiblePlan): plan is CoachMonthlyReviewPlanV2 {
  return "calendarMonthStartDate" in plan.period;
}

/**
 * Creates a forward-only V4 request.  The legacy request row remains the
 * scheduler and cost-control carrier; the separate authored snapshot is the
 * authority for what the model receives and writes.
 */
export class CoachAiReviewAuthoredRequestService {
  constructor(private readonly database: Database.Database) {}

  createFromEligiblePlan(
    plan: EligiblePlan,
    requestOrigin: "automatic" | "manual",
    now = new Date(),
  ): Readonly<{ state: "created" | "existing_authored" | "existing_legacy"; requestId: string }> {
    if (!plan.snapshot ||
        (plan.state !== "automatic_ready" && plan.state !== "manual_available")) {
      throw new Error("TRADERLINK_COACH_AUTHORING_REQUEST_PLAN_NOT_ELIGIBLE");
    }
    const monthly = isMonthlyPlan(plan);
    const sourceManifestJson = JSON.stringify(plan.snapshot.evidenceManifest);
    const settings = new CoachAiProviderSettingsRepository(this.database).read();
    if (monthly) {
      const input = plan.snapshot.input;
      const result = new CoachAiReviewAuthoredPersistenceRepository(this.database).createOrRead({
        scope: plan.scope,
        reviewKind: "monthly",
        periodStartDate: plan.period.calendarMonthStartDate,
        periodEndDate: plan.period.calendarMonthEndDate,
        coverageStartDate: plan.period.coverageStartDate,
        coverageEndDate: plan.period.coverageEndDate,
        calendarId: plan.period.calendarId,
        calendarEvidenceDigestSha256: plan.period.calendarEvidenceDigestSha256,
        eligibleAtUtc: input.calendarMonth.scheduledAtUtc,
        requestOrigin,
        inputContractVersion: input.contractVersion,
        inputJson: JSON.stringify(input),
        evidenceManifestJson: sourceManifestJson,
        priorIssuedReviewId: plan.priorIssuedReviewId,
        packet: buildCoachMonthlyAiReviewEvidencePacketFromPlanV4(this.database, plan),
        modelId: settings.modelId,
        now,
      });
      return Object.freeze(result);
    }
    const input = plan.snapshot.input;
    const result = new CoachAiReviewAuthoredPersistenceRepository(this.database).createOrRead({
      scope: plan.scope,
      reviewKind: plan.period.cadence,
      periodStartDate: plan.period.startDate,
      periodEndDate: plan.period.endDate,
      coverageStartDate: plan.period.startDate,
      coverageEndDate: plan.period.endDate,
      calendarId: plan.period.calendarId,
      calendarEvidenceDigestSha256: plan.period.calendarEvidenceDigestSha256,
      eligibleAtUtc: input.period.cohorts.at(-1)?.sealedAtUtc ?? "",
      requestOrigin,
      inputContractVersion: input.contractVersion,
      inputJson: JSON.stringify(input),
      evidenceManifestJson: sourceManifestJson,
      priorIssuedReviewId: plan.priorIssuedReviewId,
      packet: buildCoachWeeklyAiReviewEvidencePacketFromPeriodicInputV2(input),
      modelId: settings.modelId,
      now,
    });
    return Object.freeze(result);
  }
}
