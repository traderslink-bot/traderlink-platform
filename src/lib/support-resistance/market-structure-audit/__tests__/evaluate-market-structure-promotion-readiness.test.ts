import { describe, expect, it } from "vitest";
import type {
  ExperimentalMarketStructureAudit,
  ExperimentalMarketStructureAuditRecord,
  ExperimentalMarketStructureAuditTotals,
  ExperimentalMarketStructureSummary,
} from "../build-experimental-market-structure-audit";
import { evaluateMarketStructurePromotionReadiness } from "../evaluate-market-structure-promotion-readiness";

function baseMarketStructure(
  overrides: Partial<ExperimentalMarketStructureSummary> = {},
): ExperimentalMarketStructureSummary {
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
      score: 0.92,
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
    ...overrides,
  };
}

function baseRecord(
  index: number,
  overrides: Partial<ExperimentalMarketStructureAuditRecord> = {},
): ExperimentalMarketStructureAuditRecord {
  return {
    tradeIndex: index,
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
    detectedPatternIds: [],
    normalizedPatternIds: [],
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

function buildCleanAudit(count: number): ExperimentalMarketStructureAudit {
  return buildAudit(
    Array.from({ length: count }, (_, index) => baseRecord(index)),
  );
}

describe("evaluateMarketStructurePromotionReadiness", () => {
  it("keeps clean synthetic or tiny batches observational until real data is reviewed", () => {
    const decision = evaluateMarketStructurePromotionReadiness({
      audit: buildCleanAudit(1),
      realSavedTradeBatchReviewed: false,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(decision).toMatchObject({
      contractVersion: "market_structure_promotion_readiness_v1",
      promotionStatus: "needs_real_saved_trade_batch",
      allowedUses: ["debug_output", "batch_calibration"],
      metrics: {
        totalTrades: 1,
        patternInputLeakCount: 0,
      },
    });
    expect(decision.prohibitedUses).toContain("scoring");
    expect(decision.prohibitedUses).toContain("final_user_facing_conclusions");
  });

  it("allows only limited internal review after a clean reviewed real batch", () => {
    const decision = evaluateMarketStructurePromotionReadiness({
      audit: buildCleanAudit(30),
      realSavedTradeBatchReviewed: true,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(decision.promotionStatus).toBe("ready_for_limited_internal_use");
    expect(decision.allowedUses).toEqual([
      "debug_output",
      "batch_calibration",
      "limited_internal_review",
    ]);
    expect(decision.prohibitedUses).toContain("pattern_detection");
    expect(decision.prohibitedUses).toContain("trade_grading");
  });

  it("blocks promotion when market structure leaks into PatternInput", () => {
    const records = Array.from({ length: 30 }, (_, index) =>
      baseRecord(index, {
        patternInputContainsExperimentalMarketStructure: index === 0,
      }),
    );
    const decision = evaluateMarketStructurePromotionReadiness({
      audit: buildAudit(records),
      realSavedTradeBatchReviewed: true,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(decision.promotionStatus).toBe("blocked");
    expect(decision.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pattern_input_isolation",
          status: "BLOCKER",
        }),
      ]),
    );
  });

  it("requires review when enough real data exists but structure quality is weak", () => {
    const records = Array.from({ length: 30 }, (_, index) =>
      baseRecord(index, {
        marketStructure:
          index < 6
            ? baseMarketStructure({
                confidence: {
                  label: "low",
                  score: 0.2,
                  reasons: ["not enough confirmed pivots"],
                },
              })
            : baseMarketStructure(),
      }),
    );
    const decision = evaluateMarketStructurePromotionReadiness({
      audit: buildAudit(records),
      realSavedTradeBatchReviewed: true,
      generatedAt: "2026-05-02T00:00:00.000Z",
    });

    expect(decision.promotionStatus).toBe("review_required");
    expect(decision.metrics.lowConfidenceRate).toBe(0.2);
    expect(decision.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "confidence_quality",
          status: "REVIEW",
        }),
      ]),
    );
  });
});
