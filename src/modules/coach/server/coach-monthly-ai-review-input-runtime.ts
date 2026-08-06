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
  CoachMonthlyAiReviewInput,
  CoachMonthlyAiReviewPeriod,
} from "../contracts/monthly-ai-review-input-contracts";
import { CoachAiReviewRepository } from "./coach-ai-review-repository";
import { CoachMonthlyAiReviewInputService } from "./coach-monthly-ai-review-input-service";
import { CoachReflectionService } from "./coach-reflection-service";

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
