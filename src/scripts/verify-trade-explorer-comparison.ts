import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs";

import Database from "better-sqlite3";
import Decimal from "decimal.js";

import { JOURNAL_ANALYTICS_QUERY_VERSION, type JournalAnalyticsQuery } from "@/src/modules/journal-analytics/contracts/analytics-query";
import type { JournalAnalyticsMetricResult } from "@/src/modules/journal-analytics/contracts/analytics-result";
import { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";
import { JournalDashboardReadModelService } from "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import { deriveAllDevelopmentOwnerJournalScopes } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";

const ExactDecimal = Decimal.clone({ precision: 120, toExpNeg: -1000, toExpPos: 1000 });
const METRIC_IDS = Object.freeze([
  "total_trades",
  "net_pnl",
  "win_rate",
  "average_pnl",
  "profit_factor",
  "expectancy",
  "return_on_entry_notional",
  "average_holding_time",
] as const);

function fail(check: string): never {
  throw new Error(`TRADERLINK_TRADE_EXPLORER_COMPARISON_VERIFICATION_FAILED:${check}`);
}

function digest(path: string): string {
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

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function dayDistance(startDate: string, endDate: string): number {
  return Math.floor((Date.parse(`${endDate}T00:00:00.000Z`) -
    Date.parse(`${startDate}T00:00:00.000Z`)) / 86_400_000);
}

function query(input: Readonly<{
  accountId: string;
  accountSelectionRef: string;
  asOfUtc: string;
  currency: string;
  startDate: string;
  endDate: string;
  afterCursor?: string | null;
}>): JournalAnalyticsQuery {
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([input.accountId]),
    metricIds: METRIC_IDS,
    moneyBasis: "net" as const,
    closingDateRange: Object.freeze({
      kind: "inclusive_closing_date" as const,
      startDate: input.startDate,
      endDate: input.endDate,
    }),
    currency: input.currency,
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
    enteredQuantityRange: Object.freeze({ minimumInclusive: null, maximumInclusive: null }),
    maximumPositionRange: Object.freeze({ minimumInclusive: null, maximumInclusive: null }),
    entryNotionalRange: Object.freeze({ minimumInclusive: null, maximumInclusive: null }),
    groupings: Object.freeze(["total" as const]),
    entryTimeBucketMinutes: 30 as const,
    asOfUtc: input.asOfUtc,
    table: Object.freeze({ pageSize: 200, afterCursor: input.afterCursor ?? null }),
  });
}

function metric(
  metrics: readonly JournalAnalyticsMetricResult[],
  metricId: string,
): JournalAnalyticsMetricResult {
  return metrics.find((candidate) => candidate.metricId === metricId) ?? fail(`metric_${metricId}`);
}

function integerMetric(result: JournalAnalyticsMetricResult): number {
  return result.value?.kind === "integer" ? result.value.value : fail(`${result.metricId}_integer`);
}

function decimalMetric(result: JournalAnalyticsMetricResult): string {
  return result.value?.kind === "decimal" ? result.value.valueDecimal : fail(`${result.metricId}_decimal`);
}

function canonicalDecimal(value: Decimal): string {
  const fixed = value.toFixed();
  const normalized = fixed.includes(".")
    ? fixed.replace(/\.0+$/u, "").replace(/(\.\d*?)0+$/u, "$1")
    : fixed;
  return normalized === "-0" ? "0" : normalized;
}

function main(): void {
  const databasePath = resolvePlatformDatabaseConfig({ environment: process.env }).databasePath;
  requireEmptyWal(databasePath);
  const before = Object.freeze({ size: statSync(databasePath).size, sha256: digest(databasePath) });
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  let verifiedAccounts = 0;
  let verifiedGroups = 0;
  let verifiedMetricPairs = 0;
  let verifiedEvidenceRows = 0;
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("query_only = ON");
    const facts = new JournalAnalyticsFactSetService(new JournalAnalyticsFactSetRepository(database));
    const analytics = new JournalAnalyticsService(facts);
    const dashboard = new JournalDashboardReadModelService(facts);
    for (const owner of deriveAllDevelopmentOwnerJournalScopes(database)) {
      if (!owner.accountId) fail("account_missing");
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
      if (!calendar.minimumDate || !calendar.maximumDate || !calendar.currency) continue;
      const distance = dayDistance(calendar.minimumDate, calendar.maximumDate);
      const totalDays = distance + 1;
      if (totalDays < 4) continue;
      const ranges = Object.freeze(Array.from({ length: 4 }, (_value, index) =>
        Object.freeze({
          startDate: addDays(calendar.minimumDate, Math.floor(index * totalDays / 4)),
          endDate: addDays(
            calendar.minimumDate,
            Math.floor((index + 1) * totalDays / 4) - 1,
          ),
        })));
      const asOfUtc = new Date().toISOString();
      const groups = ranges.map((range) => {
        const request = query({
          accountId: owner.accountId!,
          accountSelectionRef: "redacted",
          asOfUtc,
          currency: calendar.currency!,
          ...range,
        });
        const response = analytics.getAnalyticsOverview(owner.scope, request);
        if (response.partitions.length !== 1) fail("partition_count");
        const partition = response.partitions[0];
        if (partition.currency !== calendar.currency || partition.timezone === null) {
          fail("partition_identity");
        }
        const rows = [] as Array<ReturnType<typeof analytics.getRoundTripAnalyticsTable>["rows"][number]>;
        let cursor: string | null = null;
        do {
          const pageQuery = Object.freeze({
            ...request,
            table: Object.freeze({ ...request.table, afterCursor: cursor }),
          });
          const page = analytics.getRoundTripAnalyticsTable(owner.scope, pageQuery);
          if (page.factSetRevisionSha256 !== response.factSetRevisionSha256 ||
              page.currency !== partition.currency || page.timezone !== partition.timezone) {
            fail("summary_evidence_revision");
          }
          rows.push(...page.rows);
          cursor = page.continuationCursor;
        } while (cursor !== null);
        if (new Set(rows.map((row) => row.roundTripId)).size !== rows.length) {
          fail("duplicate_evidence");
        }
        const totalTrades = integerMetric(metric(partition.metrics, "total_trades"));
        if (rows.length !== totalTrades) fail("evidence_count");
        const netRows = rows.filter((row) => row.selectedPnlDecimal !== null);
        const summedNet = canonicalDecimal(netRows.reduce(
          (total, row) => total.plus(row.selectedPnlDecimal!),
          new ExactDecimal(0),
        ));
        const netPnl = metric(partition.metrics, "net_pnl");
        if (netPnl.value === null) {
          if (netRows.length > 0) fail("unavailable_net_with_rows");
        } else if (summedNet !== decimalMetric(netPnl)) {
          fail("net_reconciliation");
        }
        for (const metricId of METRIC_IDS) metric(partition.metrics, metricId);
        verifiedEvidenceRows += rows.length;
        verifiedGroups += 1;
        return Object.freeze({ partition, response });
      });
      for (const compared of groups.slice(1)) {
        if (groups[0].response.factSetRevisionSha256 !== compared.response.factSetRevisionSha256 ||
            groups[0].partition.currency !== compared.partition.currency ||
            groups[0].partition.timezone !== compared.partition.timezone) {
          fail("group_compatibility");
        }
        for (const metricId of METRIC_IDS) {
          const left = metric(groups[0].partition.metrics, metricId);
          const right = metric(compared.partition.metrics, metricId);
          if (left.formulaVersion !== right.formulaVersion || left.valueKind !== right.valueKind ||
              left.unit !== right.unit || left.moneyBasis !== right.moneyBasis ||
              left.currency !== right.currency || left.timezonePolicy !== right.timezonePolicy ||
              left.dateAttributionPolicy !== right.dateAttributionPolicy) {
            fail(`metric_compatibility_${metricId}`);
          }
          verifiedMetricPairs += 1;
        }
      }
      verifiedAccounts += 1;
    }
  } finally {
    database.close();
  }
  const after = Object.freeze({ size: statSync(databasePath).size, sha256: digest(databasePath) });
  requireEmptyWal(databasePath);
  if (before.size !== after.size || before.sha256 !== after.sha256) fail("database_changed");
  if (verifiedAccounts < 1 || verifiedGroups !== verifiedAccounts * 4 ||
      verifiedMetricPairs !== verifiedAccounts * METRIC_IDS.length * 3) {
    fail("verification_population");
  }
  process.stdout.write(`${JSON.stringify({
    valid: true,
    databaseUnchanged: true,
    identifiersRedacted: true,
    verifiedAccounts,
    verifiedGroups,
    verifiedMetricPairs,
    verifiedEvidenceRows,
  })}\n`);
}

main();
