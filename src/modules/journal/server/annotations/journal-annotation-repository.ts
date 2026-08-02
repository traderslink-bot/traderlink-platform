import type Database from "better-sqlite3";

import type {
  JournalDailyNoteRecord,
  JournalRoundTripNoteRecord,
  JournalTagRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

type TagRow = Readonly<{
  tag_id: string;
  current_name: string;
  lifecycle_state: "active" | "retired";
  revision: number;
  assignment_count: number;
  created_at_utc: string;
  updated_at_utc: string;
}>;

export type JournalTagAssignmentRow = Readonly<{
  tag_assignment_id: string;
  tag_id: string;
  assignment_state: "assigned" | "removed";
  revision: number;
}>;

type DailyNoteRow = Readonly<{
  daily_note_id: string;
  trading_day_id: string;
  revision: number;
  what_worked: string;
  what_needs_work: string;
  technical_recap: string;
  tomorrows_focus: string;
  anything_else: string;
  created_at_utc: string;
  updated_at_utc: string;
}>;

type RoundTripNoteRow = Readonly<{
  round_trip_note_id: string;
  round_trip_id: string;
  revision: number;
  technical_note: string;
  trade_note: string;
  created_at_utc: string;
  updated_at_utc: string;
}>;

function mapTag(row: TagRow): JournalTagRecord {
  return Object.freeze({
    tagId: row.tag_id,
    name: row.current_name,
    lifecycleState: row.lifecycle_state,
    revision: Number(row.revision),
    assignmentCount: Number(row.assignment_count),
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

function mapDailyNote(row: DailyNoteRow): JournalDailyNoteRecord {
  return Object.freeze({
    dailyNoteId: row.daily_note_id,
    tradingDayId: row.trading_day_id,
    revision: Number(row.revision),
    whatWorked: row.what_worked,
    whatNeedsWork: row.what_needs_work,
    technicalRecap: row.technical_recap,
    tomorrowsFocus: row.tomorrows_focus,
    anythingElse: row.anything_else,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

function mapRoundTripNote(row: RoundTripNoteRow): JournalRoundTripNoteRecord {
  return Object.freeze({
    roundTripNoteId: row.round_trip_note_id,
    roundTripId: row.round_trip_id,
    revision: Number(row.revision),
    technicalNote: row.technical_note,
    tradeNote: row.trade_note,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

const TAG_SELECT = `SELECT t.tag_id, t.current_name, t.lifecycle_state,
  t.revision, t.created_at_utc, t.updated_at_utc,
  COUNT(a.tag_assignment_id) AS assignment_count
FROM journal_tags t
LEFT JOIN journal_round_trip_tag_assignments a
  ON a.workspace_id = t.workspace_id AND a.account_id = t.account_id
 AND a.tag_id = t.tag_id AND a.assignment_state = 'assigned'`;

export class JournalAnnotationRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  listTags(scope: AccountScope, includeRetired = false): readonly JournalTagRecord[] {
    const rows = this.database.prepare(`${TAG_SELECT}
WHERE t.workspace_id = ? AND t.account_id = ?
  AND (? = 1 OR t.lifecycle_state = 'active')
GROUP BY t.tag_id
ORDER BY t.normalized_name COLLATE BINARY, t.tag_id`).all(
      scope.workspaceId,
      scope.accountId,
      includeRetired ? 1 : 0,
    ) as TagRow[];
    return Object.freeze(rows.map(mapTag));
  }

  findTag(scope: AccountScope, tagId: string): JournalTagRecord | null {
    const row = this.database.prepare(`${TAG_SELECT}
WHERE t.workspace_id = ? AND t.account_id = ? AND t.tag_id = ?
GROUP BY t.tag_id`).get(scope.workspaceId, scope.accountId, tagId) as
      | TagRow
      | undefined;
    return row ? mapTag(row) : null;
  }

  insertTag(input: Readonly<{
    scope: AccountScope;
    tagId: string;
    versionId: string;
    name: string;
    normalizedName: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_tags (
  tag_id, workspace_id, account_id, current_name, normalized_name,
  lifecycle_state, current_version_id, revision, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'active', ?, 1, ?, ?, ?)`)
      .run(input.tagId, input.scope.workspaceId, input.scope.accountId,
        input.name, input.normalizedName, input.versionId, input.scope.userId,
        input.timestamp, input.timestamp);
    this.database.prepare(`INSERT INTO journal_tag_versions (
  tag_version_id, workspace_id, account_id, tag_id, version_number,
  event_kind, name, normalized_name, lifecycle_state, authored_by_user_id,
  created_at_utc
) VALUES (?, ?, ?, ?, 1, 'created', ?, ?, 'active', ?, ?)`)
      .run(input.versionId, input.scope.workspaceId, input.scope.accountId,
        input.tagId, input.name, input.normalizedName, input.scope.userId,
        input.timestamp);
  }

  appendTagVersion(input: Readonly<{
    scope: AccountScope;
    tagId: string;
    expectedRevision: number;
    versionId: string;
    eventKind: "renamed" | "retired";
    name: string;
    normalizedName: string;
    lifecycleState: "active" | "retired";
    timestamp: string;
  }>): boolean {
    const nextRevision = input.expectedRevision + 1;
    this.database.prepare(`INSERT INTO journal_tag_versions (
  tag_version_id, workspace_id, account_id, tag_id, version_number,
  event_kind, name, normalized_name, lifecycle_state, authored_by_user_id,
  created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.versionId, input.scope.workspaceId, input.scope.accountId,
        input.tagId, nextRevision, input.eventKind, input.name,
        input.normalizedName, input.lifecycleState, input.scope.userId,
        input.timestamp);
    return this.database.prepare(`UPDATE journal_tags
SET current_name = ?, normalized_name = ?, lifecycle_state = ?,
  current_version_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND tag_id = ? AND revision = ?`)
      .run(input.name, input.normalizedName, input.lifecycleState,
        input.versionId, nextRevision, input.timestamp, input.scope.workspaceId,
        input.scope.accountId, input.tagId, input.expectedRevision).changes === 1;
  }

  roundTripExists(scope: AccountScope, roundTripId: string): boolean {
    return Boolean(this.database.prepare(`SELECT 1 AS present
FROM journal_round_trips
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?
  AND lifecycle_state = 'active'`).get(
      scope.workspaceId,
      scope.accountId,
      roundTripId,
    ));
  }

  listAssignmentRows(
    scope: AccountScope,
    roundTripId: string,
  ): readonly JournalTagAssignmentRow[] {
    return this.database.prepare(`SELECT tag_assignment_id, tag_id,
  assignment_state, revision
FROM journal_round_trip_tag_assignments
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?
ORDER BY tag_id`).all(
      scope.workspaceId,
      scope.accountId,
      roundTripId,
    ) as JournalTagAssignmentRow[];
  }

  insertAssignment(input: Readonly<{
    scope: AccountScope;
    roundTripId: string;
    tagId: string;
    assignmentId: string;
    eventId: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_round_trip_tag_assignments (
  tag_assignment_id, workspace_id, account_id, round_trip_id, tag_id,
  assignment_state, current_event_id, revision, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'assigned', ?, 1, ?, ?)`)
      .run(input.assignmentId, input.scope.workspaceId, input.scope.accountId,
        input.roundTripId, input.tagId, input.eventId, input.timestamp,
        input.timestamp);
    this.database.prepare(`INSERT INTO journal_round_trip_tag_assignment_events (
  assignment_event_id, workspace_id, account_id, tag_assignment_id,
  version_number, event_kind, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, 1, 'assigned', ?, ?)`)
      .run(input.eventId, input.scope.workspaceId, input.scope.accountId,
        input.assignmentId, input.scope.userId, input.timestamp);
  }

  transitionAssignment(input: Readonly<{
    scope: AccountScope;
    row: JournalTagAssignmentRow;
    nextState: "assigned" | "removed";
    eventId: string;
    timestamp: string;
  }>): boolean {
    const nextRevision = input.row.revision + 1;
    this.database.prepare(`INSERT INTO journal_round_trip_tag_assignment_events (
  assignment_event_id, workspace_id, account_id, tag_assignment_id,
  version_number, event_kind, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.eventId, input.scope.workspaceId, input.scope.accountId,
        input.row.tag_assignment_id, nextRevision, input.nextState,
        input.scope.userId, input.timestamp);
    return this.database.prepare(`UPDATE journal_round_trip_tag_assignments
SET assignment_state = ?, current_event_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND tag_assignment_id = ?
  AND revision = ?`).run(input.nextState, input.eventId, nextRevision,
        input.timestamp, input.scope.workspaceId, input.scope.accountId,
        input.row.tag_assignment_id, input.row.revision).changes === 1;
  }

  listTagsForRoundTrips(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, readonly JournalTagRecord[]>> {
    const output: Record<string, JournalTagRecord[]> = Object.fromEntries(
      roundTripIds.map((roundTripId) => [roundTripId, []]),
    );
    if (roundTripIds.length === 0) return Object.freeze(output);
    const placeholders = roundTripIds.map(() => "?").join(", ");
    const rows = this.database.prepare(`SELECT a.round_trip_id,
  t.tag_id, t.current_name, t.lifecycle_state, t.revision,
  t.created_at_utc, t.updated_at_utc,
  (SELECT COUNT(*) FROM journal_round_trip_tag_assignments c
   WHERE c.workspace_id = t.workspace_id AND c.account_id = t.account_id
     AND c.tag_id = t.tag_id AND c.assignment_state = 'assigned')
    AS assignment_count
FROM journal_round_trip_tag_assignments a
JOIN journal_tags t
  ON t.workspace_id = a.workspace_id AND t.account_id = a.account_id
 AND t.tag_id = a.tag_id
WHERE a.workspace_id = ? AND a.account_id = ?
  AND a.assignment_state = 'assigned' AND t.lifecycle_state = 'active'
  AND a.round_trip_id IN (${placeholders})
ORDER BY a.round_trip_id, t.normalized_name COLLATE BINARY, t.tag_id`)
      .all(scope.workspaceId, scope.accountId, ...roundTripIds) as
        (TagRow & { round_trip_id: string })[];
    for (const row of rows) output[row.round_trip_id]?.push(mapTag(row));
    return Object.freeze(Object.fromEntries(
      Object.entries(output).map(([key, value]) => [key, Object.freeze(value)]),
    ));
  }

  findTradingDayId(scope: AccountScope, tradingDate: string): string | null {
    const row = this.database.prepare(`SELECT trading_day_id
FROM journal_trading_days
WHERE workspace_id = ? AND account_id = ? AND trading_date = ?
  AND status = 'active'
ORDER BY trading_timezone COLLATE BINARY, trading_day_id
LIMIT 1`).get(scope.workspaceId, scope.accountId, tradingDate) as
      | { trading_day_id: string }
      | undefined;
    return row?.trading_day_id ?? null;
  }

  tradingDayExists(scope: AccountScope, tradingDayId: string): boolean {
    return Boolean(this.database.prepare(`SELECT 1 AS present
FROM journal_trading_days
WHERE workspace_id = ? AND account_id = ? AND trading_day_id = ?
  AND status = 'active'`).get(
      scope.workspaceId,
      scope.accountId,
      tradingDayId,
    ));
  }

  readDailyNote(scope: AccountScope, tradingDayId: string): JournalDailyNoteRecord | null {
    const row = this.database.prepare(`SELECT n.daily_note_id, n.trading_day_id,
  n.revision, v.what_worked, v.what_needs_work, v.technical_recap,
  v.tomorrows_focus, v.anything_else, n.created_at_utc, n.updated_at_utc
FROM journal_daily_notes n
JOIN journal_daily_note_revisions v
  ON v.workspace_id = n.workspace_id AND v.account_id = n.account_id
 AND v.daily_note_id = n.daily_note_id
 AND v.daily_note_revision_id = n.current_revision_id
WHERE n.workspace_id = ? AND n.account_id = ? AND n.trading_day_id = ?`)
      .get(scope.workspaceId, scope.accountId, tradingDayId) as
        | DailyNoteRow
        | undefined;
    return row ? mapDailyNote(row) : null;
  }

  insertDailyNote(input: Readonly<{
    scope: AccountScope;
    noteId: string;
    revisionId: string;
    tradingDayId: string;
    timestamp: string;
    values: readonly string[];
  }>): void {
    this.database.prepare(`INSERT INTO journal_daily_notes (
  daily_note_id, workspace_id, account_id, trading_day_id,
  current_revision_id, revision, created_by_user_id, created_at_utc,
  updated_at_utc
) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`)
      .run(input.noteId, input.scope.workspaceId, input.scope.accountId,
        input.tradingDayId, input.revisionId, input.scope.userId,
        input.timestamp, input.timestamp);
    this.insertDailyNoteRevision({ ...input, revision: 1 });
  }

  insertDailyNoteRevision(input: Readonly<{
    scope: AccountScope;
    noteId: string;
    revisionId: string;
    revision: number;
    timestamp: string;
    values: readonly string[];
  }>): void {
    this.database.prepare(`INSERT INTO journal_daily_note_revisions (
  daily_note_revision_id, workspace_id, account_id, daily_note_id,
  revision_number, what_worked, what_needs_work, technical_recap,
  tomorrows_focus, anything_else, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.revisionId, input.scope.workspaceId, input.scope.accountId,
        input.noteId, input.revision, ...input.values, input.scope.userId,
        input.timestamp);
  }

  updateDailyNote(input: Readonly<{
    scope: AccountScope;
    noteId: string;
    revisionId: string;
    expectedRevision: number;
    timestamp: string;
  }>): boolean {
    return this.database.prepare(`UPDATE journal_daily_notes
SET current_revision_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND daily_note_id = ?
  AND revision = ?`).run(input.revisionId, input.expectedRevision + 1,
        input.timestamp, input.scope.workspaceId, input.scope.accountId,
        input.noteId, input.expectedRevision).changes === 1;
  }

  readRoundTripNotes(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, JournalRoundTripNoteRecord>> {
    if (roundTripIds.length === 0) return Object.freeze({});
    const placeholders = roundTripIds.map(() => "?").join(", ");
    const rows = this.database.prepare(`SELECT n.round_trip_note_id,
  n.round_trip_id, n.revision, v.technical_note, v.trade_note,
  n.created_at_utc, n.updated_at_utc
FROM journal_round_trip_notes n
JOIN journal_round_trip_note_revisions v
  ON v.workspace_id = n.workspace_id AND v.account_id = n.account_id
 AND v.round_trip_note_id = n.round_trip_note_id
 AND v.round_trip_note_revision_id = n.current_revision_id
WHERE n.workspace_id = ? AND n.account_id = ?
  AND n.round_trip_id IN (${placeholders})
ORDER BY n.round_trip_id`).all(
      scope.workspaceId,
      scope.accountId,
      ...roundTripIds,
    ) as RoundTripNoteRow[];
    return Object.freeze(Object.fromEntries(rows.map((row) => [
      row.round_trip_id,
      mapRoundTripNote(row),
    ])));
  }

  insertRoundTripNote(input: Readonly<{
    scope: AccountScope;
    noteId: string;
    revisionId: string;
    roundTripId: string;
    technicalNote: string;
    tradeNote: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_round_trip_notes (
  round_trip_note_id, workspace_id, account_id, round_trip_id,
  current_revision_id, revision, created_by_user_id, created_at_utc,
  updated_at_utc
) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`)
      .run(input.noteId, input.scope.workspaceId, input.scope.accountId,
        input.roundTripId, input.revisionId, input.scope.userId,
        input.timestamp, input.timestamp);
    this.insertRoundTripNoteRevision({ ...input, revision: 1 });
  }

  insertRoundTripNoteRevision(input: Readonly<{
    scope: AccountScope;
    noteId: string;
    revisionId: string;
    revision: number;
    technicalNote: string;
    tradeNote: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_round_trip_note_revisions (
  round_trip_note_revision_id, workspace_id, account_id, round_trip_note_id,
  revision_number, technical_note, trade_note, authored_by_user_id,
  created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.revisionId, input.scope.workspaceId, input.scope.accountId,
        input.noteId, input.revision, input.technicalNote, input.tradeNote,
        input.scope.userId, input.timestamp);
  }

  updateRoundTripNote(input: Readonly<{
    scope: AccountScope;
    noteId: string;
    revisionId: string;
    expectedRevision: number;
    timestamp: string;
  }>): boolean {
    return this.database.prepare(`UPDATE journal_round_trip_notes
SET current_revision_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND round_trip_note_id = ?
  AND revision = ?`).run(input.revisionId, input.expectedRevision + 1,
        input.timestamp, input.scope.workspaceId, input.scope.accountId,
        input.noteId, input.expectedRevision).changes === 1;
  }
}
