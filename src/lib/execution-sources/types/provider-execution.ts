// 2026-04-12 10:01 AM America/Toronto
// PURPOSE:
// Defines provider-facing execution source contracts that live outside the raw trade timeline layer.
// These types represent upstream execution data before it is normalized into the system's canonical Execution shape.

// file name provider-execution.ts

export type ProviderExecutionTimestamp = string | number | Date;

export interface ProviderExecution {
  symbol: string;
  timestamp: ProviderExecutionTimestamp;
  side: string;
  shares: number | string;
  price: number | string;
  executionIndex?: number | string | null;
  orderId?: string | null;
  brokerExecutionId?: string | null;
  commission?: number | string | null;
  fees?: number | string | null;
  netAmount?: number | string | null;
  currency?: string | null;
  notes?: string | null;
  source?: string | null;
}

export interface ProviderExecutionBatch {
  symbol: string;
  executions: ProviderExecution[];
  source?: string | null;
}
