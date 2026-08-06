import type Database from "better-sqlite3";

import type {
  CoachAiDailyCompanionDraft,
  CoachAiDailyCompanionDraftExtraction,
  CoachAiDailyCompanionDraftProposal,
  CoachAiDailyCompanionResolvedContext,
  CoachAiDailyNoteDraftField,
} from "../contracts/ai-daily-companion-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const TRADING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const PROPOSED_CONTENT_MAX_LENGTH = 32_000;
const DRAFT_CONTENT_MAX_LENGTH = 10_000;
const STORED_DRAFT_VERSION = "traderlink_coach_ai_daily_companion_draft_v1" as const;

type InteractionKind = "daily_note_draft" | "trade_note_draft" | "current_focus_draft";
type StoredDraftContent =
  | Readonly<{
      contractVersion: typeof STORED_DRAFT_VERSION;
      kind: "daily_note_draft";
      factSetRevisionSha256: string;
      expectedRevision: number | null;
      updates: readonly Readonly<{ field: CoachAiDailyNoteDraftField; content: string }>[];
    }>
  | Readonly<{
      contractVersion: typeof STORED_DRAFT_VERSION;
      kind: "trade_note_draft";
      factSetRevisionSha256: string;
      expectedRevision: number | null;
      tradeNumber: number;
      roundTripId: string;
      ticker: string;
      direction: "long" | "short";
      content: string;
    }>
  | Readonly<{
      contractVersion: typeof STORED_DRAFT_VERSION;
      kind: "current_focus_draft";
      factSetRevisionSha256: string;
      expectedRevision: number | null;
      currentFocuses: string;
    }>;

type InteractionRow = Readonly<{
  interactionId: string;
  conversationId: string;
  sourceMessageId: string;
  tradingDate: string;
  interactionKind: InteractionKind;
  proposedContentJson: string;
  journalWriteState: CoachAiDailyCompanionDraft["journalWriteState"];
  disposition: CoachAiDailyCompanionDraft["disposition"];
  createdAtUtc: string;
  resolvedAtUtc: string | null;
}>;

export type CoachAiDailyCompanionStoredDraft = Readonly<{
  draft: CoachAiDailyCompanionDraft;
  storedContent: StoredDraftContent;
}>;

const DRAFT_SELECT = `SELECT
  coach_ai_daily_companion_interaction_id AS interactionId,
  coach_ai_chat_conversation_id AS conversationId,
  source_message_id AS sourceMessageId,
  trading_date AS tradingDate,
  interaction_kind AS interactionKind,
  proposed_content_json AS proposedContentJson,
  journal_write_state AS journalWriteState,
  disposition,
  created_at_utc AS createdAtUtc,
  resolved_at_utc AS resolvedAtUtc
FROM coach_ai_daily_companion_interactions`;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

function verifiedAccountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0 ||
      value.length > DRAFT_CONTENT_MAX_LENGTH || value.includes("\u0000")) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value.replace(/\r\n?/gu, "\n");
}

function revision(value: unknown): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field: "annotationRevision" });
  }
  return Number(value);
}

function storedContent(value: unknown): StoredDraftContent {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
  }
  const item = value as Record<string, unknown>;
  if (item.contractVersion !== STORED_DRAFT_VERSION ||
      typeof item.factSetRevisionSha256 !== "string" ||
      !SHA256_PATTERN.test(item.factSetRevisionSha256)) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
  }
  const expectedRevision = revision(item.expectedRevision);
  if (item.kind === "daily_note_draft") {
    if (!Array.isArray(item.updates) || item.updates.length < 1 || item.updates.length > 4) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
    }
    const allowed = new Set<CoachAiDailyNoteDraftField>([
      "whatWorked", "whatNeedsWork", "technicalRecap", "anythingElse",
    ]);
    const updates = item.updates.map((update) => {
      if (!update || Array.isArray(update) || typeof update !== "object") {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
      }
      const row = update as Record<string, unknown>;
      if (!allowed.has(row.field as CoachAiDailyNoteDraftField)) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
      }
      return Object.freeze({
        field: row.field as CoachAiDailyNoteDraftField,
        content: text(row.content, "dailyNoteDraft"),
      });
    });
    if (new Set(updates.map((update) => update.field)).size !== updates.length) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
    }
    return Object.freeze({
      contractVersion: STORED_DRAFT_VERSION,
      kind: item.kind,
      factSetRevisionSha256: item.factSetRevisionSha256,
      expectedRevision,
      updates: Object.freeze(updates),
    });
  }
  if (item.kind === "trade_note_draft") {
    if (!Number.isSafeInteger(item.tradeNumber) || Number(item.tradeNumber) <= 0 ||
        typeof item.roundTripId !== "string" || typeof item.ticker !== "string" ||
        (item.direction !== "long" && item.direction !== "short")) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
    }
    assertCanonicalUuidV4(item.roundTripId, "roundTripId");
    return Object.freeze({
      contractVersion: STORED_DRAFT_VERSION,
      kind: item.kind,
      factSetRevisionSha256: item.factSetRevisionSha256,
      expectedRevision,
      tradeNumber: Number(item.tradeNumber),
      roundTripId: item.roundTripId,
      ticker: item.ticker,
      direction: item.direction,
      content: text(item.content, "tradeNoteDraft"),
    });
  }
  if (item.kind === "current_focus_draft") {
    return Object.freeze({
      contractVersion: STORED_DRAFT_VERSION,
      kind: item.kind,
      factSetRevisionSha256: item.factSetRevisionSha256,
      expectedRevision,
      currentFocuses: text(item.currentFocuses, "currentFocusDraft"),
    });
  }
  platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
}

function publicProposal(content: StoredDraftContent): CoachAiDailyCompanionDraftProposal {
  if (content.kind === "daily_note_draft") {
    return Object.freeze({ kind: content.kind, updates: content.updates });
  }
  if (content.kind === "trade_note_draft") {
    return Object.freeze({
      kind: content.kind,
      tradeNumber: content.tradeNumber,
      ticker: content.ticker,
      direction: content.direction,
      content: content.content,
    });
  }
  return Object.freeze({ kind: content.kind, currentFocuses: content.currentFocuses });
}

function draftRecord(row: InteractionRow): CoachAiDailyCompanionStoredDraft {
  const content = storedContent(JSON.parse(row.proposedContentJson) as unknown);
  if (content.kind !== row.interactionKind) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { component: "dailyCompanionDraft" });
  }
  return Object.freeze({
    draft: Object.freeze({
      interactionId: row.interactionId,
      conversationId: row.conversationId,
      sourceMessageId: row.sourceMessageId,
      tradingDate: row.tradingDate,
      proposal: publicProposal(content),
      disposition: row.disposition,
      journalWriteState: row.journalWriteState,
      createdAtUtc: row.createdAtUtc,
      resolvedAtUtc: row.resolvedAtUtc,
    }),
    storedContent: content,
  });
}

function proposedContentJson(content: StoredDraftContent): string {
  const value = JSON.stringify(canonicalize(content));
  if (value.length < 2 || value.length > PROPOSED_CONTENT_MAX_LENGTH) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "proposedContent" });
  }
  return value;
}

export class CoachAiDailyCompanionRepository {
  constructor(private readonly database: Database.Database) {}

  runAtomically<Value>(operation: () => Value): Value {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  recordProposedReflection(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      sourceMessageId: string;
      tradingDate: string;
      proposedContent: unknown;
    }>,
    now = new Date(),
  ): string {
    const accountId = verifiedAccountId(scope);
    assertCanonicalUuidV4(input.conversationId, "conversationId");
    assertCanonicalUuidV4(input.sourceMessageId, "sourceMessageId");
    if (!TRADING_DATE_PATTERN.test(input.tradingDate) || !input.proposedContent ||
        typeof input.proposedContent !== "object" || Array.isArray(input.proposedContent)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "proposedContent" });
    }
    const json = JSON.stringify(canonicalize(input.proposedContent));
    if (json.length < 2 || json.length > PROPOSED_CONTENT_MAX_LENGTH) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "proposedContent" });
    }
    const interactionId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO coach_ai_daily_companion_interactions (
  coach_ai_daily_companion_interaction_id, coach_ai_chat_conversation_id, source_message_id,
  user_id, workspace_id, account_id, trading_date, interaction_kind,
  proposed_content_json, journal_write_state, canonical_journal_command,
  canonical_journal_reference, write_failure_code, disposition, created_at_utc, resolved_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'daily_reflection', ?, 'not_written', NULL, NULL, NULL,
  'proposed', ?, NULL)`).run(
      interactionId, input.conversationId, input.sourceMessageId, scope.userId,
      scope.workspaceId, accountId, input.tradingDate, json, createCanonicalUtcTimestamp(now),
    );
    return interactionId;
  }

  recordProposedDraft(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      conversationId: string;
      sourceMessageId: string;
      resolvedContext: CoachAiDailyCompanionResolvedContext;
      extraction: CoachAiDailyCompanionDraftExtraction;
    }>,
    now = new Date(),
  ): CoachAiDailyCompanionDraft {
    const accountId = verifiedAccountId(scope);
    assertCanonicalUuidV4(input.conversationId, "conversationId");
    assertCanonicalUuidV4(input.sourceMessageId, "sourceMessageId");
    const context = input.resolvedContext.context;
    let content: StoredDraftContent;
    if (input.extraction.kind === "daily_note_draft") {
      content = storedContent({
        contractVersion: STORED_DRAFT_VERSION,
        kind: input.extraction.kind,
        factSetRevisionSha256: context.factSetRevisionSha256,
        expectedRevision: input.resolvedContext.dailyNoteRevision,
        updates: input.extraction.updates,
      });
    } else if (input.extraction.kind === "current_focus_draft") {
      content = storedContent({
        contractVersion: STORED_DRAFT_VERSION,
        kind: input.extraction.kind,
        factSetRevisionSha256: context.factSetRevisionSha256,
        expectedRevision: input.resolvedContext.dailyNoteRevision,
        currentFocuses: input.extraction.currentFocuses,
      });
    } else {
      const target = input.resolvedContext.trades.find((trade) =>
        trade.tradeNumber === input.extraction.tradeNumber);
      if (!target) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "dailyCompanionTradeNumber",
        });
      }
      content = storedContent({
        contractVersion: STORED_DRAFT_VERSION,
        kind: input.extraction.kind,
        factSetRevisionSha256: context.factSetRevisionSha256,
        expectedRevision: target.noteRevision,
        tradeNumber: target.tradeNumber,
        roundTripId: target.roundTripId,
        ticker: target.ticker,
        direction: target.direction,
        content: input.extraction.content,
      });
    }
    const interactionId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO coach_ai_daily_companion_interactions (
  coach_ai_daily_companion_interaction_id, coach_ai_chat_conversation_id, source_message_id,
  user_id, workspace_id, account_id, trading_date, interaction_kind,
  proposed_content_json, journal_write_state, canonical_journal_command,
  canonical_journal_reference, write_failure_code, disposition, created_at_utc, resolved_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_written', NULL, NULL, NULL,
  'proposed', ?, NULL)`).run(
      interactionId, input.conversationId, input.sourceMessageId, scope.userId,
      scope.workspaceId, accountId, context.tradingDate, content.kind,
      proposedContentJson(content), createCanonicalUtcTimestamp(now),
    );
    return this.readStoredDraft(scope, interactionId).draft;
  }

  listDrafts(
    scope: WorkspaceAccessScope,
    input: Readonly<{ conversationId: string; limit?: number }>,
  ): readonly CoachAiDailyCompanionDraft[] {
    const accountId = verifiedAccountId(scope);
    assertCanonicalUuidV4(input.conversationId, "conversationId");
    const limit = input.limit ?? 50;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    const rows = this.database.prepare<[string, string, string, string, number], InteractionRow>(`${DRAFT_SELECT}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND coach_ai_chat_conversation_id = ?
  AND interaction_kind IN ('daily_note_draft', 'trade_note_draft', 'current_focus_draft')
ORDER BY created_at_utc DESC, coach_ai_daily_companion_interaction_id DESC
LIMIT ?`).all(scope.userId, scope.workspaceId, accountId, input.conversationId, limit);
    return Object.freeze(rows.map((row) => draftRecord(row).draft));
  }

  readStoredDraft(
    scope: WorkspaceAccessScope,
    interactionId: string,
  ): CoachAiDailyCompanionStoredDraft {
    const accountId = verifiedAccountId(scope);
    assertCanonicalUuidV4(interactionId, "interactionId");
    const row = this.database.prepare<[string, string, string, string], InteractionRow>(`${DRAFT_SELECT}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND coach_ai_daily_companion_interaction_id = ?
  AND interaction_kind IN ('daily_note_draft', 'trade_note_draft', 'current_focus_draft')`).get(
      scope.userId, scope.workspaceId, accountId, interactionId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return draftRecord(row);
  }

  accept(scope: WorkspaceAccessScope, interactionId: string, now = new Date()): CoachAiDailyCompanionStoredDraft {
    const current = this.readStoredDraft(scope, interactionId);
    if (current.draft.disposition !== "proposed" || current.draft.journalWriteState !== "not_written") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const result = this.database.prepare(`UPDATE coach_ai_daily_companion_interactions
SET disposition = 'accepted', resolved_at_utc = ?
WHERE coach_ai_daily_companion_interaction_id = ? AND disposition = 'proposed'
  AND journal_write_state = 'not_written'`).run(
      createCanonicalUtcTimestamp(now), interactionId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.readStoredDraft(scope, interactionId);
  }

  markCommitPending(scope: WorkspaceAccessScope, interactionId: string): CoachAiDailyCompanionStoredDraft {
    this.readStoredDraft(scope, interactionId);
    const result = this.database.prepare(`UPDATE coach_ai_daily_companion_interactions
SET journal_write_state = 'commit_pending', canonical_journal_command = 'journal_annotation_save'
WHERE coach_ai_daily_companion_interaction_id = ? AND disposition = 'accepted'
  AND journal_write_state = 'not_written'`).run(interactionId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.readStoredDraft(scope, interactionId);
  }

  markCommitted(
    scope: WorkspaceAccessScope,
    interactionId: string,
    canonicalJournalReference: string,
  ): CoachAiDailyCompanionStoredDraft {
    if (canonicalJournalReference.length < 1 || canonicalJournalReference.length > 128) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "canonicalJournalReference",
      });
    }
    this.readStoredDraft(scope, interactionId);
    const result = this.database.prepare(`UPDATE coach_ai_daily_companion_interactions
SET journal_write_state = 'committed', canonical_journal_reference = ?
WHERE coach_ai_daily_companion_interaction_id = ? AND disposition = 'accepted'
  AND journal_write_state = 'commit_pending'`).run(canonicalJournalReference, interactionId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.readStoredDraft(scope, interactionId);
  }

  reject(scope: WorkspaceAccessScope, interactionId: string, now = new Date()): CoachAiDailyCompanionDraft {
    const current = this.readStoredDraft(scope, interactionId);
    if (current.draft.disposition === "rejected") return current.draft;
    if (current.draft.disposition !== "proposed" || current.draft.journalWriteState !== "not_written") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const result = this.database.prepare(`UPDATE coach_ai_daily_companion_interactions
SET disposition = 'rejected', resolved_at_utc = ?
WHERE coach_ai_daily_companion_interaction_id = ? AND disposition = 'proposed'
  AND journal_write_state = 'not_written'`).run(
      createCanonicalUtcTimestamp(now), interactionId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    return this.readStoredDraft(scope, interactionId).draft;
  }
}
