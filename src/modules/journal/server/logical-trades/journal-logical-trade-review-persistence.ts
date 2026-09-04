import type Database from "better-sqlite3";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type ActiveLogicalTradeReviewTarget = Readonly<{
  logicalTradeId: string;
  logicalTradeVersionId: string;
  memberRoundTripIds: readonly string[];
}>;

export function activeLogicalTradeReviewTarget(
  database: Database.Database,
  scope: AccountScope,
  roundTripId: string,
): ActiveLogicalTradeReviewTarget | null {
  const rows = database.prepare(`SELECT selected.logical_trade_id,
 selected.logical_trade_version_id, member.round_trip_id
FROM journal_active_logical_trade_memberships selected
JOIN journal_active_logical_trade_memberships member
 ON member.workspace_id = selected.workspace_id AND member.account_id = selected.account_id
 AND member.logical_trade_id = selected.logical_trade_id
WHERE selected.workspace_id = ? AND selected.account_id = ? AND selected.round_trip_id = ?
ORDER BY member.member_sequence`).all(scope.workspaceId, scope.accountId, roundTripId) as readonly {
    logical_trade_id: string; logical_trade_version_id: string; round_trip_id: string;
  }[];
  if (rows.length <= 1) return null;
  return Object.freeze({ logicalTradeId: rows[0]!.logical_trade_id,
    logicalTradeVersionId: rows[0]!.logical_trade_version_id,
    memberRoundTripIds: Object.freeze(rows.map((row) => row.round_trip_id)) });
}

function requireCurrent(database: Database.Database, scope: AccountScope,
  target: ActiveLogicalTradeReviewTarget): void {
  const current = database.prepare(`SELECT 1 FROM journal_logical_trades
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?
 AND current_version_id = ? AND lifecycle_state = 'active'`).get(
    scope.workspaceId, scope.accountId, target.logicalTradeId, target.logicalTradeVersionId,
  );
  if (!current) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
}

export function saveLogicalTradeNote(database: Database.Database, scope: AccountScope,
  target: ActiveLogicalTradeReviewTarget, input: Readonly<{
    expectedRevision: number | null; technicalNote: string; tradeNote: string;
  }>, now = new Date()) {
  return database.transaction(() => {
    requireCurrent(database, scope, target);
    const prior = database.prepare(`SELECT revision FROM journal_logical_trade_notes
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).get(
      scope.workspaceId, scope.accountId, target.logicalTradeId,
    ) as { revision: number } | undefined;
    if ((prior?.revision ?? null) !== input.expectedRevision ||
      input.technicalNote.length > 20_000 || input.tradeNote.length > 20_000) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const revision = (prior?.revision ?? 0) + 1;
    const timestamp = createCanonicalUtcTimestamp(now);
    database.prepare(`INSERT INTO journal_logical_trade_notes (
 logical_trade_id, workspace_id, account_id, technical_note_text, note_text,
 revision, authored_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(workspace_id, account_id, logical_trade_id) DO UPDATE SET
 technical_note_text = excluded.technical_note_text, note_text = excluded.note_text,
 revision = excluded.revision, authored_by_user_id = excluded.authored_by_user_id,
 updated_at_utc = excluded.updated_at_utc`).run(target.logicalTradeId, scope.workspaceId,
      scope.accountId, input.technicalNote, input.tradeNote, revision, scope.userId, timestamp, timestamp);
    database.prepare(`INSERT INTO journal_logical_trade_note_events (
 logical_trade_note_event_id, workspace_id, account_id, logical_trade_id,
 revision_number, technical_note_text, note_text, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(createCanonicalUuidV4(), scope.workspaceId,
      scope.accountId, target.logicalTradeId, revision, input.technicalNote, input.tradeNote,
      scope.userId, timestamp);
    return Object.freeze({ revision, technicalNote: input.technicalNote, tradeNote: input.tradeNote });
  }).immediate();
}

export function replaceLogicalTradeTags(database: Database.Database, scope: AccountScope,
  target: ActiveLogicalTradeReviewTarget, tagIds: readonly string[], now = new Date()): void {
  database.transaction(() => {
    requireCurrent(database, scope, target);
    const selected = new Set(tagIds);
    if (selected.size > 10) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "tagIds" });
    const valid = database.prepare(`SELECT tag_id FROM journal_tags
WHERE workspace_id = ? AND account_id = ? AND lifecycle_state = 'active'`).all(
      scope.workspaceId, scope.accountId,
    ) as readonly { tag_id: string }[];
    const validIds = new Set(valid.map((row) => row.tag_id));
    if ([...selected].some((tagId) => !validIds.has(tagId))) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const priorRows = database.prepare(`SELECT tag_id, assignment_state, revision
FROM journal_logical_trade_tag_assignments
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`).all(
      scope.workspaceId, scope.accountId, target.logicalTradeId,
    ) as readonly { tag_id: string; assignment_state: "assigned" | "removed"; revision: number }[];
    const prior = new Map(priorRows.map((row) => [row.tag_id, row]));
    const timestamp = createCanonicalUtcTimestamp(now);
    for (const tagId of new Set([...prior.keys(), ...selected])) {
      const state = selected.has(tagId) ? "assigned" : "removed";
      const old = prior.get(tagId);
      if (old?.assignment_state === state) continue;
      const revision = (old?.revision ?? 0) + 1;
      database.prepare(`INSERT INTO journal_logical_trade_tag_assignments (
 workspace_id, account_id, logical_trade_id, tag_id, assignment_state,
 revision, updated_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(workspace_id, account_id, logical_trade_id, tag_id) DO UPDATE SET
 assignment_state = excluded.assignment_state, revision = excluded.revision,
 updated_by_user_id = excluded.updated_by_user_id, updated_at_utc = excluded.updated_at_utc`).run(
        scope.workspaceId, scope.accountId, target.logicalTradeId, tagId, state,
        revision, scope.userId, timestamp, timestamp);
      database.prepare(`INSERT INTO journal_logical_trade_tag_assignment_events (
 logical_trade_tag_assignment_event_id, workspace_id, account_id, logical_trade_id,
 tag_id, assignment_state, revision_number, updated_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(createCanonicalUuidV4(), scope.workspaceId,
        scope.accountId, target.logicalTradeId, tagId, state, revision, scope.userId, timestamp);
    }
  }).immediate();
}

export function saveLogicalTradeRuleReview(database: Database.Database, scope: AccountScope,
  target: ActiveLogicalTradeReviewTarget, input: Readonly<{
    expectedRevision: number | null; note: string; ruleId: string; ruleVersionId: string;
    status: "followed" | "broken" | "not_reviewed";
  }>, now = new Date()) {
  return database.transaction(() => {
    requireCurrent(database, scope, target);
    const prior = database.prepare(`SELECT revision FROM journal_logical_trade_rule_reviews
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ? AND rule_id = ?`).get(
      scope.workspaceId, scope.accountId, target.logicalTradeId, input.ruleId,
    ) as { revision: number } | undefined;
    if ((prior?.revision ?? null) !== input.expectedRevision || input.note.length > 4_000) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    const revision = (prior?.revision ?? 0) + 1;
    const timestamp = createCanonicalUtcTimestamp(now);
    database.prepare(`INSERT INTO journal_logical_trade_rule_reviews (
 workspace_id, account_id, logical_trade_id, rule_id, rule_version_id,
 status, note_text, revision, reviewed_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(workspace_id, account_id, logical_trade_id, rule_id) DO UPDATE SET
 rule_version_id = excluded.rule_version_id, status = excluded.status,
 note_text = excluded.note_text, revision = excluded.revision,
 reviewed_by_user_id = excluded.reviewed_by_user_id, updated_at_utc = excluded.updated_at_utc`).run(
      scope.workspaceId, scope.accountId, target.logicalTradeId, input.ruleId,
      input.ruleVersionId, input.status, input.note, revision, scope.userId, timestamp, timestamp);
    database.prepare(`INSERT INTO journal_logical_trade_rule_review_events (
 logical_trade_rule_review_event_id, workspace_id, account_id, logical_trade_id,
 rule_id, rule_version_id, status, note_text, revision_number, reviewed_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(createCanonicalUuidV4(), scope.workspaceId,
      scope.accountId, target.logicalTradeId, input.ruleId, input.ruleVersionId, input.status,
      input.note, revision, scope.userId, timestamp);
    return Object.freeze({ note: input.note, revision, status: input.status });
  }).immediate();
}
