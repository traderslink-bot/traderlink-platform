import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type {
  JournalOpenPositionStatus,
  JournalTradeStyle,
  JournalTradeStyleLifecycle,
} from "@/src/modules/journal/contracts/journal-trade-style-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalTrackedPositionRow = Readonly<{
  roundTripId: string;
  roundTripVersionId: string;
  roundTripVersion: number;
  instrumentId: string;
  symbol: string;
  currency: string;
  timezone: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string | null;
  finalPositionDecimal: string;
  projectionState: "ready_closed" | "legitimate_open" | "needs_decision";
  stylePlanId: string | null;
  styleRevision: number | null;
  tradeStyle: JournalTradeStyle | null;
  openStatus: JournalOpenPositionStatus | null;
  plannedFromEntry: boolean | null;
  claimedEffectiveAtUtc: string | null;
  declaredAtUtc: string | null;
  styleLifecycleState: JournalTradeStyleLifecycle | null;
  styleUpdatedAtUtc: string | null;
}>;

export type JournalTradeStylePlanRow = Readonly<{
  stylePlanId: string;
  roundTripId: string;
  roundTripVersionId: string;
  tradeStyle: JournalTradeStyle;
  openStatus: JournalOpenPositionStatus;
  plannedFromEntry: boolean;
  claimedEffectiveAtUtc: string;
  declaredAtUtc: string;
  lifecycleState: JournalTradeStyleLifecycle;
  revision: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

function digest(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\u001f"), "utf8").digest("hex");
}

function mapPosition(row: {
  round_trip_id: string;
  round_trip_version_id: string;
  version_number: number;
  instrument_id: string;
  normalized_symbol: string;
  trade_currency: string;
  trading_timezone: string;
  direction: "long" | "short";
  opened_at_utc: string;
  closed_at_utc: string | null;
  final_position_decimal: string;
  projection_state: JournalTrackedPositionRow["projectionState"];
  trade_style_plan_id: string | null;
  current_revision: number | null;
  trade_style: JournalTradeStyle | null;
  open_status: JournalOpenPositionStatus | null;
  planned_from_entry: number | null;
  claimed_effective_at_utc: string | null;
  declared_at_utc: string | null;
  lifecycle_state: JournalTradeStyleLifecycle | null;
  updated_at_utc: string | null;
}): JournalTrackedPositionRow {
  return Object.freeze({
    roundTripId: row.round_trip_id,
    roundTripVersionId: row.round_trip_version_id,
    roundTripVersion: row.version_number,
    instrumentId: row.instrument_id,
    symbol: row.normalized_symbol,
    currency: row.trade_currency,
    timezone: row.trading_timezone,
    direction: row.direction,
    openedAtUtc: row.opened_at_utc,
    closedAtUtc: row.closed_at_utc,
    finalPositionDecimal: row.final_position_decimal,
    projectionState: row.projection_state,
    stylePlanId: row.trade_style_plan_id,
    styleRevision: row.current_revision,
    tradeStyle: row.trade_style,
    openStatus: row.open_status,
    plannedFromEntry: row.planned_from_entry === null
      ? null
      : row.planned_from_entry === 1,
    claimedEffectiveAtUtc: row.claimed_effective_at_utc,
    declaredAtUtc: row.declared_at_utc,
    styleLifecycleState: row.lifecycle_state,
    styleUpdatedAtUtc: row.updated_at_utc,
  });
}

const POSITION_SELECT = `SELECT round_trip.round_trip_id,
 version.round_trip_version_id, version.version_number, version.instrument_id,
 instrument.normalized_symbol, version.trade_currency, account.trading_timezone,
 version.direction, version.opened_at_utc, version.closed_at_utc,
 version.final_position_decimal, version.projection_state,
 plan.trade_style_plan_id, plan.current_revision, plan.trade_style,
 plan.open_status, plan.planned_from_entry, plan.claimed_effective_at_utc,
 plan.declared_at_utc, plan.lifecycle_state, plan.updated_at_utc
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
JOIN journal_accounts account
  ON account.workspace_id = round_trip.workspace_id
 AND account.account_id = round_trip.account_id
LEFT JOIN journal_trade_style_plans plan
  ON plan.workspace_id = round_trip.workspace_id
 AND plan.account_id = round_trip.account_id
 AND plan.round_trip_id = round_trip.round_trip_id`;

export class JournalTradeStyleRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  listCurrentPositions(scope: AccountScope): readonly JournalTrackedPositionRow[] {
    const rows = this.database.prepare(`${POSITION_SELECT}
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
ORDER BY version.opened_at_utc DESC, round_trip.round_trip_id`).all(
      scope.workspaceId,
      scope.accountId,
    ) as Parameters<typeof mapPosition>[0][];
    return Object.freeze(rows.map(mapPosition));
  }

  listCurrentSwingPositions(
    scope: AccountScope,
  ): readonly JournalTrackedPositionRow[] {
    const rows = this.database.prepare(`${POSITION_SELECT}
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND plan.trade_style = 'swing'
ORDER BY version.opened_at_utc DESC, round_trip.round_trip_id`).all(
      scope.workspaceId,
      scope.accountId,
    ) as Parameters<typeof mapPosition>[0][];
    return Object.freeze(rows.map(mapPosition));
  }

  listCurrentOpenPositionRows(
    scope: AccountScope,
  ): readonly JournalTrackedPositionRow[] {
    const rows = this.database.prepare(`${POSITION_SELECT}
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND version.projection_state IN ('legitimate_open', 'needs_decision')
ORDER BY version.opened_at_utc DESC, round_trip.round_trip_id`).all(
      scope.workspaceId,
      scope.accountId,
    ) as Parameters<typeof mapPosition>[0][];
    return Object.freeze(rows.map(mapPosition));
  }

  findCurrentPosition(
    scope: AccountScope,
    roundTripId: string,
  ): JournalTrackedPositionRow | null {
    const row = this.database.prepare(`${POSITION_SELECT}
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.round_trip_id = ? AND round_trip.lifecycle_state = 'active'`)
      .get(scope.workspaceId, scope.accountId, roundTripId) as
        | Parameters<typeof mapPosition>[0]
        | undefined;
    return row ? mapPosition(row) : null;
  }

  findPlan(scope: AccountScope, roundTripId: string): JournalTradeStylePlanRow | null {
    const row = this.database.prepare<[string, string, string], {
      trade_style_plan_id: string;
      round_trip_id: string;
      round_trip_version_id: string;
      trade_style: JournalTradeStyle;
      open_status: JournalOpenPositionStatus;
      planned_from_entry: number;
      claimed_effective_at_utc: string;
      declared_at_utc: string;
      lifecycle_state: JournalTradeStyleLifecycle;
      current_revision: number;
      created_at_utc: string;
      updated_at_utc: string;
    }>(`SELECT trade_style_plan_id, round_trip_id, round_trip_version_id,
 trade_style, open_status, planned_from_entry, claimed_effective_at_utc,
 declared_at_utc, lifecycle_state, current_revision, created_at_utc,
 updated_at_utc
FROM journal_trade_style_plans
WHERE workspace_id = ? AND account_id = ? AND round_trip_id = ?`)
      .get(scope.workspaceId, scope.accountId, roundTripId);
    return row ? Object.freeze({
      stylePlanId: row.trade_style_plan_id,
      roundTripId: row.round_trip_id,
      roundTripVersionId: row.round_trip_version_id,
      tradeStyle: row.trade_style,
      openStatus: row.open_status,
      plannedFromEntry: row.planned_from_entry === 1,
      claimedEffectiveAtUtc: row.claimed_effective_at_utc,
      declaredAtUtc: row.declared_at_utc,
      lifecycleState: row.lifecycle_state,
      revision: row.current_revision,
      createdAtUtc: row.created_at_utc,
      updatedAtUtc: row.updated_at_utc,
    }) : null;
  }

  savePlan(input: Readonly<{
    scope: AccountScope;
    position: JournalTrackedPositionRow;
    expectedRevision: number | null;
    tradeStyle: JournalTradeStyle;
    openStatus: JournalOpenPositionStatus;
    plannedFromEntry: boolean;
    claimedEffectiveAtUtc: string;
    reasonCode: string;
    sourceUi: "day_trade_tracker" | "swing_trade_tracker" | "open_positions";
    idempotencyKey: string;
    timestamp: string;
  }>): JournalTradeStylePlanRow {
    const current = this.findPlan(input.scope, input.position.roundTripId);
    if ((current?.revision ?? null) !== input.expectedRevision) {
      platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
    }
    if (
      current &&
      current.roundTripVersionId === input.position.roundTripVersionId &&
      current.tradeStyle === input.tradeStyle &&
      current.openStatus === input.openStatus &&
      current.plannedFromEntry === input.plannedFromEntry &&
      current.claimedEffectiveAtUtc === input.claimedEffectiveAtUtc &&
      current.lifecycleState === (input.position.projectionState === "ready_closed" ? "closed" : "active")
    ) return current;

    const nextRevision = (current?.revision ?? 0) + 1;
    const planId = current?.stylePlanId ?? createCanonicalUuidV4();
    const eventId = createCanonicalUuidV4();
    const lifecycleState = input.position.projectionState === "ready_closed"
      ? "closed" as const
      : "active" as const;
    const eventType = !current
      ? "declared" as const
      : current.tradeStyle !== input.tradeStyle ||
          current.openStatus !== input.openStatus ||
          current.plannedFromEntry !== input.plannedFromEntry
        ? "reclassified" as const
        : lifecycleState === "closed" && current.lifecycleState !== "closed"
          ? "closed" as const
          : "relinked" as const;
    const idempotencySha256 = digest([
      "journal-trade-style-change-v1",
      input.scope.workspaceId,
      input.scope.accountId,
      input.scope.userId,
      input.idempotencyKey,
      input.position.roundTripId,
      String(nextRevision),
    ]);
    if (!current) {
      this.database.prepare(`INSERT INTO journal_trade_style_plans (
 trade_style_plan_id, user_id, workspace_id, account_id, round_trip_id,
 round_trip_version_id, trade_style, open_status, planned_from_entry,
 claimed_effective_at_utc, declared_at_utc, lifecycle_state, current_revision,
 current_event_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`)
        .run(
          planId,
          input.scope.userId,
          input.scope.workspaceId,
          input.scope.accountId,
          input.position.roundTripId,
          input.position.roundTripVersionId,
          input.tradeStyle,
          input.openStatus,
          input.plannedFromEntry ? 1 : 0,
          input.claimedEffectiveAtUtc,
          input.timestamp,
          lifecycleState,
          eventId,
          input.timestamp,
          input.timestamp,
        );
    }
    this.database.prepare(`INSERT INTO journal_trade_style_plan_events (
 trade_style_plan_event_id, workspace_id, account_id, trade_style_plan_id,
 event_sequence, event_type, prior_trade_style, new_trade_style,
 prior_open_status, new_open_status, claimed_effective_at_utc,
 round_trip_version_id, reason_code, source_ui, expected_revision,
 idempotency_sha256, actor_user_id, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        eventId,
        input.scope.workspaceId,
        input.scope.accountId,
        planId,
        nextRevision,
        eventType,
        current?.tradeStyle ?? null,
        input.tradeStyle,
        current?.openStatus ?? null,
        input.openStatus,
        input.claimedEffectiveAtUtc,
        input.position.roundTripVersionId,
        input.reasonCode,
        input.sourceUi,
        nextRevision - 1,
        idempotencySha256,
        input.scope.userId,
        input.timestamp,
      );
    if (current) {
      const updated = this.database.prepare(`UPDATE journal_trade_style_plans
SET round_trip_version_id = ?, trade_style = ?, open_status = ?,
 planned_from_entry = ?, claimed_effective_at_utc = ?, declared_at_utc = ?,
 lifecycle_state = ?, current_revision = ?,
 current_event_id = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND trade_style_plan_id = ?
  AND current_revision = ?`)
        .run(
          input.position.roundTripVersionId,
          input.tradeStyle,
          input.openStatus,
          input.plannedFromEntry ? 1 : 0,
          input.claimedEffectiveAtUtc,
          input.timestamp,
          lifecycleState,
          nextRevision,
          eventId,
          input.timestamp,
          input.scope.workspaceId,
          input.scope.accountId,
          planId,
          current.revision,
        );
      if (updated.changes !== 1) {
        platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
      }
    }
    const saved = this.findPlan(input.scope, input.position.roundTripId);
    if (!saved) platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
    return saved;
  }
}
