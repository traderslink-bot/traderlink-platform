// 2026-04-12 09:22 AM America/Toronto
// PURPOSE:
// Builds the factual timeline segments for the raw trade timeline system.
// Segments preserve what happened before the first execution,
// between executions, and after the final execution.
// This file stays strictly factual and interpretation free.

import type { Candle } from "../types/candle";
import type { Execution } from "../types/execution";
import type {
  TradeTimelineSegment,
  TradeTimelineSegmentType,
} from "../types/trade-timeline-segment";

function getSegmentBoundaryTimestamp(
  candles: Candle[],
  boundary: "start" | "end",
): string | null {
  if (candles.length === 0) {
    return null;
  }

  return boundary === "start"
    ? candles[0].timestamp
    : candles[candles.length - 1].timestamp;
}

function createSegment(
  segmentIndex: number,
  segmentType: TradeTimelineSegmentType,
  candles: Candle[],
  startExecutionIndex: number | null,
  endExecutionIndex: number | null,
): TradeTimelineSegment {
  return {
    segmentIndex,
    segmentType,
    startTimestamp: getSegmentBoundaryTimestamp(candles, "start"),
    endTimestamp: getSegmentBoundaryTimestamp(candles, "end"),
    candles,
    startExecutionIndex,
    endExecutionIndex,
  };
}

export interface BuildTradeTimelineSegmentsArgs {
  preTradeCandles: Candle[];
  tradeCandles: Candle[];
  postTradeCandles: Candle[];
  executions: Execution[];
}

export function buildTradeTimelineSegments(
  args: BuildTradeTimelineSegmentsArgs,
): TradeTimelineSegment[] {
  const { preTradeCandles, tradeCandles, postTradeCandles, executions } = args;

  const segments: TradeTimelineSegment[] = [];
  let segmentIndex = 0;

  segments.push(
    createSegment(segmentIndex, "pre_trade", preTradeCandles, null, null),
  );
  segmentIndex += 1;

  if (executions.length >= 2) {
    for (let index = 0; index < executions.length - 1; index += 1) {
      const currentExecution = executions[index];
      const nextExecution = executions[index + 1];
      const currentExecutionTime = Date.parse(currentExecution.timestamp);
      const nextExecutionTime = Date.parse(nextExecution.timestamp);

      const candlesBetweenExecutions = tradeCandles.filter((candle) => {
        const candleTime = Date.parse(candle.timestamp);

        return candleTime > currentExecutionTime && candleTime < nextExecutionTime;
      });

      segments.push(
        createSegment(
          segmentIndex,
          "between_executions",
          candlesBetweenExecutions,
          currentExecution.executionIndex,
          nextExecution.executionIndex,
        ),
      );
      segmentIndex += 1;
    }
  }

  segments.push(
    createSegment(segmentIndex, "post_trade", postTradeCandles, null, null),
  );

  return segments;
}