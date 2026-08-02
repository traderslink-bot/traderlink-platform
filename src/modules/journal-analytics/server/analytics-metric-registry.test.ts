import type { NormalizedJournalAnalyticsRow } from "./normalize-journal-analytics-facts";
import type { JournalAnalyticsPopulation } from "./analytics-population";
import { accumulateJournalAnalyticsMetrics } from "./analytics-accumulator";
import {
  JOURNAL_ANALYTICS_ADDITIONAL_CAPABILITY_IDS,
  JOURNAL_ANALYTICS_CAPABILITY_IDS,
  JOURNAL_ANALYTICS_LEGACY_MIGRATION_METRIC_IDS,
} from "./analytics-capability-manifest";
import { journalAnalyticsMetricRegistry } from "./analytics-metric-registry";

function row(
  sequence: number,
  grossPnlDecimal: string,
): NormalizedJournalAnalyticsRow {
  const comparison = Number(grossPnlDecimal);
  return Object.freeze({
    roundTripId: `round-trip-${sequence}`,
    roundTripVersionId: `round-trip-version-${sequence}`,
    accountId: "00000000-0000-4000-8000-000000000001",
    instrumentId: sequence === 3
      ? "00000000-0000-4000-8000-000000000003"
      : "00000000-0000-4000-8000-000000000002",
    displayedSymbol: sequence === 3 ? "BBB" : "AAA",
    tradeCurrency: "USD",
    tradingTimezone: "America/New_York",
    direction: sequence % 2 === 0 ? "short" : "long",
    openedAtUtc: `2026-01-0${sequence}T14:30:00.000Z`,
    closedAtUtc: `2026-01-0${sequence}T15:00:00.000Z`,
    entryLocal: Object.freeze({
      localDate: `2026-01-0${sequence}`,
      weekday: sequence === 1 ? "monday" : sequence === 2 ? "tuesday" : "wednesday",
      hour: 9,
      minute: 30,
      bucket30Minute: "09:30",
    }),
    closeLocal: Object.freeze({
      localDate: `2026-01-0${sequence}`,
      weekday: sequence === 1 ? "monday" : sequence === 2 ? "tuesday" : "wednesday",
      hour: 10,
      minute: 0,
      bucket30Minute: "10:00",
    }),
    holdingDurationMilliseconds: sequence * 1_800_000,
    isOvernight: false,
    uniqueExecutionCount: 2,
    uniqueExecutionIds: Object.freeze([
      `execution-${sequence}-1`,
      `execution-${sequence}-2`,
    ]),
    allocationCount: 2,
    allocationRoleCounts: Object.freeze({
      opening: 1,
      adding: sequence === 1 ? 1 : 0,
      reducing: sequence === 1 ? 1 : 0,
      closing: 1,
      flip_closing: 0,
      flip_opening: 0,
    }),
    provenanceGroup: sequence === 3 ? "manual_only" : "broker_only",
    provenanceKinds: Object.freeze(sequence === 3
      ? ["manual"] as const
      : ["broker"] as const),
    hasOverlapEvidence: false,
    grossPnlDecimal,
    grossOutcome: comparison > 0 ? "win" : comparison < 0 ? "loss" : "flat",
    chargeCoverage: "complete",
    chargeUnavailableReasonCodes: Object.freeze([]),
    chargeCostDecimal: "1",
    chargeCreditDecimal: "0",
    netPnlDecimal: String(comparison - 1),
    netOutcome: comparison - 1 > 0 ? "win" : comparison - 1 < 0 ? "loss" : "flat",
    enteredQuantityDecimal: "10",
    exitQuantityDecimal: "10",
    maximumPositionQuantityDecimal: "10",
    entryNotionalDecimal: "100",
    exitNotionalDecimal: String(100 + comparison),
  });
}

function population(): JournalAnalyticsPopulation {
  const rows = Object.freeze([row(1, "10"), row(2, "-4"), row(3, "0")]);
  const openRoundTrip: JournalAnalyticsRoundTripFact = Object.freeze({
    roundTripId: "open-round-trip",
    roundTripVersionId: "open-round-trip-version",
    versionNumber: 1,
    accountId: "00000000-0000-4000-8000-000000000001",
    instrumentId: "00000000-0000-4000-8000-000000000004",
    displayedSymbol: "OPEN",
    assetClass: "stock",
    tradeCurrency: "USD",
    direction: "long",
    openedAtUtc: "2026-07-30T14:30:00.000Z",
    closedAtUtc: null,
    finalPositionDecimal: "10",
    projectionState: "legitimate_open",
    coverageReasonCode: null,
    projectionFingerprintSha256: "c".repeat(64),
    rebuild: Object.freeze({
      rebuildId: "open-rebuild",
      chainKeySha256: "d".repeat(64),
      algorithmVersion: "test-v1",
      orderedInputSha256: "e".repeat(64),
      outputSha256: "f".repeat(64),
      coverageState: "complete",
      readyClosedCount: 0,
      legitimateOpenCount: 1,
      needsDecisionCount: 0,
      excludedCount: 0,
      completedAtUtc: "2026-08-01T12:00:00.000Z",
    }),
    allocations: Object.freeze([Object.freeze({
      allocationId: "open-allocation",
      allocationSequence: 1,
      allocationRole: "opening",
      executionId: "open-execution",
      executionVersionId: "open-execution-version",
      executionState: "accepted",
      executedAtUtc: "2026-07-30T14:30:00.000Z",
      sourceOrderKey: "open-order",
      side: "buy",
      allocatedQuantityDecimal: "10",
      executionQuantityDecimal: "10",
      priceDecimal: "11",
      feesDecimal: null,
      feeCurrency: null,
      feeSignConvention: "not_reported",
      factCompleteness: "complete",
      provenanceKinds: Object.freeze(["broker"] as const),
      feePolicyCandidates: Object.freeze([]),
    })]),
    pendingDecisionIds: Object.freeze([]),
    pendingDecisionReasonCodes: Object.freeze([]),
  });
  return Object.freeze({
    partitionKey: '["USD","America/New_York"]',
    currency: "USD",
    tradingTimezone: "America/New_York",
    factSetRevisionSha256: "a".repeat(64),
    queryDigestSha256: "b".repeat(64),
    grossRows: rows,
    netRows: rows,
    basisRows: rows,
    legitimateOpenRoundTrips: Object.freeze([openRoundTrip]),
    needsDecisionRoundTrips: Object.freeze([]),
    pendingDecisionFacts: Object.freeze([Object.freeze({
      decisionId: "decision",
      accountId: "00000000-0000-4000-8000-000000000001",
      issueCode: "test_issue",
      effectCode: "review_required",
      revision: 1,
      targetKind: "chain",
      chainKeySha256: "1".repeat(64),
      executionId: null,
      instrumentId: null,
      tradeCurrency: "USD",
      updatedAtUtc: "2026-07-31T12:00:00.000Z",
    })]),
    asOfUtc: "2026-08-01T12:00:00.000Z",
    sourceCoverage: Object.freeze({
      exactScope: true,
      sourceRecordCount: 6,
      importCount: 1,
      decisionCount: 0,
      positionFactCount: 0,
      acceptedExecutionCount: 6,
      importIssueCount: 0,
      exactReimportEventCount: 0,
      duplicateSourceRecordCount: 0,
      acceptedSourceLimitationCount: 0,
      completeCoverageIntervalCount: 0,
      coverageGapCount: 0,
    }),
    coverage: Object.freeze({
      state: "complete",
      candidateCount: 3,
      includedCount: 3,
      excludedCount: 0,
      readyClosedCount: 3,
      legitimateOpenCount: 1,
      needsDecisionCount: 0,
      unsupportedCount: 0,
      feeCompleteCount: 3,
      feeIncompleteCount: 0,
      unavailableCount: 0,
      reasonCounts: Object.freeze({}),
    }),
    limitations: Object.freeze([]),
  });
}

describe("Journal Analytics complete metric registry", () => {
  it("classifies every legacy and additional capability exactly once", () => {
    expect(JOURNAL_ANALYTICS_LEGACY_MIGRATION_METRIC_IDS).toHaveLength(126);
    expect(new Set(JOURNAL_ANALYTICS_CAPABILITY_IDS).size)
      .toBe(JOURNAL_ANALYTICS_CAPABILITY_IDS.length);
    expect(JOURNAL_ANALYTICS_ADDITIONAL_CAPABILITY_IDS.length).toBeGreaterThan(0);
    expect(journalAnalyticsMetricRegistry.definitions)
      .toHaveLength(JOURNAL_ANALYTICS_CAPABILITY_IDS.length);
    expect(new Set(journalAnalyticsMetricRegistry.definitions.map((definition) =>
      definition.metricId))).toEqual(new Set(JOURNAL_ANALYTICS_CAPABILITY_IDS));
  });

  it("gives every unavailable capability one exact missing-fact reason", () => {
    for (const definition of journalAnalyticsMetricRegistry.definitions) {
      if (definition.capabilityState === "unavailable") {
        expect(definition.unavailableReasonCode).toMatch(/^[a-z0-9_]+$/u);
      } else {
        expect(definition.unavailableReasonCode).toBeNull();
      }
      expect(definition.title.length).toBeGreaterThan(2);
      expect(definition.requiredFacts.length).toBeGreaterThan(0);
    }
  });

  it("has a calculator or explicit unavailable result for every capability", () => {
    const results = journalAnalyticsMetricRegistry.definitions.flatMap(
      (definition) => {
        try {
          return accumulateJournalAnalyticsMetrics(
            population(),
            [definition.metricId],
            "gross",
          );
        } catch (error) {
          throw new Error(
            `Metric calculator failed: ${definition.metricId}`,
            { cause: error },
          );
        }
      },
    );
    expect(results).toHaveLength(JOURNAL_ANALYTICS_CAPABILITY_IDS.length);
    expect(results.every((result) => /^[0-9a-f]{64}$/u.test(
      result.resultDigestSha256,
    ))).toBe(true);
    expect(results.find((result) => result.metricId === "commission_signed_charges"))
      .toMatchObject({
        state: "unavailable",
        limitationReasonCodes: ["commission_component_fact_missing"],
      });
    expect(results.find((result) => result.metricId === "total_execution_count")?.value)
      .toEqual({ kind: "integer", value: 6 });
    expect(results.find((result) => result.metricId === "population_pnl_variance")?.value)
      .toMatchObject({ kind: "rational" });
    expect(results.find((result) => result.metricId === "open_weighted_average_cost")?.value)
      .toMatchObject({ kind: "rational", roundedDecimal: "11" });
    expect(results.find((result) => result.metricId === "average_pending_decision_age")?.value)
      .toMatchObject({ kind: "rational", roundedDecimal: "86400000" });
  });
});
import type { JournalAnalyticsRoundTripFact } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
