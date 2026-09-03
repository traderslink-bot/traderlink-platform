import "server-only";

import Decimal from "decimal.js";

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
import type {
  JournalAnalyticsExactValue,
  JournalAnalyticsMetricResult,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
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
  withJournalAnalyticsReportingDashboardRuntime,
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
import {
  TRADE_EXPLORER_COMPARISON_METRIC_IDS,
  TRADE_EXPLORER_COMPARISON_VERSION,
  type TradeExplorerComparisonDifference,
  type TradeExplorerComparisonInput,
  type TradeExplorerComparisonResult,
} from "./trade-explorer-comparison-model";

const ExactDecimal = Decimal.clone({
  precision: 120,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

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
  "expectancy",
  "return_on_entry_notional",
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
  asOfUtc: string,
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
    asOfUtc,
    table: Object.freeze({ pageSize: input.evidenceRows, afterCursor }),
  });
}

function normalizeEvidenceCursor(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "string" && input.length > 0 && input.length <= 4_096) return input;
  throw new TypeError("Invalid Trade Explorer evidence cursor.");
}

async function execute(
  scope: WorkspaceAccessScope,
  input: AnalyticsLabPlatformQuery,
  afterCursor: string | null = null,
  tableOrder: JournalAnalyticsTableOrder = tradeExplorerTableOrder("closed_desc"),
): Promise<AnalyticsLabPlatformPreview> {
  const asOfUtc = new Date().toISOString();
  return withJournalAnalyticsReportingDashboardRuntime(scope, ({ service }) =>
    buildPreview(scope, input, afterCursor, service, tableOrder, asOfUtc));
}

function buildPreview(
  scope: WorkspaceAccessScope,
  input: AnalyticsLabPlatformQuery,
  afterCursor: string | null,
  service: JournalAnalyticsService,
  tableOrder: JournalAnalyticsTableOrder,
  asOfUtc: string,
): AnalyticsLabPlatformPreview {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  const query = journalQuery(scope, input, afterCursor, asOfUtc);
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

export async function runTradeExplorerQuery(
  scope: WorkspaceAccessScope,
  input: unknown,
  afterCursor?: unknown,
  tradeSort?: unknown,
): Promise<AnalyticsLabPlatformPreview> {
  const normalizedRequest = normalizeTradeExplorerQueryRequest(input, tradeSort);
  return execute(
    scope,
    normalizedRequest.query,
    normalizeEvidenceCursor(afterCursor),
    normalizedRequest.tableOrder,
  );
}

export function normalizeTradeExplorerQueryRequest(
  input: unknown,
  tradeSort: unknown,
): Readonly<{
  query: AnalyticsLabPlatformQuery;
  tradeSort: TradeExplorerTradeSort;
  tableOrder: JournalAnalyticsTableOrder;
}> {
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
  return Object.freeze({
    query: explorerQuery,
    tradeSort: explorerTradeSort,
    tableOrder: tradeExplorerTableOrder(explorerTradeSort),
  });
}

export async function runCompleteTradeExplorerTableQuery(
  scope: WorkspaceAccessScope,
  input: unknown,
  tradeSort?: unknown,
): Promise<AnalyticsLabPlatformPreview> {
  const normalizedRequest = normalizeTradeExplorerQueryRequest(input, tradeSort);
  const reportQuery = Object.freeze({
    ...normalizedRequest.query,
    evidenceRows: 100 as const,
  });
  const asOfUtc = new Date().toISOString();
  return withJournalAnalyticsReportingDashboardRuntime(scope, ({ service }) => {
    const first = buildPreview(
      scope,
      reportQuery,
      null,
      service,
      normalizedRequest.tableOrder,
      asOfUtc,
    );
    if (first.evidence === null || first.evidence.continuationCursor === null) {
      return first;
    }

    const rows = [...first.evidence.rows];
    let cursor: string | null = first.evidence.continuationCursor;
    while (cursor !== null) {
      const page = service.getRoundTripAnalyticsTable(
        scope,
        journalQuery(scope, reportQuery, cursor, asOfUtc),
        normalizedRequest.tableOrder,
      );
      if (
        page.factSetRevisionSha256 !== first.evidence.factSetRevisionSha256 ||
        page.moneyBasis !== first.evidence.moneyBasis ||
        page.currency !== first.evidence.currency ||
        page.timezone !== first.evidence.timezone ||
        page.totalRowCount !== first.evidence.totalRowCount
      ) {
        throw new TypeError("Trade Explorer report rows changed while the report was generated.");
      }
      rows.push(...page.rows);
      cursor = page.continuationCursor;
    }
    if (rows.length !== first.evidence.totalRowCount) {
      throw new TypeError("Trade Explorer report did not include every matching trade.");
    }
    return Object.freeze({
      ...first,
      evidence: Object.freeze({
        ...first.evidence,
        rows: Object.freeze(rows),
        continuationCursor: null,
      }),
    });
  });
}

function comparisonRecord(value: unknown): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Invalid Trade Explorer comparison.");
  }
  return value as Readonly<Record<string, unknown>>;
}

function comparisonName(value: unknown): string {
  if (typeof value !== "string") throw new TypeError("Invalid comparison group name.");
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (normalized.length < 1 || normalized.length > 40 ||
      /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new TypeError("Invalid comparison group name.");
  }
  return normalized;
}

export function normalizeTradeExplorerComparison(
  input: unknown,
): TradeExplorerComparisonInput {
  const value = comparisonRecord(input);
  if (Object.keys(value).sort().join("\u0000") !==
      ["comparisonVersion", "groups"].sort().join("\u0000") ||
      value.comparisonVersion !== TRADE_EXPLORER_COMPARISON_VERSION ||
      !Array.isArray(value.groups) || value.groups.length < 2 || value.groups.length > 4) {
    throw new TypeError("Invalid Trade Explorer comparison.");
  }
  const groups = Object.freeze(value.groups.map((candidate) => {
    const group = comparisonRecord(candidate);
    if (Object.keys(group).sort().join("\u0000") !== ["name", "query"].sort().join("\u0000")) {
      throw new TypeError("Invalid Trade Explorer comparison group.");
    }
    return Object.freeze({
      name: comparisonName(group.name),
      query: normalizeAnalyticsLabPlatformQuery(group.query),
    });
  }));
  if (new Set(groups.map((group) => group.name.toLocaleLowerCase("en-US"))).size !== groups.length) {
    throw new TypeError("Comparison group names must be different.");
  }
  const baseline = groups[0].query;
  for (const group of groups.slice(1)) {
    if (group.query.expectedAccountSelectionRef !== baseline.expectedAccountSelectionRef ||
        group.query.moneyBasis !== baseline.moneyBasis ||
        group.query.currency !== baseline.currency) {
      throw new TypeError("Comparison groups must use the same account, P/L basis and currency.");
    }
  }
  return Object.freeze({
    comparisonVersion: TRADE_EXPLORER_COMPARISON_VERSION,
    groups,
  });
}

function canonicalDecimal(value: Decimal): string {
  const fixed = value.toFixed();
  if (!fixed.includes(".")) return fixed === "-0" ? "0" : fixed;
  const normalized = fixed.replace(/\.0+$/u, "").replace(/(\.\d*?)0+$/u, "$1");
  return normalized === "-0" ? "0" : normalized;
}

function decimalPlaces(value: string): number {
  return value.includes(".") ? value.length - value.indexOf(".") - 1 : 0;
}

function subtractExactValues(
  baseline: JournalAnalyticsExactValue,
  compared: JournalAnalyticsExactValue,
): JournalAnalyticsExactValue | null {
  if (baseline.kind !== compared.kind || baseline.kind === "text") return null;
  if (baseline.kind === "integer" && compared.kind === "integer") {
    const difference = compared.value - baseline.value;
    return Number.isSafeInteger(difference)
      ? Object.freeze({ kind: "integer" as const, value: difference })
      : null;
  }
  if (baseline.kind === "decimal" && compared.kind === "decimal") {
    return Object.freeze({
      kind: "decimal" as const,
      valueDecimal: canonicalDecimal(
        new ExactDecimal(compared.valueDecimal).minus(baseline.valueDecimal),
      ),
    });
  }
  if (baseline.kind === "duration" && compared.kind === "duration") {
    const difference = compared.milliseconds - baseline.milliseconds;
    return Number.isSafeInteger(difference)
      ? Object.freeze({ kind: "duration" as const, milliseconds: difference })
      : null;
  }
  if (baseline.kind === "rational" && compared.kind === "rational") {
    const baselineDenominator = new ExactDecimal(baseline.denominatorInteger);
    const comparedDenominator = new ExactDecimal(compared.denominatorInteger);
    if (baselineDenominator.isZero() || comparedDenominator.isZero()) return null;
    const numerator = new ExactDecimal(compared.numeratorDecimal)
      .times(baselineDenominator)
      .minus(new ExactDecimal(baseline.numeratorDecimal).times(comparedDenominator));
    const denominator = comparedDenominator.times(baselineDenominator);
    const scale = Math.max(
      decimalPlaces(baseline.roundedDecimal),
      decimalPlaces(compared.roundedDecimal),
    );
    return Object.freeze({
      kind: "rational" as const,
      numeratorDecimal: canonicalDecimal(numerator),
      denominatorInteger: canonicalDecimal(denominator),
      roundedDecimal: numerator.dividedBy(denominator).toFixed(scale),
      roundingPolicy: baseline.roundingPolicy,
    });
  }
  return null;
}

function comparisonMetric(
  preview: AnalyticsLabPlatformPreview,
  metricId: string,
): Readonly<{ metric: JournalAnalyticsMetricResult; timezone: string | null }> | null {
  if (preview.response.partitions.length !== 1) return null;
  const partition = preview.response.partitions[0];
  const metric = partition.metrics.find((candidate) => candidate.metricId === metricId);
  return metric ? Object.freeze({ metric, timezone: partition.timezone }) : null;
}

function difference(
  baselineName: string,
  baseline: AnalyticsLabPlatformPreview,
  comparedName: string,
  compared: AnalyticsLabPlatformPreview,
  metricId: string,
): TradeExplorerComparisonDifference {
  const left = comparisonMetric(baseline, metricId);
  const right = comparisonMetric(compared, metricId);
  const compatible = left !== null && right !== null &&
    left.timezone === right.timezone &&
    left.metric.formulaVersion === right.metric.formulaVersion &&
    left.metric.valueKind === right.metric.valueKind &&
    left.metric.unit === right.metric.unit &&
    left.metric.moneyBasis === right.metric.moneyBasis &&
    left.metric.currency === right.metric.currency &&
    left.metric.timezonePolicy === right.metric.timezonePolicy &&
    left.metric.dateAttributionPolicy === right.metric.dateAttributionPolicy &&
    left.metric.value !== null && right.metric.value !== null;
  const value = compatible
    ? subtractExactValues(left.metric.value!, right.metric.value!)
    : null;
  return Object.freeze({
    baselineGroupName: baselineName,
    comparedGroupName: comparedName,
    metricId,
    state: value === null ? "unavailable" as const : "complete" as const,
    value,
    unavailableReason: value === null
      ? "These two values do not share one compatible factual basis."
      : null,
  });
}

export async function runTradeExplorerComparison(
  scope: WorkspaceAccessScope,
  input: unknown,
): Promise<TradeExplorerComparisonResult> {
  const normalized = normalizeTradeExplorerComparison(input);
  const generatedAtUtc = new Date().toISOString();
  return withJournalAnalyticsReportingDashboardRuntime(scope, ({ service }) => {
    const groups = normalized.groups.map((group) => {
      const query = Object.freeze({
        ...group.query,
        grouping: "total" as const,
        metricId: "total_trades",
        evidenceRows: 50 as const,
      });
      return Object.freeze({
        name: group.name,
        query,
        preview: buildPreview(
          scope,
          query,
          null,
          service,
          tradeExplorerTableOrder("closed_desc"),
          generatedAtUtc,
        ),
      });
    });
    const factSetRevisions = new Set(groups.map((group) =>
      group.preview.response.factSetRevisionSha256));
    if (factSetRevisions.size !== 1) {
      throw new TypeError("Comparison groups were calculated from different facts.");
    }
    const baseline = groups[0];
    const selectedPnlMetricId = baseline.query.moneyBasis === "net" ? "net_pnl" : "gross_pnl";
    const differenceMetricIds = TRADE_EXPLORER_COMPARISON_METRIC_IDS.filter((metricId) =>
      metricId !== (baseline.query.moneyBasis === "net" ? "gross_pnl" : "net_pnl"));
    return Object.freeze({
      comparisonVersion: TRADE_EXPLORER_COMPARISON_VERSION,
      factSetRevisionSha256: [...factSetRevisions][0],
      generatedAtUtc,
      groups: Object.freeze(groups),
      differences: Object.freeze(groups.slice(1).flatMap((compared) =>
        differenceMetricIds.map((metricId) => difference(
          baseline.name,
          baseline.preview,
          compared.name,
          compared.preview,
          metricId === "net_pnl" || metricId === "gross_pnl" ? selectedPnlMetricId : metricId,
        )))),
      limitations: Object.freeze([
        "Differences describe these completed-trade groups only and do not predict future results.",
        "Unavailable values remain unavailable and are not replaced with estimates.",
      ]),
    });
  });
}

export async function readTradeExplorerPageModel(
  scope: WorkspaceAccessScope,
): Promise<TradeExplorerPageModel> {
  const page = await withJournalAnalyticsReportingDashboardRuntime(scope, ({ dashboard, pnlReportingBasis, service }) => {
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
      moneyBasis: pnlReportingBasis,
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
        new Date().toISOString(),
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
