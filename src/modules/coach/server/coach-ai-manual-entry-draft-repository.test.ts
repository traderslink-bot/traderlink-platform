import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import {
  canTransitionCoachAiManualEntryDraftState,
  type CoachAiManualExecutionExtractionRow,
} from "@/src/modules/coach/contracts/ai-manual-entry-draft-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiManualEntryDraftRepository } from "./coach-ai-manual-entry-draft-repository";

const initialTime = "2026-08-05T12:00:00.000Z";

type Fixture = Readonly<{
  database: Database.Database;
  chat: CoachAiChatRepository;
  repository: CoachAiManualEntryDraftRepository;
  scope: WorkspaceAccessScope;
  secondAccountScope: WorkspaceAccessScope;
}>;

function setup(): Fixture {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => new Date(initialTime) });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const secondAccountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', 'manual-draft-test-user', 'Manual draft test user', 'active', ?, ?)`)
    .run(userId, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Manual draft test workspace', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, initialTime, initialTime);
  for (const [id, name] of [[accountId, "Primary"], [secondAccountId, "Second"]] as const) {
    database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'USD', 'America/New_York', 'active', ?, ?, ?)`)
      .run(id, workspaceId, name, userId, initialTime, initialTime);
  }
  const scope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([accountId, secondAccountId]),
    activeAccountId: accountId,
  });
  return Object.freeze({
    database,
    chat: new CoachAiChatRepository(database),
    repository: new CoachAiManualEntryDraftRepository(database),
    scope,
    secondAccountScope: Object.freeze({ ...scope, activeAccountId: secondAccountId }),
  });
}

function expectPrivateFailure(action: () => unknown, privateValue: string): void {
  try {
    action();
    throw new Error("expected domain failure");
  } catch (error) {
    expect(isTraderLinkPlatformError(error)).toBe(true);
    if (isTraderLinkPlatformError(error)) {
      expect(error.message).not.toContain(privateValue);
      expect(JSON.stringify(error.safeContext)).not.toContain(privateValue);
    }
  }
}

describe("Coach AI manual-entry draft repository", () => {
  it("keeps incomplete rows editable, requires complete rows for confirmation, and preserves scoped terminal lifecycle evidence", () => {
    const fixture = setup();
    try {
      const conversation = fixture.chat.createConversation(fixture.scope, "Manual capture", new Date(initialTime));
      const source = fixture.chat.appendUserMessageAndReserveAssistant(
        fixture.scope,
        conversation.conversationId,
        { originalUserTextPrivate: "I bought a private execution but missed the size." },
        new Date("2026-08-05T12:01:00.000Z"),
      ).userMessage;
      const incompleteRows: readonly CoachAiManualExecutionExtractionRow[] = Object.freeze([Object.freeze({
        clientRowRef: "chat-row-1",
        localDate: null,
        localTime: "09:35:00",
        normalizedSymbol: "AAPL",
        side: "buy",
        quantityDecimal: null,
        priceDecimal: "201.5",
        feesDecimal: null,
      })]);
      const draft = fixture.repository.createDraft(fixture.scope, {
        conversationId: conversation.conversationId,
        sourceMessageId: source.messageId,
        sourceTimezone: "America/New_York",
        tradeCurrency: "USD",
        state: "draft",
        rows: incompleteRows,
      }, new Date("2026-08-05T12:02:00.000Z"));

      expect(draft.rows[0]).toMatchObject({ sourceTimezone: "America/New_York", tradeCurrency: "USD", quantityDecimal: null });
      expect(fixture.repository.readDraftForSourceMessage(fixture.scope, conversation.conversationId, source.messageId)?.draftId)
        .toBe(draft.draftId);
      expect(fixture.repository.listDrafts(fixture.scope, { conversationId: conversation.conversationId })).toHaveLength(1);
      expectPrivateFailure(
        () => fixture.repository.readDraft(fixture.secondAccountScope, draft.draftId),
        draft.draftId,
      );
      expect(() => fixture.repository.transitionDraft(fixture.scope, draft.draftId, { state: "ready_for_confirmation" }))
        .toThrow("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");

      fixture.repository.replaceDraftRows(fixture.scope, draft.draftId, [Object.freeze({
        clientRowRef: "chat-row-1",
        localDate: "2026-08-05",
        localTime: "09:35:00",
        normalizedSymbol: "AAPL",
        side: "buy",
        quantityDecimal: "10",
        priceDecimal: "201.5",
        feesDecimal: null,
      })], new Date("2026-08-05T12:03:00.000Z"));
      const ready = fixture.repository.transitionDraft(
        fixture.scope, draft.draftId, { state: "ready_for_confirmation" }, new Date("2026-08-05T12:04:00.000Z"),
      );
      expect(ready.state).toBe("ready_for_confirmation");
      expect(fixture.repository.transitionDraft(
        fixture.scope, draft.draftId, { state: "confirmed_by_trader" }, new Date("2026-08-05T12:05:00.000Z"),
      ).state).toBe("confirmed_by_trader");
      expect(() => fixture.repository.replaceDraftRows(fixture.scope, draft.draftId, incompleteRows))
        .toThrow("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(fixture.repository.transitionDraft(
        fixture.scope, draft.draftId, { state: "commit_pending" }, new Date("2026-08-05T12:06:00.000Z"),
      ).journalWriteState).toBe("commit_pending");
      const failed = fixture.repository.transitionDraft(
        fixture.scope,
        draft.draftId,
        { state: "write_failed", writeFailureCode: "TRADERLINK_JOURNAL_COMMAND_FAILED" },
        new Date("2026-08-05T12:07:00.000Z"),
      );
      expect(failed).toMatchObject({ state: "write_failed", journalWriteState: "write_failed", finalizedAtUtc: "2026-08-05T12:07:00.000Z" });
      expect(() => fixture.repository.transitionDraft(fixture.scope, draft.draftId, { state: "commit_pending" }))
        .toThrow("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(canTransitionCoachAiManualEntryDraftState("draft", "ready_for_confirmation")).toBe(true);
      expect(canTransitionCoachAiManualEntryDraftState("commit_pending", "committed")).toBe(true);
      expect(canTransitionCoachAiManualEntryDraftState("committed", "archived")).toBe(false);
    } finally {
      fixture.database.close();
    }
  });
});
