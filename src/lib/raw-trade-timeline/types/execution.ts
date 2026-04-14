// 2026-04-12 08:20 AM America/Toronto
// PURPOSE:
// Defines the raw normalized execution shape for the trade timeline system.
// This file stays strictly factual and interpretation free.
// Important: this layer does not label executions as entry, add, partial, or final exit.

// file name execution.ts

export type ExecutionSide = "buy" | "sell";

export type ExecutionSource = string;

export interface Execution {
  symbol: string;
  timestamp: string;
  side: ExecutionSide;
  shares: number;
  price: number;
  executionIndex: number;
  orderId?: string;
  brokerExecutionId?: string;
  notes?: string;
  source?: ExecutionSource;
}