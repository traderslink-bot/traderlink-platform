import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type { JournalAnalyticsMoneyBasis } from "../contracts/analytics-query";
import type {
  JournalAnalyticsRoundTripTableResponse,
  JournalAnalyticsRoundTripTableRow,
} from "../contracts/analytics-result";
import { JOURNAL_ANALYTICS_RESULT_VERSION } from "../contracts/analytics-result";
import {
  compareExactDecimals,
  divideExactDecimals,
  percentageExactDecimals,
} from "./exact-analytics-math";
import type { JournalAnalyticsPopulation } from "./analytics-population";
import type { NormalizedJournalAnalyticsRow } from "./normalize-journal-analytics-facts";

type TableCursor = Readonly<{
  closedAtUtc: string;
  roundTripId: string;
}>;

function orderedRows(
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
): readonly NormalizedJournalAnalyticsRow[] {
  const rows = moneyBasis === "gross" ? population.grossRows : population.netRows;
  return Object.freeze([...rows].sort((left, right) =>
    right.closedAtUtc.localeCompare(left.closedAtUtc) ||
    right.roundTripId.localeCompare(left.roundTripId)));
}

function encodeCursor(row: NormalizedJournalAnalyticsRow): string {
  return Buffer.from(JSON.stringify({
    closedAtUtc: row.closedAtUtc,
    roundTripId: row.roundTripId,
  }), "utf8").toString("base64url");
}

function decodeCursor(value: string): TableCursor {
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (
      decoded === null || typeof decoded !== "object" ||
      Object.keys(decoded).sort().join(",") !== "closedAtUtc,roundTripId" ||
      typeof (decoded as TableCursor).closedAtUtc !== "string" ||
      typeof (decoded as TableCursor).roundTripId !== "string"
    ) throw new Error("invalid cursor");
    return Object.freeze({
      closedAtUtc: (decoded as TableCursor).closedAtUtc,
      roundTripId: (decoded as TableCursor).roundTripId,
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
): JournalAnalyticsRoundTripTableResponse {
  const ordered = orderedRows(population, moneyBasis);
  let startIndex = 0;
  if (afterCursor !== null) {
    const cursor = decodeCursor(afterCursor);
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
      ? encodeCursor(selected.at(-1)!)
      : null,
    limitations: Object.freeze(hasMore ? ["rows_bounded"] : []),
  });
}
