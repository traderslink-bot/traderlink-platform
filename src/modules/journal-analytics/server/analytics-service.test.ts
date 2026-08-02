import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION } from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import type { JournalAnalyticsQuery } from "../contracts/analytics-query";
import { JOURNAL_ANALYTICS_QUERY_VERSION } from "../contracts/analytics-query";
import { accumulateJournalAnalyticsMetrics } from "./analytics-accumulator";
import { groupJournalAnalyticsPopulation } from "./analytics-grouping";
import {
  buildJournalAnalyticsPopulations,
  requireJournalAnalyticsQuery,
} from "./analytics-population";
import { calculateJournalAnalyticsResponse } from "./analytics-service";
import type {
  JournalAnalyticsUnavailableRoundTrip,
  NormalizedJournalAnalyticsRow,
  NormalizedJournalAnalyticsSet,
} from "./normalize-journal-analytics-facts";
import { JOURNAL_ANALYTICS_NORMALIZATION_VERSION } from "./normalize-journal-analytics-facts";

const accountId = "00000000-0000-4000-8000-000000000001";
const instrumentA = "00000000-0000-4000-8000-000000000010";
const instrumentB = "00000000-0000-4000-8000-000000000011";

function coverage(excluded = 2, unsupported = 3) {
  return Object.freeze({
    workspaceId: "workspace",
    accountId,
    accountScope: Object.freeze({ baseCurrency: "USD", tradingTimezone: "America/New_York" }),
    sourceRecords: Object.freeze({ total: unsupported, byClassification: Object.freeze({ unsupported }) }),
    imports: Object.freeze({ total: 1, byState: Object.freeze({ accepted: 1 }) }),
    executions: Object.freeze({ total: excluded, byState: Object.freeze({ excluded_by_trader: excluded }) }),
    decisions: Object.freeze({ total: 0, byState: Object.freeze({}), pendingByReason: Object.freeze({}), resolvedByAction: Object.freeze({}), acceptedSourceLimitationsByIssue: Object.freeze({}) }),
    roundTrips: Object.freeze({ activeTotal: 0, byProjectionState: Object.freeze({}), affectedChainCount: 0, unaffectedChainCount: 0 }),
    positionFacts: Object.freeze({ currentTotal: 0, byKind: Object.freeze({}) }),
    coverageIntervals: Object.freeze({ total: 0, byKind: Object.freeze({}), accountTimezoneCompatibleCompleteCount: 0, accountTimezoneMismatchCount: 0, overlappingCompleteIntervalCount: 0, completeCoverageGapCount: 0, earliestLocalDate: null, latestLocalDate: null }),
    unsupportedSourceRecords: Object.freeze({ total: unsupported, byAssetCategory: Object.freeze({ forex: unsupported }) }),
    rebuilds: Object.freeze({ latestByChain: Object.freeze([]), freshness: "unavailable" as const }),
  });
}

function local(
  date: string,
  weekday: NormalizedJournalAnalyticsRow["entryLocal"]["weekday"],
  bucket: string,
) {
  const [hour, minute] = bucket.split(":").map(Number);
  return Object.freeze({
    localDate: date,
    weekday,
    hour,
    minute,
    bucket30Minute: bucket,
  });
}

function normalizedRow(
  sequence: number,
  input: Readonly<{
    gross: string;
    net: string | null;
    date: string;
    weekday: NormalizedJournalAnalyticsRow["entryLocal"]["weekday"];
    bucket: string;
    instrumentId: string;
    symbol: string;
    currency?: string;
    timezone?: string;
  }>,
): NormalizedJournalAnalyticsRow {
  const grossComparison = Number(input.gross);
  const netComparison = input.net === null ? null : Number(input.net);
  return Object.freeze({
    roundTripId: `trade-${sequence}`,
    roundTripVersionId: `trade-version-${sequence}`,
    accountId,
    instrumentId: input.instrumentId,
    displayedSymbol: input.symbol,
    tradeCurrency: input.currency ?? "USD",
    tradingTimezone: input.timezone ?? "America/New_York",
    direction: sequence % 2 === 0 ? "short" : "long",
    openedAtUtc: `2026-01-0${sequence}T14:30:00.000Z`,
    closedAtUtc: `2026-01-0${sequence}T15:00:00.000Z`,
    entryLocal: local(input.date, input.weekday, input.bucket),
    closeLocal: local(input.date, input.weekday, input.bucket),
    holdingDurationMilliseconds: 1_800_000,
    isOvernight: false,
    uniqueExecutionCount: 2,
    allocationCount: 2,
    provenanceGroup: "broker_only",
    hasOverlapEvidence: false,
    grossPnlDecimal: input.gross,
    grossOutcome: grossComparison > 0 ? "win" : grossComparison < 0 ? "loss" : "flat",
    chargeCoverage: input.net === null ? "unavailable" : "complete",
    chargeUnavailableReasonCodes: input.net === null
      ? Object.freeze(["fee_not_reported"])
      : Object.freeze([]),
    chargeCostDecimal: input.net === null ? null : "1",
    chargeCreditDecimal: input.net === null ? null : "0",
    netPnlDecimal: input.net,
    netOutcome: netComparison === null
      ? null
      : netComparison > 0
        ? "win"
        : netComparison < 0
          ? "loss"
          : "flat",
    enteredQuantityDecimal: "10",
    maximumPositionQuantityDecimal: "10",
    entryNotionalDecimal: "100",
    exitNotionalDecimal: "100",
  });
}

function stateRoundTrip(
  id: string,
  state: "legitimate_open" | "needs_decision",
): JournalAnalyticsRoundTripFact {
  return Object.freeze({
    roundTripId: id,
    roundTripVersionId: `${id}-version`,
    versionNumber: 1,
    accountId,
    instrumentId: instrumentA,
    displayedSymbol: "AAA",
    assetClass: "stock",
    tradeCurrency: "USD",
    direction: "long",
    openedAtUtc: "2026-01-01T14:30:00.000Z",
    closedAtUtc: null,
    finalPositionDecimal: "1",
    projectionState: state,
    coverageReasonCode: state === "needs_decision" ? "review_required" : null,
    projectionFingerprintSha256: "a".repeat(64),
    rebuild: Object.freeze({
      rebuildId: `${id}-rebuild`,
      chainKeySha256: "b".repeat(64),
      algorithmVersion: "test-v1",
      orderedInputSha256: "c".repeat(64),
      outputSha256: "d".repeat(64),
      coverageState: "complete",
      readyClosedCount: 0,
      legitimateOpenCount: state === "legitimate_open" ? 1 : 0,
      needsDecisionCount: state === "needs_decision" ? 1 : 0,
      excludedCount: 0,
      completedAtUtc: "2026-08-01T12:00:00.000Z",
    }),
    allocations: Object.freeze([]),
    pendingDecisionIds: Object.freeze([]),
    pendingDecisionReasonCodes: Object.freeze([]),
  });
}

function normalizedSet(
  rows: readonly NormalizedJournalAnalyticsRow[] = [
    normalizedRow(1, { gross: "10", net: "8", date: "2026-01-05", weekday: "monday", bucket: "09:30", instrumentId: instrumentA, symbol: "AAA" }),
    normalizedRow(2, { gross: "-4", net: "-5", date: "2026-01-05", weekday: "monday", bucket: "10:00", instrumentId: instrumentA, symbol: "AAA" }),
    normalizedRow(3, { gross: "0", net: null, date: "2026-01-06", weekday: "tuesday", bucket: "10:30", instrumentId: instrumentB, symbol: "BBB" }),
    normalizedRow(4, { gross: "6", net: "5", date: "2026-01-06", weekday: "tuesday", bucket: "09:30", instrumentId: instrumentB, symbol: "BBB" }),
  ],
): NormalizedJournalAnalyticsSet {
  const unavailable: JournalAnalyticsUnavailableRoundTrip = Object.freeze({
    roundTripId: "option",
    accountId,
    instrumentId: instrumentB,
    displayedSymbol: "OPT",
    tradeCurrency: "USD",
    tradingTimezone: "America/New_York",
    direction: "long",
    openedAtUtc: "2026-01-05T14:30:00.000Z",
    closedAtUtc: "2026-01-05T15:00:00.000Z",
    provenanceGroup: "broker_only",
    projectionState: "ready_closed",
    reasonCode: "instrument_value_convention_missing",
  });
  return Object.freeze({
    normalizationVersion: JOURNAL_ANALYTICS_NORMALIZATION_VERSION,
    factSetRevisionSha256: "e".repeat(64),
    normalizationDigestSha256: "f".repeat(64),
    accounts: Object.freeze([Object.freeze({
      accountId,
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
      earliestAvailableLocalDate: null,
      latestAvailableLocalDate: null,
      coverage: coverage(),
    })]),
    realizedRows: Object.freeze([...rows]),
    legitimateOpenRoundTrips: Object.freeze([stateRoundTrip("open", "legitimate_open")]),
    needsDecisionRoundTrips: Object.freeze([
      stateRoundTrip("decision-1", "needs_decision"),
      stateRoundTrip("decision-2", "needs_decision"),
    ]),
    unavailableRoundTrips: Object.freeze([unavailable]),
  });
}

const allMetricIds = Object.freeze([
  "candidate_count",
  "included_count",
  "excluded_count",
  "total_trades",
  "win_count",
  "loss_count",
  "flat_count",
  "win_rate",
  "loss_rate",
  "flat_rate",
  "gross_profit",
  "gross_loss",
  "gross_pnl",
  "net_pnl",
  "average_gross_pnl",
  "median_gross_pnl",
  "average_pnl",
  "median_pnl",
  "best_trade",
  "worst_trade",
  "profit_factor",
  "expectancy",
]);

function query(
  overrides: Partial<JournalAnalyticsQuery> = {},
): JournalAnalyticsQuery {
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([accountId]),
    metricIds: allMetricIds,
    moneyBasis: "gross" as const,
    closingDateRange: Object.freeze({ kind: "all_available" as const }),
    currency: null,
    instrumentIds: Object.freeze([]),
    symbols: Object.freeze([]),
    directions: Object.freeze([]),
    provenance: Object.freeze([]),
    outcomes: Object.freeze([]),
    groupings: Object.freeze([
      "total",
      "closing_day",
      "instrument",
      "entry_time_bucket",
    ] as const),
    entryTimeBucketMinutes: 30 as const,
    asOfUtc: "2026-08-01T12:00:00.000Z",
    table: Object.freeze({ pageSize: 100, afterCursor: null }),
    ...overrides,
  });
}

function value(
  metrics: ReturnType<typeof accumulateJournalAnalyticsMetrics>,
  metricId: string,
) {
  return metrics.find((metric) => metric.metricId === metricId)?.value;
}

describe("Journal Analytics population, accumulation and grouping", () => {
  it("builds explicit coverage without hiding open or decision rows", () => {
    const populations = buildJournalAnalyticsPopulations(normalizedSet(), query());
    expect(populations).toHaveLength(1);
    expect(populations[0]?.coverage).toMatchObject({
      state: "partial",
      candidateCount: 8,
      includedCount: 4,
      excludedCount: 2,
      readyClosedCount: 5,
      legitimateOpenCount: 1,
      needsDecisionCount: 2,
      unsupportedCount: 4,
      feeCompleteCount: 3,
      feeIncompleteCount: 1,
    });
    expect(populations[0]?.coverage.reasonCounts).toMatchObject({
      excluded_by_trader: 2,
      fee_not_reported: 1,
      instrument_value_convention_missing: 1,
      review_required: 2,
      unsupported_source_record: 3,
    });
  });

  it("calculates the first gross metric slice exactly", () => {
    const population = buildJournalAnalyticsPopulations(normalizedSet(), query())[0];
    const metrics = accumulateJournalAnalyticsMetrics(
      population,
      allMetricIds,
      "gross",
    );
    expect(value(metrics, "total_trades")).toEqual({ kind: "integer", value: 4 });
    expect(value(metrics, "win_count")).toEqual({ kind: "integer", value: 2 });
    expect(value(metrics, "loss_count")).toEqual({ kind: "integer", value: 1 });
    expect(value(metrics, "flat_count")).toEqual({ kind: "integer", value: 1 });
    expect(value(metrics, "gross_profit")).toEqual({ kind: "decimal", valueDecimal: "16" });
    expect(value(metrics, "gross_loss")).toEqual({ kind: "decimal", valueDecimal: "-4" });
    expect(value(metrics, "gross_pnl")).toEqual({ kind: "decimal", valueDecimal: "12" });
    expect(value(metrics, "average_pnl")).toMatchObject({ roundedDecimal: "3" });
    expect(value(metrics, "median_pnl")).toMatchObject({ roundedDecimal: "3" });
    expect(value(metrics, "profit_factor")).toMatchObject({ roundedDecimal: "4" });
    expect(value(metrics, "win_rate")).toMatchObject({ roundedDecimal: "50" });
    expect(value(metrics, "loss_rate")).toMatchObject({ roundedDecimal: "25" });
    expect(value(metrics, "flat_rate")).toMatchObject({ roundedDecimal: "25" });
  });

  it("keeps tied extrema deterministic and reports a missing loss denominator", () => {
    const tiedRows = [
      normalizedRow(1, { gross: "5", net: "4", date: "2026-01-05", weekday: "monday", bucket: "09:30", instrumentId: instrumentA, symbol: "AAA" }),
      normalizedRow(2, { gross: "5", net: "4", date: "2026-01-05", weekday: "monday", bucket: "10:00", instrumentId: instrumentA, symbol: "AAA" }),
      normalizedRow(3, { gross: "0", net: "0", date: "2026-01-06", weekday: "tuesday", bucket: "10:30", instrumentId: instrumentB, symbol: "BBB" }),
    ];
    const metricIds = Object.freeze([
      "best_trade",
      "worst_trade",
      "profit_factor",
    ]);
    const forward = accumulateJournalAnalyticsMetrics(
      buildJournalAnalyticsPopulations(normalizedSet(tiedRows), query())[0],
      metricIds,
      "gross",
    );
    const reversed = accumulateJournalAnalyticsMetrics(
      buildJournalAnalyticsPopulations(
        normalizedSet([...tiedRows].reverse()),
        query(),
      )[0],
      metricIds,
      "gross",
    );
    expect(value(forward, "best_trade")).toEqual({
      kind: "decimal",
      valueDecimal: "5",
    });
    expect(value(forward, "worst_trade")).toEqual({
      kind: "decimal",
      valueDecimal: "0",
    });
    expect(forward.find((metric) => metric.metricId === "profit_factor"))
      .toMatchObject({
        state: "unavailable",
        value: null,
        limitationReasonCodes: ["gross_loss_denominator_missing"],
      });
    expect(forward.map((metric) => metric.resultDigestSha256)).toEqual(
      reversed.map((metric) => metric.resultDigestSha256),
    );
  });

  it("labels net metrics partial and calculates only fee-covered trades", () => {
    const netQuery = query({ moneyBasis: "net" });
    const population = buildJournalAnalyticsPopulations(
      normalizedSet(),
      netQuery,
    )[0];
    const metrics = accumulateJournalAnalyticsMetrics(
      population,
      allMetricIds,
      "net",
    );
    expect(value(metrics, "included_count")).toEqual({ kind: "integer", value: 3 });
    expect(value(metrics, "net_pnl")).toEqual({ kind: "decimal", valueDecimal: "8" });
    expect(value(metrics, "average_pnl")).toMatchObject({ roundedDecimal: "2.67" });
    expect(value(metrics, "median_pnl")).toMatchObject({ roundedDecimal: "5" });
    expect(value(metrics, "profit_factor")).toMatchObject({ roundedDecimal: "2.6" });
    expect(metrics.find((metric) => metric.metricId === "net_pnl")).toMatchObject({
      state: "partial",
      limitationReasonCodes: ["fee_coverage_partial"],
    });
  });

  it("reconciles daily, ticker and 30-minute groups to one population", () => {
    const population = buildJournalAnalyticsPopulations(normalizedSet(), query())[0];
    const grouped = groupJournalAnalyticsPopulation(
      population,
      ["closing_day", "instrument", "entry_time_bucket"],
      ["total_trades", "gross_pnl"],
      "gross",
    );
    expect(grouped.reconciliation.status).toBe("reconciled");
    expect(grouped.groups.filter((group) => group.grouping === "closing_day"))
      .toHaveLength(2);
    expect(grouped.groups.filter((group) => group.grouping === "instrument"))
      .toHaveLength(2);
    expect(grouped.groups.filter((group) => group.grouping === "entry_time_bucket"))
      .toHaveLength(3);
    const dayValues = grouped.groups
      .filter((group) => group.grouping === "closing_day")
      .map((group) => value(group.metrics, "gross_pnl"));
    expect(dayValues).toEqual([
      { kind: "decimal", valueDecimal: "6" },
      { kind: "decimal", valueDecimal: "6" },
    ]);
  });

  it("partitions money/time results when currencies or timezones differ", () => {
    const rows = [
      ...normalizedSet().realizedRows,
      normalizedRow(5, {
        gross: "2",
        net: "1",
        date: "2026-01-07",
        weekday: "wednesday",
        bucket: "09:30",
        instrumentId: instrumentA,
        symbol: "AAA",
        currency: "CAD",
        timezone: "America/Toronto",
      }),
    ];
    const populations = buildJournalAnalyticsPopulations(
      normalizedSet(rows),
      query(),
    );
    expect(populations).toHaveLength(2);
    expect(populations.map((population) => population.currency)).toEqual([
      "CAD",
      "USD",
    ]);
    expect(populations.every((population) =>
      population.limitations.includes("excluded_execution_scope_not_attributable")))
      .toBe(true);
  });

  it("returns an honest empty partition and rejects unknown query contracts", () => {
    const nonEmptyFixture = normalizedSet([]);
    const empty: NormalizedJournalAnalyticsSet = Object.freeze({
      ...nonEmptyFixture,
      realizedRows: Object.freeze([]),
      legitimateOpenRoundTrips: Object.freeze([]),
      needsDecisionRoundTrips: Object.freeze([]),
      unavailableRoundTrips: Object.freeze([]),
    });
    const populations = buildJournalAnalyticsPopulations(empty, query());
    expect(populations).toHaveLength(1);
    expect(populations[0]).toMatchObject({ currency: null });
    expect(populations[0]?.coverage.state).toBe("empty");
    expect(() => requireJournalAnalyticsQuery(empty, query({
      metricIds: Object.freeze(["unknown_metric"]),
    }))).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(() => requireJournalAnalyticsQuery(empty, query({
      accountIds: Object.freeze(["00000000-0000-4000-8000-999999999999"]),
    }))).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  });
});

function factAllocation(input: Readonly<{
  id: string;
  sequence: number;
  role: JournalAnalyticsAllocationFact["allocationRole"];
  side: "buy" | "sell";
  quantity: string;
  price: string;
  fee: string;
  atUtc: string;
}>): JournalAnalyticsAllocationFact {
  return Object.freeze({
    allocationId: input.id,
    allocationSequence: input.sequence,
    allocationRole: input.role,
    executionId: `${input.id}-execution`,
    executionVersionId: `${input.id}-version`,
    executionState: "accepted",
    executedAtUtc: input.atUtc,
    sourceOrderKey: `${input.atUtc}|${input.id}`,
    side: input.side,
    allocatedQuantityDecimal: input.quantity,
    executionQuantityDecimal: input.quantity,
    priceDecimal: input.price,
    feesDecimal: input.fee,
    feeCurrency: "USD",
    feeSignConvention: "cash_effect",
    factCompleteness: "complete",
    provenanceKinds: Object.freeze(["manual"] as const),
    feePolicyCandidates: Object.freeze([]),
  });
}

function factReadyRoundTrip(
  id: string,
  symbol: string,
  date: string,
  buyPrice: string,
  sellPrice: string,
): JournalAnalyticsRoundTripFact {
  return Object.freeze({
    roundTripId: id,
    roundTripVersionId: `${id}-version`,
    versionNumber: 1,
    accountId,
    instrumentId: symbol === "AAA" ? instrumentA : instrumentB,
    displayedSymbol: symbol,
    assetClass: "stock",
    tradeCurrency: "USD",
    direction: "long",
    openedAtUtc: `${date}T14:30:00.000Z`,
    closedAtUtc: `${date}T15:00:00.000Z`,
    finalPositionDecimal: "0",
    projectionState: "ready_closed",
    coverageReasonCode: null,
    projectionFingerprintSha256: "1".repeat(64),
    rebuild: Object.freeze({
      rebuildId: `${id}-rebuild`,
      chainKeySha256: "2".repeat(64),
      algorithmVersion: "test-v1",
      orderedInputSha256: "3".repeat(64),
      outputSha256: "4".repeat(64),
      coverageState: "complete",
      readyClosedCount: 1,
      legitimateOpenCount: 0,
      needsDecisionCount: 0,
      excludedCount: 0,
      completedAtUtc: "2026-08-01T12:00:00.000Z",
    }),
    allocations: Object.freeze([
      factAllocation({ id: `${id}-buy`, sequence: 1, role: "opening", side: "buy", quantity: "1", price: buyPrice, fee: "-0.1", atUtc: `${date}T14:30:00.000Z` }),
      factAllocation({ id: `${id}-sell`, sequence: 2, role: "closing", side: "sell", quantity: "1", price: sellPrice, fee: "-0.1", atUtc: `${date}T15:00:00.000Z` }),
    ]),
    pendingDecisionIds: Object.freeze([]),
    pendingDecisionReasonCodes: Object.freeze([]),
  });
}

function serviceFactSet(): JournalAnalyticsFactSet {
  return Object.freeze({
    contractVersion: JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION,
    workspaceId: "workspace",
    requestedAccountIds: Object.freeze([accountId]),
    requestedClosingDateRange: Object.freeze({ kind: "all_available" }),
    requestedCurrencySelection: Object.freeze({ kind: "all_partitions" }),
    generatedAtUtc: "2026-08-01T12:00:00.000Z",
    sourceRevisionSha256: "5".repeat(64),
    earliestAvailableLocalDate: null,
    latestAvailableLocalDate: null,
    accounts: Object.freeze([Object.freeze({
      accountId,
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
      earliestAvailableLocalDate: null,
      latestAvailableLocalDate: null,
      coverage: coverage(0, 0),
    })]),
    roundTrips: Object.freeze([
      factReadyRoundTrip("win", "AAA", "2026-01-05", "10", "12"),
      factReadyRoundTrip("loss", "BBB", "2026-01-06", "10", "9"),
      stateRoundTrip("open-service", "legitimate_open"),
      stateRoundTrip("decision-service", "needs_decision"),
    ]),
    pendingDecisions: Object.freeze([]),
  });
}

describe("Journal Analytics shared service", () => {
  it("uses one normalized path for totals, daily, ticker and timing groups", () => {
    const response = calculateJournalAnalyticsResponse(serviceFactSet(), query({
      metricIds: Object.freeze(["total_trades", "gross_pnl", "net_pnl"]),
    }));
    expect(response.partitions).toHaveLength(1);
    expect(response.crossPartitionCounts).toMatchObject({
      candidateCount: 4,
      includedCount: 2,
      readyClosedCount: 2,
      legitimateOpenCount: 1,
      needsDecisionCount: 1,
    });
    expect(value(response.partitions[0].metrics, "gross_pnl")).toEqual({
      kind: "decimal",
      valueDecimal: "1",
    });
    expect(value(response.partitions[0].metrics, "net_pnl")).toEqual({
      kind: "decimal",
      valueDecimal: "0.6",
    });
    expect(response.partitions[0].reconciliation.status).toBe("reconciled");
    expect(response.partitions[0].groups).toHaveLength(5);
    expect(response.partitions[0].metrics.every((metric) =>
      metric.factSetRevisionSha256 === response.factSetRevisionSha256)).toBe(true);
  });
});
