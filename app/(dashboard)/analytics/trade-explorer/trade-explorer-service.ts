import "server-only";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";
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
  JournalAnalyticsRoundTripTableRow,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import type {
  JournalDailyNoteRecord,
  JournalRuleRecord,
  JournalRuleReviewRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import { withScopedJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import {
  TRADE_EXPLORER_DAY_STATISTIC_GROUPS,
  TRADE_EXPLORER_TRADE_STATISTIC_GROUPS,
  tradeExplorerMetricForMoneyBasis,
  tradeExplorerMetricForOutcome,
  tradeExplorerTableOrder,
  tradeExplorerTradeSortForOutcome,
  type TradeExplorerTradeSort,
} from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
import { journalAnalyticsMetricRegistry } from "@/src/modules/journal-analytics/server/analytics-metric-registry";
import type { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";
import {
  requireActiveJournalAnalyticsAccountId,
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { toLogicalTradeAnalyticsTable } from "@/src/modules/journal-analytics/server/logical-trade-analytics-table";

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
import type {
  TradeExplorerQuery,
  TradeExplorerRuleStatus,
} from "./trade-explorer-saved-view-model";

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
  "median_pnl",
  "profit_factor",
  "best_trade",
  "worst_trade",
  "average_holding_time",
  "average_share_quantity",
  "average_entry_notional",
  "expectancy",
  "return_on_entry_notional",
  "trading_day_count",
  "average_daily_pnl",
  "median_daily_pnl",
  "profitable_trading_day_count",
  "losing_trading_day_count",
  "flat_trading_day_count",
  "pnl_percentile_10",
  "pnl_percentile_25",
  "pnl_percentile_50",
  "pnl_percentile_75",
  "pnl_percentile_90",
  "population_pnl_standard_deviation",
  "selected_pnl_excluding_largest_winner",
  "selected_pnl_excluding_largest_loser",
  "selected_pnl_excluding_largest_winner_and_loser",
  "largest_winner_contribution",
  "largest_loser_contribution",
  "longest_winning_trade_streak",
  "longest_losing_trade_streak",
  "current_winning_trade_streak",
  "current_losing_trade_streak",
  "average_executions_per_trade",
  "scale_in_trade_count",
  "scale_out_trade_count",
  "largest_instrument_pnl_share",
  "largest_day_pnl_share",
  "maximum_intraday_realized_drawdown",
  "maximum_intraday_realized_recovery_from_trough",
  "maximum_peak_profit_giveback",
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
  roundTripIds: readonly string[] | null = null,
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
    ...(roundTripIds === null ? {} : { roundTripIds: Object.freeze([...roundTripIds]) }),
    symbols: Object.freeze(input.symbol === null ? [] : [input.symbol]),
    directions: Object.freeze(input.direction === null ? [] : [input.direction]),
    tradeClassifications: Object.freeze(
      input.tradeClassification === null ? [] : [input.tradeClassification],
    ),
    provenance: Object.freeze([]),
    outcomes: Object.freeze(input.outcome === null ? [] : [input.outcome]),
    entryWeekdays: Object.freeze(input.entryWeekday === null ? [] : [input.entryWeekday]),
    entryTimeBuckets: Object.freeze(input.entryTimeBucket === null ? [] : [input.entryTimeBucket]),
    entrySessions: Object.freeze(input.entrySession == null ? [] : [input.entrySession]),
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

function hasAnnotationFilters(query: TradeExplorerQuery): boolean {
  return query.tagId !== null || query.untaggedOnly || query.noteState !== null ||
    query.reviewIncompleteOnly || query.ruleId !== null ||
    query.dayNoteState !== null || query.dayRuleId !== null;
}

function completeMatchingTradeRows(
  scope: WorkspaceAccessScope,
  query: TradeExplorerQuery,
  service: JournalAnalyticsService,
  asOfUtc: string,
): readonly JournalAnalyticsRoundTripTableRow[] {
  const rows: JournalAnalyticsRoundTripTableRow[] = [];
  let cursor: string | null = null;
  const seen = new Set<string>();
  do {
    const pageQuery = journalQuery(scope, query, cursor, asOfUtc);
    const page = service.getRoundTripAnalyticsTable(scope, Object.freeze({
      ...pageQuery,
      table: Object.freeze({ pageSize: 200, afterCursor: cursor }),
    }), tradeExplorerTableOrder("closed_desc"));
    rows.push(...page.rows);
    cursor = page.continuationCursor;
    if (cursor !== null) {
      if (seen.has(cursor)) throw new TypeError("Trade Explorer annotation paging did not advance.");
      seen.add(cursor);
    }
  } while (cursor !== null);
  return Object.freeze(rows);
}

function ruleAppliesToTrade(
  rule: JournalRuleRecord,
  trade: JournalAnalyticsRoundTripTableRow,
  target: "trade" | "day",
): boolean {
  if (rule.reviewScope !== target && rule.reviewScope !== "both") return false;
  if (trade.openedAtUtc < rule.effectiveFromUtc ||
      (rule.effectiveUntilUtc && trade.openedAtUtc >= rule.effectiveUntilUtc)) {
    return false;
  }
  return !rule.activeIntervals || rule.activeIntervals.some((interval) =>
    trade.openedAtUtc >= interval.fromUtc &&
    (!interval.untilUtc || trade.openedAtUtc < interval.untilUtc));
}

function reviewFor(
  reviews: readonly JournalRuleReviewRecord[],
  rule: JournalRuleRecord,
  targetKind: "round_trip" | "trading_day",
  targetId: string,
): JournalRuleReviewRecord | null {
  return reviews.find((review) =>
    review.ruleId === rule.ruleId &&
    review.ruleVersionId === rule.versionId &&
    review.targetKind === targetKind &&
    (targetKind === "round_trip"
      ? review.roundTripId === targetId
      : review.tradingDayId === targetId)) ?? null;
}

function ruleFilterMatches(
  rule: JournalRuleRecord | null,
  review: JournalRuleReviewRecord | null,
  applicable: boolean,
  status: TradeExplorerRuleStatus | null,
): boolean {
  if (rule === null) return false;
  if (status === null) return applicable;
  if (status === "not_applicable") return !applicable;
  if (!applicable) return false;
  if (status === "not_reviewed") return review === null || review.status === "not_reviewed";
  return review?.status === status;
}

function dailyNotePresent(note: JournalDailyNoteRecord | null): boolean {
  return Boolean(note && [
    note.whatWorked,
    note.whatNeedsWork,
    note.technicalRecap,
    note.tomorrowsFocus,
    note.anythingElse,
  ].some((value) => value.trim().length > 0));
}

function annotationRoundTripIds(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  query: TradeExplorerQuery,
  rows: readonly JournalAnalyticsRoundTripTableRow[],
): readonly string[] {
  return withScopedJournalAnnotations(database, scope, (annotations, account) => {
    const rowIds = Object.freeze(rows.map((row) => row.roundTripId));
    const tagsByTrade = annotations.listTagsForRoundTrips(account, rowIds);
    const notesByTrade = annotations.readRoundTripNotes(account, rowIds);
    const tradingDayByDate = new Map([...new Set(rows.map((row) => row.closeLocalDate))]
      .map((date) => [date, annotations.resolveTradingDayId(account, date)] as const));
    const tradingDayIds = Object.freeze([...new Set([...tradingDayByDate.values()]
      .filter((value): value is string => value !== null))]);
    const reviews = annotations.listRuleReviewsForTargets(account, {
      tradingDayIds,
      roundTripIds: rowIds,
    });
    const earliestOpen = rows.map((row) => row.openedAtUtc).sort()[0] ?? query.startDate;
    const latestClose = rows.map((row) => row.closedAtUtc).sort().at(-1) ?? `${query.endDate}T23:59:59.999Z`;
    const until = new Date(latestClose);
    until.setMilliseconds(until.getMilliseconds() + 1);
    const rules = rows.length === 0
      ? Object.freeze([])
      : annotations.listRulesForEvaluation(account, earliestOpen, until.toISOString());
    const selectedTradeRule = query.ruleId === null
      ? null
      : rules.find((rule) =>
          rule.ruleId === query.ruleId && rule.versionId === query.ruleVersionId) ?? null;
    const selectedDayRule = query.dayRuleId === null
      ? null
      : rules.find((rule) =>
          rule.ruleId === query.dayRuleId && rule.versionId === query.dayRuleVersionId) ?? null;
    const customTradeRules = rules.filter((rule) =>
      rule.sourceKind === "custom" && (rule.reviewScope === "trade" || rule.reviewScope === "both"));
    const dayNotes = new Map([...tradingDayByDate.keys()].map((date) =>
      [date, annotations.readDailyNote(account, date)] as const));
    const dayRuleMatches = new Map([...tradingDayByDate.keys()].map((date) => {
      if (!selectedDayRule) return [date, query.dayRuleId === null] as const;
      const dayRows = rows.filter((row) => row.closeLocalDate === date);
      const applicable = dayRows.some((row) =>
        ruleAppliesToTrade(selectedDayRule, row, "day"));
      const tradingDayId = tradingDayByDate.get(date) ?? null;
      const review = tradingDayId === null
        ? null
        : reviewFor(reviews, selectedDayRule, "trading_day", tradingDayId);
      return [date, ruleFilterMatches(
        selectedDayRule,
        review,
        applicable,
        query.dayRuleStatus,
      )] as const;
    }));

    return Object.freeze(rows.filter((row) => {
      const assignedTags = tagsByTrade[row.roundTripId] ?? Object.freeze([]);
      if (query.tagId !== null && !assignedTags.some((tag) => tag.tagId === query.tagId)) return false;
      if (query.untaggedOnly && assignedTags.length > 0) return false;

      const note = notesByTrade[row.roundTripId] ?? null;
      const notePresent = Boolean(note &&
        (note.tradeNote.trim().length > 0 || note.technicalNote.trim().length > 0));
      if (query.noteState === "present" && !notePresent) return false;
      if (query.noteState === "missing" && notePresent) return false;

      if (query.reviewIncompleteOnly && !customTradeRules.some((rule) => {
        if (!ruleAppliesToTrade(rule, row, "trade")) return false;
        const review = reviewFor(reviews, rule, "round_trip", row.roundTripId);
        return review === null || review.status === "not_reviewed";
      })) return false;

      if (selectedTradeRule) {
        const applicable = ruleAppliesToTrade(selectedTradeRule, row, "trade");
        const review = reviewFor(reviews, selectedTradeRule, "round_trip", row.roundTripId);
        if (!ruleFilterMatches(selectedTradeRule, review, applicable, query.ruleStatus)) return false;
      } else if (query.ruleId !== null) return false;

      const hasDayNote = dailyNotePresent(dayNotes.get(row.closeLocalDate) ?? null);
      if (query.dayNoteState === "present" && !hasDayNote) return false;
      if (query.dayNoteState === "missing" && hasDayNote) return false;

      if (!(dayRuleMatches.get(row.closeLocalDate) ?? true)) return false;
      return true;
    }).map((row) => row.roundTripId));
  });
}

async function execute(
  scope: WorkspaceAccessScope,
  input: TradeExplorerQuery,
  afterCursor: string | null = null,
  tableOrder: JournalAnalyticsTableOrder = tradeExplorerTableOrder("closed_desc"),
): Promise<AnalyticsLabPlatformPreview> {
  const asOfUtc = new Date().toISOString();
  return withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ service, verifiedReadonlyDatabase }) => {
      const roundTripIds = hasAnnotationFilters(input)
        ? annotationRoundTripIds(
            verifiedReadonlyDatabase,
            scope,
            input,
            completeMatchingTradeRows(scope, input, service, asOfUtc),
          )
        : null;
      return buildPreview(
        scope,
        input,
        afterCursor,
        service,
        tableOrder,
        asOfUtc,
        roundTripIds,
        verifiedReadonlyDatabase,
      );
    },
    { prefetchAllFactSet: true },
  );
}

function buildPreview(
  scope: WorkspaceAccessScope,
  input: AnalyticsLabPlatformQuery,
  afterCursor: string | null,
  service: JournalAnalyticsService,
  tableOrder: JournalAnalyticsTableOrder,
  asOfUtc: string,
  roundTripIds: readonly string[] | null = null,
  verifiedReadonlyDatabase: Database.Database | null = null,
  projectLogicalTrades = true,
): AnalyticsLabPlatformPreview {
  requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef);
  const query = journalQuery(scope, input, afterCursor, asOfUtc, roundTripIds);
  const response = service.getAnalyticsOverview(scope, query);
  const selected = response.partitions
    .flatMap((partition) => partition.metrics)
    .find((metric) => metric.metricId === input.metricId) ?? null;
  const rawEvidence = response.partitions.length === 1
    ? service.getRoundTripAnalyticsTable(
        scope,
        query,
        tableOrder,
      )
    : null;
  const evidence = rawEvidence !== null && verifiedReadonlyDatabase !== null && projectLogicalTrades
    ? toLogicalTradeAnalyticsTable(scope, verifiedReadonlyDatabase, rawEvidence)
    : rawEvidence;
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
  annotationOptions: Readonly<{
    tags: readonly Readonly<{ tagId: string; name: string; assignmentCount: number }>[];
    tradeRules: readonly Readonly<{
      ruleId: string;
      ruleVersionId: string;
      title: string;
      versionNumber: number;
    }>[];
    dayRules: readonly Readonly<{
      ruleId: string;
      ruleVersionId: string;
      title: string;
      versionNumber: number;
    }>[];
  }>;
  initialQuery: TradeExplorerQuery;
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
  query: TradeExplorerQuery;
  tradeSort: TradeExplorerTradeSort;
  tableOrder: JournalAnalyticsTableOrder;
}> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Invalid Trade Explorer query.");
  }
  const raw = input as Readonly<Record<string, unknown>>;
  const annotationKeys = [
    "tagId", "untaggedOnly", "noteState", "reviewIncompleteOnly",
    "ruleId", "ruleVersionId", "ruleStatus", "dayNoteState",
    "dayRuleId", "dayRuleVersionId", "dayRuleStatus",
  ] as const;
  const base = Object.fromEntries(Object.entries(raw).filter(([key]) =>
    !annotationKeys.includes(key as (typeof annotationKeys)[number])));
  const normalized = normalizeAnalyticsLabPlatformQuery(base);
  const nullableUuid = (value: unknown, field: string): string | null => {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string") throw new TypeError(`Invalid ${field}.`);
    assertCanonicalUuidV4(value, field);
    return value;
  };
  const nullableState = <T extends string>(
    value: unknown,
    allowed: readonly T[],
    field: string,
  ): T | null => {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string" || !allowed.includes(value as T)) {
      throw new TypeError(`Invalid ${field}.`);
    }
    return value as T;
  };
  const boolean = (value: unknown, field: string): boolean => {
    if (value === undefined) return false;
    if (typeof value !== "boolean") throw new TypeError(`Invalid ${field}.`);
    return value;
  };
  const ruleId = nullableUuid(raw.ruleId, "ruleId");
  const ruleVersionId = nullableUuid(raw.ruleVersionId, "ruleVersionId");
  const ruleStatus = nullableState<TradeExplorerRuleStatus>(raw.ruleStatus, [
    "followed", "broken", "not_reviewed", "not_applicable",
  ], "ruleStatus");
  const dayRuleId = nullableUuid(raw.dayRuleId, "dayRuleId");
  const dayRuleVersionId = nullableUuid(raw.dayRuleVersionId, "dayRuleVersionId");
  const dayRuleStatus = nullableState<TradeExplorerRuleStatus>(raw.dayRuleStatus, [
    "followed", "broken", "not_reviewed", "not_applicable",
  ], "dayRuleStatus");
  if ((ruleId === null) !== (ruleVersionId === null) ||
      (ruleStatus !== null && ruleId === null) ||
      (dayRuleId === null) !== (dayRuleVersionId === null) ||
      (dayRuleStatus !== null && dayRuleId === null)) {
    throw new TypeError("A rule filter must identify one exact rule version.");
  }
  if (!EXPLORER_SELECTOR_METRIC_IDS.has(normalized.metricId)) {
    throw new TypeError("Invalid Trade Explorer metric.");
  }
  const basisMetricId = tradeExplorerMetricForMoneyBasis(
    normalized.metricId,
    normalized.moneyBasis,
  );
  const explorerQuery: TradeExplorerQuery = Object.freeze({
    ...normalized,
    metricId: tradeExplorerMetricForOutcome(basisMetricId, normalized.outcome),
    tagId: nullableUuid(raw.tagId, "tagId"),
    untaggedOnly: boolean(raw.untaggedOnly, "untaggedOnly"),
    noteState: nullableState(raw.noteState, ["present", "missing"] as const, "noteState"),
    reviewIncompleteOnly: boolean(raw.reviewIncompleteOnly, "reviewIncompleteOnly"),
    ruleId,
    ruleVersionId,
    ruleStatus,
    dayNoteState: nullableState(raw.dayNoteState, ["present", "missing"] as const, "dayNoteState"),
    dayRuleId,
    dayRuleVersionId,
    dayRuleStatus,
  });
  if (explorerQuery.tagId !== null && explorerQuery.untaggedOnly) {
    throw new TypeError("Tag and untagged filters cannot be combined.");
  }
  const explorerTradeSort = tradeExplorerTradeSortForOutcome(
    tradeSort ?? "closed_desc",
    explorerQuery.outcome,
  );
  if (explorerQuery.moneyBasis !== "net" && explorerTradeSort.startsWith("trading_costs_")) {
    throw new TypeError("Trading-cost sorting requires the fee-covered Net P/L population.");
  }
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
  return withJournalAnalyticsReportingDashboardRuntime(scope, ({ service, verifiedReadonlyDatabase }) => {
    const roundTripIds = hasAnnotationFilters(reportQuery)
      ? annotationRoundTripIds(
          verifiedReadonlyDatabase,
          scope,
          reportQuery,
          completeMatchingTradeRows(scope, reportQuery, service, asOfUtc),
        )
      : null;
    const first = buildPreview(
      scope,
      reportQuery,
      null,
      service,
      normalizedRequest.tableOrder,
      asOfUtc,
      roundTripIds,
      verifiedReadonlyDatabase,
      false,
    );
    if (first.evidence === null) return first;
    if (first.evidence.continuationCursor === null) {
      return Object.freeze({
        ...first,
        evidence: toLogicalTradeAnalyticsTable(
          scope,
          verifiedReadonlyDatabase,
          first.evidence,
        ),
      });
    }

    const rows = [...first.evidence.rows];
    let cursor: string | null = first.evidence.continuationCursor;
    while (cursor !== null) {
      const page = service.getRoundTripAnalyticsTable(
        scope,
        journalQuery(scope, reportQuery, cursor, asOfUtc, roundTripIds),
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
      evidence: toLogicalTradeAnalyticsTable(
        scope,
        verifiedReadonlyDatabase,
        Object.freeze({
          ...first.evidence,
          rows: Object.freeze(rows),
          continuationCursor: null,
        }),
      ),
    });
  }, { prefetchAllFactSet: true });
}

export async function runTradeExplorerGroupTradesQuery(
  scope: WorkspaceAccessScope,
  input: unknown,
  group: unknown,
  afterCursor?: unknown,
): Promise<AnalyticsLabPlatformPreview> {
  if (!group || typeof group !== "object" || Array.isArray(group)) {
    throw new TypeError("Invalid Trade Explorer group.");
  }
  const value = group as Readonly<Record<string, unknown>>;
  if (Object.keys(value).sort().join("\u0000") !== ["currency", "groupKey", "resultView"].sort().join("\u0000") ||
      (value.resultView !== "days" && value.resultView !== "tickers") ||
      typeof value.groupKey !== "string" ||
      (value.currency !== null && (
        typeof value.currency !== "string" ||
        !/^[A-Z]{3}$/u.test(value.currency)
      ))) {
    throw new TypeError("Invalid Trade Explorer group.");
  }
  const normalized = normalizeTradeExplorerQueryRequest(input, "closed_desc").query;
  const currency = value.currency as string | null;
  const groupKey = value.groupKey;
  if (value.resultView === "days" && !/^\d{4}-\d{2}-\d{2}$/u.test(groupKey)) {
    throw new TypeError("Invalid Trade Explorer trading day.");
  }
  if (value.resultView === "tickers" &&
      (groupKey.length < 1 || groupKey.length > 64 || groupKey !== groupKey.toUpperCase())) {
    throw new TypeError("Invalid Trade Explorer ticker.");
  }
  return runTradeExplorerQuery(scope, Object.freeze({
    ...normalized,
    currency,
    grouping: "total" as const,
    ...(value.resultView === "days"
      ? { startDate: groupKey, endDate: groupKey }
      : { symbol: groupKey }),
    evidenceRows: 100 as const,
  }), afterCursor, "closed_desc");
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
        tagId: null,
        untaggedOnly: false,
        noteState: null,
        reviewIncompleteOnly: false,
        ruleId: null,
        ruleVersionId: null,
        ruleStatus: null,
        dayNoteState: null,
        dayRuleId: null,
        dayRuleVersionId: null,
        dayRuleStatus: null,
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
  initialView?: Readonly<{
    endDate: string | null;
    rank: "pnl" | "trades";
    startDate: string | null;
  }>,
): Promise<TradeExplorerPageModel> {
  const page = await withJournalAnalyticsReportingDashboardRuntime(scope, ({ dashboard, pnlReportingBasis, service, verifiedReadonlyDatabase }) => {
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
    const initialQuery: TradeExplorerQuery = Object.freeze({
      expectedAccountSelectionRef: currentJournalAccountSelectionRef(scope),
      metricId: initialView?.rank === "pnl" ? `${pnlReportingBasis}_pnl` : "total_trades",
      grouping: initialView ? "instrument" : "closing_month",
      moneyBasis: pnlReportingBasis,
      currency: calendar.currency,
      symbol: null,
      direction: null,
      tradeClassification: null,
      provenance: null,
      outcome: null,
      entryWeekday: null,
      entrySession: null,
      entryTimeBucketMinutes: 30,
      entryTimeBucket: null,
      startDate: initialView?.startDate ?? minimumDate,
      endDate: initialView?.endDate ?? maximumDate,
      minimumHoldingSeconds: null,
      maximumHoldingSeconds: null,
      minimumEnteredQuantity: null,
      maximumEnteredQuantity: null,
      minimumPositionQuantity: null,
      maximumPositionQuantity: null,
      minimumEntryNotional: null,
      maximumEntryNotional: null,
      evidenceRows: 50,
      tagId: null,
      untaggedOnly: false,
      noteState: null,
      reviewIncompleteOnly: false,
      ruleId: null,
      ruleVersionId: null,
      ruleStatus: null,
      dayNoteState: null,
      dayRuleId: null,
      dayRuleVersionId: null,
      dayRuleStatus: null,
    });
    const annotationOptions = withScopedJournalAnnotations(
      verifiedReadonlyDatabase,
      scope,
      (annotations, account) => {
        const option = (rule: JournalRuleRecord) => Object.freeze({
          ruleId: rule.ruleId,
          ruleVersionId: rule.versionId,
          title: rule.title,
          versionNumber: rule.versionNumber,
        });
        const rules = annotations.listRules(account)
          .filter((rule) => rule.sourceKind === "custom" && rule.lifecycleState !== "retired");
        return Object.freeze({
          tags: Object.freeze(annotations.listTags(account).map((tag) => Object.freeze({
            tagId: tag.tagId,
            name: tag.name,
            assignmentCount: tag.assignmentCount,
          }))),
          tradeRules: Object.freeze(rules
            .filter((rule) => rule.reviewScope === "trade" || rule.reviewScope === "both")
            .map(option)),
          dayRules: Object.freeze(rules
            .filter((rule) => rule.reviewScope === "day" || rule.reviewScope === "both")
            .map(option)),
        });
      },
    );
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
      annotationOptions,
      initialQuery,
      initialPreview: buildPreview(
        scope,
        initialQuery,
        null,
        service,
        tradeExplorerTableOrder("closed_desc"),
        new Date().toISOString(),
        null,
        verifiedReadonlyDatabase,
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
