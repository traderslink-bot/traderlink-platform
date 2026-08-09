import "server-only";

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
  CoachPeriodicAiReviewInputV2,
  CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import {
  CoachAiReviewRepository,
  type CoachAiReviewEvidenceManifestV2,
} from "./coach-ai-review-repository";
import { CoachAiReviewSupplementalEvidenceRepository } from
  "./coach-ai-review-supplemental-evidence-repository";
import { CoachReflectionService } from "./coach-reflection-service";
import {
  type CoachPeriodicAiReviewBuildRequestV2,
  CoachWeeklyAiReviewInputService,
} from "./coach-weekly-ai-review-input-service";

export function readCoachWeeklyAiReviewInput(
  scope: WorkspaceAccessScope,
  anchorDate: string,
): CoachWeeklyAiReviewInput {
  return withReadonlyPlatformDatabase({}, (database) =>
    buildCoachWeeklyAiReviewInput(database, scope, anchorDate));
}

export function buildCoachWeeklyAiReviewInput(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  anchorDate: string,
): CoachWeeklyAiReviewInput {
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
  const input = new CoachWeeklyAiReviewInputService(
    reflections,
    annotations,
    new JournalTradingDayReviewService(database),
    undefined,
    new CoachAiReviewSupplementalEvidenceRepository(database),
  ).read(scope, anchorDate);
  const prior = new CoachAiReviewRepository(database)
    .readLatestIssuedWeeklyReviewBefore(scope, input.week.startDate);
  if (!prior) return input;
  return Object.freeze({
    ...input,
    priorReview: Object.freeze({
      weekStartDate: prior.weekStartDate,
      weekEndDate: prior.weekEndDate,
      weeklyReview: prior.output.weeklyReview,
      whatImproved: prior.output.whatImproved,
      whatHeldYouBack: prior.output.whatHeldYouBack,
      focusFollowThrough: prior.output.focusFollowThrough,
      nextWeekFocuses: Object.freeze([...prior.output.nextWeekFocuses]),
      incompleteRecord: prior.output.incompleteRecord,
    }),
  });
}

export function readCoachPeriodicAiReviewInputV2(
  scope: WorkspaceAccessScope,
  request: CoachPeriodicAiReviewBuildRequestV2,
): CoachPeriodicAiReviewInputV2 {
  return withReadonlyPlatformDatabase({}, (database) =>
    buildCoachPeriodicAiReviewInputV2(database, scope, request));
}

export function buildCoachPeriodicAiReviewInputV2(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  request: CoachPeriodicAiReviewBuildRequestV2,
): CoachPeriodicAiReviewInputV2 {
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
  return new CoachWeeklyAiReviewInputService(
    reflections,
    annotations,
    new JournalTradingDayReviewService(database),
    request.calendar,
    new CoachAiReviewSupplementalEvidenceRepository(database),
  ).readPeriodicV2(scope, request);
}

export type CoachPeriodicAiReviewSnapshotV2 = Readonly<{
  input: CoachPeriodicAiReviewInputV2;
  evidenceManifest: CoachAiReviewEvidenceManifestV2;
}>;

function accountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

/**
 * Builds the public provider input and its private, account-scoped lineage
 * manifest together. Database identifiers never enter the provider input.
 */
export function buildCoachPeriodicAiReviewSnapshotV2(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  request: CoachPeriodicAiReviewBuildRequestV2,
): CoachPeriodicAiReviewSnapshotV2 {
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
  const input = new CoachWeeklyAiReviewInputService(
    reflections,
    annotations,
    new JournalTradingDayReviewService(database),
    request.calendar,
    new CoachAiReviewSupplementalEvidenceRepository(database),
  ).readPeriodicV2(scope, request);
  const account = accountId(scope);
  const carryByEvidenceRef = new Map(input.carryForwardEvidenceBundles.map((bundle) =>
    [bundle.evidenceRef, bundle] as const));
  const reflectionsByEvidenceRef = new Map([
    ...input.completedDailyReflections,
    ...(input.savedDailyReflections ?? []),
    ...input.carryForwardEvidenceBundles.map((bundle) => bundle.reflection),
  ].map((reflection) => [reflection.evidenceRef, reflection] as const));
  const evidence = [...reflectionsByEvidenceRef.values()]
    .sort((left, right) => left.reviewMarketDate.localeCompare(right.reviewMarketDate))
    .map((reflection) => {
      const review = database.prepare<[
        string, string, string
      ], Readonly<{
        trading_day_id: string;
        trading_day_review_id: string;
        current_revision: number;
        review_status: "reviewed" | "incomplete";
      }>>(`SELECT day.trading_day_id, review.trading_day_review_id,
  review.current_revision, review.review_status
FROM journal_trading_days day
JOIN journal_trading_day_reviews review
  ON review.workspace_id = day.workspace_id
 AND review.account_id = day.account_id
 AND review.trading_day_id = day.trading_day_id
WHERE day.workspace_id = ? AND day.account_id = ?
  AND day.trading_date = ? AND day.trading_timezone = 'America/New_York'
  AND day.status = 'active' AND review.review_status IN ('reviewed', 'incomplete')`).get(
        scope.workspaceId,
        account,
        reflection.reviewMarketDate,
      );
      const expectedReviewStatus = reflection.reflectionState === "incomplete"
        ? "incomplete"
        : "reviewed";
      if (!review || review.current_revision !== reflection.reviewedStatusRevision ||
          review.review_status !== expectedReviewStatus) {
        throw new Error("TRADERLINK_COACH_REVIEW_EVIDENCE_REVISION_MISMATCH");
      }
      const dailyNote = database.prepare<[
        string, string, string
      ], Readonly<{ current_revision_id: string }>>(`SELECT current_revision_id
FROM journal_daily_notes
WHERE workspace_id = ? AND account_id = ? AND trading_day_id = ?`).get(
        scope.workspaceId,
        account,
        review.trading_day_id,
      );
      const dailyModel = reflections.read(scope, {
        period: "daily",
        anchorDate: reflection.reviewMarketDate,
        currency: input.period.currency,
      });
      const roundTripIds = dailyModel.days
        .find((day) => day.date === reflection.reviewMarketDate)?.trades
        .map((trade) => trade.roundTripId) ?? [];
      const tradeNoteRevisionIds = roundTripIds.length === 0
        ? []
        : database.prepare(`SELECT current_revision_id
FROM journal_round_trip_notes
WHERE workspace_id = ? AND account_id = ?
  AND round_trip_id IN (${roundTripIds.map(() => "?").join(", ")})
ORDER BY current_revision_id`).all(
            scope.workspaceId,
            account,
            ...roundTripIds,
          ).map((row) => (row as Readonly<{ current_revision_id: string }>).current_revision_id);
      const carry = carryByEvidenceRef.get(reflection.evidenceRef) ?? null;
      const sourcePeriodStartDate = carry?.sourcePeriodStartDate ?? input.period.startDate;
      const sourcePeriodEndDate = carry?.sourcePeriodEndDate ?? input.period.endDate;
      return Object.freeze({
        evidenceRef: reflection.evidenceRef,
        tradingDayReviewId: review.trading_day_review_id,
        reviewedStatusRevision: review.current_revision,
        reviewStatus: review.review_status,
        dailyNoteRevisionId: dailyNote?.current_revision_id ?? null,
        tradeNoteRevisionIds: Object.freeze(tradeNoteRevisionIds),
        reviewMarketDate: reflection.reviewMarketDate,
        sourcePeriodStartDate,
        sourcePeriodEndDate,
        narrativeOwnerMonth: (carry?.destinationPeriodEndDate ?? sourcePeriodEndDate).slice(0, 7),
        carryDestinationPeriodStartDate: carry?.destinationPeriodStartDate ?? null,
        carryDestinationPeriodEndDate: carry?.destinationPeriodEndDate ?? null,
        representedByRequestId: null,
      });
    });
  return Object.freeze({
    input,
    evidenceManifest: Object.freeze({
      contractVersion: "traderlink_coach_ai_review_evidence_manifest_v2",
      evidence: Object.freeze(evidence),
    }),
  });
}

export function readCoachPeriodicAiReviewSnapshotV2(
  scope: WorkspaceAccessScope,
  request: CoachPeriodicAiReviewBuildRequestV2,
): CoachPeriodicAiReviewSnapshotV2 {
  return withReadonlyPlatformDatabase({}, (database) =>
    buildCoachPeriodicAiReviewSnapshotV2(database, scope, request));
}
