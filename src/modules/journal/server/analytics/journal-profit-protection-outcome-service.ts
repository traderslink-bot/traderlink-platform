import "server-only";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type {
  DailyTradeProfitProtectionOutcome,
} from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

type ProfitProtectionEvent = Readonly<{
  eventId: string;
  executedAt: string;
  kind: "entry" | "add" | "partial_exit" | "final_exit";
  metrics: Readonly<{
    positionQuantityAfter: string;
    positionQuantityBefore: string;
  }>;
  price: string;
  quantity: string;
}>;

type AllocationRow = Readonly<{
  allocation_role: "opening" | "adding" | "reducing" | "closing" | "flip_closing" | "flip_opening";
  allocation_sequence: number;
  current_execution_version_id: string;
  current_state: "accepted" | "needs_decision" | string;
  direction: "long" | "short";
  execution_id: string;
  execution_quantity_decimal: string;
  execution_version_id: string;
  final_position_decimal: string;
  price_decimal: string | null;
  projection_state: string;
  quantity_decimal: string;
  round_trip_version_id: string;
  side: "buy" | "sell";
}>;

const NOT_APPLICABLE: DailyTradeProfitProtectionOutcome = Object.freeze({
  status: "not_applicable",
});

function decimal(value: string | null): Decimal | null {
  if (value === null) return null;
  try {
    const parsed = new Decimal(value);
    return parsed.isFinite() ? parsed : null;
  } catch {
    return null;
  }
}

function comparisonUnavailable(
  reductionPercentDecimal: string | null,
): DailyTradeProfitProtectionOutcome {
  return Object.freeze({
    reductionPercentDecimal,
    status: "comparison_unavailable",
  });
}

function cashFlow(side: "buy" | "sell", price: Decimal, quantity: Decimal): Decimal {
  const value = price.times(quantity);
  return side === "sell" ? value : value.negated();
}

function validAllocationSequence(rows: readonly AllocationRow[]): boolean {
  const executionQuantities = new Map<string, Decimal>();
  const allocatedQuantities = new Map<string, Decimal>();
  return rows.every((row, index) => {
    const allocationQuantity = decimal(row.quantity_decimal);
    const executionQuantity = decimal(row.execution_quantity_decimal);
    if (
      allocationQuantity === null ||
      executionQuantity === null ||
      !allocationQuantity.isPositive() ||
      !executionQuantity.isPositive() ||
      row.current_execution_version_id !== row.execution_version_id ||
      row.current_state !== "accepted" ||
      row.allocation_sequence !== index + 1
    ) return false;
    executionQuantities.set(row.execution_version_id, executionQuantity);
    allocatedQuantities.set(
      row.execution_version_id,
      (allocatedQuantities.get(row.execution_version_id) ?? new Decimal(0)).plus(allocationQuantity),
    );
    return true;
  }) && [...executionQuantities.entries()].every(([executionVersionId, quantity]) =>
    (allocatedQuantities.get(executionVersionId) ?? new Decimal(0)).equals(quantity));
}

/**
 * Reads only the current account's canonical execution allocations and compares
 * one saved position reduction with actual later exit prices. It deliberately
 * uses a gross basis: recorded fees remain outside both results rather than
 * inventing a fee for a larger counterfactual later fill.
 */
export function readJournalProfitProtectionOutcome(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  input: Readonly<{
    events: readonly ProfitProtectionEvent[];
    roundTripId: string;
  }>,
): DailyTradeProfitProtectionOutcome {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) return NOT_APPLICABLE;
  const partialEvents = input.events.filter((event) =>
    event.kind === "partial_exit" && Number.isFinite(Date.parse(event.executedAt)));
  if (partialEvents.length === 0) return NOT_APPLICABLE;
  if (partialEvents.length > 1) return comparisonUnavailable(null);

  const rows = database.prepare<[string, string, string], AllocationRow>(`SELECT
  round_trip_version.round_trip_version_id,
  round_trip_version.projection_state,
  round_trip_version.final_position_decimal,
  round_trip_version.direction,
  allocation.allocation_sequence,
  allocation.allocation_role,
  allocation.quantity_decimal,
  execution.execution_id,
  execution.current_version_id AS current_execution_version_id,
  execution.current_state,
  execution_version.execution_version_id,
  execution_version.quantity_decimal AS execution_quantity_decimal,
  execution_version.price_decimal,
  execution_version.side
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.workspace_id = round_trip.workspace_id
  AND round_trip_version.account_id = round_trip.account_id
  AND round_trip_version.round_trip_version_id = round_trip.current_version_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = round_trip.workspace_id
  AND allocation.account_id = round_trip.account_id
  AND allocation.round_trip_version_id = round_trip_version.round_trip_version_id
JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
  AND execution_version.account_id = allocation.account_id
  AND execution_version.execution_version_id = allocation.execution_version_id
JOIN journal_executions execution
  ON execution.workspace_id = execution_version.workspace_id
  AND execution.account_id = execution_version.account_id
  AND execution.execution_id = execution_version.execution_id
WHERE round_trip.workspace_id = ?
  AND round_trip.account_id = ?
  AND round_trip.round_trip_id = ?
  AND round_trip.lifecycle_state = 'active'
ORDER BY allocation.allocation_sequence, allocation.allocation_id`).all(
    scope.workspaceId,
    accountId,
    input.roundTripId,
  );
  if (
    rows.length === 0 ||
    rows[0]!.projection_state !== "ready_closed" ||
    rows[0]!.final_position_decimal !== "0" ||
    !validAllocationSequence(rows) ||
    rows.some((row) => row.price_decimal === null)
  ) return comparisonUnavailable(null);

  const partial = partialEvents[0]!;
  const before = decimal(partial.metrics.positionQuantityBefore);
  const after = decimal(partial.metrics.positionQuantityAfter);
  const partialQuantity = decimal(partial.quantity);
  const partialPrice = decimal(partial.price);
  if (
    before === null || after === null || partialQuantity === null || partialPrice === null ||
    !before.isPositive() || !partialQuantity.isPositive()
  ) return comparisonUnavailable(null);
  const reducedQuantity = before.minus(after);
  const reductionPercentDecimal = reducedQuantity.isPositive()
    ? reducedQuantity.dividedBy(before).times(100).toFixed()
    : null;
  if (
    reductionPercentDecimal === null || !reducedQuantity.equals(partialQuantity)
  ) return comparisonUnavailable(reductionPercentDecimal);

  const partialAllocationIndex = rows.findIndex((row) =>
    row.execution_id === partial.eventId && row.allocation_role === "reducing");
  if (partialAllocationIndex < 0) return comparisonUnavailable(reductionPercentDecimal);
  const partialAllocation = rows[partialAllocationIndex]!;
  const partialAllocationQuantity = decimal(partialAllocation.quantity_decimal);
  const partialAllocationPrice = decimal(partialAllocation.price_decimal);
  if (
    partialAllocationQuantity === null || partialAllocationPrice === null ||
    !partialAllocationQuantity.equals(reducedQuantity) ||
    !partialAllocationPrice.equals(partialPrice)
  ) return comparisonUnavailable(reductionPercentDecimal);

  const laterAllocations = rows.slice(partialAllocationIndex + 1);
  if (laterAllocations.some((row) =>
    row.allocation_role === "opening" ||
    row.allocation_role === "adding" ||
    row.allocation_role === "flip_opening" ||
    row.allocation_role === "flip_closing" ||
    row.side !== partialAllocation.side,
  )) return comparisonUnavailable(reductionPercentDecimal);

  let remainingQuantity = reducedQuantity;
  let laterExitCashFlow = new Decimal(0);
  for (const row of laterAllocations) {
    if (remainingQuantity.isZero()) break;
    if (row.allocation_role !== "reducing" && row.allocation_role !== "closing") {
      return comparisonUnavailable(reductionPercentDecimal);
    }
    const quantity = decimal(row.quantity_decimal);
    const price = decimal(row.price_decimal);
    if (quantity === null || price === null || !quantity.isPositive()) {
      return comparisonUnavailable(reductionPercentDecimal);
    }
    const assignedQuantity = Decimal.min(remainingQuantity, quantity);
    laterExitCashFlow = laterExitCashFlow.plus(cashFlow(row.side, price, assignedQuantity));
    remainingQuantity = remainingQuantity.minus(assignedQuantity);
  }
  if (!remainingQuantity.isZero()) return comparisonUnavailable(reductionPercentDecimal);

  const actualGrossResult = rows.reduce((total, row) => {
    const quantity = decimal(row.quantity_decimal);
    const price = decimal(row.price_decimal);
    return quantity === null || price === null ? total : total.plus(cashFlow(row.side, price, quantity));
  }, new Decimal(0));
  const counterfactualGrossResult = actualGrossResult
    .minus(cashFlow(partialAllocation.side, partialAllocationPrice, reducedQuantity))
    .plus(laterExitCashFlow);
  const difference = counterfactualGrossResult.minus(actualGrossResult);
  if (difference.isNegative()) {
    return Object.freeze({
      actualGrossResultDecimal: actualGrossResult.toFixed(),
      avoidedAdditionalLossDecimal: difference.abs().toFixed(),
      counterfactualGrossResultDecimal: counterfactualGrossResult.toFixed(),
      moneyBasis: "gross",
      reductionPercentDecimal,
      status: "avoided_additional_loss",
    });
  }
  if (difference.isPositive()) {
    return Object.freeze({
      actualGrossResultDecimal: actualGrossResult.toFixed(),
      additionalProfitGivenUpDecimal: difference.toFixed(),
      counterfactualGrossResultDecimal: counterfactualGrossResult.toFixed(),
      moneyBasis: "gross",
      reductionPercentDecimal,
      status: "gave_up_additional_profit",
    });
  }
  return Object.freeze({
    actualGrossResultDecimal: actualGrossResult.toFixed(),
    counterfactualGrossResultDecimal: counterfactualGrossResult.toFixed(),
    moneyBasis: "gross",
    reductionPercentDecimal,
    status: "no_difference",
  });
}
