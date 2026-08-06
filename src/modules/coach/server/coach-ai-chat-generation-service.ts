import { Buffer } from "node:buffer";

import type {
  CoachAiChatGenerationResult,
  CoachAiChatGenerationUsage,
  CoachAiChatMessageIntent,
  CoachAiChatMessage,
} from "../contracts/ai-chat-contracts";
import type { CoachAiManualEntryDraft } from "../contracts/ai-manual-entry-draft-contracts";
import type { CoachAiChatTrustedContext } from "../contracts/ai-daily-companion-contracts";
import type { CoachAiChatGenerationAttempt } from "../contracts/ai-provider-controls-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import { CoachAiChatFactualToolDispatcher, COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES } from "./coach-ai-chat-factual-tool-dispatcher";
import { CoachAiChatProviderGenerationError, generateCoachAiChatOpenAiAnswer } from "./coach-ai-chat-openai-adapter";
import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import type { CoachAiDailyCompanionRepository } from "./coach-ai-daily-companion-repository";
import type { CoachAiManualEntryDraftRepository } from "./coach-ai-manual-entry-draft-repository";
import type { CoachAiChatFactualToolService } from "./coach-ai-chat-factual-tool-service";
import type { CoachAiChatTradeDetailService } from "./coach-ai-chat-trade-detail-service";

export const COACH_AI_CHAT_MAX_RECENT_MESSAGES = 12;
export const COACH_AI_CHAT_MAX_HISTORY_BYTES = 16 * 1024;
export const COACH_AI_CHAT_MAX_OUTPUT_TOKENS = 1_200;
export const COACH_AI_CHAT_MAX_QUESTION_BYTES = 4 * 1024;
export const COACH_AI_CHAT_MAX_TRUSTED_CONTEXT_BYTES = 20 * 1024;
export const COACH_AI_CHAT_MAX_MANUAL_DRAFT_CONTEXT_BYTES = 16 * 1024;
// Covers the real system contract, four Zod tool schemas, structured output, and all three model steps.
export const COACH_AI_CHAT_SYSTEM_AND_TOOL_ENVELOPE_RESERVED_BYTES = 32 * 1024;

export type CoachAiChatGenerator = (input: Readonly<{
  scope: WorkspaceAccessScope;
  selectedAccountId: string;
  asOfUtc: string;
  attempt: CoachAiChatGenerationAttempt;
  recentMessages: readonly CoachAiChatMessage[];
  question: string;
  intent: CoachAiChatMessageIntent;
  trustedContext: CoachAiChatTrustedContext | null;
  existingManualEntryDraft: CoachAiManualEntryDraft | null;
  dispatcher: CoachAiChatFactualToolDispatcher;
}>) => Promise<CoachAiChatGenerationResult>;

export type CoachAiChatGenerationServiceResult = Readonly<{
  state: "pending" | "completed" | "failed" | "blocked";
  assistantMessageId: string;
  attemptId: string;
  manualEntryDraft: CoachAiManualEntryDraft | null;
}>;

function completeUsage(usage: CoachAiChatGenerationUsage): boolean {
  return usage.inputTokens !== null && usage.outputTokens !== null && usage.totalTokens !== null &&
    usage.totalTokens === usage.inputTokens + usage.outputTokens;
}

function safeAssistantText(result: CoachAiChatGenerationResult): string {
  return [result.answer.directAnswer, ...result.answer.supportingObservations,
    result.answer.limitation, result.answer.nextQuestion]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join("\n\n");
}

function boundedHistory(messages: readonly CoachAiChatMessage[]): readonly CoachAiChatMessage[] {
  const newest = messages.filter((message) => message.role === "user" || message.generationState === "completed")
    .slice(-COACH_AI_CHAT_MAX_RECENT_MESSAGES);
  let bytes = 0;
  const accepted: CoachAiChatMessage[] = [];
  for (const message of [...newest].reverse()) {
    const text = message.role === "user" ? message.originalUserTextPrivate : message.assistantTextPrivate;
    const size = Buffer.byteLength(text ?? "", "utf8");
    if (bytes + size > COACH_AI_CHAT_MAX_HISTORY_BYTES) continue;
    bytes += size;
    accepted.push(message);
  }
  return Object.freeze(accepted.reverse());
}

export function createCoachAiChatReservationEnvelope(
  question: string,
  history: readonly CoachAiChatMessage[],
  trustedContext: CoachAiChatTrustedContext | null = null,
  existingManualEntryDraft: CoachAiManualEntryDraft | null = null,
  intent: CoachAiChatMessageIntent = "answer_question",
): string {
  const manualEntry = intent === "prepare_manual_execution_draft";
  const trustedContextBytes = Buffer.byteLength(JSON.stringify(trustedContext), "utf8");
  const manualDraftBytes = Buffer.byteLength(JSON.stringify(existingManualEntryDraft), "utf8");
  const context = history.map((message) => ({
    role: message.role,
    text: message.role === "user" ? message.originalUserTextPrivate : message.assistantTextPrivate,
  }));
  // The padding is a conservative reservation for every permitted factual result, not an actual prompt value.
  return JSON.stringify({
    systemInstruction: "grounded Journal answers only; no advice; evidence references must resolve to deterministic factual tools",
    recentConversation: manualEntry ? [] : context,
    currentQuestion: question,
    trustedContext,
    existingManualEntryDraft,
    toolDefinitions: manualEntry
      ? []
      : ["summarize_closed_trades", "group_closed_trades", "list_closed_trades", "get_closed_trade_details"],
    maximumFactualResultsBytes: manualEntry ? 0 : COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES,
    maximumOutputTokens: COACH_AI_CHAT_MAX_OUTPUT_TOKENS,
    // A first and second tool result may both be included in the final model step;
    // their total bounded package can also be included in the second step.
    repeatedFactualResultsReservation: manualEntry
      ? ""
      : "x".repeat(COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES * 2),
    repeatedHistoryReservation: manualEntry ? "" : "x".repeat(COACH_AI_CHAT_MAX_HISTORY_BYTES * 2),
    repeatedQuestionReservation: "x".repeat(COACH_AI_CHAT_MAX_QUESTION_BYTES * 2),
    trustedContextReservation: manualEntry ? "" : "x".repeat(Math.max(
      0,
      COACH_AI_CHAT_MAX_TRUSTED_CONTEXT_BYTES - trustedContextBytes,
    )),
    manualDraftContextReservation: manualEntry
      ? "x".repeat(Math.max(
          0,
          COACH_AI_CHAT_MAX_MANUAL_DRAFT_CONTEXT_BYTES - manualDraftBytes,
        ))
      : "",
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
    private readonly dailyCompanion: Pick<CoachAiDailyCompanionRepository, "recordProposedReflection"> | null = null,
    private readonly manualDrafts: Pick<CoachAiManualEntryDraftRepository,
      "createDraft" | "listDrafts" | "readDraftForSourceMessage" | "transitionDraft"> | null = null,
  ) {}

  async generateSavedAnswer(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      question: string;
      intent?: CoachAiChatMessageIntent;
      idempotencySha256: string;
      resolveTrustedContext?: (() => CoachAiChatTrustedContext) | null;
      resolveManualEntryDefaults?: (() => Readonly<{
        sourceTimezone: string;
        tradeCurrency: string;
      }>) | null;
    }>,
    now = new Date(),
  ): Promise<CoachAiChatGenerationServiceResult> {
    if (Buffer.byteLength(input.question, "utf8") > COACH_AI_CHAT_MAX_QUESTION_BYTES) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "question" });
    }
    const intent = input.intent ?? "answer_question";
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
      return Object.freeze({ state: existing.state === "reserved" || existing.state === "started" ? "pending" : existing.state,
        assistantMessageId: existing.assistantMessageId, attemptId: existing.attemptId,
        manualEntryDraft });
    }

    const trustedContext = input.resolveTrustedContext?.() ?? null;
    if (trustedContext && Buffer.byteLength(JSON.stringify(trustedContext), "utf8") >
        COACH_AI_CHAT_MAX_TRUSTED_CONTEXT_BYTES) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "trustedContext" });
    }
    const manualEntryDefaults = intent === "prepare_manual_execution_draft"
      ? input.resolveManualEntryDefaults?.() ?? null
      : null;
    if (intent === "prepare_manual_execution_draft" && (!manualEntryDefaults || !this.manualDrafts)) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "manualEntryDraft" });
    }
    const existingManualEntryDraft = intent === "prepare_manual_execution_draft"
      ? this.manualDrafts!.listDrafts(scope, {
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
        structuredInterpretation: intent === "prepare_manual_execution_draft"
          ? Object.freeze({ intent })
          : trustedContext
          ? Object.freeze({ intent: "assist_daily_review", trustedContext })
          : undefined,
      }, now);
      const history = boundedHistory(this.chat.listMessages(scope, input.conversationId, { limit: COACH_AI_CHAT_MAX_RECENT_MESSAGES }).messages
        .filter((message) => message.messageId !== pair.userMessage.messageId && message.messageId !== pair.assistantMessage.messageId));
      const reservation = this.controls.reserveChatGeneration(scope, {
        conversationId: input.conversationId,
        assistantMessageId: pair.assistantMessage.messageId,
        idempotencySha256: input.idempotencySha256,
        providerInputText: createCoachAiChatReservationEnvelope(
          input.question,
          history,
          trustedContext,
          boundedExistingManualEntryDraft,
          intent,
        ),
        maxOutputTokens: COACH_AI_CHAT_MAX_OUTPUT_TOKENS,
        additionalFeatureKey: trustedContext ? "daily_companion" : undefined,
      }, now);
      if (reservation.state === "blocked") {
        this.chat.finalizeAssistantFailure(scope, pair.assistantMessage.messageId, "TRADERLINK_COACH_CHAT_DAILY_CAP_REACHED", null, now);
      }
      return Object.freeze({ pair, history, reservation });
    });
    if (created.reservation.state === "blocked") {
      return Object.freeze({ state: "blocked", assistantMessageId: created.pair.assistantMessage.messageId, attemptId: created.reservation.attempt.attemptId, manualEntryDraft: null });
    }
    if (created.reservation.state !== "reserved") {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { state: "unexpected_reservation" });
    }

    const attempt = this.controls.markProviderStarted(scope, created.reservation.attempt.attemptId, now);
    const dispatcher = new CoachAiChatFactualToolDispatcher(this.factualTools, this.tradeDetails, scope, scope.activeAccountId!, now.toISOString());
    let result: CoachAiChatGenerationResult;
    try {
      result = await this.generator({ scope, selectedAccountId: scope.activeAccountId!, asOfUtc: now.toISOString(), attempt,
        recentMessages: created.history, question: input.question, intent, trustedContext,
        existingManualEntryDraft: boundedExistingManualEntryDraft, dispatcher });
      if ((intent === "prepare_manual_execution_draft") !== (result.manualEntryExtraction !== null)) {
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
        : new CoachAiChatProviderGenerationError(Object.freeze({ inputTokens: null, outputTokens: null, totalTokens: null }));
      this.chat.runAtomically(() => {
        if (completeUsage(providerError.usage)) {
          this.chat.finalizeAssistantFailure(scope, created.pair.assistantMessage.messageId, providerError.message, {
            providerKey: attempt.providerKey, modelId: attempt.modelId, usage: providerError.usage,
            inputCostUsdPerMillionTokens: attempt.inputCostUsdPerMillionTokens,
            outputCostUsdPerMillionTokens: attempt.outputCostUsdPerMillionTokens,
          }, now);
          this.controls.finalizeFromChatReceipt(scope, attempt.attemptId, "failed", providerError.message, now);
        } else {
          this.chat.finalizeAssistantFailure(scope, created.pair.assistantMessage.messageId, providerError.message, null, now);
          this.controls.failStartedWithoutUsage(scope, attempt.attemptId, providerError.message, now);
        }
      });
      return Object.freeze({ state: "failed", assistantMessageId: created.pair.assistantMessage.messageId, attemptId: attempt.attemptId, manualEntryDraft: null });
    }
    // A receipt/attempt mismatch must roll this whole persistence transition back; it is not a provider failure.
    let manualEntryDraft: CoachAiManualEntryDraft | null = null;
    this.chat.runAtomically(() => {
      this.chat.finalizeAssistantSuccess(scope, created.pair.assistantMessage.messageId, {
        assistantTextPrivate: safeAssistantText(result),
        snapshotContractVersion: "traderlink_coach_ai_chat_generation_v1",
        factualSnapshot: Object.freeze({ answer: result.answer, factualToolCalls: result.factualToolCalls,
          totalFactualResultBytes: dispatcher.totalSerializedResultBytes(), trustedContext,
          manualEntryExtraction: result.manualEntryExtraction }),
        receipt: { providerKey: attempt.providerKey, modelId: attempt.modelId, usage: result.usage,
          inputCostUsdPerMillionTokens: attempt.inputCostUsdPerMillionTokens,
          outputCostUsdPerMillionTokens: attempt.outputCostUsdPerMillionTokens },
      }, now);
      this.controls.finalizeFromChatReceipt(scope, attempt.attemptId, "completed", null, now);
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
    });
    return Object.freeze({ state: "completed", assistantMessageId: created.pair.assistantMessage.messageId, attemptId: attempt.attemptId, manualEntryDraft });
  }
}
