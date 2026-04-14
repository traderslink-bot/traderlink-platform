// 2026-04-12 08:20 AM America/Toronto
// PURPOSE:
// Defines the raw market context immediately around a specific execution.
// This file preserves factual candle context before and after the execution only.

// file name execution-context-window.ts

import type { Candle } from "./candle";
import type { Execution } from "./execution";

export interface ExecutionContextWindow {
  execution: Execution;
  candlesBeforeExecution: Candle[];
  candlesAfterExecution: Candle[];
}