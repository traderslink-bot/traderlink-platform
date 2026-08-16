import { loadEnvConfig } from "@next/env";

import type {
  CoachAiChatGenerationResult,
  CoachAiChatMessage,
  CoachAiChatMessageIntent,
} from "@/src/modules/coach/contracts/ai-chat-contracts";
import type { CoachAiChatGenerationAttempt } from
  "@/src/modules/coach/contracts/ai-provider-controls-contracts";
import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "@/src/modules/coach/contracts/coach-ai-chat-factual-tool-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { CoachAiChatFactualToolDispatcher } from
  "@/src/modules/coach/server/coach-ai-chat-factual-tool-dispatcher";
import { generateCoachAiChatOpenAiAnswer } from
  "@/src/modules/coach/server/coach-ai-chat-openai-adapter";

const CONFIRMATION = "--confirm-live-openai-requests";
const UUIDS = Object.freeze({
  userId: "10000000-0000-4000-8000-000000000001",
  workspaceId: "10000000-0000-4000-8000-000000000002",
  accountId: "10000000-0000-4000-8000-000000000003",
  conversationId: "10000000-0000-4000-8000-000000000004",
  assistantMessageId: "10000000-0000-4000-8000-000000000005",
  attemptId: "10000000-0000-4000-8000-000000000006",
});
const AS_OF_UTC = "2026-08-15T20:00:00.000Z";

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error(`missing ${name}`);
  return value;
}

function positiveDecimal(name: string): number {
  const value = Number(argument(name));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`invalid ${name}`);
  return value;
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function completedMessage(
  messageId: string,
  sequence: number,
  role: "user" | "assistant",
  text: string,
): CoachAiChatMessage {
  return Object.freeze({
    messageId,
    sequence,
    role,
    originalUserTextPrivate: role === "user" ? text : null,
    normalizedUserTextPrivate: role === "user" ? text : null,
    structuredInterpretationJson: null,
    assistantTextPrivate: role === "assistant" ? text : null,
    generationState: role === "assistant" ? "completed" : "not_applicable",
    failureCode: null,
    createdAtUtc: AS_OF_UTC,
    finalizedAtUtc: role === "assistant" ? AS_OF_UTC : null,
  });
}

function dispatcher(scope: WorkspaceAccessScope): CoachAiChatFactualToolDispatcher {
  const unavailable = (toolName: string) => Object.freeze({
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
    toolName,
    result: Object.freeze({ state: "unavailable", reason: "No synthetic fact was supplied." }),
  });
  const baseTools = {
    summarizeClosedTrades: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
      unavailable(request.toolName),
    groupClosedTrades: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
      unavailable(request.toolName),
    listClosedTrades: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
      unavailable(request.toolName),
  };
  const productContext = {
    listImports: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
      unavailable(request.toolName),
    listDataDecisions: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
      unavailable(request.toolName),
    dataDecisionDetail: (_scope: unknown, _account: unknown, request: { toolName: string }) =>
      unavailable(request.toolName),
    listNotifications: (_scope: unknown, request: { toolName: string }) =>
      unavailable(request.toolName),
    accountContext: (_scope: unknown, _account: unknown, request: { toolName: string }) => {
      if (request.toolName === "get_account_ai_plan") {
        return Object.freeze({
          contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
          toolName: request.toolName,
          result: Object.freeze({
            reviewSettings: Object.freeze({ isEnabled: true }),
            reviewDelivery: Object.freeze({ deliveryDay: "Saturday", deliveryTimeEastern: "18:00" }),
            availableReviews: Object.freeze([]),
            entitlement: Object.freeze({
              state: "active",
              cancelAtPeriodEnd: false,
              renewalPeriodStartUtc: "2026-08-01T00:00:00.000Z",
              renewalPeriodEndUtc: "2026-09-01T00:00:00.000Z",
            }),
            link: "/account/ai",
          }),
        });
      }
      if (request.toolName === "get_account_preferences") {
        return Object.freeze({
          contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
          toolName: request.toolName,
          result: Object.freeze({
            reportingCurrency: "USD",
            notifications: Object.freeze({ discordDmCategories: Object.freeze([]) }),
            link: "/account/preferences",
          }),
        });
      }
      return unavailable(request.toolName);
    },
  };
  return new CoachAiChatFactualToolDispatcher(
    baseTools as never,
    { getClosedTradeDetails: (_scope: unknown, _account: unknown,
      request: { toolName: string }) => unavailable(request.toolName) } as never,
    scope,
    UUIDS.accountId,
    AS_OF_UTC,
    Object.freeze({ productContext: productContext as never }),
    Object.freeze({ kind: "recent" }),
  );
}

function cost(result: CoachAiChatGenerationResult, inputRate: number, outputRate: number): number {
  const usage = result.usage;
  requireCondition(usage.inputTokens !== null && usage.outputTokens !== null &&
    usage.totalTokens === usage.inputTokens + usage.outputTokens,
  "live provider did not return complete usage");
  return usage.inputTokens * inputRate / 1_000_000 +
    usage.outputTokens * outputRate / 1_000_000;
}

async function runCase(input: Readonly<{
  name: string;
  question: string;
  scope: WorkspaceAccessScope;
  attempt: CoachAiChatGenerationAttempt;
  recentMessages?: readonly CoachAiChatMessage[];
  intent?: CoachAiChatMessageIntent;
}>): Promise<CoachAiChatGenerationResult> {
  const result = await generateCoachAiChatOpenAiAnswer({
    scope: input.scope,
    selectedAccountId: UUIDS.accountId,
    asOfUtc: AS_OF_UTC,
    attempt: input.attempt,
    recentMessages: input.recentMessages ?? Object.freeze([]),
    question: input.question,
    intent: input.intent ?? "answer_question",
    trustedContext: null,
    existingManualEntryDraft: null,
    currentReviewDelivery: Object.freeze({
      weeklyDeliveryDay: "saturday",
      deliveryTimeEastern: "18:00",
      updatedAtUtc: null,
    }),
    analysisScope: Object.freeze({ kind: "recent" }),
    dispatcher: dispatcher(input.scope),
  });
  requireCondition(result.answer.directAnswer.trim().length > 0,
    `${input.name}: empty direct answer`);
  return result;
}

export async function verifyCoachAiChatLiveProvider(): Promise<void> {
  if (!process.argv.includes(CONFIRMATION)) throw new Error(`missing ${CONFIRMATION}`);
  loadEnvConfig(process.cwd());
  requireCondition(Boolean(process.env.OPENAI_API_KEY?.trim()), "TraderLink OPENAI_API_KEY missing");

  const modelId = argument("--model");
  const inputRate = positiveDecimal("--input-cost-usd-per-million");
  const outputRate = positiveDecimal("--output-cost-usd-per-million");
  const maximumCost = positiveDecimal("--maximum-total-cost-usd");
  const scope: WorkspaceAccessScope = Object.freeze({
    userId: UUIDS.userId,
    workspaceId: UUIDS.workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: Object.freeze([UUIDS.accountId]),
    activeAccountId: UUIDS.accountId,
  });
  const attempt: CoachAiChatGenerationAttempt = Object.freeze({
    attemptId: UUIDS.attemptId,
    conversationId: UUIDS.conversationId,
    assistantMessageId: UUIDS.assistantMessageId,
    state: "started",
    providerKey: "openai_direct",
    modelId,
    inputCostUsdPerMillionTokens: String(inputRate),
    outputCostUsdPerMillionTokens: String(outputRate),
    maximumInputTokens: 256_000,
    maximumOutputTokens: 800,
    maximumTotalTokens: 256_800,
    maximumCostUsd: String(maximumCost),
    reservedAtUtc: AS_OF_UTC,
    startedAtUtc: AS_OF_UTC,
    finalizedAtUtc: null,
    failureCode: null,
  });

  const read = await runCase({
    name: "grounded account read",
    question: "Is my paid AI Review access active, and when does the current period end?",
    scope,
    attempt,
  });
  requireCondition(read.factualToolCalls.some((call) => call.toolName === "get_account_ai_plan"),
    "grounded account read did not use get_account_ai_plan");
  requireCondition(read.answer.evidenceReferences.length > 0,
    "grounded account read had no evidence reference");

  const followUp = await runCase({
    name: "grounded follow-up",
    question: "And is it set to cancel?",
    scope,
    attempt,
    recentMessages: Object.freeze([
      completedMessage("10000000-0000-4000-8000-000000000011", 1, "user",
        "Is my paid AI Review access active?"),
      completedMessage("10000000-0000-4000-8000-000000000012", 2, "assistant",
        read.answer.directAnswer),
    ]),
  });
  requireCondition(followUp.factualToolCalls.some((call) => call.toolName === "get_account_ai_plan"),
    "grounded follow-up did not refresh account facts");

  const manual = await runCase({
    name: "manual execution draft",
    question: "Enter these executions: on 2026-08-14 at 09:35 Eastern I bought 100 TEST at 1.25, then at 10:05 Eastern I sold 100 TEST at 1.50.",
    scope,
    attempt,
  });
  requireCondition(manual.manualEntryExtraction?.state === "ready_for_confirmation" &&
    manual.manualEntryExtraction.rows.length === 2,
  "manual entry did not produce two confirmation-ready rows");
  requireCondition(manual.manualEntryExtraction.rows[0]?.normalizedSymbol === "TEST" &&
    manual.manualEntryExtraction.rows[0]?.quantityDecimal === "100" &&
    manual.manualEntryExtraction.rows[1]?.side === "sell",
  "manual entry changed supplied execution facts");

  const draft = await runCase({
    name: "confirmed-action draft",
    question: "Change my reporting currency to CAD.",
    scope,
    attempt,
  });
  requireCondition(draft.factualToolCalls.some((call) =>
    call.toolName === "get_account_preferences"),
  "reporting-currency draft did not read current preferences");
  requireCondition(draft.actionDraftExtraction?.kind === "reporting_currency" &&
    draft.actionDraftExtraction.reportingCurrency === "CAD",
  "reporting-currency request did not produce the exact confirmation draft");

  const refusal = await runCase({
    name: "unsupported advice refusal",
    question: "Tell me tomorrow's hottest stock and the exact price where I should buy it.",
    scope,
    attempt,
  });
  requireCondition(refusal.factualToolCalls.length === 0 &&
    refusal.manualEntryExtraction === null &&
    refusal.dailyCompanionDraftExtraction === null &&
    refusal.reviewDeliveryChangeExtraction === null &&
    (refusal.actionDraftExtraction ?? null) === null,
  "unsupported advice request used a factual or mutation path");

  const results = Object.freeze([read, followUp, manual, draft, refusal]);
  const costs = results.map((result) => cost(result, inputRate, outputRate));
  const estimatedCostUsd = costs.reduce((sum, value) => sum + value, 0);
  requireCondition(estimatedCostUsd <= maximumCost,
    `live verification cost ${estimatedCostUsd.toFixed(6)} exceeded ${maximumCost}`);
  console.log(JSON.stringify({
    status: "passed",
    modelId,
    caseCount: results.length,
    totalInputTokens: results.reduce((sum, result) => sum + (result.usage.inputTokens ?? 0), 0),
    totalOutputTokens: results.reduce((sum, result) => sum + (result.usage.outputTokens ?? 0), 0),
    estimatedCostUsd: estimatedCostUsd.toFixed(6),
    cases: Object.freeze([
      Object.freeze({ name: "grounded account read", tools: read.factualToolCalls.map((call) => call.toolName) }),
      Object.freeze({ name: "grounded follow-up", tools: followUp.factualToolCalls.map((call) => call.toolName) }),
      Object.freeze({ name: "manual execution draft", state: manual.manualEntryExtraction?.state }),
      Object.freeze({ name: "confirmed-action draft", kind: draft.actionDraftExtraction?.kind }),
      Object.freeze({ name: "unsupported advice refusal", toolCount: refusal.factualToolCalls.length }),
    ]),
  }));
}

if (process.argv[1]?.replaceAll("\\", "/")
  .endsWith("/verify-coach-ai-chat-live-provider.ts")) {
  void verifyCoachAiChatLiveProvider().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "live AI Chat verification failed");
    process.exitCode = 1;
  });
}
