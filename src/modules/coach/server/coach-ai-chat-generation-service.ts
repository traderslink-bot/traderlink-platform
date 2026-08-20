import { Buffer } from "node:buffer";

import type {
  CoachAiChatAnalysisScope,
  CoachAiChatGenerationResult,
  CoachAiChatGenerationUsage,
  CoachAiChatMessageIntent,
  CoachAiChatMessage,
} from "../contracts/ai-chat-contracts";
import type { CoachAiChatPageContext } from "../contracts/ai-chat-page-context-contracts";
import type { CoachAiManualEntryDraft } from "../contracts/ai-manual-entry-draft-contracts";
import type { CoachAiChatTrustedContext } from "../contracts/ai-daily-companion-contracts";
import type {
  CoachAiDailyCompanionDraft,
  CoachAiDailyCompanionResolvedContext,
} from "../contracts/ai-daily-companion-contracts";
import type { CoachAiChatGenerationAttempt } from "../contracts/ai-provider-controls-contracts";
import type {
  CoachAiReviewDeliveryChangeDraft,
  CoachAiReviewDeliveryScheduleSnapshot,
} from "../contracts/ai-review-delivery-change-contracts";
import type { CoachAiChatActionDraft } from "../contracts/ai-chat-action-draft-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  CoachAiChatFactualToolDispatcher,
  COACH_AI_CHAT_FACTUAL_RESULTS_CUMULATIVE_PROMPT_MAX_BYTES,
  COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES,
} from "./coach-ai-chat-factual-tool-dispatcher";
import { CoachAiChatProviderGenerationError, generateCoachAiChatOpenAiAnswer } from "./coach-ai-chat-openai-adapter";
import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiChatGenerationRecoveryService } from "./coach-ai-chat-generation-recovery-service";
import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import type { CoachAiDailyCompanionRepository } from "./coach-ai-daily-companion-repository";
import type { CoachAiManualEntryDraftRepository } from "./coach-ai-manual-entry-draft-repository";
import type { CoachAiReviewDeliveryChangeRepository } from "./coach-ai-review-delivery-change-repository";
import type { CoachAiChatFactualToolService } from "./coach-ai-chat-factual-tool-service";
import type { CoachAiChatTradeDetailService } from "./coach-ai-chat-trade-detail-service";
import type { CoachAiChatJournalContextService } from "./coach-ai-chat-journal-context-service";
import type { CoachAiChatProductHelpService } from "./coach-ai-chat-product-help-service";
import type { CoachAiChatSavedReviewService } from "./coach-ai-chat-saved-review-service";
import type { CoachAiChatDashboardContextService } from "./coach-ai-chat-dashboard-context-service";
import type { CoachAiChatAnalyticsPageToolService } from "./coach-ai-chat-analytics-page-tool-service";
import type { CoachAiChatProductContextService } from "./coach-ai-chat-product-context-service";
import type { CoachAiChatTradeAnalyzerToolService } from "./coach-ai-chat-trade-analyzer-tool-service";
import type { CoachAiChatAnnotationContextService } from "./coach-ai-chat-annotation-context-service";
import type { CoachAiChatActionDraftService } from "./coach-ai-chat-action-draft-service";
import { coachAiChatFactualToolRegistry } from "./coach-ai-chat-factual-tool-registry";
import {
  buildCoachAiChatAdaptiveContext,
  COACH_AI_CHAT_MAX_CONTEXT_SOURCE_MESSAGES,
} from "./coach-ai-chat-adaptive-context";
import type { CoachAiRelationshipMemoryRepository } from
  "./coach-ai-relationship-memory-repository";
import type { CoachAiRelationshipMemory } from
  "../contracts/ai-relationship-memory-contracts";
import {
  projectCoachAiChatRelationshipMemoryContext,
  selectCoachAiChatRelationshipMemories,
} from "./coach-ai-chat-relationship-memory-context";
import { buildCoachAiChatClaimCatalog } from "./coach-ai-chat-claim-catalog";
import type { CoachAiChatConversationState } from
  "../contracts/ai-chat-conversation-state-contracts";
import type { CoachAiChatConversationStateRepository } from
  "./coach-ai-chat-conversation-state-repository";
import {
  buildCoachAiChatConversationState,
  finalizeCoachAiChatConversationState,
} from "./coach-ai-chat-conversation-state";
import {
  COACH_AI_CHAT_DETERMINISTIC_FAST_PATH_VERSION,
  runCoachAiChatDeterministicFastPath,
  selectCoachAiChatDeterministicFastPath,
} from "./coach-ai-chat-deterministic-fast-path";

export const COACH_AI_CHAT_MAX_HISTORY_BYTES = 16 * 1024;
export const COACH_AI_CHAT_MAX_OUTPUT_TOKENS = 1_200;
export const COACH_AI_CHAT_MAX_QUESTION_BYTES = 4 * 1024;
export const COACH_AI_CHAT_MAX_TRUSTED_CONTEXT_BYTES = 20 * 1024;
export const COACH_AI_CHAT_MAX_MANUAL_DRAFT_CONTEXT_BYTES = 16 * 1024;
export { COACH_AI_CHAT_MAX_RELATIONSHIP_MEMORY_BYTES } from
  "./coach-ai-chat-relationship-memory-context";
export const COACH_AI_CHAT_DERIVED_CONTENT_FAILURE_CODE =
  "TRADERLINK_COACH_CHAT_DERIVED_CONTENT_INVALID";
// Covers the full current system contract, all registered tool schemas,
// structured output, and all three possible model steps.
export const COACH_AI_CHAT_SYSTEM_AND_TOOL_ENVELOPE_RESERVED_BYTES = 64 * 1024;

export type CoachAiChatGenerator = (input: Readonly<{
  scope: WorkspaceAccessScope;
  selectedAccountId: string;
  asOfUtc: string;
  attempt: CoachAiChatGenerationAttempt;
  recentMessages: readonly CoachAiChatMessage[];
  conversationState: CoachAiChatConversationState;
  relationshipMemories: readonly CoachAiRelationshipMemory[];
  question: string;
  intent: CoachAiChatMessageIntent;
  trustedContext: CoachAiChatTrustedContext | null;
  existingManualEntryDraft: CoachAiManualEntryDraft | null;
  currentReviewDelivery: CoachAiReviewDeliveryScheduleSnapshot | null;
  analysisScope: CoachAiChatAnalysisScope;
  pageContext: CoachAiChatPageContext | null;
  dispatcher: CoachAiChatFactualToolDispatcher;
}>) => Promise<CoachAiChatGenerationResult>;

export type CoachAiChatGenerationServiceResult = Readonly<{
  state: "pending" | "completed" | "failed" | "blocked";
  assistantMessageId: string;
  attemptId: string | null;
  manualEntryDraft: CoachAiManualEntryDraft | null;
  dailyCompanionDraft: CoachAiDailyCompanionDraft | null;
  reviewDeliveryChangeDraft: CoachAiReviewDeliveryChangeDraft | null;
  actionDraft: CoachAiChatActionDraft | null;
}>;

function completeUsage(usage: CoachAiChatGenerationUsage): boolean {
  return usage.inputTokens !== null && usage.cachedInputTokens !== null &&
    usage.cacheWriteInputTokens !== null && usage.outputTokens !== null &&
    usage.totalTokens !== null &&
    usage.cachedInputTokens + usage.cacheWriteInputTokens <= usage.inputTokens &&
    usage.totalTokens === usage.inputTokens + usage.outputTokens;
}

function unavailableUsage(): CoachAiChatGenerationUsage {
  return Object.freeze({
    inputTokens: null,
    cachedInputTokens: null,
    cacheWriteInputTokens: null,
    outputTokens: null,
    totalTokens: null,
  });
}

function safeAssistantText(result: CoachAiChatGenerationResult): string {
  return [result.answer.directAnswer, ...result.answer.supportingObservations,
    result.answer.limitation, result.answer.nextQuestion]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join("\n\n");
}

function loadContextMessages(
  chat: CoachAiChatRepository,
  scope: WorkspaceAccessScope,
  conversationId: string,
): readonly CoachAiChatMessage[] {
  const pages: CoachAiChatMessage[] = [];
  let cursor: Readonly<{ beforeSequence: number }> | null = null;
  while (pages.length < COACH_AI_CHAT_MAX_CONTEXT_SOURCE_MESSAGES) {
    const page = chat.listMessages(scope, conversationId, { limit: 100, cursor });
    pages.unshift(...page.messages);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return Object.freeze(pages.slice(-COACH_AI_CHAT_MAX_CONTEXT_SOURCE_MESSAGES));
}

export function createCoachAiChatReservationEnvelope(
  question: string,
  history: readonly CoachAiChatMessage[],
  trustedContext: CoachAiChatTrustedContext | null = null,
  existingManualEntryDraft: CoachAiManualEntryDraft | null = null,
  intent: CoachAiChatMessageIntent = "answer_question",
  currentReviewDelivery: CoachAiReviewDeliveryScheduleSnapshot | null = null,
  analysisScope: CoachAiChatAnalysisScope = Object.freeze({ kind: "recent" }),
  pageContext: CoachAiChatPageContext | null = null,
  relationshipMemories: readonly CoachAiRelationshipMemory[] = Object.freeze([]),
  conversationState: CoachAiChatConversationState | null = null,
): string {
  const trustedContextBytes = Buffer.byteLength(JSON.stringify(trustedContext), "utf8");
  const manualDraftBytes = Buffer.byteLength(JSON.stringify(existingManualEntryDraft), "utf8");
  const context = history.map((message) => ({
    role: message.role,
    text: message.role === "user" ? message.originalUserTextPrivate : message.assistantTextPrivate,
  }));
  // The padding is a conservative reservation for every permitted factual result, not an actual prompt value.
  return JSON.stringify({
    systemInstruction: "grounded Journal answers only; no advice; evidence references must resolve to deterministic factual tools",
    recentConversation: context,
    conversationState,
    currentQuestion: question,
    trustedContext,
    existingManualEntryDraft,
    currentReviewDelivery,
    analysisScope,
    currentPageHint: pageContext,
    relationshipMemories: projectCoachAiChatRelationshipMemoryContext(relationshipMemories),
    manualEntryShortcutSelected: intent === "prepare_manual_execution_draft",
    toolDefinitions: coachAiChatFactualToolRegistry.map((definition) => definition.name),
    maximumFactualResultsBytes: COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES,
    maximumOutputTokens: COACH_AI_CHAT_MAX_OUTPUT_TOKENS,
    // Later model turns receive the growing result package. The dispatcher
    // enforces this same cumulative cross-turn byte ceiling.
    repeatedFactualResultsReservation: "x".repeat(
      COACH_AI_CHAT_FACTUAL_RESULTS_CUMULATIVE_PROMPT_MAX_BYTES,
    ),
    repeatedHistoryReservation: "x".repeat(COACH_AI_CHAT_MAX_HISTORY_BYTES * 2),
    repeatedQuestionReservation: "x".repeat(COACH_AI_CHAT_MAX_QUESTION_BYTES * 2),
    trustedContextReservation: "x".repeat(Math.max(
      0,
      COACH_AI_CHAT_MAX_TRUSTED_CONTEXT_BYTES - trustedContextBytes,
    )),
    manualDraftContextReservation: "x".repeat(Math.max(
      0,
      COACH_AI_CHAT_MAX_MANUAL_DRAFT_CONTEXT_BYTES - manualDraftBytes,
    )),
    systemAndToolEnvelopeReservation: "x".repeat(COACH_AI_CHAT_SYSTEM_AND_TOOL_ENVELOPE_RESERVED_BYTES),
  });
}

export class CoachAiChatGenerationService {
  constructor(
    private readonly chat: CoachAiChatRepository,
    private readonly controls: CoachAiChatProviderControlsRepository,
    private readonly factualTools: Pick<CoachAiChatFactualToolService, "summarizeClosedTrades" | "groupClosedTrades" | "listClosedTrades">,
    private readonly tradeDetails: Pick<CoachAiChatTradeDetailService, "getClosedTradeDetails">,
    private readonly generator: CoachAiChatGenerator = generateCoachAiChatOpenAiAnswer,
    private readonly dailyCompanion: Pick<CoachAiDailyCompanionRepository,
      "recordProposedReflection" | "recordProposedDraft" | "listDrafts"> | null = null,
    private readonly manualDrafts: Pick<CoachAiManualEntryDraftRepository,
      "createDraft" | "listDrafts" | "readDraftForSourceMessage" | "transitionDraft"> | null = null,
    private readonly reviewDeliveryChanges: Pick<CoachAiReviewDeliveryChangeRepository,
      "create" | "readForSourceMessage"> | null = null,
    private readonly toolExtensions: Readonly<{
      journalContext?: Pick<CoachAiChatJournalContextService, "summarize">;
      productHelp?: Pick<CoachAiChatProductHelpService, "search">;
      savedReviews?: Pick<CoachAiChatSavedReviewService, "list" | "read">;
      dashboardContext?: Pick<CoachAiChatDashboardContextService,
        "workspaceSummary" | "tradingDayDetails" | "calendarPeriod" |
        "positionList" | "positionDetail">;
      analyticsPages?: Pick<CoachAiChatAnalyticsPageToolService, "readPage" | "tradeExplorer">;
      productContext?: Pick<CoachAiChatProductContextService,
        "listImports" | "listDataDecisions" | "dataDecisionDetail" |
        "listNotifications" | "accountContext">;
      tradeAnalyzer?: Pick<CoachAiChatTradeAnalyzerToolService,
        "results" | "listTrades" | "savedCandleReview">;
      annotations?: Pick<CoachAiChatAnnotationContextService,
        "listRules" | "ruleResults" | "tradeAnnotations">;
    }> = Object.freeze({}),
    private readonly actionDrafts: Pick<CoachAiChatActionDraftService,
      "create" | "list" | "readForSourceMessage"> | null = null,
    private readonly reportingCurrency: string | null = null,
    private readonly relationshipMemory: Pick<CoachAiRelationshipMemoryRepository, "read"> | null = null,
    private readonly conversationState: Pick<CoachAiChatConversationStateRepository, "readLatest"> | null = null,
  ) {}

  async generateSavedAnswer(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      question: string;
      intent?: CoachAiChatMessageIntent;
      analysisScope?: CoachAiChatAnalysisScope;
      pageContext?: CoachAiChatPageContext | null;
      idempotencySha256: string;
      resolveTrustedContext?: (() => CoachAiDailyCompanionResolvedContext) | null;
      resolveManualEntryDefaults?: (() => Readonly<{
        sourceTimezone: string;
        tradeCurrency: string;
      }>) | null;
      resolveReviewDelivery?: (() => CoachAiReviewDeliveryScheduleSnapshot) | null;
    }>,
    now = new Date(),
  ): Promise<CoachAiChatGenerationServiceResult> {
    if (Buffer.byteLength(input.question, "utf8") > COACH_AI_CHAT_MAX_QUESTION_BYTES) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "question" });
    }
    const intent = input.intent ?? "answer_question";
    const analysisScope = input.analysisScope ?? Object.freeze({ kind: "recent" as const });
    const pageContext = input.pageContext ?? null;
    const deterministicRoute = intent === "answer_question"
      ? selectCoachAiChatDeterministicFastPath(input.question)
      : null;
    new CoachAiChatGenerationRecoveryService(this.chat, this.controls).reconcile(
      scope,
      { conversationId: input.conversationId },
      now,
    );
    const existing = this.controls.findChatGenerationByIdempotency(scope, input.idempotencySha256);
    if (existing) {
      if (existing.conversationId !== input.conversationId) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "idempotencySha256" });
      }
      const pair = this.chat.readGenerationPair(scope, input.conversationId, existing.assistantMessageId);
      if (pair.userMessage.originalUserTextPrivate !== input.question) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "idempotencySha256" });
      }
      const manualEntryDraft = this.manualDrafts?.readDraftForSourceMessage(
        scope,
        input.conversationId,
        pair.userMessage.messageId,
      ) ?? null;
      const dailyCompanionDraft = this.dailyCompanion?.listDrafts(scope, {
        conversationId: input.conversationId,
        limit: 50,
      }).find((draft) => draft.sourceMessageId === pair.userMessage.messageId) ?? null;
      const reviewDeliveryChangeDraft = this.reviewDeliveryChanges?.readForSourceMessage(
        scope,
        input.conversationId,
        pair.userMessage.messageId,
      ) ?? null;
      const actionDraft = this.actionDrafts?.readForSourceMessage(
        scope,
        input.conversationId,
        pair.userMessage.messageId,
      ) ?? null;
      return Object.freeze({ state: existing.state === "reserved" || existing.state === "started" ? "pending" : existing.state,
        assistantMessageId: existing.assistantMessageId, attemptId: existing.attemptId,
        manualEntryDraft, dailyCompanionDraft, reviewDeliveryChangeDraft, actionDraft });
    }
    const existingDeterministic = this.chat.findDeterministicGenerationByIdempotency(
      scope,
      input.idempotencySha256,
    );
    if (existingDeterministic) {
      if (existingDeterministic.conversationId !== input.conversationId ||
          existingDeterministic.pair.userMessage.originalUserTextPrivate !== input.question) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          field: "idempotencySha256",
        });
      }
      const generationState = existingDeterministic.pair.assistantMessage.generationState;
      return Object.freeze({
        state: generationState === "not_applicable" ? "failed" : generationState,
        assistantMessageId: existingDeterministic.pair.assistantMessage.messageId,
        attemptId: null,
        manualEntryDraft: null,
        dailyCompanionDraft: null,
        reviewDeliveryChangeDraft: null,
        actionDraft: null,
      });
    }

    const resolvedTrustedContext = input.resolveTrustedContext?.() ?? null;
    const trustedContext = resolvedTrustedContext?.context ?? null;
    if (trustedContext && Buffer.byteLength(JSON.stringify(trustedContext), "utf8") >
        COACH_AI_CHAT_MAX_TRUSTED_CONTEXT_BYTES) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "trustedContext" });
    }
    const manualEntryDefaults = input.resolveManualEntryDefaults?.() ?? null;
    const currentReviewDelivery = input.resolveReviewDelivery?.() ?? null;
    if (intent === "prepare_manual_execution_draft" && (!manualEntryDefaults || !this.manualDrafts)) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "manualEntryDraft" });
    }
    const existingManualEntryDraft = manualEntryDefaults && this.manualDrafts
      ? this.manualDrafts.listDrafts(scope, {
          conversationId: input.conversationId,
          limit: 10,
        }).find((draft) => draft.state === "draft" || draft.state === "ready_for_confirmation") ?? null
      : null;
    const boundedExistingManualEntryDraft = existingManualEntryDraft &&
        Buffer.byteLength(JSON.stringify(existingManualEntryDraft), "utf8") <=
          COACH_AI_CHAT_MAX_MANUAL_DRAFT_CONTEXT_BYTES
      ? existingManualEntryDraft
      : null;

    const created = this.chat.runAtomically(() => {
      const pair = this.chat.appendUserMessageAndReserveAssistant(scope, input.conversationId, {
        originalUserTextPrivate: input.question,
        structuredInterpretation: deterministicRoute
          ? Object.freeze({
              intent,
              analysisScope,
              generationSource: COACH_AI_CHAT_DETERMINISTIC_FAST_PATH_VERSION,
              deterministicRouteKey: deterministicRoute.routeKey,
              deterministicIdempotencySha256: input.idempotencySha256,
            })
          : intent === "prepare_manual_execution_draft"
          ? Object.freeze({ intent, analysisScope })
          : trustedContext
          ? Object.freeze({ intent: "assist_daily_review", trustedContext, analysisScope })
          : Object.freeze({ intent, analysisScope }),
      }, now);
      const sourceMessages = loadContextMessages(this.chat, scope, input.conversationId)
        .filter((message) => message.messageId !== pair.userMessage.messageId &&
          message.messageId !== pair.assistantMessage.messageId);
      const adaptiveContext = buildCoachAiChatAdaptiveContext(input.question, sourceMessages);
      const conversationState = buildCoachAiChatConversationState({
        previous: this.conversationState?.readLatest(scope, input.conversationId) ?? null,
        sourceMessages,
        recentFloorSequence: adaptiveContext.recentFloorSequence,
        currentQuestion: input.question,
        currentUserMessageSequence: pair.userMessage.sequence,
        analysisScope,
        pageContext,
      });
      const history = adaptiveContext.messages;
      const relationshipMemoryView = this.relationshipMemory?.read(scope, now) ?? null;
      const relationshipMemories = selectCoachAiChatRelationshipMemories(
        relationshipMemoryView?.settings.enabled ?? false,
        relationshipMemoryView?.memories ?? Object.freeze([]),
      );
      const reservation = deterministicRoute ? null : this.controls.reserveChatGeneration(scope, {
        conversationId: input.conversationId,
        assistantMessageId: pair.assistantMessage.messageId,
        idempotencySha256: input.idempotencySha256,
        providerInputText: createCoachAiChatReservationEnvelope(
          input.question,
          history,
          trustedContext,
          boundedExistingManualEntryDraft,
          intent,
          currentReviewDelivery,
          analysisScope,
          pageContext,
          relationshipMemories,
          conversationState,
        ),
        maxOutputTokens: COACH_AI_CHAT_MAX_OUTPUT_TOKENS,
        additionalFeatureKey: trustedContext ? "daily_companion" : undefined,
      }, now);
      if (reservation?.state === "blocked") {
        this.chat.finalizeAssistantFailure(scope, pair.assistantMessage.messageId, "TRADERLINK_COACH_CHAT_DAILY_CAP_REACHED", null, now);
      }
      return Object.freeze({ pair, history, relationshipMemories, conversationState, reservation });
    });
    if (deterministicRoute) {
      const dispatcher = new CoachAiChatFactualToolDispatcher(
        this.factualTools,
        this.tradeDetails,
        scope,
        scope.activeAccountId!,
        now.toISOString(),
        this.toolExtensions,
        analysisScope,
        this.reportingCurrency,
      );
      try {
        const deterministic = runCoachAiChatDeterministicFastPath(
          deterministicRoute,
          dispatcher,
        );
        this.chat.runAtomically(() => {
          const conversationState = finalizeCoachAiChatConversationState({
            state: created.conversationState,
            assistantMessageSequence: created.pair.assistantMessage.sequence,
            nextQuestion: deterministic.answer.nextQuestion,
            drafts: Object.freeze([]),
          });
          this.chat.finalizeDeterministicAssistantSuccess(
            scope,
            created.pair.assistantMessage.messageId,
            {
              assistantTextPrivate: [
                deterministic.answer.directAnswer,
                ...deterministic.answer.supportingObservations,
                deterministic.answer.limitation,
              ].filter((part): part is string =>
                typeof part === "string" && part.length > 0).join("\n\n"),
              snapshotContractVersion: "traderlink_coach_ai_chat_generation_v1",
              factualSnapshot: Object.freeze({
                generationSource: COACH_AI_CHAT_DETERMINISTIC_FAST_PATH_VERSION,
                deterministicRouteKey: deterministic.routeKey,
                answer: deterministic.answer,
                factualToolCalls: dispatcher.snapshotsForPersistence(),
                claimCatalog: buildCoachAiChatClaimCatalog(
                  dispatcher.snapshotsForPersistence(),
                ),
                conversationState,
                totalFactualResultBytes: dispatcher.totalSerializedResultBytes(),
                cumulativePromptFactualResultBytes: 0,
                trustedContext,
              }),
            },
            now,
          );
        });
        return Object.freeze({
          state: "completed",
          assistantMessageId: created.pair.assistantMessage.messageId,
          attemptId: null,
          manualEntryDraft: null,
          dailyCompanionDraft: null,
          reviewDeliveryChangeDraft: null,
          actionDraft: null,
        });
      } catch {
        this.chat.finalizeAssistantFailure(
          scope,
          created.pair.assistantMessage.messageId,
          "TRADERLINK_COACH_DETERMINISTIC_FAST_PATH_FAILED",
          null,
          now,
        );
        return Object.freeze({
          state: "failed",
          assistantMessageId: created.pair.assistantMessage.messageId,
          attemptId: null,
          manualEntryDraft: null,
          dailyCompanionDraft: null,
          reviewDeliveryChangeDraft: null,
          actionDraft: null,
        });
      }
    }
    if (!created.reservation) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        state: "missing_reservation",
      });
    }
    if (created.reservation.state === "blocked") {
      return Object.freeze({ state: "blocked", assistantMessageId: created.pair.assistantMessage.messageId, attemptId: created.reservation.attempt.attemptId, manualEntryDraft: null, dailyCompanionDraft: null, reviewDeliveryChangeDraft: null, actionDraft: null });
    }
    if (created.reservation.state !== "reserved") {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "unexpected_reservation" });
    }

    const attempt = this.controls.markProviderStarted(scope, created.reservation.attempt.attemptId, now);
    const dispatcher = new CoachAiChatFactualToolDispatcher(
      this.factualTools,
      this.tradeDetails,
      scope,
      scope.activeAccountId!,
      now.toISOString(),
      this.toolExtensions,
      analysisScope,
      this.reportingCurrency,
    );
    let result: CoachAiChatGenerationResult;
    try {
      result = await this.generator({ scope, selectedAccountId: scope.activeAccountId!, asOfUtc: now.toISOString(), attempt,
        recentMessages: created.history, relationshipMemories: created.relationshipMemories,
        conversationState: created.conversationState,
        question: input.question, intent, trustedContext,
        existingManualEntryDraft: boundedExistingManualEntryDraft, currentReviewDelivery,
        analysisScope, pageContext, dispatcher });
      if (result.manualEntryExtraction && (!manualEntryDefaults || !this.manualDrafts)) {
        throw new CoachAiChatProviderGenerationError(
          result.usage,
          "TRADERLINK_COACH_MANUAL_ENTRY_EXTRACTION_INVALID",
        );
      }
      if (!completeUsage(result.usage)) {
        throw new CoachAiChatProviderGenerationError(result.usage, "TRADERLINK_COACH_PROVIDER_USAGE_UNAVAILABLE");
      }
    } catch (error) {
      const providerError = error instanceof CoachAiChatProviderGenerationError
        ? error
        : new CoachAiChatProviderGenerationError(unavailableUsage());
      this.chat.runAtomically(() => {
        if (completeUsage(providerError.usage)) {
          this.chat.finalizeAssistantFailure(scope, created.pair.assistantMessage.messageId, providerError.message, {
            providerKey: attempt.providerKey, modelId: attempt.modelId, usage: providerError.usage,
            inputCostUsdPerMillionTokens: attempt.inputCostUsdPerMillionTokens,
            cachedInputCostUsdPerMillionTokens: attempt.cachedInputCostUsdPerMillionTokens,
            cacheWriteInputCostUsdPerMillionTokens: attempt.cacheWriteInputCostUsdPerMillionTokens,
            outputCostUsdPerMillionTokens: attempt.outputCostUsdPerMillionTokens,
          }, now);
          this.controls.finalizeFromChatReceipt(scope, attempt.attemptId, "failed", providerError.message, now);
        } else {
          this.chat.finalizeAssistantFailure(scope, created.pair.assistantMessage.messageId, providerError.message, null, now);
          this.controls.failStartedWithoutUsage(scope, attempt.attemptId, providerError.message, now);
        }
      });
      return Object.freeze({ state: "failed", assistantMessageId: created.pair.assistantMessage.messageId, attemptId: attempt.attemptId, manualEntryDraft: null, dailyCompanionDraft: null, reviewDeliveryChangeDraft: null, actionDraft: null });
    }
    // Derived drafts are materialized before the completed answer. If that bounded
    // materialization fails, the paid provider response is still terminalized with
    // its actual usage receipt instead of being left pending for lease recovery.
    // A receipt/attempt mismatch must still roll the whole transition back because
    // it is an integrity failure, not a provider or draft failure.
    let manualEntryDraft: CoachAiManualEntryDraft | null = null;
    let dailyCompanionDraft: CoachAiDailyCompanionDraft | null = null;
    let reviewDeliveryChangeDraft: CoachAiReviewDeliveryChangeDraft | null = null;
    let actionDraft: CoachAiChatActionDraft | null = null;
    const persistence = { receiptStarted: false };
    try {
      this.chat.runAtomically(() => {
        if (trustedContext) {
          if (!this.dailyCompanion) {
            platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanion" });
          }
          this.dailyCompanion.recordProposedReflection(scope, {
            conversationId: input.conversationId,
            sourceMessageId: created.pair.userMessage.messageId,
            tradingDate: trustedContext.tradingDate,
            proposedContent: Object.freeze({
              assistantMessageId: created.pair.assistantMessage.messageId,
              answer: result.answer,
            }),
          }, now);
          if (result.dailyCompanionDraftExtraction) {
            dailyCompanionDraft = this.dailyCompanion.recordProposedDraft(scope, {
              conversationId: input.conversationId,
              sourceMessageId: created.pair.userMessage.messageId,
              resolvedContext: resolvedTrustedContext!,
              extraction: result.dailyCompanionDraftExtraction,
            }, now);
          }
        } else if (result.dailyCompanionDraftExtraction) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
            component: "dailyCompanionDraft",
          });
        }
        if (result.manualEntryExtraction) {
          const activeDrafts = this.manualDrafts!.listDrafts(scope, {
            conversationId: input.conversationId,
            limit: 50,
          }).filter((draft) => draft.state === "draft" || draft.state === "ready_for_confirmation");
          for (const activeDraft of activeDrafts) {
            this.manualDrafts!.transitionDraft(scope, activeDraft.draftId, {
              state: "archived",
            }, now);
          }
          const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1_000);
          manualEntryDraft = this.manualDrafts!.createDraft(scope, {
            conversationId: input.conversationId,
            sourceMessageId: created.pair.userMessage.messageId,
            sourceTimezone: manualEntryDefaults!.sourceTimezone,
            tradeCurrency: manualEntryDefaults!.tradeCurrency,
            state: result.manualEntryExtraction.state,
            rows: result.manualEntryExtraction.rows,
            expiresAtUtc: expiresAt.toISOString(),
          }, now);
        }
        if (result.reviewDeliveryChangeExtraction) {
          if (!this.reviewDeliveryChanges || !currentReviewDelivery) {
            platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
              component: "reviewDeliveryChange",
            });
          }
          reviewDeliveryChangeDraft = this.reviewDeliveryChanges.create(scope, {
            conversationId: input.conversationId,
            sourceMessageId: created.pair.userMessage.messageId,
            current: currentReviewDelivery,
            proposed: result.reviewDeliveryChangeExtraction,
          }, now);
        }
        if (result.actionDraftExtraction) {
          if (!this.actionDrafts) {
            platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
              component: "chatActionDraft",
            });
          }
          actionDraft = this.actionDrafts.create(scope, {
            conversationId: input.conversationId,
            sourceMessageId: created.pair.userMessage.messageId,
            extraction: result.actionDraftExtraction,
          }, now);
        }
        const conversationState = finalizeCoachAiChatConversationState({
          state: created.conversationState,
          assistantMessageSequence: created.pair.assistantMessage.sequence,
          nextQuestion: result.answer.nextQuestion,
          drafts: Object.freeze([
            ...(manualEntryDraft ? [Object.freeze({
              kind: "manual_execution" as const,
              internalId: manualEntryDraft.draftId,
              state: manualEntryDraft.state,
            })] : []),
            ...(dailyCompanionDraft ? [Object.freeze({
              kind: "daily_note" as const,
              internalId: dailyCompanionDraft.interactionId,
              state: dailyCompanionDraft.disposition,
            })] : []),
            ...(reviewDeliveryChangeDraft ? [Object.freeze({
              kind: "review_delivery" as const,
              internalId: reviewDeliveryChangeDraft.draftId,
              state: reviewDeliveryChangeDraft.disposition,
            })] : []),
            ...(actionDraft ? [Object.freeze({
              kind: "account_action" as const,
              internalId: actionDraft.draftId,
              state: actionDraft.disposition,
            })] : []),
          ]),
        });
        this.chat.finalizeAssistantSuccess(scope, created.pair.assistantMessage.messageId, {
          assistantTextPrivate: safeAssistantText(result),
          snapshotContractVersion: "traderlink_coach_ai_chat_generation_v1",
          factualSnapshot: Object.freeze({ answer: result.answer, factualToolCalls: result.factualToolCalls,
            claimCatalog: buildCoachAiChatClaimCatalog(result.factualToolCalls),
            conversationState,
            totalFactualResultBytes: dispatcher.totalSerializedResultBytes(),
            cumulativePromptFactualResultBytes:
              dispatcher.cumulativePromptResultBytesForPersistence(),
            trustedContext,
            manualEntryExtraction: result.manualEntryExtraction,
            dailyCompanionDraftExtraction: result.dailyCompanionDraftExtraction,
            reviewDeliveryChangeExtraction: result.reviewDeliveryChangeExtraction,
            actionDraftExtraction: result.actionDraftExtraction ?? null }),
          receipt: { providerKey: attempt.providerKey, modelId: attempt.modelId, usage: result.usage,
            inputCostUsdPerMillionTokens: attempt.inputCostUsdPerMillionTokens,
            cachedInputCostUsdPerMillionTokens: attempt.cachedInputCostUsdPerMillionTokens,
            cacheWriteInputCostUsdPerMillionTokens: attempt.cacheWriteInputCostUsdPerMillionTokens,
            outputCostUsdPerMillionTokens: attempt.outputCostUsdPerMillionTokens },
        }, now);
        persistence.receiptStarted = true;
        this.controls.finalizeFromChatReceipt(scope, attempt.attemptId, "completed", null, now);
      });
    } catch (error) {
      if (persistence.receiptStarted) throw error;
      this.chat.runAtomically(() => {
        this.chat.finalizeAssistantFailure(
          scope,
          created.pair.assistantMessage.messageId,
          COACH_AI_CHAT_DERIVED_CONTENT_FAILURE_CODE,
          {
            providerKey: attempt.providerKey,
            modelId: attempt.modelId,
            usage: result.usage,
            inputCostUsdPerMillionTokens: attempt.inputCostUsdPerMillionTokens,
            cachedInputCostUsdPerMillionTokens: attempt.cachedInputCostUsdPerMillionTokens,
            cacheWriteInputCostUsdPerMillionTokens: attempt.cacheWriteInputCostUsdPerMillionTokens,
            outputCostUsdPerMillionTokens: attempt.outputCostUsdPerMillionTokens,
          },
          now,
        );
        this.controls.finalizeFromChatReceipt(
          scope,
          attempt.attemptId,
          "failed",
          COACH_AI_CHAT_DERIVED_CONTENT_FAILURE_CODE,
          now,
        );
      });
      return Object.freeze({ state: "failed", assistantMessageId: created.pair.assistantMessage.messageId, attemptId: attempt.attemptId, manualEntryDraft: null, dailyCompanionDraft: null, reviewDeliveryChangeDraft: null, actionDraft: null });
    }
    return Object.freeze({ state: "completed", assistantMessageId: created.pair.assistantMessage.messageId, attemptId: attempt.attemptId, manualEntryDraft, dailyCompanionDraft, reviewDeliveryChangeDraft, actionDraft });
  }
}
