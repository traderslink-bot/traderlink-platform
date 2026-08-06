import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiReviewDeliveryChangeCommandService } from "./coach-ai-review-delivery-change-command-service";
import { CoachAiReviewDeliveryChangeRepository } from "./coach-ai-review-delivery-change-repository";
import { CoachReviewDeliveryScheduleRepository } from "./coach-weekly-review-schedule-repository";

const now = new Date("2026-08-06T12:00:00.000Z");

function fixture() {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => now });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users VALUES (?, 'development_local', ?, 'Test', 'active', ?, ?)`).run(userId, `test-${userId}`, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO platform_workspaces VALUES (?, 'Test', 'America/New_York', 'active', ?, ?)`).run(workspaceId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO platform_workspace_memberships VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(workspaceId, userId, userId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO journal_accounts VALUES (?, ?, 'Test', 'USD', 'America/New_York', 'active', ?, ?, ?)`).run(accountId, workspaceId, userId, now.toISOString(), now.toISOString());
  const scope: WorkspaceAccessScope = Object.freeze({ userId, workspaceId, workspaceRole: "owner", allowedAccountIds: Object.freeze([accountId]), activeAccountId: accountId });
  const chat = new CoachAiChatRepository(database);
  const conversationId = chat.createConversation(scope, "Settings", now).conversationId;
  const pair = chat.appendUserMessageAndReserveAssistant(scope, conversationId, {
    originalUserTextPrivate: "Move my review to Sunday at 7 PM.",
  }, now);
  const drafts = new CoachAiReviewDeliveryChangeRepository(database);
  const draft = drafts.create(scope, {
    conversationId,
    sourceMessageId: pair.userMessage.messageId,
    current: Object.freeze({ weeklyDeliveryDay: "friday", deliveryTimeEastern: "18:00", updatedAtUtc: null }),
    proposed: Object.freeze({ weeklyDeliveryDay: "sunday", deliveryTimeEastern: "19:00" }),
  }, now);
  return { database, scope, conversationId, draft, drafts };
}

describe("CoachAiReviewDeliveryChangeCommandService", () => {
  it("commits one explicit edited schedule change and is idempotent", () => {
    const f = fixture();
    try {
      const service = new CoachAiReviewDeliveryChangeCommandService(f.database);
      const first = service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: f.draft.draftId,
        editedProposal: Object.freeze({ weeklyDeliveryDay: "saturday", deliveryTimeEastern: "20:30" }),
      }, now);
      expect(first).toMatchObject({ disposition: "confirmed", settingsWriteState: "committed" });
      expect(new CoachReviewDeliveryScheduleRepository(f.database).read(f.scope)).toMatchObject({
        weeklyDeliveryDay: "saturday",
        deliveryTimeEastern: "20:30",
      });
      expect(service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: f.draft.draftId,
        editedProposal: Object.freeze({ weeklyDeliveryDay: "friday", deliveryTimeEastern: "16:00" }),
      }, now)).toEqual(first);
    } finally { f.database.close(); }
  });

  it("rolls back a stale proposal and rejects without changing settings", () => {
    const f = fixture();
    try {
      const schedules = new CoachReviewDeliveryScheduleRepository(f.database);
      schedules.save(f.scope, { weeklyDeliveryDay: "friday", deliveryTimeEastern: "21:00" }, now);
      const service = new CoachAiReviewDeliveryChangeCommandService(f.database);
      expect(() => service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: f.draft.draftId,
        editedProposal: Object.freeze({ weeklyDeliveryDay: "sunday", deliveryTimeEastern: "19:00" }),
      }, now)).toThrow("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      expect(f.drafts.read(f.scope, f.draft.draftId)).toMatchObject({
        disposition: "proposed",
        settingsWriteState: "not_written",
      });
      expect(service.reject(f.scope, {
        conversationId: f.conversationId,
        draftId: f.draft.draftId,
      }, now)).toMatchObject({ disposition: "rejected", settingsWriteState: "not_written" });
      expect(schedules.read(f.scope)).toMatchObject({ deliveryTimeEastern: "21:00" });
    } finally { f.database.close(); }
  });
});
