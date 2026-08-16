import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION } from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import type {
  JournalAnalyticsQuery,
  JournalAnalyticsTableSortField,
} from "../contracts/analytics-query";
import { JOURNAL_ANALYTICS_QUERY_VERSION } from "../contracts/analytics-query";
import { accumulateJournalAnalyticsMetrics } from "./analytics-accumulator";
import { sumExactDecimals } from "./exact-analytics-math";
import { groupJournalAnalyticsPopulation } from "./analytics-grouping";
import {
  buildJournalAnalyticsPopulations,
  requireJournalAnalyticsQuery,
} from "./analytics-population";
import {
  calculateJournalAnalyticsResponse,
  calculateJournalAnalyticsRoundTripTableResponse,
} from "./analytics-service";
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
    tradeClassification: "day_trade",
    isOvernight: false,
    uniqueExecutionCount: 2,
    uniqueExecutionIds: Object.freeze([
      `execution-${sequence}-1`,
      `execution-${sequence}-2`,
    ]),
    allocationCount: 2,
    allocationRoleCounts: Object.freeze({
      opening: 1,
      adding: 0,
      reducing: 0,
      closing: 1,
      flip_closing: 0,
      flip_opening: 0,
    }),
    provenanceGroup: "broker_only",
    provenanceKinds: Object.freeze(["broker"] as const),
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
    exitQuantityDecimal: "10",
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
    pendingDecisionFacts: Object.freeze([]),
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

  it("supports every accepted grouping without exposing internal account or instrument IDs", () => {
    const population = buildJournalAnalyticsPopulations(normalizedSet(), query())[0];
    const grouped = groupJournalAnalyticsPopulation(
      population,
      [
        "closing_day",
        "closing_iso_week",
        "closing_month",
        "closing_year",
        "entry_weekday",
        "entry_time_bucket",
        "instrument",
        "direction",
        "account",
        "provenance",
        "holding_duration_bucket",
        "entered_quantity_bucket",
        "maximum_position_bucket",
        "entry_notional_bucket",
        "realized_outcome",
      ],
      ["total_trades", "gross_pnl"],
      "gross",
      15,
    );
    expect(grouped.reconciliation.status).toBe("reconciled");
    expect(new Set(grouped.groups.map((group) => group.grouping)).size).toBe(15);
    const serialized = JSON.stringify(grouped);
    expect(serialized).not.toContain(accountId);
    expect(serialized).not.toContain(instrumentA);
    expect(serialized).not.toContain(instrumentB);
    expect(grouped.groups.find((group) => group.grouping === "account"))
      .toMatchObject({ groupKey: "account_1", label: "Account 1" });
  });

  it("uses ISO week-year boundaries rather than calendar-year labels", () => {
    const rows = [
      normalizedRow(1, { gross: "1", net: "1", date: "2025-12-29", weekday: "monday", bucket: "09:30", instrumentId: instrumentA, symbol: "AAA" }),
      normalizedRow(2, { gross: "1", net: "1", date: "2026-01-01", weekday: "thursday", bucket: "09:30", instrumentId: instrumentA, symbol: "AAA" }),
    ];
    const population = buildJournalAnalyticsPopulations(normalizedSet(rows), query())[0];
    const grouped = groupJournalAnalyticsPopulation(
      population,
      ["closing_iso_week"],
      ["total_trades", "gross_pnl"],
      "gross",
    );
    expect(grouped.groups).toHaveLength(1);
    expect(grouped.groups[0]).toMatchObject({
      groupKey: "2026-W01",
      label: "2026-W01",
    });
  });

  it("keeps grouped output digests stable when source row order changes", () => {
    const original = normalizedSet().realizedRows;
    const forwardPopulation = buildJournalAnalyticsPopulations(
      normalizedSet(original),
      query(),
    )[0];
    const reversePopulation = buildJournalAnalyticsPopulations(
      normalizedSet([...original].reverse()),
      query(),
    )[0];
    const collect = (population: typeof forwardPopulation) =>
      groupJournalAnalyticsPopulation(
        population,
        ["closing_day", "instrument"],
        ["total_trades", "gross_pnl"],
        "gross",
      ).groups.map((group) => Object.freeze({
        grouping: group.grouping,
        groupKey: group.groupKey,
        digests: group.metrics.map((metric) => metric.resultDigestSha256),
      }));
    expect(collect(forwardPopulation)).toEqual(collect(reversePopulation));
  });

  it("applies weekday, time, duration, quantity and notional filters together", () => {
    const populations = buildJournalAnalyticsPopulations(normalizedSet(), query({
      entryWeekdays: Object.freeze(["monday"]),
      entryTimeBuckets: Object.freeze(["09:30"]),
      holdingDurationRange: Object.freeze({
        minimumMillisecondsInclusive: 1_800_000,
        maximumMillisecondsInclusive: 1_800_000,
      }),
      enteredQuantityRange: Object.freeze({
        minimumInclusive: "10",
        maximumInclusive: "10",
      }),
      maximumPositionRange: Object.freeze({
        minimumInclusive: "10",
        maximumInclusive: "10",
      }),
      entryNotionalRange: Object.freeze({
        minimumInclusive: "100",
        maximumInclusive: "100",
      }),
    }));
    expect(populations).toHaveLength(1);
    expect(populations[0].grossRows.map((row) => row.roundTripId))
      .toEqual(["trade-1"]);
    expect(populations[0].coverage.legitimateOpenCount).toBe(0);
    expect(populations[0].coverage.needsDecisionCount).toBe(0);
  });

  it("applies every primary Trade Explorer population filter independently", () => {
    const ids = (overrides: Partial<JournalAnalyticsQuery>) =>
      buildJournalAnalyticsPopulations(normalizedSet(), query(overrides))[0]
        .basisRows.map((row) => row.roundTripId);

    expect(ids({
      closingDateRange: Object.freeze({
        kind: "inclusive_closing_date",
        startDate: "2026-01-06",
        endDate: "2026-01-06",
      }),
    })).toEqual(["trade-3", "trade-4"]);
    expect(ids({ symbols: Object.freeze(["AAA"]) }))
      .toEqual(["trade-1", "trade-2"]);
    expect(ids({ directions: Object.freeze(["short"]) }))
      .toEqual(["trade-2", "trade-4"]);
    expect(ids({ outcomes: Object.freeze(["win"]) }))
      .toEqual(["trade-1", "trade-4"]);
    expect(ids({ outcomes: Object.freeze(["loss"]) }))
      .toEqual(["trade-2"]);
    expect(ids({ outcomes: Object.freeze(["flat"]) }))
      .toEqual(["trade-3"]);
    expect(ids({
      moneyBasis: "net",
      outcomes: Object.freeze(["flat"]),
    })).toEqual([]);
  });

  it("applies trade type without attributing unclassified coverage rows", () => {
    const dayTrade = normalizedRow(1, {
      gross: "10",
      net: "8",
      date: "2026-01-05",
      weekday: "monday",
      bucket: "09:30",
      instrumentId: instrumentA,
      symbol: "AAA",
    });
    const multiDayTrade = Object.freeze({
      ...normalizedRow(2, {
        gross: "5",
        net: "4",
        date: "2026-01-06",
        weekday: "tuesday",
        bucket: "10:00",
        instrumentId: instrumentB,
        symbol: "BBB",
      }),
      roundTripId: "multi-day-trade",
      closeLocal: local("2026-01-07", "wednesday", "10:00"),
      tradeClassification: "multi_day_trade" as const,
      isOvernight: true,
    });
    const population = buildJournalAnalyticsPopulations(
      normalizedSet([dayTrade, multiDayTrade]),
      query({
        tradeClassifications: Object.freeze(["multi_day_trade"]),
      }),
    )[0];

    expect(population.basisRows.map((row) => row.roundTripId))
      .toEqual(["multi-day-trade"]);
    expect(population.coverage).toMatchObject({
      legitimateOpenCount: 0,
      needsDecisionCount: 0,
      unsupportedCount: 0,
    });
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
    expect(() => requireJournalAnalyticsQuery(empty, {
      ...query(),
      unknownFilter: true,
    } as JournalAnalyticsQuery)).toThrowError(
      "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",
    );
    expect(() => requireJournalAnalyticsQuery(empty, query({
      entryTimeBucketMinutes: 15,
      entryTimeBuckets: Object.freeze(["09:10"]),
    }))).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  });
});

function factAllocation(input: Readonly<{
  id: string;
  sequence: number;
  role: JournalAnalyticsAllocationFact["allocationRole"];
  side: "buy" | "sell";
  quantity: string;
  price: string;
  fee: string | null;
  feeCurrency?: string;
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
    feeCurrency: input.fee === null ? null : input.feeCurrency ?? "USD",
    feeSignConvention: input.fee === null ? "not_reported" : "cash_effect",
    factCompleteness: "complete",
    provenanceKinds: Object.freeze(["manual"] as const),
    feePolicyCandidates: Object.freeze([]),
  });
}

function factReadyRoundTrip(
  id: string,
  symbol: string,
  date: string,
  entryPrice: string,
  exitPrice: string,
  options: Readonly<{
    closingFee?: string | null;
    closedTime?: string;
    currency?: string;
    direction?: "long" | "short";
    openingFee?: string | null;
    openedTime?: string;
    quantity?: string;
  }> = {},
): JournalAnalyticsRoundTripFact {
  const closedTime = options.closedTime ?? "15:00";
  const currency = options.currency ?? "USD";
  const direction = options.direction ?? "long";
  const openedTime = options.openedTime ?? "14:30";
  const quantity = options.quantity ?? "1";
  const openingFee = options.openingFee === undefined ? "-0.1" : options.openingFee;
  const closingFee = options.closingFee === undefined ? "-0.1" : options.closingFee;
  return Object.freeze({
    roundTripId: id,
    roundTripVersionId: `${id}-version`,
    versionNumber: 1,
    accountId,
    instrumentId: symbol === "AAA" ? instrumentA : instrumentB,
    displayedSymbol: symbol,
    assetClass: "stock",
    tradeCurrency: currency,
    direction,
    openedAtUtc: `${date}T${openedTime}:00.000Z`,
    closedAtUtc: `${date}T${closedTime}:00.000Z`,
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
      factAllocation({ id: `${id}-open`, sequence: 1, role: "opening", side: direction === "long" ? "buy" : "sell", quantity, price: entryPrice, fee: openingFee, feeCurrency: currency, atUtc: `${date}T${openedTime}:00.000Z` }),
      factAllocation({ id: `${id}-close`, sequence: 2, role: "closing", side: direction === "long" ? "sell" : "buy", quantity, price: exitPrice, fee: closingFee, feeCurrency: currency, atUtc: `${date}T${closedTime}:00.000Z` }),
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

function orderingFactSet(): JournalAnalyticsFactSet {
  return Object.freeze({
    ...serviceFactSet(),
    roundTrips: Object.freeze([
      factReadyRoundTrip("order-a", "AAA", "2026-01-01", "10", "12"),
      factReadyRoundTrip("order-b", "BBB", "2026-01-02", "4", "5", {
        closedTime: "15:30",
        openedTime: "14:30",
        quantity: "5",
      }),
      factReadyRoundTrip("order-c", "AAA", "2026-01-03", "20", "15", {
        closedTime: "14:40",
        openedTime: "14:30",
        quantity: "2",
      }),
      factReadyRoundTrip("order-d", "BBB", "2026-01-04", "2", "2.5", {
        closedTime: "16:30",
        openedTime: "14:30",
        quantity: "3",
      }),
    ]),
  });
}

function selectedBasisFactSet(): JournalAnalyticsFactSet {
  return Object.freeze({
    ...serviceFactSet(),
    roundTrips: Object.freeze([
      factReadyRoundTrip("basis-a", "AAA", "2026-01-01", "10", "12", {
        closingFee: "-2.5",
        openingFee: "-2.5",
      }),
      factReadyRoundTrip("basis-b", "BBB", "2026-01-02", "10", "11"),
    ]),
  });
}

function directionFactSet(): JournalAnalyticsFactSet {
  return Object.freeze({
    ...serviceFactSet(),
    roundTrips: Object.freeze([
      factReadyRoundTrip("direction-long", "AAA", "2026-01-01", "10", "11"),
      factReadyRoundTrip("direction-short", "BBB", "2026-01-02", "10", "9", {
        direction: "short",
      }),
    ]),
  });
}

function partialFeeCoverageFactSet(): JournalAnalyticsFactSet {
  return Object.freeze({
    ...serviceFactSet(),
    roundTrips: Object.freeze([
      factReadyRoundTrip("fee-complete", "AAA", "2026-01-01", "10", "11"),
      factReadyRoundTrip("fee-missing", "BBB", "2026-01-02", "10", "12", {
        closingFee: null,
        openingFee: null,
      }),
    ]),
  });
}

function orderingEdgeFactSet(): JournalAnalyticsFactSet {
  return Object.freeze({
    ...serviceFactSet(),
    roundTrips: Object.freeze([
      factReadyRoundTrip("return-high", "AAA", "2026-01-01", "1", "2"),
      factReadyRoundTrip("return-low", "BBB", "2026-01-02", "100", "101"),
      factReadyRoundTrip("return-unavailable", "AAA", "2026-01-03", "0", "1"),
    ]),
  });
}

function multiCurrencyFactSet(): JournalAnalyticsFactSet {
  return Object.freeze({
    ...serviceFactSet(),
    roundTrips: Object.freeze([
      factReadyRoundTrip("currency-usd", "AAA", "2026-01-01", "10", "11"),
      factReadyRoundTrip("currency-cad", "BBB", "2026-01-02", "10", "12", {
        currency: "CAD",
      }),
    ]),
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

  it("paginates the full round-trip population with a stable private-safe cursor", () => {
    const factSet = serviceFactSet();
    const first = calculateJournalAnalyticsRoundTripTableResponse(factSet, query({
      table: Object.freeze({ pageSize: 1, afterCursor: null }),
    }));
    expect(first).toMatchObject({
      totalRowCount: 2,
      limitations: ["rows_bounded"],
    });
    expect(first.rows).toHaveLength(1);
    expect(first.continuationCursor).toMatch(/^[A-Za-z0-9_-]+$/u);
    const second = calculateJournalAnalyticsRoundTripTableResponse(factSet, query({
      table: Object.freeze({
        pageSize: 1,
        afterCursor: first.continuationCursor,
      }),
    }));
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0].roundTripId).not.toBe(first.rows[0].roundTripId);
    expect(second.continuationCursor).toBeNull();
    const serialized = JSON.stringify([first, second]);
    expect(serialized).not.toContain(accountId);
    expect(serialized).not.toContain(instrumentA);
    expect(serialized).not.toContain(instrumentB);
  });

  it("orders the complete trade population by every Trade Explorer row promise", () => {
    const factSet = orderingFactSet();
    const expected = Object.freeze({
      "closed_at:descending": ["order-d", "order-c", "order-b", "order-a"],
      "closed_at:ascending": ["order-a", "order-b", "order-c", "order-d"],
      "selected_pnl:descending": ["order-b", "order-a", "order-d", "order-c"],
      "selected_pnl:ascending": ["order-c", "order-d", "order-a", "order-b"],
      "return_percent:descending": ["order-d", "order-b", "order-a", "order-c"],
      "return_percent:ascending": ["order-c", "order-a", "order-d", "order-b"],
      "holding_duration:descending": ["order-d", "order-b", "order-a", "order-c"],
      "holding_duration:ascending": ["order-c", "order-a", "order-b", "order-d"],
      "entered_quantity:descending": ["order-b", "order-d", "order-c", "order-a"],
      "entered_quantity:ascending": ["order-a", "order-c", "order-d", "order-b"],
      "entry_notional:descending": ["order-c", "order-b", "order-a", "order-d"],
      "entry_notional:ascending": ["order-d", "order-a", "order-b", "order-c"],
    } as const);

    for (const [key, roundTripIds] of Object.entries(expected)) {
      const [field, direction] = key.split(":") as [
        JournalAnalyticsTableSortField,
        "ascending" | "descending",
      ];
      const response = calculateJournalAnalyticsRoundTripTableResponse(
        factSet,
        query({
          groupings: Object.freeze(["total"]),
          table: Object.freeze({ pageSize: 100, afterCursor: null }),
        }),
        Object.freeze({ field, direction }),
      );
      expect(response.rows.map((row) => row.roundTripId)).toEqual(roundTripIds);
    }
  });

  it("keeps custom trade ordering correct across bounded pages", () => {
    const factSet = orderingFactSet();
    const first = calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      query({
        groupings: Object.freeze(["total"]),
        table: Object.freeze({ pageSize: 2, afterCursor: null }),
      }),
      Object.freeze({ field: "selected_pnl", direction: "ascending" }),
    );
    const second = calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      query({
        groupings: Object.freeze(["total"]),
        table: Object.freeze({
          pageSize: 2,
          afterCursor: first.continuationCursor,
        }),
      }),
      Object.freeze({ field: "selected_pnl", direction: "ascending" }),
    );
    expect([...first.rows, ...second.rows].map((row) => row.roundTripId))
      .toEqual(["order-c", "order-d", "order-a", "order-b"]);
    expect(second.continuationCursor).toBeNull();
    expect(() => calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      query({
        groupings: Object.freeze(["total"]),
        table: Object.freeze({
          pageSize: 2,
          afterCursor: first.continuationCursor,
        }),
      }),
      Object.freeze({ field: "closed_at", direction: "descending" }),
    )).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(() => calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      query({
        directions: Object.freeze(["long"]),
        groupings: Object.freeze(["total"]),
        table: Object.freeze({
          pageSize: 2,
          afterCursor: first.continuationCursor,
        }),
      }),
      Object.freeze({ field: "selected_pnl", direction: "ascending" }),
    )).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(() => calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      query({
        tradeClassifications: Object.freeze(["day_trade"]),
        groupings: Object.freeze(["total"]),
        table: Object.freeze({
          pageSize: 2,
          afterCursor: first.continuationCursor,
        }),
      }),
      Object.freeze({ field: "selected_pnl", direction: "ascending" }),
    )).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(() => calculateJournalAnalyticsRoundTripTableResponse(
      Object.freeze({
        ...factSet,
        sourceRevisionSha256: "6".repeat(64),
      }),
      query({
        groupings: Object.freeze(["total"]),
        table: Object.freeze({
          pageSize: 2,
          afterCursor: first.continuationCursor,
        }),
      }),
      Object.freeze({ field: "selected_pnl", direction: "ascending" }),
    )).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  });

  it("uses the selected gross or net basis for P/L, return and Result promises", () => {
    const factSet = selectedBasisFactSet();
    const rows = (
      moneyBasis: "gross" | "net",
      field: "selected_pnl" | "return_percent",
      outcomes: JournalAnalyticsQuery["outcomes"] = Object.freeze([]),
    ) => calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      query({
        groupings: Object.freeze(["total"]),
        moneyBasis,
        outcomes,
        table: Object.freeze({ pageSize: 100, afterCursor: null }),
      }),
      Object.freeze({ field, direction: "descending" }),
    ).rows.map((row) => row.roundTripId);

    expect(rows("gross", "selected_pnl")).toEqual(["basis-a", "basis-b"]);
    expect(rows("net", "selected_pnl")).toEqual(["basis-b", "basis-a"]);
    expect(rows("gross", "return_percent")).toEqual(["basis-a", "basis-b"]);
    expect(rows("net", "return_percent")).toEqual(["basis-b", "basis-a"]);
    expect(rows("gross", "selected_pnl", Object.freeze(["win"])))
      .toEqual(["basis-a", "basis-b"]);
    expect(rows("net", "selected_pnl", Object.freeze(["win"])))
      .toEqual(["basis-b"]);
  });

  it("keeps the visible trade count and P/L summary reconciled with every Result basis", () => {
    const factSet = selectedBasisFactSet();
    for (const moneyBasis of ["gross", "net"] as const) {
      for (const outcomes of [
        Object.freeze([]),
        Object.freeze(["win"] as const),
        Object.freeze(["loss"] as const),
        Object.freeze(["flat"] as const),
      ]) {
        const selectedQuery = query({
          groupings: Object.freeze(["total"]),
          moneyBasis,
          outcomes,
          table: Object.freeze({ pageSize: 100, afterCursor: null }),
        });
        const overview = calculateJournalAnalyticsResponse(factSet, selectedQuery);
        const table = calculateJournalAnalyticsRoundTripTableResponse(
          factSet,
          selectedQuery,
        );
        const partition = overview.partitions[0];
        const totalTrades = partition.metrics.find((item) =>
          item.metricId === "total_trades");
        const selectedPnl = partition.metrics.find((item) =>
          item.metricId === (moneyBasis === "gross" ? "gross_pnl" : "net_pnl"));

        expect(totalTrades?.value).toEqual(Object.freeze({
          kind: "integer",
          value: table.totalRowCount,
        }));
        if (table.totalRowCount === 0) {
          expect(selectedPnl?.value).toEqual(Object.freeze({
            kind: "decimal",
            valueDecimal: "0",
          }));
        } else {
          expect(selectedPnl?.value).toEqual(Object.freeze({
            kind: "decimal",
            valueDecimal: sumExactDecimals(table.rows.map((row) =>
              row.selectedPnlDecimal!)),
          }));
        }
      }
    }
  });

  it("reports when Net P/L shows only the fee-covered closed trades", () => {
    const factSet = partialFeeCoverageFactSet();
    const grossQuery = query({
      groupings: Object.freeze(["total"]),
      moneyBasis: "gross",
      table: Object.freeze({ pageSize: 100, afterCursor: null }),
    });
    const netQuery = query({
      groupings: Object.freeze(["total"]),
      moneyBasis: "net",
      table: Object.freeze({ pageSize: 100, afterCursor: null }),
    });
    const grossTable = calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      grossQuery,
    );
    const netTable = calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      netQuery,
    );
    const netOverview = calculateJournalAnalyticsResponse(factSet, netQuery);
    const totalTrades = netOverview.partitions[0].metrics.find((item) =>
      item.metricId === "total_trades");

    expect(grossTable.totalRowCount).toBe(2);
    expect(netTable.totalRowCount).toBe(1);
    expect(netTable.rows.map((row) => row.roundTripId)).toEqual(["fee-complete"]);
    expect(netOverview.crossPartitionCounts.feeIncompleteCount).toBe(1);
    expect(totalTrades).toMatchObject({
      state: "partial",
      value: { kind: "integer", value: 1 },
      limitationReasonCodes: ["fee_coverage_partial"],
    });

    const netWins = calculateJournalAnalyticsResponse(factSet, query({
      groupings: Object.freeze(["total"]),
      moneyBasis: "net",
      outcomes: Object.freeze(["win"]),
      table: Object.freeze({ pageSize: 100, afterCursor: null }),
    }));
    expect(netWins.crossPartitionCounts.includedCount).toBe(1);
    expect(netWins.crossPartitionCounts.feeIncompleteCount).toBe(1);
    expect(netWins.partitions[0].metrics.find((item) =>
      item.metricId === "total_trades")).toMatchObject({
        state: "partial",
        value: { kind: "integer", value: 1 },
        limitationReasonCodes: ["fee_coverage_partial"],
      });

    const grossLosses = calculateJournalAnalyticsResponse(factSet, query({
      groupings: Object.freeze(["total"]),
      moneyBasis: "gross",
      outcomes: Object.freeze(["loss"]),
      table: Object.freeze({ pageSize: 100, afterCursor: null }),
    }));
    expect(grossLosses.crossPartitionCounts.includedCount).toBe(0);
    expect(grossLosses.crossPartitionCounts.feeIncompleteCount).toBe(0);
  });

  it("keeps unavailable returns last and resolves equal P/L deterministically", () => {
    const factSet = orderingEdgeFactSet();
    const orderedIds = (
      field: "selected_pnl" | "return_percent",
      direction: "ascending" | "descending",
    ) => calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      query({
        groupings: Object.freeze(["total"]),
        moneyBasis: "gross",
        table: Object.freeze({ pageSize: 100, afterCursor: null }),
      }),
      Object.freeze({ field, direction }),
    ).rows.map((row) => row.roundTripId);

    expect(orderedIds("selected_pnl", "ascending")).toEqual([
      "return-unavailable",
      "return-low",
      "return-high",
    ]);
    expect(orderedIds("selected_pnl", "descending")).toEqual([
      "return-unavailable",
      "return-low",
      "return-high",
    ]);
    expect(orderedIds("return_percent", "descending")).toEqual([
      "return-high",
      "return-low",
      "return-unavailable",
    ]);
    expect(orderedIds("return_percent", "ascending")).toEqual([
      "return-low",
      "return-high",
      "return-unavailable",
    ]);
  });

  it("keeps unlike currencies partitioned and requires one currency for trade rows", () => {
    const factSet = multiCurrencyFactSet();
    const allCurrenciesQuery = query({
      currency: null,
      groupings: Object.freeze(["instrument"]),
      moneyBasis: "gross",
      table: Object.freeze({ pageSize: 100, afterCursor: null }),
    });
    const response = calculateJournalAnalyticsResponse(
      factSet,
      allCurrenciesQuery,
    );

    expect(response.partitions.map((partition) => partition.currency)).toEqual([
      "CAD",
      "USD",
    ]);
    expect(response.limitations).toContain("money_partitioned_by_currency");
    expect(() => calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      allCurrenciesQuery,
    )).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");

    const cadTable = calculateJournalAnalyticsRoundTripTableResponse(
      factSet,
      query({
        currency: "CAD",
        groupings: Object.freeze(["instrument"]),
        moneyBasis: "gross",
        table: Object.freeze({ pageSize: 100, afterCursor: null }),
      }),
    );
    expect(cadTable.currency).toBe("CAD");
    expect(cadTable.rows.map((row) => row.roundTripId)).toEqual(["currency-cad"]);

    const losingResponse = calculateJournalAnalyticsResponse(
      factSet,
      query({
        currency: null,
        groupings: Object.freeze(["instrument"]),
        moneyBasis: "gross",
        outcomes: Object.freeze(["loss"]),
      }),
    );
    expect(losingResponse.crossPartitionCounts.readyClosedCount).toBe(2);
    expect(losingResponse.crossPartitionCounts.includedCount).toBe(0);
    expect(losingResponse.partitions.flatMap((partition) => partition.metrics)
      .filter((item) => item.metricId === "total_trades")
      .map((item) => item.value)).toEqual([
      { kind: "integer", value: 0 },
      { kind: "integer", value: 0 },
    ]);
  });

  it("includes both directions by default and narrows only on an explicit filter", () => {
    const factSet = directionFactSet();
    const rows = (directions: JournalAnalyticsQuery["directions"]) =>
      calculateJournalAnalyticsRoundTripTableResponse(
        factSet,
        query({
          directions,
          groupings: Object.freeze(["total"]),
          table: Object.freeze({ pageSize: 100, afterCursor: null }),
        }),
      ).rows.map((row) => row.roundTripId);

    expect(rows(Object.freeze([]))).toEqual([
      "direction-short",
      "direction-long",
    ]);
    expect(rows(Object.freeze(["long"]))).toEqual(["direction-long"]);
    expect(rows(Object.freeze(["short"]))).toEqual(["direction-short"]);
  });
});
