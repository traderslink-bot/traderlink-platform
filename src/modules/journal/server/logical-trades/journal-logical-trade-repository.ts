import type Database from "better-sqlite3";

import type {
  JournalLogicalTrade,
  JournalLogicalTradeMember,
  JournalLogicalTradeStyle,
} from "../../contracts/journal-logical-trade-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

type RoundTripRow = Readonly<{
  round_trip_id: string;
  round_trip_version_id: string;
  instrument_id: string;
  normalized_symbol: string;
  trade_currency: string;
  direction: "long" | "short";
  opened_at_utc: string;
  closed_at_utc: string;
  trade_style: "day_trade" | "swing" | "other" | null;
  logical_trade_id: string | null;
  logical_trade_version_id: string | null;
  logical_trade_revision: number | null;
  logical_trade_lifecycle: "active" | "review_required" | null;
  logical_trade_style: JournalLogicalTradeStyle | null;
  member_sequence: number | null;
}>;

const CURRENT_CLOSED_ROWS = `SELECT round_trip.round_trip_id,
 version.round_trip_version_id, version.instrument_id,
 instrument.normalized_symbol, version.trade_currency, version.direction,
 version.opened_at_utc, version.closed_at_utc, style.trade_style,
 membership.logical_trade_id, membership.logical_trade_version_id,
 logical.revision AS logical_trade_revision,
 logical.lifecycle_state AS logical_trade_lifecycle,
 logical_version.trade_style AS logical_trade_style,
 membership.member_sequence
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
LEFT JOIN journal_trade_style_plans style
  ON style.workspace_id = round_trip.workspace_id
 AND style.account_id = round_trip.account_id
 AND style.round_trip_id = round_trip.round_trip_id
LEFT JOIN journal_active_logical_trade_memberships membership
  ON membership.workspace_id = round_trip.workspace_id
 AND membership.account_id = round_trip.account_id
 AND membership.round_trip_id = round_trip.round_trip_id
LEFT JOIN journal_logical_trades logical
  ON logical.workspace_id = membership.workspace_id
 AND logical.account_id = membership.account_id
 AND logical.logical_trade_id = membership.logical_trade_id
LEFT JOIN journal_logical_trade_versions logical_version
  ON logical_version.workspace_id = membership.workspace_id
 AND logical_version.account_id = membership.account_id
 AND logical_version.logical_trade_version_id = membership.logical_trade_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
 AND round_trip.lifecycle_state = 'active'
 AND version.projection_state = 'ready_closed'`;

function mapRows(rows: readonly RoundTripRow[]): readonly JournalLogicalTrade[] {
  const grouped = new Map<string, RoundTripRow[]>();
  for (const row of rows) {
    const key = row.logical_trade_id ?? `round-trip:${row.round_trip_id}`;
    const current = grouped.get(key);
    if (current) current.push(row);
    else grouped.set(key, [row]);
  }
  return Object.freeze([...grouped.values()].map((members) => {
    members.sort((left, right) =>
      (left.member_sequence ?? 1) - (right.member_sequence ?? 1) ||
      left.opened_at_utc.localeCompare(right.opened_at_utc) ||
      left.round_trip_id.localeCompare(right.round_trip_id));
    const first = members[0]!;
    const last = members[members.length - 1]!;
    const mappedMembers: readonly JournalLogicalTradeMember[] = Object.freeze(members.map(
      (member, index) => Object.freeze({
        roundTripId: member.round_trip_id,
        roundTripVersionId: member.round_trip_version_id,
        sequence: index + 1,
        openedAtUtc: member.opened_at_utc,
        closedAtUtc: member.closed_at_utc,
      }),
    ));
    return Object.freeze({
      logicalTradeId: first.logical_trade_id,
      revision: first.logical_trade_revision ?? 0,
      lifecycleState: first.logical_trade_lifecycle ?? "active",
      tradeStyle: first.logical_trade_style ?? (first.trade_style === "swing" ? "swing" : "day"),
      instrumentId: first.instrument_id,
      symbol: first.normalized_symbol,
      currency: first.trade_currency,
      direction: first.direction,
      openedAtUtc: first.opened_at_utc,
      closedAtUtc: last.closed_at_utc,
      members: mappedMembers,
    });
  }).sort((left, right) =>
    left.openedAtUtc.localeCompare(right.openedAtUtc) ||
    left.members[0]!.roundTripId.localeCompare(right.members[0]!.roundTripId)));
}

export class JournalLogicalTradeRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  list(scope: AccountScope): readonly JournalLogicalTrade[] {
    return mapRows(this.database.prepare(CURRENT_CLOSED_ROWS).all(
      scope.workspaceId,
      scope.accountId,
    ) as RoundTripRow[]);
  }

  findByLogicalTradeId(
    scope: AccountScope,
    logicalTradeId: string,
  ): JournalLogicalTrade | null {
    return mapRows(this.database.prepare(`${CURRENT_CLOSED_ROWS}
 AND membership.logical_trade_id = ?`).all(
      scope.workspaceId,
      scope.accountId,
      logicalTradeId,
    ) as RoundTripRow[])[0] ?? null;
  }

  findByRoundTripId(scope: AccountScope, roundTripId: string): JournalLogicalTrade | null {
    return this.list(scope).find((trade) =>
      trade.members.some((member) => member.roundTripId === roundTripId)) ?? null;
  }

  createVersion(input: Readonly<{
    scope: AccountScope;
    logicalTradeId?: string;
    priorRevision?: number;
    members: readonly JournalLogicalTradeMember[];
    tradeStyle: JournalLogicalTradeStyle;
    changeKind: "created" | "merged" | "unmerged" | "member_refreshed" | "review_required" | "resolved";
    lifecycleState?: "active" | "review_required" | "retired";
    reasonCode?: string | null;
    timestamp: string;
  }>): string {
    const logicalTradeId = input.logicalTradeId ?? createCanonicalUuidV4();
    const versionId = createCanonicalUuidV4();
    const eventId = createCanonicalUuidV4();
    const versionNumber = (input.priorRevision ?? 0) + 1;
    const lifecycle = input.lifecycleState ?? "active";
    if (input.members.length === 0) {
      platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "members_required" });
    }
    if (input.priorRevision === undefined) {
      this.database.prepare(`INSERT INTO journal_logical_trades (
 logical_trade_id, workspace_id, account_id, current_version_id,
 lifecycle_state, revision, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`)
        .run(logicalTradeId, input.scope.workspaceId, input.scope.accountId,
          versionId, lifecycle, input.timestamp, input.timestamp);
    }
    this.database.prepare(`INSERT INTO journal_logical_trade_versions (
 logical_trade_version_id, workspace_id, account_id, logical_trade_id,
 version_number, version_state, trade_style, change_kind, reason_code,
 created_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(versionId, input.scope.workspaceId, input.scope.accountId,
        logicalTradeId, versionNumber, lifecycle, input.tradeStyle,
        input.changeKind, input.reasonCode ?? null, input.scope.userId, input.timestamp);
    const insertMember = this.database.prepare(`INSERT INTO journal_logical_trade_version_members (
 workspace_id, account_id, logical_trade_id, logical_trade_version_id,
 member_sequence, round_trip_id, round_trip_version_id
) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const insertActive = this.database.prepare(`INSERT INTO journal_active_logical_trade_memberships (
 workspace_id, account_id, round_trip_id, logical_trade_id,
 logical_trade_version_id, member_sequence, activated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    input.members.forEach((member, index) => {
      const sequence = index + 1;
      insertMember.run(input.scope.workspaceId, input.scope.accountId, logicalTradeId,
        versionId, sequence, member.roundTripId, member.roundTripVersionId);
      if (lifecycle !== "retired") {
        insertActive.run(input.scope.workspaceId, input.scope.accountId,
          member.roundTripId, logicalTradeId, versionId, sequence, input.timestamp);
      }
    });
    if (input.priorRevision !== undefined) {
      const updated = this.database.prepare(`UPDATE journal_logical_trades
SET current_version_id = ?, lifecycle_state = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND logical_trade_id = ? AND revision = ?`)
        .run(versionId, lifecycle, versionNumber, input.timestamp,
          input.scope.workspaceId, input.scope.accountId, logicalTradeId,
          input.priorRevision);
      if (updated.changes !== 1) platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT");
    }
    this.database.prepare(`INSERT INTO journal_logical_trade_events (
 logical_trade_event_id, workspace_id, account_id, logical_trade_id,
 logical_trade_version_id, event_kind, actor_user_id, reason_code, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(eventId, input.scope.workspaceId, input.scope.accountId, logicalTradeId,
        versionId, input.changeKind, input.scope.userId, input.reasonCode ?? null,
        input.timestamp);
    return logicalTradeId;
  }

  removeActiveMemberships(scope: AccountScope, logicalTradeIds: readonly string[]): void {
    if (logicalTradeIds.length === 0) return;
    this.database.prepare(`DELETE FROM journal_active_logical_trade_memberships
WHERE workspace_id = ? AND account_id = ?
 AND logical_trade_id IN (${logicalTradeIds.map(() => "?").join(", ")})`)
      .run(scope.workspaceId, scope.accountId, ...logicalTradeIds);
  }
}
