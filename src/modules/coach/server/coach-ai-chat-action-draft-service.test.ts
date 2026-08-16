import { createHash } from "node:crypto";

import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalDataDecisionItem } from
  "@/src/modules/journal/contracts/journal-product-read-models";
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
import type { CoachAiReviewAvailabilityV2 } from
  "./coach-ai-review-availability-service";
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

  it("creates and selects a new Trade Tracker account only after confirmation", () => {
    const f = fixture();
    try {
      const service = new CoachAiChatActionDraftService(f.database, {
        createJournalAccount: (scope, input) => {
          f.database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
            .run(input.accountId, input.workspaceId, input.displayName, input.baseCurrency,
              input.tradingTimezone, scope.userId, input.now.toISOString(), input.now.toISOString());
          return Object.freeze({
            accountId: input.accountId,
            displayName: input.displayName,
            baseCurrency: input.baseCurrency,
            tradingTimezone: input.tradingTimezone,
          });
        },
      });
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Create a Long-Term Holds account."),
        extraction: Object.freeze({
          kind: "create_journal_account",
          displayName: "Long-Term Holds",
          baseCurrency: "USD",
          tradingTimezone: "America/New_York",
        }),
      }, now);
      expect(draft.preview).toEqual(expect.objectContaining({
        kind: "create_journal_account",
        displayName: "Long-Term Holds",
        baseCurrency: "USD",
        tradingTimezone: "America/New_York",
        becomesActive: true,
      }));
      expect(f.database.prepare("SELECT COUNT(*) AS count FROM journal_accounts")
        .get()).toEqual({ count: 2 });
      const result = service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(result.accountSelectionRef).toMatch(/^[0-9a-f]{64}$/u);
      expect(f.database.prepare(`SELECT display_name, base_currency, trading_timezone
FROM journal_accounts WHERE display_name = 'Long-Term Holds'`).get()).toEqual({
        display_name: "Long-Term Holds",
        base_currency: "USD",
        trading_timezone: "America/New_York",
      });
      const retried = service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:02:00.000Z"));
      expect(retried.accountSelectionRef).toBe(result.accountSelectionRef);
    } finally {
      f.database.close();
    }
  });

  it("saves an exact long Swing note only after confirmation", () => {
    const f = fixture();
    try {
      const positionRef = "e".repeat(64);
      const note = "Followed the plan and waited for confirmation.\n" + "x".repeat(8_000);
      const savedInputs: unknown[] = [];
      const detail = Object.freeze({
        positionRef,
        symbol: "SWNG",
        currency: "USD",
        timezone: "America/New_York",
        direction: "long" as const,
        openedAtUtc: "2026-08-14T14:00:00.000Z",
        closedAtUtc: null,
        remainingQuantityDecimal: "100",
        averageEntryPriceDecimal: "2.50",
        projectionState: "legitimate_open" as const,
        style: Object.freeze({
          revision: 1,
          tradeStyle: "swing" as const,
          openStatus: "swing" as const,
          plannedFromEntry: false,
          claimedEffectiveAtUtc: "2026-08-14T14:00:00.000Z",
          declaredAtUtc: "2026-08-14T14:00:00.000Z",
          lifecycleState: "active" as const,
          updatedAtUtc: "2026-08-14T14:00:00.000Z",
        }),
        latestSwingNote: null,
        reviewDateSwingNote: null,
        executions: Object.freeze([]),
        notes: Object.freeze([]),
      });
      const service = new CoachAiChatActionDraftService(f.database, {
        swingDetail: () => detail,
        saveSwingNote: (_scope, input, savedAt) => {
          savedInputs.push(input);
          return Object.freeze({
            positionRef,
            reviewDate: input.reviewDate,
            note: input.note,
            nextSessionPlan: input.nextSessionPlan,
            revision: 1,
            createdAtUtc: savedAt.toISOString(),
            updatedAtUtc: savedAt.toISOString(),
            addedRetrospectively: false,
          });
        },
      });
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Save my Swing note."),
        extraction: Object.freeze({
          kind: "swing_note",
          positionRef,
          reviewDate: "2026-08-15",
          note,
          nextSessionPlan: "Wait for the next planned add level.",
        }),
      }, now);
      expect(draft.preview).toMatchObject({
        kind: "swing_note",
        ticker: "SWNG",
        proposedNote: note,
      });
      expect(savedInputs).toEqual([]);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(savedInputs).toMatchObject([{ note, expectedRevision: null }]);
    } finally {
      f.database.close();
    }
  });

  it("classifies one exact open position with AI Chat audit provenance after confirmation", () => {
    const f = fixture();
    try {
      const positionRef = "f".repeat(64);
      const changes: unknown[] = [];
      const detail = Object.freeze({
        positionRef,
        symbol: "HOLD",
        currency: "USD",
        timezone: "America/New_York",
        direction: "long" as const,
        openedAtUtc: "2026-08-15T14:00:00.000Z",
        closedAtUtc: null,
        remainingQuantityDecimal: "25",
        averageEntryPriceDecimal: "4.00",
        projectionState: "legitimate_open" as const,
        style: null,
        latestSwingNote: null,
        reviewDateSwingNote: null,
        executions: Object.freeze([]),
      });
      const service = new CoachAiChatActionDraftService(f.database, {
        positionDetail: () => detail,
        changeTradeStyle: (_scope, input, savedAt) => {
          changes.push(input);
          return Object.freeze({
            positionRef,
            revision: 1,
            tradeStyle: input.tradeStyle,
            openStatus: input.openStatus,
            plannedFromEntry: input.plannedFromEntry,
            claimedEffectiveAtUtc: input.claimedEffectiveAtUtc,
            declaredAtUtc: savedAt.toISOString(),
            lifecycleState: "active" as const,
            updatedAtUtc: savedAt.toISOString(),
          });
        },
      });
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Mark HOLD as a bag hold."),
        extraction: Object.freeze({
          kind: "trade_style",
          positionRef,
          classification: "bag_hold",
        }),
      }, now);
      expect(draft.preview).toMatchObject({
        kind: "trade_style",
        ticker: "HOLD",
        currentLabel: "Not classified",
        proposedLabel: "Unplanned hold (bag hold)",
      });
      expect(changes).toEqual([]);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(changes).toMatchObject([{
        positionRef,
        tradeStyle: "other",
        openStatus: "unplanned_hold",
        plannedFromEntry: false,
        reason: "unplanned_hold",
        sourceUi: "ai_chat",
      }]);
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

  it("creates one eligible AI Review request only after confirmation", () => {
    const f = fixture();
    try {
      const requests: unknown[] = [];
      const availability = Object.freeze({
        periodic: Object.freeze({
          period: Object.freeze({
            cadence: "weekly" as const,
            startDate: "2026-08-03",
            endDate: "2026-08-07",
            timezone: "America/New_York" as const,
            cohorts: Object.freeze([]),
            calendarId: "test-calendar",
            calendarEvidenceDigestSha256: "a".repeat(64),
          }),
          state: "manual_available" as const,
          completedReviewCount: 3,
          incompleteReviewCount: 1,
          reviewDays: Object.freeze([]),
          evidence: Object.freeze({
            readyClosedTradeCount: 12,
            substantiveReflectionCount: 3,
            savedTagCount: 4,
            reviewedRuleOutcomeCount: 2,
          }),
          automaticAtUtc: "2026-08-15T16:00:00.000Z",
          requestState: null,
        }),
        monthly: null,
      }) satisfies CoachAiReviewAvailabilityV2;
      const requestId = createCanonicalUuidV4();
      const service = new CoachAiChatActionDraftService(f.database, {
        reviewAvailability: () => availability,
        reviewGenerationGate: () => Object.freeze({
          state: "available" as const,
          paidAccess: "available" as const,
        }),
        requestAiReview: (_scope, request) => {
          requests.push(request);
          return Object.freeze({ state: "requested" as const, requestId });
        },
      });
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Request my available weekly review."),
        extraction: Object.freeze({
          kind: "ai_review_request",
          reviewKind: "weekly",
          periodStartDate: "2026-08-03",
          periodEndDate: "2026-08-07",
        }),
      }, now);
      expect(draft.preview).toEqual(expect.objectContaining({
        kind: "ai_review_request",
        reviewLabel: "Weekly Review",
        periodStartDate: "2026-08-03",
        periodEndDate: "2026-08-07",
      }));
      expect(requests).toEqual([]);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(requests).toEqual([{
        reviewKind: "weekly",
        periodStartDate: "2026-08-03",
        periodEndDate: "2026-08-07",
      }]);
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
          positionRef: null,
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

  it("replaces one Swing position's exact tag set only after confirmation", () => {
    const f = fixture();
    try {
      const positionRef = "d".repeat(64);
      const detail = Object.freeze({
        positionRef,
        symbol: "SWNG",
        currency: "USD",
        timezone: "America/New_York",
        direction: "long" as const,
        openedAtUtc: "2026-08-14T14:00:00.000Z",
        closedAtUtc: null,
        remainingQuantityDecimal: "100",
        averageEntryPriceDecimal: "2.50",
        projectionState: "legitimate_open" as const,
        style: Object.freeze({
          revision: 1,
          tradeStyle: "swing" as const,
          openStatus: "swing" as const,
          plannedFromEntry: true,
          claimedEffectiveAtUtc: "2026-08-14T14:00:00.000Z",
          declaredAtUtc: "2026-08-14T14:00:00.000Z",
          lifecycleState: "active" as const,
          updatedAtUtc: "2026-08-14T14:00:00.000Z",
        }),
        latestSwingNote: null,
        reviewDateSwingNote: null,
        executions: Object.freeze([]),
      });
      const service = new CoachAiChatActionDraftService(f.database, {
        positionDetail: () => detail,
        resolvePositionRoundTripId: () => f.roundTripId,
      });
      const annotations = new JournalAnnotationService(
        new JournalAnnotationRepository(f.database),
        new JournalRuleRepository(f.database),
      );
      const account = narrowWorkspaceAccessToAccount(f.scope, f.scope.activeAccountId!);
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Tag this Swing as a Breakout."),
        extraction: Object.freeze({
          kind: "trade_tags",
          roundTripId: null,
          positionRef,
          tagNames: Object.freeze(["Breakout"]),
        }),
      }, now);
      expect(draft.preview).toMatchObject({
        kind: "trade_tags",
        ticker: "SWNG",
        currentTagNames: [],
        proposedTagNames: ["Breakout"],
      });
      expect(annotations.listTagsForRoundTrips(account, [f.roundTripId])[f.roundTripId])
        .toEqual([]);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(annotations.listTagsForRoundTrips(account, [f.roundTripId])[f.roundTripId]
        ?.map((tag) => tag.name)).toEqual(["Breakout"]);
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

  it("confirms an exact supported open-position decision only after preview", () => {
    const f = fixture();
    try {
      const decisionId = createCanonicalUuidV4();
      const supportedPositionFactId = createCanonicalUuidV4();
      const contradictoryPositionFactId = createCanonicalUuidV4();
      const decision: JournalDataDecisionItem = Object.freeze({
        decisionId,
        importBatchIds: Object.freeze([]),
        revision: 2,
        state: "pending",
        issueCode: "position_fact_open_position_conflict",
        effectCode: "position_chain_unavailable",
        question: "Is this position still open?",
        impactSummary: "The open position needs your confirmation.",
        targetKind: "position_fact",
        instrumentRef: createCanonicalUuidV4(),
        symbol: "TEST",
        currency: "USD",
        sourceRowNumber: null,
        sourceSection: null,
        effectiveAtUtc: now.toISOString(),
        updatedAtUtc: now.toISOString(),
        resolution: null,
        allowedActions: Object.freeze(["confirm_legitimate_open_position"] as const),
        executions: Object.freeze([]),
        flaggedStatementRow: null,
        positionFacts: Object.freeze([]),
        openPositionConfirmation: Object.freeze({
          supportedQuantityDecimal: "25",
          supportedPositionFactId,
          contradictoryPositionFactId,
        }),
        suggestedCoverage: null,
      });
      const resolved: Array<unknown> = [];
      const service = new CoachAiChatActionDraftService(f.database, {
        dataDecisions: {
          listDataDecisions: () => Object.freeze({
            pending: Object.freeze([decision]),
            resolved: Object.freeze([]),
          }),
        },
        resolveDataDecision: (_account, resolution) => {
          resolved.push(resolution);
          return Object.freeze({
            decision: Object.freeze({ state: "resolved" }),
            rebuildCount: 1,
            openedFollowupDecisionIds: Object.freeze([]),
          });
        },
      });
      const decisionRef = createHash("sha256").update([
        "coach-data-decision-ref-v1",
        f.scope.workspaceId,
        f.scope.activeAccountId,
        decisionId,
      ].join("\u001f"), "utf8").digest("hex");
      const draft = service.create(f.scope, {
        conversationId: f.conversationId,
        sourceMessageId: f.message("Yes, TEST is still open."),
        extraction: Object.freeze({
          kind: "data_decision",
          decisionRef,
          resolution: Object.freeze({ action: "confirm_legitimate_open_position" }),
        }),
      }, now);
      expect(draft.preview).toMatchObject({
        kind: "data_decision",
        ticker: "TEST",
        question: "Is this position still open?",
        actionLabel: "Confirm this open position",
        details: ["Supported open quantity: 25"],
      });
      expect(resolved).toEqual([]);
      service.confirm(f.scope, {
        conversationId: f.conversationId,
        draftId: draft.draftId,
      }, new Date("2026-08-15T12:01:00.000Z"));
      expect(resolved).toMatchObject([{
        action: "confirm_legitimate_open_position",
        positionFactId: supportedPositionFactId,
      }]);
    } finally {
      f.database.close();
    }
  });
});
