import { createHash } from "node:crypto";

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type { JournalAnalyticsMoneyBasis } from "../contracts/analytics-query";
import type {
  JournalAnalyticsExactValue,
  JournalAnalyticsMetricResult,
  JournalAnalyticsResultState,
} from "../contracts/analytics-result";
import { JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION } from "../contracts/metric-registry";
import {
  JOURNAL_ANALYTICS_FIRST_SLICE_METRIC_IDS,
  requireJournalAnalyticsMetricDefinition,
  type JournalAnalyticsFirstSliceMetricId,
} from "./analytics-metric-registry";
import { calculateExtendedJournalAnalyticsMetric } from "./analytics-extended-metrics";
import type { JournalAnalyticsPopulation } from "./analytics-population";
import {
  absoluteExactDecimal,
  compareExactDecimals,
  divideExactDecimals,
  maximumExactDecimal,
  medianExactDecimals,
  minimumExactDecimal,
  percentageExactDecimals,
  sumExactDecimals,
} from "./exact-analytics-math";

type CalculatedMetric = Readonly<{
  state: JournalAnalyticsResultState;
  value: JournalAnalyticsExactValue | null;
  limitationReasonCodes: readonly string[];
}>;

function integer(value: number): JournalAnalyticsExactValue {
  return Object.freeze({ kind: "integer" as const, value });
}

function decimal(valueDecimal: string): JournalAnalyticsExactValue {
  return Object.freeze({ kind: "decimal" as const, valueDecimal });
}

function basisValues(
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
): readonly string[] {
  return Object.freeze((moneyBasis === "gross"
    ? population.grossRows.map((row) => row.grossPnlDecimal)
    : population.netRows.map((row) => row.netPnlDecimal!)));
}

function netPartial(population: JournalAnalyticsPopulation): boolean {
  return population.coverage.feeIncompleteCount > 0;
}

function nonEmptyState(
  population: JournalAnalyticsPopulation,
  usesNetCoverage: boolean,
): JournalAnalyticsResultState {
  return usesNetCoverage && netPartial(population) ? "partial" : "complete";
}

function unavailable(reason: string): CalculatedMetric {
  return Object.freeze({
    state: "unavailable" as const,
    value: null,
    limitationReasonCodes: Object.freeze([reason]),
  });
}

function sumForOutcome(values: readonly string[], sign: "positive" | "negative"): string {
  return sumExactDecimals(values.filter((value) => {
    const comparison = compareExactDecimals(value, "0");
    return sign === "positive" ? comparison > 0 : comparison < 0;
  }));
}

function calculateMetric(
  metricId: JournalAnalyticsFirstSliceMetricId,
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
): CalculatedMetric {
  const values = basisValues(population, moneyBasis);
  const wins = values.filter((value) => compareExactDecimals(value, "0") > 0);
  const losses = values.filter((value) => compareExactDecimals(value, "0") < 0);
  const flats = values.filter((value) => compareExactDecimals(value, "0") === 0);
  const grossValues = population.grossRows.map((row) => row.grossPnlDecimal);
  const netValues = population.netRows.map((row) => row.netPnlDecimal!);
  const selectedUsesNet = moneyBasis === "net";
  const selectedState = values.length === 0
    ? "empty" as const
    : nonEmptyState(population, selectedUsesNet);
  const selectedLimitations = selectedUsesNet && netPartial(population)
    ? Object.freeze(["fee_coverage_partial"])
    : Object.freeze([]);
  switch (metricId) {
    case "candidate_count":
      return Object.freeze({ state: "complete", value: integer(population.coverage.candidateCount), limitationReasonCodes: Object.freeze([]) });
    case "included_count":
      return Object.freeze({ state: population.coverage.state, value: integer(population.coverage.includedCount), limitationReasonCodes: population.limitations });
    case "excluded_count":
      return Object.freeze({ state: population.limitations.includes("excluded_execution_scope_not_attributable") ? "unavailable" : "complete", value: population.limitations.includes("excluded_execution_scope_not_attributable") ? null : integer(population.coverage.excludedCount), limitationReasonCodes: population.limitations.filter((reason) => reason.includes("excluded")) });
    case "total_trades":
      return Object.freeze({ state: values.length === 0 ? "empty" : selectedState, value: integer(values.length), limitationReasonCodes: selectedLimitations });
    case "win_count":
      return Object.freeze({ state: selectedState, value: integer(wins.length), limitationReasonCodes: selectedLimitations });
    case "loss_count":
      return Object.freeze({ state: selectedState, value: integer(losses.length), limitationReasonCodes: selectedLimitations });
    case "flat_count":
      return Object.freeze({ state: selectedState, value: integer(flats.length), limitationReasonCodes: selectedLimitations });
    case "win_rate":
    case "loss_rate":
    case "flat_rate": {
      if (values.length === 0) return unavailable("zero_eligible_trade_denominator");
      const numerator = metricId === "win_rate"
        ? wins.length
        : metricId === "loss_rate"
          ? losses.length
          : flats.length;
      return Object.freeze({
        state: nonEmptyState(population, selectedUsesNet),
        value: Object.freeze({
          kind: "rational" as const,
          ...percentageExactDecimals(String(numerator), String(values.length)),
        }),
        limitationReasonCodes: selectedLimitations,
      });
    }
    case "gross_profit":
      return Object.freeze({ state: grossValues.length === 0 ? "empty" : "complete", value: decimal(sumForOutcome(grossValues, "positive")), limitationReasonCodes: Object.freeze([]) });
    case "gross_loss":
      return Object.freeze({ state: grossValues.length === 0 ? "empty" : "complete", value: decimal(sumForOutcome(grossValues, "negative")), limitationReasonCodes: Object.freeze([]) });
    case "gross_pnl":
      return Object.freeze({ state: grossValues.length === 0 ? "empty" : "complete", value: decimal(sumExactDecimals(grossValues)), limitationReasonCodes: Object.freeze([]) });
    case "net_pnl":
      if (population.grossRows.length > 0 && netValues.length === 0) {
        return unavailable("complete_fee_coverage_required");
      }
      return Object.freeze({ state: netValues.length === 0 ? "empty" : nonEmptyState(population, true), value: decimal(sumExactDecimals(netValues)), limitationReasonCodes: netPartial(population) ? Object.freeze(["fee_coverage_partial"]) : Object.freeze([]) });
    case "average_gross_pnl":
      if (grossValues.length === 0) return unavailable("zero_eligible_trade_denominator");
      return Object.freeze({ state: "complete", value: Object.freeze({ kind: "rational" as const, ...divideExactDecimals(sumExactDecimals(grossValues), String(grossValues.length), { decimalPlaces: 2, roundingPolicy: "half_up_2dp" }) }), limitationReasonCodes: Object.freeze([]) });
    case "median_gross_pnl": {
      const median = medianExactDecimals(grossValues);
      return median === null
        ? unavailable("zero_eligible_trade_denominator")
        : Object.freeze({ state: "complete", value: Object.freeze({ kind: "rational" as const, ...median }), limitationReasonCodes: Object.freeze([]) });
    }
    case "average_pnl":
    case "expectancy":
      if (values.length === 0) return unavailable("zero_eligible_trade_denominator");
      return Object.freeze({ state: nonEmptyState(population, selectedUsesNet), value: Object.freeze({ kind: "rational" as const, ...divideExactDecimals(sumExactDecimals(values), String(values.length), { decimalPlaces: 2, roundingPolicy: "half_up_2dp" }) }), limitationReasonCodes: selectedLimitations });
    case "median_pnl": {
      const median = medianExactDecimals(values);
      return median === null
        ? unavailable("zero_eligible_trade_denominator")
        : Object.freeze({ state: nonEmptyState(population, selectedUsesNet), value: Object.freeze({ kind: "rational" as const, ...median }), limitationReasonCodes: selectedLimitations });
    }
    case "best_trade": {
      const best = maximumExactDecimal(values);
      return best === null
        ? unavailable("zero_eligible_trade_denominator")
        : Object.freeze({ state: nonEmptyState(population, selectedUsesNet), value: decimal(best), limitationReasonCodes: selectedLimitations });
    }
    case "worst_trade": {
      const worst = minimumExactDecimal(values);
      return worst === null
        ? unavailable("zero_eligible_trade_denominator")
        : Object.freeze({ state: nonEmptyState(population, selectedUsesNet), value: decimal(worst), limitationReasonCodes: selectedLimitations });
    }
    case "profit_factor": {
      const profit = sumExactDecimals(wins);
      const loss = absoluteExactDecimal(sumExactDecimals(losses));
      if (compareExactDecimals(loss, "0") === 0) {
        return unavailable("gross_loss_denominator_missing");
      }
      return Object.freeze({ state: nonEmptyState(population, selectedUsesNet), value: Object.freeze({ kind: "rational" as const, ...divideExactDecimals(profit, loss, { decimalPlaces: 4, roundingPolicy: "half_up_4dp" }) }), limitationReasonCodes: selectedLimitations });
    }
  }
}

function resultDigest(input: Readonly<{
  metricId: string;
  value: JournalAnalyticsExactValue | null;
  state: JournalAnalyticsResultState;
  moneyBasis: string;
  currency: string | null;
  timezone: string;
  coverage: JournalAnalyticsPopulation["coverage"];
  limitations: readonly string[];
  factSetRevisionSha256: string;
  queryDigestSha256: string;
  populationKey: string;
  asOfUtc: string | null;
}>): string {
  return createHash("sha256").update(JSON.stringify(input), "utf8").digest("hex");
}

export function accumulateJournalAnalyticsMetrics(
  population: JournalAnalyticsPopulation,
  metricIds: readonly string[],
  moneyBasis: JournalAnalyticsMoneyBasis,
): readonly JournalAnalyticsMetricResult[] {
  const firstSliceIds = new Set<string>(JOURNAL_ANALYTICS_FIRST_SLICE_METRIC_IDS);
  return Object.freeze(metricIds.map((metricId) => {
    const definition = requireJournalAnalyticsMetricDefinition(metricId);
    const effectiveBasis = definition.moneyBasis === "gross" ||
        definition.moneyBasis === "net"
      ? definition.moneyBasis
      : moneyBasis;
    const calculated = definition.capabilityState === "unavailable"
      ? unavailable(definition.unavailableReasonCode ?? "capability_unavailable")
      : firstSliceIds.has(metricId)
        ? calculateMetric(
            definition.metricId as JournalAnalyticsFirstSliceMetricId,
            population,
            effectiveBasis,
          )
        : calculateExtendedJournalAnalyticsMetric(
            metricId,
            population,
            effectiveBasis,
          );
    if (calculated === null) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "analytics_metric_calculator_missing",
        metricId,
      });
    }
    const coveredCalculation = calculated.state === "complete" &&
        effectiveBasis === "net" &&
        definition.moneyBasis === "selectable" &&
        population.coverage.feeIncompleteCount > 0
      ? Object.freeze({
          ...calculated,
          state: "partial" as const,
          limitationReasonCodes: Object.freeze([
            ...new Set([
              ...calculated.limitationReasonCodes,
              "fee_coverage_partial",
            ]),
          ]),
        })
      : calculated;
    const resolvedBasis = definition.moneyBasis === "selectable"
      ? moneyBasis
      : definition.moneyBasis === "not_applicable"
        ? "not_applicable"
        : definition.moneyBasis;
    const limitations = Object.freeze([
      ...new Set([
        ...coveredCalculation.limitationReasonCodes,
        ...(coveredCalculation.state === "partial" ? population.limitations : []),
      ]),
    ].sort());
    const digest = resultDigest({
      metricId,
      value: coveredCalculation.value,
      state: coveredCalculation.state,
      moneyBasis: resolvedBasis,
      currency: definition.valueKind === "money" ? population.currency : null,
      timezone: population.tradingTimezone,
      coverage: population.coverage,
      limitations,
      factSetRevisionSha256: population.factSetRevisionSha256,
      queryDigestSha256: population.queryDigestSha256,
      populationKey: population.partitionKey,
      asOfUtc: metricId === "average_open_age" ||
          metricId === "maximum_open_age" ||
          metricId === "average_open_carried_days" ||
          metricId === "average_pending_decision_age" ||
          metricId === "maximum_pending_decision_age"
        ? population.asOfUtc
        : null,
    });
    return Object.freeze({
      metricId,
      formulaVersion: definition.formulaVersion,
      title: definition.title,
      description: definition.description,
      valueKind: definition.valueKind,
      unit: definition.unit,
      state: coveredCalculation.state,
      value: coveredCalculation.value,
      moneyBasis: resolvedBasis,
      chargePolicy: resolvedBasis === "net"
        ? "complete_fee_rows_only_v1"
        : "not_applied",
      currency: definition.valueKind === "money" ? population.currency : null,
      timezonePolicy: "account_timezone_partition",
      dateAttributionPolicy: "closing_trading_date",
      coverage: population.coverage,
      limitationReasonCodes: limitations,
      factSetRevisionSha256: population.factSetRevisionSha256,
      registryVersion: JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION,
      resultDigestSha256: digest,
    });
  }));
}
