import type {
  ExperimentalMarketStructureAudit,
  ExperimentalMarketStructureAuditRecord,
} from "./build-experimental-market-structure-audit";

export type MarketStructureCalibrationGateStatus =
  | "PASS"
  | "REVIEW"
  | "BLOCKER";

export type MarketStructureCalibrationOverallStatus =
  MarketStructureCalibrationGateStatus;

export type MarketStructureCalibrationGateId =
  | "pattern_input_isolation"
  | "analysis_completion"
  | "market_structure_presence"
  | "confidence"
  | "unknown_or_insufficient_structure"
  | "market_structure_diagnostics"
  | "provider_engine_warnings";

export type MarketStructureCalibrationRecommendationAction =
  | "collect_saved_trade_batch"
  | "fix_pattern_input_leak"
  | "resolve_failed_or_missing_context"
  | "review_structure_quality"
  | "continue_observational_validation";

export interface MarketStructureCalibrationGate {
  id: MarketStructureCalibrationGateId;
  label: string;
  status: MarketStructureCalibrationGateStatus;
  detail: string;
  tradeIndexes: number[];
}

export interface MarketStructureCalibrationRecordGroups {
  failureRecords: ExperimentalMarketStructureAuditRecord[];
  lowConfidenceRecords: ExperimentalMarketStructureAuditRecord[];
  allEngineMessageRecords: ExperimentalMarketStructureAuditRecord[];
  engineWarningRecords: ExperimentalMarketStructureAuditRecord[];
  unknownOrInsufficientRecords: ExperimentalMarketStructureAuditRecord[];
  structureDiagnosticRecords: ExperimentalMarketStructureAuditRecord[];
}

export interface MarketStructureCalibrationRecommendation {
  action: MarketStructureCalibrationRecommendationAction;
  message: string;
}

export interface MarketStructureCalibrationEvaluation {
  overallStatus: MarketStructureCalibrationOverallStatus;
  gates: MarketStructureCalibrationGate[];
  recommendation: MarketStructureCalibrationRecommendation;
  recordGroups: MarketStructureCalibrationRecordGroups;
}

function getFailureRecords(
  audit: ExperimentalMarketStructureAudit,
): ExperimentalMarketStructureAuditRecord[] {
  return audit.records.filter((record) => record.analysisStatus === "error");
}

function getLowConfidenceRecords(
  audit: ExperimentalMarketStructureAudit,
): ExperimentalMarketStructureAuditRecord[] {
  return audit.records.filter(
    (record) => record.marketStructure?.confidence.label === "low",
  );
}

function getAllEngineMessageRecords(
  audit: ExperimentalMarketStructureAudit,
): ExperimentalMarketStructureAuditRecord[] {
  return audit.records.filter((record) => record.warnings.length > 0);
}

function getEngineWarningRecords(
  audit: ExperimentalMarketStructureAudit,
): ExperimentalMarketStructureAuditRecord[] {
  return audit.records.filter((record) =>
    record.warnings.some(
      (warning) =>
        warning.includes(" warning:") || warning.includes(" error:"),
    ),
  );
}

function getUnknownOrInsufficientStructureRecords(
  audit: ExperimentalMarketStructureAudit,
): ExperimentalMarketStructureAuditRecord[] {
  return audit.records.filter((record) => {
    const structure = record.marketStructure;

    return (
      structure?.state === "insufficient_data" ||
      structure?.trendDirection === "unknown"
    );
  });
}

function getStructureDiagnosticRecords(
  audit: ExperimentalMarketStructureAudit,
): ExperimentalMarketStructureAuditRecord[] {
  return audit.records.filter(
    (record) => (record.marketStructure?.diagnostics.length ?? 0) > 0,
  );
}

function getMissingMarketStructureRecords(
  audit: ExperimentalMarketStructureAudit,
): ExperimentalMarketStructureAuditRecord[] {
  return audit.records.filter((record) => !record.marketStructure);
}

function getPatternInputLeakRecords(
  audit: ExperimentalMarketStructureAudit,
): ExperimentalMarketStructureAuditRecord[] {
  return audit.records.filter(
    (record) => record.patternInputContainsExperimentalMarketStructure,
  );
}

function tradeIndexes(
  records: ExperimentalMarketStructureAuditRecord[],
): number[] {
  return records.map((record) => record.tradeIndex);
}

function buildGate(args: {
  id: MarketStructureCalibrationGateId;
  label: string;
  status: MarketStructureCalibrationGateStatus;
  detail: string;
  records: ExperimentalMarketStructureAuditRecord[];
}): MarketStructureCalibrationGate {
  return {
    id: args.id,
    label: args.label,
    status: args.status,
    detail: args.detail,
    tradeIndexes: tradeIndexes(args.records),
  };
}

function getOverallStatus(
  gates: MarketStructureCalibrationGate[],
): MarketStructureCalibrationOverallStatus {
  if (gates.some((gate) => gate.status === "BLOCKER")) {
    return "BLOCKER";
  }

  if (gates.some((gate) => gate.status === "REVIEW")) {
    return "REVIEW";
  }

  return "PASS";
}

function buildRecommendation(args: {
  audit: ExperimentalMarketStructureAudit;
  recordGroups: MarketStructureCalibrationRecordGroups;
}): MarketStructureCalibrationRecommendation {
  const { audit, recordGroups } = args;
  const { totals } = audit;

  if (totals.totalTrades === 0) {
    return {
      action: "collect_saved_trade_batch",
      message:
        "No trades were provided. Run the audit with a saved-trade batch before making integration decisions.",
    };
  }

  if (totals.patternInputLeakCount > 0) {
    return {
      action: "fix_pattern_input_leak",
      message:
        "Do not promote market structure. Experimental structure leaked into PatternInput and must be fixed first.",
    };
  }

  if (totals.failedTrades > 0 || totals.missingMarketStructureCount > 0) {
    return {
      action: "resolve_failed_or_missing_context",
      message:
        "Keep market structure observational. Resolve failed or missing shared-context cases before using it beyond debug output.",
    };
  }

  if (
    recordGroups.lowConfidenceRecords.length > 0 ||
    recordGroups.unknownOrInsufficientRecords.length > 0 ||
    recordGroups.structureDiagnosticRecords.length > 0 ||
    recordGroups.engineWarningRecords.length > 0
  ) {
    return {
      action: "review_structure_quality",
      message:
        "Keep market structure observational. Review low-confidence, unknown, insufficient-data, diagnostic, or provider-warning examples before deciding whether any fields can graduate.",
    };
  }

  return {
    action: "continue_observational_validation",
    message:
      "No blocking calibration failures were found in this batch. Market structure should still remain observational until a larger real-data sample is reviewed.",
  };
}

export function evaluateMarketStructureCalibration(
  audit: ExperimentalMarketStructureAudit,
): MarketStructureCalibrationEvaluation {
  const failureRecords = getFailureRecords(audit);
  const lowConfidenceRecords = getLowConfidenceRecords(audit);
  const allEngineMessageRecords = getAllEngineMessageRecords(audit);
  const engineWarningRecords = getEngineWarningRecords(audit);
  const unknownOrInsufficientRecords =
    getUnknownOrInsufficientStructureRecords(audit);
  const structureDiagnosticRecords = getStructureDiagnosticRecords(audit);
  const missingMarketStructureRecords = getMissingMarketStructureRecords(audit);
  const patternInputLeakRecords = getPatternInputLeakRecords(audit);

  const recordGroups: MarketStructureCalibrationRecordGroups = {
    failureRecords,
    lowConfidenceRecords,
    allEngineMessageRecords,
    engineWarningRecords,
    unknownOrInsufficientRecords,
    structureDiagnosticRecords,
  };

  const gates: MarketStructureCalibrationGate[] = [
    buildGate({
      id: "pattern_input_isolation",
      label: "PatternInput isolation",
      status: patternInputLeakRecords.length > 0 ? "BLOCKER" : "PASS",
      detail: `${audit.totals.patternInputLeakCount} leak(s)`,
      records: patternInputLeakRecords,
    }),
    buildGate({
      id: "analysis_completion",
      label: "Analysis completion",
      status: failureRecords.length > 0 ? "BLOCKER" : "PASS",
      detail: `${audit.totals.failedTrades} failed trade(s)`,
      records: failureRecords,
    }),
    buildGate({
      id: "market_structure_presence",
      label: "Market-structure presence",
      status: missingMarketStructureRecords.length > 0 ? "BLOCKER" : "PASS",
      detail: `${audit.totals.missingMarketStructureCount} missing read(s)`,
      records: missingMarketStructureRecords,
    }),
    buildGate({
      id: "confidence",
      label: "Confidence",
      status: lowConfidenceRecords.length > 0 ? "REVIEW" : "PASS",
      detail: `${lowConfidenceRecords.length} low-confidence read(s)`,
      records: lowConfidenceRecords,
    }),
    buildGate({
      id: "unknown_or_insufficient_structure",
      label: "Unknown / insufficient structure",
      status: unknownOrInsufficientRecords.length > 0 ? "REVIEW" : "PASS",
      detail: `${unknownOrInsufficientRecords.length} read(s)`,
      records: unknownOrInsufficientRecords,
    }),
    buildGate({
      id: "market_structure_diagnostics",
      label: "Market-structure diagnostics",
      status: structureDiagnosticRecords.length > 0 ? "REVIEW" : "PASS",
      detail: `${structureDiagnosticRecords.length} read(s) with diagnostic(s)`,
      records: structureDiagnosticRecords,
    }),
    buildGate({
      id: "provider_engine_warnings",
      label: "Provider / engine warnings",
      status: engineWarningRecords.length > 0 ? "REVIEW" : "PASS",
      detail: `${engineWarningRecords.length} trade(s) with warning/error messages`,
      records: engineWarningRecords,
    }),
  ];

  return {
    overallStatus: getOverallStatus(gates),
    gates,
    recommendation: buildRecommendation({ audit, recordGroups }),
    recordGroups,
  };
}
