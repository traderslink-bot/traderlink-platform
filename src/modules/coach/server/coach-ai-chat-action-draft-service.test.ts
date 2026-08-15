import { createHash } from "node:crypto";

import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from
  "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from
  "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformNotificationRepository } from
  "@/src/modules/platform/server/notifications/platform-notification-repository";
import { PlatformUserPreferenceRepository } from
  "@/src/modules/platform/server/identity/platform-user-preference-repository";

import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiChatActionDraftService } from "./coach-ai-chat-action-draft-service";

const now = new Date("2026-08-15T12:00:00.000Z");

function fixture() {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => now });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  const secondAccountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users VALUES (?, 'development_local', ?, 'Test', 'active', ?, ?)`)
    .run(userId, `test-${userId}`, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO platform_workspaces VALUES (?, 'Test', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO platform_workspace_memberships VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO journal_accounts VALUES (?, ?, 'Day Trades', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO journal_accounts VALUES (?, ?, 'Swing Trades', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(secondAccountId, workspaceId, userId, now.toISOString(), now.toISOString());
  const scope: WorkspaceAccessScope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: Object.freeze([accountId, secondAccountId]),
    activeAccountId: accountId,
  });
  const chat = new CoachAiChatRepository(database);
  const conversationId = chat.createConversation(scope, "Changes", now).conversationId;
  const message = (text: string) => chat.appendUserMessageAndReserveAssistant(
    scope,
    conversationId,
    { originalUserTextPrivate: text },
    now,
  ).userMessage.messageId;
  return { database, scope, conversationId, message };
}

describe("CoachAiChatActionDraftService", () => {
  it("requires explicit confirmation before changing reporting currency", () => {
    const f = fixture();
    try {
      const service = new CoachAiChatActionDraftService(f.database);
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Use CAD for reporting."),
        extraction: Object.freeze({ kind: "reporting_currency", reportingCurrency: "CAD" }),
      }, now);
      expect(new PlatformUserPreferenceRepository(f.database)
        .getActiveUserReportingCurrency(f.scope.userId)).toBe("USD");
      const confirmed = service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, now);
      expect(confirmed.draft).toMatchObject({ disposition: "confirmed", writeState: "committed" });
      expect(new PlatformUserPreferenceRepository(f.database)
        .getActiveUserReportingCurrency(f.scope.userId)).toBe("CAD");
    } finally {
      f.database.close();
    }
  });

  it("marks only the exact account-scoped notification read", () => {
    const f = fixture();
    try {
      const notifications = new PlatformNotificationRepository(f.database);
      const notification = notifications.create({
        category: "ai_review",
        destinationPath: "/ai-reviews",
        journalAccountId: f.scope.activeAccountId,
        kind: "ai_review_ready",
        occurredAtUtc: now.toISOString(),
        scope: f.scope,
        sourceEventKey: "test_review_ready",
        summary: "Your weekly review is ready.",
        title: "Weekly review ready",
      });
      const opaqueRef = createHash("sha256").update([
        "coach-notification-ref-v1",
        f.scope.workspaceId,
        f.scope.userId,
        notification.notificationRef,
      ].join("\u001f"), "utf8").digest("hex");
      const service = new CoachAiChatActionDraftService(f.database);
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Mark that weekly review notification read."),
        extraction: Object.freeze({ kind: "mark_notification_read", notificationRef: opaqueRef }),
      }, now);
      expect(notifications.list(f.scope, 10)[0]?.readAtUtc).toBeNull();
      service.confirm(f.scope, { conversationId: f.conversationId, draftId: draft.draftId }, now);
      expect(notifications.list(f.scope, 10)[0]?.readAtUtc).toBe(now.toISOString());
    } finally {
      f.database.close();
    }
  });

  it("returns the cookie selector only after a confirmed account switch", () => {
    const f = fixture();
    try {
      const service = new CoachAiChatActionDraftService(f.database);
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Switch to Swing Trades."),
        extraction: Object.freeze({ kind: "select_journal_account", accountDisplayName: "Swing Trades" }),
      }, now);
      const result = service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, now);
      expect(result.draft).toMatchObject({ disposition: "confirmed", writeState: "committed" });
      expect(result.accountSelectionRef).toMatch(/^[0-9a-f]{64}$/u);
      const retried = service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-04T15:01:00.000Z"));
      expect(retried.accountSelectionRef).toBe(result.accountSelectionRef);
    } finally {
      f.database.close();
    }
  });
});
