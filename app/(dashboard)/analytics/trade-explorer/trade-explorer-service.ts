import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  currentJournalAccountSelectionRef,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  JOURNAL_ANALYTICS_QUERY_VERSION,
  type JournalAnalyticsQuery,
  type JournalAnalyticsTableOrder,
} from "@/src/modules/journal-analytics/contracts/analytics-query";
import type { JournalAnalyticsMetricResult } from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  TRADE_EXPLORER_DAY_STATISTIC_GROUPS,
  TRADE_EXPLORER_TRADE_STATISTIC_GROUPS,
  tradeExplorerMetricForMoneyBasis,
  tradeExplorerMetricForOutcome,
  tradeExplorerTableOrder,
  tradeExplorerTradeSortForOutcome,
} from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
import { journalAnalyticsMetricRegistry } from "@/src/modules/journal-analytics/server/analytics-metric-registry";
import type { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";
import {
  requireActiveJournalAnalyticsAccountId,
  withJournalAnalyticsDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";

import {
  analyticsLabPlatformGroupingOptions,
  normalizeAnalyticsLabPlatformQuery,
} from "../lab/analytics-lab-platform-query";
import type {
  AnalyticsLabPlatformPageModel,
  AnalyticsLabPlatformPreview,
  AnalyticsLabPlatformQuery,
} from "../lab/analytics-lab-platform-types";

const EXPLORER_METRICS = Object.freeze([
  "total_trades",
  "win_count",
  "loss_count",
  "net_pnl",
  "gross_pnl",
  "win_rate",
  "average_pnl",
  "profit_factor",
  "best_trade",
  "worst_trade",
  "average_holding_time",
  "average_share_quantity",
  "average_entry_notional",
  "green_to_red_day_count",
  "red_to_green_day_count",
] as const);

const EXPLORER_SELECTOR_METRIC_IDS: ReadonlySet<string> = new Set<string>([
  ...TRADE_EXPLORER_DAY_STATISTIC_GROUPS.flatMap((group) => group.metricIds),
  ...TRADE_EXPLORER_TRADE_STATISTIC_GROUPS.flatMap((group) => group.metricIds),
]);

function journalQuery(
  scope: WorkspaceAccessScope,
  input: AnalyticsLabPlatformQuery,
  afterCursor: string | null,
): JournalAnalyticsQuery {
  const secondsToMilliseconds = (value: string | null): number | null =>
    value === null ? null : Number(value) * 1_000;
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([requireActiveJournalAnalyticsAccountId(scope)]),
    metricIds: Object.freeze([...new Set([...EXPLORER_METRICS, input.metricId])].sort()),
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
    provenance: Object.freeze([]),
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
    table: Object.freeze({ pageSize: input.evidenceRows, afterCursor }),
  });
}

function normalizeEvidenceCursor(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "string" && input.length > 0 && input.length <= 4_096) return input;
  throw new TypeError("Invalid Trade Explorer evidence cursor.");
}

function execute(
  scope: WorkspaceAccessScope,
  input: AnalyticsLabPlatformQuery,
  afterCursor: string | null = null,
  tableOrder: JournalAnalyticsTableOrder = tradeExplorerTableOrder("closed_desc"),
): AnalyticsLabPlatformPreview {
  return withJournalAnalyticsDashboardRuntime(scope, ({ service }) =>
    buildPreview(scope, input, afterCursor, service, tableOrder));
}

function buildPreview(
  scope: WorkspaceAccessScope,
  input: AnalyticsLabPlatformQuery,
  afterCursor: string | null,
  service: JournalAnalyticsService,
  tableOrder: JournalAnalyticsTableOrder,
): AnalyticsLabPlatformPreview {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  const query = journalQuery(scope, input, afterCursor);
  const response = service.getAnalyticsOverview(scope, query);
  const selected = response.partitions
    .flatMap((partition) => partition.metrics)
    .find((metric) => metric.metricId === input.metricId) ?? null;
  const evidence = response.partitions.length === 1
    ? service.getRoundTripAnalyticsTable(
        scope,
        query,
        tableOrder,
      )
    : null;
  if (evidence !== null && (
    evidence.factSetRevisionSha256 !== response.factSetRevisionSha256 ||
    evidence.moneyBasis !== input.moneyBasis ||
    evidence.currency !== response.partitions[0].currency
  )) {
    throw new TypeError("Trade Explorer summary and rows were calculated from different facts.");
  }
  return Object.freeze({
    selectedMetric: selected as JournalAnalyticsMetricResult | null,
    response,
    evidence,
    evidenceUnavailableReason: evidence === null
      ? "Choose one currency to view individual trades."
      : null,
  });
}

export type TradeExplorerPageModel = Readonly<{
  expectedAccountSelectionRef: AnalyticsLabPlatformPageModel["expectedAccountSelectionRef"];
  metrics: AnalyticsLabPlatformPageModel["metrics"];
  currencies: AnalyticsLabPlatformPageModel["currencies"];
  symbols: AnalyticsLabPlatformPageModel["symbols"];
  minimumDate: AnalyticsLabPlatformPageModel["minimumDate"];
  maximumDate: AnalyticsLabPlatformPageModel["maximumDate"];
  groupings: readonly Readonly<{ value: AnalyticsLabPlatformQuery["grouping"]; label: string }>[];
  initialQuery: AnalyticsLabPlatformQuery;
  initialPreview: AnalyticsLabPlatformPreview;
}>;

export function runTradeExplorerQuery(
  scope: WorkspaceAccessScope,
  input: unknown,
  afterCursor?: unknown,
  tradeSort?: unknown,
): AnalyticsLabPlatformPreview {
  const normalized = normalizeAnalyticsLabPlatformQuery(input);
  if (!EXPLORER_SELECTOR_METRIC_IDS.has(normalized.metricId)) {
    throw new TypeError("Invalid Trade Explorer metric.");
  }
  const basisMetricId = tradeExplorerMetricForMoneyBasis(
    normalized.metricId,
    normalized.moneyBasis,
  );
  const explorerQuery = Object.freeze({
    ...normalized,
    metricId: tradeExplorerMetricForOutcome(basisMetricId, normalized.outcome),
  });
  const explorerTradeSort = tradeExplorerTradeSortForOutcome(
    tradeSort ?? "closed_desc",
    explorerQuery.outcome,
  );
  return execute(
    scope,
    explorerQuery,
    normalizeEvidenceCursor(afterCursor),
    tradeExplorerTableOrder(explorerTradeSort),
  );
}

export function readTradeExplorerPageModel(
  scope: WorkspaceAccessScope,
): TradeExplorerPageModel {
  const page = withJournalAnalyticsDashboardRuntime(scope, ({ dashboard, service }) => {
    const calendarInput = Object.freeze({
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
    const calendar = dashboard.getCalendar(scope, calendarInput);
    const currencyCalendars = calendar.availableCurrencies.map((currency) =>
      currency === calendar.currency
        ? calendar
        : dashboard.getCalendar(scope, Object.freeze({
            ...calendarInput,
            currency,
          })));
    const minimumDate = currencyCalendars.map((item) => item.minimumDate).sort()[0] ??
      calendar.minimumDate;
    const maximumDate = currencyCalendars.map((item) => item.maximumDate).sort().at(-1) ??
      calendar.maximumDate;
    const symbols = Object.freeze([...new Set(currencyCalendars.flatMap((item) =>
      item.symbols))].sort());
    const initialQuery: AnalyticsLabPlatformQuery = Object.freeze({
      expectedAccountSelectionRef: currentJournalAccountSelectionRef(scope),
      metricId: "total_trades",
      grouping: "closing_month",
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
      startDate: minimumDate,
      endDate: maximumDate,
      minimumHoldingSeconds: null,
      maximumHoldingSeconds: null,
      minimumEnteredQuantity: null,
      maximumEnteredQuantity: null,
      minimumPositionQuantity: null,
      maximumPositionQuantity: null,
      minimumEntryNotional: null,
      maximumEntryNotional: null,
      evidenceRows: 50,
    });
    return Object.freeze({
      expectedAccountSelectionRef: initialQuery.expectedAccountSelectionRef,
      metrics: Object.freeze(journalAnalyticsMetricRegistry.definitions
        .filter((definition) => EXPLORER_SELECTOR_METRIC_IDS.has(definition.metricId))
        .map((definition) => Object.freeze({
          metricId: definition.metricId,
          title: definition.title,
          description: definition.description,
          capabilityState: definition.capabilityState,
          valueKind: definition.valueKind,
          unit: definition.unit,
          moneyBasis: definition.moneyBasis,
          displayPolicy: definition.displayPolicy,
          unavailableReasonCode: definition.unavailableReasonCode,
        }))),
      currencies: calendar.availableCurrencies,
      symbols,
      minimumDate,
      maximumDate,
      initialQuery,
      initialPreview: buildPreview(
        scope,
        initialQuery,
        null,
        service,
        tradeExplorerTableOrder("closed_desc"),
      ),
    });
  });
  return Object.freeze({
    ...page,
    groupings: Object.freeze(analyticsLabPlatformGroupingOptions
      .filter(([value]) => !["account", "provenance", "total"].includes(value))
      .map(([value, label]) => Object.freeze({
        value,
        label: label === "Entry notional" ? "Entry value" : label,
      }))),
  });
}
