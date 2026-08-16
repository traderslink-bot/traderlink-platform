import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";
import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import {
  CoachAiChatGenerationRecoveryService,
  COACH_AI_CHAT_GENERATION_INTERRUPTED_FAILURE_CODE,
  COACH_AI_CHAT_GENERATION_LEASE_MILLISECONDS,
} from "./coach-ai-chat-generation-recovery-service";

const base = new Date("2026-08-05T12:00:00.000Z");

function scopeFixture(database: Database.Database): WorkspaceAccessScope {
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const timestamp = base.toISOString();
  database.prepare(`INSERT INTO platform_users VALUES (?, 'development_local', ?, 'Test', 'active', ?, ?)`)
    .run(userId, `test-${userId}`, timestamp, timestamp);
  database.prepare(`INSERT INTO platform_workspaces VALUES (?, 'Test', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, timestamp, timestamp);
  database.prepare(`INSERT INTO platform_workspace_memberships VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, timestamp, timestamp);
  database.prepare(`INSERT INTO journal_accounts VALUES (?, ?, 'Test', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, timestamp, timestamp);
  return Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
}

function fixture() {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => base });
  const scope = scopeFixture(database);
  const chat = new CoachAiChatRepository(database);
  const controls = new CoachAiChatProviderControlsRepository(database);
  controls.saveChatSettings({ modelId: "gpt-chat-test", inputCostUsdPerMillionTokens: "1", cachedInputCostUsdPerMillionTokens: "0.1", cacheWriteInputCostUsdPerMillionTokens: "1.25", outputCostUsdPerMillionTokens: "2" }, base);
  controls.savePlatformFeatureControl({ featureKey: "ai_chat", enabled: true, dailyRequestCap: 20, dailyTokenCap: 100_000, dailyEstimatedSpendCapUsd: "10" }, base);
  controls.saveAccountFeatureControl(scope, { featureKey: "ai_chat", enabled: true, dailyRequestCap: 20, dailyTokenCap: 100_000, dailyEstimatedSpendCapUsd: "10" }, base);
  return { database, scope, chat, controls, recovery: new CoachAiChatGenerationRecoveryService(chat, controls) };
}

function reserve(
  fixtureValue: ReturnType<typeof fixture>,
  digest: string,
  now = base,
) {
  const conversation = fixtureValue.chat.createConversation(fixtureValue.scope, `Conversation ${digest.slice(0, 2)}`, now);
  const pair = fixtureValue.chat.appendUserMessageAndReserveAssistant(
    fixtureValue.scope,
    conversation.conversationId,
    { originalUserTextPrivate: "A private question" },
    now,
  );
  const reservation = fixtureValue.controls.reserveChatGeneration(fixtureValue.scope, {
    conversationId: conversation.conversationId,
    assistantMessageId: pair.assistantMessage.messageId,
    idempotencySha256: digest,
    providerInputText: "bounded provider input",
    maxOutputTokens: 100,
  }, now);
  return { conversation, pair, reservation };
}

describe("CoachAiChatGenerationRecoveryService", () => {
  it("finalizes only lease-expired pending attempts and their paired assistant messages", () => {
    const f = fixture();
    try {
      const stale = reserve(f, "a".repeat(64));
      const untouched = reserve(f, "b".repeat(64));
      const recoveryNow = new Date(base.getTime() + COACH_AI_CHAT_GENERATION_LEASE_MILLISECONDS + 1);

      expect(f.recovery.reconcile(f.scope, { conversationId: stale.conversation.conversationId }, recoveryNow)).toBe(1);
      expect(f.controls.findChatGenerationByIdempotency(f.scope, "a".repeat(64))).toMatchObject({
        state: "failed",
        failureCode: COACH_AI_CHAT_GENERATION_INTERRUPTED_FAILURE_CODE,
        reservedAtUtc: base.toISOString(),
        finalizedAtUtc: recoveryNow.toISOString(),
      });
      expect(f.chat.readGenerationPair(f.scope, stale.conversation.conversationId, stale.pair.assistantMessage.messageId)
        .assistantMessage).toMatchObject({
        generationState: "failed",
        failureCode: COACH_AI_CHAT_GENERATION_INTERRUPTED_FAILURE_CODE,
      });
      expect(f.controls.findChatGenerationByIdempotency(f.scope, "b".repeat(64)))
        .toMatchObject({ state: "reserved", finalizedAtUtc: null });
      expect(untouched.reservation.attempt.startedAtUtc).toBeNull();
    } finally {
      f.database.close();
    }
  });

  it("keeps a fresh started request pending and uses only the selected account scope", () => {
    const f = fixture();
    try {
      const freshTime = new Date(base.getTime() + COACH_AI_CHAT_GENERATION_LEASE_MILLISECONDS - 1_000);
      const fresh = reserve(f, "c".repeat(64), freshTime);
      f.controls.markProviderStarted(f.scope, fresh.reservation.attempt.attemptId, freshTime);
      const recoveryNow = new Date(base.getTime() + COACH_AI_CHAT_GENERATION_LEASE_MILLISECONDS);
      expect(f.recovery.reconcile(f.scope, { conversationId: fresh.conversation.conversationId }, recoveryNow)).toBe(0);
      expect(f.controls.findChatGenerationByIdempotency(f.scope, "c".repeat(64))).toMatchObject({
        state: "started",
        startedAtUtc: freshTime.toISOString(),
        finalizedAtUtc: null,
      });
      const otherScope = Object.freeze({
        ...f.scope,
        userId: createCanonicalUuidV4(),
        workspaceId: createCanonicalUuidV4(),
        allowedAccountIds: Object.freeze([createCanonicalUuidV4()]),
        activeAccountId: createCanonicalUuidV4(),
      });
      expect(() => f.recovery.reconcile(otherScope, { conversationId: fresh.conversation.conversationId }, recoveryNow))
        .toThrow("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    } finally {
      f.database.close();
    }
  }, 15_000);
});
