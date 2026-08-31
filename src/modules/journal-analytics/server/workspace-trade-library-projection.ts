import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalAnalyticsFactSet } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import {
  absoluteExactDecimal,
  addExactDecimals,
  subtractExactDecimals,
} from "./exact-analytics-math";

import {
  journalAnalyticsLocalTimeFact,
  normalizeJournalAnalyticsFacts,
} from "./normalize-journal-analytics-facts";

const DECIMAL_SORT_KEY_WIDTH = 128;
const DECIMAL_EXPONENT_OFFSET = 128;

function sortableMagnitude(value: string): Readonly<{ exponent: number; digits: string }> {
  const unsigned = value.startsWith("-") ? value.slice(1) : value;
  if (unsigned === "0") return Object.freeze({ exponent: 0, digits: "".padEnd(DECIMAL_SORT_KEY_WIDTH, "0") });
  const [whole, fraction = ""] = unsigned.split(".");
  if (whole !== "0") {
    return Object.freeze({
      exponent: whole.length,
      digits: `${whole}${fraction}`.padEnd(DECIMAL_SORT_KEY_WIDTH, "0"),
    });
  }
  const first = fraction.search(/[1-9]/u);
  return Object.freeze({
    exponent: -first,
    digits: fraction.slice(first).padEnd(DECIMAL_SORT_KEY_WIDTH, "0"),
  });
}

function invertedDigits(value: string): string {
  return [...value].map((digit) => String(9 - Number(digit))).join("");
}

/**
 * A bytewise SQLite sort key for canonical exact decimals. It is derived from,
 * never substituted for, the stored decimal and keeps SQL ordering free of
 * floating-point casts.
 */
export function workspaceTradeLibraryDecimalSortKey(value: string): string {
  if (value === "0") return `1${String(DECIMAL_EXPONENT_OFFSET).padStart(3, "0")}${"".padEnd(DECIMAL_SORT_KEY_WIDTH, "0")}`;
  const magnitude = sortableMagnitude(value);
  const exponent = magnitude.exponent + DECIMAL_EXPONENT_OFFSET;
  if (exponent < 0 || exponent > DECIMAL_EXPONENT_OFFSET * 2) {
    throw new Error("workspace_trade_library_decimal_out_of_range");
  }
  const encodedExponent = String(exponent).padStart(3, "0");
  return value.startsWith("-")
    ? `0${String(DECIMAL_EXPONENT_OFFSET * 2 - exponent).padStart(3, "0")}${invertedDigits(magnitude.digits)}`
    : `2${encodedExponent}${magnitude.digits}`;
}

export function hasWorkspaceTradeLibraryProjectionSchema(database: Database.Database): boolean {
  return Boolean(database.prepare(`SELECT 1 FROM sqlite_master
WHERE type = 'table' AND name = 'journal_workspace_trade_library_projections'`).get());
}

function executionFacts(roundTrip: JournalAnalyticsFactSet["roundTrips"][number]) {
  let buyQuantityDecimal = "0";
  let signedPositionDecimal = "0";
  for (const allocation of roundTrip.allocations) {
    if (allocation.side === "buy") {
      buyQuantityDecimal = addExactDecimals(buyQuantityDecimal, allocation.allocatedQuantityDecimal);
      signedPositionDecimal = addExactDecimals(signedPositionDecimal, allocation.allocatedQuantityDecimal);
    } else {
      signedPositionDecimal = subtractExactDecimals(signedPositionDecimal, allocation.allocatedQuantityDecimal);
    }
  }
  return Object.freeze({
    buyQuantityDecimal,
    entryPriceDecimal: roundTrip.allocations.at(0)?.priceDecimal ?? null,
    exitPriceDecimal: roundTrip.projectionState === "ready_closed"
      ? roundTrip.allocations.at(-1)?.priceDecimal ?? null
      : null,
    positionDecimal: absoluteExactDecimal(signedPositionDecimal),
  });
}

/**
 * Rebuilds a derived, current-version-only index from the canonical Journal
 * analytics facts. This contains no user-authored facts and runs in the same
 * account transaction that produced the source round-trip versions.
 */
export function refreshWorkspaceTradeLibraryProjection(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  refreshedAtUtc: string,
): void {
  if (!hasWorkspaceTradeLibraryProjectionSchema(database)) return;
  const facts = new JournalAnalyticsFactSetService(
    new JournalAnalyticsFactSetRepository(database),
  ).getJournalAnalyticsFactSet(scope, {
    accountIds: [scope.activeAccountId!],
    closingDateRange: { kind: "all_available" },
    currencySelection: { kind: "all_partitions" },
  });
  const normalized = normalizeJournalAnalyticsFacts(facts);
  const roundTripById = new Map(facts.roundTrips.map((row) => [row.roundTripId, row] as const));
  const insert = database.prepare(`INSERT INTO journal_workspace_trade_library_projections (
  workspace_id, account_id, round_trip_id, round_trip_version_id, projection_state,
  opened_at_utc, closed_at_utc, activity_at_utc, activity_local_date,
  entry_local_date, entry_local_time, exit_local_date, exit_local_time,
  gross_pnl_decimal, net_pnl_decimal,
  net_pnl_sort_key, entered_quantity_decimal, exit_quantity_decimal,
  maximum_position_quantity_decimal, entry_notional_decimal, exit_notional_decimal,
  unique_execution_count, refreshed_at_utc,
  buy_quantity_decimal, buy_quantity_sort_key, position_decimal, position_sort_key,
  entry_price_decimal, entry_price_sort_key, exit_price_decimal, exit_price_sort_key,
  entry_value_sort_key, gross_pnl_sort_key
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  database.prepare(`DELETE FROM journal_workspace_trade_library_projections
WHERE workspace_id = ? AND account_id = ?`).run(scope.workspaceId, scope.activeAccountId);
  for (const row of normalized.realizedRows) {
    const execution = executionFacts(roundTripById.get(row.roundTripId)!);
    insert.run(
      scope.workspaceId, scope.activeAccountId, row.roundTripId, row.roundTripVersionId,
      "ready_closed", row.openedAtUtc, row.closedAtUtc, row.closedAtUtc, row.closeLocal.localDate,
      row.entryLocal.localDate, `${String(row.entryLocal.hour).padStart(2, "0")}:${String(row.entryLocal.minute).padStart(2, "0")}`,
      row.closeLocal.localDate, `${String(row.closeLocal.hour).padStart(2, "0")}:${String(row.closeLocal.minute).padStart(2, "0")}`,
      row.grossPnlDecimal, row.netPnlDecimal,
      row.netPnlDecimal === null ? null : workspaceTradeLibraryDecimalSortKey(row.netPnlDecimal),
      row.enteredQuantityDecimal, row.exitQuantityDecimal, row.maximumPositionQuantityDecimal,
      row.entryNotionalDecimal, row.exitNotionalDecimal, row.uniqueExecutionCount, refreshedAtUtc,
      execution.buyQuantityDecimal, workspaceTradeLibraryDecimalSortKey(execution.buyQuantityDecimal),
      execution.positionDecimal, workspaceTradeLibraryDecimalSortKey(execution.positionDecimal),
      execution.entryPriceDecimal, execution.entryPriceDecimal === null ? null : workspaceTradeLibraryDecimalSortKey(execution.entryPriceDecimal),
      execution.exitPriceDecimal, execution.exitPriceDecimal === null ? null : workspaceTradeLibraryDecimalSortKey(execution.exitPriceDecimal),
      workspaceTradeLibraryDecimalSortKey(row.entryNotionalDecimal), workspaceTradeLibraryDecimalSortKey(row.grossPnlDecimal),
    );
  }
  for (const row of normalized.legitimateOpenRoundTrips) {
    const execution = executionFacts(row);
    const local = journalAnalyticsLocalTimeFact(
      row.openedAtUtc,
      facts.accounts[0]!.tradingTimezone,
    );
    insert.run(
      scope.workspaceId, scope.activeAccountId, row.roundTripId, row.roundTripVersionId,
      "legitimate_open", row.openedAtUtc, null, row.openedAtUtc,
      local.localDate, local.localDate,
      `${String(local.hour).padStart(2, "0")}:${String(local.minute).padStart(2, "0")}`,
      null, null, null, null, null,
      null, null, null, null, null,
      new Set(row.allocations.map((allocation) => allocation.executionId)).size, refreshedAtUtc,
      execution.buyQuantityDecimal, workspaceTradeLibraryDecimalSortKey(execution.buyQuantityDecimal),
      execution.positionDecimal, workspaceTradeLibraryDecimalSortKey(execution.positionDecimal),
      execution.entryPriceDecimal, execution.entryPriceDecimal === null ? null : workspaceTradeLibraryDecimalSortKey(execution.entryPriceDecimal),
      null, null, null, null,
    );
  }
  database.prepare(`INSERT INTO journal_workspace_trade_library_projection_revisions (
  workspace_id, account_id, projection_revision_id, refreshed_at_utc
) VALUES (?, ?, ?, ?)
ON CONFLICT(workspace_id, account_id) DO UPDATE SET
  projection_revision_id = excluded.projection_revision_id,
  refreshed_at_utc = excluded.refreshed_at_utc`).run(
    scope.workspaceId,
    scope.activeAccountId,
    createCanonicalUuidV4(),
    refreshedAtUtc,
  );
}
