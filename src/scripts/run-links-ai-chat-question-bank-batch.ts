import { createHash } from "node:crypto";

import { loadEnvConfig } from "@next/env";

import type { LinksQuestionBankCase } from
  "@/src/modules/coach/contracts/coach-ai-chat-question-bank-contracts";
import { listLinksQuestionBankBatch } from
  "@/src/modules/coach/server/coach-ai-chat-question-bank";
import { generateCoachAiChatSavedAnswer } from
  "@/src/modules/coach/server/coach-ai-chat-generation-runtime";
import { CoachAiChatProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from
  "@/src/modules/coach/server/coach-ai-chat-repository";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { withPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

const LIVE_CONFIRMATION = "--confirm-live-luna";
const LUNA_MODEL_ID = "gpt-5.6-luna";

type SavedSnapshot = Readonly<{
  answer: Readonly<{
    evidenceReferences?: readonly unknown[];
  }> | null;
  factualToolCalls: readonly Readonly<{ toolName?: unknown }>[];
  generationSource: string | null;
}>;

type ReceiptRow = Readonly<{
  model_id: string;
  estimated_cost_usd: string | null;
  total_tokens: number | null;
}>;

type BatchCaseResult = Readonly<{
  id: string;
  state: "completed" | "failed" | "blocked" | "pending";
  mechanicalPass: boolean;
  reason: string | null;
  toolNames: readonly string[];
  generationSource: string | null;
  modelId: string | null;
  estimatedCostUsd: string | null;
  totalTokens: number | null;
  answer: string | null;
}>;

function fail(code: string): never {
  throw new Error(code);
}

function parseBatch(): number {
  const args = process.argv.slice(2);
  if (args.length !== 3 || args[0] !== "--batch" || args[2] !== LIVE_CONFIRMATION) {
    fail("links_question_bank_live_confirmation_required");
  }
  const batch = Number(args[1]);
  if (!Number.isSafeInteger(batch) || batch < 1) fail("links_question_bank_batch_invalid");
  return batch;
}

function idempotencySha256(batch: number, item: LinksQuestionBankCase, runMarker: string): string {
  return createHash("sha256").update([
    "traderlink_links_question_bank_live_v1",
    String(batch),
    item.id,
    runMarker,
  ].join("\u001f"), "utf8").digest("hex");
}

function compactText(value: string | null): string | null {
  if (value === null) return null;
  return value.replace(/\s+/gu, " ").trim().slice(0, 800);
}

function genericTerminalAnswer(value: string | null): boolean {
  if (!value) return true;
  return /(?:links couldn.t finish that answer|the answer could not be completed|today.s links ai chat limit has been reached|your question is saved, and you can try again later)/iu.test(value);
}

function snapshotRecord(value: unknown): SavedSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const answer = record.answer && typeof record.answer === "object" && !Array.isArray(record.answer)
    ? record.answer as SavedSnapshot["answer"]
    : null;
  return Object.freeze({
    answer,
    factualToolCalls: Array.isArray(record.factualToolCalls)
      ? record.factualToolCalls.filter((item): item is Readonly<{ toolName?: unknown }> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item))
      : Object.freeze([]),
    generationSource: typeof record.generationSource === "string" ? record.generationSource : null,
  });
}

function readSavedResult(
  scope: WorkspaceAccessScope,
  conversationId: string,
  assistantMessageId: string,
): Readonly<{
  answer: string | null;
  generationState: "completed" | "failed" | "pending" | "not_applicable";
  failureCode: string | null;
  snapshot: SavedSnapshot | null;
  receipt: ReceiptRow | null;
}> {
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const chat = new CoachAiChatRepository(database);
    const pair = chat.readGenerationPair(scope, conversationId, assistantMessageId);
    const snapshotRow = database.prepare<[string, string, string, string], Readonly<{
      factual_snapshot_json: string;
    }>>(`SELECT factual_snapshot_json
FROM coach_ai_chat_answer_snapshots
WHERE coach_ai_chat_message_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      assistantMessageId, scope.userId, scope.workspaceId, scope.activeAccountId!,
    );
    let snapshot: SavedSnapshot | null = null;
    if (snapshotRow) {
      try {
        snapshot = snapshotRecord(JSON.parse(snapshotRow.factual_snapshot_json) as unknown);
      } catch {
        snapshot = null;
      }
    }
    const receipt = database.prepare<[string, string, string, string], ReceiptRow>(`SELECT
  model_id, estimated_cost_usd, total_tokens
FROM coach_ai_chat_generation_receipts
WHERE coach_ai_chat_message_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      assistantMessageId, scope.userId, scope.workspaceId, scope.activeAccountId!,
    ) ?? null;
    return Object.freeze({
      answer: pair.assistantMessage.assistantTextPrivate,
      generationState: pair.assistantMessage.generationState,
      failureCode: pair.assistantMessage.failureCode,
      snapshot,
      receipt,
    });
  });
}

function evaluateCase(
  item: LinksQuestionBankCase,
  state: "completed" | "failed" | "blocked" | "pending",
  saved: ReturnType<typeof readSavedResult>,
): BatchCaseResult {
  const toolNames = Object.freeze(saved.snapshot?.factualToolCalls
    .map((call) => typeof call.toolName === "string" ? call.toolName : null)
    .filter((name): name is string => name !== null) ?? []);
  const evidenceCount = saved.snapshot?.answer?.evidenceReferences?.length ?? 0;
  const acceptedUnavailable = item.answerKind === "exact_unavailable" && !genericTerminalAnswer(saved.answer);
  const mechanicalPass = state === "completed" && saved.generationState === "completed" &&
    !genericTerminalAnswer(saved.answer) && (acceptedUnavailable ||
      (toolNames.length > 0 && evidenceCount > 0));
  const reason = mechanicalPass ? null
    : state !== "completed" ? (saved.failureCode ?? `generation_${state}`)
      : genericTerminalAnswer(saved.answer) ? "generic_terminal_answer"
        : toolNames.length === 0 ? "missing_factual_tool_evidence"
          : evidenceCount === 0 ? "missing_answer_evidence"
            : "saved_answer_validation_failed";
  return Object.freeze({
    id: item.id,
    state,
    mechanicalPass,
    reason,
    toolNames,
    generationSource: saved.snapshot?.generationSource ?? null,
    modelId: saved.receipt?.model_id ?? null,
    estimatedCostUsd: saved.receipt?.estimated_cost_usd ?? null,
    totalTokens: saved.receipt?.total_tokens ?? null,
    answer: compactText(saved.answer),
  });
}

function createConversation(scope: WorkspaceAccessScope, title: string): string {
  return withPlatformDatabase({ mode: "runtime" }, (database) =>
    new CoachAiChatRepository(database).createConversation(scope, title).conversationId);
}

async function main(): Promise<void> {
  const batch = parseBatch();
  const cases = listLinksQuestionBankBatch(batch);
  if (cases.length === 0) fail("links_question_bank_batch_empty");
  if (cases.length > 30) fail("links_question_bank_batch_exceeds_thirty_cases");
  loadEnvConfig(process.cwd(), true);
  if (!process.env.OPENAI_API_KEY?.trim()) fail("links_question_bank_provider_key_missing");
  loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const scope = withPlatformDatabase({ mode: "runtime" }, (database) => {
    const owner = deriveDevelopmentOwnerJournalScope(database).scope;
    const settings = new CoachAiChatProviderControlsRepository(database).readChatSettings();
    if (settings.modelId !== LUNA_MODEL_ID) fail("links_question_bank_requires_configured_luna_model");
    return owner;
  });
  const reportingContext = await withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ reportingContext: context }) => context,
  );
  const runMarker = new Date().toISOString();
  const conversations = new Map<string, string>();
  const results: BatchCaseResult[] = [];
  for (const item of cases) {
    const parentConversation = item.followUpToId
      ? conversations.get(item.followUpToId) ?? null
      : null;
    const conversationId = parentConversation ?? createConversation(
      scope,
      `Links QA batch ${batch}: ${item.id}`,
    );
    conversations.set(item.id, conversationId);
    const generated = await generateCoachAiChatSavedAnswer(scope, {
      conversationId,
      question: item.input,
      reportingContext,
      idempotencySha256: idempotencySha256(batch, item, runMarker),
    });
    const saved = readSavedResult(scope, conversationId, generated.assistantMessageId);
    results.push(evaluateCase(item, generated.state, saved));
  }
  const completed = results.filter((item) => item.mechanicalPass).length;
  const providerResults = results.filter((item) => item.modelId === LUNA_MODEL_ID);
  const totalCostUsd = providerResults.reduce((total, item) =>
    total + Number(item.estimatedCostUsd ?? "0"), 0);
  process.stdout.write(`${JSON.stringify(Object.freeze({
    status: "completed",
    batch,
    caseCount: cases.length,
    mechanicalPassCount: completed,
    mechanicalFailureCount: cases.length - completed,
    lunaProviderCaseCount: providerResults.length,
    lunaReceiptCostUsd: totalCostUsd.toFixed(6),
    acceptance: "mechanical_only_canonical_oracle_pending",
    results,
  }), null, 2)}\n`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "links_question_bank_unexpected_failure";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
