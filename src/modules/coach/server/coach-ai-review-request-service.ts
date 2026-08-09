import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import {
  CoachAiReviewRepository,
  type CoachAiReviewKindV2,
} from "./coach-ai-review-repository";
import { CoachMonthlyAiReviewRunner } from "./coach-monthly-ai-review-runner";
import { CoachWeeklyAiReviewRunner } from "./coach-weekly-ai-review-runner";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export type CoachAiReviewManualRequestV2 = Readonly<{
  reviewKind: CoachAiReviewKindV2;
  periodStartDate: string;
  periodEndDate: string;
}>;

export type CoachAiReviewManualRequestResultV2 =
  | Readonly<{ state: "requested" | "already_requested"; requestId: string }>
  | Readonly<{ state: "not_available" }>;

export type CoachAiReviewAutomaticRequestSummaryV2 = Readonly<{
  eligibleCount: number;
  requestedCount: number;
  reusedCount: number;
}>;

function validIdentity(input: CoachAiReviewManualRequestV2): boolean {
  return ["weekly", "two_week", "monthly"].includes(input.reviewKind) &&
    DATE_PATTERN.test(input.periodStartDate) && DATE_PATTERN.test(input.periodEndDate) &&
    input.periodEndDate >= input.periodStartDate;
}

/**
 * Freezes one eligible V2 review request without reserving paid capacity,
 * starting a provider attempt, or contacting an AI provider.
 */
export class CoachAiReviewRequestService {
  constructor(private readonly database: Database.Database) {}

  requestManualV2(
    scope: WorkspaceAccessScope,
    input: CoachAiReviewManualRequestV2,
    now = new Date(),
  ): CoachAiReviewManualRequestResultV2 {
    if (!validIdentity(input)) return Object.freeze({ state: "not_available" });

    const plan = input.reviewKind === "monthly"
      ? new CoachMonthlyAiReviewRunner(this.database).planAccountV2(scope, now)
          .find((candidate) =>
            candidate.period.calendarMonthStartDate === input.periodStartDate &&
            candidate.period.calendarMonthEndDate === input.periodEndDate)
      : new CoachWeeklyAiReviewRunner(this.database).planAccountV2(scope, now)
          .find((candidate) =>
            candidate.period.cadence === input.reviewKind &&
            candidate.period.startDate === input.periodStartDate &&
            candidate.period.endDate === input.periodEndDate);
    if (!plan) return Object.freeze({ state: "not_available" });
    if (plan.state === "already_requested" && plan.existingRequestId) {
      return Object.freeze({
        state: "already_requested",
        requestId: plan.existingRequestId,
      });
    }
    if ((plan.state !== "manual_available" && plan.state !== "automatic_ready") ||
        !plan.snapshot) {
      return Object.freeze({ state: "not_available" });
    }

    const repository = new CoachAiReviewRepository(this.database);
    const existing = repository.readPeriodRequestByIdentityV2(
      scope,
      input.reviewKind,
      input.periodStartDate,
      input.periodEndDate,
    );
    if (existing) {
      return Object.freeze({ state: "already_requested", requestId: existing.requestId });
    }
    const request = repository.createOrReadPeriodRequestV2(
      scope,
      plan.snapshot.input,
      plan.snapshot.evidenceManifest,
      "manual",
      plan.priorIssuedReviewId,
      now,
    );
    return Object.freeze({ state: "requested", requestId: request.requestId });
  }

  /**
   * Creates pending requests only for sealed periods whose facts/reflections
   * satisfy the meaningful-evidence gate. This is deliberately not scheduled
   * here and never starts provider execution.
   */
  requestAutomaticReadyV2(now = new Date()): CoachAiReviewAutomaticRequestSummaryV2 {
    const plans = [
      ...new CoachWeeklyAiReviewRunner(this.database).planV2(now),
      ...new CoachMonthlyAiReviewRunner(this.database).planV2(now),
    ].filter((plan) => plan.state === "automatic_ready" && plan.snapshot !== null);
    const repository = new CoachAiReviewRepository(this.database);
    let requestedCount = 0;
    let reusedCount = 0;
    for (const plan of plans) {
      if (!plan.snapshot) continue;
      const reviewKind = "calendarMonth" in plan.snapshot.input
        ? "monthly"
        : plan.snapshot.input.period.cadence;
      const existing = repository.readPeriodRequestByIdentityV2(
        plan.scope,
        reviewKind,
        "calendarMonth" in plan.snapshot.input
          ? plan.snapshot.input.calendarMonth.calendarMonthStartDate
          : plan.snapshot.input.period.startDate,
        "calendarMonth" in plan.snapshot.input
          ? plan.snapshot.input.calendarMonth.calendarMonthEndDate
          : plan.snapshot.input.period.endDate,
      );
      repository.createOrReadPeriodRequestV2(
        plan.scope,
        plan.snapshot.input,
        plan.snapshot.evidenceManifest,
        "automatic",
        plan.priorIssuedReviewId,
        now,
      );
      if (existing) reusedCount += 1;
      else requestedCount += 1;
    }
    return Object.freeze({
      eligibleCount: plans.length,
      requestedCount,
      reusedCount,
    });
  }
}
