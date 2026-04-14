// 2026-04-12 08:39 AM America/Toronto
// PURPOSE:
// Defines the assembled raw trade timeline object for one trade analysis.
// This object preserves the factual timeline structure of the trade without
// introducing judgments, patterns, coaching, or scoring.

// file name trade-timeline.ts

import type { Candle } from "./candle";
import type { Execution } from "./execution";
import type { ExecutionContextWindow } from "./execution-context-window";
import type { SessionContext } from "./session-context";
import type { TradeDirection } from "./trade-timeline-input";
import type { TradeStateSeries } from "./trade-state-series";
import type { TradeTimelineSegment } from "./trade-timeline-segment";

export interface TradeTimeline {
  symbol: string;
  timeframe: string;
  tradeDirection: TradeDirection;
  sessionContext: SessionContext;
  executions: Execution[];
  preTradeCandles: Candle[];
  tradeCandles: Candle[];
  postTradeCandles: Candle[];
  allCandles: Candle[];
  executionContextWindows: ExecutionContextWindow[];
  tradeStateSeries: TradeStateSeries;
  timelineSegments: TradeTimelineSegment[];
}