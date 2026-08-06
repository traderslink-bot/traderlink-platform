import { Buffer } from "node:buffer";

import Database from "better-sqlite3";

import { CoachAiProviderSettingsRepository } from "@/src/modules/coach/server/coach-ai-provider-settings-repository";
import { CoachAiChatRepository } from "@/src/modules/coach/server/coach-ai-chat-repository";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatProviderControlsRepository } from "./coach-ai-chat-provider-controls-repository";

const initialTime = "2026-08-05T12:00:00.000Z";

type Fixture = Readonly<{
  database: Database.Database;
  chat: CoachAiChatRepository;
  controls: CoachAiChatProviderControlsRepository;
  scope: WorkspaceAccessScope;
  otherScope: WorkspaceAccessScope;
  sharedScope: WorkspaceAccessScope;
}>;

function insertScope(database: Database.Database): WorkspaceAccessScope {
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc)
VALUES (?, 'development_local', ?, 'Test user', 'active', ?, ?)`).run(userId, `test-${userId}`, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspaces (workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc)
VALUES (?, 'Test', 'America/New_York', 'active', ?, ?)`).run(workspaceId, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspace_memberships (workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc)
VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(workspaceId, userId, userId, initialTime, initialTime);
  database.prepare(`INSERT INTO journal_accounts (account_id, workspace_id, display_name, base_currency, trading_timezone, status, created_by_user_id, created_at_utc, updated_at_utc)
VALUES (?, ?, 'Test', 'USD', 'America/New_York', 'active', ?, ?, ?)`).run(accountId, workspaceId, userId, initialTime, initialTime);
  return Object.freeze({ userId, workspaceId, workspaceRole: "owner" as const, allowedAccountIds: Object.freeze([accountId]), activeAccountId: accountId });
}

function setup(): Fixture {
  const database = new Database(":memory:"); database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => new Date(initialTime) });
  const scope = insertScope(database);
  const sharedUserId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc)
VALUES (?, 'development_local', ?, 'Shared user', 'active', ?, ?)`).run(sharedUserId, `shared-${sharedUserId}`, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspace_memberships (workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc)
VALUES (?, ?, 'member', 'active', ?, ?, ?)`).run(scope.workspaceId, sharedUserId, scope.userId, initialTime, initialTime);
  const sharedScope = Object.freeze({ userId: sharedUserId, workspaceId: scope.workspaceId, workspaceRole: "member" as const, allowedAccountIds: scope.allowedAccountIds, activeAccountId: scope.activeAccountId });
  return Object.freeze({ database, chat: new CoachAiChatRepository(database), controls: new CoachAiChatProviderControlsRepository(database), scope, otherScope: insertScope(database), sharedScope });
}

function configure(fixture: Fixture, input: Readonly<{ platformRequests?: number; accountRequests?: number; platformTokens?: number; accountTokens?: number }> = {}): void {
  fixture.controls.saveChatSettings({ modelId: "gpt-chat-a", inputCostUsdPerMillionTokens: "1", outputCostUsdPerMillionTokens: "2" });
  fixture.controls.savePlatformFeatureControl({ featureKey: "ai_chat", enabled: true, dailyRequestCap: input.platformRequests ?? 20, dailyTokenCap: input.platformTokens ?? 10_000, dailyEstimatedSpendCapUsd: "10" });
  fixture.controls.saveAccountFeatureControl(fixture.scope, { featureKey: "ai_chat", enabled: true, dailyRequestCap: input.accountRequests ?? 20, dailyTokenCap: input.accountTokens ?? 10_000, dailyEstimatedSpendCapUsd: "10" });
}

function assistantReservation(fixture: Fixture, scope = fixture.scope): Readonly<{ conversationId: string; assistantMessageId: string }> {
  const conversation = fixture.chat.createConversation(scope, "Private conversation", new Date(initialTime));
  const reserved = fixture.chat.appendUserMessageAndReserveAssistant(scope, conversation.conversationId, { originalUserTextPrivate: "A private question" }, new Date(initialTime));
  return Object.freeze({ conversationId: conversation.conversationId, assistantMessageId: reserved.assistantMessage.messageId });
}

function reservationInput(reservation: Readonly<{ conversationId: string; assistantMessageId: string }>, digest = "a".repeat(64), providerInputText = "System instructions\nBounded conversation context\nTool definitions and results\nA private question"): Readonly<{ conversationId: string; assistantMessageId: string; idempotencySha256: string; providerInputText: string; maxOutputTokens: number }> {
  return Object.freeze({ ...reservation, idempotencySha256: digest, providerInputText, maxOutputTokens: 100 });
}

describe("Coach AI Chat provider controls repository", () => {
  it("starts disabled, copies no invented pricing, and rejects enablement without complete caps and prices", () => {
    const fixture = setup();
    try {
      expect(fixture.controls.readChatSettings()).toMatchObject({ modelId: "gpt-5.6-sol", inputCostUsdPerMillionTokens: null });
      expect(fixture.controls.readFeatureControls(fixture.scope).filter((item) => item.scopeKind === "platform").map((item) => [item.featureKey, item.enabled])).toEqual([
        ["ai_chat", false], ["daily_companion", false], ["monthly_reviews", false], ["weekly_reviews", false],
      ]);
      expect(() => fixture.controls.savePlatformFeatureControl({ featureKey: "ai_chat", enabled: true, dailyRequestCap: 1, dailyTokenCap: 1, dailyEstimatedSpendCapUsd: "1" })).toThrow("coach_ai_feature_control_transition_invalid");
      fixture.controls.saveChatSettings({ modelId: "gpt-chat-a", inputCostUsdPerMillionTokens: "1", outputCostUsdPerMillionTokens: "2" });
      expect(() => fixture.controls.savePlatformFeatureControl({ featureKey: "ai_chat", enabled: true, dailyRequestCap: null, dailyTokenCap: null, dailyEstimatedSpendCapUsd: null })).toThrow("coach_ai_feature_control_transition_invalid");
    } finally { fixture.database.close(); }
  });

  it("atomically applies the tighter account and platform Eastern-day caps and records a blocked request without provider start", () => {
    const fixture = setup();
    try {
      configure(fixture, { platformRequests: 1, accountRequests: 2 });
      const first = fixture.controls.reserveChatGeneration(fixture.scope, reservationInput(assistantReservation(fixture), "b".repeat(64)));
      expect(first.state).toBe("reserved");
      fixture.controls.saveAccountFeatureControl(fixture.otherScope, { featureKey: "ai_chat", enabled: true, dailyRequestCap: 2, dailyTokenCap: 10_000, dailyEstimatedSpendCapUsd: "10" });
      const blocked = fixture.controls.reserveChatGeneration(fixture.otherScope, reservationInput(assistantReservation(fixture, fixture.otherScope), "c".repeat(64)));
      expect(blocked).toMatchObject({ state: "blocked", attempt: { state: "blocked" } });
      expect(fixture.database.prepare(`SELECT started_at_utc FROM coach_ai_chat_generation_attempts WHERE coach_ai_chat_generation_attempt_id = ?`).get(blocked.attempt.attemptId)).toEqual({ started_at_utc: null });
    } finally { fixture.database.close(); }
  });

  it("uses the complete provider envelope, handles Eastern DST rollover, and fails closed on idempotency reuse for another message", () => {
    const fixture = setup();
    try {
      configure(fixture, { platformRequests: 1, accountRequests: 1 });
      const firstInput = reservationInput(assistantReservation(fixture), "d".repeat(64));
      const first = fixture.controls.reserveChatGeneration(fixture.scope, firstInput, new Date("2026-03-08T04:59:59.000Z"));
      expect(first.state).toBe("reserved");
      const second = fixture.controls.reserveChatGeneration(fixture.scope, reservationInput(assistantReservation(fixture), "e".repeat(64)), new Date("2026-03-08T05:00:00.000Z"));
      expect(second.state).toBe("reserved");
      const repeated = fixture.controls.reserveChatGeneration(fixture.scope, firstInput);
      expect(repeated).toMatchObject({ state: "idempotent", attempt: { attemptId: first.attempt.attemptId } });
      const differentMessage = reservationInput(assistantReservation(fixture), "d".repeat(64), "x".repeat(5_000));
      expect(() => fixture.controls.reserveChatGeneration(fixture.scope, differentMessage)).toThrow("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
      expect(first.attempt.maximumInputTokens).toBe(Buffer.byteLength(firstInput.providerInputText, "utf8"));
    } finally { fixture.database.close(); }
  });

  it("shares one account control across active workspace members", () => {
    const fixture = setup();
    try {
      configure(fixture);
      const fromSharedMember = fixture.controls.readFeatureControls(fixture.sharedScope)
        .find((item) => item.featureKey === "ai_chat" && item.scopeKind === "account");
      expect(fromSharedMember).toMatchObject({ enabled: true, caps: { dailyRequestCap: 20, dailyTokenCap: 10_000, dailyEstimatedSpendCapUsd: "10" } });
    } finally { fixture.database.close(); }
  });

  it("keeps a reservation's provider snapshot after later settings edits and replaces it with actual receipt usage", () => {
    const fixture = setup();
    try {
      configure(fixture, { platformTokens: 250, accountTokens: 250 });
      const chat = assistantReservation(fixture);
      const reserved = fixture.controls.reserveChatGeneration(fixture.scope, reservationInput(chat, "f".repeat(64)));
      fixture.controls.saveChatSettings({ modelId: "gpt-chat-b", inputCostUsdPerMillionTokens: "3", outputCostUsdPerMillionTokens: "4" });
      expect(reserved.attempt).toMatchObject({
        providerKey: "openai_direct",
        modelId: "gpt-chat-a",
        inputCostUsdPerMillionTokens: "1",
        outputCostUsdPerMillionTokens: "2",
      });
      expect(fixture.database.prepare(`SELECT model_id, input_cost_usd_per_million_tokens FROM coach_ai_chat_generation_attempts WHERE coach_ai_chat_generation_attempt_id = ?`).get(reserved.attempt.attemptId)).toEqual({ model_id: "gpt-chat-a", input_cost_usd_per_million_tokens: "1" });
      fixture.controls.markProviderStarted(fixture.scope, reserved.attempt.attemptId);
      fixture.chat.finalizeAssistantSuccess(fixture.scope, chat.assistantMessageId, { assistantTextPrivate: "Safe answer", snapshotContractVersion: "v1", factualSnapshot: { coverage: "available" }, receipt: { providerKey: "openai_direct", modelId: "gpt-chat-a", usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 }, inputCostUsdPerMillionTokens: "1", outputCostUsdPerMillionTokens: "2" } });
      fixture.controls.finalizeFromChatReceipt(fixture.scope, reserved.attempt.attemptId, "completed", null);
      expect(fixture.controls.reserveChatGeneration(
        fixture.scope,
        reservationInput(assistantReservation(fixture), "1".repeat(64)),
      )).toMatchObject({ state: "reserved" });
      expect(new CoachAiProviderSettingsRepository(fixture.database).readCostAggregation()).toEqual(expect.arrayContaining([expect.objectContaining({ featureKey: "ai_chat", modelId: "gpt-chat-a", totalTokens: 3, estimatedCostUsd: "0.000005" })]));
    } finally { fixture.database.close(); }
  });

  it("retains a provider-started failure's conservative reservation and never leaks private inputs or cross-account records", () => {
    const fixture = setup();
    try {
      configure(fixture, { platformTokens: 250, accountTokens: 250 });
      const reserved = fixture.controls.reserveChatGeneration(fixture.scope, reservationInput(assistantReservation(fixture), "2".repeat(64)));
      fixture.controls.markProviderStarted(fixture.scope, reserved.attempt.attemptId);
      fixture.controls.failStartedWithoutUsage(fixture.scope, reserved.attempt.attemptId, "TRADERLINK_COACH_PROVIDER_FAILED");
      expect(fixture.controls.reserveChatGeneration(
        fixture.scope,
        reservationInput(assistantReservation(fixture), "3".repeat(64)),
      )).toMatchObject({ state: "blocked" });
      try {
        fixture.controls.markProviderStarted(fixture.otherScope, reserved.attempt.attemptId);
        throw new Error("expected access failure");
      } catch (error) {
        expect(isTraderLinkPlatformError(error)).toBe(true);
        if (isTraderLinkPlatformError(error)) expect(JSON.stringify(error.safeContext)).not.toContain("A private question");
      }
    } finally { fixture.database.close(); }
  });

  it("fails closed when a Chat receipt exceeds the immutable reservation", () => {
    const fixture = setup();
    try {
      configure(fixture);
      const chat = assistantReservation(fixture);
      const reserved = fixture.controls.reserveChatGeneration(fixture.scope, reservationInput(chat, "4".repeat(64), "full provider envelope"));
      fixture.controls.markProviderStarted(fixture.scope, reserved.attempt.attemptId);
      fixture.chat.finalizeAssistantSuccess(fixture.scope, chat.assistantMessageId, { assistantTextPrivate: "Safe answer", snapshotContractVersion: "v1", factualSnapshot: { coverage: "available" }, receipt: { providerKey: "openai_direct", modelId: "gpt-chat-a", usage: { inputTokens: reserved.attempt.maximumInputTokens + 1, outputTokens: 2, totalTokens: reserved.attempt.maximumInputTokens + 3 }, inputCostUsdPerMillionTokens: "1", outputCostUsdPerMillionTokens: "2" } });
      expect(() => fixture.controls.finalizeFromChatReceipt(fixture.scope, reserved.attempt.attemptId, "completed", null)).toThrow("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
      expect(fixture.database.prepare(`SELECT state, actual_total_tokens FROM coach_ai_chat_generation_attempts WHERE coach_ai_chat_generation_attempt_id = ?`).get(reserved.attempt.attemptId)).toEqual({ state: "started", actual_total_tokens: null });
    } finally { fixture.database.close(); }
  });
});
