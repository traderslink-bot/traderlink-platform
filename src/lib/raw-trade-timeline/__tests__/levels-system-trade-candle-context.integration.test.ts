import { describe, expect, it } from "vitest";
import { buildPatternInput } from "../../pattern-input/builders/build-pattern-input";
import { buildSampleLevelsSystemSupportResistanceOptions } from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";
import { createRawTradeTimelineWithLevelsSystemCandles } from "../builders/create-raw-trade-timeline-with-levels-system-candles";

function timestampToIso(timestamp: string | Date): string {
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
}

function addMinutes(timestamp: string | Date, minutes: number): string {
  const parsed =
    timestamp instanceof Date ? timestamp.getTime() : Date.parse(timestamp);

  return new Date(parsed + minutes * 60_000).toISOString();
}

describe("createRawTradeTimelineWithLevelsSystemCandles", () => {
  it("uses supplied candles for v2 trade-window facts without fetching v1 candles", async () => {
    const result = await createRawTradeTimelineWithLevelsSystemCandles({
      symbol: sampleCreateRawTradeTimelineInput.symbol,
      tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
      executions: sampleCreateRawTradeTimelineInput.executions,
      sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      tradeWindow: {
        timeframe: "1m",
        preTradeMinutes: 60,
        postTradeMinutes: 60,
      },
      preTradeCandles: sampleCreateRawTradeTimelineInput.preTradeCandles,
      tradeCandles: sampleCreateRawTradeTimelineInput.tradeCandles,
      postTradeCandles: sampleCreateRawTradeTimelineInput.postTradeCandles,
      executionWindowCandlesBeforeCount: 2,
      executionWindowCandlesAfterCount: 2,
    });

    expect(result.timeline.preTradeCandles.length).toBeGreaterThan(0);
    expect(result.timeline.tradeCandles.length).toBeGreaterThan(0);
    expect(result.timeline.postTradeCandles.length).toBeGreaterThan(0);
    expect(result.levelsSystemTradeWindowFacts).toBeDefined();
    expect(result.levelsSystemTradeWindowFacts?.maxFavorableMovePct).toEqual(
      expect.any(Number),
    );
    expect(result.levelsSystemTradeWindowFacts?.maxAdverseMovePct).toEqual(
      expect.any(Number),
    );
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindow.fetch.provider,
    ).toBe("supplied");
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindow.fetch
        .actualBarsReturned,
    ).toBeGreaterThan(0);
    expect(result.levelsSystemTradeAnalysisCandleContext.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "v2_supplied_candles_used",
          severity: "info",
        }),
      ]),
    );
    expect(result.levelsSystemExecutionRelations).toHaveLength(
      sampleCreateRawTradeTimelineInput.executions.length,
    );
    expect(result.levelsSystemMarketFacts?.executionSnapshots).toHaveLength(
      sampleCreateRawTradeTimelineInput.executions.length,
    );
    expect(result.experimentalMarketStructure).toBeUndefined();
    expect(result.warnings ?? []).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("old trade-window candle-fetching API"),
      ]),
    );

    const patternInput = buildPatternInput(result);

    expect(patternInput.tradeStructure.tradeMfePct).toBe(
      Number(
        (
          (result.levelsSystemTradeWindowFacts?.maxFavorableMovePct ?? 0) / 100
        ).toFixed(6),
      ),
    );
    expect(patternInput.exitContext.postExitCandleCount).toBeGreaterThan(0);
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromVwapPct,
    ).toBeNull();
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromEma9Pct,
    ).toBeNull();
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromEma20Pct,
    ).toBeNull();
  });

  it("hydrates trade-window candles through a configured v2 fetch service", async () => {
    const result = await createRawTradeTimelineWithLevelsSystemCandles({
      symbol: sampleCreateRawTradeTimelineInput.symbol,
      tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
      executions: sampleCreateRawTradeTimelineInput.executions,
      sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      tradeWindow: {
        timeframe: "1m",
        preTradeMinutes: 60,
        postTradeMinutes: 60,
      },
      executionWindowCandlesBeforeCount: 2,
      executionWindowCandlesAfterCount: 2,
    });

    expect(
      result.levelsSystemTradeAnalysisCandleContext.candleFetchingOwnedBy,
    ).toBe("levels-system");
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindow
        .requestedTimeframe,
    ).toBe("5m");
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindow.fallbackUsed,
    ).toBe(false);
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindow.dynamicLevels,
    ).toEqual({
      vwap: null,
      ema9: null,
      ema20: null,
    });
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindowFacts
        .maxFavorableMovePct,
    ).toEqual(expect.any(Number));
    expect(result.levelsSystemTradeWindowFacts).toBeDefined();
    expect(result.levelsSystemExecutionRelations).toHaveLength(
      sampleCreateRawTradeTimelineInput.executions.length,
    );
    expect(result.levelsSystemMarketFacts?.contractVersion).toBe(
      "market_facts.trade_review.v2",
    );
    expect(result.levelsSystemMarketFacts?.executionSnapshots).toHaveLength(
      sampleCreateRawTradeTimelineInput.executions.length,
    );
    expect(result.timeline.preTradeCandles.length).toBeGreaterThan(0);
    expect(result.timeline.tradeCandles.length).toBeGreaterThan(0);
    expect(result.timeline.postTradeCandles.length).toBeGreaterThan(0);
    expect(result.experimentalMarketStructure).toBeUndefined();
    expect(result.warnings ?? []).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("old trade-window candle-fetching API"),
      ]),
    );

    const patternInput = buildPatternInput(result);

    expect(
      "experimentalMarketStructure" in
        patternInput.supportResistanceContext,
    ).toBe(false);
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromVwapPct,
    ).toBeNull();
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromEma9Pct,
    ).toBeNull();
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromEma20Pct,
    ).toBeNull();
  });

  it("keeps execution bounds and reports v2 no-candle diagnostics without fetching v1 candles", async () => {
    const tradeWindow = {
      timeframe: "1m" as const,
      preTradeMinutes: 10,
      postTradeMinutes: 10,
      paddingMinutes: 2,
    };
    const executions = sampleCreateRawTradeTimelineInput.executions;
    const expectedTradeStartTimestamp = timestampToIso(executions[0].timestamp);
    const expectedTradeEndTimestamp = timestampToIso(
      executions[executions.length - 1].timestamp,
    );
    const expectedAsOfTimestamp = addMinutes(expectedTradeEndTimestamp, 12);
    const levelsSystem = {
      sessionDate: sampleCreateRawTradeTimelineInput.sessionContext.sessionDate,
      asOfTimestamp: undefined,
      lookbackBars: {
        daily: 80,
        "4h": 80,
        "5m": 120,
      },
    };

    const result = await createRawTradeTimelineWithLevelsSystemCandles({
      symbol: sampleCreateRawTradeTimelineInput.symbol,
      tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
      executions,
      sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
      levelsSystem,
      tradeWindow,
    });
    const context = result.levelsSystemTradeAnalysisCandleContext;

    expect(new Date(context.tradeWindow.tradeStartTimestamp).toISOString()).toBe(
      expectedTradeStartTimestamp,
    );
    expect(new Date(context.tradeWindow.tradeEndTimestamp).toISOString()).toBe(
      expectedTradeEndTimestamp,
    );
    expect(new Date(context.asOfTimestamp!).toISOString()).toBe(
      expectedAsOfTimestamp,
    );
    expect(
      new Date(context.tradeWindow.requestedEndTimestamp).toISOString(),
    ).toBe(expectedTradeEndTimestamp);
    expect(context.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "v2_supplied_candles_required",
          severity: "warning",
        }),
      ]),
    );
  });

  it("does not synthesize implicit levels-system stub candles for production trade-window evidence", async () => {
    const result = await createRawTradeTimelineWithLevelsSystemCandles({
      symbol: sampleCreateRawTradeTimelineInput.symbol,
      tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
      executions: sampleCreateRawTradeTimelineInput.executions,
      sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
      levelsSystem: {
        sessionDate: sampleCreateRawTradeTimelineInput.sessionContext.sessionDate,
        asOfTimestamp: addMinutes(
          sampleCreateRawTradeTimelineInput.executions.at(-1)!.timestamp,
          65,
        ),
        lookbackBars: {
          daily: 80,
          "4h": 80,
          "5m": 120,
        },
      },
      tradeWindow: {
        timeframe: "1m",
        preTradeMinutes: 60,
        postTradeMinutes: 60,
      },
    });

    expect(result.timeline.allCandles).toHaveLength(0);
    expect(result.levelsSystemTradeWindowFacts).toBeUndefined();
    expect(result.levelsSystemTradeAnalysisCandleContext.tradeWindowFacts).toEqual(
      expect.objectContaining({
        highestHighDuringTrade: null,
        lowestLowDuringTrade: null,
        maxFavorableMovePct: null,
        maxAdverseMovePct: null,
      }),
    );
  });
});
