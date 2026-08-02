import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";

import type { CoachReflectionReadModel } from "../contracts/reflection-loop-contracts";
import type { CoachReflectionRequest } from "./coach-reflection-request";
import { CoachReflectionService } from "./coach-reflection-service";

export function readCoachReflection(
  scope: WorkspaceAccessScope,
  request: CoachReflectionRequest,
): CoachReflectionReadModel {
  return withReadonlyPlatformDatabase({}, (database) => {
    const facts = new JournalAnalyticsFactSetService(
      new JournalAnalyticsFactSetRepository(database),
    );
    return new CoachReflectionService(
      new JournalDashboardReadModelService(facts),
      new JournalAnnotationService(
        new JournalAnnotationRepository(database),
        new JournalRuleRepository(database),
      ),
      new JournalProductReadService(database),
    ).read(scope, request);
  });
}
