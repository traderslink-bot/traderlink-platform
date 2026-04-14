// 2026-04-12 10:18 AM America/Toronto
// PURPOSE:
// Provides a complete sample input path for createRawTradeTimeline using Yahoo-style candles
// and manual execution data.
// This file is intended for test and inspection only.

import { mapManualExecutionsToNormalizeExecutionInputs } from "../../execution-sources/manual/map-manual-execution-to-normalize-execution-input";
import { mapYahooChartResponseToNormalizeCandleInputs } from "../../market-data-sources/yahoo/map-yahoo-candle-to-normalize-candle-input";
import type { SessionContext } from "../types/session-context";
import { sampleManualExecutions } from "./sample-manual-executions";
import { sampleYahooChartResponse } from "./sample-yahoo-candles";

function splitCandlesIntoTradePhases<T extends { timestamp: string | Date }>(
  candles: T[],
  executionTimestamps: string[],
): {
  preTradeCandles: T[];
  tradeCandles: T[];
  postTradeCandles: T[];
} {
  const firstExecutionTime = Date.parse(executionTimestamps[0]);
  const lastExecutionTime = Date.parse(
    executionTimestamps[executionTimestamps.length - 1],
  );

  const preTradeCandles: T[] = [];
  const tradeCandles: T[] = [];
  const postTradeCandles: T[] = [];

  candles.forEach((candle) => {
    const time =
  candle.timestamp instanceof Date
    ? candle.timestamp.getTime()
    : Date.parse(candle.timestamp);

    if (time < firstExecutionTime) {
      preTradeCandles.push(candle);
    } else if (time > lastExecutionTime) {
      postTradeCandles.push(candle);
    } else {
      tradeCandles.push(candle);
    }
  });

  return {
    preTradeCandles,
    tradeCandles,
    postTradeCandles,
  };
}

export const sampleSessionContext: SessionContext = {
  sessionBucket: "market_open",
  sessionDate: "2024-04-12",
};

const allNormalizeReadyCandles = mapYahooChartResponseToNormalizeCandleInputs({
  response: sampleYahooChartResponse,
  timeframe: "1m",
  symbol: "ABCD",
  source: "yahoo",
});

const executionTimestamps = sampleManualExecutions.map((e) =>
  new Date(e.timestamp).toISOString(),
);

const splitCandles = splitCandlesIntoTradePhases(
  allNormalizeReadyCandles,
  executionTimestamps,
);

export const sampleCreateRawTradeTimelineInput = {
  symbol: "ABCD",
  timeframe: "1m",
  tradeDirection: "long" as const,
  preTradeCandles: splitCandles.preTradeCandles,
  tradeCandles: splitCandles.tradeCandles,
  postTradeCandles: splitCandles.postTradeCandles,
  executions: mapManualExecutionsToNormalizeExecutionInputs({
    rows: sampleManualExecutions,
    defaultSource: "manual",
  }),
  sessionContext: sampleSessionContext,
  executionWindowCandlesBeforeCount: 2,
  executionWindowCandlesAfterCount: 2,
};