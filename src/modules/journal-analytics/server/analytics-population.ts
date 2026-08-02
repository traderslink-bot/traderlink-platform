import {
  assertCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  assertJournalCurrency,
  assertJournalTradingDate,
  assertJournalUtcTimestamp,
} from "@/src/modules/journal/contracts/journal-storage-values";
import type { JournalAnalyticsRoundTripFact } from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import type {
  JournalAnalyticsGrouping,
  JournalAnalyticsOutcome,
  JournalAnalyticsQuery,
} from "../contracts/analytics-query";
import {
  JOURNAL_ANALYTICS_MAX_METRICS_PER_QUERY,
  JOURNAL_ANALYTICS_MAX_SYMBOLS_PER_QUERY,
  JOURNAL_ANALYTICS_MAX_TABLE_PAGE_SIZE,
  JOURNAL_ANALYTICS_QUERY_VERSION,
  JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES,
} from "../contracts/analytics-query";
import type { JournalAnalyticsCoverage } from "../contracts/analytics-result";
import { requireJournalAnalyticsFirstSliceMetricDefinition } from "./analytics-metric-registry";
import type {
  JournalAnalyticsUnavailableRoundTrip,
  NormalizedJournalAnalyticsRow,
  NormalizedJournalAnalyticsSet,
} from "./normalize-journal-analytics-facts";
import {
  classifyJournalAnalyticsProvenance,
  journalAnalyticsLocalTimeFact,
} from "./normalize-journal-analytics-facts";

const firstSliceGroupings = new Set<JournalAnalyticsGrouping>([
  "total",
  "closing_day",
  "instrument",
  "entry_time_bucket",
]);

function unique<T extends string>(
  values: readonly T[],
  field: string,
): readonly T[] {
  const sorted = [...new Set(values)].sort();
  if (sorted.length !== values.length) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return Object.freeze(sorted);
}

export function requireJournalAnalyticsQuery(
  normalized: NormalizedJournalAnalyticsSet,
  query: JournalAnalyticsQuery,
): JournalAnalyticsQuery {
  if (query.queryVersion !== JOURNAL_ANALYTICS_QUERY_VERSION) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "queryVersion",
    });
  }
  if (
    query.accountIds.length < 1 ||
    query.accountIds.length > normalized.accounts.length
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "accountIds",
    });
  }
  const availableAccounts = new Set(normalized.accounts.map((account) =>
    account.accountId));
  const accountIds = unique(query.accountIds, "accountIds");
  for (const accountId of accountIds) {
    assertCanonicalUuidV4(accountId, "accountId");
    if (!availableAccounts.has(accountId)) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
  }
  if (
    query.metricIds.length < 1 ||
    query.metricIds.length > JOURNAL_ANALYTICS_MAX_METRICS_PER_QUERY
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "metricIds",
    });
  }
  const metricIds = unique(query.metricIds, "metricIds");
  for (const metricId of metricIds) {
    requireJournalAnalyticsFirstSliceMetricDefinition(metricId);
  }
  if (query.closingDateRange.kind === "inclusive_closing_date") {
    assertJournalTradingDate(query.closingDateRange.startDate, "startDate");
    assertJournalTradingDate(query.closingDateRange.endDate, "endDate");
    if (query.closingDateRange.endDate < query.closingDateRange.startDate) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "closingDateRange",
      });
    }
  }
  if (query.currency !== null) assertJournalCurrency(query.currency, "currency");
  if (query.instrumentIds.length > JOURNAL_ANALYTICS_MAX_SYMBOLS_PER_QUERY) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "instrumentIds",
    });
  }
  const instrumentIds = unique(query.instrumentIds, "instrumentIds");
  for (const instrumentId of instrumentIds) {
    assertCanonicalUuidV4(instrumentId, "instrumentId");
  }
  if (query.symbols.length > JOURNAL_ANALYTICS_MAX_SYMBOLS_PER_QUERY) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "symbols",
    });
  }
  const symbols = unique(query.symbols, "symbols");
  if (symbols.some((symbol) =>
    symbol.length < 1 || symbol.length > 64 || symbol !== symbol.toUpperCase())) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "symbols",
    });
  }
  const directions = unique(query.directions, "directions");
  const provenance = unique(query.provenance, "provenance");
  const outcomes = unique(query.outcomes, "outcomes");
  const groupings = unique(query.groupings, "groupings");
  if (
    !["gross", "net"].includes(query.moneyBasis) ||
    directions.some((value) => !["long", "short"].includes(value)) ||
    provenance.some((value) => ![
      "broker_only",
      "manual_only",
      "correction_only",
      "mixed",
      "unknown",
    ].includes(value)) ||
    outcomes.some((value) => !["win", "loss", "flat"].includes(value))
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "queryFilter",
    });
  }
  if (groupings.some((grouping) => !firstSliceGroupings.has(grouping))) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "groupings",
    });
  }
  if (!JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES.includes(
    query.entryTimeBucketMinutes,
  )) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "entryTimeBucketMinutes",
    });
  }
  if (
    !Number.isSafeInteger(query.table.pageSize) ||
    query.table.pageSize < 1 ||
    query.table.pageSize > JOURNAL_ANALYTICS_MAX_TABLE_PAGE_SIZE ||
    query.table.afterCursor !== null
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "table",
    });
  }
  assertJournalUtcTimestamp(query.asOfUtc, "asOfUtc");
  return Object.freeze({
    ...query,
    accountIds,
    metricIds,
    closingDateRange: Object.freeze({ ...query.closingDateRange }),
    instrumentIds,
    symbols,
    directions,
    provenance,
    outcomes,
    groupings,
    table: Object.freeze({ ...query.table }),
  });
}

export type JournalAnalyticsPopulation = Readonly<{
  partitionKey: string;
  currency: string | null;
  tradingTimezone: string;
  factSetRevisionSha256: string;
  grossRows: readonly NormalizedJournalAnalyticsRow[];
  netRows: readonly NormalizedJournalAnalyticsRow[];
  basisRows: readonly NormalizedJournalAnalyticsRow[];
  coverage: JournalAnalyticsCoverage;
  limitations: readonly string[];
}>;

function partitionKey(currency: string | null, tradingTimezone: string): string {
  return JSON.stringify([currency, tradingTimezone]);
}

function inClosingRange(
  localDate: string,
  query: JournalAnalyticsQuery,
): boolean {
  return query.closingDateRange.kind === "all_available" || (
    localDate >= query.closingDateRange.startDate &&
    localDate <= query.closingDateRange.endDate
  );
}

function baseRowMatches(
  row: NormalizedJournalAnalyticsRow,
  query: JournalAnalyticsQuery,
): boolean {
  return query.accountIds.includes(row.accountId) &&
    (query.currency === null || query.currency === row.tradeCurrency) &&
    (query.instrumentIds.length === 0 ||
      query.instrumentIds.includes(row.instrumentId)) &&
    (query.symbols.length === 0 || query.symbols.includes(row.displayedSymbol)) &&
    (query.directions.length === 0 || query.directions.includes(row.direction)) &&
    (query.provenance.length === 0 ||
      query.provenance.includes(row.provenanceGroup)) &&
    inClosingRange(row.closeLocal.localDate, query);
}

function roundTripMatches(
  roundTrip: JournalAnalyticsRoundTripFact,
  tradingTimezone: string,
  query: JournalAnalyticsQuery,
): boolean {
  const source = classifyJournalAnalyticsProvenance(roundTrip.allocations);
  if (
    !query.accountIds.includes(roundTrip.accountId) ||
    (query.currency !== null && query.currency !== roundTrip.tradeCurrency) ||
    (query.instrumentIds.length > 0 &&
      !query.instrumentIds.includes(roundTrip.instrumentId)) ||
    (query.symbols.length > 0 &&
      !query.symbols.includes(roundTrip.displayedSymbol)) ||
    (query.directions.length > 0 &&
      !query.directions.includes(roundTrip.direction)) ||
    (query.provenance.length > 0 && !query.provenance.includes(source.group))
  ) {
    return false;
  }
  if (query.closingDateRange.kind === "all_available") return true;
  const start = journalAnalyticsLocalTimeFact(
    roundTrip.openedAtUtc,
    tradingTimezone,
  ).localDate;
  const endAt = roundTrip.closedAtUtc ?? query.asOfUtc;
  if (Date.parse(endAt) < Date.parse(roundTrip.openedAtUtc)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "asOfUtc",
    });
  }
  const end = journalAnalyticsLocalTimeFact(endAt, tradingTimezone).localDate;
  return start <= query.closingDateRange.endDate &&
    end >= query.closingDateRange.startDate;
}

function unavailableMatches(
  row: JournalAnalyticsUnavailableRoundTrip,
  query: JournalAnalyticsQuery,
): boolean {
  return query.accountIds.includes(row.accountId) &&
    (query.currency === null || query.currency === row.tradeCurrency) &&
    (query.instrumentIds.length === 0 ||
      query.instrumentIds.includes(row.instrumentId)) &&
    (query.symbols.length === 0 || query.symbols.includes(row.displayedSymbol)) &&
    (query.directions.length === 0 || query.directions.includes(row.direction)) &&
    (query.provenance.length === 0 ||
      query.provenance.includes(row.provenanceGroup)) &&
    (
      query.closingDateRange.kind === "all_available" ||
      (row.closedAtUtc !== null && inClosingRange(
        journalAnalyticsLocalTimeFact(
          row.closedAtUtc,
          row.tradingTimezone,
        ).localDate,
        query,
      ))
    );
}

function incrementReason(
  reasons: Record<string, number>,
  reason: string,
  amount = 1,
): void {
  reasons[reason] = (reasons[reason] ?? 0) + amount;
}

function selectedBasisOutcome(
  row: NormalizedJournalAnalyticsRow,
  query: JournalAnalyticsQuery,
): JournalAnalyticsOutcome | null {
  return query.moneyBasis === "gross" ? row.grossOutcome : row.netOutcome;
}

function scopeCoverageIsExactlyAttributable(
  query: JournalAnalyticsQuery,
  partitionCount: number,
): boolean {
  return partitionCount === 1 &&
    query.closingDateRange.kind === "all_available" &&
    query.currency === null &&
    query.instrumentIds.length === 0 &&
    query.symbols.length === 0 &&
    query.directions.length === 0 &&
    query.provenance.length === 0 &&
    query.outcomes.length === 0;
}

export function buildJournalAnalyticsPopulations(
  normalized: NormalizedJournalAnalyticsSet,
  rawQuery: JournalAnalyticsQuery,
): readonly JournalAnalyticsPopulation[] {
  const query = requireJournalAnalyticsQuery(normalized, rawQuery);
  const accountById = new Map(normalized.accounts.map((account) => [
    account.accountId,
    account,
  ]));
  const realized = normalized.realizedRows.filter((row) =>
    baseRowMatches(row, query));
  const open = normalized.legitimateOpenRoundTrips.filter((row) => {
    const account = accountById.get(row.accountId);
    return account ? roundTripMatches(row, account.tradingTimezone, query) : false;
  });
  const decisions = normalized.needsDecisionRoundTrips.filter((row) => {
    const account = accountById.get(row.accountId);
    return account ? roundTripMatches(row, account.tradingTimezone, query) : false;
  });
  const unavailable = normalized.unavailableRoundTrips.filter((row) =>
    unavailableMatches(row, query));
  const keys = new Set<string>();
  for (const row of realized) keys.add(partitionKey(row.tradeCurrency, row.tradingTimezone));
  for (const row of [...open, ...decisions]) {
    const account = accountById.get(row.accountId);
    if (!account) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "analytics_population_account",
      });
    }
    keys.add(partitionKey(row.tradeCurrency, account.tradingTimezone));
  }
  for (const row of unavailable) {
    keys.add(partitionKey(row.tradeCurrency, row.tradingTimezone));
  }
  if (keys.size === 0 && normalized.accounts.length > 0) {
    const timezones = new Set(normalized.accounts
      .filter((account) => query.accountIds.includes(account.accountId))
      .map((account) => account.tradingTimezone));
    for (const timezone of timezones) keys.add(partitionKey(query.currency, timezone));
  }
  const exactScopeCoverage = scopeCoverageIsExactlyAttributable(query, keys.size);
  const selectedAccounts = normalized.accounts.filter((account) =>
    query.accountIds.includes(account.accountId));
  const excludedScopeCount = selectedAccounts.reduce((sum, account) =>
    sum + (account.coverage.executions.byState.excluded_by_trader ?? 0), 0);
  const unsupportedSourceScopeCount = selectedAccounts.reduce((sum, account) =>
    sum + account.coverage.unsupportedSourceRecords.total, 0);
  return Object.freeze([...keys].sort().map((key) => {
    const [currency, tradingTimezone] = JSON.parse(key) as [string | null, string];
    const partitionRows = realized.filter((row) =>
      row.tradeCurrency === currency && row.tradingTimezone === tradingTimezone);
    const outcomeRows = query.outcomes.length === 0
      ? partitionRows
      : partitionRows.filter((row) => {
          const selectedOutcome = selectedBasisOutcome(row, query);
          return selectedOutcome !== null && query.outcomes.includes(selectedOutcome);
        });
    const netRows = outcomeRows.filter((row) => row.netPnlDecimal !== null);
    const basisRows = query.moneyBasis === "gross" ? outcomeRows : netRows;
    const partitionOpen = open.filter((row) => {
      const account = accountById.get(row.accountId);
      return row.tradeCurrency === currency &&
        account?.tradingTimezone === tradingTimezone;
    });
    const partitionDecisions = decisions.filter((row) => {
      const account = accountById.get(row.accountId);
      return row.tradeCurrency === currency &&
        account?.tradingTimezone === tradingTimezone;
    });
    const partitionUnavailable = unavailable.filter((row) =>
      row.tradeCurrency === currency && row.tradingTimezone === tradingTimezone);
    const feeIncomplete = outcomeRows.filter((row) =>
      row.netPnlDecimal === null);
    const reasonCounts: Record<string, number> = {};
    for (const row of partitionDecisions) {
      incrementReason(
        reasonCounts,
        row.coverageReasonCode ?? "needs_decision",
      );
    }
    for (const row of partitionUnavailable) {
      incrementReason(reasonCounts, row.reasonCode);
    }
    for (const row of feeIncomplete) {
      for (const reason of row.chargeUnavailableReasonCodes) {
        incrementReason(reasonCounts, reason);
      }
    }
    const limitations: string[] = [];
    const excludedCount = exactScopeCoverage ? excludedScopeCount : 0;
    const sourceUnsupported = exactScopeCoverage
      ? unsupportedSourceScopeCount
      : 0;
    if (!exactScopeCoverage && excludedScopeCount > 0) {
      limitations.push("excluded_execution_scope_not_attributable");
    }
    if (!exactScopeCoverage && unsupportedSourceScopeCount > 0) {
      limitations.push("unsupported_source_scope_not_attributable");
    }
    if (excludedCount > 0) {
      incrementReason(reasonCounts, "excluded_by_trader", excludedCount);
    }
    if (sourceUnsupported > 0) {
      incrementReason(
        reasonCounts,
        "unsupported_source_record",
        sourceUnsupported,
      );
    }
    const candidateCount = partitionRows.length + partitionOpen.length +
      partitionDecisions.length + partitionUnavailable.length;
    const unavailableCount = partitionUnavailable.length +
      (query.moneyBasis === "net" ? feeIncomplete.length : 0);
    const partial = partitionOpen.length > 0 || partitionDecisions.length > 0 ||
      partitionUnavailable.length > 0 || excludedCount > 0 ||
      sourceUnsupported > 0 || feeIncomplete.length > 0 ||
      limitations.length > 0;
    const state = candidateCount === 0
      ? "empty" as const
      : basisRows.length === 0 && unavailableCount > 0
        ? "unavailable" as const
        : partial
          ? "partial" as const
          : "complete" as const;
    const coverage: JournalAnalyticsCoverage = Object.freeze({
      state,
      candidateCount,
      includedCount: basisRows.length,
      excludedCount,
      readyClosedCount: partitionRows.length + partitionUnavailable.length,
      legitimateOpenCount: partitionOpen.length,
      needsDecisionCount: partitionDecisions.length,
      unsupportedCount: partitionUnavailable.length + sourceUnsupported,
      feeCompleteCount: netRows.length,
      feeIncompleteCount: feeIncomplete.length,
      unavailableCount,
      reasonCounts: Object.freeze(Object.fromEntries(
        Object.entries(reasonCounts).sort(([left], [right]) =>
          left.localeCompare(right)),
      )),
    });
    return Object.freeze({
      partitionKey: key,
      currency,
      tradingTimezone,
      factSetRevisionSha256: normalized.factSetRevisionSha256,
      grossRows: Object.freeze(outcomeRows),
      netRows: Object.freeze(netRows),
      basisRows: Object.freeze(basisRows),
      coverage,
      limitations: Object.freeze(limitations.sort()),
    });
  }));
}
