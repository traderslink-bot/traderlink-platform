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
): Readonly<{ key: string; label: string }> {
  switch (grouping) {
    case "closing_day":
      return Object.freeze({
        key: row.closeLocal.localDate,
        label: row.closeLocal.localDate,
      });
    case "instrument":
      return Object.freeze({
        key: row.instrumentId,
        label: row.displayedSymbol,
      });
    case "entry_time_bucket":
      return Object.freeze({
        key: row.entryLocal.bucket30Minute,
        label: row.entryLocal.bucket30Minute,
      });
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
    grossRows: Object.freeze([...rows]),
    netRows: Object.freeze(netRows),
    basisRows: Object.freeze(basisRows),
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
): JournalAnalyticsGroupingResult {
  const groups: JournalAnalyticsGroupResult[] = [];
  for (const grouping of groupings.filter((value) => value !== "total")) {
    const rowGroups = new Map<string, {
      label: string;
      rows: NormalizedJournalAnalyticsRow[];
    }>();
    for (const row of population.grossRows) {
      const descriptor = groupDescriptor(row, grouping);
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
