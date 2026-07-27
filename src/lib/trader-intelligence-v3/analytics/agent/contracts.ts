import type { CanonicalContentDigest } from "../../domain/identity";
import type { ExactMetricValue } from "../contracts";
import type { AnalyticalPartitionReceipt } from "../dataset";
import type {
  TradeQueryEvidenceCandidate,
  TradeQueryFilter,
  TradeQueryMetricKey,
  TradeQueryResultRow,
} from "../query";
import type { VerifiedTradeQueryDatasetSource } from "../query/gateway";

export const ANALYTICS_AGENT_ANSWER_VERSION =
  "ti_v3_analytics_agent_answer_v1" as const;

export type AnalyticsAgentIntent =
  | "core_performance"
  | "time_of_day_performance"
  | "ticker_performance"
  | "price_range_performance"
  | "prior_outcome_behavior"
  | "trade_sequence_behavior"
  | "repeat_attempt_behavior"
  | "giveback_drawdown"
  | "fee_impact"
  | "data_quality"
  | "unsupported_market_or_setup"
  | "unsupported_exit_quality"
  | "unsupported_planned_risk"
  | "unsupported_unknown";

export type AnalyticsAgentAnswerStatus =
  | "answered"
  | "partially_answered"
  | "unsupported"
  | "insufficient_sample"
  | "data_unavailable";

export interface AnalyticsAgentIntentResolution {
  readonly intent: AnalyticsAgentIntent;
  readonly previousOutcome: "gain" | "loss" | null;
  readonly priceRange: Readonly<{
    readonly minimum: string | null;
    readonly maximum: string | null;
  }> | null;
}

export interface AnalyticsAgentQuestionRequest {
  readonly ownerScope: readonly string[];
  readonly accountScope: readonly string[];
  readonly question: string;
  readonly dateRange?: Readonly<{ readonly startDate: string; readonly endDate: string }>;
  readonly selectedTradeId?: string;
  readonly symbol?: string;
  readonly filters?: readonly TradeQueryFilter[];
  readonly intentHint?: AnalyticsAgentIntent;
  readonly outputMode?: "answer" | "table" | "chart";
}

export interface AnalyticsAgentExecutionRequest extends AnalyticsAgentQuestionRequest {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
}

export interface AnalyticsAgentUnsupportedReason {
  readonly code: string;
  readonly missingRequiredData: readonly string[];
  readonly safeAlternative: readonly string[];
}

export interface AnalyticsAgentAnswerPacket {
  readonly schemaVersion: typeof ANALYTICS_AGENT_ANSWER_VERSION;
  readonly status: AnalyticsAgentAnswerStatus;
  readonly originalQuestion: string;
  readonly resolvedIntent: AnalyticsAgentIntent;
  readonly capabilityKeys: readonly string[];
  readonly enginePlanDigest: CanonicalContentDigest | null;
  readonly resultDigest: CanonicalContentDigest | null;
  readonly executionReceiptDigest: CanonicalContentDigest | null;
  readonly headline: string;
  readonly supportingMetrics: readonly ExactMetricValue[];
  readonly rankedRows: readonly TradeQueryResultRow[];
  readonly evidenceTradeReferences: readonly TradeQueryEvidenceCandidate[];
  readonly evidenceOmittedCount: string;
  readonly sampleSize: string;
  readonly dateRange: Readonly<{ readonly startDate: string; readonly endDate: string }> | null;
  readonly limitationCodes: readonly string[];
  readonly unsupportedReason: AnalyticsAgentUnsupportedReason | null;
  readonly followUpSuggestions: readonly string[];
  readonly renderHints: readonly ("metric_cards" | "table" | "bar_chart" | "evidence_list")[];
  readonly answerDigest: CanonicalContentDigest;
}

export type AnalyticsAgentPlanMetrics = readonly TradeQueryMetricKey[];
