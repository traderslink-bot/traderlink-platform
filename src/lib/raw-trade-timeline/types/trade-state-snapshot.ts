// 2026-04-12 08:20 AM America/Toronto
// PURPOSE:
// Defines the deterministic trade state immediately after a specific execution.
// This belongs to the raw timeline layer because it is derived directly from execution history,
// not from behavioral interpretation, pattern logic, or coaching logic.

export interface TradeStateSnapshot {
  executionIndex: number;
  timestamp: string;
  positionSize: number;
  averageEntryPrice: number | null;
  realizedPnl: number;
  isFlat: boolean;
}