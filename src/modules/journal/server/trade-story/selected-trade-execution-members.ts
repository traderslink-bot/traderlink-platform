import type Database from "better-sqlite3";
import type { AccountScope } from "../../../platform/contracts/workspace-access-scope";
import { platformFailure } from "../../../platform/server/database/platform-migration-contract";

export type SelectedTradeExecutionMembers = Readonly<{
  selectionId: string;
  memberIds: readonly string[];
}>;

/** Caller reads membership and execution allocations in the same read transaction. */
export function selectedTradeExecutionMembers(
  database: Database.Database, scope: AccountScope, selectionId: string,
): SelectedTradeExecutionMembers {
  if (!database.inTransaction) throw new Error("Selected trade requires a read transaction.");
  const fail = (): never => platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "roundTripIds" });
  const groups = database.prepare(`SELECT logical.logical_trade_id, logical.current_version_id, logical.lifecycle_state
FROM journal_logical_trades logical
WHERE logical.workspace_id = ? AND logical.account_id = ? AND
 (logical.logical_trade_id = ? OR EXISTS (
 SELECT 1 FROM journal_active_logical_trade_memberships active
 WHERE active.workspace_id = logical.workspace_id AND active.account_id = logical.account_id
 AND active.logical_trade_id = logical.logical_trade_id AND active.round_trip_id = ?)
 OR (logical.lifecycle_state IN ('active', 'review_required') AND EXISTS (
 SELECT 1 FROM journal_logical_trade_version_members declared
 WHERE declared.workspace_id = logical.workspace_id AND declared.account_id = logical.account_id
 AND declared.logical_trade_version_id = logical.current_version_id
 AND declared.logical_trade_id = logical.logical_trade_id AND declared.round_trip_id = ?)))`
  ).all(scope.workspaceId, scope.accountId, selectionId, selectionId, selectionId) as {
    logical_trade_id: string; current_version_id: string; lifecycle_state: string;
  }[];
  if (groups.length === 0) {
    const member = database.prepare(`SELECT round_trip_id FROM journal_round_trips
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ? AND lifecycle_state = 'active'`
    ).get(scope.workspaceId, scope.accountId, selectionId);
    if (!member) return fail();
    return Object.freeze({ selectionId, memberIds: Object.freeze([selectionId]) });
  }
  if (groups.length !== 1 || groups[0]!.lifecycle_state !== "active") return fail();
  const group = groups[0]!;
  const members = database.prepare(`SELECT declared.round_trip_id, declared.round_trip_version_id,
 declared.member_sequence, trip.current_version_id, trip.lifecycle_state,
 active.logical_trade_id AS active_trade_id, active.logical_trade_version_id AS active_version_id
FROM journal_logical_trade_version_members declared
LEFT JOIN journal_round_trips trip ON trip.workspace_id = declared.workspace_id
 AND trip.account_id = declared.account_id AND trip.round_trip_id = declared.round_trip_id
LEFT JOIN journal_active_logical_trade_memberships active ON active.workspace_id = declared.workspace_id
 AND active.account_id = declared.account_id AND active.round_trip_id = declared.round_trip_id
WHERE declared.workspace_id = ? AND declared.account_id = ? AND declared.logical_trade_id = ?
 AND declared.logical_trade_version_id = ? ORDER BY declared.member_sequence, declared.round_trip_id`
  ).all(scope.workspaceId, scope.accountId, group.logical_trade_id, group.current_version_id) as {
    round_trip_id: string; round_trip_version_id: string; member_sequence: number;
    current_version_id: string | null; lifecycle_state: string | null;
    active_trade_id: string | null; active_version_id: string | null;
  }[];
  const activeCount = database.prepare(`SELECT COUNT(*) AS count FROM journal_active_logical_trade_memberships
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ?`
  ).get(scope.workspaceId, scope.accountId, group.logical_trade_id) as { count: number };
  if (members.length === 0 || activeCount.count !== members.length
    || new Set(members.map((member) => member.round_trip_id)).size !== members.length
    || members.some((member) => member.lifecycle_state !== "active"
      || member.current_version_id !== member.round_trip_version_id
      || member.active_trade_id !== group.logical_trade_id
      || member.active_version_id !== group.current_version_id)) return fail();
  return Object.freeze({ selectionId, memberIds: Object.freeze(members.map((member) => member.round_trip_id)) });
}

/** Keep allocation rows intact: identical-looking fills can be distinct facts. */
export function selectedTradeExecutions<T extends { round_trip_id: string; executed_at_utc: string }>(
  selection: SelectedTradeExecutionMembers, rows: readonly T[],
): readonly T[] {
  const order = new Map(selection.memberIds.map((id, index) => [id, index]));
  return Object.freeze(rows.filter((row) => order.has(row.round_trip_id)).sort((left, right) =>
    left.executed_at_utc.localeCompare(right.executed_at_utc)
    || order.get(left.round_trip_id)! - order.get(right.round_trip_id)!));
}
