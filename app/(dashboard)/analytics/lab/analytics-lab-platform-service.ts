import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  currentJournalAccountSelectionRef,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  JOURNAL_ANALYTICS_QUERY_VERSION,
  type JournalAnalyticsQuery,
} from "@/src/modules/journal-analytics/contracts/analytics-query";
import type { JournalAnalyticsMetricResult } from "@/src/modules/journal-analytics/contracts/analytics-result";
import { journalAnalyticsMetricRegistry } from "@/src/modules/journal-analytics/server/analytics-metric-registry";
import {
  requireActiveJournalAnalyticsAccountId,
  withJournalAnalyticsDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";

import {
  analyticsLabPlatformGroupingOptions,
  normalizeAnalyticsLabPlatformQuery,
} from "./analytics-lab-platform-query";
import type {
  AnalyticsLabPlatformPageModel,
  AnalyticsLabPlatformPreview,
  AnalyticsLabPlatformQuery,
} from "./analytics-lab-platform-types";
import { listAnalyticsLabSavedViews } from "./analytics-lab-saved-view-runtime";

function journalQuery(
  scope: WorkspaceAccessScope,
  input: AnalyticsLabPlatformQuery,
): JournalAnalyticsQuery {
  const secondsToMilliseconds = (value: string | null): number | null =>
    value === null ? null : Number(value) * 1_000;
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([requireActiveJournalAnalyticsAccountId(scope)]),
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
      minimumMillisecondsInclusive: secondsToMilliseconds(input.minimumHoldingSeconds),
      maximumMillisecondsInclusive: secondsToMilliseconds(input.maximumHoldingSeconds),
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

function execute(
  scope: WorkspaceAccessScope,
  input: AnalyticsLabPlatformQuery,
): AnalyticsLabPlatformPreview {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  return withJournalAnalyticsDashboardRuntime(scope, ({ service }) => {
    const query = journalQuery(scope, input);
    const response = service.getAnalyticsOverview(scope, query);
    const selected = response.partitions
      .flatMap((partition) => partition.metrics)
      .find((metric) => metric.metricId === input.metricId) ?? null;
    const evidence = response.partitions.length === 1
      ? service.getRoundTripAnalyticsTable(scope, query)
      : null;
    return Object.freeze({
      selectedMetric: selected as JournalAnalyticsMetricResult | null,
      response,
      evidence,
      evidenceUnavailableReason: evidence === null
        ? "Choose one currency to view individual trades."
        : null,
    });
  });
}

export function runAnalyticsLabPlatformQuery(
  scope: WorkspaceAccessScope,
  input: unknown,
): AnalyticsLabPlatformPreview {
  return execute(scope, normalizeAnalyticsLabPlatformQuery(input));
}

export function readAnalyticsLabPlatformPageModel(
  scope: WorkspaceAccessScope,
): AnalyticsLabPlatformPageModel {
  return withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) => {
    const calendar = dashboard.getCalendar(scope, {
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
    const expectedAccountSelectionRef = currentJournalAccountSelectionRef(scope);
    const initialQuery: AnalyticsLabPlatformQuery = Object.freeze({
      expectedAccountSelectionRef,
      metricId: "net_pnl",
      grouping: "closing_day",
      moneyBasis: "net",
      currency: calendar.currency,
      symbol: null,
      direction: null,
      tradeClassification: null,
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
    return Object.freeze({
      expectedAccountSelectionRef,
      metrics: Object.freeze(journalAnalyticsMetricRegistry.definitions.map(
        (definition) => Object.freeze({
          metricId: definition.metricId,
          title: definition.title,
          description: definition.description,
          capabilityState: definition.capabilityState,
          valueKind: definition.valueKind,
          unit: definition.unit,
          moneyBasis: definition.moneyBasis,
          displayPolicy: definition.displayPolicy,
          unavailableReasonCode: definition.unavailableReasonCode,
        }),
      )),
      groupings: Object.freeze(analyticsLabPlatformGroupingOptions.map(
        ([value, label]) => Object.freeze({ value, label }),
      )),
      currencies: calendar.availableCurrencies,
      symbols: calendar.symbols,
      minimumDate: calendar.minimumDate,
      maximumDate: calendar.maximumDate,
      initialQuery,
      initialPreview: execute(scope, initialQuery),
      savedViews: listAnalyticsLabSavedViews(scope),
    });
  });
}
