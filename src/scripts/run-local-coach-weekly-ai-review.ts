import { loadEnvConfig } from "@next/env";

import { generateLocalCoachWeeklyAiReview } from "@/src/modules/coach/server/coach-weekly-ai-review-openai-adapter";
import { CoachReflectionService } from "@/src/modules/coach/server/coach-reflection-service";
import { CoachWeeklyAiReviewInputService } from "@/src/modules/coach/server/coach-weekly-ai-review-input-service";
import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import { JournalTradingDayReviewService } from "@/src/modules/journal/server/reviews/journal-trading-day-review-service";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

async function main(): Promise<void> {
  loadEnvConfig(process.cwd(), true);
  const anchorDate = process.argv[2] ?? "2026-07-24";
  const input = withReadonlyPlatformDatabase({}, (database) => {
    const scope = deriveDevelopmentOwnerJournalScope(database).scope;
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
    ).read(scope, anchorDate);
  });
  const review = await generateLocalCoachWeeklyAiReview(input);
  process.stdout.write(`${JSON.stringify({
    status: "ok",
    week: input.week,
    review,
  }, null, 2)}\n`);
}

void main();
