import Database from "better-sqlite3";
import { Buffer } from "node:buffer";
import { describe, expect, it, vi } from "vitest";

import type { CoachAiChatGenerationResult } from "../contracts/ai-chat-contracts";
import { COACH_AI_CHAT_ANSWER_CONTRACT_VERSION } from "../contracts/ai-chat-contracts";
import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from "../contracts/coach-ai-chat-factual-tool-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatProviderGenerationError } from "./coach-ai-chat-openai-adapter";
import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES } from "./coach-ai-chat-factual-tool-dispatcher";
import { CoachAiChatGenerationService, COACH_AI_CHAT_SYSTEM_AND_TOOL_ENVELOPE_RESERVED_BYTES, createCoachAiChatReservationEnvelope, type CoachAiChatGenerator } from "./coach-ai-chat-generation-service";

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
  return { database, scope, chat, controls, conversationId: chat.createConversation(scope, "Private", now).conversationId };
}

function answer(): CoachAiChatGenerationResult {
  return Object.freeze({ answer: Object.freeze({ contractVersion: COACH_AI_CHAT_ANSWER_CONTRACT_VERSION, directAnswer: "Your saved Journal does not have enough facts for that yet.", supportingObservations: Object.freeze(["No closed-trade result was requested."]), limitation: "Ask about a saved trade or date range when you are ready.", nextQuestion: null, evidenceReferences: Object.freeze([]) }), usage: Object.freeze({ inputTokens: 20, outputTokens: 10, totalTokens: 30 }), factualToolCalls: Object.freeze([]) });
}

function service(f: ReturnType<typeof fixture>, generator: CoachAiChatGenerator) {
  const factualTools = { summarizeClosedTrades: vi.fn(() => ({ contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION, toolName: "summarize_closed_trades", result: { state: "unavailable" } })), groupClosedTrades: vi.fn(() => ({ contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION, toolName: "group_closed_trades", result: { state: "unavailable" } })), listClosedTrades: vi.fn() };
  const details = { getClosedTradeDetails: vi.fn() };
  return new CoachAiChatGenerationService(f.chat, f.controls, factualTools as never, details as never, generator);
}

describe("CoachAiChatGenerationService", () => {
  it("persists one bounded, no-tool answer and reuses the exact attempt before and after completion", async () => {
    const f = fixture();
    try {
      const generator = vi.fn(async () => answer()); const subject = service(f, generator);
      const input = { conversationId: f.conversationId, question: "What can you answer?", idempotencySha256: "a".repeat(64) };
      await expect(subject.generateSavedAnswer(f.scope, input, now)).resolves.toMatchObject({ state: "completed" });
      await expect(subject.generateSavedAnswer(f.scope, input, now)).resolves.toMatchObject({ state: "completed" });
      expect(generator).toHaveBeenCalledTimes(1);
      expect(generator.mock.calls[0]?.[0].recentMessages.some((message) =>
        message.originalUserTextPrivate === input.question)).toBe(false);
      expect(f.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_chat_messages`).get()).toEqual({ count: 2 });
    } finally { f.database.close(); }
  });

  it("reserves factual results plus the full two-step system and tool envelope below the provider hard limit", () => {
    const envelope = createCoachAiChatReservationEnvelope("A bounded question", []);
    const bytes = Buffer.byteLength(envelope, "utf8");
    expect(bytes).toBeGreaterThanOrEqual(COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES * 2 + COACH_AI_CHAT_SYSTEM_AND_TOOL_ENVELOPE_RESERVED_BYTES);
    expect(bytes).toBeLessThan(256_000);
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
