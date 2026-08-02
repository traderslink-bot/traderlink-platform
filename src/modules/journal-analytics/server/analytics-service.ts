import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalAnalyticsFactSet } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";

import type { JournalAnalyticsQuery } from "../contracts/analytics-query";
import type {
  JournalAnalyticsPartitionedResponse,
  JournalAnalyticsResponse,
  JournalAnalyticsRoundTripTableResponse,
} from "../contracts/analytics-result";
import { JOURNAL_ANALYTICS_RESULT_VERSION } from "../contracts/analytics-result";
import { JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION } from "../contracts/metric-registry";
import { accumulateJournalAnalyticsMetrics } from "./analytics-accumulator";
import { groupJournalAnalyticsPopulation } from "./analytics-grouping";
import { journalAnalyticsMetricRegistry } from "./analytics-metric-registry";
import { buildJournalAnalyticsPopulations } from "./analytics-population";
import { buildJournalAnalyticsRoundTripTable } from "./analytics-table";
import { normalizeJournalAnalyticsFacts } from "./normalize-journal-analytics-facts";

function selectedAccountSourceCoverage(
  factSet: JournalAnalyticsFactSet,
  accountIds: readonly string[],
): JournalAnalyticsPartitionedResponse["selectedAccountSourceCoverage"] {
  const accounts = factSet.accounts.filter((account) =>
    accountIds.includes(account.accountId));
  return Object.freeze({
    excludedExecutionCount: accounts.reduce((sum, account) =>
      sum + (account.coverage.executions.byState.excluded_by_trader ?? 0), 0),
    unsupportedSourceRecordCount: accounts.reduce((sum, account) =>
      sum + account.coverage.unsupportedSourceRecords.total, 0),
    attribution: "selected_accounts_full_scope" as const,
  });
}

export function calculateJournalAnalyticsResponse(
  factSet: JournalAnalyticsFactSet,
  query: JournalAnalyticsQuery,
): JournalAnalyticsPartitionedResponse {
  const normalized = normalizeJournalAnalyticsFacts(factSet);
  const populations = buildJournalAnalyticsPopulations(normalized, query);
  const partitions = Object.freeze(populations.map((population) => {
    const grouping = groupJournalAnalyticsPopulation(
      population,
      query.groupings,
      query.metricIds,
      query.moneyBasis,
      query.entryTimeBucketMinutes,
    );
    const response: JournalAnalyticsResponse = Object.freeze({
      resultVersion: JOURNAL_ANALYTICS_RESULT_VERSION,
      factSetRevisionSha256: factSet.sourceRevisionSha256,
      registryVersion: JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION,
      generatedAtUtc: factSet.generatedAtUtc,
      currency: population.currency,
      timezone: population.tradingTimezone,
      metrics: accumulateJournalAnalyticsMetrics(
        population,
        query.metricIds,
        query.moneyBasis,
      ),
      groups: grouping.groups,
      coverage: population.coverage,
      continuationCursor: null,
      limitations: population.limitations,
      reconciliation: query.groupings.some((value) => value !== "total")
        ? grouping.reconciliation
        : Object.freeze({
            status: "not_applicable" as const,
            reasonCode: null,
          }),
    });
    return response;
  }));
  const limitations = new Set(populations.flatMap((population) =>
    population.limitations));
  const currencies = new Set(partitions.map((partition) => partition.currency));
  const timezones = new Set(partitions.map((partition) => partition.timezone));
  if (currencies.size > 1) limitations.add("money_partitioned_by_currency");
  if (timezones.size > 1) limitations.add("calendar_partitioned_by_timezone");
  return Object.freeze({
    resultVersion: JOURNAL_ANALYTICS_RESULT_VERSION,
    factSetRevisionSha256: factSet.sourceRevisionSha256,
    registryVersion: JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION,
    generatedAtUtc: factSet.generatedAtUtc,
    partitions,
    selectedAccountSourceCoverage: selectedAccountSourceCoverage(
      factSet,
      query.accountIds,
    ),
    crossPartitionCounts: Object.freeze({
      candidateCount: partitions.reduce((sum, partition) =>
        sum + partition.coverage.candidateCount, 0),
      includedCount: partitions.reduce((sum, partition) =>
        sum + partition.coverage.includedCount, 0),
      readyClosedCount: partitions.reduce((sum, partition) =>
        sum + partition.coverage.readyClosedCount, 0),
      legitimateOpenCount: partitions.reduce((sum, partition) =>
        sum + partition.coverage.legitimateOpenCount, 0),
      needsDecisionCount: partitions.reduce((sum, partition) =>
        sum + partition.coverage.needsDecisionCount, 0),
      feeCompleteCount: partitions.reduce((sum, partition) =>
        sum + partition.coverage.feeCompleteCount, 0),
      feeIncompleteCount: partitions.reduce((sum, partition) =>
        sum + partition.coverage.feeIncompleteCount, 0),
    }),
    limitations: Object.freeze([...limitations].sort()),
  });
}

export function calculateJournalAnalyticsRoundTripTableResponse(
  factSet: JournalAnalyticsFactSet,
  query: JournalAnalyticsQuery,
): JournalAnalyticsRoundTripTableResponse {
  const normalized = normalizeJournalAnalyticsFacts(factSet);
  const populations = buildJournalAnalyticsPopulations(normalized, query);
  if (populations.length !== 1) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "table.singlePartitionRequired",
    });
  }
  return buildJournalAnalyticsRoundTripTable(
    populations[0],
    query.moneyBasis,
    query.table.pageSize,
    query.table.afterCursor,
    factSet.generatedAtUtc,
  );
}

export class JournalAnalyticsService {
  constructor(private readonly facts: JournalAnalyticsFactSetService) {}

  getAnalyticsOverview(
    scope: WorkspaceAccessScope,
    query: JournalAnalyticsQuery,
  ): JournalAnalyticsPartitionedResponse {
    const factSet = this.facts.getJournalAnalyticsFactSet(scope, {
      accountIds: query.accountIds,
      closingDateRange: query.closingDateRange,
      currencySelection: query.currency === null
        ? Object.freeze({ kind: "all_partitions" as const })
        : Object.freeze({
            kind: "single_currency" as const,
            currency: query.currency,
          }),
    });
    return calculateJournalAnalyticsResponse(factSet, query);
  }

  getPerformanceAnalytics(
    scope: WorkspaceAccessScope,
    query: JournalAnalyticsQuery,
  ): JournalAnalyticsPartitionedResponse {
    return this.getAnalyticsOverview(scope, query);
  }

  getResultAnalytics(
    scope: WorkspaceAccessScope,
    query: JournalAnalyticsQuery,
  ): JournalAnalyticsPartitionedResponse {
    return this.getAnalyticsOverview(scope, query);
  }

  getTimingAnalytics(
    scope: WorkspaceAccessScope,
    query: JournalAnalyticsQuery,
  ): JournalAnalyticsPartitionedResponse {
    return this.getAnalyticsOverview(scope, query);
  }

  getExecutionAnalytics(
    scope: WorkspaceAccessScope,
    query: JournalAnalyticsQuery,
  ): JournalAnalyticsPartitionedResponse {
    return this.getAnalyticsOverview(scope, query);
  }

  getRoundTripAnalyticsTable(
    scope: WorkspaceAccessScope,
    query: JournalAnalyticsQuery,
  ): JournalAnalyticsRoundTripTableResponse {
    const factSet = this.facts.getJournalAnalyticsFactSet(scope, {
      accountIds: query.accountIds,
      closingDateRange: query.closingDateRange,
      currencySelection: query.currency === null
        ? Object.freeze({ kind: "all_partitions" as const })
        : Object.freeze({
            kind: "single_currency" as const,
            currency: query.currency,
          }),
    });
    return calculateJournalAnalyticsRoundTripTableResponse(factSet, query);
  }

  getAnalyticsCapabilityMetadata() {
    return journalAnalyticsMetricRegistry;
  }

  getWorkspaceJournalAnalyticsSummary(
    scope: WorkspaceAccessScope,
    query: JournalAnalyticsQuery,
  ): JournalAnalyticsPartitionedResponse {
    return this.getAnalyticsOverview(scope, query);
  }
}
