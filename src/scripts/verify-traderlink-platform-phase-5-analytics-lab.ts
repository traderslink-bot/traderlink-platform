import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs";

import Database from "better-sqlite3";

import { normalizeAnalyticsLabPlatformQuery } from "../../app/(dashboard)/analytics/lab/analytics-lab-platform-query";
import { JOURNAL_ANALYTICS_QUERY_VERSION, type JournalAnalyticsQuery } from "../modules/journal-analytics/contracts/analytics-query";
import { journalAnalyticsMetricRegistry } from "../modules/journal-analytics/server/analytics-metric-registry";
import { JournalAnalyticsService } from "../modules/journal-analytics/server/analytics-service";
import { JournalDashboardReadModelService } from "../modules/journal-analytics/server/journal-dashboard-read-model-service";
import { deriveAllDevelopmentOwnerJournalScopes } from "../modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAnalyticsFactSetRepository } from "../modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "../modules/journal/server/analytics/journal-analytics-fact-set-service";
import { currentJournalAccountSelectionRef } from "../modules/platform/server/authentication/journal-account-selection-authorization";
import { resolvePlatformDatabaseConfig } from "../modules/platform/server/database/platform-database-config";

function fail(check: string): never {
  throw new Error(`TRADERLINK_PHASE_5_ANALYTICS_LAB_VERIFICATION_FAILED:${check}`);
}

function hash(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function requireEmptyWal(path: string): void {
  const walPath = `${path}-wal`;
  if (!existsSync(walPath)) return;
  const evidence = lstatSync(walPath);
  if (!evidence.isFile() || evidence.isSymbolicLink() || evidence.size !== 0) {
    fail("database_pending_wal");
  }
}

function analyticsQuery(
  accountId: string,
  input: ReturnType<typeof normalizeAnalyticsLabPlatformQuery>,
): JournalAnalyticsQuery {
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([accountId]),
    metricIds: Object.freeze([...new Set([
      input.metricId,
      "total_trades",
      "net_pnl",
      "gross_pnl",
      "win_rate",
      "average_pnl",
    ])].sort()),
    moneyBasis: input.moneyBasis,
    closingDateRange: Object.freeze({
      kind: "inclusive_closing_date" as const,
      startDate: input.startDate,
      endDate: input.endDate,
    }),
    currency: input.currency,
    instrumentIds: Object.freeze([]),
    symbols: Object.freeze(input.symbol === null ? [] : [input.symbol]),
    directions: Object.freeze(input.direction === null ? [] : [input.direction]),
    tradeClassifications: Object.freeze(
      input.tradeClassification === null ? [] : [input.tradeClassification],
    ),
    provenance: Object.freeze(input.provenance === null ? [] : [input.provenance]),
    outcomes: Object.freeze(input.outcome === null ? [] : [input.outcome]),
    entryWeekdays: Object.freeze(input.entryWeekday === null ? [] : [input.entryWeekday]),
    entryTimeBuckets: Object.freeze(input.entryTimeBucket === null ? [] : [input.entryTimeBucket]),
    holdingDurationRange: Object.freeze({
      minimumMillisecondsInclusive: input.minimumHoldingSeconds === null
        ? null
        : Number(input.minimumHoldingSeconds) * 1_000,
      maximumMillisecondsInclusive: input.maximumHoldingSeconds === null
        ? null
        : Number(input.maximumHoldingSeconds) * 1_000,
    }),
    enteredQuantityRange: Object.freeze({
      minimumInclusive: input.minimumEnteredQuantity,
      maximumInclusive: input.maximumEnteredQuantity,
    }),
    maximumPositionRange: Object.freeze({
      minimumInclusive: input.minimumPositionQuantity,
      maximumInclusive: input.maximumPositionQuantity,
    }),
    entryNotionalRange: Object.freeze({
      minimumInclusive: input.minimumEntryNotional,
      maximumInclusive: input.maximumEntryNotional,
    }),
    groupings: Object.freeze([input.grouping]),
    entryTimeBucketMinutes: input.entryTimeBucketMinutes,
    asOfUtc: new Date().toISOString(),
    table: Object.freeze({ pageSize: input.evidenceRows, afterCursor: null }),
  });
}

function main(): void {
  const databasePath = resolvePlatformDatabaseConfig({ environment: process.env }).databasePath;
  requireEmptyWal(databasePath);
  const before = Object.freeze({ size: statSync(databasePath).size, sha256: hash(databasePath) });
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  let metricCount = 0;
  let availableCount = 0;
  let unavailableCount = 0;
  let readyClosedCount = 0;
  let needsDecisionCount = 0;
  let evidenceRowCount = 0;
  const resultDigests: string[] = [];
  let activeAccounts = 0;
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("query_only = ON");
    const owners = deriveAllDevelopmentOwnerJournalScopes(database);
    activeAccounts = owners.length;
    const facts = new JournalAnalyticsFactSetService(
      new JournalAnalyticsFactSetRepository(database),
    );
    const analytics = new JournalAnalyticsService(facts);
    const dashboard = new JournalDashboardReadModelService(facts);
    metricCount = journalAnalyticsMetricRegistry.definitions.length;
    availableCount = journalAnalyticsMetricRegistry.definitions.filter((metric) =>
      metric.capabilityState !== "unavailable").length;
    unavailableCount = journalAnalyticsMetricRegistry.definitions.filter((metric) =>
      metric.capabilityState === "unavailable").length;
    if (metricCount !== 210 || availableCount !== 181 || unavailableCount !== 29) {
      fail("registry_counts");
    }
    for (const owner of owners) {
      const calendar = dashboard.getCalendar(owner.scope, {
        currency: null,
        startDate: null,
        endDate: null,
        symbol: null,
        direction: null,
        performance: null,
        pnlBand: null,
        tradeCountBand: null,
        session: null,
      });
      const input = normalizeAnalyticsLabPlatformQuery({
        expectedAccountSelectionRef: currentJournalAccountSelectionRef(owner.scope),
        metricId: "net_pnl",
        grouping: "closing_day",
        moneyBasis: "net",
        currency: calendar.currency,
        symbol: null,
        direction: null,
        provenance: null,
        outcome: null,
        entryWeekday: null,
        entryTimeBucketMinutes: 30,
        entryTimeBucket: null,
        startDate: calendar.minimumDate,
        endDate: calendar.maximumDate,
        minimumHoldingSeconds: null,
        maximumHoldingSeconds: null,
        minimumEnteredQuantity: null,
        maximumEnteredQuantity: null,
        minimumPositionQuantity: null,
        maximumPositionQuantity: null,
        minimumEntryNotional: null,
        maximumEntryNotional: null,
        evidenceRows: 24,
      });
      const query = analyticsQuery(owner.accountId, input);
      const response = analytics.getAnalyticsOverview(owner.scope, query);
      const evidence = analytics.getRoundTripAnalyticsTable(owner.scope, query);
      const unavailableQuery = analyticsQuery(owner.accountId, Object.freeze({
        ...input,
        metricId: "unrealized_pnl",
      }));
      const unavailable = analytics.getAnalyticsOverview(owner.scope, unavailableQuery);
      const unavailableMetric = unavailable.partitions
        .flatMap((partition) => partition.metrics)
        .find((metric) => metric.metricId === "unrealized_pnl");
      if (unavailableMetric?.state !== "unavailable" ||
          unavailableMetric.value !== null) {
        fail("unavailable_metric_not_zero");
      }
      readyClosedCount += response.crossPartitionCounts.readyClosedCount;
      needsDecisionCount += response.crossPartitionCounts.needsDecisionCount;
      evidenceRowCount += evidence.rows.length;
      resultDigests.push(createHash("sha256")
        .update(JSON.stringify({ response, unavailable }), "utf8")
        .digest("hex"));
    }
  } finally {
    database.close();
  }
  requireEmptyWal(databasePath);
  const after = Object.freeze({ size: statSync(databasePath).size, sha256: hash(databasePath) });
  if (before.size !== after.size || before.sha256 !== after.sha256) {
    fail("database_changed");
  }
  process.stdout.write(`${JSON.stringify({
    status: "ok",
    identifiersRedacted: true,
    counts: {
      activeAccounts,
      metricCount,
      availableCount,
      unavailableCount,
      readyClosedCount,
      needsDecisionCount,
      evidenceRowCount,
    },
    database: { sizeBytes: after.size, sha256: after.sha256, state: "unchanged" },
    resultDigestSha256: createHash("sha256")
      .update(JSON.stringify(resultDigests), "utf8")
      .digest("hex"),
  })}\n`);
}

main();
