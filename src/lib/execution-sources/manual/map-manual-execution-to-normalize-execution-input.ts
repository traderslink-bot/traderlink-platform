// 2026-04-12 10:01 AM America/Toronto
// PURPOSE:
// Maps manual or CSV-like execution data into the NormalizeExecutionInput shape expected by the raw timeline normalizer.
// This file stays outside the raw trade timeline layer so execution source formats remain replaceable.

//file name map-manual-execution-to-normalize-execution-input.ts

import type { NormalizeExecutionInput } from "../../raw-trade-timeline/normalizers/normalize-execution";
import type { ProviderExecution } from "../types/provider-execution";

export interface ManualExecutionRow extends ProviderExecution {}

export interface MapManualExecutionToNormalizeExecutionInputArgs {
  row: ManualExecutionRow;
}

export interface MapManualExecutionsToNormalizeExecutionInputsArgs {
  rows: ManualExecutionRow[];
  defaultSource?: string;
}

function normalizeTimestamp(value: string | number | Date): string | Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  return value;
}

export function mapManualExecutionToNormalizeExecutionInput(
  args: MapManualExecutionToNormalizeExecutionInputArgs,
): NormalizeExecutionInput {
  const { row } = args;

  return {
    symbol: row.symbol.trim().toUpperCase(),
    timestamp: normalizeTimestamp(row.timestamp),
    side: row.side.trim().toLowerCase(),
    shares: row.shares,
    price: row.price,
    executionIndex: row.executionIndex ?? undefined,
    orderId: row.orderId ?? undefined,
    brokerExecutionId: row.brokerExecutionId ?? undefined,
    notes: row.notes ?? undefined,
    source: row.source ?? undefined,
  };
}

export function mapManualExecutionsToNormalizeExecutionInputs(
  args: MapManualExecutionsToNormalizeExecutionInputsArgs,
): NormalizeExecutionInput[] {
  const { rows, defaultSource } = args;

  return rows.map((row) =>
    mapManualExecutionToNormalizeExecutionInput({
      row: {
        ...row,
        source: row.source ?? defaultSource ?? "manual",
      },
    }),
  );
}