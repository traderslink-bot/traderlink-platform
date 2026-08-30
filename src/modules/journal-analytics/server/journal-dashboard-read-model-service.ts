import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalAnalyticsFactSetReader } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";

import type {
  JournalCalendarDayReadModel,
  JournalCalendarFilterInput,
  JournalCalendarReadModel,
  JournalCalendarTradeReadModel,
  JournalDashboardCoverage,
  JournalOpenPositionRow,
  JournalOpenPositionsReadModel,
  JournalTickerHistoryReadModel,
  JournalTickerHistoryRow,
  JournalTradingDayReadModel,
  JournalTradingDayExecutionActivity,
  JournalTradingDayPositionSnapshot,
  JournalTradingDayRoundTrip,
  JournalTradingDaySummary,
  JournalTradingDayTicker,
} from "../contracts/journal-dashboard-read-models";
import {
  absoluteExactDecimal,
  addExactDecimals,
  compareExactDecimals,
  divideExactDecimals,
  multiplyExactDecimals,
  percentageExactDecimals,
  subtractExactDecimals,
  sumExactDecimals,
} from "./exact-analytics-math";
import {
  journalAnalyticsLocalTimeFact,
  normalizeJournalAnalyticsFacts,
  type NormalizedJournalAnalyticsRow,
  type NormalizedJournalAnalyticsSet,
} from "./normalize-journal-analytics-facts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const INCREASING_ROLES = new Set<JournalAnalyticsAllocationFact["allocationRole"]>([
  "opening",
  "adding",
  "flip_opening",
]);

function activeAccountId(scope: WorkspaceAccessScope): string {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return accountId;
}

function assertDate(value: string, field: string): void {
  if (!DATE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

function sign(value: string | null): -1 | 0 | 1 | null {
  if (value === null) return null;
  const comparison = compareExactDecimals(value, "0");
  return comparison < 0 ? -1 : comparison > 0 ? 1 : 0;
}

function netTotal(
  rows: readonly NormalizedJournalAnalyticsRow[],
): string | null {
  return rows.every((row) => selectedPnl(row) !== null)
    ? sumExactDecimals(rows.map((row) => selectedPnl(row)!))
    : null;
}

function winRatePercent(
  rows: readonly NormalizedJournalAnalyticsRow[],
): string | null {
  const eligible = rows.map((row) => selectedPnl(row)).filter((value): value is string =>
    value !== null);
  if (eligible.length === 0) return null;
  return percentageExactDecimals(
    String(eligible.filter((value) => compareExactDecimals(value, "0") > 0).length),
    String(eligible.length),
  ).roundedDecimal;
}

function coverage(normalized: NormalizedJournalAnalyticsSet): JournalDashboardCoverage {
  const feeCompleteCount = normalized.realizedRows.filter((row) =>
    row.netPnlDecimal !== null).length;
  const reasons = new Set<string>();
  for (const row of normalized.needsDecisionRoundTrips) {
    reasons.add(row.coverageReasonCode ?? "needs_decision");
  }
  for (const row of normalized.unavailableRoundTrips) reasons.add(row.reasonCode);
  for (const row of normalized.realizedRows) {
    for (const reason of row.chargeUnavailableReasonCodes) reasons.add(reason);
  }
  return Object.freeze({
    readyClosedCount: normalized.realizedRows.length,
    legitimateOpenCount: normalized.legitimateOpenRoundTrips.length,
    needsDecisionCount: normalized.needsDecisionRoundTrips.length,
    feeCompleteCount,
    feeIncompleteCount: normalized.realizedRows.length - feeCompleteCount,
    limitationReasonCodes: Object.freeze([...reasons].sort()),
  });
}

function selectedPnl(row: NormalizedJournalAnalyticsRow): string | null {
  return row.netPnlDecimal ?? row.grossPnlDecimal;
}

function peakGiveback(rows: readonly NormalizedJournalAnalyticsRow[]): string | null {
  if (rows.some((row) => selectedPnl(row) === null)) return null;
  let cumulative = "0";
  let peak = "0";
  let maximum = "0";
  for (const row of [...rows].sort((left, right) =>
    left.closedAtUtc.localeCompare(right.closedAtUtc) ||
    left.roundTripId.localeCompare(right.roundTripId))) {
    cumulative = addExactDecimals(cumulative, selectedPnl(row)!);
    if (compareExactDecimals(cumulative, peak) > 0) peak = cumulative;
    const giveback = subtractExactDecimals(peak, cumulative);
    if (compareExactDecimals(giveback, maximum) > 0) {
      maximum = giveback;
    }
  }
  return maximum;
}

function dateShift(date: string, days: number): string {
  assertDate(date, "date");
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function weekBounds(date: string): Readonly<{ startDate: string; endDate: string }> {
  assertDate(date, "tradingDate");
  const selected = new Date(`${date}T12:00:00.000Z`);
  const weekday = selected.getUTCDay();
  const fromMonday = weekday === 0 ? 6 : weekday - 1;
  const startDate = dateShift(date, -fromMonday);
  return Object.freeze({ startDate, endDate: dateShift(startDate, 6) });
}

function averagePrice(
  allocations: readonly JournalAnalyticsAllocationFact[],
): string | null {
  const priced = allocations.filter((allocation) =>
    INCREASING_ROLES.has(allocation.allocationRole));
  if (priced.length === 0 || priced.some((allocation) => allocation.priceDecimal === null)) {
    return null;
  }
  const quantity = sumExactDecimals(priced.map((allocation) =>
    allocation.allocatedQuantityDecimal));
  if (compareExactDecimals(quantity, "0") === 0) return null;
  const notional = sumExactDecimals(priced.map((allocation) =>
    multiplyExactDecimals(
      allocation.allocatedQuantityDecimal,
      allocation.priceDecimal!,
    )));
  return divideExactDecimals(notional, quantity, {
    decimalPlaces: 4,
    roundingPolicy: "half_up_4dp",
  }).roundedDecimal;
}

function positionQuantity(
  allocations: readonly JournalAnalyticsAllocationFact[],
): string {
  return allocations.reduce((quantity, allocation) =>
    allocation.side === "buy"
      ? addExactDecimals(quantity, allocation.allocatedQuantityDecimal)
      : subtractExactDecimals(quantity, allocation.allocatedQuantityDecimal), "0");
}

type MutableTradingDayExecution = {
  executionId: string;
  executionVersionId: string;
  instrumentId: string;
  symbol: string;
  currency: string;
  executedAtUtc: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  projectionStates: Set<JournalAnalyticsRoundTripFact["projectionState"]>;
  roundTripIds: Set<string>;
  needsDecision: boolean;
};

function openPosition(
  factSet: JournalAnalyticsFactSet,
  roundTrip: JournalAnalyticsRoundTripFact,
  asOfUtc: string,
): JournalOpenPositionRow {
  const account = factSet.accounts.find((candidate) =>
    candidate.accountId === roundTrip.accountId);
  if (!account) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "dashboard_open_position_account",
    });
  }
  const ageMilliseconds = Date.parse(asOfUtc) - Date.parse(roundTrip.openedAtUtc);
  if (!Number.isSafeInteger(ageMilliseconds) || ageMilliseconds < 0) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "asOfUtc",
    });
  }
  return Object.freeze({
    roundTripId: roundTrip.roundTripId,
    instrumentId: roundTrip.instrumentId,
    symbol: roundTrip.displayedSymbol,
    currency: roundTrip.tradeCurrency,
    timezone: account.tradingTimezone,
    direction: roundTrip.direction,
    openedAtUtc: roundTrip.openedAtUtc,
    remainingQuantityDecimal: absoluteExactDecimal(roundTrip.finalPositionDecimal),
    averageEntryPriceDecimal: averagePrice(roundTrip.allocations),
    ageMilliseconds,
  });
}

function rowMatchesCalendar(
  row: NormalizedJournalAnalyticsRow,
  input: JournalCalendarFilterInput,
): boolean {
  return (input.startDate === null || row.closeLocal.localDate >= input.startDate) &&
    (input.endDate === null || row.closeLocal.localDate <= input.endDate) &&
    (input.symbol === null || row.displayedSymbol === input.symbol) &&
    (input.direction === null || row.direction === input.direction);
}

function dayMatchesCalendar(
  day: JournalCalendarDayReadModel,
  input: JournalCalendarFilterInput,
): boolean {
  if (input.performance === "profitable" && day.pnlSign !== 1) return false;
  if (input.performance === "losing" && day.pnlSign !== -1) return false;
  if (input.pnlBand !== null) {
    if (day.pnlDecimal === null) return false;
    if (input.pnlBand === "loss200" && compareExactDecimals(day.pnlDecimal, "-200") > 0) return false;
    if (input.pnlBand === "flat" && compareExactDecimals(absoluteExactDecimal(day.pnlDecimal), "200") > 0) return false;
    if (input.pnlBand === "profit200" && compareExactDecimals(day.pnlDecimal, "200") < 0) return false;
  }
  if (input.tradeCountBand === "1-3" && (day.tradeCount < 1 || day.tradeCount > 3)) return false;
  if (input.tradeCountBand === "4-6" && (day.tradeCount < 4 || day.tradeCount > 6)) return false;
  if (input.tradeCountBand === "7+" && day.tradeCount < 7) return false;
  return true;
}

function groupRowsByDate(
  rows: readonly NormalizedJournalAnalyticsRow[],
): ReadonlyMap<string, readonly NormalizedJournalAnalyticsRow[]> {
  const groups = new Map<string, NormalizedJournalAnalyticsRow[]>();
  for (const row of rows) {
    const group = groups.get(row.closeLocal.localDate) ?? [];
    group.push(row);
    groups.set(row.closeLocal.localDate, group);
  }
  return groups;
}

function calendarDay(
  date: string,
  rows: readonly NormalizedJournalAnalyticsRow[],
): JournalCalendarDayReadModel {
  const byInstrument = new Map<string, NormalizedJournalAnalyticsRow[]>();
  for (const row of rows) {
    const group = byInstrument.get(row.instrumentId) ?? [];
    group.push(row);
    byInstrument.set(row.instrumentId, group);
  }
  const tickers = [...byInstrument.entries()].map(([instrumentId, instrumentRows]) => {
    const pnlDecimal = netTotal(instrumentRows);
    return Object.freeze({
      instrumentId,
      symbol: instrumentRows[0].displayedSymbol,
      pnlDecimal,
      pnlSign: sign(pnlDecimal),
      noteCount: 0,
      ruleReviewCount: 0,
      tagCount: 0,
      trades: Object.freeze(instrumentRows
        .slice()
        .sort((left, right) => left.openedAtUtc.localeCompare(right.openedAtUtc))
        .map((row): JournalCalendarTradeReadModel => Object.freeze({
          roundTripId: row.roundTripId,
          executions: Object.freeze([]),
          notes: Object.freeze([]),
          pnlDecimal: selectedPnl(row),
          pnlSign: sign(selectedPnl(row)),
          tags: Object.freeze([]),
        }))),
    });
  }).sort((left, right) => {
    if (left.pnlDecimal === null) return right.pnlDecimal === null ?
      left.symbol.localeCompare(right.symbol) : 1;
    if (right.pnlDecimal === null) return -1;
    const magnitude = compareExactDecimals(
      absoluteExactDecimal(right.pnlDecimal),
      absoluteExactDecimal(left.pnlDecimal),
    );
    return magnitude || left.symbol.localeCompare(right.symbol);
  });
  const pnlDecimal = netTotal(rows);
  return Object.freeze({
    date,
    peakGivebackDecimal: peakGiveback(rows),
    pnlDecimal,
    pnlSign: sign(pnlDecimal),
    tickers: Object.freeze(tickers),
    tradeCount: rows.length,
    reviewStatus: null,
    winRatePercentDecimal: winRatePercent(rows),
  });
}

function tickerRows(
  normalized: NormalizedJournalAnalyticsSet,
): readonly JournalTickerHistoryRow[] {
  const groups = new Map<string, NormalizedJournalAnalyticsRow[]>();
  for (const row of normalized.realizedRows) {
    const key = JSON.stringify([row.instrumentId, row.tradeCurrency]);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return Object.freeze([...groups.values()].map((rows) => {
    const netPnlDecimal = netTotal(rows);
    return Object.freeze({
      instrumentId: rows[0].instrumentId,
      symbol: rows[0].displayedSymbol,
      currency: rows[0].tradeCurrency,
      tradingDayCount: new Set(rows.map((row) => row.closeLocal.localDate)).size,
      roundTripCount: rows.length,
      longCount: rows.filter((row) => row.direction === "long").length,
      shortCount: rows.filter((row) => row.direction === "short").length,
      netPnlDecimal,
      netPnlSign: sign(netPnlDecimal),
      winRatePercentDecimal: winRatePercent(rows),
    });
  }).sort((left, right) =>
    right.roundTripCount - left.roundTripCount || left.symbol.localeCompare(right.symbol)));
}

function roundTripPrices(row: NormalizedJournalAnalyticsRow): Readonly<{
  entryPriceDecimal: string | null;
  exitPriceDecimal: string | null;
  gainLossPercentDecimal: string | null;
}> {
  const entryPriceDecimal = compareExactDecimals(row.enteredQuantityDecimal, "0") === 0
    ? null
    : divideExactDecimals(row.entryNotionalDecimal, row.enteredQuantityDecimal, {
        decimalPlaces: 4,
        roundingPolicy: "half_up_4dp",
      }).roundedDecimal;
  const exitPriceDecimal = compareExactDecimals(row.exitQuantityDecimal, "0") === 0
    ? null
    : divideExactDecimals(row.exitNotionalDecimal, row.exitQuantityDecimal, {
        decimalPlaces: 4,
        roundingPolicy: "half_up_4dp",
      }).roundedDecimal;
  const pnlDecimal = selectedPnl(row);
  const gainLossPercentDecimal = pnlDecimal === null ||
      compareExactDecimals(row.entryNotionalDecimal, "0") === 0
    ? null
    : percentageExactDecimals(
        pnlDecimal,
        row.entryNotionalDecimal,
      ).roundedDecimal;
  return Object.freeze({
    entryPriceDecimal,
    exitPriceDecimal,
    gainLossPercentDecimal,
  });
}

function tradingDayRoundTrip(
  row: NormalizedJournalAnalyticsRow,
): JournalTradingDayRoundTrip {
  return Object.freeze({
    roundTripId: row.roundTripId,
    instrumentId: row.instrumentId,
    symbol: row.displayedSymbol,
    currency: row.tradeCurrency,
    timezone: row.tradingTimezone,
    direction: row.direction,
    entryAtUtc: row.openedAtUtc,
    exitAtUtc: row.closedAtUtc,
    ...roundTripPrices(row),
    netPnlDecimal: selectedPnl(row),
  });
}

function tradingDayTickers(
  rows: readonly NormalizedJournalAnalyticsRow[],
): readonly JournalTradingDayTicker[] {
  const groups = new Map<string, NormalizedJournalAnalyticsRow[]>();
  for (const row of rows) {
    const key = JSON.stringify([row.instrumentId, row.tradeCurrency]);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return Object.freeze([...groups.values()].map((group) => {
    const netPnlDecimal = netTotal(group);
    const totalEntryNotional = sumExactDecimals(group.map((row) =>
      row.entryNotionalDecimal));
    return Object.freeze({
      instrumentId: group[0].instrumentId,
      symbol: group[0].displayedSymbol,
      currency: group[0].tradeCurrency,
      netPnlDecimal,
      gainLossPercentDecimal: netPnlDecimal === null ||
          compareExactDecimals(totalEntryNotional, "0") === 0
        ? null
        : percentageExactDecimals(netPnlDecimal, totalEntryNotional).roundedDecimal,
      roundTrips: Object.freeze([...group]
        .sort((left, right) => left.openedAtUtc.localeCompare(right.openedAtUtc))
        .map(tradingDayRoundTrip)),
    });
  }).sort((left, right) => left.symbol.localeCompare(right.symbol)));
}

function allTradingDates(
  factSet: JournalAnalyticsFactSet,
  normalized: NormalizedJournalAnalyticsSet,
): readonly string[] {
  const timezoneByAccount = new Map(factSet.accounts.map((account) => [
    account.accountId,
    account.tradingTimezone,
  ]));
  const dates = new Set(normalized.realizedRows.map((row) =>
    row.closeLocal.localDate));
  for (const roundTrip of factSet.roundTrips) {
    const timezone = timezoneByAccount.get(roundTrip.accountId);
    if (!timezone) continue;
    for (const allocation of roundTrip.allocations) {
      dates.add(journalAnalyticsLocalTimeFact(
        allocation.executedAtUtc,
        timezone,
      ).localDate);
    }
  }
  return Object.freeze([...dates].sort());
}

function tradingDayExecutions(
  factSet: JournalAnalyticsFactSet,
  date: string,
  currency: string | null,
): readonly JournalTradingDayExecutionActivity[] {
  if (currency === null) return Object.freeze([]);
  const timezoneByAccount = new Map(factSet.accounts.map((account) => [
    account.accountId,
    account.tradingTimezone,
  ]));
  const grouped = new Map<string, MutableTradingDayExecution>();
  for (const roundTrip of factSet.roundTrips) {
    if (roundTrip.tradeCurrency !== currency) continue;
    const timezone = timezoneByAccount.get(roundTrip.accountId);
    if (!timezone) continue;
    for (const allocation of roundTrip.allocations) {
      if (journalAnalyticsLocalTimeFact(
        allocation.executedAtUtc,
        timezone,
      ).localDate !== date) continue;
      const key = JSON.stringify([
        roundTrip.accountId,
        allocation.executionVersionId,
      ]);
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, {
          executionId: allocation.executionId,
          executionVersionId: allocation.executionVersionId,
          instrumentId: roundTrip.instrumentId,
          symbol: roundTrip.displayedSymbol,
          currency: roundTrip.tradeCurrency,
          executedAtUtc: allocation.executedAtUtc,
          side: allocation.side,
          quantityDecimal: allocation.executionQuantityDecimal,
          priceDecimal: allocation.priceDecimal,
          projectionStates: new Set([roundTrip.projectionState]),
          roundTripIds: new Set([roundTrip.roundTripId]),
          needsDecision: allocation.executionState === "needs_decision" ||
            roundTrip.projectionState === "needs_decision",
        });
        continue;
      }
      if (
        current.executionId !== allocation.executionId ||
        current.instrumentId !== roundTrip.instrumentId ||
        current.symbol !== roundTrip.displayedSymbol ||
        current.currency !== roundTrip.tradeCurrency ||
        current.executedAtUtc !== allocation.executedAtUtc ||
        current.side !== allocation.side ||
        current.quantityDecimal !== allocation.executionQuantityDecimal ||
        current.priceDecimal !== allocation.priceDecimal
      ) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
          check: "dashboard_execution_fact_mismatch",
        });
      }
      current.projectionStates.add(roundTrip.projectionState);
      current.roundTripIds.add(roundTrip.roundTripId);
      current.needsDecision ||= allocation.executionState === "needs_decision" ||
        roundTrip.projectionState === "needs_decision";
    }
  }
  return Object.freeze([...grouped.values()].map((execution) => Object.freeze({
    executionId: execution.executionId,
    executionVersionId: execution.executionVersionId,
    instrumentId: execution.instrumentId,
    symbol: execution.symbol,
    currency: execution.currency,
    executedAtUtc: execution.executedAtUtc,
    side: execution.side,
    quantityDecimal: execution.quantityDecimal,
    priceDecimal: execution.priceDecimal,
    projectionStates: Object.freeze([...execution.projectionStates].sort()),
    roundTripIds: Object.freeze([...execution.roundTripIds].sort()),
    needsDecision: execution.needsDecision,
  })).sort((left, right) =>
    left.executedAtUtc.localeCompare(right.executedAtUtc) ||
    left.executionVersionId.localeCompare(right.executionVersionId)));
}

function tradingDayPositions(
  factSet: JournalAnalyticsFactSet,
  date: string,
  currency: string | null,
): readonly JournalTradingDayPositionSnapshot[] {
  if (currency === null) return Object.freeze([]);
  const timezoneByAccount = new Map(factSet.accounts.map((account) => [
    account.accountId,
    account.tradingTimezone,
  ]));
  return Object.freeze(factSet.roundTrips.flatMap((roundTrip) => {
    if (
      roundTrip.tradeCurrency !== currency ||
      roundTrip.projectionState === "needs_decision"
    ) return [];
    const timezone = timezoneByAccount.get(roundTrip.accountId);
    if (!timezone) return [];
    const datedAllocations = roundTrip.allocations.map((allocation) =>
      Object.freeze({
        allocation,
        localDate: journalAnalyticsLocalTimeFact(
          allocation.executedAtUtc,
          timezone,
        ).localDate,
      }));
    const openingQuantity = positionQuantity(datedAllocations
      .filter((item) => item.localDate < date)
      .map((item) => item.allocation));
    const allocationsAtClose = datedAllocations
      .filter((item) => item.localDate <= date)
      .map((item) => item.allocation);
    const closingQuantity = positionQuantity(allocationsAtClose);
    const opensAtStart = compareExactDecimals(openingQuantity, "0") !== 0;
    const opensAtClose = compareExactDecimals(closingQuantity, "0") !== 0;
    if (!opensAtStart && !opensAtClose) return [];
    return [Object.freeze({
      roundTripId: roundTrip.roundTripId,
      instrumentId: roundTrip.instrumentId,
      symbol: roundTrip.displayedSymbol,
      currency: roundTrip.tradeCurrency,
      timezone,
      direction: roundTrip.direction,
      openedAtUtc: roundTrip.openedAtUtc,
      openingQuantityDecimal: absoluteExactDecimal(openingQuantity),
      closingQuantityDecimal: absoluteExactDecimal(closingQuantity),
      averageEntryPriceDecimal: averagePrice(allocationsAtClose),
      state: !opensAtStart
        ? "opened_and_carried_out" as const
        : !opensAtClose
          ? "carried_in_and_closed" as const
          : "carried_through" as const,
    })];
  }).sort((left, right) => left.symbol.localeCompare(right.symbol) ||
    left.openedAtUtc.localeCompare(right.openedAtUtc)));
}

export class JournalDashboardReadModelService {
  constructor(
    private readonly facts: JournalAnalyticsFactSetReader,
    private readonly normalizeFacts: (factSet: JournalAnalyticsFactSet) =>
      NormalizedJournalAnalyticsSet = normalizeJournalAnalyticsFacts,
  ) {}

  private cachedRead: Readonly<{
    scopeKey: string;
    value: Readonly<{
      factSet: JournalAnalyticsFactSet;
      normalized: NormalizedJournalAnalyticsSet;
    }>;
  }> | null = null;

  private read(scope: WorkspaceAccessScope): Readonly<{
    factSet: JournalAnalyticsFactSet;
    normalized: NormalizedJournalAnalyticsSet;
  }> {
    const scopeKey = `${scope.workspaceId}:${activeAccountId(scope)}`;
    if (this.cachedRead?.scopeKey === scopeKey) return this.cachedRead.value;
    const factSet = this.facts.getJournalAnalyticsFactSet(scope, {
      accountIds: Object.freeze([activeAccountId(scope)]),
      closingDateRange: Object.freeze({ kind: "all_available" as const }),
      currencySelection: Object.freeze({ kind: "all_partitions" as const }),
    });
    const value = Object.freeze({
      factSet,
      normalized: this.normalizeFacts(factSet),
    });
    this.cachedRead = Object.freeze({ scopeKey, value });
    return value;
  }

  getCalendar(
    scope: WorkspaceAccessScope,
    input: JournalCalendarFilterInput,
  ): JournalCalendarReadModel {
    if (input.startDate !== null) assertDate(input.startDate, "startDate");
    if (input.endDate !== null) assertDate(input.endDate, "endDate");
    if (input.startDate && input.endDate && input.startDate > input.endDate) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "dateRange",
      });
    }
    const { factSet, normalized } = this.read(scope);
    const account = factSet.accounts[0] ?? null;
    const currencies = [...new Set(normalized.realizedRows.map((row) =>
      row.tradeCurrency))].sort();
    const requestedCurrencyUnavailable = input.currency !== null &&
      !currencies.includes(input.currency);
    const currency = input.currency !== null && !requestedCurrencyUnavailable
      ? input.currency
      : currencies[0] ?? null;
    const availableRows = currency === null
      ? []
      : normalized.realizedRows.filter((row) => row.tradeCurrency === currency);
    const symbols = Object.freeze([...new Set(availableRows.map((row) =>
      row.displayedSymbol))].sort());
    const filteredRows = availableRows.filter((row) =>
      rowMatchesCalendar(row, input));
    const days = Object.freeze([...groupRowsByDate(filteredRows).entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, rows]) => calendarDay(date, rows))
      .filter((day) => dayMatchesCalendar(day, input)));
    const dates = availableRows.map((row) => row.closeLocal.localDate).sort();
    const fallbackDate = factSet.latestAvailableLocalDate ??
      new Date().toISOString().slice(0, 10);
    const summaryRows = filteredRows.filter((row) =>
      days.some((day) => day.date === row.closeLocal.localDate));
    const summaryPnl = netTotal(summaryRows);
    const limitations = new Set(coverage(normalized).limitationReasonCodes);
    if (currencies.length > 1) limitations.add("money_partitioned_by_currency");
    if (requestedCurrencyUnavailable) {
      limitations.add("requested_currency_unavailable");
    }
    if (input.session !== null) limitations.add("market_session_fact_unavailable");
    const baseCoverage = coverage(normalized);
    return Object.freeze({
      state: input.session !== null || requestedCurrencyUnavailable
        ? "unavailable"
        : days.length > 0
          ? "ready"
          : "empty",
      currency,
      availableCurrencies: Object.freeze(currencies),
      timezone: account?.tradingTimezone ?? null,
      activeDate: days.at(-1)?.date ?? dates.at(-1) ?? fallbackDate,
      minimumDate: dates[0] ?? fallbackDate,
      maximumDate: dates.at(-1) ?? fallbackDate,
      days: input.session === null && !requestedCurrencyUnavailable
        ? days
        : Object.freeze([]),
      symbols,
      summary: Object.freeze({
        netPnlDecimal: input.session === null && !requestedCurrencyUnavailable
          ? summaryPnl
          : null,
        netPnlSign: input.session === null && !requestedCurrencyUnavailable
          ? sign(summaryPnl)
          : null,
        tradeCount: input.session === null && !requestedCurrencyUnavailable
          ? summaryRows.length
          : 0,
        tradingDayCount: input.session === null && !requestedCurrencyUnavailable
          ? days.length
          : 0,
        winRatePercentDecimal: input.session === null && !requestedCurrencyUnavailable
          ? winRatePercent(summaryRows)
          : null,
      }),
      coverage: Object.freeze({
        ...baseCoverage,
        limitationReasonCodes: Object.freeze([...limitations].sort()),
      }),
    });
  }

  getTickerHistory(scope: WorkspaceAccessScope): JournalTickerHistoryReadModel {
    const { factSet, normalized } = this.read(scope);
    return Object.freeze({
      rows: tickerRows(normalized),
      coverage: coverage(normalized),
      factSetRevisionSha256: factSet.sourceRevisionSha256,
    });
  }

  getOpenPositions(
    scope: WorkspaceAccessScope,
    asOfUtc = new Date().toISOString(),
  ): JournalOpenPositionsReadModel {
    if (!Number.isFinite(Date.parse(asOfUtc))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "asOfUtc",
      });
    }
    const { factSet, normalized } = this.read(scope);
    return Object.freeze({
      positions: Object.freeze(normalized.legitimateOpenRoundTrips
        .map((roundTrip) => openPosition(factSet, roundTrip, asOfUtc))
        .sort((left, right) => left.openedAtUtc.localeCompare(right.openedAtUtc) ||
          left.symbol.localeCompare(right.symbol))),
      decisions: Object.freeze(normalized.needsDecisionRoundTrips.map((roundTrip) =>
        Object.freeze({
          roundTripId: roundTrip.roundTripId,
          symbol: roundTrip.displayedSymbol,
          currency: roundTrip.tradeCurrency,
          direction: roundTrip.direction,
          openedAtUtc: roundTrip.openedAtUtc,
          reasonCodes: roundTrip.pendingDecisionReasonCodes,
        })).sort((left, right) =>
          left.openedAtUtc.localeCompare(right.openedAtUtc) ||
          left.symbol.localeCompare(right.symbol))),
      coverage: coverage(normalized),
      asOfUtc,
      factSetRevisionSha256: factSet.sourceRevisionSha256,
    });
  }

  getTradingDay(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      requestedDate: string | null;
      currency: string | null;
      asOfUtc?: string;
    }>,
  ): JournalTradingDayReadModel {
    const requestedDate = input.requestedDate;
    const asOfUtc = input.asOfUtc ?? new Date().toISOString();
    if (requestedDate !== null) assertDate(requestedDate, "tradingDate");
    const { factSet, normalized } = this.read(scope);
    const dates = allTradingDates(factSet, normalized);
    const date = requestedDate ?? dates.at(-1) ??
      factSet.latestAvailableLocalDate ?? new Date().toISOString().slice(0, 10);
    const previousTradingDate = dates.findLast((candidate) => candidate < date) ?? null;
    const nextTradingDate = dates.find((candidate) => candidate > date) ?? null;
    const dayRows = normalized.realizedRows.filter((row) =>
      row.closeLocal.localDate === date);
    const availableCurrencies = [...new Set(factSet.roundTrips.map((roundTrip) =>
      roundTrip.tradeCurrency))].sort();
    const requestedCurrencyUnavailable = input.currency !== null &&
      !availableCurrencies.includes(input.currency);
    const currency = input.currency !== null && !requestedCurrencyUnavailable
      ? input.currency
      : availableCurrencies[0] ?? null;
    const selectedRows = currency === null
      ? []
      : dayRows.filter((row) => row.tradeCurrency === currency);
    const account = factSet.accounts[0] ?? null;
    const decisionActivity = normalized.needsDecisionRoundTrips.flatMap((roundTrip) => {
      if (currency === null || roundTrip.tradeCurrency !== currency) return [];
      const timezone = factSet.accounts.find((candidate) =>
        candidate.accountId === roundTrip.accountId)?.tradingTimezone;
      if (!timezone) return [];
      const executionCountOnDate = roundTrip.allocations.filter((allocation) =>
        journalAnalyticsLocalTimeFact(
          allocation.executedAtUtc,
          timezone,
        ).localDate === date).length;
      const openedOnDate = journalAnalyticsLocalTimeFact(
        roundTrip.openedAtUtc,
        timezone,
      ).localDate === date;
      if (executionCountOnDate === 0 && !openedOnDate) return [];
      return [Object.freeze({
        roundTripId: roundTrip.roundTripId,
        symbol: roundTrip.displayedSymbol,
        currency: roundTrip.tradeCurrency,
        direction: roundTrip.direction,
        openedAtUtc: roundTrip.openedAtUtc,
        executionCountOnDate,
        reasonCodes: roundTrip.pendingDecisionReasonCodes,
      })];
    }).sort((left, right) => left.openedAtUtc.localeCompare(right.openedAtUtc) ||
      left.symbol.localeCompare(right.symbol));
    const bounds = weekBounds(date);
    const weekRows = normalized.realizedRows.filter((row) =>
      row.closeLocal.localDate >= bounds.startDate &&
      row.closeLocal.localDate <= bounds.endDate &&
      currency !== null && row.tradeCurrency === currency);
    const weekGroups = groupRowsByDate(weekRows);
    const weekDays: JournalTradingDaySummary[] = [...weekGroups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([tradingDate, rows]) => Object.freeze({
        date: tradingDate,
        currency,
        netPnlDecimal: netTotal(rows),
        tickerCount: new Set(rows.map((row) => row.instrumentId)).size,
        tradeCount: rows.length,
      }));
    const openPositions = normalized.legitimateOpenRoundTrips
      .filter((roundTrip) => {
        if (currency === null || roundTrip.tradeCurrency !== currency) return false;
        const timezone = factSet.accounts.find((candidate) =>
          candidate.accountId === roundTrip.accountId)?.tradingTimezone;
        return timezone !== undefined && journalAnalyticsLocalTimeFact(
          roundTrip.openedAtUtc,
          timezone,
        ).localDate <= date;
      })
      .map((roundTrip) => openPosition(factSet, roundTrip, asOfUtc));
    const executionActivity = tradingDayExecutions(factSet, date, currency);
    const positionSnapshots = tradingDayPositions(factSet, date, currency);
    return Object.freeze({
      state: selectedRows.length > 0 || openPositions.length > 0 ||
          decisionActivity.length > 0 || executionActivity.length > 0 ||
          positionSnapshots.length > 0
        ? "ready"
        : "empty",
      date,
      currency,
      availableCurrencies: Object.freeze(availableCurrencies),
      timezone: account?.tradingTimezone ?? null,
      netPnlDecimal: netTotal(selectedRows),
      decisionActivity: Object.freeze(decisionActivity),
      availableTradingDates: Object.freeze(dates),
      executionActivity,
      previousTradingDate,
      nextTradingDate,
      latestTradingDate: dates.at(-1) ?? null,
      tickers: tradingDayTickers(selectedRows),
      openPositions: Object.freeze(openPositions),
      positionSnapshots,
      week: Object.freeze({
        ...bounds,
        days: Object.freeze(weekDays),
        netPnlDecimal: netTotal(weekRows),
        tickerCount: new Set(weekRows.map((row) => row.instrumentId)).size,
        tradeCount: weekRows.length,
      }),
      coverage: Object.freeze({
        ...coverage(normalized),
        limitationReasonCodes: Object.freeze([
          ...new Set([
            ...coverage(normalized).limitationReasonCodes,
            ...(availableCurrencies.length > 1
              ? ["money_partitioned_by_currency"]
              : []),
            ...(requestedCurrencyUnavailable
              ? ["requested_currency_unavailable"]
              : []),
          ]),
        ].sort()),
      }),
      factSetRevisionSha256: factSet.sourceRevisionSha256,
    });
  }
}
