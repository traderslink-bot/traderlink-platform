import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from
  "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from
  "@/src/modules/platform/server/database/run-platform-migrations";
import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "@/src/modules/coach/contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatGenerationService } from
  "@/src/modules/coach/server/coach-ai-chat-generation-service";
import { CoachAiChatProviderControlsRepository } from
  "@/src/modules/coach/server/coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from
  "@/src/modules/coach/server/coach-ai-chat-repository";
import { CoachAiChatGenerationRecoveryService } from
  "@/src/modules/coach/server/coach-ai-chat-generation-recovery-service";
import {
  resolveCoachAiChatQuestionAnalysisScope,
  selectCoachAiChatDeterministicFastPath,
} from
  "@/src/modules/coach/server/coach-ai-chat-deterministic-fast-path";

const NOW = new Date("2026-08-20T16:30:00.000Z");

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function seedScope(database: Database.Database): WorkspaceAccessScope {
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const now = NOW.toISOString();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, 'Fast-path verifier', 'active', ?, ?)`)
    .run(userId, `fast-path-${userId}`, now, now);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Fast-path verifier', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, now, now);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, now, now);
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Fast-path verifier', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, now, now);
  return Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
}

function metric(
  metricId: string,
  kind: "decimal" | "integer",
  value: string | number,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    metricId,
    formulaVersion: "verification_v1",
    title: metricId,
    description: "Synthetic deterministic verification value.",
    valueKind: kind === "decimal" ? "money" : "count",
    unit: kind === "decimal" ? "trade_currency" : "trades",
    state: "complete",
    value: kind === "decimal"
      ? Object.freeze({ kind, valueDecimal: String(value) })
      : Object.freeze({ kind, value: Number(value) }),
    moneyBasis: kind === "decimal" ? "net" : "not_applicable",
    chargePolicy: "complete_charge_coverage",
    currency: kind === "decimal" ? "USD" : null,
    timezonePolicy: "account_timezone",
    dateAttributionPolicy: "closing_date",
    coverage: Object.freeze({
      state: "complete", candidateCount: 3, includedCount: 3, excludedCount: 0,
      readyClosedCount: 3, legitimateOpenCount: 0, needsDecisionCount: 0,
      unsupportedCount: 0, feeCompleteCount: 3, feeIncompleteCount: 0,
      unavailableCount: 0, reasonCounts: Object.freeze({}),
    }),
    limitationReasonCodes: Object.freeze([]),
    factSetRevisionSha256: "a".repeat(64),
    registryVersion: "verification_v1",
    resultDigestSha256: "b".repeat(64),
  });
}

function rankedResponse(): Readonly<Record<string, unknown>> {
  const coverage = Object.freeze({
    state: "complete", candidateCount: 3, includedCount: 3, excludedCount: 0,
    readyClosedCount: 3, legitimateOpenCount: 0, needsDecisionCount: 0,
    unsupportedCount: 0, feeCompleteCount: 3, feeIncompleteCount: 0,
    unavailableCount: 0, reasonCounts: Object.freeze({}),
  });
  return Object.freeze({
    resultView: "trading_days",
    selectedMetricId: "net_pnl",
    grouping: "closing_day",
    tradeSort: null,
    rankDirection: "descending",
    response: Object.freeze({
      resultVersion: "journal_analytics_result_v1",
      factSetRevisionSha256: "a".repeat(64),
      registryVersion: "verification_v1",
      generatedAtUtc: NOW.toISOString(),
      partitions: Object.freeze([Object.freeze({
        resultVersion: "journal_analytics_result_v1",
        factSetRevisionSha256: "a".repeat(64),
        registryVersion: "verification_v1",
        generatedAtUtc: NOW.toISOString(),
        currency: "USD",
        timezone: "America/New_York",
        metrics: Object.freeze([]),
        groups: Object.freeze([Object.freeze({
          grouping: "closing_day",
          groupKey: "2026-08-18",
          label: "Tuesday",
          metrics: Object.freeze([
            metric("net_pnl", "decimal", "800"),
            metric("total_trades", "integer", 3),
          ]),
        })]),
        coverage,
        continuationCursor: null,
        limitations: Object.freeze([]),
        reconciliation: Object.freeze({ status: "reconciled", reasonCode: null }),
      })]),
      selectedAccountSourceCoverage: Object.freeze({
        excludedExecutionCount: 0,
        unsupportedSourceRecordCount: 0,
        attribution: "selected_accounts_full_scope",
      }),
      crossPartitionCounts: Object.freeze({
        candidateCount: 3, includedCount: 3, readyClosedCount: 3,
        legitimateOpenCount: 0, needsDecisionCount: 0,
        feeCompleteCount: 3, feeIncompleteCount: 0,
      }),
      limitations: Object.freeze([]),
    }),
    evidence: null,
    evidenceUnavailableReason: null,
    link: "/analytics/trade-explorer",
  });
}

async function main(): Promise<void> {
  invariant(selectCoachAiChatDeterministicFastPath("What was my most profitable day?")
    ?.routeKey === "most_profitable_day",
  "An exact common ranking question must select the deterministic route.");
  invariant(selectCoachAiChatDeterministicFastPath(
    "What was my most profitable day and why?",
  ) === null, "A broader causal question must remain model-routed.");
  const scopedQuestions = Object.freeze([
    Object.freeze({
      question: "What was my most profitable trade on April 15, 2026?",
      expected: Object.freeze({ kind: "day", date: "2026-04-15" }),
    }),
    Object.freeze({
      question: "What was my most profitable trade on 2026-04-15?",
      expected: Object.freeze({ kind: "day", date: "2026-04-15" }),
    }),
    Object.freeze({
      question: "How many trades did I do in April 2026?",
      expected: Object.freeze({ kind: "month", month: "2026-04" }),
    }),
    Object.freeze({
      question: "What was my best trade in 2026?",
      expected: Object.freeze({ kind: "custom", startDate: "2026-01-01", endDate: "2026-12-31" }),
    }),
    Object.freeze({
      question: "What was my best trade in the last 90 days?",
      expected: Object.freeze({ kind: "custom", startDate: "2026-05-23", endDate: "2026-08-20" }),
    }),
  ]);
  for (const item of scopedQuestions) {
    invariant(JSON.stringify(resolveCoachAiChatQuestionAnalysisScope(item.question, NOW)) ===
      JSON.stringify(item.expected),
    `The explicit calendar scope must be resolved for: ${item.question}`);
  }
  invariant(selectCoachAiChatDeterministicFastPath(
    "What was my most profitable trade in April 2026?", NOW,
  )?.analysisScopeOverride?.kind === "month",
  "A scoped common factual question must stay deterministic.");

  const configuredOverrideDatabase = new Database(":memory:");
  try {
    configuredOverrideDatabase.pragma("foreign_keys = ON");
    runPlatformMigrations(configuredOverrideDatabase, {
      manifest: platformMigrationManifest.slice(0, 68),
      now: () => NOW,
    });
    configuredOverrideDatabase.prepare(`UPDATE coach_ai_chat_provider_settings
SET model_id = 'gpt-5.6-sol',
  input_cost_usd_per_million_tokens = '7',
  cached_input_cost_usd_per_million_tokens = '0.7',
  cache_write_input_cost_usd_per_million_tokens = '8.75',
  output_cost_usd_per_million_tokens = '42'
WHERE settings_key = 'ai_chat'`).run();
    runPlatformMigrations(configuredOverrideDatabase, {
      manifest: platformMigrationManifest,
      now: () => NOW,
    });
    const configuredOverride = new CoachAiChatProviderControlsRepository(
      configuredOverrideDatabase,
    ).readChatSettings();
    invariant(configuredOverride.modelId === "gpt-5.6-sol" &&
      configuredOverride.inputCostUsdPerMillionTokens === "7",
    "The Luna default migration must preserve a configured owner-admin override.");
  } finally {
    configuredOverrideDatabase.close();
  }

  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    runPlatformMigrations(database, {
      manifest: platformMigrationManifest,
      now: () => NOW,
    });
    const defaultProviderSettings = new CoachAiChatProviderControlsRepository(database)
      .readChatSettings();
    invariant(defaultProviderSettings.modelId === "gpt-5.6-luna" &&
      defaultProviderSettings.inputCostUsdPerMillionTokens === "0.20" &&
      defaultProviderSettings.cachedInputCostUsdPerMillionTokens === "0.02" &&
      defaultProviderSettings.cacheWriteInputCostUsdPerMillionTokens === "0.25" &&
      defaultProviderSettings.outputCostUsdPerMillionTokens === "1.20",
    "A fresh database must use the accepted Luna model and official price snapshot.");
    const scope = seedScope(database);
    const chat = new CoachAiChatRepository(database);
    const controls = new CoachAiChatProviderControlsRepository(database);
    const conversation = chat.createConversation(scope, "Cost verification", NOW);
    let providerCalls = 0;
    const generator = async (): Promise<never> => {
      providerCalls += 1;
      throw new Error("Provider must not be called for an exact fast-path question.");
    };
    const service = new CoachAiChatGenerationService(
      chat,
      controls,
      {
        summarizeClosedTrades: () => { throw new Error("Not used"); },
        groupClosedTrades: () => { throw new Error("Not used"); },
        listClosedTrades: () => { throw new Error("Not used"); },
      },
      { getClosedTradeDetails: () => { throw new Error("Not used"); } },
      generator,
      null,
      null,
      null,
      Object.freeze({
        analyticsPages: Object.freeze({
          readPage: () => { throw new Error("Not used"); },
          tradeExplorer: () => Object.freeze({
            contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
            toolName: "query_trade_explorer" as const,
            result: rankedResponse(),
          }) as never,
        }),
      }),
      null,
      "USD",
    );
    const idempotencySha256 = "c".repeat(64);
    const first = await service.generateSavedAnswer(scope, {
      conversationId: conversation.conversationId,
      question: "What was my most profitable day?",
      idempotencySha256,
    }, NOW);
    const second = await service.generateSavedAnswer(scope, {
      conversationId: conversation.conversationId,
      question: "What was my most profitable day?",
      idempotencySha256,
    }, NOW);
    const saved = chat.readGenerationPair(
      scope,
      conversation.conversationId,
      first.assistantMessageId,
    );
    const receipts = database.prepare<[], { count: number }>(
      "SELECT COUNT(*) AS count FROM coach_ai_chat_generation_receipts",
    ).get()!.count;
    const attempts = database.prepare<[], { count: number }>(
      "SELECT COUNT(*) AS count FROM coach_ai_chat_generation_attempts",
    ).get()!.count;
    const snapshots = database.prepare<[], { count: number }>(
      "SELECT COUNT(*) AS count FROM coach_ai_chat_answer_snapshots",
    ).get()!.count;
    invariant(first.state === "completed" && first.attemptId === null,
      "The deterministic answer must complete without a provider attempt.");
    invariant(second.assistantMessageId === first.assistantMessageId &&
      second.attemptId === null,
    "An idempotent retry must return the original deterministic answer.");
    invariant(providerCalls === 0 && receipts === 0 && attempts === 0,
      "The deterministic route must create no provider call, attempt, receipt, or cost.");
    invariant(snapshots === 1,
      "The deterministic answer must retain one immutable factual snapshot.");
    invariant(saved.assistantMessage.assistantTextPrivate ===
      "Your most profitable trading day was Tuesday, with $800.00 net P/L.\n\n" +
      "You took 3 trades that day.",
    "The saved answer must preserve the exact ranked fact and natural supporting detail.");
    const interruptedAt = new Date(NOW.getTime() - 11 * 60 * 1_000);
    const interruptedConversation = chat.createConversation(
      scope,
      "Interrupted deterministic verification",
      interruptedAt,
    );
    const interrupted = chat.appendUserMessageAndReserveAssistant(
      scope,
      interruptedConversation.conversationId,
      {
        originalUserTextPrivate: "What is my win rate?",
        structuredInterpretation: Object.freeze({
          intent: "answer_question",
          generationSource: "links_deterministic_fast_path_v1",
          deterministicRouteKey: "win_rate",
          deterministicIdempotencySha256: "d".repeat(64),
        }),
      },
      interruptedAt,
    );
    const recovered = new CoachAiChatGenerationRecoveryService(
      chat,
      controls,
    ).reconcile(scope, {
      conversationId: interruptedConversation.conversationId,
    }, NOW);
    const recoveredPair = chat.readGenerationPair(
      scope,
      interruptedConversation.conversationId,
      interrupted.assistantMessage.messageId,
    );
    invariant(recovered === 1 &&
      recoveredPair.assistantMessage.generationState === "failed",
    "A process-interrupted deterministic answer must fail closed after its lease.");
    console.log(JSON.stringify({
      status: "verified",
      exactQuestion: "What was my most profitable day?",
      savedAnswer: saved.assistantMessage.assistantTextPrivate,
      providerCalls,
      providerAttempts: attempts,
      providerReceipts: receipts,
      providerCostUsd: 0,
      defaultModelId: defaultProviderSettings.modelId,
      configuredOwnerModelPreserved: true,
      immutableSnapshots: snapshots,
      idempotentRetryReusedAnswer: true,
      broaderQuestionModelRouted: true,
      interruptedGenerationRecovered: true,
    }));
  } finally {
    database.close();
  }
}

void main();
