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

import type { CoachWeeklyAiReviewInput } from "../contracts/weekly-ai-review-input-contracts";
import { CoachAiReviewRepository } from "./coach-ai-review-repository";
import { CoachReflectionService } from "./coach-reflection-service";
import { CoachWeeklyAiReviewInputService } from "./coach-weekly-ai-review-input-service";

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
