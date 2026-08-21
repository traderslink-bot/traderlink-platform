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
import {
  createJournalReportingCurrencyFactSetReader,
  type JournalReportingCurrencyContext,
} from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";

import { CoachAiChatFactualToolService } from "./coach-ai-chat-factual-tool-service";
import {
  CoachAiChatGenerationService,
  type CoachAiChatGenerationServiceResult,
} from "./coach-ai-chat-generation-service";
import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiChatGenerationRecoveryService } from "./coach-ai-chat-generation-recovery-service";
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
import { CoachAiChatSavedAnalysisService } from "./coach-ai-chat-saved-analysis-service";
import { CoachAiReviewGenerationCompatibilityRepository } from
  "./coach-ai-review-generation-compatibility";
import { CoachReflectionService } from "./coach-reflection-service";
import { CoachAiDailyCompanionRepository } from "./coach-ai-daily-companion-repository";
import { CoachAiManualEntryDraftRepository } from "./coach-ai-manual-entry-draft-repository";
import { CoachAiReviewDeliveryChangeRepository } from "./coach-ai-review-delivery-change-repository";
import { CoachAiChatActionDraftService } from "./coach-ai-chat-action-draft-service";
import { CoachAiRelationshipMemoryRepository } from
  "./coach-ai-relationship-memory-repository";
import { CoachAiChatConversationStateRepository } from
  "./coach-ai-chat-conversation-state-repository";
import type { CoachAiDailyCompanionResolvedContext } from "../contracts/ai-daily-companion-contracts";
import type {
  CoachAiChatAnalysisScope,
  CoachAiChatMessageIntent,
} from "../contracts/ai-chat-contracts";
import type { CoachAiChatPageContext } from "../contracts/ai-chat-page-context-contracts";
import type { CoachAiReviewDeliveryScheduleSnapshot } from "../contracts/ai-review-delivery-change-contracts";

/** Allows route-level reads to clear only safely expired pending messages first. */
export function reconcileStaleCoachAiChatGenerations(
  scope: WorkspaceAccessScope,
  input: Readonly<{ conversationId?: string | null }> = Object.freeze({}),
  now = new Date(),
): number {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return new CoachAiChatGenerationRecoveryService(
      new CoachAiChatRepository(database),
      new CoachAiChatProviderControlsRepository(database),
    ).reconcile(scope, input, now);
  } finally {
    database.close();
  }
}

export async function generateCoachAiChatSavedAnswer(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    conversationId: string;
    question: string;
    intent?: CoachAiChatMessageIntent;
    analysisScope?: CoachAiChatAnalysisScope;
    pageContext?: CoachAiChatPageContext | null;
    reportingContext: JournalReportingCurrencyContext;
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
    const sourceFacts = new JournalAnalyticsFactSetService(
      new JournalAnalyticsFactSetRepository(database),
    );
    const facts = createJournalReportingCurrencyFactSetReader(
      sourceFacts,
      input.reportingContext,
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
      new CoachAiReviewGenerationCompatibilityRepository(database),
    );
    const analyticsService = new JournalAnalyticsService(
      facts,
      input.reportingContext.reportingCurrency,
    );
    if (!scope.activeAccountId) {
      throw new TypeError("AI Chat requires an active Journal account.");
    }
    const activeAccountProfile = database.prepare<[string, string], Readonly<{
      base_currency: string;
      trading_timezone: string;
    }>>(`SELECT base_currency, trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'`).get(
      scope.workspaceId,
      scope.activeAccountId,
    );
    const ruleSourceCurrency = activeAccountProfile?.base_currency;
    const tradingTimezone = activeAccountProfile?.trading_timezone;
    if (!tradingTimezone) {
      throw new TypeError("AI Chat requires an active Journal account timezone.");
    }
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
          Object.freeze({
            reportingContext: input.reportingContext,
            resolveRoundTripId: (account, positionRef) =>
              tradeStyles.resolvePosition(account, positionRef).roundTripId,
          }),
        ),
        analyticsPages: new CoachAiChatAnalyticsPageToolService(analyticsService),
        productContext: new CoachAiChatProductContextService(database),
        tradeAnalyzer: new CoachAiChatTradeAnalyzerToolService(
          database,
          analyticsService,
          Object.freeze({ reportingContext: input.reportingContext }),
        ),
        annotations: new CoachAiChatAnnotationContextService(
          facts,
          dashboard,
          annotations,
          Object.freeze({
            reportingContext: input.reportingContext,
            ...(ruleSourceCurrency ? { ruleSourceCurrency } : {}),
          }),
        ),
        savedAnalysis: new CoachAiChatSavedAnalysisService(database),
      }),
      new CoachAiChatActionDraftService(database),
      input.reportingContext.reportingCurrency,
      new CoachAiRelationshipMemoryRepository(database),
      new CoachAiChatConversationStateRepository(database),
      tradingTimezone,
    ).generateSavedAnswer(scope, input);
  } finally {
    database.close();
  }
}
