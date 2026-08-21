import { createHash } from "node:crypto";

import { loadEnvConfig } from "@next/env";

import {
  COACH_AI_CHAT_DETERMINISTIC_FAST_PATH_VERSION,
  selectCoachAiChatDeterministicFastPath,
} from "@/src/modules/coach/server/coach-ai-chat-deterministic-fast-path";
import { generateCoachAiChatSavedAnswer } from
  "@/src/modules/coach/server/coach-ai-chat-generation-runtime";
import { CoachAiChatRepository } from "@/src/modules/coach/server/coach-ai-chat-repository";
import { listLinksQuestionBankBatch } from "@/src/modules/coach/server/coach-ai-chat-question-bank";
import { classifyCoachAiChatPerformanceMasterCase } from
  "@/src/modules/coach/server/coach-ai-chat-completed-trade-performance-master-evaluator";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

type PersistedSnapshot = Readonly<{
  generationSource?: unknown;
  deterministicRouteKey?: unknown;
  factualToolCalls?: readonly Readonly<{ toolName?: unknown }>[];
  answer?: Readonly<{
    directAnswer?: unknown;
    evidenceReferences?: readonly unknown[];
  }>;
}>;

function fail(code: string): never {
  throw new Error(code);
}

type SelectedBatch = Readonly<{
  batch: number;
  from: number;
  count: number | null;
}>;

function selectedBatch(): SelectedBatch {
  const args = process.argv.slice(2);
  if (args.length !== 2 && args.length !== 6) {
    fail("links_question_bank_batch_argument_invalid");
  }
  const batchFlagIndex = args.indexOf("--batch");
  if (batchFlagIndex === -1 || !args[batchFlagIndex + 1]) {
    fail("links_question_bank_batch_argument_invalid");
  }
  const batch = Number(args[batchFlagIndex + 1]);
  if (!Number.isInteger(batch) || batch < 1) {
    fail("links_question_bank_batch_number_invalid");
  }
  if (args.length === 2) return Object.freeze({ batch, from: 1, count: null });
  const fromFlagIndex = args.indexOf("--from");
  const countFlagIndex = args.indexOf("--count");
  if (fromFlagIndex === -1 || countFlagIndex === -1 ||
      !args[fromFlagIndex + 1] || !args[countFlagIndex + 1]) {
    fail("links_question_bank_batch_range_argument_invalid");
  }
  const from = Number(args[fromFlagIndex + 1]);
  const count = Number(args[countFlagIndex + 1]);
  if (!Number.isInteger(from) || from < 1 || !Number.isInteger(count) || count < 1) {
    fail("links_question_bank_batch_range_number_invalid");
  }
  return Object.freeze({ batch, from, count });
}

function idempotencySha256(caseId: string, runMarker: string): string {
  return createHash("sha256").update([
    "traderlink_links_question_bank_saved_answer_acceptance_v1",
    caseId,
    runMarker,
  ].join("\u001f"), "utf8").digest("hex");
}

function readPersistedSnapshot(
  scope: WorkspaceAccessScope,
  assistantMessageId: string,
): Readonly<{ snapshot: PersistedSnapshot; providerReceiptCount: number; answerPresent: boolean }> {
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const row = database.prepare<[string, string, string, string], Readonly<{
      assistant_text_private: string | null;
      factual_snapshot_json: string;
    }>>(`SELECT message.assistant_text_private, snapshot.factual_snapshot_json
FROM coach_ai_chat_messages AS message
JOIN coach_ai_chat_answer_snapshots AS snapshot
  ON snapshot.coach_ai_chat_message_id = message.coach_ai_chat_message_id
WHERE message.coach_ai_chat_message_id = ? AND message.user_id = ? AND message.workspace_id = ?
  AND message.account_id = ?`).get(
      assistantMessageId,
      scope.userId,
      scope.workspaceId,
      scope.activeAccountId!,
    );
    if (!row) fail("links_question_bank_batch_snapshot_missing");
    let snapshot: PersistedSnapshot;
    try {
      snapshot = JSON.parse(row.factual_snapshot_json) as PersistedSnapshot;
    } catch {
      fail("links_question_bank_batch_snapshot_invalid");
    }
    const receipt = database.prepare<[string, string, string, string], Readonly<{ count: number }>>(
      `SELECT COUNT(*) AS count
FROM coach_ai_chat_generation_receipts
WHERE coach_ai_chat_message_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`,
    ).get(assistantMessageId, scope.userId, scope.workspaceId, scope.activeAccountId!);
    return Object.freeze({
      snapshot,
      providerReceiptCount: receipt?.count ?? 0,
      answerPresent: Boolean(row.assistant_text_private?.trim()),
    });
  });
}

function isApprovedNoResultAnswer(value: unknown): boolean {
  return value === "I don’t have any completed trades in this scope yet." ||
    value === "Your results span more than one currency here, so I can’t combine them into one reliable figure." ||
    value === "I can’t give you that figure reliably because the required trade coverage is unavailable.";
}

async function main(): Promise<void> {
  const selection = selectedBatch();
  const allCases = listLinksQuestionBankBatch(selection.batch);
  const cases = selection.count === null
    ? allCases
    : allCases.slice(selection.from - 1, selection.from - 1 + selection.count);
  if (cases.length === 0) fail("links_question_bank_batch_empty");
  if (cases.some((item) => item.followUpToId !== null || item.expectedToolNames.length !== 1)) {
    fail("links_question_bank_batch_requires_single_turn_single_tool_cases");
  }

  loadEnvConfig(process.cwd(), true);
  loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const scope = withPlatformDatabase({ mode: "runtime" }, (database) =>
    deriveDevelopmentOwnerJournalScope(database).scope);
  const reportingContext = await withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ reportingContext }) => reportingContext,
  );
  const runMarker = new Date().toISOString();
  const results: Array<Readonly<{
    caseId: string;
    routeKey: string;
    toolName: string;
    evidenceReferenceCount: number;
    approvedNoResult: boolean;
  }>> = [];
  for (const item of cases) {
    const expected = classifyCoachAiChatPerformanceMasterCase(item);
    if (expected.disposition !== "resolved") {
      fail(`links_question_bank_batch_case_not_in_current_scope:${item.id}`);
    }
    const route = selectCoachAiChatDeterministicFastPath(item.input, new Date(), Object.freeze({
      reportingCurrency: reportingContext.reportingCurrency,
    }));
    if (!route || route.routeKey !== "completed_trade_performance") {
      fail(`links_question_bank_batch_route_mismatch:${item.id}`);
    }
    const conversationId = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CoachAiChatRepository(database).createConversation(
        scope,
        `Links Question Bank Batch ${selection.batch} case ${item.id} acceptance 2026-08-21`,
      ).conversationId);
    const generated = await generateCoachAiChatSavedAnswer(scope, {
      conversationId,
      question: item.input,
      reportingContext,
      idempotencySha256: idempotencySha256(item.id, runMarker),
    });
    if (generated.state !== "completed") {
      fail(`links_question_bank_batch_generation_${generated.state}:${item.id}`);
    }
    const persisted = readPersistedSnapshot(scope, generated.assistantMessageId);
    const toolNames = persisted.snapshot.factualToolCalls?.map((call) => call.toolName) ?? [];
    const evidenceReferenceCount = persisted.snapshot.answer?.evidenceReferences?.length ?? 0;
    const approvedNoResult = evidenceReferenceCount === 0 &&
      isApprovedNoResultAnswer(persisted.snapshot.answer?.directAnswer);
    if (!persisted.answerPresent ||
        persisted.snapshot.generationSource !== COACH_AI_CHAT_DETERMINISTIC_FAST_PATH_VERSION ||
        persisted.snapshot.deterministicRouteKey !== "completed_trade_performance" ||
        toolNames.length !== 1 || toolNames[0] !== item.expectedToolNames[0] ||
        (!approvedNoResult && evidenceReferenceCount === 0) ||
        persisted.providerReceiptCount !== 0) {
      fail(`links_question_bank_batch_saved_answer_mismatch:${item.id}`);
    }
    results.push(Object.freeze({
      caseId: item.id,
      routeKey: String(persisted.snapshot.deterministicRouteKey),
      toolName: String(toolNames[0]),
      evidenceReferenceCount,
      approvedNoResult,
    }));
  }
  process.stdout.write(`${JSON.stringify(Object.freeze({
    status: "passed",
    batch: selection.batch,
    firstCaseNumber: selection.from,
    caseCount: results.length,
    providerReceiptCount: 0,
    conversationCount: results.length,
    results,
  }), null, 2)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "links_question_bank_batch_acceptance_failed"}\n`);
  process.exitCode = 1;
});
