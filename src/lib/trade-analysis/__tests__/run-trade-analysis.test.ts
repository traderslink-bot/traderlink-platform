import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import {
  buildLevelsSystemSupportResistanceOptions,
  readLevelsSystemRuntimeConfigFromEnv,
} from "../../support-resistance/levels-system-runtime-options";
import {
  runTradeAnalysis,
  runTradeAnalysisFromLevelsSystemCandles,
  runTradeAnalysisWithProvidedCandlesOnly,
} from "../run-trade-analysis";

describe("runTradeAnalysis", () => {
  it("uses the shared levels-system support/resistance path by default for app-facing analysis", async () => {
    const result = await runTradeAnalysis({
      trade: sampleCreateRawTradeTimelineInput,
      supportResistance: {
        levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      },
    });

    const detectedPatternIds = result.detectedPatterns.detectedPatterns.map(
      (pattern) => pattern.patternId,
    );

    expect(result.supportResistanceMode).toBe("levels_system");
    expect(result.rawTradeTimeline.supportLevels?.length).toBeGreaterThanOrEqual(4);
    expect(result.rawTradeTimeline.resistanceLevels?.length).toBeGreaterThanOrEqual(2);
    expect(result.rawTradeTimeline.experimentalMarketStructure).toMatchObject({
      symbol: "ABCD",
      timeframe: "5m",
      state: expect.any(String),
    });
    expect(
      result.patternInput.supportResistanceContext
        .hadSupportResistanceContextAvailable,
    ).toBe(true);
    expect(
      result.patternInput.supportResistanceContext
        .hadInsufficientCandleDataForStructuralContext,
    ).toBe(false);
    expect(detectedPatternIds).toContain("entry_far_from_support_structure");
    expect(detectedPatternIds).toContain("advantaged_entry_structure");
    expect(detectedPatternIds).toContain("balanced_position_management");
  });

  it("keeps the provided-candles-only path explicit without building local market structure", async () => {
    const result = await runTradeAnalysisWithProvidedCandlesOnly(
      sampleCreateRawTradeTimelineInput,
    );

    expect(result.supportResistanceMode).toBe("provided_candles_only");
    expect(result.rawTradeTimeline.supportLevels).toBeUndefined();
    expect(result.rawTradeTimeline.resistanceLevels).toBeUndefined();
    expect(result.rawTradeTimeline.dynamicLevels).toBeUndefined();
    expect(result.rawTradeTimeline.executionLevelRelations).toBeUndefined();
    expect(result.rawTradeTimeline.experimentalMarketStructure).toBeUndefined();
    expect(
      result.patternInput.supportResistanceContext
        .hadSupportResistanceContextAvailable,
    ).toBe(false);
  });

  it("can request trade-window candles from levels-system before analysis", async () => {
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

    expect(result.supportResistanceMode).toBe("levels_system");
    expect(result.rawTradeTimeline.timeline.preTradeCandles.length).toBeGreaterThan(
      0,
    );
    expect(result.rawTradeTimeline.timeline.tradeCandles.length).toBeGreaterThan(
      0,
    );
    expect(result.rawTradeTimeline.timeline.postTradeCandles.length).toBeGreaterThan(
      0,
    );
    expect(result.rawTradeTimeline.supportLevels?.length).toBeGreaterThanOrEqual(4);
    expect(result.rawTradeTimeline.resistanceLevels?.length).toBeGreaterThanOrEqual(2);
    expect(result.rawTradeTimeline.experimentalMarketStructure).toMatchObject({
      state: "base_building",
      trend: expect.objectContaining({
        direction: "uptrend",
      }),
    });
    expect(
      result.detectedPatterns.detectedPatterns.map(
        (pattern) => pattern.patternId,
      ),
    ).toContain("entry_near_support_structure");
    expect(
      "experimentalMarketStructure" in
        result.patternInput.supportResistanceContext,
    ).toBe(false);
  });
});

describe("levels-system runtime options", () => {
  it("uses the bundled IBKR candle warehouse for replay when no env override is set", () => {
    const config = readLevelsSystemRuntimeConfigFromEnv({});

    expect(config.preferredProvider).toBe("ibkr");
    expect(config.warehouseMode).toBe("replay");
    expect(config.warehouseDirectoryPath).toBeDefined();
    expect(existsSync(`${config.warehouseDirectoryPath}/ibkr`)).toBe(true);
    expect(config.warehouseDirectoryPath).toContain("data");
    expect(config.warehouseDirectoryPath).toContain("candles");
  });

  it("normalizes provider and lookback runtime config without owning candle fetching", () => {
    const config = readLevelsSystemRuntimeConfigFromEnv({
      LEVELS_SYSTEM_PROVIDER: "stub",
      LEVELS_SYSTEM_DAILY_LOOKBACK_BARS: "260",
      LEVELS_SYSTEM_4H_LOOKBACK_BARS: "120",
      LEVELS_SYSTEM_5M_LOOKBACK_BARS: "90",
    });

    expect(config).toEqual({
      preferredProvider: "stub",
      lookbackBars: {
        daily: 260,
        "4h": 120,
        "5m": 90,
      },
    });
    expect(buildLevelsSystemSupportResistanceOptions(config)).toMatchObject(
      config,
    );
  });

  it("enables on-demand IBKR warehouse hydration from runtime env", () => {
    const config = readLevelsSystemRuntimeConfigFromEnv({
      LEVELS_SYSTEM_ON_DEMAND_HYDRATION: "true",
      LEVELS_SYSTEM_WAREHOUSE_MODE: "replay",
      LEVELS_SYSTEM_IBKR_HOST: "127.0.0.1",
      LEVELS_SYSTEM_IBKR_PORT: "7497",
      LEVELS_SYSTEM_IBKR_CLIENT_ID: "177",
      LEVELS_SYSTEM_IBKR_TIMEOUT_MS: "12345",
      LEVELS_SYSTEM_IBKR_CONNECTION_TIMEOUT_MS: "2345",
    });

    expect(config.preferredProvider).toBe("ibkr");
    expect(config.warehouseMode).toBe("read_write");
    expect(config.fetchServiceOptions?.providerName).toBe("ibkr");
    expect(config.fetchServiceOptions?.ibkrTimeoutMs).toBe(12345);
    expect(config.fetchServiceOptions?.provider?.providerName).toBe("ibkr");
  });

  it("rejects unsupported provider names before calling the shared package", () => {
    expect(() =>
      readLevelsSystemRuntimeConfigFromEnv({
        LEVELS_SYSTEM_PROVIDER: "local_chart_reader",
      }),
    ).toThrow(/Expected ibkr or stub/);
    expect(() =>
      readLevelsSystemRuntimeConfigFromEnv({
        LEVELS_SYSTEM_PROVIDER: "external_vendor",
      }),
    ).toThrow(/Expected ibkr or stub/);
  });
});
