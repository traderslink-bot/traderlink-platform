import "server-only";

import type Database from "better-sqlite3";

import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { ensureJournalTradingDay } from "../trading-days/ensure-journal-trading-day";

export type SharedNoteTypeKey = "what_worked" | "what_needs_work" | "technical_recap" | "general";
export type SharedNoteTarget = Readonly<{ kind: "trading_day"; tradingDate: string }> | Readonly<{ kind: "round_trip"; roundTripId: string }>;
export type SharedNoteType = Readonly<{ noteTypeId: string; displayName: string; revision: number }>;
export type SharedCurrentFocus = Readonly<{ focusText: string; revision: number; showInWorkspace: boolean }>;
export type SharedCategorizedNote = Readonly<{
  category: SharedNoteTypeKey | "custom";
  customType: SharedNoteType | null;
  noteId: string;
  revision: number;
  text: string;
  updatedAtUtc: string;
}>;

const FIXED_TYPES = new Set<SharedNoteTypeKey>(["what_worked", "what_needs_work", "technical_recap", "general"]);

function invalid(field: string): never {
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field });
}

function conflict(): never {
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
}

function text(value: unknown, field: string, maximum: number, required = false): string {
  if (typeof value !== "string") invalid(field);
  const normalized = value.replace(/\r\n?/gu, "\n");
  if (normalized.length > maximum || normalized.includes("\u0000") || (required && !normalized.trim())) {
    invalid(field);
  }
  return normalized;
}

function revision(value: unknown, nullable = false): number | null {
  if (nullable && value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) < 1) conflict();
  return Number(value);
}

function noteTypeName(value: unknown): Readonly<{ displayName: string; normalizedName: string }> {
  const displayName = text(value, "displayName", 80, true).trim().replace(/\s+/gu, " ").normalize("NFKC");
  if (/[\u0000-\u001f\u007f]/u.test(displayName)) invalid("displayName");
  return Object.freeze({ displayName, normalizedName: displayName.toLocaleLowerCase("en-US") });
}

function requireTarget(scope: AccountScope, database: Database.Database, target: SharedNoteTarget, at: string, createMissingDay = false): Readonly<{ kind: "trading_day" | "round_trip"; targetId: string }> | null {
  if (target.kind === "trading_day") {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(target.tradingDate)) invalid("tradingDate");
    const existing = database.prepare(`SELECT trading_day_id FROM journal_trading_days
WHERE workspace_id = ? AND account_id = ? AND trading_date = ? AND status = 'active'
ORDER BY trading_timezone COLLATE BINARY, trading_day_id LIMIT 1`).get(
      scope.workspaceId, scope.accountId, target.tradingDate,
    ) as { trading_day_id: string } | undefined;
    if (existing) return Object.freeze({ kind: "trading_day", targetId: existing.trading_day_id });
    if (!createMissingDay) return null;
    return Object.freeze({
      kind: "trading_day",
      targetId: ensureJournalTradingDay(database, scope, target.tradingDate, at),
    });
  }
  assertCanonicalUuidV4(target.roundTripId, "roundTripId");
  const found = database.prepare(`SELECT 1 AS present FROM journal_round_trips
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ? AND lifecycle_state = 'active'`).get(
    scope.workspaceId, scope.accountId, target.roundTripId,
  );
  if (!found) conflict();
  return Object.freeze({ kind: "round_trip", targetId: target.roundTripId });
}

function mapType(row: { note_type_id: string; display_name: string; revision: number }): SharedNoteType {
  return Object.freeze({ noteTypeId: row.note_type_id, displayName: row.display_name, revision: Number(row.revision) });
}

export class JournalSharedNotesService {
  constructor(private readonly database: Database.Database) {}

  private immediate<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  readCurrentFocus(scope: WorkspaceAccessScope): SharedCurrentFocus | null {
    const row = this.database.prepare(`SELECT focus_text, show_in_workspace, revision
FROM platform_user_current_focuses WHERE user_id = ?`).get(scope.userId) as
      | { focus_text: string; show_in_workspace: number; revision: number } | undefined;
    return row ? Object.freeze({ focusText: row.focus_text, showInWorkspace: row.show_in_workspace === 1, revision: Number(row.revision) }) : null;
  }

  saveCurrentFocus(scope: WorkspaceAccessScope, input: Readonly<{ expectedRevision: unknown; focusText: unknown; showInWorkspace: unknown; now?: Date }>): SharedCurrentFocus {
    const expected = revision(input.expectedRevision, true);
    const focusText = text(input.focusText, "focusText", 10_000);
    if (typeof input.showInWorkspace !== "boolean") invalid("showInWorkspace");
    return this.immediate(() => {
      const current = this.readCurrentFocus(scope);
      if ((current?.revision ?? null) !== expected) conflict();
      const at = createCanonicalUtcTimestamp(input.now);
      if (!current) {
        this.database.prepare(`INSERT INTO platform_user_current_focuses (
  user_id, focus_text, show_in_workspace, revision, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 1, ?, ?)`).run(scope.userId, focusText, input.showInWorkspace ? 1 : 0, at, at);
      } else if (this.database.prepare(`UPDATE platform_user_current_focuses
SET focus_text = ?, show_in_workspace = ?, revision = ?, updated_at_utc = ?
WHERE user_id = ? AND revision = ?`).run(focusText, input.showInWorkspace ? 1 : 0,
        current.revision + 1, at, scope.userId, current.revision).changes !== 1) conflict();
      return this.readCurrentFocus(scope)!;
    });
  }

  listCustomTypes(scope: WorkspaceAccessScope, includeRetired = false): readonly SharedNoteType[] {
    return Object.freeze((this.database.prepare(`SELECT note_type_id, display_name, revision
FROM platform_user_note_types WHERE user_id = ? AND (? = 1 OR lifecycle_state = 'active')
ORDER BY normalized_name COLLATE BINARY, note_type_id`).all(scope.userId, includeRetired ? 1 : 0) as {
      note_type_id: string; display_name: string; revision: number;
    }[]).map(mapType));
  }

  createCustomType(scope: WorkspaceAccessScope, input: Readonly<{ displayName: unknown; now?: Date }>): SharedNoteType {
    const name = noteTypeName(input.displayName);
    if (this.listCustomTypes(scope, true).length >= 50) invalid("customTypeLimit");
    const noteTypeId = createCanonicalUuidV4();
    return this.immediate(() => {
      try {
        const at = createCanonicalUtcTimestamp(input.now);
        this.database.prepare(`INSERT INTO platform_user_note_types (
  note_type_id, user_id, display_name, normalized_name, lifecycle_state, revision, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', 1, ?, ?)`).run(noteTypeId, scope.userId, name.displayName, name.normalizedName, at, at);
      } catch (error) {
        if (String(error).includes("UNIQUE")) conflict();
        throw error;
      }
      return this.listCustomTypes(scope).find((item) => item.noteTypeId === noteTypeId)!;
    });
  }

  retireCustomType(scope: WorkspaceAccessScope, input: Readonly<{ noteTypeId: string; expectedRevision: unknown; now?: Date }>): void {
    assertCanonicalUuidV4(input.noteTypeId, "noteTypeId");
    const expected = revision(input.expectedRevision)!;
    this.immediate(() => {
      const changed = this.database.prepare(`UPDATE platform_user_note_types
SET lifecycle_state = 'retired', revision = revision + 1, updated_at_utc = ?
WHERE note_type_id = ? AND user_id = ? AND lifecycle_state = 'active' AND revision = ?`).run(
        createCanonicalUtcTimestamp(input.now), input.noteTypeId, scope.userId, expected,
      ).changes;
      if (changed !== 1) conflict();
    });
  }

  listCategorizedNotes(scope: AccountScope, target: SharedNoteTarget): readonly SharedCategorizedNote[] {
    const resolved = requireTarget(scope, this.database, target, createCanonicalUtcTimestamp());
    if (!resolved) return Object.freeze([]);
    const targetColumn = resolved.kind === "trading_day" ? "trading_day_id" : "round_trip_id";
    const rows = this.database.prepare(`SELECT n.categorized_note_id, n.note_type_kind, n.fixed_type_key,
  n.revision, n.updated_at_utc, r.note_text, t.note_type_id, t.display_name, t.revision AS type_revision
FROM journal_categorized_notes n
JOIN journal_categorized_note_revisions r
  ON r.workspace_id = n.workspace_id AND r.account_id = n.account_id
 AND r.categorized_note_id = n.categorized_note_id AND r.categorized_note_revision_id = n.current_revision_id
LEFT JOIN platform_user_note_types t ON t.note_type_id = n.custom_note_type_id AND t.user_id = ?
WHERE n.workspace_id = ? AND n.account_id = ? AND n.${targetColumn} = ?
ORDER BY n.updated_at_utc DESC, n.categorized_note_id DESC`).all(scope.userId, scope.workspaceId, scope.accountId, resolved.targetId) as {
      categorized_note_id: string; note_type_kind: "fixed" | "custom"; fixed_type_key: SharedNoteTypeKey | null; revision: number; updated_at_utc: string; note_text: string; note_type_id: string | null; display_name: string | null; type_revision: number | null;
    }[];
    return Object.freeze(rows.map((row) => Object.freeze({
      category: row.note_type_kind === "fixed" ? row.fixed_type_key! : "custom",
      customType: row.note_type_kind === "custom" && row.note_type_id && row.display_name && row.type_revision !== null
        ? Object.freeze({ noteTypeId: row.note_type_id, displayName: row.display_name, revision: Number(row.type_revision) }) : null,
      noteId: row.categorized_note_id, revision: Number(row.revision), text: row.note_text, updatedAtUtc: row.updated_at_utc,
    })));
  }

  saveCategorizedNote(scope: AccountScope, input: Readonly<{ target: SharedNoteTarget; category: unknown; customTypeId?: unknown; text: unknown; expectedRevision: unknown; now?: Date }>): SharedCategorizedNote {
    const category = input.category;
    const isFixed = typeof category === "string" && FIXED_TYPES.has(category as SharedNoteTypeKey);
    const isCustom = category === "custom";
    if (!isFixed && !isCustom) invalid("category");
    const customTypeId = isCustom && typeof input.customTypeId === "string" ? input.customTypeId : null;
    if (isCustom && !customTypeId) invalid("customTypeId");
    if (customTypeId) assertCanonicalUuidV4(customTypeId, "customTypeId");
    const expected = revision(input.expectedRevision, true);
    const noteText = text(input.text, "text", 10_000);
    return this.immediate(() => {
      const at = createCanonicalUtcTimestamp(input.now);
      const target = requireTarget(scope, this.database, input.target, at, true);
      if (!target) conflict();
      if (customTypeId && !this.database.prepare(`SELECT 1 AS present FROM platform_user_note_types
WHERE note_type_id = ? AND user_id = ? AND lifecycle_state = 'active'`).get(customTypeId, scope.userId)) conflict();
      const targetColumn = target.kind === "trading_day" ? "trading_day_id" : "round_trip_id";
      const typeColumn = isFixed ? "fixed_type_key" : "custom_note_type_id";
      const typeValue = isFixed ? category as SharedNoteTypeKey : customTypeId!;
      const current = this.database.prepare(`SELECT categorized_note_id, revision FROM journal_categorized_notes
WHERE workspace_id = ? AND account_id = ? AND ${targetColumn} = ? AND ${typeColumn} = ?`).get(
        scope.workspaceId, scope.accountId, target.targetId, typeValue,
      ) as { categorized_note_id: string; revision: number } | undefined;
      if ((current?.revision ?? null) !== expected) conflict();
      const noteId = current?.categorized_note_id ?? createCanonicalUuidV4();
      const revisionId = createCanonicalUuidV4();
      const nextRevision = (current?.revision ?? 0) + 1;
      if (!current) {
        this.database.prepare(`INSERT INTO journal_categorized_notes (
  categorized_note_id, workspace_id, account_id, target_kind, trading_day_id, round_trip_id,
  note_type_kind, fixed_type_key, custom_note_type_id, current_revision_id, revision,
  created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`).run(noteId, scope.workspaceId,
          scope.accountId, target.kind, target.kind === "trading_day" ? target.targetId : null,
          target.kind === "round_trip" ? target.targetId : null, isFixed ? "fixed" : "custom",
          isFixed ? typeValue : null, isCustom ? typeValue : null, revisionId, scope.userId, at, at);
      } else {
        const changed = this.database.prepare(`UPDATE journal_categorized_notes SET current_revision_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND categorized_note_id = ? AND revision = ?`).run(
          revisionId, nextRevision, at, scope.workspaceId, scope.accountId, noteId, current.revision,
        ).changes;
        if (changed !== 1) conflict();
      }
      this.database.prepare(`INSERT INTO journal_categorized_note_revisions (
  categorized_note_revision_id, workspace_id, account_id, categorized_note_id, revision_number,
  note_text, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(revisionId, scope.workspaceId, scope.accountId,
        noteId, nextRevision, noteText, scope.userId, at);
      return this.listCategorizedNotes(scope, input.target).find((item) => item.noteId === noteId)!;
    });
  }
}
