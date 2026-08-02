import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  JournalAnalyticsGrouping,
  JournalAnalyticsMoneyBasis,
} from "../contracts/analytics-query";
import { JOURNAL_ANALYTICS_MAX_GROUP_ROWS } from "../contracts/analytics-query";
import type {
  JournalAnalyticsCoverage,
  JournalAnalyticsGroupResult,
} from "../contracts/analytics-result";
import { accumulateJournalAnalyticsMetrics } from "./analytics-accumulator";
import type { JournalAnalyticsPopulation } from "./analytics-population";
import {
  compareExactDecimals,
  sumExactDecimals,
} from "./exact-analytics-math";
import type { NormalizedJournalAnalyticsRow } from "./normalize-journal-analytics-facts";

export type JournalAnalyticsGroupingResult = Readonly<{
  groups: readonly JournalAnalyticsGroupResult[];
  reconciliation: Readonly<{
    status: "reconciled";
    reasonCode: null;
  }>;
}>;

function groupDescriptor(
  row: NormalizedJournalAnalyticsRow,
  grouping: JournalAnalyticsGrouping,
  moneyBasis: JournalAnalyticsMoneyBasis,
  entryTimeBucketMinutes: 5 | 15 | 30 | 60,
  accountOrdinals: ReadonlyMap<string, number>,
): Readonly<{ key: string; label: string }> {
  const decimalBucket = (value: string) => {
    if (compareExactDecimals(value, "0") === 0) {
      return Object.freeze({ key: "zero", label: "0" });
    }
    for (const boundary of ["10", "100", "1000", "10000"]) {
      if (compareExactDecimals(value, boundary) <= 0) {
        return Object.freeze({
          key: `up_to_${boundary}`,
          label: `Up to ${boundary}`,
        });
      }
    }
    return Object.freeze({ key: "over_10000", label: "Over 10000" });
  };
  const isoWeek = (localDate: string) => {
    const [year, month, day] = localDate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const weekday = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - weekday);
    const isoYear = date.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
    return `${isoYear}-W${String(week).padStart(2, "0")}`;
  };
  switch (grouping) {
    case "closing_day":
      return Object.freeze({
        key: row.closeLocal.localDate,
        label: row.closeLocal.localDate,
      });
    case "instrument":
      return Object.freeze({
        key: row.displayedSymbol,
        label: row.displayedSymbol,
      });
    case "entry_time_bucket":
      const bucketMinute = Math.floor(
        row.entryLocal.minute / entryTimeBucketMinutes,
      ) * entryTimeBucketMinutes;
      return Object.freeze({
        key: `${String(row.entryLocal.hour).padStart(2, "0")}:${String(bucketMinute).padStart(2, "0")}`,
        label: `${String(row.entryLocal.hour).padStart(2, "0")}:${String(bucketMinute).padStart(2, "0")}`,
      });
    case "closing_iso_week": {
      const value = isoWeek(row.closeLocal.localDate);
      return Object.freeze({ key: value, label: value });
    }
    case "closing_month": {
      const value = row.closeLocal.localDate.slice(0, 7);
      return Object.freeze({ key: value, label: value });
    }
    case "closing_year": {
      const value = row.closeLocal.localDate.slice(0, 4);
      return Object.freeze({ key: value, label: value });
    }
    case "entry_weekday":
      return Object.freeze({ key: row.entryLocal.weekday, label: row.entryLocal.weekday });
    case "direction":
      return Object.freeze({ key: row.direction, label: row.direction });
    case "account": {
      const ordinal = accountOrdinals.get(row.accountId);
      if (ordinal === undefined) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "analytics_account_group_ordinal",
        });
      }
      return Object.freeze({
        key: `account_${ordinal}`,
        label: `Account ${ordinal}`,
      });
    }
    case "provenance":
      return Object.freeze({ key: row.provenanceGroup, label: row.provenanceGroup });
    case "holding_duration_bucket": {
      const minute = 60_000;
      const hour = 60 * minute;
      if (row.holdingDurationMilliseconds < minute) return Object.freeze({ key: "under_1m", label: "Under 1 minute" });
      if (row.holdingDurationMilliseconds < 5 * minute) return Object.freeze({ key: "1m_to_5m", label: "1 to 5 minutes" });
      if (row.holdingDurationMilliseconds < 15 * minute) return Object.freeze({ key: "5m_to_15m", label: "5 to 15 minutes" });
      if (row.holdingDurationMilliseconds < 30 * minute) return Object.freeze({ key: "15m_to_30m", label: "15 to 30 minutes" });
      if (row.holdingDurationMilliseconds < hour) return Object.freeze({ key: "30m_to_1h", label: "30 minutes to 1 hour" });
      if (row.holdingDurationMilliseconds < 4 * hour) return Object.freeze({ key: "1h_to_4h", label: "1 to 4 hours" });
      return Object.freeze({ key: "4h_or_more", label: "4 hours or more" });
    }
    case "entered_quantity_bucket":
      return decimalBucket(row.enteredQuantityDecimal);
    case "maximum_position_bucket":
      return decimalBucket(row.maximumPositionQuantityDecimal);
    case "entry_notional_bucket":
      return decimalBucket(row.entryNotionalDecimal);
    case "realized_outcome": {
      const value = moneyBasis === "gross" ? row.grossOutcome : row.netOutcome;
      if (value === null) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "analytics_group_net_outcome",
        });
      }
      return Object.freeze({ key: value, label: value });
    }
    default:
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "grouping",
      });
  }
}

function groupCoverage(
  rows: readonly NormalizedJournalAnalyticsRow[],
  netRows: readonly NormalizedJournalAnalyticsRow[],
  basisRows: readonly NormalizedJournalAnalyticsRow[],
): JournalAnalyticsCoverage {
  const feeIncomplete = rows.filter((row) => row.netPnlDecimal === null);
  const reasons: Record<string, number> = {};
  for (const row of feeIncomplete) {
    for (const reason of row.chargeUnavailableReasonCodes) {
      reasons[reason] = (reasons[reason] ?? 0) + 1;
    }
  }
  return Object.freeze({
    state: rows.length === 0
      ? "empty"
      : feeIncomplete.length > 0
        ? "partial"
        : "complete",
    candidateCount: rows.length,
    includedCount: basisRows.length,
    excludedCount: 0,
    readyClosedCount: rows.length,
    legitimateOpenCount: 0,
    needsDecisionCount: 0,
    unsupportedCount: 0,
    feeCompleteCount: netRows.length,
    feeIncompleteCount: feeIncomplete.length,
    unavailableCount: 0,
    reasonCounts: Object.freeze(Object.fromEntries(
      Object.entries(reasons).sort(([left], [right]) =>
        left.localeCompare(right)),
    )),
  });
}

function populationForGroup(
  population: JournalAnalyticsPopulation,
  rows: readonly NormalizedJournalAnalyticsRow[],
  moneyBasis: JournalAnalyticsMoneyBasis,
  suffix: string,
): JournalAnalyticsPopulation {
  const netRows = rows.filter((row) => row.netPnlDecimal !== null);
  const basisRows = moneyBasis === "gross" ? rows : netRows;
  return Object.freeze({
    partitionKey: `${population.partitionKey}:${suffix}`,
    currency: population.currency,
    tradingTimezone: population.tradingTimezone,
    factSetRevisionSha256: population.factSetRevisionSha256,
    queryDigestSha256: population.queryDigestSha256,
    grossRows: Object.freeze([...rows]),
    netRows: Object.freeze(netRows),
    basisRows: Object.freeze(basisRows),
    legitimateOpenRoundTrips: Object.freeze([]),
    needsDecisionRoundTrips: Object.freeze([]),
    pendingDecisionFacts: Object.freeze([]),
    asOfUtc: population.asOfUtc,
    sourceCoverage: Object.freeze({
      exactScope: false,
      sourceRecordCount: 0,
      importCount: 0,
      decisionCount: 0,
      positionFactCount: 0,
      acceptedExecutionCount: 0,
      importIssueCount: 0,
      exactReimportEventCount: 0,
      duplicateSourceRecordCount: 0,
      acceptedSourceLimitationCount: 0,
      completeCoverageIntervalCount: 0,
      coverageGapCount: 0,
    }),
    coverage: groupCoverage(rows, netRows, basisRows),
    limitations: Object.freeze([]),
  });
}

function requireReconciliation(
  population: JournalAnalyticsPopulation,
  groupedPopulations: readonly JournalAnalyticsPopulation[],
): void {
  const groupedGrossRows = groupedPopulations.flatMap((group) => group.grossRows);
  const groupedNetRows = groupedPopulations.flatMap((group) => group.netRows);
  const groupedBasisRows = groupedPopulations.flatMap((group) => group.basisRows);
  if (
    groupedGrossRows.length !== population.grossRows.length ||
    groupedNetRows.length !== population.netRows.length ||
    groupedBasisRows.length !== population.basisRows.length ||
    compareExactDecimals(
      sumExactDecimals(groupedGrossRows.map((row) => row.grossPnlDecimal)),
      sumExactDecimals(population.grossRows.map((row) => row.grossPnlDecimal)),
    ) !== 0 ||
    compareExactDecimals(
      sumExactDecimals(groupedNetRows.map((row) => row.netPnlDecimal!)),
      sumExactDecimals(population.netRows.map((row) => row.netPnlDecimal!)),
    ) !== 0
  ) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_group_reconciliation",
    });
  }
}

export function groupJournalAnalyticsPopulation(
  population: JournalAnalyticsPopulation,
  groupings: readonly JournalAnalyticsGrouping[],
  metricIds: readonly string[],
  moneyBasis: JournalAnalyticsMoneyBasis,
  entryTimeBucketMinutes: 5 | 15 | 30 | 60 = 30,
): JournalAnalyticsGroupingResult {
  const groups: JournalAnalyticsGroupResult[] = [];
  const accountOrdinals = new Map([...new Set(population.grossRows.map((row) =>
    row.accountId))].sort().map((accountId, index) => [accountId, index + 1]));
  for (const grouping of groupings.filter((value) => value !== "total")) {
    const rowGroups = new Map<string, {
      label: string;
      rows: NormalizedJournalAnalyticsRow[];
    }>();
    for (const row of population.grossRows) {
      const descriptor = groupDescriptor(
        row,
        grouping,
        moneyBasis,
        entryTimeBucketMinutes,
        accountOrdinals,
      );
      const existing = rowGroups.get(descriptor.key) ?? {
        label: descriptor.label,
        rows: [],
      };
      if (existing.label !== descriptor.label) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "analytics_group_label_conflict",
        });
      }
      existing.rows.push(row);
      rowGroups.set(descriptor.key, existing);
    }
    if (rowGroups.size > JOURNAL_ANALYTICS_MAX_GROUP_ROWS) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "groupRowLimit",
      });
    }
    const groupedPopulations = [...rowGroups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => Object.freeze({
        key,
        label: value.label,
        population: populationForGroup(
          population,
          value.rows,
          moneyBasis,
          `${grouping}:${key}`,
        ),
      }));
    requireReconciliation(
      population,
      groupedPopulations.map((group) => group.population),
    );
    for (const group of groupedPopulations) {
      groups.push(Object.freeze({
        grouping,
        groupKey: group.key,
        label: group.label,
        metrics: accumulateJournalAnalyticsMetrics(
          group.population,
          metricIds,
          moneyBasis,
        ),
      }));
    }
  }
  return Object.freeze({
    groups: Object.freeze(groups),
    reconciliation: Object.freeze({
      status: "reconciled" as const,
      reasonCode: null,
    }),
  });
}
