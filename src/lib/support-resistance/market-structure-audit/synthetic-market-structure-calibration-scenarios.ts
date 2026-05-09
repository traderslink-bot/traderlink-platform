import type {
  ExperimentalMarketStructureAudit,
  ExperimentalMarketStructureAuditRecord,
  ExperimentalMarketStructureAuditTotals,
  ExperimentalMarketStructureSummary,
} from "./build-experimental-market-structure-audit";
import {
  evaluateMarketStructureCalibration,
  type MarketStructureCalibrationEvaluation,
} from "./evaluate-market-structure-calibration";

export type SyntheticMarketStructureCalibrationScenarioId =
  | "clean_pass"
  | "low_confidence_review"
  | "provider_warning_review"
  | "missing_structure_blocker"
  | "pattern_input_leak_blocker"
  | "failed_analysis_blocker";

export interface SyntheticMarketStructureCalibrationScenario {
  id: SyntheticMarketStructureCalibrationScenarioId;
  description: string;
  audit: ExperimentalMarketStructureAudit;
}

export interface EvaluatedSyntheticMarketStructureCalibrationScenario
  extends SyntheticMarketStructureCalibrationScenario {
  evaluation: MarketStructureCalibrationEvaluation;
}

const SCENARIO_DESCRIPTIONS: Record<
  SyntheticMarketStructureCalibrationScenarioId,
  string
> = {
  clean_pass:
    "Clean shared-engine output with high-confidence market structure and no warning/error messages.",
  low_confidence_review:
    "Shared engine returns market structure, but confidence, trend, and diagnostics require human review.",
  provider_warning_review:
    "Shared engine completes analysis, but provider or engine warning messages require review.",
  missing_structure_blocker:
    "Analysis completes but market structure is missing, so promotion must be blocked.",
  pattern_input_leak_blocker:
    "Experimental market structure leaked into PatternInput, which blocks promotion.",
  failed_analysis_blocker:
    "Trade analysis failed, so the batch cannot be used for calibration decisions.",
};

function baseMarketStructure(): ExperimentalMarketStructureSummary {
  return {
    symbol: "ABCD",
    timeframe: "5m",
    asOfTimestamp: 1_777_653_000_000,
    state: "base_building",
    trendDirection: "uptrend",
    trendCounts: {
      higherLowCount: 2,
      lowerHighCount: 0,
      higherHighCount: 2,
      lowerLowCount: 0,
    },
    confidence: {
      label: "high",
      score: 0.9,
      reasons: ["enough confirmed pivots"],
    },
    range: null,
    pivotEvent: null,
    pivotCounts: {
      confirmedHighs: 3,
      confirmedLows: 3,
    },
    latestSwingHigh: null,
    latestSwingLow: null,
    traderLine: "5m structure is building constructively.",
    diagnostics: [],
  };
}

function baseRecord(
  overrides: Partial<ExperimentalMarketStructureAuditRecord> = {},
): ExperimentalMarketStructureAuditRecord {
  return {
    tradeIndex: 0,
    symbol: "ABCD",
    sessionDate: "2026-05-01",
    tradeDirection: "long",
    candleSource: "levels_system_trade_window",
    analysisStatus: "ok",
    supportResistanceMode: "levels_system",
    errorMessage: null,
    marketStructure: baseMarketStructure(),
    levelCounts: {
      support: 3,
      resistance: 2,
    },
    detectedPatternIds: ["entry_near_trade_low"],
    normalizedPatternIds: ["entry_near_trade_low"],
    patternInputContainsExperimentalMarketStructure: false,
    warnings: [],
    ...overrides,
  };
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function buildTotals(
  records: ExperimentalMarketStructureAuditRecord[],
): ExperimentalMarketStructureAuditTotals {
  const totals: ExperimentalMarketStructureAuditTotals = {
    totalTrades: records.length,
    successfulTrades: 0,
    failedTrades: 0,
    missingMarketStructureCount: 0,
    stateCounts: {},
    trendDirectionCounts: {},
    confidenceCounts: {},
    diagnosticCodeCounts: {},
    patternInputLeakCount: 0,
    tradesWithWarningsCount: 0,
    totalSupportLevels: 0,
    totalResistanceLevels: 0,
  };

  for (const record of records) {
    if (record.analysisStatus === "ok") {
      totals.successfulTrades += 1;
    } else {
      totals.failedTrades += 1;
    }

    if (record.marketStructure) {
      increment(totals.stateCounts, record.marketStructure.state);
      increment(
        totals.trendDirectionCounts,
        record.marketStructure.trendDirection,
      );
      increment(
        totals.confidenceCounts,
        record.marketStructure.confidence.label,
      );

      for (const diagnostic of record.marketStructure.diagnostics) {
        increment(totals.diagnosticCodeCounts, diagnostic.code);
      }
    } else {
      totals.missingMarketStructureCount += 1;
    }

    if (record.patternInputContainsExperimentalMarketStructure) {
      totals.patternInputLeakCount += 1;
    }

    if (record.warnings.length > 0) {
      totals.tradesWithWarningsCount += 1;
    }

    totals.totalSupportLevels += record.levelCounts.support;
    totals.totalResistanceLevels += record.levelCounts.resistance;
  }

  return totals;
}

function buildAudit(
  records: ExperimentalMarketStructureAuditRecord[],
): ExperimentalMarketStructureAudit {
  return {
    generatedAt: "2026-05-02T00:00:00.000Z",
    observationalOnly: true,
    totals: buildTotals(records),
    records,
  };
}

export function buildSyntheticMarketStructureCalibrationScenario(
  id: SyntheticMarketStructureCalibrationScenarioId,
): SyntheticMarketStructureCalibrationScenario {
  const record = baseRecord();

  if (id === "low_confidence_review") {
    record.marketStructure = {
      ...baseMarketStructure(),
      state: "insufficient_data",
      trendDirection: "unknown",
      confidence: {
        label: "low",
        score: 0.1,
        reasons: ["not enough confirmed pivots"],
      },
      diagnostics: [
        {
          code: "insufficient_candles",
          severity: "warning",
          message: "Not enough 5m candles were available.",
        },
      ],
    };
  }

  if (id === "provider_warning_review") {
    record.warnings = [
      "levels-system warning: Provider returned partial candle data.",
    ];
  }

  if (id === "missing_structure_blocker") {
    record.marketStructure = null;
  }

  if (id === "pattern_input_leak_blocker") {
    record.patternInputContainsExperimentalMarketStructure = true;
  }

  if (id === "failed_analysis_blocker") {
    record.analysisStatus = "error";
    record.errorMessage = "Synthetic shared engine failure.";
    record.marketStructure = null;
    record.detectedPatternIds = [];
    record.normalizedPatternIds = [];
    record.levelCounts = {
      support: 0,
      resistance: 0,
    };
  }

  return {
    id,
    description: SCENARIO_DESCRIPTIONS[id],
    audit: buildAudit([record]),
  };
}

export function buildSyntheticMarketStructureCalibrationScenarios(): SyntheticMarketStructureCalibrationScenario[] {
  return (
    [
      "clean_pass",
      "low_confidence_review",
      "provider_warning_review",
      "missing_structure_blocker",
      "pattern_input_leak_blocker",
      "failed_analysis_blocker",
    ] as const
  ).map(buildSyntheticMarketStructureCalibrationScenario);
}

export function evaluateSyntheticMarketStructureCalibrationScenarios(): EvaluatedSyntheticMarketStructureCalibrationScenario[] {
  return buildSyntheticMarketStructureCalibrationScenarios().map(
    (scenario) => ({
      ...scenario,
      evaluation: evaluateMarketStructureCalibration(scenario.audit),
    }),
  );
}
