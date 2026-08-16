import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  JournalAnalyticsMoneyBasis,
  JournalAnalyticsTableOrder,
} from "../contracts/analytics-query";
import type {
  JournalAnalyticsRoundTripTableResponse,
  JournalAnalyticsRoundTripTableRow,
} from "../contracts/analytics-result";
import { JOURNAL_ANALYTICS_RESULT_VERSION } from "../contracts/analytics-result";
import {
  compareExactDecimals,
  divideExactDecimals,
  multiplyExactDecimals,
  percentageExactDecimals,
} from "./exact-analytics-math";
import type { JournalAnalyticsPopulation } from "./analytics-population";
import type { NormalizedJournalAnalyticsRow } from "./normalize-journal-analytics-facts";

type TableCursor = Readonly<{
  closedAtUtc: string;
  factSetRevisionSha256: string;
  queryDigestSha256: string;
  roundTripId: string;
  sortDirection: JournalAnalyticsTableOrder["direction"];
  sortField: JournalAnalyticsTableOrder["field"];
}>;

export const DEFAULT_JOURNAL_ANALYTICS_TABLE_ORDER = Object.freeze({
  field: "closed_at" as const,
  direction: "descending" as const,
});

function selectedPnl(
  row: NormalizedJournalAnalyticsRow,
  moneyBasis: JournalAnalyticsMoneyBasis,
): string | null {
  return moneyBasis === "gross" ? row.grossPnlDecimal : row.netPnlDecimal;
}

function compareNullable(
  left: string | number | null,
  right: string | number | null,
  direction: JournalAnalyticsTableOrder["direction"],
  compare: (leftValue: string | number, rightValue: string | number) => number,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  const comparison = compare(left, right);
  return direction === "ascending" ? comparison : -comparison;
}

function compareReturns(
  left: NormalizedJournalAnalyticsRow,
  right: NormalizedJournalAnalyticsRow,
  moneyBasis: JournalAnalyticsMoneyBasis,
  direction: JournalAnalyticsTableOrder["direction"],
): number {
  const leftPnl = selectedPnl(left, moneyBasis);
  const rightPnl = selectedPnl(right, moneyBasis);
  const leftAvailable = leftPnl !== null &&
    compareExactDecimals(left.entryNotionalDecimal, "0") !== 0;
  const rightAvailable = rightPnl !== null &&
    compareExactDecimals(right.entryNotionalDecimal, "0") !== 0;
  if (!leftAvailable && !rightAvailable) return 0;
  if (!leftAvailable) return 1;
  if (!rightAvailable) return -1;
  const comparison = compareExactDecimals(
    multiplyExactDecimals(leftPnl!, right.entryNotionalDecimal),
    multiplyExactDecimals(rightPnl!, left.entryNotionalDecimal),
  );
  return direction === "ascending" ? comparison : -comparison;
}

function compareRows(
  left: NormalizedJournalAnalyticsRow,
  right: NormalizedJournalAnalyticsRow,
  moneyBasis: JournalAnalyticsMoneyBasis,
  order: JournalAnalyticsTableOrder,
): number {
  let comparison: number;
  switch (order.field) {
    case "closed_at":
      comparison = left.closedAtUtc.localeCompare(right.closedAtUtc);
      comparison = order.direction === "ascending" ? comparison : -comparison;
      break;
    case "selected_pnl":
      comparison = compareNullable(
        selectedPnl(left, moneyBasis),
        selectedPnl(right, moneyBasis),
        order.direction,
        (leftValue, rightValue) => compareExactDecimals(
          String(leftValue),
          String(rightValue),
        ),
      );
      break;
    case "return_percent":
      comparison = compareReturns(left, right, moneyBasis, order.direction);
      break;
    case "holding_duration":
      comparison = left.holdingDurationMilliseconds -
        right.holdingDurationMilliseconds;
      comparison = order.direction === "ascending" ? comparison : -comparison;
      break;
    case "entered_quantity":
      comparison = compareExactDecimals(
        left.enteredQuantityDecimal,
        right.enteredQuantityDecimal,
      );
      comparison = order.direction === "ascending" ? comparison : -comparison;
      break;
    case "entry_notional":
      comparison = compareExactDecimals(
        left.entryNotionalDecimal,
        right.entryNotionalDecimal,
      );
      comparison = order.direction === "ascending" ? comparison : -comparison;
      break;
  }
  if (comparison !== 0) return comparison;
  return right.closedAtUtc.localeCompare(left.closedAtUtc) ||
    right.roundTripId.localeCompare(left.roundTripId);
}

function orderedRows(
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
  order: JournalAnalyticsTableOrder,
): readonly NormalizedJournalAnalyticsRow[] {
  const rows = moneyBasis === "gross" ? population.grossRows : population.netRows;
  return Object.freeze([...rows].sort((left, right) =>
    compareRows(left, right, moneyBasis, order)));
}

function encodeCursor(
  row: NormalizedJournalAnalyticsRow,
  order: JournalAnalyticsTableOrder,
  population: JournalAnalyticsPopulation,
): string {
  return Buffer.from(JSON.stringify({
    closedAtUtc: row.closedAtUtc,
    factSetRevisionSha256: population.factSetRevisionSha256,
    queryDigestSha256: population.queryDigestSha256,
    roundTripId: row.roundTripId,
    sortDirection: order.direction,
    sortField: order.field,
  }), "utf8").toString("base64url");
}

function decodeCursor(
  value: string,
  order: JournalAnalyticsTableOrder,
  population: JournalAnalyticsPopulation,
): TableCursor {
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    const keys = decoded !== null && typeof decoded === "object"
      ? Object.keys(decoded).sort().join(",")
      : "";
    if (
      decoded === null || typeof decoded !== "object" ||
      keys !== "closedAtUtc,factSetRevisionSha256,queryDigestSha256,roundTripId,sortDirection,sortField" ||
      typeof (decoded as TableCursor).closedAtUtc !== "string" ||
      (decoded as TableCursor).factSetRevisionSha256 !== population.factSetRevisionSha256 ||
      (decoded as TableCursor).queryDigestSha256 !== population.queryDigestSha256 ||
      typeof (decoded as TableCursor).roundTripId !== "string" ||
      (decoded as TableCursor).sortField !== order.field ||
      (decoded as TableCursor).sortDirection !== order.direction
    ) throw new Error("invalid cursor");
    return Object.freeze({
      closedAtUtc: (decoded as TableCursor).closedAtUtc,
      factSetRevisionSha256: population.factSetRevisionSha256,
      queryDigestSha256: population.queryDigestSha256,
      roundTripId: (decoded as TableCursor).roundTripId,
      sortDirection: order.direction,
      sortField: order.field,
    });
  } catch {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "table.afterCursor",
    });
  }
}

function publicRow(
  row: NormalizedJournalAnalyticsRow,
  moneyBasis: JournalAnalyticsMoneyBasis,
): JournalAnalyticsRoundTripTableRow {
  const selectedPnlDecimal = moneyBasis === "gross"
    ? row.grossPnlDecimal
    : row.netPnlDecimal;
  const averageEntryPriceDecimal = compareExactDecimals(row.enteredQuantityDecimal, "0") === 0
    ? null
    : divideExactDecimals(row.entryNotionalDecimal, row.enteredQuantityDecimal, {
        decimalPlaces: 4,
        roundingPolicy: "half_up_4dp",
      }).roundedDecimal;
  const averageExitPriceDecimal = compareExactDecimals(row.exitQuantityDecimal, "0") === 0
    ? null
    : divideExactDecimals(row.exitNotionalDecimal, row.exitQuantityDecimal, {
        decimalPlaces: 4,
        roundingPolicy: "half_up_4dp",
      }).roundedDecimal;
  return Object.freeze({
    roundTripId: row.roundTripId,
    displayedSymbol: row.displayedSymbol,
    direction: row.direction,
    openedAtUtc: row.openedAtUtc,
    closedAtUtc: row.closedAtUtc,
    entryLocalDate: row.entryLocal.localDate,
    closeLocalDate: row.closeLocal.localDate,
    tradeClassification: row.tradeClassification,
    provenance: row.provenanceGroup,
    selectedPnlDecimal,
    grossPnlDecimal: row.grossPnlDecimal,
    chargeCoverage: row.chargeCoverage,
    chargeCostDecimal: row.chargeCostDecimal,
    chargeCreditDecimal: row.chargeCreditDecimal,
    uniqueExecutionCount: row.uniqueExecutionCount,
    enteredQuantityDecimal: row.enteredQuantityDecimal,
    maximumPositionQuantityDecimal: row.maximumPositionQuantityDecimal,
    entryNotionalDecimal: row.entryNotionalDecimal,
    averageEntryPriceDecimal,
    averageExitPriceDecimal,
    returnPercentDecimal: selectedPnlDecimal === null || compareExactDecimals(row.entryNotionalDecimal, "0") === 0
      ? null
      : percentageExactDecimals(selectedPnlDecimal, row.entryNotionalDecimal).roundedDecimal,
    holdingDurationMilliseconds: row.holdingDurationMilliseconds,
  });
}

export function buildJournalAnalyticsRoundTripTable(
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
  pageSize: number,
  afterCursor: string | null,
  generatedAtUtc: string,
  order: JournalAnalyticsTableOrder = DEFAULT_JOURNAL_ANALYTICS_TABLE_ORDER,
): JournalAnalyticsRoundTripTableResponse {
  const ordered = orderedRows(population, moneyBasis, order);
  let startIndex = 0;
  if (afterCursor !== null) {
    const cursor = decodeCursor(afterCursor, order, population);
    const index = ordered.findIndex((row) =>
      row.closedAtUtc === cursor.closedAtUtc && row.roundTripId === cursor.roundTripId);
    if (index < 0) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "table.afterCursor",
      });
    }
    startIndex = index + 1;
  }
  const selected = ordered.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + selected.length < ordered.length;
  return Object.freeze({
    resultVersion: JOURNAL_ANALYTICS_RESULT_VERSION,
    factSetRevisionSha256: population.factSetRevisionSha256,
    generatedAtUtc,
    moneyBasis,
    currency: population.currency,
    timezone: population.tradingTimezone,
    totalRowCount: ordered.length,
    rows: Object.freeze(selected.map((row) => publicRow(row, moneyBasis))),
    continuationCursor: hasMore && selected.length > 0
      ? encodeCursor(selected.at(-1)!, order, population)
      : null,
    limitations: Object.freeze(hasMore ? ["rows_bounded"] : []),
  });
}
