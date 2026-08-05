import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalSwingNoteRow = Readonly<{
  swingDailyNoteId: string;
  roundTripId: string;
  reviewDate: string;
  note: string;
  nextSessionPlan: string | null;
  revision: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

function idempotencyDigest(input: Readonly<{
  scope: AccountScope;
  idempotencyKey: string;
  roundTripId: string;
  reviewDate: string;
}>): string {
  return createHash("sha256").update([
    "journal-swing-note-idempotency-v1",
    input.scope.workspaceId,
    input.scope.accountId,
    input.scope.userId,
    input.idempotencyKey,
    input.roundTripId,
    input.reviewDate,
  ].join("\u001f"), "utf8").digest("hex");
}

function mapNote(row: {
  swing_daily_note_id: string;
  round_trip_id: string;
  review_date: string;
  note_text: string;
  next_session_plan_text: string | null;
  current_revision: number;
  created_at_utc: string;
  updated_at_utc: string;
}): JournalSwingNoteRow {
  return Object.freeze({
    swingDailyNoteId: row.swing_daily_note_id,
    roundTripId: row.round_trip_id,
    reviewDate: row.review_date,
    note: row.note_text,
    nextSessionPlan: row.next_session_plan_text,
    revision: row.current_revision,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

const NOTE_SELECT = `SELECT swing_daily_note_id, round_trip_id, review_date,
 note_text, next_session_plan_text, current_revision, created_at_utc,
 updated_at_utc
FROM journal_swing_daily_notes`;

export class JournalSwingNoteRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  find(
    scope: AccountScope,
    roundTripId: string,
    reviewDate: string,
  ): JournalSwingNoteRow | null {
    const row = this.database.prepare(`${NOTE_SELECT}
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?
  AND review_date = ?`).get(
      scope.workspaceId,
      scope.accountId,
      roundTripId,
      reviewDate,
    ) as Parameters<typeof mapNote>[0] | undefined;
    return row ? mapNote(row) : null;
  }

  list(scope: AccountScope, roundTripId: string): readonly JournalSwingNoteRow[] {
    const rows = this.database.prepare(`${NOTE_SELECT}
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?
ORDER BY review_date DESC, swing_daily_note_id`).all(
      scope.workspaceId,
      scope.accountId,
      roundTripId,
    ) as Parameters<typeof mapNote>[0][];
    return Object.freeze(rows.map(mapNote));
  }

  findLatest(scope: AccountScope, roundTripId: string): JournalSwingNoteRow | null {
    const row = this.database.prepare(`${NOTE_SELECT}
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?
ORDER BY review_date DESC, swing_daily_note_id
LIMIT 1`).get(
      scope.workspaceId,
      scope.accountId,
      roundTripId,
    ) as Parameters<typeof mapNote>[0] | undefined;
    return row ? mapNote(row) : null;
  }

  save(input: Readonly<{
    scope: AccountScope;
    roundTripId: string;
    reviewDate: string;
    note: string;
    nextSessionPlan: string | null;
    expectedRevision: number | null;
    idempotencyKey: string;
    timestamp: string;
  }>): JournalSwingNoteRow {
    const idempotencySha256 = idempotencyDigest(input);
    const priorRevision = this.database.prepare<[
      string, string, string, string,
    ], {
      round_trip_id: string;
      review_date: string;
      note_text: string;
      next_session_plan_text: string | null;
    }>(`SELECT note.round_trip_id, revision.review_date, revision.note_text,
 revision.next_session_plan_text
FROM journal_swing_daily_note_revisions revision
JOIN journal_swing_daily_notes note
  ON note.workspace_id = revision.workspace_id
 AND note.account_id = revision.account_id
 AND note.swing_daily_note_id = revision.swing_daily_note_id
WHERE revision.workspace_id = ? AND revision.account_id = ?
  AND revision.actor_user_id = ? AND revision.idempotency_sha256 = ?`)
      .get(
        input.scope.workspaceId,
        input.scope.accountId,
        input.scope.userId,
        idempotencySha256,
      );
    if (priorRevision) {
      if (
        priorRevision.round_trip_id !== input.roundTripId ||
        priorRevision.review_date !== input.reviewDate ||
        priorRevision.note_text !== input.note ||
        priorRevision.next_session_plan_text !== input.nextSessionPlan
      ) platformFailure("TRADERLINK_SWING_NOTE_CONFLICT");
      const retried = this.find(input.scope, input.roundTripId, input.reviewDate);
      if (!retried) platformFailure("TRADERLINK_SWING_NOTE_CONFLICT");
      return retried;
    }

    const current = this.find(input.scope, input.roundTripId, input.reviewDate);
    if ((current?.revision ?? null) !== input.expectedRevision) {
      platformFailure("TRADERLINK_SWING_NOTE_CONFLICT");
    }
    const noteId = current?.swingDailyNoteId ?? createCanonicalUuidV4();
    const revisionId = createCanonicalUuidV4();
    const nextRevision = (current?.revision ?? 0) + 1;
    if (!current) {
      this.database.prepare(`INSERT INTO journal_swing_daily_notes (
 swing_daily_note_id, user_id, workspace_id, account_id, round_trip_id,
 review_date, note_text, next_session_plan_text, current_revision,
 current_revision_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`)
        .run(
          noteId,
          input.scope.userId,
          input.scope.workspaceId,
          input.scope.accountId,
          input.roundTripId,
          input.reviewDate,
          input.note,
          input.nextSessionPlan,
          revisionId,
          input.timestamp,
          input.timestamp,
        );
    }
    this.database.prepare(`INSERT INTO journal_swing_daily_note_revisions (
 swing_daily_note_revision_id, workspace_id, account_id, swing_daily_note_id,
 revision_number, note_text, next_session_plan_text, review_date,
 actor_user_id, idempotency_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        revisionId,
        input.scope.workspaceId,
        input.scope.accountId,
        noteId,
        nextRevision,
        input.note,
        input.nextSessionPlan,
        input.reviewDate,
        input.scope.userId,
        idempotencySha256,
        input.timestamp,
      );
    if (current) {
      const updated = this.database.prepare(`UPDATE journal_swing_daily_notes
SET note_text = ?, next_session_plan_text = ?, current_revision = ?,
 current_revision_id = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND swing_daily_note_id = ?
  AND current_revision = ?`).run(
        input.note,
        input.nextSessionPlan,
        nextRevision,
        revisionId,
        input.timestamp,
        input.scope.workspaceId,
        input.scope.accountId,
        noteId,
        current.revision,
      );
      if (updated.changes !== 1) platformFailure("TRADERLINK_SWING_NOTE_CONFLICT");
    }
    const saved = this.find(input.scope, input.roundTripId, input.reviewDate);
    if (!saved) platformFailure("TRADERLINK_SWING_NOTE_CONFLICT");
    return saved;
  }
}
