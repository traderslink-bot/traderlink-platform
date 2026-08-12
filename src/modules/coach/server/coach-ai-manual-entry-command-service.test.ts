import Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";

import type { JournalManualTradePreview } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { currentJournalAccountSelectionRef } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiManualEntryCommandService } from "./coach-ai-manual-entry-command-service";
import { CoachAiManualEntryDraftRepository } from "./coach-ai-manual-entry-draft-repository";

const now = new Date("2026-08-05T14:00:00.000Z");

function fixture() {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => now });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users VALUES (?, 'development_local', ?, 'Test', 'active', ?, ?)`)
    .run(userId, `test-${userId}`, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO platform_workspaces VALUES (?, 'Test', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO platform_workspace_memberships VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO journal_accounts VALUES (?, ?, 'Test', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, now.toISOString(), now.toISOString());
  const scope: WorkspaceAccessScope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
  const chat = new CoachAiChatRepository(database);
  const conversation = chat.createConversation(scope, "Trade entry", now);
  const pair = chat.appendUserMessageAndReserveAssistant(scope, conversation.conversationId, {
    originalUserTextPrivate: "Buy 10 TEST at 1.25 and sell 10 at 1.50.",
  }, now);
  const drafts = new CoachAiManualEntryDraftRepository(database);
  const draft = drafts.createDraft(scope, {
    conversationId: conversation.conversationId,
    sourceMessageId: pair.userMessage.messageId,
    sourceTimezone: "America/New_York",
    tradeCurrency: "USD",
    state: "ready_for_confirmation",
    rows: Object.freeze([
      Object.freeze({ clientRowRef: "row-1", localDate: "2026-08-05", localTime: "09:30:00", normalizedSymbol: "TEST", side: "buy" as const, quantityDecimal: "10", priceDecimal: "1.25", feesDecimal: null }),
      Object.freeze({ clientRowRef: "row-2", localDate: "2026-08-05", localTime: "10:00:00", normalizedSymbol: "TEST", side: "sell" as const, quantityDecimal: "10", priceDecimal: "1.5", feesDecimal: null }),
    ]),
    expiresAtUtc: "2026-08-06T14:00:00.000Z",
  }, now);
  const preview: JournalManualTradePreview = Object.freeze({
    previewRef: "preview:" + "a".repeat(80),
    expiresAtUtc: "2026-08-05T14:10:00.000Z",
    tracker: "quick",
    affectedDates: Object.freeze(["2026-08-05"]),
    executionCount: 2,
    groups: Object.freeze([Object.freeze({
      groupRef: "b".repeat(64),
      symbol: "TEST",
      currency: "USD",
      direction: "long",
      openedAtUtc: "2026-08-05T13:30:00.000Z",
      lastExecutionAtUtc: "2026-08-05T14:00:00.000Z",
      state: "complete_trade",
      remainingQuantityDecimal: "0",
      allocations: Object.freeze([]),
      existingPosition: null,
      allowedRelationships: Object.freeze(["start_new_trade" as const]),
      allowedStyles: Object.freeze(["day_trade" as const]),
      suggestedStyle: "day_trade",
    })]),
  });
  const previewMethod = vi.fn(() => preview);
  const commitMethod = vi.fn((scopeArgument: unknown, requestArgument: unknown, nowArgument: Date) => {
    void scopeArgument;
    void requestArgument;
    void nowArgument;
    return Object.freeze({
      importBatchId: "canonical-import-batch",
      status: "committed",
      executionIds: Object.freeze(["execution-1", "execution-2"]),
      createdExecutionCount: 2,
      matchedExecutionCount: 0,
      relatedDecisionIds: Object.freeze([]),
      affectedDates: Object.freeze(["2026-08-05"]),
    });
  });
  const journal = {
    manualTradePreviews: { preview: previewMethod },
    manualTrades: { commit: commitMethod },
  };
  return { database, scope, conversation, draft, drafts, preview, previewMethod, commitMethod,
    subject: new CoachAiManualEntryCommandService(database, journal as never) };
}

describe("Coach AI manual-entry command bridge", () => {
  it("requires review, preserves exact rows, and records one confirmed canonical Journal write", () => {
    const f = fixture();
    try {
      const reviewed = f.subject.preview(f.scope, {
        conversationId: f.conversation.conversationId,
        draftId: f.draft.draftId,
        tracker: "quick",
        rows: f.draft.rows,
      }, now);
      expect(reviewed.preview).toEqual(f.preview);
      expect(f.previewMethod).toHaveBeenCalledWith(f.scope, {
        accountSelectionRef: currentJournalAccountSelectionRef(f.scope),
        tracker: "quick",
        entries: f.draft.rows,
      });

      const confirmation = Object.freeze({
        groupRef: f.preview.groups[0]!.groupRef,
        relationship: "start_new_trade" as const,
        style: "day_trade" as const,
        existingPositionRef: null,
        completeExecutionSetConfirmed: true,
      });
      const committed = f.subject.commit(f.scope, {
        conversationId: f.conversation.conversationId,
        draftId: f.draft.draftId,
        tracker: "quick",
        previewRef: f.preview.previewRef,
        clientRequestId: "00000000-0000-4000-8000-000000000099",
        confirmations: Object.freeze([confirmation]),
      }, now);
      expect(committed.draft).toMatchObject({
        state: "committed",
        journalWriteState: "committed",
        canonicalJournalCommand: "journal_manual_execution_commit",
        canonicalJournalReference: "canonical-import-batch",
      });
      expect(f.commitMethod).toHaveBeenCalledTimes(1);
      expect(f.commitMethod.mock.calls[0]?.[2]).toMatchObject({
        tracker: "quick",
        preparedBy: "ai_chat",
        entries: f.draft.rows,
        confirmations: [confirmation],
      });

      const retry = f.subject.commit(f.scope, {
        conversationId: f.conversation.conversationId,
        draftId: f.draft.draftId,
        tracker: "quick",
        previewRef: f.preview.previewRef,
        clientRequestId: "00000000-0000-4000-8000-000000000099",
        confirmations: Object.freeze([confirmation]),
      }, now);
      expect(retry.result).toBeNull();
      expect(f.commitMethod).toHaveBeenCalledTimes(1);
    } finally {
      f.database.close();
    }
  });
});
