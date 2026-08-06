import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";

import { CoachAiChatFactualToolService } from "./coach-ai-chat-factual-tool-service";
import {
  CoachAiChatGenerationService,
  type CoachAiChatGenerationServiceResult,
} from "./coach-ai-chat-generation-service";
import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiChatTradeDetailService } from "./coach-ai-chat-trade-detail-service";

export async function generateCoachAiChatSavedAnswer(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    conversationId: string;
    question: string;
    idempotencySha256: string;
  }>,
): Promise<CoachAiChatGenerationServiceResult> {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const facts = new JournalAnalyticsFactSetService(
      new JournalAnalyticsFactSetRepository(database),
    );
    const annotations = new JournalAnnotationService(
      new JournalAnnotationRepository(database),
      new JournalRuleRepository(database),
    );
    return await new CoachAiChatGenerationService(
      new CoachAiChatRepository(database),
      new CoachAiChatProviderControlsRepository(database),
      new CoachAiChatFactualToolService(new JournalAnalyticsService(facts)),
      new CoachAiChatTradeDetailService(facts, annotations),
    ).generateSavedAnswer(scope, input);
  } finally {
    database.close();
  }
}
