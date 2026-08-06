import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import type {
  CoachAiDailyCompanionContext,
  CoachAiDailyCompanionResolvedContext,
} from "../contracts/ai-daily-companion-contracts";
import type {
  AccountScope,
  WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";

import { CoachAiChatRepository } from "./coach-ai-chat-repository";
import { CoachAiDailyCompanionCommandService } from "./coach-ai-daily-companion-command-service";
import { CoachAiDailyCompanionRepository } from "./coach-ai-daily-companion-repository";

const now = new Date("2026-08-05T12:00:00.000Z");
const tradingDate = "2026-08-05";

function id(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function digest(character: string): string {
  return character.repeat(64);
}

function context(): Readonly<{
  database: Database.Database;
  scope: WorkspaceAccessScope;
  account: AccountScope;
  annotations: JournalAnnotationService;
  conversationId: string;
  sourceMessageId: string;
  roundTripId: string;
}> {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => now });
  const userId = id(1);
  const workspaceId = id(2);
  const accountId = id(3);
  const instrumentId = id(4);
  const rebuildId = id(5);
  const roundTripId = id(6);
  const roundTripVersionId = id(7);
  const dayId = id(8);
  const at = now.toISOString();
  database.exec("BEGIN IMMEDIATE");
  database.prepare(`INSERT INTO platform_users VALUES (?, 'development_local', ?, 'Test', 'active', ?, ?)`)
    .run(userId, `test-${userId}`, at, at);
  database.prepare(`INSERT INTO platform_workspaces VALUES (?, 'Test', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, at, at);
  database.prepare(`INSERT INTO platform_workspace_memberships VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, at, at);
  database.prepare(`INSERT INTO journal_accounts VALUES (?, ?, 'Test', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, at, at);
  database.prepare(`INSERT INTO journal_instruments (
  instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
  venue, identity_scheme_version, provider_identity_sha256, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'stock', 'TEST', 'USD', NULL, NULL, NULL, 'active', ?, ?)`)
    .run(instrumentId, workspaceId, at, at);
  database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
) VALUES (?, ?, ?, ?, 'USD', ?, 'maintenance', NULL, NULL,
  'daily_companion_test', NULL, 'round_trip_v1', ?, ?, 'complete', 1, 0, 0, 0,
  ?, ?, ?)`)
    .run(rebuildId, workspaceId, accountId, instrumentId, digest("a"),
      digest("b"), digest("c"), at, at, at);
  database.prepare(`INSERT INTO journal_round_trips (
  round_trip_id, workspace_id, account_id, current_version_id,
  lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
    .run(roundTripId, workspaceId, accountId, roundTripVersionId, at, at);
  database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id,
  version_number, rebuild_id, instrument_id, trade_currency,
  chain_key_sha256, direction, opened_at_utc, closed_at_utc,
  final_position_decimal, projection_state, coverage_reason_code,
  projection_fingerprint_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?, 'USD', ?, 'long', ?, ?, '0',
  'ready_closed', NULL, ?, ?)`)
    .run(roundTripVersionId, workspaceId, accountId, roundTripId,
      rebuildId, instrumentId, digest("a"), at, at, digest("d"), at);
  database.prepare(`INSERT INTO journal_trading_days (
  trading_day_id, workspace_id, account_id, trading_date, trading_timezone,
  status, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'America/New_York', 'active', ?, ?)`)
    .run(dayId, workspaceId, accountId, tradingDate, at, at);
  database.exec("COMMIT");
  const scope: WorkspaceAccessScope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: Object.freeze([accountId]),
    activeAccountId: accountId,
  });
  const account: AccountScope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner",
    accountId,
  });
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(database),
    new JournalRuleRepository(database),
  );
  const chat = new CoachAiChatRepository(database);
  const conversationId = chat.createConversation(scope, "Daily review", now).conversationId;
  const sourceMessageId = chat.appendUserMessageAndReserveAssistant(scope, conversationId, {
    originalUserTextPrivate: "Help me draft my notes.",
  }, now).userMessage.messageId;
  return Object.freeze({
    database,
    scope,
    account,
    annotations,
    conversationId,
    sourceMessageId,
    roundTripId,
  });
}

function trustedContext(
  roundTripId: string,
  dailyNoteRevision: number | null,
  tradeNoteRevision: number | null,
): CoachAiDailyCompanionResolvedContext {
  const context: CoachAiDailyCompanionContext = Object.freeze({
    contractVersion: "traderlink_coach_ai_daily_companion_context_v1",
    kind: "daily_review",
    tradingDate,
    timezone: "America/New_York",
    currency: "USD",
    factSetRevisionSha256: digest("e"),
    dayResult: Object.freeze({ netPnlDecimal: "25", tradeCount: 1, tickerCount: 1 }),
    review: Object.freeze({ status: "not_started" }),
    dailyNotes: Object.freeze({
      whatWorked: "Waited for confirmation.",
      whatNeedsWork: "",
      technicalRecap: "Held the support level.",
      currentFocuses: "Protect the first loss.",
      anythingElse: "Original detail.",
    }),
    focusRevisions: Object.freeze([]),
    dayRules: Object.freeze([]),
    trades: Object.freeze([Object.freeze({
      tradeNumber: 1,
      ticker: "TEST",
      direction: "long",
      entryAtUtc: "2026-08-05T13:30:00.000Z",
      exitAtUtc: "2026-08-05T14:00:00.000Z",
      netPnlDecimal: "25",
      gainLossPercentDecimal: "2",
      tradeNote: "Original trade note.",
      tags: Object.freeze([]),
      rules: Object.freeze([]),
    })]),
    openPositions: Object.freeze([]),
    coverage: Object.freeze({
      needsDecisionCount: 0,
      contextTruncated: false,
      limitations: Object.freeze([]),
    }),
  });
  return Object.freeze({
    context,
    dailyNoteRevision,
    trades: Object.freeze([Object.freeze({
      tradeNumber: 1,
      roundTripId,
      noteRevision: tradeNoteRevision,
      ticker: "TEST",
      direction: "long",
    })]),
  });
}

describe("Coach AI Daily Companion confirmation", () => {
  it("saves an edited daily-note field while preserving every untouched field and review state", () => {
    const fixture = context();
    try {
      const initial = fixture.annotations.saveDailyNote(fixture.account, {
        tradingDate,
        expectedRevision: null,
        whatWorked: "Waited for confirmation.",
        whatNeedsWork: "Added too soon.",
        technicalRecap: "Held the support level.",
        tomorrowsFocus: "Protect the first loss.",
        anythingElse: "Original detail.",
        now,
      });
      const repository = new CoachAiDailyCompanionRepository(fixture.database);
      const draft = repository.recordProposedDraft(fixture.scope, {
        conversationId: fixture.conversationId,
        sourceMessageId: fixture.sourceMessageId,
        resolvedContext: trustedContext(fixture.roundTripId, initial.revision, null),
        extraction: Object.freeze({
          kind: "daily_note_draft",
          updates: Object.freeze([Object.freeze({
            field: "whatNeedsWork",
            content: "Waited too long to cut the failed setup.",
          })]),
        }),
      }, now);
      expect(JSON.stringify(draft)).not.toContain(fixture.roundTripId);

      const service = new CoachAiDailyCompanionCommandService(fixture.database);
      const result = service.confirm(fixture.scope, {
        conversationId: fixture.conversationId,
        interactionId: draft.interactionId,
        editedProposal: Object.freeze({
          kind: "daily_note_draft",
          updates: Object.freeze([Object.freeze({
            field: "whatNeedsWork",
            content: "I waited too long to cut the failed setup.",
          })]),
        }),
      }, now);
      expect(result.draft.journalWriteState).toBe("committed");
      expect(fixture.annotations.readDailyNote(fixture.account, tradingDate)).toMatchObject({
        revision: 2,
        whatWorked: "Waited for confirmation.",
        whatNeedsWork: "I waited too long to cut the failed setup.",
        technicalRecap: "Held the support level.",
        tomorrowsFocus: "Protect the first loss.",
        anythingElse: "Original detail.",
      });
      expect(fixture.database.prepare(`SELECT COUNT(*) AS count FROM journal_trading_day_reviews`).get())
        .toEqual({ count: 0 });

      service.confirm(fixture.scope, {
        conversationId: fixture.conversationId,
        interactionId: draft.interactionId,
        editedProposal: draft.proposal,
      }, now);
      expect(fixture.annotations.readDailyNote(fixture.account, tradingDate)?.revision).toBe(2);
    } finally {
      fixture.database.close();
    }
  });

  it("maps a trade number to a server-only round trip and preserves the technical note", () => {
    const fixture = context();
    try {
      const initial = fixture.annotations.saveRoundTripNote(fixture.account, {
        roundTripId: fixture.roundTripId,
        expectedRevision: null,
        technicalNote: "VWAP held.",
        tradeNote: "Original note.",
        now,
      });
      const repository = new CoachAiDailyCompanionRepository(fixture.database);
      const draft = repository.recordProposedDraft(fixture.scope, {
        conversationId: fixture.conversationId,
        sourceMessageId: fixture.sourceMessageId,
        resolvedContext: trustedContext(fixture.roundTripId, null, initial.revision),
        extraction: Object.freeze({
          kind: "trade_note_draft",
          tradeNumber: 1,
          content: "I followed the entry plan.",
        }),
      }, now);
      expect(draft.proposal).toMatchObject({
        kind: "trade_note_draft",
        ticker: "TEST",
        tradeNumber: 1,
      });
      expect(JSON.stringify(draft)).not.toContain(fixture.roundTripId);

      new CoachAiDailyCompanionCommandService(fixture.database).confirm(fixture.scope, {
        conversationId: fixture.conversationId,
        interactionId: draft.interactionId,
        editedProposal: Object.freeze({
          ...draft.proposal,
          content: "I followed the entry plan and waited for confirmation.",
        }),
      }, now);
      expect(fixture.annotations.readRoundTripNotes(fixture.account, [fixture.roundTripId])[
        fixture.roundTripId
      ]).toMatchObject({
        revision: 2,
        technicalNote: "VWAP held.",
        tradeNote: "I followed the entry plan and waited for confirmation.",
      });
    } finally {
      fixture.database.close();
    }
  });

  it("rolls back confirmation when the canonical note changed and rejects without Journal writes", () => {
    const fixture = context();
    try {
      const initial = fixture.annotations.saveDailyNote(fixture.account, {
        tradingDate,
        expectedRevision: null,
        whatWorked: "Original",
        whatNeedsWork: "",
        technicalRecap: "",
        tomorrowsFocus: "Original focus",
        anythingElse: "",
        now,
      });
      const repository = new CoachAiDailyCompanionRepository(fixture.database);
      const stale = repository.recordProposedDraft(fixture.scope, {
        conversationId: fixture.conversationId,
        sourceMessageId: fixture.sourceMessageId,
        resolvedContext: trustedContext(fixture.roundTripId, initial.revision, null),
        extraction: Object.freeze({
          kind: "current_focus_draft",
          currentFocuses: "Wait for A-quality setups.",
        }),
      }, now);
      fixture.annotations.saveDailyNote(fixture.account, {
        tradingDate,
        expectedRevision: initial.revision,
        whatWorked: "Changed elsewhere",
        whatNeedsWork: "",
        technicalRecap: "",
        tomorrowsFocus: "Existing edit",
        anythingElse: "",
        now: new Date("2026-08-05T12:01:00.000Z"),
      });
      const service = new CoachAiDailyCompanionCommandService(fixture.database);
      expect(() => service.confirm(fixture.scope, {
        conversationId: fixture.conversationId,
        interactionId: stale.interactionId,
        editedProposal: stale.proposal,
      }, now)).toThrow("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      expect(repository.readStoredDraft(fixture.scope, stale.interactionId).draft).toMatchObject({
        disposition: "proposed",
        journalWriteState: "not_written",
      });
      expect(fixture.annotations.readDailyNote(fixture.account, tradingDate)).toMatchObject({
        revision: 2,
        tomorrowsFocus: "Existing edit",
      });

      const rejected = repository.recordProposedDraft(fixture.scope, {
        conversationId: fixture.conversationId,
        sourceMessageId: fixture.sourceMessageId,
        resolvedContext: trustedContext(fixture.roundTripId, 2, null),
        extraction: Object.freeze({
          kind: "current_focus_draft",
          currentFocuses: "Another draft",
        }),
      }, now);
      expect(service.reject(fixture.scope, {
        conversationId: fixture.conversationId,
        interactionId: rejected.interactionId,
      }, now).disposition).toBe("rejected");
      expect(fixture.annotations.readDailyNote(fixture.account, tradingDate)?.revision).toBe(2);
    } finally {
      fixture.database.close();
    }
  });
});
