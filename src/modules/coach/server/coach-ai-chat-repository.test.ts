import Database from "better-sqlite3";

import type { CoachAiChatGenerationReceiptInput } from "@/src/modules/coach/contracts/ai-chat-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatRepository } from "./coach-ai-chat-repository";

const initialTime = "2026-08-05T12:00:00.000Z";
const laterTime = "2026-08-05T12:01:00.000Z";

type Fixture = Readonly<{
  database: Database.Database;
  repository: CoachAiChatRepository;
  primaryScope: WorkspaceAccessScope;
  secondAccountScope: WorkspaceAccessScope;
  outsideScope: WorkspaceAccessScope;
}>;

function insertAccount(
  database: Database.Database,
  input: Readonly<{ userId: string; workspaceId: string; accountId: string; title: string }>,
): void {
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(input.accountId, input.workspaceId, input.title, input.userId, initialTime, initialTime);
}

function insertUserAndWorkspace(database: Database.Database, userId: string, workspaceId: string, subject: string): void {
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, 'Chat test user', 'active', ?, ?)`)
    .run(userId, subject, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Chat test workspace', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, initialTime, initialTime);
}

function setup(): Fixture {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, {
    manifest: platformMigrationManifest,
    now: () => new Date(initialTime),
  });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const primaryAccountId = createCanonicalUuidV4();
  const secondAccountId = createCanonicalUuidV4();
  const outsideUserId = createCanonicalUuidV4();
  const outsideWorkspaceId = createCanonicalUuidV4();
  const outsideAccountId = createCanonicalUuidV4();
  insertUserAndWorkspace(database, userId, workspaceId, "chat-primary-user");
  insertAccount(database, { userId, workspaceId, accountId: primaryAccountId, title: "Primary" });
  insertAccount(database, { userId, workspaceId, accountId: secondAccountId, title: "Second" });
  insertUserAndWorkspace(database, outsideUserId, outsideWorkspaceId, "chat-outside-user");
  insertAccount(database, {
    userId: outsideUserId,
    workspaceId: outsideWorkspaceId,
    accountId: outsideAccountId,
    title: "Outside",
  });
  const primaryScope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([primaryAccountId, secondAccountId]),
    activeAccountId: primaryAccountId,
  });
  return Object.freeze({
    database,
    repository: new CoachAiChatRepository(database),
    primaryScope,
    secondAccountScope: Object.freeze({ ...primaryScope, activeAccountId: secondAccountId }),
    outsideScope: Object.freeze({
      userId: outsideUserId,
      workspaceId: outsideWorkspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: Object.freeze([outsideAccountId]),
      activeAccountId: outsideAccountId,
    }),
  });
}

function receipt(): CoachAiChatGenerationReceiptInput {
  return Object.freeze({
    providerKey: "openai_direct",
    modelId: "gpt-test",
    usage: Object.freeze({ inputTokens: 10, outputTokens: 5, totalTokens: 15 }),
    inputCostUsdPerMillionTokens: "1.5",
    outputCostUsdPerMillionTokens: "2",
  });
}

function expectPrivateFailure(action: () => unknown, secret: string): void {
  try {
    action();
    throw new Error("expected domain error");
  } catch (error) {
    expect(isTraderLinkPlatformError(error)).toBe(true);
    if (isTraderLinkPlatformError(error)) {
      expect(error.message).not.toContain(secret);
      expect(JSON.stringify(error.safeContext)).not.toContain(secret);
    }
  }
}

describe("Coach AI Chat repository", () => {
  it("requires the verified user, workspace, active membership, and selected account on every operation", () => {
    const fixture = setup();
    try {
      const conversation = fixture.repository.createConversation(fixture.primaryScope, "Private notes", new Date(initialTime));
      expectPrivateFailure(
        () => fixture.repository.readConversation(fixture.secondAccountScope, conversation.conversationId),
        conversation.conversationId,
      );
      expectPrivateFailure(
        () => fixture.repository.readConversation(fixture.outsideScope, conversation.conversationId),
        conversation.conversationId,
      );
      fixture.database.prepare(`UPDATE platform_workspace_memberships SET status = 'suspended'
WHERE workspace_id = ? AND user_id = ?`).run(
        fixture.primaryScope.workspaceId, fixture.primaryScope.userId,
      );
      expectPrivateFailure(
        () => fixture.repository.listConversations(fixture.primaryScope, { state: "active" }),
        fixture.primaryScope.activeAccountId ?? "",
      );
    } finally {
      fixture.database.close();
    }
  });

  it("atomically appends an ordered user message and one pending assistant reservation", () => {
    const fixture = setup();
    try {
      const conversation = fixture.repository.createConversation(fixture.primaryScope, "August questions", new Date(initialTime));
      const reserved = fixture.repository.appendUserMessageAndReserveAssistant(
        fixture.primaryScope,
        conversation.conversationId,
        {
          originalUserTextPrivate: "How did I record this week?",
          normalizedUserTextPrivate: "How did I record this week?",
          structuredInterpretation: { intent: "summarize_performance" },
        },
        new Date(laterTime),
      );
      expect([reserved.userMessage.sequence, reserved.assistantMessage.sequence]).toEqual([1, 2]);
      expect(reserved.assistantMessage.generationState).toBe("pending");
      expectPrivateFailure(
        () => fixture.repository.appendUserMessageAndReserveAssistant(
          fixture.primaryScope,
          conversation.conversationId,
          { originalUserTextPrivate: "A private second question" },
          new Date("2026-08-05T12:02:00.000Z"),
        ),
        "A private second question",
      );
      fixture.repository.finalizeAssistantFailure(
        fixture.primaryScope,
        reserved.assistantMessage.messageId,
        "TRADERLINK_COACH_PROVIDER_UNAVAILABLE",
        null,
        new Date("2026-08-05T12:03:00.000Z"),
      );
      const next = fixture.repository.appendUserMessageAndReserveAssistant(
        fixture.primaryScope,
        conversation.conversationId,
        { originalUserTextPrivate: "What about yesterday?" },
        new Date("2026-08-05T12:04:00.000Z"),
      );
      expect([next.userMessage.sequence, next.assistantMessage.sequence]).toEqual([3, 4]);
    } finally {
      fixture.database.close();
    }
  });

  it("finalizes a successful generation with its immutable snapshot and receipt in one transaction", () => {
    const fixture = setup();
    try {
      const conversation = fixture.repository.createConversation(fixture.primaryScope, "Weekly review", new Date(initialTime));
      const reserved = fixture.repository.appendUserMessageAndReserveAssistant(
        fixture.primaryScope, conversation.conversationId,
        { originalUserTextPrivate: "Summarize my results." }, new Date(laterTime),
      );
      const completed = fixture.repository.finalizeAssistantSuccess(
        fixture.primaryScope,
        reserved.assistantMessage.messageId,
        {
          assistantTextPrivate: "Your eligible result is available.",
          snapshotContractVersion: "traderlink_coach_ai_chat_snapshot_v1",
          factualSnapshot: { coverage: "available", closedTradeCount: 3 },
          receipt: receipt(),
        },
        new Date("2026-08-05T12:02:00.000Z"),
      );
      expect(completed.message.generationState).toBe("completed");
      expect(completed.receipt.estimatedCostUsd).toBe("0.000025");
      expect(fixture.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_chat_answer_snapshots
WHERE coach_ai_chat_message_id = ?`).get(reserved.assistantMessage.messageId)).toEqual({ count: 1 });
      expect(fixture.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_chat_generation_receipts
WHERE coach_ai_chat_message_id = ?`).get(reserved.assistantMessage.messageId)).toEqual({ count: 1 });
      expect(() => fixture.repository.finalizeAssistantSuccess(
        fixture.primaryScope,
        reserved.assistantMessage.messageId,
        {
          assistantTextPrivate: "A rewritten private answer",
          snapshotContractVersion: "traderlink_coach_ai_chat_snapshot_v1",
          factualSnapshot: { coverage: "available" },
          receipt: receipt(),
        },
      )).toThrow("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
    } finally {
      fixture.database.close();
    }
  });

  it("persists a safe failed generation without inventing a snapshot or usage receipt", () => {
    const fixture = setup();
    try {
      const conversation = fixture.repository.createConversation(fixture.primaryScope, "Failed answer", new Date(initialTime));
      const reserved = fixture.repository.appendUserMessageAndReserveAssistant(
        fixture.primaryScope, conversation.conversationId,
        { originalUserTextPrivate: "A private provider question" }, new Date(laterTime),
      );
      const failed = fixture.repository.finalizeAssistantFailure(
        fixture.primaryScope,
        reserved.assistantMessage.messageId,
        "TRADERLINK_COACH_PROVIDER_UNAVAILABLE",
        null,
        new Date("2026-08-05T12:02:00.000Z"),
      );
      expect(failed.message).toMatchObject({ generationState: "failed", assistantTextPrivate: null });
      expect(failed.receipt).toBeNull();
      expect(fixture.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_chat_answer_snapshots
WHERE coach_ai_chat_message_id = ?`).get(reserved.assistantMessage.messageId)).toEqual({ count: 0 });
      expect(fixture.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_chat_generation_receipts
WHERE coach_ai_chat_message_id = ?`).get(reserved.assistantMessage.messageId)).toEqual({ count: 0 });
    } finally {
      fixture.database.close();
    }
  });

  it("archives and restores without deleting the conversation or archive evidence", () => {
    const fixture = setup();
    try {
      const conversation = fixture.repository.createConversation(fixture.primaryScope, "Keep this history", new Date(initialTime));
      const archived = fixture.repository.archiveConversation(fixture.primaryScope, conversation.conversationId, new Date(laterTime));
      expect(archived).toMatchObject({ state: "archived", archivedAtUtc: laterTime });
      expect(() => fixture.repository.renameConversation(fixture.primaryScope, conversation.conversationId, "Changed"))
        .toThrow("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      const restored = fixture.repository.restoreConversation(
        fixture.primaryScope, conversation.conversationId, new Date("2026-08-05T12:02:00.000Z"),
      );
      expect(restored).toMatchObject({ state: "active", archivedAtUtc: null });
      expect(fixture.database.prepare(`SELECT event_kind FROM coach_ai_archive_events
WHERE coach_ai_chat_conversation_id = ? ORDER BY occurred_at_utc`).all(conversation.conversationId))
        .toEqual([{ event_kind: "archive" }, { event_kind: "restore" }]);
    } finally {
      fixture.database.close();
    }
  });

  it("uses stable tuple pagination and keeps private validation errors out of domain errors", () => {
    const fixture = setup();
    try {
      const first = fixture.repository.createConversation(fixture.primaryScope, "First", new Date("2026-08-05T12:01:00.000Z"));
      const second = fixture.repository.createConversation(fixture.primaryScope, "Second", new Date("2026-08-05T12:02:00.000Z"));
      const third = fixture.repository.createConversation(fixture.primaryScope, "Third", new Date("2026-08-05T12:03:00.000Z"));
      const pageOne = fixture.repository.listConversations(fixture.primaryScope, { state: "active", limit: 2 });
      expect(pageOne.conversations.map((item) => item.conversationId)).toEqual([third.conversationId, second.conversationId]);
      expect(pageOne.nextCursor).not.toBeNull();
      const pageTwo = fixture.repository.listConversations(fixture.primaryScope, {
        state: "active", limit: 2, cursor: pageOne.nextCursor,
      });
      expect(pageTwo.conversations.map((item) => item.conversationId)).toEqual([first.conversationId]);
      expect(pageTwo.nextCursor).toBeNull();
      expectPrivateFailure(
        () => fixture.repository.appendUserMessageAndReserveAssistant(
          fixture.primaryScope,
          first.conversationId,
          { originalUserTextPrivate: "secret private question should not be logged".repeat(200) },
        ),
        "secret private question should not be logged",
      );
    } finally {
      fixture.database.close();
    }
  });

  it("keeps conversation metadata separate from bounded newest-first message pages", () => {
    const fixture = setup();
    try {
      const conversation = fixture.repository.createConversation(fixture.primaryScope, "Long private history", new Date(initialTime));
      for (let index = 0; index < 4; index += 1) {
        const reserved = fixture.repository.appendUserMessageAndReserveAssistant(
          fixture.primaryScope,
          conversation.conversationId,
          { originalUserTextPrivate: `Question ${index + 1}` },
          new Date(`2026-08-05T12:0${index + 1}:00.000Z`),
        );
        fixture.repository.finalizeAssistantFailure(
          fixture.primaryScope,
          reserved.assistantMessage.messageId,
          "TRADERLINK_COACH_PROVIDER_UNAVAILABLE",
          null,
          new Date(`2026-08-05T12:1${index}:00.000Z`),
        );
      }
      expect(fixture.repository.readConversation(fixture.primaryScope, conversation.conversationId))
        .toMatchObject({ conversationId: conversation.conversationId, title: "Long private history" });
      const newestPage = fixture.repository.listMessages(fixture.primaryScope, conversation.conversationId, { limit: 3 });
      expect(newestPage.messages.map((message) => message.sequence)).toEqual([6, 7, 8]);
      expect(newestPage.nextCursor).toEqual({ beforeSequence: 6 });
      const olderPage = fixture.repository.listMessages(fixture.primaryScope, conversation.conversationId, {
        limit: 3,
        cursor: newestPage.nextCursor,
      });
      expect(olderPage.messages.map((message) => message.sequence)).toEqual([3, 4, 5]);
      expect(olderPage.nextCursor).toEqual({ beforeSequence: 3 });
      const firstPage = fixture.repository.listMessages(fixture.primaryScope, conversation.conversationId, {
        limit: 3,
        cursor: olderPage.nextCursor,
      });
      expect(firstPage.messages.map((message) => message.sequence)).toEqual([1, 2]);
      expect(firstPage.nextCursor).toBeNull();
    } finally {
      fixture.database.close();
    }
  });
});
