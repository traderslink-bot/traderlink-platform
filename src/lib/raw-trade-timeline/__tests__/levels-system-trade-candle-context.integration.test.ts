import { describe, expect, it } from "vitest";
import {
  CandleFetchService,
  type HistoricalCandleProvider,
} from "levels-system-phase1/support-resistance-engine";
import { buildPatternInput } from "../../pattern-input/builders/build-pattern-input";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";
import { createRawTradeTimelineWithLevelsSystemCandles } from "../builders/create-raw-trade-timeline-with-levels-system-candles";
import {
  SampleTradeAlignedHistoricalCandleProvider,
  buildSampleLevelsSystemSupportResistanceOptions,
} from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";

class OneMinuteUnavailableHistoricalCandleProvider
  implements HistoricalCandleProvider
{
  readonly providerName = "stub" as const;
  private readonly delegate = new SampleTradeAlignedHistoricalCandleProvider();

  async fetchCandles(
    request: Parameters<HistoricalCandleProvider["fetchCandles"]>[0],
    plan: Parameters<HistoricalCandleProvider["fetchCandles"]>[1],
  ) {
    if (request.timeframe === "1m") {
      throw new Error("1m candles unavailable in fixture");
    }

    return this.delegate.fetchCandles(request, plan);
  }
}

class PriceDisconnectedHistoricalCandleProvider
  implements HistoricalCandleProvider
{
  readonly providerName = "stub" as const;
  private readonly delegate = new SampleTradeAlignedHistoricalCandleProvider();

  async fetchCandles(
    request: Parameters<HistoricalCandleProvider["fetchCandles"]>[0],
    plan: Parameters<HistoricalCandleProvider["fetchCandles"]>[1],
  ) {
    const result = await this.delegate.fetchCandles(request, plan);

    if (request.timeframe === "daily" || request.timeframe === "4h") {
      return result;
    }

    return {
      ...result,
      candles: result.candles.map((candle) => ({
        ...candle,
        open: candle.open * 100,
        high: candle.high * 100,
        low: candle.low * 100,
        close: candle.close * 100,
      })),
    };
  }
}

function timestampToIso(timestamp: string | Date): string {
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
}

function addMinutes(timestamp: string | Date, minutes: number): string {
  const parsed = timestamp instanceof Date ? timestamp.getTime() : Date.parse(timestamp);

  return new Date(parsed + minutes * 60_000).toISOString();
}

describe("createRawTradeTimelineWithLevelsSystemCandles", () => {
  it("uses levels-system for trade-window candles and shared structure", async () => {
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
    ).toBe("1m");
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindow.fallbackUsed,
    ).toBe(false);
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindow.dynamicLevels,
    ).toMatchObject({
      vwap: expect.any(Number),
      ema9: expect.any(Number),
      ema20: expect.any(Number),
    });
    expect(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindowFacts
        .maxFavorableMovePct,
    ).toEqual(expect.any(Number));
    expect(result.levelsSystemTradeWindowFacts).toBe(
      result.levelsSystemTradeAnalysisCandleContext.tradeWindowFacts,
    );
    expect(result.levelsSystemMarketFacts).toBe(
      result.levelsSystemTradeAnalysisCandleContext.marketFacts,
    );
    expect(result.levelsSystemMarketFacts?.contractVersion).toBe(
      "market_facts.trade_review.v2",
    );
    expect(result.levelsSystemMarketFacts?.executionSnapshots).toHaveLength(
      sampleCreateRawTradeTimelineInput.executions.length,
    );
    expect(
      result.levelsSystemMarketFacts?.executionSnapshots[0]?.relations.map(
        (relation) => relation.benchmarkId,
      ),
    ).toEqual(
      expect.arrayContaining([
        "nearest_daily_4h_support",
        "nearest_daily_4h_resistance",
      ]),
    );
    expect(result.levelsSystemExecutionRelations).toHaveLength(
      sampleCreateRawTradeTimelineInput.executions.length,
    );
    expect(result.levelsSystemExecutionRelations?.map((execution) => ({
      timestamp: execution.timestampIso,
      price: execution.price,
      quantity: execution.quantity,
      side: execution.side,
    }))).toEqual(
      sampleCreateRawTradeTimelineInput.executions.map((execution) => ({
        timestamp: execution.timestamp,
        price: Number(execution.price),
        quantity: Number(execution.shares),
        side: execution.side,
      })),
    );
    expect(result.timeline.preTradeCandles.length).toBeGreaterThan(0);
    expect(result.timeline.tradeCandles.length).toBeGreaterThan(0);
    expect(result.timeline.postTradeCandles.length).toBeGreaterThan(0);
    expect(
      result.timeline.allCandles.every(
        (candle) => candle.source === "levels-system",
      ),
    ).toBe(true);
    expect(result.supportLevels?.length).toBeGreaterThan(0);
    expect(result.resistanceLevels?.length).toBeGreaterThan(0);
    expect(
      result.supportLevels?.every((level) =>
        level.timeframeSources.some(
          (timeframe) => timeframe === "daily" || timeframe === "4h",
        ),
      ),
    ).toBe(true);
    expect(
      result.resistanceLevels?.every((level) =>
        level.timeframeSources.some(
          (timeframe) => timeframe === "daily" || timeframe === "4h",
        ),
      ),
    ).toBe(true);
    expect(result.experimentalMarketStructure).toMatchObject({
      symbol: "ABCD",
      timeframe: "5m",
      state: "base_building",
    });
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("levels-system trade-window info"),
      ]),
    );

    const patternInput = buildPatternInput(result);

    expect(
      "experimentalMarketStructure" in
        patternInput.supportResistanceContext,
    ).toBe(false);
    expect(
      patternInput.supportResistanceContext
        .hadSupportResistanceContextAvailable,
    ).toBe(true);
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromVwapPct,
    ).toBeNull();
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromEma9Pct,
    ).toBeNull();
    expect(
      patternInput.supportResistanceContext.firstEntryDistanceFromEma20Pct,
    ).toBeNull();
    expect(patternInput.tradeStructure.tradeMfePct).toBe(
      Number(
        (
          result.levelsSystemTradeAnalysisCandleContext.tradeWindowFacts
            .maxFavorableMovePct! / 100
        ).toFixed(6),
      ),
    );
  }, 15_000);

  it("passes bounded trade timestamps and derives asOf from trade end plus post window", async () => {
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
      ...buildSampleLevelsSystemSupportResistanceOptions(),
      asOfTimestamp: undefined,
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
    expect(new Date(context.tradeWindow.requestedEndTimestamp).toISOString()).toBe(
      expectedAsOfTimestamp,
    );
  });

  it("consumes 1m preferred and 5m fallback diagnostics from levels-system", async () => {
    const result = await createRawTradeTimelineWithLevelsSystemCandles({
      symbol: sampleCreateRawTradeTimelineInput.symbol,
      tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
      executions: sampleCreateRawTradeTimelineInput.executions,
      sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
      levelsSystem: {
        ...buildSampleLevelsSystemSupportResistanceOptions(),
        fetchService: new CandleFetchService(
          new OneMinuteUnavailableHistoricalCandleProvider(),
        ),
      },
      tradeWindow: {
        timeframe: "1m",
        preTradeMinutes: 60,
        postTradeMinutes: 60,
      },
    });
    const context = result.levelsSystemTradeAnalysisCandleContext;

    expect(context.tradeWindow.requestedTimeframe).toBe("1m");
    expect(context.tradeWindow.timeframe).toBe("5m");
    expect(context.tradeWindow.fallbackUsed).toBe(true);
    expect(context.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        "trade_window_one_minute_unavailable",
        "trade_window_fell_back_to_5m",
      ]),
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("1m trade-window candles were unavailable"),
        expect.stringContaining("5m fallback candles were used"),
      ]),
    );
  });

  it("ignores disconnected trade-window candles and keeps execution-only excursion facts", async () => {
    const result = await createRawTradeTimelineWithLevelsSystemCandles({
      symbol: sampleCreateRawTradeTimelineInput.symbol,
      tradeDirection: sampleCreateRawTradeTimelineInput.tradeDirection,
      executions: sampleCreateRawTradeTimelineInput.executions,
      sessionContext: sampleCreateRawTradeTimelineInput.sessionContext,
      levelsSystem: {
        ...buildSampleLevelsSystemSupportResistanceOptions(),
        fetchService: new CandleFetchService(
          new PriceDisconnectedHistoricalCandleProvider(),
        ),
      },
      tradeWindow: {
        timeframe: "1m",
        preTradeMinutes: 60,
        postTradeMinutes: 60,
      },
    });
    const executionPrices = sampleCreateRawTradeTimelineInput.executions.map(
      (execution) => Number(execution.price),
    );
    const firstExecutionPrice = executionPrices[0];
    const expectedExecutionOnlyMfePct = Number(
      (
        (Math.max(...executionPrices) - firstExecutionPrice) /
        firstExecutionPrice
      ).toFixed(6),
    );

    expect(result.timeline.tradeCandles).toHaveLength(0);
    expect(result.levelsSystemTradeWindowFacts).toBeUndefined();
    expect(result.tradeDerivedSignals?.tradeMfePct).toBe(
      expectedExecutionOnlyMfePct,
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Trade-window candles were ignored"),
      ]),
    );
  });

  it("does not synthesize implicit levels-system stub candles for production trade-window evidence", async () => {
    await expect(createRawTradeTimelineWithLevelsSystemCandles({
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
    })).rejects.toThrow("Durable candle warehouse miss");
  });
});
