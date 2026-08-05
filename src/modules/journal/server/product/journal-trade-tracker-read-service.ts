import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type {
  JournalSwingPositionDetail,
  JournalTrackedPositionDetail,
  JournalTrackedExecution,
  JournalTrackedPosition,
} from "@/src/modules/journal/contracts/journal-trade-tracker-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { absoluteDecimal } from "../round-trips/journal-decimal-math";
import type { JournalSwingNoteService } from "../swing-notes/journal-swing-note-service";
import type { JournalTradeStyleService } from "../trade-style/journal-trade-style-service";
import type { JournalTrackedPositionRow } from "../trade-style/journal-trade-style-repository";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const ExactDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

function canonicalDecimal(value: Decimal): string {
  return value.isZero() ? "0" : value.toFixed();
}

export class JournalTradeTrackerReadService {
  constructor(
    private readonly database: Database.Database,
    private readonly styles: JournalTradeStyleService,
    private readonly swingNotes: JournalSwingNoteService,
  ) {}

  private mapPosition(
    scope: AccountScope,
    row: JournalTrackedPositionRow,
    reviewDate: string,
  ): JournalTrackedPosition {
    const positionRef = this.styles.positionRef(scope, row.roundTripId);
    const notes = row.tradeStyle === "swing"
      ? this.swingNotes.list(scope, positionRef)
      : [];
    const averageEntryPriceDecimal = this.averageEntryPrice(
      scope,
      row.roundTripVersionId,
    );
    return Object.freeze({
      positionRef,
      symbol: row.symbol,
      currency: row.currency,
      timezone: row.timezone,
      direction: row.direction,
      openedAtUtc: row.openedAtUtc,
      closedAtUtc: row.closedAtUtc,
      remainingQuantityDecimal: absoluteDecimal(row.finalPositionDecimal),
      averageEntryPriceDecimal,
      projectionState: row.projectionState,
      style: row.tradeStyle && row.openStatus && row.styleRevision &&
          row.plannedFromEntry !== null && row.claimedEffectiveAtUtc &&
          row.declaredAtUtc && row.styleLifecycleState && row.styleUpdatedAtUtc
        ? Object.freeze({
            revision: row.styleRevision,
            tradeStyle: row.tradeStyle,
            openStatus: row.openStatus,
            plannedFromEntry: row.plannedFromEntry,
            claimedEffectiveAtUtc: row.claimedEffectiveAtUtc,
            declaredAtUtc: row.declaredAtUtc,
            lifecycleState: row.styleLifecycleState,
            updatedAtUtc: row.styleUpdatedAtUtc,
          })
        : null,
      latestSwingNote: notes[0] ?? null,
      reviewDateSwingNote: notes.find((note) => note.reviewDate === reviewDate) ?? null,
    });
  }

  private averageEntryPrice(
    scope: AccountScope,
    roundTripVersionId: string,
  ): string | null {
    const rows = this.database.prepare<[string, string, string], {
      quantity_decimal: string;
      price_decimal: string | null;
    }>(`SELECT allocation.quantity_decimal, execution_version.price_decimal
FROM journal_round_trip_execution_allocations allocation
JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
 AND execution_version.account_id = allocation.account_id
 AND execution_version.execution_version_id = allocation.execution_version_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND allocation.round_trip_version_id = ?
  AND allocation.allocation_role IN ('opening', 'adding', 'flip_opening')
ORDER BY allocation.allocation_sequence`).all(
      scope.workspaceId,
      scope.accountId,
      roundTripVersionId,
    );
    if (rows.length === 0 || rows.some((row) => row.price_decimal === null)) {
      return null;
    }
    const quantity = rows.reduce(
      (total, row) => total.plus(new ExactDecimal(row.quantity_decimal)),
      new ExactDecimal(0),
    );
    if (quantity.isZero()) return null;
    const notional = rows.reduce(
      (total, row) => total.plus(
        new ExactDecimal(row.quantity_decimal).times(row.price_decimal!),
      ),
      new ExactDecimal(0),
    );
    return canonicalDecimal(notional.dividedBy(quantity).toDecimalPlaces(4));
  }

  listPositions(
    scope: AccountScope,
    reviewDate: string,
  ): readonly JournalTrackedPosition[] {
    if (!DATE_PATTERN.test(reviewDate)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "reviewDate",
      });
    }
    return Object.freeze(this.styles.listPositionRows(scope)
      .map((row) => this.mapPosition(scope, row, reviewDate)));
  }

  listSwings(
    scope: AccountScope,
    reviewDate: string,
  ): Readonly<{
    active: readonly JournalTrackedPosition[];
    completed: readonly JournalTrackedPosition[];
  }> {
    if (!DATE_PATTERN.test(reviewDate)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "reviewDate",
      });
    }
    const swings = this.styles.listSwingPositionRows(scope)
      .map((row) => this.mapPosition(scope, row, reviewDate))
      .filter((position) =>
      position.style?.lifecycleState !== "needs_relink" &&
      position.projectionState !== "needs_decision");
    return Object.freeze({
      active: Object.freeze(swings.filter((position) =>
        position.projectionState === "legitimate_open" &&
        position.style?.openStatus === "swing")
        .sort((left, right) => left.openedAtUtc.localeCompare(right.openedAtUtc))),
      completed: Object.freeze(swings.filter((position) =>
        position.projectionState === "ready_closed")
        .sort((left, right) =>
          (right.closedAtUtc ?? "").localeCompare(left.closedAtUtc ?? ""))
        .slice(0, 50)),
    });
  }

  positionDetail(
    scope: AccountScope,
    positionRef: string,
    reviewDate: string,
  ): JournalTrackedPositionDetail {
    const position = this.styles.resolvePosition(scope, positionRef);
    const summary = this.mapPosition(scope, position, reviewDate);
    const executions = this.database.prepare<[string, string, string], {
      execution_id: string;
      executed_at_utc: string;
      source_timestamp_text: string;
      side: "buy" | "sell";
      quantity_decimal: string;
      price_decimal: string | null;
      fees_decimal: string | null;
      allocation_role: JournalTrackedExecution["allocationRole"];
      allocation_sequence: number;
    }>(`SELECT execution_version.execution_id, execution_version.executed_at_utc,
 execution_version.source_timestamp_text, execution_version.side,
 allocation.quantity_decimal, execution_version.price_decimal,
 execution_version.fees_decimal, allocation.allocation_role,
 allocation.allocation_sequence
FROM journal_round_trip_execution_allocations allocation
JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
 AND execution_version.account_id = allocation.account_id
 AND execution_version.execution_version_id = allocation.execution_version_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND allocation.round_trip_version_id = ?
ORDER BY allocation.allocation_sequence, execution_version.executed_at_utc`)
      .all(scope.workspaceId, scope.accountId, position.roundTripVersionId)
      .map((row) => Object.freeze({
        executionId: row.execution_id,
        executedAtUtc: row.executed_at_utc,
        sourceTimestampText: row.source_timestamp_text,
        side: row.side,
        quantityDecimal: row.quantity_decimal,
        priceDecimal: row.price_decimal,
        feesDecimal: row.fees_decimal,
        allocationRole: row.allocation_role,
      }));
    return Object.freeze({
      ...summary,
      executions: Object.freeze(executions),
    });
  }

  swingDetail(
    scope: AccountScope,
    positionRef: string,
    reviewDate: string,
  ): JournalSwingPositionDetail {
    const detail = this.positionDetail(scope, positionRef, reviewDate);
    if (detail.style?.tradeStyle !== "swing") {
      platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
    }
    return Object.freeze({
      ...detail,
      notes: this.swingNotes.list(scope, positionRef),
    });
  }
}
