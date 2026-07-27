import { compareUnicodeCodePoints } from "../../domain/canonical";
import { finalizeContentAddressedAuthority, type ExactMetricValue } from "../contracts";
import type { TradeQueryResult } from "../query";
import type {
  AnalyticsAgentAnswerPacket,
  AnalyticsAgentAnswerStatus,
  AnalyticsAgentExecutionRequest,
  AnalyticsAgentIntentResolution,
  AnalyticsAgentUnsupportedReason,
} from "./contracts";

const MINIMUM_SAMPLE = BigInt("3");

function metric(result: TradeQueryResult, key: string): ExactMetricValue | null {
  return result.rows[0]?.metrics.find((item) => item.metricKey === key) ?? null;
}

function metricText(value: ExactMetricValue | null): string {
  if (value === null) return "unavailable";
  if (value.kind === "exact_decimal" || value.kind === "integer") return value.value;
  return "unavailable";
}

function evidenceOmitted(result: TradeQueryResult): string {
  return result.evidence.reduce(
    (total, item) => total + BigInt(item.populationCount) - BigInt(item.candidates.length),
    BigInt("0"),
  ).toString();
}

function followUps(intent: AnalyticsAgentIntentResolution["intent"]): readonly string[] {
  switch (intent) {
    case "time_of_day_performance": return Object.freeze(["Show the evidence trades.", "Break this down by ticker."]);
    case "ticker_performance": return Object.freeze(["Show repeat attempts on this ticker.", "Show the evidence trades."]);
    case "fee_impact": return Object.freeze(["Show gross versus net for this period.", "Check the data-quality limitations."]);
    case "giveback_drawdown": return Object.freeze(["Show the evidence trades for this day.", "Compare this period with another period."]);
    default: return Object.freeze(["Show the evidence trades.", "Break this down by time of day."]);
  }
}

function renderHints(intent: AnalyticsAgentIntentResolution["intent"]): AnalyticsAgentAnswerPacket["renderHints"] {
  if (intent === "time_of_day_performance" || intent === "ticker_performance" || intent === "trade_sequence_behavior" || intent === "repeat_attempt_behavior") {
    return Object.freeze(["metric_cards", "bar_chart", "table", "evidence_list"]);
  }
  return Object.freeze(["metric_cards", "table", "evidence_list"]);
}

function headline(
  status: AnalyticsAgentAnswerStatus,
  result: TradeQueryResult,
  resolution: AnalyticsAgentIntentResolution,
): string {
  if (status === "data_unavailable") return "No completed trades matched this verified execution-data request.";
  if (status === "insufficient_sample") {
    return `Only ${result.includedCount} completed trades matched this request, so this is not enough to treat as a reliable historical pattern.`;
  }
  const weakest = result.rows[0];
  if (weakest !== undefined && result.rows.length > 1) {
    return `Based on your completed trade execution data, the lowest returned net P/L group is ${weakest.groupLabel} at ${metricText(metric({ ...result, rows: [weakest] }, "net_pnl"))}. This is a historical pattern, not a prediction or instruction.`;
  }
  const netPnl = metricText(metric(result, "net_pnl"));
  return `Based on your completed trade execution data, this verified result covers ${result.includedCount} completed trades with net P/L of ${netPnl}. This is a historical result, not financial advice.`;
}

function buildPacket(content: Omit<AnalyticsAgentAnswerPacket, "answerDigest">): AnalyticsAgentAnswerPacket {
  const built = finalizeContentAddressedAuthority(
    "analytics_agent_answer",
    content,
    "answerDigest",
  );
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as AnalyticsAgentAnswerPacket;
}

export function buildUnsupportedAnalyticsAgentAnswer(
  request: AnalyticsAgentExecutionRequest,
  resolution: AnalyticsAgentIntentResolution,
  reason: AnalyticsAgentUnsupportedReason,
): AnalyticsAgentAnswerPacket {
  return buildPacket({
    schemaVersion: "ti_v3_analytics_agent_answer_v1",
    status: "unsupported",
    originalQuestion: request.question,
    resolvedIntent: resolution.intent,
    capabilityKeys: Object.freeze([]),
    enginePlanDigest: null,
    resultDigest: null,
    executionReceiptDigest: null,
    headline: "This cannot be proven from completed trade execution data alone.",
    supportingMetrics: Object.freeze([]),
    rankedRows: Object.freeze([]),
    evidenceTradeReferences: Object.freeze([]),
    evidenceOmittedCount: "0",
    sampleSize: "0",
    dateRange: request.dateRange ?? null,
    limitationCodes: Object.freeze([reason.code]),
    unsupportedReason: Object.freeze({
      code: reason.code,
      missingRequiredData: Object.freeze([...reason.missingRequiredData].sort(compareUnicodeCodePoints)),
      safeAlternative: Object.freeze([...reason.safeAlternative]),
    }),
    followUpSuggestions: Object.freeze([...reason.safeAlternative]),
    renderHints: Object.freeze(["metric_cards"]),
  });
}

export function buildAnalyticsAgentAnswer(
  request: AnalyticsAgentExecutionRequest,
  resolution: AnalyticsAgentIntentResolution,
  capabilityKey: string,
  result: TradeQueryResult,
): AnalyticsAgentAnswerPacket {
  const noData = result.rows.length === 0 || result.includedCount === "0";
  const insufficient = !noData && BigInt(result.includedCount) < MINIMUM_SAMPLE;
  const limited = result.limitationCodes.length > 0 || result.rows.some((row) => row.limitationCodes.length > 0);
  const status: AnalyticsAgentAnswerStatus = noData
    ? "data_unavailable"
    : insufficient
      ? "insufficient_sample"
      : limited
        ? "partially_answered"
        : "answered";
  const metrics = result.rows[0]?.metrics ?? Object.freeze([]);
  const evidence = Object.freeze(result.evidence.flatMap((item) => item.candidates));
  const limitations = Object.freeze([...new Set([
    ...result.limitationCodes,
    ...result.rows.flatMap((row) => row.limitationCodes),
    ...(insufficient ? ["ti_v3_analytics_agent_insufficient_sample"] : []),
  ])].sort(compareUnicodeCodePoints));
  return buildPacket({
    schemaVersion: "ti_v3_analytics_agent_answer_v1",
    status,
    originalQuestion: request.question,
    resolvedIntent: resolution.intent,
    capabilityKeys: Object.freeze([capabilityKey]),
    enginePlanDigest: result.normalizedQueryPlan.queryPlanDigest,
    resultDigest: result.resultDigest,
    executionReceiptDigest: result.executionReceipt.receiptDigest,
    headline: headline(status, result, resolution),
    supportingMetrics: metrics,
    rankedRows: result.rows,
    evidenceTradeReferences: evidence,
    evidenceOmittedCount: evidenceOmitted(result),
    sampleSize: result.includedCount,
    dateRange: request.dateRange ?? null,
    limitationCodes: limitations,
    unsupportedReason: insufficient
      ? Object.freeze({ code: "insufficient_sample_size", missingRequiredData: Object.freeze(["more_completed_trades"]), safeAlternative: Object.freeze(["Show the evidence trades."]) })
      : null,
    followUpSuggestions: followUps(resolution.intent),
    renderHints: renderHints(resolution.intent),
  });
}
