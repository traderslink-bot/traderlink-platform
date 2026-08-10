import Decimal from "decimal.js";

import {
  JOURNAL_ANALYTICS_QUERY_VERSION,
  type JournalAnalyticsQuery,
} from "@/src/modules/journal-analytics/contracts/analytics-query";
import { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import {
  buildDailyTradeLongTermAnalytics,
  readDailyTradeAnalysisCurrencies,
} from "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

function fail(check: string): never {
  throw new Error(`Daily Trade long-term analytics verification failed: ${check}`);
}

function query(
  accountId: string,
  asOfUtc: string,
  currency: string | null,
  afterCursor: string | null = null,
  moneyBasis: "gross" | "net" = "gross",
): JournalAnalyticsQuery {
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([accountId]),
    metricIds: Object.freeze(["included_count"]),
    moneyBasis,
    closingDateRange: Object.freeze({ kind: "all_available" as const }),
    currency,
    instrumentIds: Object.freeze([]),
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
    groupings: Object.freeze(["total" as const]),
    entryTimeBucketMinutes: 30 as const,
    asOfUtc,
    table: Object.freeze({ afterCursor, pageSize: 200 }),
  });
}

loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
const database = openReadonlyPlatformDatabase();
try {
  const owner = deriveDevelopmentOwnerJournalScope(database);
  const analyzerAccount = database.prepare<[string], { account_id: string }>(`SELECT account_id
FROM journal_round_trip_daily_trade_analyses
WHERE workspace_id = ? AND status = 'ready'
GROUP BY account_id
ORDER BY COUNT(*) DESC, account_id
LIMIT 1`).get(owner.scope.workspaceId);
  if (!analyzerAccount || !owner.scope.allowedAccountIds.includes(analyzerAccount.account_id)) {
    fail("allowed_analyzer_account_missing");
  }
  const accountId = analyzerAccount.account_id;
  const scope = Object.freeze({ ...owner.scope, activeAccountId: accountId });
  const factSetService = new JournalAnalyticsFactSetService(
    new JournalAnalyticsFactSetRepository(database),
  );
  const analytics = new JournalAnalyticsService(factSetService);
  const asOfUtc = new Date().toISOString();
  const overview = analytics.getAnalyticsOverview(
    scope,
    query(accountId, asOfUtc, null),
  );
  const currencies = overview.partitions.flatMap((partition) =>
    partition.currency ? [partition.currency] : []);
  const analyzedCurrencies = readDailyTradeAnalysisCurrencies(database, scope);
  const currency = analyzedCurrencies.find((value) => currencies.includes(value)) ?? null;
  if (currency === null) fail("currency_partition_missing");

  const journalRows = [];
  let cursor: string | null = null;
  do {
    const response = analytics.getRoundTripAnalyticsTable(
      scope,
      query(accountId, asOfUtc, currency, cursor),
    );
    journalRows.push(...response.rows);
    cursor = response.continuationCursor;
  } while (cursor !== null);

  const model = buildDailyTradeLongTermAnalytics(
    database,
    scope,
    Object.freeze(journalRows),
    "gross",
    currency,
  );
  if (model.analyzedTradeCount === 0 || model.analyzedExecutionCount === 0) {
    const analyzedRoundTrips = database.prepare<[string, string], { round_trip_id: string }>(`SELECT round_trip_id
FROM journal_round_trip_daily_trade_analyses
WHERE workspace_id = ? AND account_id = ? AND status = 'ready'`).all(
      scope.workspaceId,
      accountId,
    );
    const journalByRoundTrip = new Map(journalRows.map((row) => [row.roundTripId, row]));
    const matchingJournalRows = analyzedRoundTrips.flatMap(({ round_trip_id: roundTripId }) => {
      const row = journalByRoundTrip.get(roundTripId);
      return row ? [row] : [];
    });
    const rawFactSet = factSetService.getJournalAnalyticsFactSet(scope, {
      accountIds: Object.freeze([accountId]),
      closingDateRange: Object.freeze({ kind: "all_available" as const }),
      currencySelection: Object.freeze({ kind: "all_partitions" as const }),
    });
    const analyzedIds = new Set(analyzedRoundTrips.map((row) => row.round_trip_id));
    const matchingFactSetRows = rawFactSet.roundTrips.filter((row) => analyzedIds.has(row.roundTripId));
    const analyzerCounts = database.prepare<[string, string], {
      active_ready_round_trips: number;
      current_ready: number;
      excluded_review_examples: number;
      journal_round_trips: number;
      exact_path: number;
      snapshots: number;
    }>(`SELECT
  COUNT(DISTINCT analysis.daily_trade_analysis_id) AS current_ready,
  COUNT(DISTINCT round_trip.round_trip_id) AS journal_round_trips,
  COUNT(DISTINCT CASE WHEN round_trip.lifecycle_state = 'active'
    AND current_version.projection_state = 'ready_closed'
    THEN round_trip.round_trip_id END) AS active_ready_round_trips,
  COUNT(DISTINCT CASE WHEN source_batch.source_display_label LIKE 'Data Decisions review example:%'
    THEN round_trip.round_trip_id END) AS excluded_review_examples,
  COUNT(DISTINCT summary.daily_trade_analysis_version_id) AS exact_path,
  COUNT(snapshot.execution_id) AS snapshots
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
LEFT JOIN journal_round_trip_daily_trade_analysis_path_summaries summary
  ON summary.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
  AND summary.round_trip_version_id = analysis.round_trip_version_id
LEFT JOIN journal_round_trip_daily_trade_analysis_event_snapshots snapshot
  ON snapshot.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
LEFT JOIN journal_round_trips round_trip
  ON round_trip.round_trip_id = analysis.round_trip_id
  AND round_trip.account_id = analysis.account_id
LEFT JOIN journal_round_trip_versions current_version
  ON current_version.round_trip_version_id = round_trip.current_version_id
LEFT JOIN journal_round_trip_execution_allocations source_allocation
  ON source_allocation.round_trip_version_id = round_trip.current_version_id
LEFT JOIN journal_execution_provenance source_provenance
  ON source_provenance.execution_version_id = source_allocation.execution_version_id
  AND source_provenance.workspace_id = source_allocation.workspace_id
  AND source_provenance.account_id = source_allocation.account_id
LEFT JOIN journal_import_batches source_batch
  ON source_batch.import_batch_id = source_provenance.import_batch_id
  AND source_batch.workspace_id = source_provenance.workspace_id
  AND source_batch.account_id = source_provenance.account_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
  AND analysis.status = 'ready' AND version.status = 'ready'`).get(
      scope.workspaceId,
      accountId,
    );
    const factSetExclusionCount = database.prepare<[string, string], number>(`SELECT COUNT(DISTINCT analysis.round_trip_id)
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trips round_trip
  ON round_trip.round_trip_id = analysis.round_trip_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
  AND round_trip.current_version_id IN (
    SELECT seeded_allocation.round_trip_version_id
    FROM journal_round_trip_execution_allocations seeded_allocation
    JOIN journal_execution_provenance seeded_provenance
      ON seeded_provenance.workspace_id = seeded_allocation.workspace_id
     AND seeded_provenance.account_id = seeded_allocation.account_id
     AND seeded_provenance.execution_version_id = seeded_allocation.execution_version_id
    JOIN journal_import_batches seeded_batch
      ON seeded_batch.workspace_id = seeded_provenance.workspace_id
     AND seeded_batch.account_id = seeded_provenance.account_id
     AND seeded_batch.import_batch_id = seeded_provenance.import_batch_id
    WHERE seeded_batch.source_display_label LIKE 'Data Decisions review example:%'
  )`).pluck().get(scope.workspaceId, accountId) ?? 0;
    console.error(JSON.stringify({
      currentReadyAnalyses: analyzerCounts?.current_ready ?? 0,
      activeReadyRoundTrips: analyzerCounts?.active_ready_round_trips ?? 0,
      eligibleJournalRows: journalRows.filter((row) => row.tradeClassification === "day_trade").length,
      excludedReviewExamples: analyzerCounts?.excluded_review_examples ?? 0,
      factSetExclusionCount,
      factSetRoundTrips: rawFactSet.roundTrips.length,
      matchingFactSetRows: matchingFactSetRows.length,
      matchingFactSetReadyRows: matchingFactSetRows.filter((row) => row.projectionState === "ready_closed").length,
      matchingSelectedCurrencyRows: matchingFactSetRows.filter((row) => row.tradeCurrency === currency).length,
      exactPathSummaries: analyzerCounts?.exact_path ?? 0,
      journalRows: journalRows.length,
      journalRoundTripMatches: analyzerCounts?.journal_round_trips ?? 0,
      matchingDayJournalRows: matchingJournalRows.filter((row) => row.tradeClassification === "day_trade").length,
      matchingJournalRows: matchingJournalRows.length,
      selectedPnlRows: journalRows.filter((row) => row.selectedPnlDecimal !== null).length,
      snapshots: analyzerCounts?.snapshots ?? 0,
    }));
    fail("current_analyzed_evidence_missing");
  }
  if (model.currency !== currency) fail("currency_partition_changed");
  if (new Set(model.trades.map((trade) => trade.roundTripId)).size !== model.trades.length) {
    fail("duplicate_round_trip");
  }
  if (model.trades.reduce((sum, trade) => sum + trade.executionCount, 0) !== model.analyzedExecutionCount) {
    fail("execution_total_reconciliation");
  }
  const expectedCoverage = model.eligibleDayTradeCount === 0
    ? null
    : model.analyzedTradeCount / model.eligibleDayTradeCount * 100;
  if (model.coveragePercent !== expectedCoverage) fail("coverage_reconciliation");
  if (model.trades.some((trade) =>
    trade.additionalOpportunityDecimal !== null &&
    new Decimal(trade.additionalOpportunityDecimal).isNegative())) {
    fail("negative_additional_opportunity");
  }
  const expectedActualTotal = model.trades.reduce(
    (sum, trade) => sum.plus(trade.actualPnlDecimal),
    new Decimal(0),
  );
  if (model.profitCapture.totalActualPnlDecimal === null ||
      !new Decimal(model.profitCapture.totalActualPnlDecimal).eq(expectedActualTotal)) {
    fail("actual_profit_loss_total");
  }
  const expectedAdditionalTotal = model.trades.reduce(
    (sum, trade) => sum.plus(trade.additionalOpportunityDecimal ?? 0),
    new Decimal(0),
  );
  if (model.profitCapture.totalAdditionalOpportunityDecimal === null ||
      !new Decimal(model.profitCapture.totalAdditionalOpportunityDecimal).eq(expectedAdditionalTotal)) {
    fail("additional_opportunity_total");
  }
  if (model.profitCapture.totalPotentialPnlDecimal === null ||
      !new Decimal(model.profitCapture.totalPotentialPnlDecimal)
        .eq(expectedActualTotal.plus(expectedAdditionalTotal))) {
    fail("potential_profit_loss_total");
  }
  const expectedWinRate = model.trades.filter((trade) =>
    new Decimal(trade.actualPnlDecimal).gt(0)).length / model.trades.length * 100;
  if (model.winRatePercent !== expectedWinRate) fail("win_rate_reconciliation");
  if (model.holdingDuration.reduce((sum, row) => sum + row.tradeCount, 0) !== model.analyzedTradeCount) {
    fail("holding_duration_population");
  }
  if (model.riskManagement.partialExitBeforeRed.reduce((sum, row) => sum + row.tradeCount, 0) !==
      model.greenToRedTradeCount) {
    fail("partial_exit_population");
  }
  const endedRedTrades = model.trades.filter((trade) => trade.greenToRedStatus === "green_to_red_ended_red");
  const endedRedActual = endedRedTrades.reduce(
    (sum, trade) => sum.plus(trade.actualPnlDecimal),
    new Decimal(0),
  );
  const endedRedMissed = endedRedTrades.reduce(
    (sum, trade) => sum.plus(trade.additionalOpportunityDecimal ?? 0),
    new Decimal(0),
  );
  if (model.greenToRedDamage.endedRedTradeCount !== endedRedTrades.length ||
      model.greenToRedDamage.endedRedActualPnlDecimal === null ||
      !new Decimal(model.greenToRedDamage.endedRedActualPnlDecimal).eq(endedRedActual) ||
      model.greenToRedDamage.endedRedPotentialPnlDecimal === null ||
      !new Decimal(model.greenToRedDamage.endedRedPotentialPnlDecimal).eq(endedRedActual.plus(endedRedMissed))) {
    fail("ended_red_profit_loss_reconciliation");
  }

  const journalById = new Map(journalRows.map((row) => [row.roundTripId, row]));
  const snapshotCount = database.prepare<[string, string, string], number>(`SELECT COUNT(*) AS count
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
JOIN journal_round_trip_daily_trade_analysis_path_summaries summary
  ON summary.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
  AND summary.round_trip_version_id = analysis.round_trip_version_id
JOIN journal_round_trip_daily_trade_analysis_event_snapshots snapshot
  ON snapshot.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
  AND analysis.round_trip_id = ?
  AND analysis.status = 'ready' AND version.status = 'ready'`).pluck();
  for (const trade of model.trades) {
    const journal = journalById.get(trade.roundTripId);
    if (!journal || journal.selectedPnlDecimal !== trade.actualPnlDecimal) {
      fail("journal_profit_loss_reconciliation");
    }
    const expectedReturn = journal.returnPercentDecimal === null || journal.returnPercentDecimal === undefined
      ? null
      : new Decimal(journal.returnPercentDecimal).toNumber();
    if (trade.returnPercent !== expectedReturn) fail("journal_return_reconciliation");
    const expectedExecutions = snapshotCount.get(
      owner.scope.workspaceId,
      accountId,
      trade.roundTripId,
    );
    if (expectedExecutions !== trade.executionCount) fail("current_snapshot_reconciliation");
  }

  const firstTrade = model.trades[0];
  const firstJournal = firstTrade ? journalById.get(firstTrade.roundTripId) : null;
  if (!firstJournal) fail("subset_fixture_missing");
  const subset = buildDailyTradeLongTermAnalytics(
    database,
    scope,
    Object.freeze([firstJournal]),
    "gross",
    currency,
  );
  if (subset.analyzedTradeCount !== 1 || subset.trades[0]?.roundTripId !== firstTrade.roundTripId) {
    fail("date_range_subset_boundary");
  }

  const isolated = buildDailyTradeLongTermAnalytics(
    database,
    Object.freeze({
      ...owner.scope,
      activeAccountId: "00000000-0000-4000-8000-000000000001",
      allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000001"]),
    }),
    Object.freeze(journalRows),
    "gross",
    currency,
  );
  if (isolated.analyzedTradeCount !== 0 || isolated.analyzedExecutionCount !== 0) {
    fail("account_isolation");
  }

  console.log(JSON.stringify({
    analyzedExecutions: model.analyzedExecutionCount,
    analyzedTrades: model.analyzedTradeCount,
    currencyPartitions: currencies.length,
    eligibleDayTrades: model.eligibleDayTradeCount,
    malformedSnapshots: model.malformedSnapshotCount,
    status: "verified",
  }));
} finally {
  database.close();
}
