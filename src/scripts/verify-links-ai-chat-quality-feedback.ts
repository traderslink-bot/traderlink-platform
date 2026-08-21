import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { CoachAiChatQualityFeedbackRepository } from "@/src/modules/coach/server/coach-ai-chat-quality-feedback-repository";
import { CoachAiChatRepository } from "@/src/modules/coach/server/coach-ai-chat-repository";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

const NOW = new Date("2026-08-21T00:10:00.000Z");

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function seedScope(database: Database.Database): WorkspaceAccessScope {
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const timestamp = NOW.toISOString();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', ?, 'Quality verifier', 'active', ?, ?)`)
    .run(userId, `quality-${userId}`, timestamp, timestamp);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Quality verifier', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, timestamp, timestamp);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, timestamp, timestamp);
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Quality verifier', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, timestamp, timestamp);
  return Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
}

function appendPair(
  chat: CoachAiChatRepository,
  scope: WorkspaceAccessScope,
  conversationId: string,
  question: string,
  response: "complete" | "fail",
): string {
  const pair = chat.appendUserMessageAndReserveAssistant(scope, conversationId, {
    originalUserTextPrivate: question,
  }, NOW);
  if (response === "complete") {
    chat.finalizeDeterministicAssistant(scope, pair.assistantMessage.messageId, "Saved answer.", NOW);
  } else {
    chat.finalizeAssistantFailure(
      scope,
      pair.assistantMessage.messageId,
      "TRADERLINK_COACH_PROVIDER_UNAVAILABLE",
      null,
      NOW,
    );
  }
  return pair.assistantMessage.messageId;
}

function main(): void {
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => NOW });
    const scope = seedScope(database);
    const chat = new CoachAiChatRepository(database);
    const conversation = chat.createConversation(scope, "Quality context", NOW);
    appendPair(chat, scope, conversation.conversationId, "A successful answer first", "complete");
    const failedAssistantMessageId = appendPair(chat, scope, conversation.conversationId, "Why could you not answer?", "fail");
    appendPair(chat, scope, conversation.conversationId, "A later saved answer", "complete");
    const quality = new CoachAiChatQualityFeedbackRepository(database);
    const automatic = quality.capture(scope, {
      assistantMessageId: failedAssistantMessageId,
      eventKind: "automatic_failure",
      failureCode: "TRADERLINK_COACH_PROVIDER_UNAVAILABLE",
    }, NOW);
    const flagged = quality.capture(scope, {
      assistantMessageId: failedAssistantMessageId,
      eventKind: "trader_flagged",
    }, NOW);
    invariant(automatic.caseId === flagged.caseId, "A flag must enrich the existing quality case.");
    invariant(flagged.context.length === 6, "The case must retain surrounding ordered conversation context.");
    invariant(flagged.context[3]?.messageId === failedAssistantMessageId,
      "The failed Links answer must remain inside its own context snapshot.");
    invariant(flagged.eventKinds.includes("automatic_failure") && flagged.eventKinds.includes("trader_flagged"),
      "Automatic capture and trader feedback must both be retained.");
    const ownerCases = quality.listForOwner();
    invariant(ownerCases.length === 1 && ownerCases[0]?.state === "open",
      "The owner queue must expose the open captured case.");
    const counts = database.prepare<[], { cases: number; events: number }>(`SELECT
  (SELECT COUNT(*) FROM coach_ai_chat_quality_cases) AS cases,
  (SELECT COUNT(*) FROM coach_ai_chat_quality_events) AS events`).get()!;
    invariant(counts.cases === 1 && counts.events === 2,
      "Idempotent capture must create one case and one event per source.");
    console.log("Links AI Chat quality feedback verifier passed.");
  } finally {
    database.close();
  }
}

main();
