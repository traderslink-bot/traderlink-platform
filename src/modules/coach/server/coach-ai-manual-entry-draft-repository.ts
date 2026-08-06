import type Database from "better-sqlite3";

import {
  COACH_AI_MANUAL_ENTRY_DRAFT_CONTRACT_VERSION,
  areCoachAiManualExecutionDraftRowsReady,
  canTransitionCoachAiManualEntryDraftState,
  type CoachAiManualEntryDraft,
  type CoachAiManualEntryDraftState,
  type CoachAiManualEntryDraftWriteState,
  type CoachAiManualExecutionDraftRow,
  type CoachAiManualExecutionExtractionRow,
} from "@/src/modules/coach/contracts/ai-manual-entry-draft-contracts";
import {
  assertCanonicalJournalDecimal,
  assertJournalCurrency,
  assertJournalTimezone,
  assertJournalTradingDate,
} from "@/src/modules/journal/contracts/journal-storage-values";
import { normalizeJournalExecutionLocalTime, normalizeJournalStockSymbol } from "@/src/modules/journal/server/imports/journal-value-normalization";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  assertCanonicalUtcTimestamp,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const DRAFT_ROWS_MAX_LENGTH = 64_000;
const DRAFT_ROWS_MAX_COUNT = 200;
const PAGE_MAX_LIMIT = 100;
const CLIENT_ROW_REF_PATTERN = /^[A-Za-z0-9_-]{1,64}$/u;
const LOCAL_TIME_PATTERN = /^\d{2}:\d{2}:\d{2}$/u;
const JOURNAL_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{1,128}$/u;
const WRITE_FAILURE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,95}$/u;

type ScopeRecord = Readonly<{ accountId: string }>;

type SourceMessageRecord = Readonly<{ sourceMessageId: string }>;

type DraftRow = Readonly<{
  coach_ai_manual_entry_draft_id: string;
  coach_ai_chat_conversation_id: string;
  source_message_id: string;
  draft_rows_json: string;
  journal_write_state: CoachAiManualEntryDraftWriteState;
  canonical_journal_command: "journal_manual_execution_commit" | null;
  canonical_journal_reference: string | null;
  write_failure_code: string | null;
  state: CoachAiManualEntryDraftState;
  created_at_utc: string;
  updated_at_utc: string;
  expires_at_utc: string | null;
  finalized_at_utc: string | null;
}>;

export type CoachAiManualEntryDraftCreateInput = Readonly<{
  conversationId: string;
  sourceMessageId: string;
  sourceTimezone: string;
  tradeCurrency: string;
  state: "draft" | "ready_for_confirmation";
  rows: readonly CoachAiManualExecutionExtractionRow[];
  expiresAtUtc?: string | null;
}>;

export type CoachAiManualEntryDraftListInput = Readonly<{
  conversationId: string;
  state?: CoachAiManualEntryDraftState;
  limit?: number;
}>;

export type CoachAiManualEntryDraftTransition = Readonly<{
  state: CoachAiManualEntryDraftState;
  canonicalJournalReference?: string;
  writeFailureCode?: string;
}>;

function assertRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value as Record<string, unknown>;
}

function assertText(value: unknown, field: string, maximumLength = 128): string {
  if (typeof value !== "string" || value.length < 1 || value.length > maximumLength) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function optionalText(value: unknown, field: string, maximumLength = 128): string | null {
  if (value === null || value === undefined) return null;
  return assertText(value, field, maximumLength);
}

function assertState(value: unknown, field = "state"): CoachAiManualEntryDraftState {
  if (value !== "draft" && value !== "ready_for_confirmation" && value !== "confirmed_by_trader" &&
      value !== "commit_pending" && value !== "committed" && value !== "write_failed" &&
      value !== "expired" && value !== "archived") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function assertLocalTime(value: unknown, field: string, localDate: string | null, sourceTimezone: string): string | null {
  if (value === null || value === undefined) return null;
  const localTime = assertText(value, field, 8);
  if (!LOCAL_TIME_PATTERN.test(localTime)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  if (localDate !== null) {
    normalizeJournalExecutionLocalTime(`${localDate}, ${localTime}`, sourceTimezone);
  }
  return localTime;
}

function assertNullableCanonicalDecimal(
  value: unknown,
  field: string,
  options: Readonly<{ positive?: boolean; nonNegative?: boolean }>,
): string | null {
  if (value === null || value === undefined) return null;
  const decimal = assertText(value, field, 128);
  assertCanonicalJournalDecimal(decimal, field, options);
  return decimal;
}

function extractionRow(
  value: unknown,
  sourceTimezone: string,
): CoachAiManualExecutionExtractionRow {
  const input = assertRecord(value, "draftRow");
  const clientRowRef = assertText(input.clientRowRef, "clientRowRef", 64);
  if (!CLIENT_ROW_REF_PATTERN.test(clientRowRef)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "clientRowRef" });
  }
  const localDate = optionalText(input.localDate, "localDate", 10);
  if (localDate !== null) assertJournalTradingDate(localDate, "localDate");
  const localTime = assertLocalTime(input.localTime, "localTime", localDate, sourceTimezone);
  const normalizedSymbol = optionalText(input.normalizedSymbol, "normalizedSymbol", 32);
  if (normalizedSymbol !== null && normalizeJournalStockSymbol(normalizedSymbol) !== normalizedSymbol) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "normalizedSymbol" });
  }
  const side = input.side === null || input.side === undefined ? null : input.side;
  if (side !== null && side !== "buy" && side !== "sell") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "side" });
  }
  return Object.freeze({
    clientRowRef,
    localDate,
    localTime,
    normalizedSymbol,
    side,
    quantityDecimal: assertNullableCanonicalDecimal(input.quantityDecimal, "quantityDecimal", { positive: true }),
    priceDecimal: assertNullableCanonicalDecimal(input.priceDecimal, "priceDecimal", { positive: true }),
    feesDecimal: assertNullableCanonicalDecimal(input.feesDecimal, "feesDecimal", { nonNegative: true }),
  });
}

function canonicalRows(
  value: unknown,
  sourceTimezone: string,
  tradeCurrency: string,
): readonly CoachAiManualExecutionDraftRow[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > DRAFT_ROWS_MAX_COUNT) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "rows" });
  }
  const rows = value.map((item) => Object.freeze({
    ...extractionRow(item, sourceTimezone),
    sourceTimezone,
    tradeCurrency,
  }));
  if (new Set(rows.map((row) => row.clientRowRef)).size !== rows.length) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "clientRowRef" });
  }
  return Object.freeze(rows);
}

function persistedRows(value: unknown): readonly CoachAiManualExecutionDraftRow[] {
  if (!Array.isArray(value) || value.length < 1) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
  }
  const rawFirst = assertRecord(value[0], "draftRowsJson");
  const sourceTimezone = assertText(rawFirst.sourceTimezone, "sourceTimezone", 64);
  const tradeCurrency = assertText(rawFirst.tradeCurrency, "tradeCurrency", 3);
  assertJournalTimezone(sourceTimezone, "sourceTimezone");
  assertJournalCurrency(tradeCurrency, "tradeCurrency");
  const rows = canonicalRows(value, sourceTimezone, tradeCurrency);
  if (value.some((item) => {
    const row = assertRecord(item, "draftRowsJson");
    return row.sourceTimezone !== sourceTimezone || row.tradeCurrency !== tradeCurrency;
  })) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
  }
  return rows;
}

function serializeRows(rows: readonly CoachAiManualExecutionDraftRow[]): string {
  const json = JSON.stringify(rows);
  if (json.length < 2 || json.length > DRAFT_ROWS_MAX_LENGTH) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "rows" });
  }
  return json;
}

function draftRecord(row: DraftRow): CoachAiManualEntryDraft {
  let rows: readonly CoachAiManualExecutionDraftRow[];
  try {
    rows = persistedRows(JSON.parse(row.draft_rows_json));
  } catch {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
  }
  return Object.freeze({
    contractVersion: COACH_AI_MANUAL_ENTRY_DRAFT_CONTRACT_VERSION,
    draftId: row.coach_ai_manual_entry_draft_id,
    conversationId: row.coach_ai_chat_conversation_id,
    sourceMessageId: row.source_message_id,
    state: row.state,
    journalWriteState: row.journal_write_state,
    canonicalJournalCommand: row.canonical_journal_command,
    canonicalJournalReference: row.canonical_journal_reference,
    writeFailureCode: row.write_failure_code,
    rows,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
    expiresAtUtc: row.expires_at_utc,
    finalizedAtUtc: row.finalized_at_utc,
  });
}

function assertExpiry(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const timestamp = assertText(value, "expiresAtUtc", 24);
  assertCanonicalUtcTimestamp(timestamp, "expiresAtUtc");
  return timestamp;
}

export class CoachAiManualEntryDraftRepository {
  constructor(private readonly database: Database.Database) {}

  private transaction<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  /** Coordinates a draft state transition with a later canonical Journal command. */
  runAtomically<T>(operation: () => T): T {
    return this.transaction(operation);
  }

  private verifiedAccountId(scope: WorkspaceAccessScope): string {
    if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const row = this.database.prepare<[string, string, string], ScopeRecord>(`SELECT account.account_id AS accountId
FROM platform_users user
JOIN platform_workspaces workspace ON workspace.workspace_id = ?
JOIN platform_workspace_memberships membership
  ON membership.workspace_id = workspace.workspace_id AND membership.user_id = user.user_id
JOIN journal_accounts account ON account.account_id = ? AND account.workspace_id = workspace.workspace_id
WHERE user.user_id = ? AND user.status = 'active' AND workspace.status = 'active'
  AND membership.status = 'active' AND account.status = 'active'`).get(
      scope.workspaceId, scope.activeAccountId, scope.userId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row.accountId;
  }

  private conversation(scope: WorkspaceAccessScope, conversationId: string, accountId: string): void {
    assertCanonicalUuidV4(conversationId, "conversationId");
    const row = this.database.prepare<[string, string, string, string], ScopeRecord>(`SELECT account_id AS accountId
FROM coach_ai_chat_conversations
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      conversationId, scope.userId, scope.workspaceId, accountId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }

  private sourceUserMessage(
    scope: WorkspaceAccessScope,
    conversationId: string,
    sourceMessageId: string,
    accountId: string,
  ): void {
    assertCanonicalUuidV4(sourceMessageId, "sourceMessageId");
    const row = this.database.prepare<[string, string, string, string, string], SourceMessageRecord>(`SELECT
  coach_ai_chat_message_id AS sourceMessageId
FROM coach_ai_chat_messages
WHERE coach_ai_chat_message_id = ? AND coach_ai_chat_conversation_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ? AND role = 'user'`).get(
      sourceMessageId, conversationId, scope.userId, scope.workspaceId, accountId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }

  private draft(scope: WorkspaceAccessScope, draftId: string, accountId: string): DraftRow {
    assertCanonicalUuidV4(draftId, "draftId");
    const row = this.database.prepare<[string, string, string, string], DraftRow>(`SELECT
  coach_ai_manual_entry_draft_id, coach_ai_chat_conversation_id, source_message_id,
  draft_rows_json, journal_write_state, canonical_journal_command,
  canonical_journal_reference, write_failure_code, state, created_at_utc,
  updated_at_utc, expires_at_utc, finalized_at_utc
FROM coach_ai_manual_entry_drafts
WHERE coach_ai_manual_entry_draft_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).get(
      draftId, scope.userId, scope.workspaceId, accountId,
    );
    if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return row;
  }

  createDraft(
    scope: WorkspaceAccessScope,
    input: CoachAiManualEntryDraftCreateInput,
    now = new Date(),
  ): CoachAiManualEntryDraft {
    return this.runAtomically(() => {
      const accountId = this.verifiedAccountId(scope);
      this.conversation(scope, input.conversationId, accountId);
      this.sourceUserMessage(scope, input.conversationId, input.sourceMessageId, accountId);
      const sourceTimezone = assertText(input.sourceTimezone, "sourceTimezone", 64);
      const tradeCurrency = assertText(input.tradeCurrency, "tradeCurrency", 3);
      assertJournalTimezone(sourceTimezone, "sourceTimezone");
      assertJournalCurrency(tradeCurrency, "tradeCurrency");
      if (input.state !== "draft" && input.state !== "ready_for_confirmation") {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "state" });
      }
      const rows = canonicalRows(input.rows, sourceTimezone, tradeCurrency);
      if (input.state === "ready_for_confirmation" && !areCoachAiManualExecutionDraftRowsReady(rows)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "rows" });
      }
      const draftId = createCanonicalUuidV4();
      const createdAtUtc = createCanonicalUtcTimestamp(now);
      const expiresAtUtc = assertExpiry(input.expiresAtUtc);
      this.database.prepare(`INSERT INTO coach_ai_manual_entry_drafts (
  coach_ai_manual_entry_draft_id, coach_ai_chat_conversation_id, source_message_id,
  user_id, workspace_id, account_id, draft_kind, draft_rows_json, journal_write_state,
  canonical_journal_command, canonical_journal_reference, write_failure_code, state,
  created_at_utc, updated_at_utc, expires_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'manual_execution_draft', ?, 'not_written', NULL, NULL, NULL,
  ?, ?, ?, ?, NULL)`).run(
        draftId, input.conversationId, input.sourceMessageId, scope.userId, scope.workspaceId, accountId,
        serializeRows(rows), input.state, createdAtUtc, createdAtUtc, expiresAtUtc,
      );
      return draftRecord(this.draft(scope, draftId, accountId));
    });
  }

  readDraft(scope: WorkspaceAccessScope, draftId: string): CoachAiManualEntryDraft {
    const accountId = this.verifiedAccountId(scope);
    return draftRecord(this.draft(scope, draftId, accountId));
  }

  readDraftForSourceMessage(
    scope: WorkspaceAccessScope,
    conversationId: string,
    sourceMessageId: string,
  ): CoachAiManualEntryDraft | null {
    const accountId = this.verifiedAccountId(scope);
    this.conversation(scope, conversationId, accountId);
    this.sourceUserMessage(scope, conversationId, sourceMessageId, accountId);
    const row = this.database.prepare<[string, string, string, string, string], DraftRow>(`SELECT
  coach_ai_manual_entry_draft_id, coach_ai_chat_conversation_id, source_message_id,
  draft_rows_json, journal_write_state, canonical_journal_command,
  canonical_journal_reference, write_failure_code, state, created_at_utc,
  updated_at_utc, expires_at_utc, finalized_at_utc
FROM coach_ai_manual_entry_drafts
WHERE coach_ai_chat_conversation_id = ? AND source_message_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?
ORDER BY created_at_utc ASC, coach_ai_manual_entry_draft_id ASC
LIMIT 1`).get(conversationId, sourceMessageId, scope.userId, scope.workspaceId, accountId);
    return row ? draftRecord(row) : null;
  }

  listDrafts(
    scope: WorkspaceAccessScope,
    input: CoachAiManualEntryDraftListInput,
  ): readonly CoachAiManualEntryDraft[] {
    const accountId = this.verifiedAccountId(scope);
    this.conversation(scope, input.conversationId, accountId);
    const limit = input.limit ?? 50;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > PAGE_MAX_LIMIT) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    const state = input.state === undefined ? null : assertState(input.state);
    const rows = this.database.prepare<[string, string, string, string, CoachAiManualEntryDraftState | null, number], DraftRow>(`SELECT
  coach_ai_manual_entry_draft_id, coach_ai_chat_conversation_id, source_message_id,
  draft_rows_json, journal_write_state, canonical_journal_command,
  canonical_journal_reference, write_failure_code, state, created_at_utc,
  updated_at_utc, expires_at_utc, finalized_at_utc
FROM coach_ai_manual_entry_drafts
WHERE coach_ai_chat_conversation_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?
  AND (? IS NULL OR state = ?)
ORDER BY updated_at_utc DESC, coach_ai_manual_entry_draft_id DESC
LIMIT ?`).all(input.conversationId, scope.userId, scope.workspaceId, accountId, state, state, limit);
    return Object.freeze(rows.map(draftRecord));
  }

  replaceDraftRows(
    scope: WorkspaceAccessScope,
    draftId: string,
    rows: readonly CoachAiManualExecutionExtractionRow[],
    now = new Date(),
  ): CoachAiManualEntryDraft {
    return this.runAtomically(() => {
      const accountId = this.verifiedAccountId(scope);
      const existing = draftRecord(this.draft(scope, draftId, accountId));
      if (existing.state !== "draft" && existing.state !== "ready_for_confirmation") {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "draftRows" });
      }
      const replacement = canonicalRows(rows, existing.rows[0]!.sourceTimezone, existing.rows[0]!.tradeCurrency);
      if (existing.state === "ready_for_confirmation" && !areCoachAiManualExecutionDraftRowsReady(replacement)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "rows" });
      }
      this.database.prepare(`UPDATE coach_ai_manual_entry_drafts
SET draft_rows_json = ?, updated_at_utc = ?
WHERE coach_ai_manual_entry_draft_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).run(
        serializeRows(replacement), createCanonicalUtcTimestamp(now), draftId,
        scope.userId, scope.workspaceId, accountId,
      );
      return draftRecord(this.draft(scope, draftId, accountId));
    });
  }

  transitionDraft(
    scope: WorkspaceAccessScope,
    draftId: string,
    input: CoachAiManualEntryDraftTransition,
    now = new Date(),
  ): CoachAiManualEntryDraft {
    return this.runAtomically(() => {
      const accountId = this.verifiedAccountId(scope);
      const existing = draftRecord(this.draft(scope, draftId, accountId));
      const nextState = assertState(input.state);
      if (!canTransitionCoachAiManualEntryDraftState(existing.state, nextState)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "state" });
      }
      if (nextState === "ready_for_confirmation" && !areCoachAiManualExecutionDraftRowsReady(existing.rows)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "rows" });
      }
      const timestamp = createCanonicalUtcTimestamp(now);
      const journalWriteState: CoachAiManualEntryDraftWriteState = nextState === "commit_pending"
        ? "commit_pending"
        : nextState === "committed"
          ? "committed"
          : nextState === "write_failed"
            ? "write_failed"
            : "not_written";
      const canonicalJournalCommand = nextState === "commit_pending" || nextState === "committed" || nextState === "write_failed"
        ? "journal_manual_execution_commit"
        : null;
      const canonicalJournalReference = nextState === "committed"
        ? assertText(input.canonicalJournalReference, "canonicalJournalReference", 128)
        : null;
      if (canonicalJournalReference !== null && !JOURNAL_REFERENCE_PATTERN.test(canonicalJournalReference)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "canonicalJournalReference" });
      }
      const writeFailureCode = nextState === "write_failed"
        ? assertText(input.writeFailureCode, "writeFailureCode", 96)
        : null;
      if (writeFailureCode !== null && !WRITE_FAILURE_CODE_PATTERN.test(writeFailureCode)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "writeFailureCode" });
      }
      const finalizedAtUtc = nextState === "committed" || nextState === "write_failed" ||
        nextState === "expired" || nextState === "archived" ? timestamp : null;
      this.database.prepare(`UPDATE coach_ai_manual_entry_drafts
SET journal_write_state = ?, canonical_journal_command = ?, canonical_journal_reference = ?,
  write_failure_code = ?, state = ?, updated_at_utc = ?, finalized_at_utc = ?
WHERE coach_ai_manual_entry_draft_id = ? AND user_id = ? AND workspace_id = ? AND account_id = ?`).run(
        journalWriteState, canonicalJournalCommand, canonicalJournalReference, writeFailureCode,
        nextState, timestamp, finalizedAtUtc, draftId, scope.userId, scope.workspaceId, accountId,
      );
      return draftRecord(this.draft(scope, draftId, accountId));
    });
  }
}
