// 2026-04-12 10:18 AM America/Toronto
// PURPOSE:
// Provides sample manual execution data for raw trade timeline fixture testing.
// This file stays outside the raw trade timeline core and is intended for controlled test input.

import type { ManualExecutionRow } from "../../execution-sources/manual/map-manual-execution-to-normalize-execution-input";

export const sampleManualExecutions: ManualExecutionRow[] = [
  {
    symbol: "ABCD",
    timestamp: "2024-04-12T13:33:30.000Z",
    side: "buy",
    shares: 100,
    price: 1.185,
    executionIndex: 0,
    orderId: "order-001",
    brokerExecutionId: "exec-001",
    notes: "Initial entry",
    source: "manual",
  },
  {
    symbol: "ABCD",
    timestamp: "2024-04-12T13:36:15.000Z",
    side: "buy",
    shares: 50,
    price: 1.255,
    executionIndex: 1,
    orderId: "order-002",
    brokerExecutionId: "exec-002",
    notes: "Second buy",
    source: "manual",
  },
  {
    symbol: "ABCD",
    timestamp: "2024-04-12T13:39:10.000Z",
    side: "sell",
    shares: 150,
    price: 1.295,
    executionIndex: 2,
    orderId: "order-003",
    brokerExecutionId: "exec-003",
    notes: "Full exit",
    source: "manual",
  },
];