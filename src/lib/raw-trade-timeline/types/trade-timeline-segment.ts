// 2026-04-12 08:39 AM America/Toronto
// PURPOSE:
// Defines factual timeline segments for the raw trade timeline system.
// Segments preserve what happened before the first execution,
// between executions, and after the final execution.
// This file stays strictly factual and interpretation free.

// file name trade-timeline-segment.ts

import type { Candle } from "./candle";

export type TradeTimelineSegmentType =
  | "pre_trade"
  | "between_executions"
  | "post_trade";

export interface TradeTimelineSegment {
  segmentIndex: number;
  segmentType: TradeTimelineSegmentType;
  startTimestamp: string | null;
  endTimestamp: string | null;
  candles: Candle[];
  startExecutionIndex: number | null;
  endExecutionIndex: number | null;
}