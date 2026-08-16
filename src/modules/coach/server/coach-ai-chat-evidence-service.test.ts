import { createHash } from "node:crypto";

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import { CoachAiChatEvidenceService } from "./coach-ai-chat-evidence-service";

const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000003"]),
  activeAccountId: "00000000-0000-4000-8000-000000000003",
});
const conversationId = "00000000-0000-4000-8000-000000000010";
const assistantMessageId = "00000000-0000-4000-8000-000000000011";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

function snapshotHash(value: unknown): string {
  return createHash("sha256")
    .update(`${JSON.stringify(canonicalize(value))}\n`, "utf8")
    .digest("hex");
}

function fixture() {
  const database = new Database(":memory:");
  database.exec(`CREATE TABLE coach_ai_chat_conversations (
    coach_ai_chat_conversation_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    account_id TEXT NOT NULL
  );
  CREATE TABLE coach_ai_chat_messages (
    coach_ai_chat_message_id TEXT PRIMARY KEY,
    coach_ai_chat_conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    role TEXT NOT NULL,
    generation_state TEXT NOT NULL
  );
  CREATE TABLE coach_ai_chat_answer_snapshots (
    coach_ai_chat_message_id TEXT PRIMARY KEY,
    coach_ai_chat_conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    factual_snapshot_json TEXT NOT NULL,
    factual_snapshot_sha256 TEXT NOT NULL
  );`);
  database.prepare(`INSERT INTO coach_ai_chat_conversations VALUES (?, ?, ?, ?)`)
    .run(conversationId, scope.userId, scope.workspaceId, scope.activeAccountId);
  database.prepare(`INSERT INTO coach_ai_chat_messages VALUES (?, ?, ?, ?, ?, 'assistant', 'completed')`)
    .run(assistantMessageId, conversationId, scope.userId, scope.workspaceId, scope.activeAccountId);
  return database;
}

function saveSnapshot(database: Database.Database, value: unknown, options: Readonly<{
  messageId?: string;
  accountId?: string;
  sha256?: string;
  conversationId?: string;
}> = Object.freeze({})) {
  const messageId = options.messageId ?? assistantMessageId;
  const accountId = options.accountId ?? scope.activeAccountId!;
  const snapshotConversationId = options.conversationId ?? conversationId;
  if (messageId !== assistantMessageId) {
    database.prepare(`INSERT INTO coach_ai_chat_messages VALUES (?, ?, ?, ?, ?, 'assistant', 'completed')`)
      .run(messageId, snapshotConversationId, scope.userId, scope.workspaceId, accountId);
  }
  database.prepare(`INSERT INTO coach_ai_chat_answer_snapshots VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(
      messageId,
      snapshotConversationId,
      scope.userId,
      scope.workspaceId,
      accountId,
      JSON.stringify(value),
      options.sha256 ?? snapshotHash(value),
    );
}

function factualSnapshot(calls: readonly unknown[], references: readonly unknown[]) {
  return Object.freeze({
    answer: Object.freeze({ evidenceReferences: references }),
    factualToolCalls: calls,
  });
}

describe("CoachAiChatEvidenceService", () => {
  it("returns a compact account-scoped Analyzer card without leaking snapshot fields", () => {
    const database = fixture();
    try {
      const snapshot = factualSnapshot(
        [Object.freeze({
          toolCallId: "factual-1",
          toolName: "get_trade_analyzer_results",
          result: Object.freeze({ link: "https://untrusted.example/", analysis: Object.freeze({ analyzedTradeCount: 4 }) }),
        })],
        [Object.freeze({ toolCallId: "factual-1", statement: "Four saved day trades were included in this answer." })],
      );
      saveSnapshot(database, snapshot);

      const result = new CoachAiChatEvidenceService(database)
        .readForMessages(scope, conversationId, [assistantMessageId]);

      expect(result).toEqual([{
        messageId: assistantMessageId,
        cards: [{
          title: "Trade Analyzer",
          href: "/analytics/trade-analyzer/day",
          linkLabel: "Open Trade Analyzer",
        }],
      }]);
      expect(JSON.stringify(result)).not.toContain("factual-1");
      expect(JSON.stringify(result)).not.toContain("untrusted.example");
    } finally {
      database.close();
    }
  });

  it("ignores malformed, unknown, mismatched, and excess evidence references", () => {
    const database = fixture();
    try {
      const calls = Array.from({ length: 6 }, (_, index) => Object.freeze({
        toolCallId: `factual-${index + 1}`,
        toolName: "get_timing_analytics",
        result: Object.freeze({ state: "ready" }),
      }));
      const snapshot = factualSnapshot([
        ...calls,
        Object.freeze({ toolCallId: "unknown-tool", toolName: "open_external", result: Object.freeze({ href: "https://untrusted.example/" }) }),
      ], [
        ...calls.map((call, index) => Object.freeze({
          toolCallId: call.toolCallId,
          statement: `Timing evidence ${index + 1}`,
        })),
        Object.freeze({ toolCallId: "unknown-call", statement: "Do not show this." }),
        Object.freeze({ toolCallId: "unknown-tool", statement: "Do not show this either." }),
        Object.freeze({ toolCallId: "factual-2", statement: "Do not show 00000000-0000-4000-8000-000000000099." }),
        Object.freeze({ toolCallId: "factual-1", statement: "A duplicate is ignored." }),
      ]);
      saveSnapshot(database, snapshot);

      const result = new CoachAiChatEvidenceService(database)
        .readForMessages(scope, conversationId, [assistantMessageId]);

      expect(result[0]?.cards).toHaveLength(4);
      expect(result[0]?.cards.map((card) => card.title)).toEqual([
        "Timing", "Timing", "Timing", "Timing",
      ]);
    } finally {
      database.close();
    }
  });

  it("does not return a snapshot with a wrong account, conversation, or integrity hash", () => {
    const database = fixture();
    try {
      const snapshot = factualSnapshot(
        [Object.freeze({ toolCallId: "factual-1", toolName: "get_workspace_summary", result: Object.freeze({}) })],
        [Object.freeze({ toolCallId: "factual-1", statement: "Workspace evidence." })],
      );
      saveSnapshot(database, snapshot, { sha256: "0".repeat(64) });
      const otherMessageId = "00000000-0000-4000-8000-000000000012";
      saveSnapshot(database, snapshot, {
        messageId: otherMessageId,
        accountId: "00000000-0000-4000-8000-000000000099",
      });
      const otherConversationId = "00000000-0000-4000-8000-000000000013";
      const otherConversationMessageId = "00000000-0000-4000-8000-000000000014";
      database.prepare(`INSERT INTO coach_ai_chat_conversations VALUES (?, ?, ?, ?)`)
        .run(otherConversationId, scope.userId, scope.workspaceId, scope.activeAccountId);
      saveSnapshot(database, snapshot, {
        messageId: otherConversationMessageId,
        conversationId: otherConversationId,
      });

      const result = new CoachAiChatEvidenceService(database).readForMessages(
        scope,
        conversationId,
        [assistantMessageId, otherMessageId, otherConversationMessageId],
      );

      expect(result).toEqual([]);
    } finally {
      database.close();
    }
  });

  it("does not present model-authored identifiers from an evidence statement", () => {
    const database = fixture();
    try {
      const snapshot = factualSnapshot(
        [Object.freeze({ toolCallId: "factual-1", toolName: "get_workspace_summary", result: Object.freeze({}) })],
        [Object.freeze({
          toolCallId: "factual-1",
          statement: "Record 00000000-0000-4000-8000-000000000099 was checked.",
        })],
      );
      saveSnapshot(database, snapshot);

      const result = new CoachAiChatEvidenceService(database)
        .readForMessages(scope, conversationId, [assistantMessageId]);
      expect(result).toEqual([{
        messageId: assistantMessageId,
        cards: [{ title: "Workspace", href: "/workspace", linkLabel: "Open workspace" }],
      }]);
      expect(JSON.stringify(result)).not.toContain("00000000-0000-4000-8000-000000000099");
    } finally {
      database.close();
    }
  });
});
