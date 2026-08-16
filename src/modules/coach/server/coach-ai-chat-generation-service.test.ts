import Database from "better-sqlite3";
import { Buffer } from "node:buffer";
import { describe, expect, it, vi } from "vitest";

import type { CoachAiChatGenerationResult } from "../contracts/ai-chat-contracts";
import { COACH_AI_CHAT_ANSWER_CONTRACT_VERSION } from "../contracts/ai-chat-contracts";
import type { CoachAiChatPageContext } from "../contracts/ai-chat-page-context-contracts";
import type { CoachAiDailyCompanionContext } from "../contracts/ai-daily-companion-contracts";
import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from "../contracts/coach-ai-chat-factual-tool-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatProviderGenerationError } from "./coach-ai-chat-openai-adapter";
import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { COACH_AI_CHAT_GENERATION_INTERRUPTED_FAILURE_CODE, COACH_AI_CHAT_GENERATION_LEASE_MILLISECONDS } from "./coach-ai-chat-generation-recovery-service";
import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiDailyCompanionRepository } from "./coach-ai-daily-companion-repository";
import { CoachAiManualEntryDraftRepository } from "./coach-ai-manual-entry-draft-repository";
import { CoachAiReviewDeliveryChangeRepository } from "./coach-ai-review-delivery-change-repository";
import { COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES } from "./coach-ai-chat-factual-tool-dispatcher";
import { CoachAiChatGenerationService, COACH_AI_CHAT_MAX_TRUSTED_CONTEXT_BYTES, COACH_AI_CHAT_SYSTEM_AND_TOOL_ENVELOPE_RESERVED_BYTES, createCoachAiChatReservationEnvelope, type CoachAiChatGenerator } from "./coach-ai-chat-generation-service";

const now = new Date("2026-08-05T12:00:00.000Z");

function fixture() {
  const database = new Database(":memory:"); database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => now });
  const userId = createCanonicalUuidV4(); const workspaceId = createCanonicalUuidV4(); const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users VALUES (?, 'development_local', ?, 'Test', 'active', ?, ?)`).run(userId, `test-${userId}`, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO platform_workspaces VALUES (?, 'Test', 'America/New_York', 'active', ?, ?)`).run(workspaceId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO platform_workspace_memberships VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(workspaceId, userId, userId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO journal_accounts VALUES (?, ?, 'Test', 'USD', 'America/New_York', 'active', ?, ?, ?)`).run(accountId, workspaceId, userId, now.toISOString(), now.toISOString());
  const scope: WorkspaceAccessScope = Object.freeze({ userId, workspaceId, workspaceRole: "owner", allowedAccountIds: Object.freeze([accountId]), activeAccountId: accountId });
  const chat = new CoachAiChatRepository(database); const controls = new CoachAiChatProviderControlsRepository(database);
  controls.saveChatSettings({ modelId: "gpt-chat-test", inputCostUsdPerMillionTokens: "1", outputCostUsdPerMillionTokens: "2" });
  controls.savePlatformFeatureControl({ featureKey: "ai_chat", enabled: true, dailyRequestCap: 20, dailyTokenCap: 2_000_000, dailyEstimatedSpendCapUsd: "10" });
  controls.saveAccountFeatureControl(scope, { featureKey: "ai_chat", enabled: true, dailyRequestCap: 20, dailyTokenCap: 2_000_000, dailyEstimatedSpendCapUsd: "10" });
  return {
    database,
    scope,
    chat,
    controls,
    manualDrafts: new CoachAiManualEntryDraftRepository(database),
    reviewDeliveryChanges: new CoachAiReviewDeliveryChangeRepository(database),
    conversationId: chat.createConversation(scope, "Private", now).conversationId,
  };
}

function answer(): CoachAiChatGenerationResult {
  return Object.freeze({ answer: Object.freeze({ contractVersion: COACH_AI_CHAT_ANSWER_CONTRACT_VERSION, directAnswer: "Your saved Journal does not have enough facts for that yet.", supportingObservations: Object.freeze(["No closed-trade result was requested."]), limitation: "Ask about a saved trade or date range when you are ready.", nextQuestion: null, evidenceReferences: Object.freeze([]) }), usage: Object.freeze({ inputTokens: 20, outputTokens: 10, totalTokens: 30 }), factualToolCalls: Object.freeze([]), manualEntryExtraction: null, dailyCompanionDraftExtraction: null, reviewDeliveryChangeExtraction: null });
}

function service(f: ReturnType<typeof fixture>, generator: CoachAiChatGenerator) {
  const factualTools = { summarizeClosedTrades: vi.fn(() => ({ contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION, toolName: "summarize_closed_trades", result: { state: "unavailable" } })), groupClosedTrades: vi.fn(() => ({ contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION, toolName: "group_closed_trades", result: { state: "unavailable" } })), listClosedTrades: vi.fn() };
  const details = { getClosedTradeDetails: vi.fn() };
  return new CoachAiChatGenerationService(
    f.chat,
    f.controls,
    factualTools as never,
    details as never,
    generator,
    new CoachAiDailyCompanionRepository(f.database),
    f.manualDrafts,
    f.reviewDeliveryChanges,
  );
}

function dailyContext(): CoachAiDailyCompanionContext {
  return Object.freeze({
    contractVersion: "traderlink_coach_ai_daily_companion_context_v1",
    kind: "daily_review",
    tradingDate: "2026-08-05",
    timezone: "America/New_York",
    currency: "USD",
    factSetRevisionSha256: "a".repeat(64),
    dayResult: Object.freeze({ netPnlDecimal: "25", tradeCount: 1, tickerCount: 1 }),
    review: Object.freeze({ status: "not_started" }),
    dailyNotes: Object.freeze({
      whatWorked: "I waited for the setup.",
      whatNeedsWork: "I added too quickly.",
      technicalRecap: "",
      currentFocuses: "Wait for confirmation.",
      anythingElse: "",
    }),
    focusRevisions: Object.freeze([]),
    dayRules: Object.freeze([]),
    trades: Object.freeze([]),
    openPositions: Object.freeze([]),
    coverage: Object.freeze({
      needsDecisionCount: 0,
      contextTruncated: false,
      limitations: Object.freeze([]),
    }),
  });
}

function resolvedDailyContext() {
  return Object.freeze({
    context: dailyContext(),
    dailyNoteRevision: null,
    trades: Object.freeze([]),
  });
}

describe("CoachAiChatGenerationService", () => {
  it("persists one bounded, no-tool answer and reuses the exact attempt before and after completion", async () => {
    const f = fixture();
    try {
      const generator = vi.fn(async (input: Parameters<CoachAiChatGenerator>[0]) => {
        void input;
        return answer();
      }); const subject = service(f, generator);
      const input = { conversationId: f.conversationId, question: "What can you answer?", idempotencySha256: "a".repeat(64) };
      await expect(subject.generateSavedAnswer(f.scope, input, now)).resolves.toMatchObject({ state: "completed" });
      await expect(subject.generateSavedAnswer(f.scope, input, now)).resolves.toMatchObject({ state: "completed" });
      expect(generator).toHaveBeenCalledTimes(1);
      expect(generator.mock.calls[0]?.[0].recentMessages.some((message) =>
        message.originalUserTextPrivate === input.question)).toBe(false);
      expect(f.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_chat_messages`).get()).toEqual({ count: 2 });
    } finally { f.database.close(); }
  });

  it("passes a reduced current-page hint to generation without persisting it as factual evidence", async () => {
    const f = fixture();
    try {
      const pageContext = Object.freeze({
        contractVersion: "traderlink_coach_ai_chat_page_context_v1",
        authority: "conversation_hint_only",
        feature: "calendar",
        featureLabel: "Calendar",
        canonicalPath: "/calendar",
        tradingDate: null,
      }) satisfies CoachAiChatPageContext;
      const generator = vi.fn(async (input: Parameters<CoachAiChatGenerator>[0]) => {
        expect(input.pageContext).toEqual(pageContext);
        return answer();
      });
      const subject = service(f, generator);

      await expect(subject.generateSavedAnswer(f.scope, {
        conversationId: f.conversationId,
        question: "What can I ask about this page?",
        idempotencySha256: "d".repeat(64),
        pageContext,
      }, now)).resolves.toMatchObject({ state: "completed" });

      const userMessage = f.database.prepare(`SELECT structured_interpretation_json
FROM coach_ai_chat_messages WHERE role = 'user'`).get() as { structured_interpretation_json: string };
      const snapshot = f.database.prepare(`SELECT factual_snapshot_json
FROM coach_ai_chat_answer_snapshots`).get() as { factual_snapshot_json: string };
      expect(userMessage.structured_interpretation_json).not.toContain("/calendar");
      expect(snapshot.factual_snapshot_json).not.toContain("/calendar");
      expect(createCoachAiChatReservationEnvelope(
        "What can I ask about this page?",
        [],
        null,
        null,
        "answer_question",
        null,
        { kind: "recent" },
        pageContext,
      )).toContain('"currentPageHint"');
    } finally {
      f.database.close();
    }
  });

  it("gates and persists one server-trusted Daily Tracker interaction with the completed answer", async () => {
    const f = fixture();
    try {
      const resolvedContext = resolvedDailyContext();
      const context = resolvedContext.context;
      const generator = vi.fn(async (input: Parameters<CoachAiChatGenerator>[0]) => {
        expect(input.trustedContext).toEqual(context);
        return answer();
      });
      const subject = service(f, generator);
      await expect(subject.generateSavedAnswer(f.scope, {
        conversationId: f.conversationId,
        question: "Help me review this day.",
        idempotencySha256: "6".repeat(64),
        resolveTrustedContext: () => resolvedContext,
      }, now)).rejects.toThrow("TRADERLINK_COACH_CHAT_UNAVAILABLE");
      expect(f.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_chat_messages`).get())
        .toEqual({ count: 0 });

      f.controls.savePlatformFeatureControl({
        featureKey: "daily_companion",
        enabled: true,
        dailyRequestCap: 20,
        dailyTokenCap: 2_000_000,
        dailyEstimatedSpendCapUsd: "10",
      });
      f.controls.saveAccountFeatureControl(f.scope, {
        featureKey: "daily_companion",
        enabled: true,
        dailyRequestCap: 20,
        dailyTokenCap: 2_000_000,
        dailyEstimatedSpendCapUsd: "10",
      });
      await expect(subject.generateSavedAnswer(f.scope, {
        conversationId: f.conversationId,
        question: "Help me review this day.",
        idempotencySha256: "7".repeat(64),
        resolveTrustedContext: () => resolvedContext,
      }, now)).resolves.toMatchObject({ state: "completed" });
      await expect(subject.generateSavedAnswer(f.scope, {
        conversationId: f.conversationId,
        question: "Help me review this day.",
        idempotencySha256: "7".repeat(64),
        resolveTrustedContext: () => {
          throw new Error("the live day changed after the saved attempt");
        },
      }, now)).resolves.toMatchObject({ state: "completed" });
      expect(generator).toHaveBeenCalledTimes(1);

      const userMessage = f.database.prepare(`SELECT structured_interpretation_json
FROM coach_ai_chat_messages WHERE role = 'user'`).get() as { structured_interpretation_json: string };
      expect(JSON.parse(userMessage.structured_interpretation_json)).toMatchObject({
        intent: "assist_daily_review",
        trustedContext: { tradingDate: "2026-08-05", factSetRevisionSha256: "a".repeat(64) },
      });
      const snapshot = f.database.prepare(`SELECT factual_snapshot_json
FROM coach_ai_chat_answer_snapshots`).get() as { factual_snapshot_json: string };
      expect(JSON.parse(snapshot.factual_snapshot_json)).toMatchObject({
        trustedContext: { tradingDate: "2026-08-05", factSetRevisionSha256: "a".repeat(64) },
      });
      expect(f.database.prepare(`SELECT trading_date, disposition, journal_write_state
FROM coach_ai_daily_companion_interactions`).get()).toEqual({
        trading_date: "2026-08-05",
        disposition: "proposed",
        journal_write_state: "not_written",
      });
    } finally { f.database.close(); }
  });

  it("persists one editable Daily Companion draft and reuses it on an idempotent retry", async () => {
    const f = fixture();
    try {
      f.controls.savePlatformFeatureControl({
        featureKey: "daily_companion",
        enabled: true,
        dailyRequestCap: 20,
        dailyTokenCap: 2_000_000,
        dailyEstimatedSpendCapUsd: "10",
      });
      f.controls.saveAccountFeatureControl(f.scope, {
        featureKey: "daily_companion",
        enabled: true,
        dailyRequestCap: 20,
        dailyTokenCap: 2_000_000,
        dailyEstimatedSpendCapUsd: "10",
      });
      const generator = vi.fn(async () => Object.freeze({
        ...answer(),
        dailyCompanionDraftExtraction: Object.freeze({
          kind: "current_focus_draft" as const,
          currentFocuses: "Wait for confirmation before adding size.",
        }),
        reviewDeliveryChangeExtraction: null,
      }));
      const subject = service(f, generator);
      const input = {
        conversationId: f.conversationId,
        question: "Help me rewrite my Current Focus.",
        idempotencySha256: "8".repeat(64),
        resolveTrustedContext: () => resolvedDailyContext(),
      };
      const first = await subject.generateSavedAnswer(f.scope, input, now);
      expect(first.dailyCompanionDraft).toMatchObject({
        tradingDate: "2026-08-05",
        proposal: {
          kind: "current_focus_draft",
          currentFocuses: "Wait for confirmation before adding size.",
        },
        disposition: "proposed",
        journalWriteState: "not_written",
      });
      const second = await subject.generateSavedAnswer(f.scope, {
        ...input,
        resolveTrustedContext: () => {
          throw new Error("trusted context must not be rebuilt for an idempotent retry");
        },
      }, now);
      expect(second.dailyCompanionDraft?.interactionId)
        .toBe(first.dailyCompanionDraft?.interactionId);
      expect(generator).toHaveBeenCalledTimes(1);
      expect(f.database.prepare(`SELECT interaction_kind, COUNT(*) AS count
FROM coach_ai_daily_companion_interactions
GROUP BY interaction_kind
ORDER BY interaction_kind`).all()).toEqual([
        { interaction_kind: "current_focus_draft", count: 1 },
        { interaction_kind: "daily_reflection", count: 1 },
      ]);
    } finally { f.database.close(); }
  });

  it("persists one review delivery change proposal and reuses it on an idempotent retry", async () => {
    const f = fixture();
    try {
      const generator = vi.fn(async () => Object.freeze({
        ...answer(),
        reviewDeliveryChangeExtraction: Object.freeze({
          weeklyDeliveryDay: "sunday" as const,
          deliveryTimeEastern: "19:00",
        }),
      }));
      const subject = service(f, generator);
      const input = {
        conversationId: f.conversationId,
        question: "Move my AI Review to Sunday at 7 PM Eastern.",
        idempotencySha256: "7".repeat(64),
        resolveReviewDelivery: () => Object.freeze({
          weeklyDeliveryDay: "friday" as const,
          deliveryTimeEastern: "18:00",
          updatedAtUtc: null,
        }),
      };
      const first = await subject.generateSavedAnswer(f.scope, input, now);
      expect(first.reviewDeliveryChangeDraft).toMatchObject({
        current: { weeklyDeliveryDay: "friday", deliveryTimeEastern: "18:00" },
        proposed: { weeklyDeliveryDay: "sunday", deliveryTimeEastern: "19:00" },
        disposition: "proposed",
        settingsWriteState: "not_written",
      });
      const second = await subject.generateSavedAnswer(f.scope, {
        ...input,
        resolveReviewDelivery: () => {
          throw new Error("settings must not be reread for an idempotent retry");
        },
      }, now);
      expect(second.reviewDeliveryChangeDraft?.draftId)
        .toBe(first.reviewDeliveryChangeDraft?.draftId);
      expect(generator).toHaveBeenCalledTimes(1);
      expect(f.database.prepare(`SELECT COUNT(*) AS count
FROM coach_ai_review_delivery_change_drafts`).get()).toEqual({ count: 1 });
    } finally { f.database.close(); }
  });

  it("reserves factual results plus the full two-step system and tool envelope below the provider hard limit", () => {
    const envelope = createCoachAiChatReservationEnvelope("A bounded question", []);
    const bytes = Buffer.byteLength(envelope, "utf8");
    expect(bytes).toBeGreaterThanOrEqual(COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES * 2 + COACH_AI_CHAT_SYSTEM_AND_TOOL_ENVELOPE_RESERVED_BYTES);
    expect(bytes).toBeLessThan(256_000);

    const context = dailyContext();
    const fixedContextBytes = Buffer.byteLength(JSON.stringify(context), "utf8");
    const nearMaximumContext = Object.freeze({
      ...context,
      dailyNotes: Object.freeze({
        ...context.dailyNotes,
        anythingElse: "x".repeat(COACH_AI_CHAT_MAX_TRUSTED_CONTEXT_BYTES - fixedContextBytes - 256),
      }),
    });
    expect(Buffer.byteLength(
      createCoachAiChatReservationEnvelope("A bounded question", [], nearMaximumContext),
      "utf8",
    )).toBeLessThan(256_000);
    expect(Buffer.byteLength(
      createCoachAiChatReservationEnvelope("Buy 10 TEST at 1.25", [], null, null,
        "prepare_manual_execution_draft"),
      "utf8",
    )).toBeLessThan(256_000);
  });

  it("persists one editable manual-execution draft and reuses it for an idempotent retry", async () => {
    const f = fixture();
    try {
      const generator = vi.fn(async (input: Parameters<CoachAiChatGenerator>[0]) => {
        expect(input.intent).toBe("prepare_manual_execution_draft");
        expect(input.trustedContext).toBeNull();
        expect(input.existingManualEntryDraft).toBeNull();
        return Object.freeze({
          ...answer(),
          answer: Object.freeze({
            ...answer().answer,
            directAnswer: "I captured two TEST executions for your review.",
          }),
          manualEntryExtraction: Object.freeze({
            state: "ready_for_confirmation" as const,
            rows: Object.freeze([
              Object.freeze({ clientRowRef: "row-1", localDate: "2026-08-05", localTime: "09:30:00", normalizedSymbol: "TEST", side: "buy" as const, quantityDecimal: "10", priceDecimal: "1.25", feesDecimal: null }),
              Object.freeze({ clientRowRef: "row-2", localDate: "2026-08-05", localTime: "10:00:00", normalizedSymbol: "TEST", side: "sell" as const, quantityDecimal: "10", priceDecimal: "1.5", feesDecimal: null }),
            ]),
            missingFields: Object.freeze([]),
            followUpQuestion: null,
          }),
        });
      });
      const subject = service(f, generator);
      const input = {
        conversationId: f.conversationId,
        question: "Buy 10 TEST at 1.25 and sell 10 at 1.50.",
        intent: "prepare_manual_execution_draft" as const,
        idempotencySha256: "1".repeat(64),
        resolveManualEntryDefaults: () => Object.freeze({
          sourceTimezone: "America/New_York",
          tradeCurrency: "USD",
        }),
      };
      const first = await subject.generateSavedAnswer(f.scope, input, now);
      expect(first).toMatchObject({
        state: "completed",
        manualEntryDraft: {
          state: "ready_for_confirmation",
          rows: [
            { sourceTimezone: "America/New_York", tradeCurrency: "USD" },
            { sourceTimezone: "America/New_York", tradeCurrency: "USD" },
          ],
        },
      });
      const second = await subject.generateSavedAnswer(f.scope, {
        ...input,
        resolveManualEntryDefaults: () => {
          throw new Error("defaults must not be read for an idempotent retry");
        },
      }, now);
      expect(second.manualEntryDraft?.draftId).toBe(first.manualEntryDraft?.draftId);
      expect(generator).toHaveBeenCalledTimes(1);
      expect(f.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_manual_entry_drafts`).get())
        .toEqual({ count: 1 });
      const snapshot = f.database.prepare(`SELECT factual_snapshot_json
FROM coach_ai_chat_answer_snapshots`).get() as { factual_snapshot_json: string };
      expect(JSON.parse(snapshot.factual_snapshot_json)).toMatchObject({
        factualToolCalls: [],
        manualEntryExtraction: { state: "ready_for_confirmation" },
      });
    } finally { f.database.close(); }
  });

  it("captures a dispatcher factual snapshot, blocks before generation, and never sends unbounded history", async () => {
    const f = fixture();
    try {
      const generator = vi.fn(async (input: Parameters<CoachAiChatGenerator>[0]) => {
        input.dispatcher.dispatch("factual-1", { contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION, toolName: "summarize_closed_trades", metricIds: ["net_pnl"], moneyBasis: "net" });
        input.dispatcher.dispatch("factual-2", { contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION, toolName: "group_closed_trades", metricIds: ["net_pnl"], grouping: "instrument", moneyBasis: "net" });
        return Object.freeze({ ...answer(), factualToolCalls: input.dispatcher.snapshotsForPersistence(), answer: Object.freeze({ ...answer().answer, evidenceReferences: Object.freeze([{ toolCallId: "factual-1", statement: "The Journal summary was checked." }, { toolCallId: "factual-2", statement: "The Journal grouping was checked." }]) }) });
      });
      const subject = service(f, generator);
      await subject.generateSavedAnswer(f.scope, { conversationId: f.conversationId, question: "Show my results", idempotencySha256: "b".repeat(64) }, now);
      expect(f.database.prepare(`SELECT factual_snapshot_json FROM coach_ai_chat_answer_snapshots`).get()).toEqual(expect.objectContaining({ factual_snapshot_json: expect.stringContaining("factual-1") }));
      f.controls.savePlatformFeatureControl({ featureKey: "ai_chat", enabled: true, dailyRequestCap: 20, dailyTokenCap: 1, dailyEstimatedSpendCapUsd: "10" });
      const secondConversation = f.chat.createConversation(f.scope, "Second", now);
      await expect(subject.generateSavedAnswer(f.scope, { conversationId: secondConversation.conversationId, question: "Another question", idempotencySha256: "c".repeat(64) }, now)).resolves.toMatchObject({ state: "blocked" });
      expect(generator).toHaveBeenCalledTimes(1);
    } finally { f.database.close(); }
  });

  it("finalizes provider failures honestly and rolls back a receipt mismatch", async () => {
    const f = fixture();
    try {
      const noUsage = service(f, async () => { throw new CoachAiChatProviderGenerationError(Object.freeze({ inputTokens: null, outputTokens: null, totalTokens: null })); });
      await expect(noUsage.generateSavedAnswer(f.scope, { conversationId: f.conversationId, question: "Private failure", idempotencySha256: "d".repeat(64) }, now)).resolves.toMatchObject({ state: "failed" });
      const usageConversation = f.chat.createConversation(f.scope, "Usage", now);
      const usage = service(f, async () => { throw new CoachAiChatProviderGenerationError(Object.freeze({ inputTokens: 2, outputTokens: 3, totalTokens: 5 })); });
      await expect(usage.generateSavedAnswer(f.scope, { conversationId: usageConversation.conversationId, question: "Usage failure", idempotencySha256: "e".repeat(64) }, now)).resolves.toMatchObject({ state: "failed" });
      const mismatchConversation = f.chat.createConversation(f.scope, "Mismatch", now);
      const mismatch = service(f, async (input) => Object.freeze({ ...answer(), usage: Object.freeze({ inputTokens: input.attempt.maximumInputTokens + 1, outputTokens: 1, totalTokens: input.attempt.maximumInputTokens + 2 }) }));
      await expect(mismatch.generateSavedAnswer(f.scope, { conversationId: mismatchConversation.conversationId, question: "Mismatch", idempotencySha256: "f".repeat(64) }, now)).rejects.toThrow("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
      expect(f.database.prepare(`SELECT state FROM coach_ai_chat_generation_attempts WHERE idempotency_sha256 = ?`).get("f".repeat(64))).toEqual({ state: "started" });
    } finally { f.database.close(); }
  });

  it("recovers an expired idempotent generation before reporting its saved state", async () => {
    const f = fixture();
    try {
      const oldConversation = f.chat.createConversation(f.scope, "Interrupted", now);
      const pair = f.chat.appendUserMessageAndReserveAssistant(
        f.scope,
        oldConversation.conversationId,
        { originalUserTextPrivate: "Will this recover?" },
        now,
      );
      f.controls.reserveChatGeneration(f.scope, {
        conversationId: oldConversation.conversationId,
        assistantMessageId: pair.assistantMessage.messageId,
        idempotencySha256: "7".repeat(64),
        providerInputText: "bounded provider input",
        maxOutputTokens: 100,
      }, now);
      const generator = vi.fn(async () => answer());
      const subject = service(f, generator);
      const recoveryNow = new Date(now.getTime() + COACH_AI_CHAT_GENERATION_LEASE_MILLISECONDS + 1);
      await expect(subject.generateSavedAnswer(f.scope, {
        conversationId: oldConversation.conversationId,
        question: "Will this recover?",
        idempotencySha256: "7".repeat(64),
      }, recoveryNow)).resolves.toMatchObject({ state: "failed" });
      expect(generator).not.toHaveBeenCalled();
      expect(f.controls.findChatGenerationByIdempotency(f.scope, "7".repeat(64))).toMatchObject({
        state: "failed",
        failureCode: COACH_AI_CHAT_GENERATION_INTERRUPTED_FAILURE_CODE,
      });
    } finally { f.database.close(); }
  });

  it("fails closed for another conversation or account without exposing question text", async () => {
    const f = fixture();
    try {
      const subject = service(f, async () => answer());
      await subject.generateSavedAnswer(f.scope, { conversationId: f.conversationId, question: "Private question", idempotencySha256: "9".repeat(64) }, now);
      const other = f.chat.createConversation(f.scope, "Other", now);
      await expect(subject.generateSavedAnswer(f.scope, { conversationId: other.conversationId, question: "Private question", idempotencySha256: "9".repeat(64) }, now)).rejects.toThrow("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
      const denied = Object.freeze({ ...f.scope, activeAccountId: createCanonicalUuidV4(), allowedAccountIds: Object.freeze([createCanonicalUuidV4()]) });
      try { await subject.generateSavedAnswer(denied, { conversationId: f.conversationId, question: "Secret answer", idempotencySha256: "8".repeat(64) }, now); } catch (error) {
        expect(isTraderLinkPlatformError(error)).toBe(true);
        expect(JSON.stringify(error)).not.toContain("Secret answer");
      }
    } finally { f.database.close(); }
  });
});
