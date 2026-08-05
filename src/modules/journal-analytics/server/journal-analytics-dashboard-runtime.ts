import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import type { JournalAnalyticsClosingDateRange } from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import {
  JOURNAL_ANALYTICS_QUERY_VERSION,
  type JournalAnalyticsGrouping,
  type JournalAnalyticsMoneyBasis,
  type JournalAnalyticsQuery,
} from "../contracts/analytics-query";
import { JournalAnalyticsService } from "./analytics-service";
import { JournalDashboardReadModelService } from "./journal-dashboard-read-model-service";

export function requireActiveJournalAnalyticsAccountId(
  scope: WorkspaceAccessScope,
): string {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return accountId;
}

export function buildJournalAnalyticsDashboardQuery(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    metricIds: readonly string[];
    groupings?: readonly JournalAnalyticsGrouping[];
    moneyBasis?: JournalAnalyticsMoneyBasis;
    currency?: string | null;
    afterCursor?: string | null;
    pageSize?: number;
    asOfUtc?: string;
    closingDateRange?: JournalAnalyticsClosingDateRange;
    instrumentIds?: readonly string[];
  }>,
): JournalAnalyticsQuery {
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([requireActiveJournalAnalyticsAccountId(scope)]),
    metricIds: Object.freeze([...new Set(input.metricIds)].sort()),
    moneyBasis: input.moneyBasis ?? "net",
    closingDateRange: input.closingDateRange ??
      Object.freeze({ kind: "all_available" as const }),
    currency: input.currency ?? null,
    instrumentIds: Object.freeze(input.instrumentIds ? [...input.instrumentIds] : []),
    symbols: Object.freeze([]),
    directions: Object.freeze([]),
    tradeClassifications: Object.freeze([]),
    provenance: Object.freeze([]),
    outcomes: Object.freeze([]),
    entryWeekdays: Object.freeze([]),
    entryTimeBuckets: Object.freeze([]),
    holdingDurationRange: Object.freeze({
      minimumMillisecondsInclusive: null,
      maximumMillisecondsInclusive: null,
    }),
    enteredQuantityRange: Object.freeze({
      minimumInclusive: null,
      maximumInclusive: null,
    }),
    maximumPositionRange: Object.freeze({
      minimumInclusive: null,
      maximumInclusive: null,
    }),
    entryNotionalRange: Object.freeze({
      minimumInclusive: null,
      maximumInclusive: null,
    }),
    groupings: Object.freeze(
      input.groupings ? [...input.groupings] : ["total" as const],
    ),
    entryTimeBucketMinutes: 30,
    asOfUtc: input.asOfUtc ?? new Date().toISOString(),
    table: Object.freeze({
      pageSize: input.pageSize ?? 200,
      afterCursor: input.afterCursor ?? null,
    }),
  });
}

export function withJournalAnalyticsDashboardService<T>(
  scope: WorkspaceAccessScope,
  operation: (service: JournalAnalyticsService) => T,
): T {
  return withJournalAnalyticsDashboardRuntime(scope, ({ service }) =>
    operation(service));
}

export function withJournalAnalyticsDashboardRuntime<T>(
  _scope: WorkspaceAccessScope,
  operation: (runtime: Readonly<{
    facts: JournalAnalyticsFactSetService;
    dashboard: JournalDashboardReadModelService;
    service: JournalAnalyticsService;
  }>) => T,
): T {
  return withReadonlyPlatformDatabase({}, (database) => {
    const facts = new JournalAnalyticsFactSetService(
      new JournalAnalyticsFactSetRepository(database),
    );
    return operation(Object.freeze({
      facts,
      dashboard: new JournalDashboardReadModelService(facts),
      service: new JournalAnalyticsService(facts),
    }));
  });
}
