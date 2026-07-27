import type { ExactResult } from "../../domain/exact";
import type { AnalyticalContractFailure } from "../contracts";
import { executeGa1BPreset, executeTradeQuery } from "../query";
import {
  buildAnalyticsAgentAnswer,
  buildClarificationAnalyticsAgentAnswer,
  buildUnsupportedAnalyticsAgentAnswer,
} from "./answer-builder";
import type {
  AnalyticsAgentAnswerPacket,
  AnalyticsAgentExecutionRequest,
  AnalyticsAgentUnsupportedReason,
} from "./contracts";
import { resolveAnalyticsAgentIntent } from "./intent-router";
import { buildAnalyticsAgentPlan } from "./plan-builder";

const UNSUPPORTED: Readonly<Record<string, AnalyticsAgentUnsupportedReason>> = Object.freeze({
  unsupported_market_or_setup: Object.freeze({
    code: "market_or_setup_data_required",
    missingRequiredData: Object.freeze(["candle_data", "market_data", "setup_authority"]),
    safeAlternative: Object.freeze(["Ask about performance by time of day.", "Ask about performance after a loss."]),
  }),
  unsupported_exit_quality: Object.freeze({
    code: "exit_quality_or_alternative_outcome_authority_required",
    missingRequiredData: Object.freeze(["candle_data", "alternative_outcome_authority"]),
    safeAlternative: Object.freeze(["Compare hold time for winning and losing trades."]),
  }),
  unsupported_planned_risk: Object.freeze({
    code: "planned_risk_authority_required",
    missingRequiredData: Object.freeze(["user_defined_risk_plan", "planned_stop_data"]),
    safeAlternative: Object.freeze(["Ask about realized giveback or drawdown."]),
  }),
  unsupported_unknown: Object.freeze({
    code: "question_not_supported_by_execution_analytics_v1",
    missingRequiredData: Object.freeze(["a_supported_execution_analytics_intent"]),
    safeAlternative: Object.freeze(["Ask about overall performance, time of day, tickers, fees, or drawdown."]),
  }),
});

export function executeAnalyticsAgent(
  request: AnalyticsAgentExecutionRequest,
): ExactResult<AnalyticsAgentAnswerPacket, AnalyticalContractFailure> {
  const routed = resolveAnalyticsAgentIntent(request.question, request.intentHint);
  const resolution = request.composition === undefined
    ? routed
    : Object.freeze({ ...routed, intent: "composed_execution_query" as const });
  const unsupported = UNSUPPORTED[resolution.intent];
  if (unsupported !== undefined) {
    return { ok: true, value: buildUnsupportedAnalyticsAgentAnswer(request, resolution, unsupported) };
  }
  const plan = buildAnalyticsAgentPlan(request, resolution);
  if (!plan.ok) {
    if (plan.error.path === "$.analyticsAgent.dateRange" || plan.error.path === "$.analyticsAgent.comparisonDateRange") {
      return {
        ok: true,
        value: buildClarificationAnalyticsAgentAnswer(
          request,
          resolution,
          plan.error.path === "$.analyticsAgent.comparisonDateRange" ? "comparison_date_range_required" : "date_range_required",
        ),
      };
    }
    return plan;
  }
  if (plan.value.preset !== null) {
    const executed = executeGa1BPreset({
      source: request.source,
      partitionReceipt: request.partitionReceipt,
      preset: plan.value.preset,
    });
    return executed.ok
      ? {
        ok: true,
        value: buildAnalyticsAgentAnswer(
          request,
          resolution,
          plan.value.capabilityKey,
          executed.value.primaryResult,
          {
            presetDigest: executed.value.presetDigest,
            presetExecutionDigest: executed.value.executionResultDigest,
            baselinePlanDigest: executed.value.baselinePlanDigest,
            baselineResultDigest: executed.value.baselineResultDigest,
            comparisonDigest: executed.value.comparisonDigest,
          },
        ),
      }
      : executed;
  }
  if (plan.value.plan === null) return { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: "$.analyticsAgent.plan" } };
  const executed = executeTradeQuery({
    source: request.source,
    partitionReceipt: request.partitionReceipt,
    queryPlan: plan.value.plan,
  });
  return executed.ok
    ? { ok: true, value: buildAnalyticsAgentAnswer(request, resolution, plan.value.capabilityKey, executed.value) }
    : executed;
}
