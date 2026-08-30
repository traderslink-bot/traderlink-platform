import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  openReadonlyPlatformDatabase,
  withReadonlyPlatformDatabase,
} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  PLATFORM_REPORTING_CURRENCIES,
  PlatformUserPreferenceRepository,
  type PlatformReportingCurrency,
} from "@/src/modules/platform/server/identity/platform-user-preference-repository";
import { loadUsdEffectiveReportingRates } from "@/src/modules/platform/server/reporting/bank-of-canada-fx-rate-service";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import {
  JournalAnalyticsFactSetService,
  type JournalAnalyticsFactSetReader,
} from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import type {
  JournalAnalyticsClosingDateRange,
  JournalAnalyticsFactSet,
  JournalAnalyticsFactSetRequest,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type {
  JournalCalendarFilterInput,
  JournalCalendarReadModel,
  JournalOpenPositionsReadModel,
  JournalTickerHistoryReadModel,
  JournalTradingDayReadModel,
} from "../contracts/journal-dashboard-read-models";

import {
  JOURNAL_ANALYTICS_QUERY_VERSION,
  type JournalAnalyticsGrouping,
  type JournalAnalyticsMoneyBasis,
  type JournalAnalyticsQuery,
} from "../contracts/analytics-query";
import { JournalAnalyticsService } from "./analytics-service";
import { JournalDashboardReadModelService } from "./journal-dashboard-read-model-service";
import {
  createJournalReportingCurrencyFactSetReader,
  type JournalReportingCurrencyContext,
} from "./journal-reporting-currency-fact-set";
import {
  journalAnalyticsLocalTimeFact,
  normalizeJournalAnalyticsFacts,
  type NormalizedJournalAnalyticsSet,
} from "./normalize-journal-analytics-facts";

type ReportingCurrencyRoundTripSourceRow = Readonly<{
  round_trip_id: string;
  trade_currency: string;
  closed_at_utc: string | null;
  base_currency: string;
  trading_timezone: string;
}>;

type ReportingCurrencyFeeSourceRow = Readonly<{
  fee_currency: string;
}>;

type JournalDashboardRuntimeReader = Readonly<{
  getCalendar(scope: WorkspaceAccessScope, input: JournalCalendarFilterInput): JournalCalendarReadModel;
  getOpenPositions(scope: WorkspaceAccessScope, asOfUtc?: string): JournalOpenPositionsReadModel;
  getTickerHistory(scope: WorkspaceAccessScope): JournalTickerHistoryReadModel;
  getTradingDay(
    scope: WorkspaceAccessScope,
    input: Readonly<{ requestedDate: string | null; currency: string | null; asOfUtc?: string }>,
  ): JournalTradingDayReadModel;
}>;

type JournalAnalyticsReportingRuntimeOptions = Readonly<{
  prefetchAllFactSet?: boolean;
}>;

function factSetReaderKey(
  scope: WorkspaceAccessScope,
  request: JournalAnalyticsFactSetRequest,
): string {
  return JSON.stringify({
    activeAccountId: scope.activeAccountId,
    allowedAccountIds: scope.allowedAccountIds,
    request: {
      accountIds: request.accountIds,
      closingDateRange: request.closingDateRange,
      currencySelection: request.currencySelection,
    },
    userId: scope.userId,
    workspaceId: scope.workspaceId,
    workspaceRole: scope.workspaceRole,
  });
}

class PrefetchedJournalAnalyticsFactSetReader implements JournalAnalyticsFactSetReader {
  private readonly cache = new Map<string, JournalAnalyticsFactSet>();

  constructor(
    private readonly source: JournalAnalyticsFactSetReader,
    scope: WorkspaceAccessScope,
    factSet: JournalAnalyticsFactSet,
  ) {
    this.cache.set(factSetReaderKey(scope, Object.freeze({
      accountIds: factSet.requestedAccountIds,
      closingDateRange: factSet.requestedClosingDateRange,
      currencySelection: factSet.requestedCurrencySelection,
    })), factSet);
  }

  getJournalAnalyticsFactSet(
    scope: WorkspaceAccessScope,
    request: JournalAnalyticsFactSetRequest,
  ): JournalAnalyticsFactSet {
    const key = factSetReaderKey(scope, request);
    const cached = this.cache.get(key);
    if (cached) return cached;
    const factSet = this.source.getJournalAnalyticsFactSet(scope, request);
    this.cache.set(key, factSet);
    return factSet;
  }
}

function createJournalAnalyticsNormalizer(): (
  factSet: JournalAnalyticsFactSet,
) => NormalizedJournalAnalyticsSet {
  const normalizedByFactSet = new WeakMap<
    JournalAnalyticsFactSet,
    NormalizedJournalAnalyticsSet
  >();
  return (factSet) => {
    const cached = normalizedByFactSet.get(factSet);
    if (cached) return cached;
    const normalized = normalizeJournalAnalyticsFacts(factSet);
    normalizedByFactSet.set(factSet, normalized);
    return normalized;
  };
}

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
    const normalizeFacts = createJournalAnalyticsNormalizer();
    return operation(Object.freeze({
      facts,
      dashboard: new JournalDashboardReadModelService(facts, normalizeFacts),
      service: new JournalAnalyticsService(facts, null, normalizeFacts),
    }));
  });
}

function reportingDashboardReader(
  dashboard: JournalDashboardReadModelService,
  reportingCurrency: PlatformReportingCurrency,
): JournalDashboardRuntimeReader {
  return Object.freeze({
    getCalendar: (scope, input) => dashboard.getCalendar(scope, Object.freeze({
      ...input,
      currency: reportingCurrency,
    })),
    getOpenPositions: (scope, asOfUtc) => dashboard.getOpenPositions(scope, asOfUtc),
    getTickerHistory: (scope) => dashboard.getTickerHistory(scope),
    getTradingDay: (scope, input) => dashboard.getTradingDay(scope, Object.freeze({
      ...input,
      currency: reportingCurrency,
    })),
  });
}

export async function withJournalAnalyticsReportingDashboardRuntime<T>(
  scope: WorkspaceAccessScope,
  operation: (runtime: Readonly<{
    database: ReturnType<typeof openReadonlyPlatformDatabase>;
    dashboard: JournalDashboardRuntimeReader;
    reportingCurrency: PlatformReportingCurrency;
    reportingContext: JournalReportingCurrencyContext;
    service: JournalAnalyticsService;
  }>) => T | Promise<T>,
  options: JournalAnalyticsReportingRuntimeOptions = {},
): Promise<T> {
  const requestedAtUtc = new Date().toISOString();
  const database = openReadonlyPlatformDatabase();
  try {
    const accountId = requireActiveJournalAnalyticsAccountId(scope);
    const source = new JournalAnalyticsFactSetService(
      new JournalAnalyticsFactSetRepository(database),
    );
    const prefetchedFactSet = options.prefetchAllFactSet === true
      ? source.getJournalAnalyticsFactSet(scope, Object.freeze({
        accountIds: Object.freeze([accountId]),
        closingDateRange: Object.freeze({ kind: "all_available" as const }),
        currencySelection: Object.freeze({ kind: "all_partitions" as const }),
      }))
      : null;
    const snapshot = prefetchedFactSet
      ? reportingSnapshotFromFactSet(
        database,
        scope,
        requestedAtUtc,
        prefetchedFactSet,
      )
      : reportingSnapshotFromStorage(database, scope, requestedAtUtc, accountId);
    const supportedCurrencies = new Set<string>(PLATFORM_REPORTING_CURRENCIES);
    const rateCurrencies = [...new Set([
      snapshot.reportingCurrency,
      ...snapshot.sourceCurrencies,
    ])].filter((currency): currency is PlatformReportingCurrency =>
      currency !== "USD" && supportedCurrencies.has(currency));
    const ratesByCurrency = new Map<string, ReadonlyMap<string, string>>();
    if (rateCurrencies.length > 0 && snapshot.sourceDates.length > 0) {
      const rateDatabase = openPlatformDatabase({ mode: "runtime" });
      try {
        for (const currency of rateCurrencies) {
          ratesByCurrency.set(currency, await loadUsdEffectiveReportingRates(
            rateDatabase,
            { sourceDates: snapshot.sourceDates, targetCurrency: currency },
          ));
        }
      } finally {
        rateDatabase.close();
      }
    }
    const reportingContext: JournalReportingCurrencyContext = Object.freeze({
      ratesByCurrency,
      reportingCurrency: snapshot.reportingCurrency,
      requestedAtUtc,
      sourceCurrencyByRoundTrip: snapshot.sourceCurrencyByRoundTrip,
      sourceDateByRoundTrip: snapshot.sourceDateByRoundTrip,
    });
    const facts = createJournalReportingCurrencyFactSetReader(
      prefetchedFactSet
        ? new PrefetchedJournalAnalyticsFactSetReader(source, scope, prefetchedFactSet)
        : source,
      reportingContext,
    );
    const normalizeFacts = createJournalAnalyticsNormalizer();
    const dashboard = new JournalDashboardReadModelService(facts, normalizeFacts);
    return await operation(Object.freeze({
      database,
      dashboard: reportingDashboardReader(dashboard, snapshot.reportingCurrency),
      reportingCurrency: snapshot.reportingCurrency,
      reportingContext,
      service: new JournalAnalyticsService(
        facts,
        snapshot.reportingCurrency,
        normalizeFacts,
      ),
    }));
  } finally {
    database.close();
  }
}

type ReportingSnapshot = Readonly<{
  reportingCurrency: PlatformReportingCurrency;
  sourceCurrencies: ReadonlySet<string>;
  sourceCurrencyByRoundTrip: ReadonlyMap<string, string>;
  sourceDateByRoundTrip: ReadonlyMap<string, string>;
  sourceDates: readonly string[];
}>;

function reportingSnapshotFromStorage(
  database: ReturnType<typeof openReadonlyPlatformDatabase>,
  scope: WorkspaceAccessScope,
  requestedAtUtc: string,
  accountId: string,
): ReportingSnapshot {
  const rows = database.prepare<[string, string], ReportingCurrencyRoundTripSourceRow>(`SELECT
 round_trip.round_trip_id, version.trade_currency, version.closed_at_utc,
 account.base_currency, account.trading_timezone
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_accounts account
 ON account.workspace_id = round_trip.workspace_id
 AND account.account_id = round_trip.account_id
 AND account.status = 'active'
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
ORDER BY round_trip.round_trip_id`).all(
      scope.workspaceId,
      accountId,
    );
    const feeCurrencyRows = database.prepare<[string, string], ReportingCurrencyFeeSourceRow>(`SELECT DISTINCT
 execution_version.fee_currency
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = version.workspace_id
 AND allocation.account_id = version.account_id
 AND allocation.round_trip_version_id = version.round_trip_version_id
JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
 AND execution_version.account_id = allocation.account_id
 AND execution_version.execution_version_id = allocation.execution_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND execution_version.fee_currency IS NOT NULL`).all(
      scope.workspaceId,
      accountId,
    );
    const sourceCurrencyByRoundTrip = new Map<string, string>();
    const sourceDateByRoundTrip = new Map<string, string>();
    const sourceCurrencies = new Set<string>();
    const sourceDates = new Set<string>([requestedAtUtc.slice(0, 10)]);
    for (const row of rows) {
      sourceCurrencyByRoundTrip.set(row.round_trip_id, row.trade_currency);
      sourceCurrencies.add(row.base_currency);
      sourceCurrencies.add(row.trade_currency);
      const sourceDate = journalAnalyticsLocalTimeFact(
        row.closed_at_utc ?? requestedAtUtc,
        row.trading_timezone,
      ).localDate;
      sourceDateByRoundTrip.set(row.round_trip_id, sourceDate);
      sourceDates.add(sourceDate);
    }
    for (const row of feeCurrencyRows) sourceCurrencies.add(row.fee_currency);
  return Object.freeze({
    reportingCurrency: new PlatformUserPreferenceRepository(database)
      .getActiveUserReportingCurrency(scope.userId),
    sourceCurrencies,
    sourceCurrencyByRoundTrip,
    sourceDateByRoundTrip,
    sourceDates: Object.freeze([...sourceDates].sort()),
  });
}

function reportingSnapshotFromFactSet(
  database: ReturnType<typeof openReadonlyPlatformDatabase>,
  scope: WorkspaceAccessScope,
  requestedAtUtc: string,
  factSet: JournalAnalyticsFactSet,
): ReportingSnapshot {
  const accountById = new Map(factSet.accounts.map((account) => [
    account.accountId,
    account,
  ]));
  const sourceCurrencies = new Set<string>();
  const sourceCurrencyByRoundTrip = new Map<string, string>();
  const sourceDateByRoundTrip = new Map<string, string>();
  const sourceDates = new Set<string>([requestedAtUtc.slice(0, 10)]);
  for (const roundTrip of factSet.roundTrips) {
    const account = accountById.get(roundTrip.accountId);
    if (!account) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "reporting_fact_set_account",
    });
    sourceCurrencies.add(account.baseCurrency);
    sourceCurrencies.add(roundTrip.tradeCurrency);
    sourceCurrencyByRoundTrip.set(roundTrip.roundTripId, roundTrip.tradeCurrency);
    const sourceDate = journalAnalyticsLocalTimeFact(
      roundTrip.closedAtUtc ?? requestedAtUtc,
      account.tradingTimezone,
    ).localDate;
    sourceDateByRoundTrip.set(roundTrip.roundTripId, sourceDate);
    sourceDates.add(sourceDate);
    for (const allocation of roundTrip.allocations) {
      if (allocation.feeCurrency) sourceCurrencies.add(allocation.feeCurrency);
    }
  }
  return Object.freeze({
    reportingCurrency: new PlatformUserPreferenceRepository(database)
      .getActiveUserReportingCurrency(scope.userId),
    sourceCurrencies,
    sourceCurrencyByRoundTrip,
    sourceDateByRoundTrip,
    sourceDates: Object.freeze([...sourceDates].sort()),
  });
}

export async function withJournalAnalyticsReportingDashboardService<T>(
  scope: WorkspaceAccessScope,
  operation: (service: JournalAnalyticsService) => T | Promise<T>,
): Promise<T> {
  return withJournalAnalyticsReportingDashboardRuntime(scope, ({ service }) =>
    operation(service));
}
