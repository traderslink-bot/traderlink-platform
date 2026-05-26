import { describe, expect, it } from "vitest";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { runTradeAnalysisFromLevelsSystemCandles } from "../run-trade-analysis";
import {
  buildTradeAnalysisSummary,
  type TradeAnalysisSummary,
} from "../summary/build-trade-analysis-summary";

function buildStableSummarySnapshot(summary: TradeAnalysisSummary) {
  return {
    contractVersion: summary.contractVersion,
    symbol: summary.symbol,
    sessionDate: summary.sessionDate,
    sessionBucket: summary.sessionBucket,
    tradeDirection: summary.tradeDirection,
    candleSource: summary.candleSource,
    candleCounts: summary.candleCounts,
    supportResistance: {
      supportCount: summary.supportResistance.supportCount,
      resistanceCount: summary.supportResistance.resistanceCount,
      strongestSupportPrice: summary.supportResistance.strongestSupportPrice,
      strongestResistancePrice:
        summary.supportResistance.strongestResistancePrice,
      nearestAtFirstExecution:
        summary.supportResistance.nearestAtFirstExecution,
    },
    marketStructure: summary.marketStructure,
    patterns: {
      detectedCount: summary.patterns.detectedCount,
      normalizedCount: summary.patterns.normalizedCount,
      topAnchorPattern: summary.patterns.topAnchorPattern,
      primaryPatternIds: summary.patterns.primaryPatterns.map(
        (pattern) => pattern.patternId,
      ),
    },
  };
}

describe("trade analysis summary snapshots", () => {
  it("keeps a stable snapshot of the shared candle analysis summary contract", async () => {
    const result = await runTradeAnalysisFromLevelsSystemCandles({
      trade: {
        symbol: sampleCreateRawTradeTimelineInput.symbol,
        tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
        executions: sampleCreateRawTradeTimelineInput.executions,
        sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
        tradeWindow: {
          timeframe: "1m",
          preTradeMinutes: 60,
          postTradeMinutes: 60,
        },
      },
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    });
    const summary = buildTradeAnalysisSummary(result);

    expect(buildStableSummarySnapshot(summary)).toMatchInlineSnapshot(`
      {
        "candleCounts": {
          "postTrade": 6,
          "preTrade": 64,
          "trade": 7,
        },
        "candleSource": "levels_system_trade_window",
        "contractVersion": "trade_analysis_summary_v1",
        "marketStructure": {
          "confidenceLabel": "high",
          "confidenceScore": 0.95,
          "diagnosticCodes": [],
          "observationalOnly": true,
          "observed": true,
          "state": "base_building",
          "timeframe": "5m",
          "traderLine": "5m structure is building inside the 1.10-1.36 range.",
          "trendDirection": "uptrend",
          "usedForScoring": false,
        },
        "patterns": {
          "detectedCount": 21,
          "normalizedCount": 21,
          "primaryPatternIds": [
            "constructive_recovery_after_early_adversity",
            "entry_near_support_structure",
            "high_capture_exit_structure",
            "multi_build_full_exit",
          ],
          "topAnchorPattern": {
            "family": "scaling_quality",
            "patternId": "constructive_recovery_after_early_adversity",
            "patternName": "Constructive Recovery After Early Adversity",
            "role": "primary_candidate",
          },
        },
        "sessionBucket": "market_open",
        "sessionDate": "2024-04-12",
        "supportResistance": {
          "nearestAtFirstExecution": {
            "executionIndex": 0,
            "executionPrice": 1.185,
            "nearestResistancePrice": 1.277,
            "nearestSupportPrice": 1.1753,
            "occurredInOpenAir": false,
            "roomToNearestResistancePct": 7.7637,
            "roomToNearestSupportPct": 0.8186,
          },
          "resistanceCount": 3,
          "strongestResistancePrice": 1.31,
          "strongestSupportPrice": 1.1753,
          "supportCount": 7,
        },
        "symbol": "ABCD",
        "tradeDirection": "long",
      }
    `);
  });
});
