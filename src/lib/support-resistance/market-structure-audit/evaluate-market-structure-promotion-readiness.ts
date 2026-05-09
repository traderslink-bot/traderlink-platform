import type { ExperimentalMarketStructureAudit } from "./build-experimental-market-structure-audit";
import {
  evaluateMarketStructureCalibration,
  type MarketStructureCalibrationEvaluation,
} from "./evaluate-market-structure-calibration";

export type MarketStructurePromotionGateStatus =
  | "PASS"
  | "REVIEW"
  | "BLOCKER";

export type MarketStructurePromotionGateId =
  | "observational_contract"
  | "calibration_blockers"
  | "real_saved_trade_review"
  | "minimum_real_trade_count"
  | "analysis_completion_rate"
  | "market_structure_coverage"
  | "confidence_quality"
  | "provider_engine_warning_rate"
  | "pattern_input_isolation";

export type MarketStructurePromotionStatus =
  | "blocked"
  | "needs_real_saved_trade_batch"
  | "review_required"
  | "ready_for_limited_internal_use";

export type MarketStructureAllowedUse =
  | "debug_output"
  | "batch_calibration"
  | "limited_internal_review";

export type MarketStructureProhibitedUse =
  | "pattern_detection"
  | "pattern_normalization"
  | "trade_grading"
  | "scoring"
  | "coaching"
  | "final_user_facing_conclusions";

export interface MarketStructurePromotionThresholds {
  minimumRealTradeCount: number;
  minimumAnalysisCompletionRate: number;
  minimumMarketStructureCoverageRate: number;
  maximumLowConfidenceRate: number;
  maximumProviderEngineWarningRate: number;
}

export interface MarketStructurePromotionGate {
  id: MarketStructurePromotionGateId;
  label: string;
  status: MarketStructurePromotionGateStatus;
  detail: string;
}

export interface MarketStructurePromotionReadinessDecision {
  contractVersion: "market_structure_promotion_readiness_v1";
  generatedAt: string;
  promotionStatus: MarketStructurePromotionStatus;
  allowedUses: MarketStructureAllowedUse[];
  prohibitedUses: MarketStructureProhibitedUse[];
  thresholds: MarketStructurePromotionThresholds;
  metrics: {
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    analysisCompletionRate: number;
    marketStructureCoverageRate: number;
    lowConfidenceRate: number;
    providerEngineWarningRate: number;
    patternInputLeakCount: number;
  };
  gates: MarketStructurePromotionGate[];
  calibration: {
    overallStatus: MarketStructureCalibrationEvaluation["overallStatus"];
    recommendation: MarketStructureCalibrationEvaluation["recommendation"];
  };
  recommendation: string;
}

export interface EvaluateMarketStructurePromotionReadinessArgs {
  audit: ExperimentalMarketStructureAudit;
  realSavedTradeBatchReviewed: boolean;
  thresholds?: Partial<MarketStructurePromotionThresholds>;
  generatedAt?: string;
}

const DEFAULT_THRESHOLDS: MarketStructurePromotionThresholds = {
  minimumRealTradeCount: 30,
  minimumAnalysisCompletionRate: 0.98,
  minimumMarketStructureCoverageRate: 0.95,
  maximumLowConfidenceRate: 0.1,
  maximumProviderEngineWarningRate: 0.1,
};

const PROHIBITED_USES: MarketStructureProhibitedUse[] = [
  "pattern_detection",
  "pattern_normalization",
  "trade_grading",
  "scoring",
  "coaching",
  "final_user_facing_conclusions",
];

function divide(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function mergeThresholds(
  overrides: Partial<MarketStructurePromotionThresholds> | undefined,
): MarketStructurePromotionThresholds {
  return {
    ...DEFAULT_THRESHOLDS,
    ...overrides,
  };
}

function countLowConfidenceReads(audit: ExperimentalMarketStructureAudit): number {
  return audit.records.filter(
    (record) => record.marketStructure?.confidence.label === "low",
  ).length;
}

function countProviderEngineWarningRecords(
  audit: ExperimentalMarketStructureAudit,
): number {
  return audit.records.filter((record) =>
    record.warnings.some(
      (warning) =>
        warning.includes(" warning:") || warning.includes(" error:"),
    ),
  ).length;
}

function buildGate(args: MarketStructurePromotionGate): MarketStructurePromotionGate {
  return args;
}

function getPromotionStatus(args: {
  gates: MarketStructurePromotionGate[];
  audit: ExperimentalMarketStructureAudit;
  realSavedTradeBatchReviewed: boolean;
}): MarketStructurePromotionStatus {
  if (args.gates.some((gate) => gate.status === "BLOCKER")) {
    return "blocked";
  }

  if (
    !args.realSavedTradeBatchReviewed ||
    args.audit.totals.totalTrades === 0 ||
    args.gates.some(
      (gate) =>
        gate.id === "minimum_real_trade_count" && gate.status !== "PASS",
    )
  ) {
    return "needs_real_saved_trade_batch";
  }

  if (args.gates.some((gate) => gate.status === "REVIEW")) {
    return "review_required";
  }

  return "ready_for_limited_internal_use";
}

function getAllowedUses(
  promotionStatus: MarketStructurePromotionStatus,
): MarketStructureAllowedUse[] {
  const base: MarketStructureAllowedUse[] = ["debug_output", "batch_calibration"];

  if (promotionStatus === "ready_for_limited_internal_use") {
    return [...base, "limited_internal_review"];
  }

  return base;
}

function getRecommendation(
  status: MarketStructurePromotionStatus,
): string {
  switch (status) {
    case "blocked":
      return "Keep market structure observational and fix blocker gates before using it outside debug and calibration output.";
    case "needs_real_saved_trade_batch":
      return "Keep market structure observational. Review a larger real saved-trade batch before considering any internal promotion.";
    case "review_required":
      return "Keep market structure out of scoring and user conclusions. Review flagged examples before limited internal use.";
    case "ready_for_limited_internal_use":
      return "Market structure may be used for limited internal review experiments, but remains prohibited from pattern detection, scoring, coaching, grading, and final user-facing conclusions.";
  }
}

export function evaluateMarketStructurePromotionReadiness(
  args: EvaluateMarketStructurePromotionReadinessArgs,
): MarketStructurePromotionReadinessDecision {
  const thresholds = mergeThresholds(args.thresholds);
  const { audit } = args;
  const calibration = evaluateMarketStructureCalibration(audit);
  const lowConfidenceCount = countLowConfidenceReads(audit);
  const providerEngineWarningCount = countProviderEngineWarningRecords(audit);
  const successfulMarketStructureCount = audit.records.filter(
    (record) => record.analysisStatus === "ok" && record.marketStructure,
  ).length;
  const analysisCompletionRate = divide(
    audit.totals.successfulTrades,
    audit.totals.totalTrades,
  );
  const marketStructureCoverageRate = divide(
    successfulMarketStructureCount,
    audit.totals.totalTrades,
  );
  const lowConfidenceRate = divide(lowConfidenceCount, audit.totals.totalTrades);
  const providerEngineWarningRate = divide(
    providerEngineWarningCount,
    audit.totals.totalTrades,
  );

  const gates: MarketStructurePromotionGate[] = [
    buildGate({
      id: "observational_contract",
      label: "Observational contract",
      status: audit.observationalOnly ? "PASS" : "BLOCKER",
      detail: `observationalOnly=${audit.observationalOnly}`,
    }),
    buildGate({
      id: "calibration_blockers",
      label: "Calibration blockers",
      status:
        calibration.overallStatus === "BLOCKER"
          ? "BLOCKER"
          : calibration.overallStatus === "REVIEW"
            ? "REVIEW"
            : "PASS",
      detail: `calibration overall status is ${calibration.overallStatus}`,
    }),
    buildGate({
      id: "real_saved_trade_review",
      label: "Real saved-trade review",
      status: args.realSavedTradeBatchReviewed ? "PASS" : "REVIEW",
      detail: args.realSavedTradeBatchReviewed
        ? "real saved-trade batch has been reviewed"
        : "no real saved-trade batch has been reviewed yet",
    }),
    buildGate({
      id: "minimum_real_trade_count",
      label: "Minimum real trade count",
      status:
        audit.totals.totalTrades >= thresholds.minimumRealTradeCount
          ? "PASS"
          : "REVIEW",
      detail: `${audit.totals.totalTrades}/${thresholds.minimumRealTradeCount} trade(s)`,
    }),
    buildGate({
      id: "analysis_completion_rate",
      label: "Analysis completion rate",
      status:
        audit.totals.totalTrades === 0
          ? "REVIEW"
          : analysisCompletionRate >= thresholds.minimumAnalysisCompletionRate
          ? "PASS"
          : "BLOCKER",
      detail: `${analysisCompletionRate.toFixed(3)} required ${thresholds.minimumAnalysisCompletionRate.toFixed(3)}`,
    }),
    buildGate({
      id: "market_structure_coverage",
      label: "Market-structure coverage",
      status:
        audit.totals.totalTrades === 0
          ? "REVIEW"
          : marketStructureCoverageRate >=
            thresholds.minimumMarketStructureCoverageRate
          ? "PASS"
          : "BLOCKER",
      detail: `${marketStructureCoverageRate.toFixed(3)} required ${thresholds.minimumMarketStructureCoverageRate.toFixed(3)}`,
    }),
    buildGate({
      id: "confidence_quality",
      label: "Confidence quality",
      status:
        lowConfidenceRate <= thresholds.maximumLowConfidenceRate
          ? "PASS"
          : "REVIEW",
      detail: `${lowConfidenceRate.toFixed(3)} max ${thresholds.maximumLowConfidenceRate.toFixed(3)}`,
    }),
    buildGate({
      id: "provider_engine_warning_rate",
      label: "Provider / engine warning rate",
      status:
        providerEngineWarningRate <= thresholds.maximumProviderEngineWarningRate
          ? "PASS"
          : "REVIEW",
      detail: `${providerEngineWarningRate.toFixed(3)} max ${thresholds.maximumProviderEngineWarningRate.toFixed(3)}`,
    }),
    buildGate({
      id: "pattern_input_isolation",
      label: "PatternInput isolation",
      status:
        audit.totals.patternInputLeakCount === 0 ? "PASS" : "BLOCKER",
      detail: `${audit.totals.patternInputLeakCount} leak(s)`,
    }),
  ];
  const promotionStatus = getPromotionStatus({
    gates,
    audit,
    realSavedTradeBatchReviewed: args.realSavedTradeBatchReviewed,
  });

  return {
    contractVersion: "market_structure_promotion_readiness_v1",
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    promotionStatus,
    allowedUses: getAllowedUses(promotionStatus),
    prohibitedUses: PROHIBITED_USES,
    thresholds,
    metrics: {
      totalTrades: audit.totals.totalTrades,
      successfulTrades: audit.totals.successfulTrades,
      failedTrades: audit.totals.failedTrades,
      analysisCompletionRate,
      marketStructureCoverageRate,
      lowConfidenceRate,
      providerEngineWarningRate,
      patternInputLeakCount: audit.totals.patternInputLeakCount,
    },
    gates,
    calibration: {
      overallStatus: calibration.overallStatus,
      recommendation: calibration.recommendation,
    },
    recommendation: getRecommendation(promotionStatus),
  };
}
