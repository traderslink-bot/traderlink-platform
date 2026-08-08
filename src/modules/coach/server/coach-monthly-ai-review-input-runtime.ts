import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";

import type {
  CoachMonthlyAiReviewInputV2,
  CoachMonthlyAiReviewInput,
  CoachMonthlyAiReviewPeriod,
} from "../contracts/monthly-ai-review-input-contracts";
import { COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION } from
  "../contracts/weekly-ai-review-output-contracts";
import { COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V2 } from
  "../contracts/monthly-ai-review-output-contracts";
import {
  CoachAiReviewRepository,
  type CoachAiReviewEvidenceManifestV2,
} from "./coach-ai-review-repository";
import {
  assembleCoachMonthlyAiReviewInputV2,
  CoachMonthlyAiReviewInputService,
} from "./coach-monthly-ai-review-input-service";
import { CoachReflectionService } from "./coach-reflection-service";
import {
  buildCoachPeriodicAiReviewSnapshotV2,
  type CoachPeriodicAiReviewSnapshotV2,
} from "./coach-weekly-ai-review-input-runtime";
import type { CoachMonthlyReviewPeriodV2 } from "./coach-monthly-review-due-time";
import { CoachUsEquitiesReviewCalendarService } from
  "./market-calendar/coach-us-equities-review-calendar-service";

export function readCoachMonthlyAiReviewInput(
  scope: WorkspaceAccessScope,
  period: CoachMonthlyAiReviewPeriod,
): CoachMonthlyAiReviewInput {
  return withReadonlyPlatformDatabase({}, (database) =>
    buildCoachMonthlyAiReviewInput(database, scope, period));
}

export function buildCoachMonthlyAiReviewInput(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  period: CoachMonthlyAiReviewPeriod,
): CoachMonthlyAiReviewInput {
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(database),
    new JournalRuleRepository(database),
  );
  const reflections = new CoachReflectionService(
    new JournalDashboardReadModelService(
      new JournalAnalyticsFactSetService(
        new JournalAnalyticsFactSetRepository(database),
      ),
    ),
    annotations,
    new JournalProductReadService(database),
  );
  const reviews = new CoachAiReviewRepository(database);
  const input = new CoachMonthlyAiReviewInputService(
    reflections,
    annotations,
    new JournalTradingDayReviewService(database),
    reviews,
  ).read(scope, period);
  const prior = reviews.readLatestIssuedMonthlyReviewBefore(scope, input.month.startDate);
  if (!prior) return input;
  return Object.freeze({
    ...input,
    priorMonthlyReview: Object.freeze({
      monthStartDate: prior.monthStartDate,
      monthEndDate: prior.monthEndDate,
      monthlyReview: prior.output.monthlyReview,
      progressAcrossMonth: prior.output.progressAcrossMonth,
      recurringFriction: prior.output.recurringFriction,
      focusFollowThrough: prior.output.focusFollowThrough,
      nextMonthFocuses: Object.freeze([...prior.output.nextMonthFocuses]),
      incompleteRecord: prior.output.incompleteRecord,
    }),
  });
}

export type CoachMonthlyNarrativePeriodV2 = Readonly<{
  cadence: "weekly" | "two_week" | "monthly_only";
  periodStartDate: string;
  periodEndDate: string;
}>;

export type CoachMonthlyAiReviewBuildRequestV2 = Readonly<{
  period: CoachMonthlyReviewPeriodV2;
  scheduledAtUtc: string;
  firstEnabledMarketDate: string;
  narrativePeriods: readonly CoachMonthlyNarrativePeriodV2[];
  limitationReasonCodes?: readonly string[];
  calendar?: CoachUsEquitiesReviewCalendarService;
}>;

export type CoachMonthlyAiReviewSnapshotV2 = Readonly<{
  input: CoachMonthlyAiReviewInputV2;
  evidenceManifest: CoachAiReviewEvidenceManifestV2;
}>;

function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
      !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_INVALID_PERIOD");
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOfWeek(value: string): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  return shiftIsoDate(value, -((date.getUTCDay() + 6) % 7));
}

function safeReviewRef(issuedReviewId: string): string {
  return `issued_review_sha256:${createHash("sha256")
    .update(`${issuedReviewId}\n`, "utf8").digest("hex")}`;
}

/**
 * Builds an exact-calendar-month fact snapshot while routing reflection prose
 * through whole weekly/two-week periods. Cross-boundary review prose is
 * non-statistical and belongs to the month containing that period's Friday.
 */
export function buildCoachMonthlyAiReviewSnapshotV2(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  request: CoachMonthlyAiReviewBuildRequestV2,
): CoachMonthlyAiReviewSnapshotV2 {
  const calendar = request.calendar ?? new CoachUsEquitiesReviewCalendarService();
  const weeklySnapshots: CoachPeriodicAiReviewSnapshotV2[] = [];
  for (
    let monday = mondayOfWeek(request.period.coverageStartDate);
    monday <= request.period.coverageEndDate;
    monday = shiftIsoDate(monday, 7)
  ) {
    const cohort = calendar.cohortStarting(monday);
    const metadata = calendar.metadataForRange(
      cohort.mondayDate,
      cohort.fridayDate,
    );
    weeklySnapshots.push(buildCoachPeriodicAiReviewSnapshotV2(database, scope, {
      calendar,
      period: Object.freeze({
        cadence: "weekly",
        startDate: cohort.mondayDate,
        endDate: cohort.fridayDate,
        calendarTimezone: "America/New_York",
        calendarId: metadata.calendarId,
        calendarEvidenceDigestSha256: metadata.evidenceDigestSha256,
        cohorts: Object.freeze([cohort]),
      }),
      reflectionEligibilityStartDate: request.firstEnabledMarketDate,
    }));
  }
  const inCoverage = (date: string) => date >= request.period.coverageStartDate &&
    date <= request.period.coverageEndDate;
  const factDays = weeklySnapshots.flatMap((snapshot) =>
    snapshot.input.reviewPeriodMarketFacts.days.filter((day) => inCoverage(day.reviewMarketDate)));
  const reflectionCoverage = weeklySnapshots.flatMap((snapshot) =>
    snapshot.input.reflectionCoverage.filter((coverage) => inCoverage(coverage.reviewMarketDate)));
  const reflections = weeklySnapshots.flatMap((snapshot) =>
    snapshot.input.completedDailyReflections.filter((reflection) =>
      reflection.reviewMarketDate >= request.firstEnabledMarketDate));
  const ownerMonth = request.period.calendarMonthEndDate.slice(0, 7);
  const reviews = new CoachAiReviewRepository(database);
  const issued = reviews.listIssuedReviewsV2(scope, {
    beforePeriodEndDate: shiftIsoDate(request.period.calendarMonthEndDate, 1),
    reviewKinds: ["weekly", "two_week"],
    limit: 500,
  }).filter((review) => review.periodEndDate.slice(0, 7) === ownerMonth);
  const representedEvidenceRefs = new Set(issued.flatMap((review) =>
    review.representedEvidenceRefs));
  const reviewNarrativeContext = issued.map((review) => {
    if (review.output.contractVersion !== COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION) {
      throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_OUTPUT_MISMATCH");
    }
    return Object.freeze({
      reviewRef: safeReviewRef(review.issuedReviewId),
      reviewKind: review.reviewKind as "weekly" | "two_week",
      periodStartDate: review.periodStartDate,
      periodEndDate: review.periodEndDate,
      narrativeOwnerMonth: ownerMonth,
      representedEvidenceRefs: Object.freeze([...review.representedEvidenceRefs]),
      statisticalUse: "prohibited" as const,
      reviewSummary: review.output.reviewSummary,
      whatImproved: review.output.whatImproved,
      whatHeldYouBack: review.output.whatHeldYouBack,
      focusFollowThrough: review.output.focusFollowThrough,
      nextPeriodFocuses: Object.freeze([...review.output.nextPeriodFocuses]),
      incompleteRecord: review.output.incompleteRecord,
    });
  });
  const rawReflectionContext = reflections.flatMap((reflection) => {
    if (representedEvidenceRefs.has(reflection.evidenceRef)) return [];
    const route = request.narrativePeriods.find((period) =>
      reflection.reviewMarketDate >= period.periodStartDate &&
      reflection.reviewMarketDate <= period.periodEndDate);
    if (!route) throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_NARRATIVE_ROUTE_MISSING");
    const narrativeOwnerMonth = route.periodEndDate.slice(0, 7);
    if (narrativeOwnerMonth !== ownerMonth) return [];
    return [Object.freeze({
      reflection,
      sourcePeriodStartDate: route.periodStartDate,
      sourcePeriodEndDate: route.periodEndDate,
      narrativeOwnerMonth,
      contextKind: "current_month_raw" as const,
      statisticalUse: "prohibited" as const,
    })];
  });
  const accountCoverage = weeklySnapshots.at(-1)?.input.reviewPeriodMarketFacts;
  const focuses = new Map(weeklySnapshots.flatMap((snapshot) =>
    snapshot.input.currentFocuses.map((focus) =>
      [`${focus.tradingDate}:${focus.revisionNumber}`, focus] as const)));
  const prior = request.period.periodCoverage === "partial_month" ? null :
    reviews.listIssuedReviewsV2(scope, {
    beforePeriodEndDate: request.period.calendarMonthStartDate,
    reviewKinds: ["monthly"],
    limit: 1,
  }).at(0) ?? null;
  if (prior && prior.output.contractVersion !==
      COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V2) {
    throw new Error("TRADERLINK_COACH_MONTHLY_REVIEW_OUTPUT_MISMATCH");
  }
  const input = assembleCoachMonthlyAiReviewInputV2({
    calendarMonth: Object.freeze({
      ...request.period,
      calendarTimezone: request.period.timezone,
      currency: weeklySnapshots[0]?.input.period.currency ?? null,
      scheduledAtUtc: request.scheduledAtUtc,
    }),
    calendarMonthFactDays: factDays,
    accountCoverage: Object.freeze({
      legitimateOpenCount: accountCoverage?.accountLegitimateOpenCount ?? 0,
      needsDecisionCount: accountCoverage?.accountNeedsDecisionCount ?? 0,
      pendingDataDecisionCount: accountCoverage?.accountPendingDataDecisionCount ?? 0,
    }),
    reviewNarrativeContext,
    rawReflectionContext,
    reflectionCoverage,
    priorMonthlyReview: prior ? Object.freeze({
      reviewRef: safeReviewRef(prior.issuedReviewId),
      calendarMonthStartDate: prior.periodStartDate,
      calendarMonthEndDate: prior.periodEndDate,
      reviewSummary: prior.output.reviewSummary,
      whatImproved: prior.output.whatImproved,
      whatHeldYouBack: prior.output.whatHeldYouBack,
      focusFollowThrough: prior.output.focusFollowThrough,
      nextPeriodFocuses: Object.freeze([...prior.output.nextPeriodFocuses]),
      incompleteRecord: prior.output.incompleteRecord,
    }) : null,
    currentFocuses: Object.freeze([...focuses.values()]),
    limitationReasonCodes: request.limitationReasonCodes,
    calendar,
  });
  const rawEvidenceRefs = new Set(rawReflectionContext.map((context) =>
    context.reflection.evidenceRef));
  const evidenceByRef = new Map<string, CoachAiReviewEvidenceManifestV2["evidence"][number]>();
  for (const snapshot of weeklySnapshots) {
    for (const evidence of snapshot.evidenceManifest.evidence) {
      if (rawEvidenceRefs.has(evidence.evidenceRef)) evidenceByRef.set(evidence.evidenceRef, evidence);
    }
  }
  for (const review of issued) {
    for (const evidence of reviews.readEvidenceManifestV2(scope, review.requestId).evidence) {
      if (!review.representedEvidenceRefs.includes(evidence.evidenceRef)) continue;
      evidenceByRef.set(evidence.evidenceRef, Object.freeze({
        ...evidence,
        tradeNoteRevisionIds: Object.freeze([...evidence.tradeNoteRevisionIds]),
        representedByRequestId: review.requestId,
      }));
    }
  }
  return Object.freeze({
    input,
    evidenceManifest: Object.freeze({
      contractVersion: "traderlink_coach_ai_review_evidence_manifest_v2",
      evidence: Object.freeze([...evidenceByRef.values()].sort((left, right) =>
        left.reviewMarketDate.localeCompare(right.reviewMarketDate))),
    }),
  });
}

export function readCoachMonthlyAiReviewSnapshotV2(
  scope: WorkspaceAccessScope,
  request: CoachMonthlyAiReviewBuildRequestV2,
): CoachMonthlyAiReviewSnapshotV2 {
  return withReadonlyPlatformDatabase({}, (database) =>
    buildCoachMonthlyAiReviewSnapshotV2(database, scope, request));
}
