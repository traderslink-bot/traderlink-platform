import { createHash } from "node:crypto";

import { loadEnvConfig } from "@next/env";

import {
  COACH_AI_CHAT_DETERMINISTIC_FAST_PATH_VERSION,
  selectCoachAiChatDeterministicFastPath,
} from "@/src/modules/coach/server/coach-ai-chat-deterministic-fast-path";
import { generateCoachAiChatSavedAnswer } from
  "@/src/modules/coach/server/coach-ai-chat-generation-runtime";
import { CoachAiChatRepository } from "@/src/modules/coach/server/coach-ai-chat-repository";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

type AcceptanceCase = Readonly<{
  id: string;
  question: string;
  expectedRouteKey: "completed_trade_performance" | "performance_aggregate";
  expectedToolName:
    | "get_results_by_ticker"
    | "get_timing_analytics"
    | "get_analytics_overview"
    | "summarize_closed_trades"
    | "query_trade_explorer";
}>;

type PersistedSnapshot = Readonly<{
  generationSource?: unknown;
  deterministicRouteKey?: unknown;
  factualToolCalls?: readonly Readonly<{ toolName?: unknown }>[];
  answer?: Readonly<{
    directAnswer?: unknown;
    evidenceReferences?: readonly unknown[];
  }>;
}>;

const CASES: readonly AcceptanceCase[] = Object.freeze([
  Object.freeze({
    id: "best-trade-all-history",
    question: "what was my most profitable trade",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "query_trade_explorer",
  }),
  Object.freeze({
    id: "best-trade-this-year",
    question: "what was my most profitable trade this year",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "query_trade_explorer",
  }),
  Object.freeze({
    id: "best-trade-march",
    question: "what was my most profitable trade in march 2026",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "query_trade_explorer",
  }),
  Object.freeze({
    id: "best-trade-april-day",
    question: "what was my best trade on April 15, 2026",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "query_trade_explorer",
  }),
  Object.freeze({
    id: "best-trade-last-year",
    question: "what was my best trade last year",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "query_trade_explorer",
  }),
  Object.freeze({
    id: "trade-count-march",
    question: "how many trades did I do in march 2026",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "summarize_closed_trades",
  }),
  Object.freeze({
    id: "worst-three-losses",
    question: "give me the worst 3 losses",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "query_trade_explorer",
  }),
  Object.freeze({
    id: "best-long-march",
    question: "what was my best long trade in march 2026",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "query_trade_explorer",
  }),
  Object.freeze({
    id: "best-short-march",
    question: "what was my best short trade in march 2026",
    expectedRouteKey: "completed_trade_performance",
    expectedToolName: "query_trade_explorer",
  }),
  Object.freeze({
    id: "best-ticker-march",
    question: "what ticker did i profit the most from in march 2026",
    expectedRouteKey: "performance_aggregate",
    expectedToolName: "get_results_by_ticker",
  }),
  Object.freeze({
    id: "most-traded-ticker-march",
    question: "what ticker did I trade the most in march 2026",
    expectedRouteKey: "performance_aggregate",
    expectedToolName: "get_results_by_ticker",
  }),
  Object.freeze({
    id: "best-trading-day-all-history",
    question: "what was my most profitable day",
    expectedRouteKey: "performance_aggregate",
    expectedToolName: "get_analytics_overview",
  }),
  Object.freeze({
    id: "best-trading-day-march",
    question: "what was my best trading day in march 2026",
    expectedRouteKey: "performance_aggregate",
    expectedToolName: "get_analytics_overview",
  }),
  Object.freeze({
    id: "best-session",
    question: "what session do I perform best in",
    expectedRouteKey: "performance_aggregate",
    expectedToolName: "get_timing_analytics",
  }),
  Object.freeze({
    id: "best-entry-time",
    question: "what time of day am i most profitable",
    expectedRouteKey: "performance_aggregate",
    expectedToolName: "get_timing_analytics",
  }),
  Object.freeze({
    id: "weakest-weekday",
    question: "what day of the week should i avoid trade",
    expectedRouteKey: "performance_aggregate",
    expectedToolName: "get_timing_analytics",
  }),
]);

function fail(code: string): never {
  throw new Error(code);
}

function selectedCases(): readonly AcceptanceCase[] {
  const args = process.argv.slice(2);
  if (args.length === 0) return CASES;
  if (args.length !== 2 || args[0] !== "--case") {
    fail("links_deterministic_acceptance_case_argument_invalid");
  }
  const selected = CASES.find((item) => item.id === args[1]);
  if (!selected) fail("links_deterministic_acceptance_case_unknown");
  return Object.freeze([selected]);
}

function idempotencySha256(item: AcceptanceCase, runMarker: string): string {
  return createHash("sha256").update([
    "traderlink_links_deterministic_performance_acceptance_v1",
    item.id,
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
    if (!row) fail("links_deterministic_acceptance_snapshot_missing");
    let snapshot: PersistedSnapshot;
    try {
      snapshot = JSON.parse(row.factual_snapshot_json) as PersistedSnapshot;
    } catch {
      fail("links_deterministic_acceptance_snapshot_invalid");
    }
    const receipt = database.prepare<[string, string, string, string], Readonly<{
      count: number;
    }>>(`SELECT COUNT(*) AS count
FROM coach_ai_chat_generation_receipts
WHERE coach_ai_chat_message_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      assistantMessageId,
      scope.userId,
      scope.workspaceId,
      scope.activeAccountId!,
    );
    return Object.freeze({
      snapshot,
      providerReceiptCount: receipt?.count ?? 0,
      answerPresent: Boolean(row.assistant_text_private?.trim()),
    });
  });
}

function isAcceptedNoFigureAnswer(value: unknown): boolean {
  return value === "I don’t have any completed trades in this scope yet." ||
    value === "Your results span more than one currency here, so I can’t rank them as one reliable result." ||
    value === "I don’t have a complete ranked result for that question in this scope.";
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd(), true);
  loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const scope = withPlatformDatabase({ mode: "runtime" }, (database) =>
    deriveDevelopmentOwnerJournalScope(database).scope);
  const reportingContext = await withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ reportingContext }) => reportingContext,
  );
  const cases = selectedCases();
  const runMarker = new Date().toISOString();
  const conversationId = withPlatformDatabase({ mode: "runtime" }, (database) =>
    new CoachAiChatRepository(database).createConversation(
      scope,
      `Links deterministic performance acceptance ${cases[0]!.id} 2026-08-21`,
    ).conversationId);

  const results: Array<Readonly<{
    id: string;
    routeKey: string;
    toolName: string;
    evidenceReferenceCount: number;
  }>> = [];
  for (const item of cases) {
    const route = selectCoachAiChatDeterministicFastPath(item.question, new Date(), Object.freeze({
      reportingCurrency: reportingContext.reportingCurrency,
    }));
    if (!route || route.routeKey !== item.expectedRouteKey) {
      fail(`links_deterministic_acceptance_route_mismatch:${item.id}`);
    }
    const generated = await generateCoachAiChatSavedAnswer(scope, {
      conversationId,
      question: item.question,
      reportingContext,
      idempotencySha256: idempotencySha256(item, runMarker),
    });
    if (generated.state !== "completed") {
      fail(`links_deterministic_acceptance_generation_${generated.state}:${item.id}`);
    }
    const persisted = readPersistedSnapshot(scope, generated.assistantMessageId);
    const toolNames = persisted.snapshot.factualToolCalls?.map((call) => call.toolName) ?? [];
    const evidenceReferenceCount = persisted.snapshot.answer?.evidenceReferences?.length ?? 0;
    const acceptedNoFigure = evidenceReferenceCount === 0 &&
      isAcceptedNoFigureAnswer(persisted.snapshot.answer?.directAnswer);
    if (!persisted.answerPresent ||
        persisted.snapshot.generationSource !== COACH_AI_CHAT_DETERMINISTIC_FAST_PATH_VERSION ||
        persisted.snapshot.deterministicRouteKey !== item.expectedRouteKey ||
        toolNames.length !== 1 || toolNames[0] !== item.expectedToolName ||
        (!acceptedNoFigure && evidenceReferenceCount === 0) ||
        persisted.providerReceiptCount !== 0) {
      fail(`links_deterministic_acceptance_evidence_mismatch:${item.id}`);
    }
    results.push(Object.freeze({
      id: item.id,
      routeKey: String(persisted.snapshot.deterministicRouteKey),
      toolName: String(toolNames[0]),
      evidenceReferenceCount,
    }));
  }
  process.stdout.write(`${JSON.stringify(Object.freeze({
    status: "passed",
    caseCount: results.length,
    providerReceiptCount: 0,
    conversationCreated: true,
    results,
  }), null, 2)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "links_deterministic_acceptance_failed"}\n`);
  process.exitCode = 1;
});
