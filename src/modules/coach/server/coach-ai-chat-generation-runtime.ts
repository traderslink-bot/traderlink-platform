import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalProductReadService } from "@/src/modules/journal/server/product/journal-product-read-service";
import { JournalTradeTrackerReadService } from "@/src/modules/journal/server/product/journal-trade-tracker-read-service";
import { JournalTradeStyleRepository } from "@/src/modules/journal/server/trade-style/journal-trade-style-repository";
import { JournalTradeStyleService } from "@/src/modules/journal/server/trade-style/journal-trade-style-service";
import { JournalSwingNoteRepository } from "@/src/modules/journal/server/swing-notes/journal-swing-note-repository";
import { JournalSwingNoteService } from "@/src/modules/journal/server/swing-notes/journal-swing-note-service";
import { createJournalManualTradePreviewAuthority } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-authority";
import { loadJournalPrivacyHmacConfiguration } from "@/src/modules/journal/server/imports/journal-import-service";
import { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";

import { CoachAiChatFactualToolService } from "./coach-ai-chat-factual-tool-service";
import {
  CoachAiChatGenerationService,
  type CoachAiChatGenerationServiceResult,
} from "./coach-ai-chat-generation-service";
import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiChatTradeDetailService } from "./coach-ai-chat-trade-detail-service";
import { CoachAiChatJournalContextService } from "./coach-ai-chat-journal-context-service";
import { CoachAiChatProductHelpService } from "./coach-ai-chat-product-help-service";
import { CoachAiChatSavedReviewService } from "./coach-ai-chat-saved-review-service";
import { CoachAiChatDashboardContextService } from "./coach-ai-chat-dashboard-context-service";
import { CoachAiChatAnalyticsPageToolService } from "./coach-ai-chat-analytics-page-tool-service";
import { CoachAiChatProductContextService } from "./coach-ai-chat-product-context-service";
import { CoachAiChatTradeAnalyzerToolService } from "./coach-ai-chat-trade-analyzer-tool-service";
import { CoachAiChatAnnotationContextService } from "./coach-ai-chat-annotation-context-service";
import { CoachAiReviewRepository } from "./coach-ai-review-repository";
import { CoachReflectionService } from "./coach-reflection-service";
import { CoachAiDailyCompanionRepository } from "./coach-ai-daily-companion-repository";
import { CoachAiManualEntryDraftRepository } from "./coach-ai-manual-entry-draft-repository";
import { CoachAiReviewDeliveryChangeRepository } from "./coach-ai-review-delivery-change-repository";
import { CoachAiChatActionDraftService } from "./coach-ai-chat-action-draft-service";
import type { CoachAiDailyCompanionResolvedContext } from "../contracts/ai-daily-companion-contracts";
import type {
  CoachAiChatAnalysisScope,
  CoachAiChatMessageIntent,
} from "../contracts/ai-chat-contracts";
import type { CoachAiReviewDeliveryScheduleSnapshot } from "../contracts/ai-review-delivery-change-contracts";

export async function generateCoachAiChatSavedAnswer(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    conversationId: string;
    question: string;
    intent?: CoachAiChatMessageIntent;
    analysisScope?: CoachAiChatAnalysisScope;
    idempotencySha256: string;
    resolveTrustedContext?: (() => CoachAiDailyCompanionResolvedContext) | null;
    resolveManualEntryDefaults?: (() => Readonly<{
      sourceTimezone: string;
      tradeCurrency: string;
    }>) | null;
    resolveReviewDelivery?: (() => CoachAiReviewDeliveryScheduleSnapshot) | null;
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
    const dashboard = new JournalDashboardReadModelService(facts);
    const manualTradeAuthority = createJournalManualTradePreviewAuthority(
      loadJournalPrivacyHmacConfiguration(process.env),
    );
    const tradeStyles = new JournalTradeStyleService(
      new JournalTradeStyleRepository(database),
      manualTradeAuthority,
    );
    const swingNotes = new JournalSwingNoteService(
      new JournalSwingNoteRepository(database),
      tradeStyles,
    );
    const journalContext = new CoachAiChatJournalContextService(
      new CoachReflectionService(
        dashboard,
        annotations,
        new JournalProductReadService(database),
      ),
      annotations,
    );
    const savedReviews = new CoachAiChatSavedReviewService(
      new CoachAiReviewRepository(database),
    );
    const analyticsService = new JournalAnalyticsService(facts);
    return await new CoachAiChatGenerationService(
      new CoachAiChatRepository(database),
      new CoachAiChatProviderControlsRepository(database),
      new CoachAiChatFactualToolService(analyticsService),
      new CoachAiChatTradeDetailService(facts, annotations),
      undefined,
      new CoachAiDailyCompanionRepository(database),
      new CoachAiManualEntryDraftRepository(database),
      new CoachAiReviewDeliveryChangeRepository(database),
      Object.freeze({
        journalContext,
        productHelp: new CoachAiChatProductHelpService(),
        savedReviews,
        dashboardContext: new CoachAiChatDashboardContextService(
          database,
          dashboard,
          new JournalTradeTrackerReadService(database, tradeStyles, swingNotes),
          journalContext,
          savedReviews,
        ),
        analyticsPages: new CoachAiChatAnalyticsPageToolService(analyticsService),
        productContext: new CoachAiChatProductContextService(database),
        tradeAnalyzer: new CoachAiChatTradeAnalyzerToolService(database, analyticsService),
        annotations: new CoachAiChatAnnotationContextService(facts, dashboard, annotations),
      }),
      new CoachAiChatActionDraftService(database),
    ).generateSavedAnswer(scope, input);
  } finally {
    database.close();
  }
}
