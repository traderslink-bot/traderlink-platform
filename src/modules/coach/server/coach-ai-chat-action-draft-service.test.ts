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
import { JournalAnnotationRepository } from
  "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from
  "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from
  "@/src/modules/journal/server/annotations/journal-rule-repository";
import { narrowWorkspaceAccessToAccount } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiChatActionDraftService } from "./coach-ai-chat-action-draft-service";
import { CoachReviewDeliveryScheduleRepository } from
  "./coach-weekly-review-schedule-repository";

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
  const instrumentId = createCanonicalUuidV4();
  const rebuildId = createCanonicalUuidV4();
  const roundTripId = createCanonicalUuidV4();
  const roundTripVersionId = createCanonicalUuidV4();
  database.exec("BEGIN IMMEDIATE");
  database.prepare(`INSERT INTO journal_instruments (
  instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
  venue, identity_scheme_version, provider_identity_sha256, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'stock', 'TEST', 'USD', NULL, NULL, NULL, 'active', ?, ?)`)
    .run(instrumentId, workspaceId, now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
) VALUES (?, ?, ?, ?, 'USD', ?, 'maintenance', NULL, NULL,
  'ai_chat_tag_test', NULL, 'round_trip_v1', ?, ?, 'complete', 1, 0, 0, 0,
  ?, ?, ?)`)
    .run(rebuildId, workspaceId, accountId, instrumentId, "a".repeat(64),
      "b".repeat(64), "c".repeat(64), now.toISOString(), now.toISOString(),
      now.toISOString());
  database.prepare(`INSERT INTO journal_round_trips (
  round_trip_id, workspace_id, account_id, current_version_id,
  lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
    .run(roundTripId, workspaceId, accountId, roundTripVersionId,
      now.toISOString(), now.toISOString());
  database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id,
  version_number, rebuild_id, instrument_id, trade_currency,
  chain_key_sha256, direction, opened_at_utc, closed_at_utc,
  final_position_decimal, projection_state, coverage_reason_code,
  projection_fingerprint_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?, 'USD', ?, 'long', ?, ?, '0',
  'ready_closed', NULL, ?, ?)`)
    .run(roundTripVersionId, workspaceId, accountId, roundTripId, rebuildId,
      instrumentId, "a".repeat(64), now.toISOString(), now.toISOString(),
      "d".repeat(64), now.toISOString());
  database.exec("COMMIT");
  const scope: WorkspaceAccessScope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: Object.freeze([accountId, secondAccountId]),
    activeAccountId: accountId,
  });
  const chat = new CoachAiChatRepository(database);
  const conversationId = chat.createConversation(scope, "Changes", now).conversationId;
  const message = (text: string) => {
    const reserved = chat.appendUserMessageAndReserveAssistant(
      scope,
      conversationId,
      { originalUserTextPrivate: text },
      now,
    );
    chat.finalizeAssistantFailure(
      scope,
      reserved.assistantMessage.messageId,
      "TEST_TURN_CLOSED",
      null,
      now,
    );
    return reserved.userMessage.messageId;
  };
  return { database, scope, conversationId, message, roundTripId };
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

  it("shows the complete Discord notification selection before saving it", () => {
    const f = fixture();
    try {
      const notifications = new PlatformNotificationRepository(f.database);
      const service = new CoachAiChatActionDraftService(f.database);
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Send AI Review and statement import updates to Discord."),
        extraction: Object.freeze({
          kind: "notification_preferences",
          discordDmCategories: Object.freeze(["statement_import", "ai_review"]),
        }),
      }, now);
      expect(draft.preview).toMatchObject({
        kind: "notification_preferences",
        currentCategoryLabels: [],
        proposedCategoryLabels: ["AI Reviews", "Statement imports"],
      });
      expect(notifications.readPreferences(f.scope).discordDmCategories).toEqual([]);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(notifications.readPreferences(f.scope).discordDmCategories)
        .toEqual(["ai_review", "statement_import"]);
    } finally {
      f.database.close();
    }
  });

  it("turns off existing AI Reviews only after confirmation", () => {
    const f = fixture();
    try {
      const schedules = new CoachReviewDeliveryScheduleRepository(f.database);
      schedules.saveV2(f.scope, {
        isEnabled: true,
        currentFrequency: "weekly",
        timingMode: "automatic_after_12_hours",
        twoWeekAnchorMondayDate: null,
        pendingFrequency: null,
        pendingEffectiveMondayDate: null,
        pendingTwoWeekAnchorMondayDate: null,
        expectedRevision: null,
      }, now);
      const service = new CoachAiChatActionDraftService(f.database);
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Turn off my AI Reviews."),
        extraction: Object.freeze({ kind: "ai_review_account_setting", isEnabled: false }),
      }, now);
      expect(schedules.readV2(f.scope)?.isEnabled).toBe(true);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(schedules.readV2(f.scope)?.isEnabled).toBe(false);
    } finally {
      f.database.close();
    }
  });

  it("replaces one completed trade's exact tag set only after confirmation", () => {
    const f = fixture();
    try {
      const service = new CoachAiChatActionDraftService(f.database);
      const annotations = new JournalAnnotationService(
        new JournalAnnotationRepository(f.database),
        new JournalRuleRepository(f.database),
      );
      const account = narrowWorkspaceAccessToAccount(f.scope, f.scope.activeAccountId!);
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Tag this TEST trade as a Breakout and Patient entry."),
        extraction: Object.freeze({
          kind: "trade_tags",
          roundTripId: f.roundTripId,
          tagNames: Object.freeze(["Breakout", "Patient entry"]),
        }),
      }, now);
      expect(draft.preview).toMatchObject({
        kind: "trade_tags",
        ticker: "TEST",
        currentTagNames: [],
        proposedTagNames: ["Breakout", "Patient entry"],
      });
      expect(annotations.listTagsForRoundTrips(account, [f.roundTripId])[f.roundTripId])
        .toEqual([]);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(annotations.listTagsForRoundTrips(account, [f.roundTripId])[f.roundTripId]
        ?.map((tag) => tag.name).sort()).toEqual(["Breakout", "Patient entry"]);
    } finally {
      f.database.close();
    }
  });

  it("adds a configured preset rule only after confirmation", () => {
    const f = fixture();
    try {
      const service = new CoachAiChatActionDraftService(f.database);
      const annotations = new JournalAnnotationService(
        new JournalAnnotationRepository(f.database),
        new JournalRuleRepository(f.database),
      );
      const account = narrowWorkspaceAccessToAccount(f.scope, f.scope.activeAccountId!);
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Add a maximum of four completed trades per day."),
        extraction: Object.freeze({
          kind: "rule_change",
          operation: Object.freeze({
            kind: "create_preset",
            presetKey: "maximum_trades_per_day",
            configuration: Object.freeze({ maximumTrades: "4" }),
          }),
        }),
      }, now);
      expect(draft.preview).toMatchObject({
        kind: "rule_change",
        title: "Add trading rule",
        ruleTitle: "Maximum completed trades per day",
      });
      expect(annotations.listRules(account)).toEqual([]);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(annotations.listRules(account)).toMatchObject([{
        templateKey: "maximum_trades_per_day",
        lifecycleState: "active",
        configuration: { maximumTrades: "4" },
      }]);
    } finally {
      f.database.close();
    }
  });

  it("creates, revises, and pauses an exact custom rule through separate confirmations", () => {
    const f = fixture();
    try {
      const service = new CoachAiChatActionDraftService(f.database);
      const annotations = new JournalAnnotationService(
        new JournalAnnotationRepository(f.database),
        new JournalRuleRepository(f.database),
      );
      const account = narrowWorkspaceAccessToAccount(f.scope, f.scope.activeAccountId!);
      const created = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Add my custom rule to wait for confirmation."),
        extraction: Object.freeze({
          kind: "rule_change",
          operation: Object.freeze({
            kind: "create_custom",
            title: "Wait for confirmation",
            statement: "Wait for the setup to confirm before entering.",
            category: "process",
            reviewScope: "trade",
            isFocus: true,
          }),
        }),
      }, now);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: created.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      const saved = annotations.listRules(account)[0]!;
      const opaqueRef = createHash("sha256").update([
        "coach-rule-ref-v1",
        account.workspaceId,
        account.accountId,
        saved.ruleId,
      ].join("\u001f"), "utf8").digest("hex");
      const revised = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Change that rule wording."),
        extraction: Object.freeze({
          kind: "rule_change",
          operation: Object.freeze({
            kind: "revise_custom",
            ruleRef: opaqueRef,
            title: "Wait for confirmation",
            statement: "Wait for both the setup and entry trigger to confirm.",
            category: "process",
            reviewScope: "trade",
            isFocus: true,
          }),
        }),
      }, new Date("2026-08-15T12:02:00.000Z"));
      expect(annotations.listRules(account)[0]?.statement)
        .toBe("Wait for the setup to confirm before entering.");
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: revised.draftId,
      }, new Date("2026-08-15T12:03:00.000Z"));
      expect(annotations.listRules(account)[0]?.statement)
        .toBe("Wait for both the setup and entry trigger to confirm.");
      const paused = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Pause that rule."),
        extraction: Object.freeze({
          kind: "rule_change",
          operation: Object.freeze({ kind: "transition", ruleRef: opaqueRef, newStatus: "paused" }),
        }),
      }, new Date("2026-08-15T12:04:00.000Z"));
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: paused.draftId,
      }, new Date("2026-08-15T12:05:00.000Z"));
      expect(annotations.listRules(account)[0]?.lifecycleState).toBe("paused");
    } finally {
      f.database.close();
    }
  });
});
