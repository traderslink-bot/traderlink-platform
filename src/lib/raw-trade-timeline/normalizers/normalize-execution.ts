// 2026-04-12 09:03 AM America/Toronto
// PURPOSE:
// Normalizes raw execution-like input into the canonical Execution shape used by the
// raw trade timeline system.
// This file stays strictly factual and interpretation free.

import type { Execution, ExecutionSide } from "../types/execution";

export interface NormalizeExecutionInput {
  symbol: string;
  timestamp: string | Date;
  side: string;
  shares: number | string;
  price: number | string;
  executionIndex?: number | string | null;
  orderId?: string | null;
  brokerExecutionId?: string | null;
  notes?: string | null;
  source?: string | null;
}

function normalizeTimestamp(value: string | Date, fieldName: string): string {
  if (value instanceof Date) {
    const iso = value.toISOString();

    if (!iso) {
      throw new Error(`Invalid ${fieldName}: unable to convert Date to ISO string.`);
    }

    return iso;
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`Invalid ${fieldName}: value is empty.`);
  }

  const parsedTime = Date.parse(normalized);

  if (Number.isNaN(parsedTime)) {
    throw new Error(`Invalid ${fieldName}: "${value}" is not a valid date/time.`);
  }

  return new Date(parsedTime).toISOString();
}

function normalizeRequiredNumber(
  value: number | string,
  fieldName: string,
): number {
  const normalized =
    typeof value === "number" ? value : Number.parseFloat(value.trim());

  if (!Number.isFinite(normalized)) {
    throw new Error(`Invalid ${fieldName}: "${String(value)}" is not a valid number.`);
  }

  return normalized;
}

function normalizeOptionalInteger(
  value: number | string | null | undefined,
  fallbackValue: number,
  fieldName: string,
): number {
  if (value === null || value === undefined || value === "") {
    return fallbackValue;
  }

  const normalized =
    typeof value === "number" ? value : Number.parseInt(value.trim(), 10);

  if (!Number.isInteger(normalized)) {
    throw new Error(`Invalid ${fieldName}: "${String(value)}" is not a valid integer.`);
  }

  if (normalized < 0) {
    throw new Error(`Invalid ${fieldName}: ${normalized} cannot be negative.`);
  }

  return normalized;
}

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeSide(value: string): ExecutionSide {
  const normalized = value.trim().toLowerCase();

  if (normalized !== "buy" && normalized !== "sell") {
    throw new Error(`Invalid execution side: "${value}" must be "buy" or "sell".`);
  }

  return normalized;
}

export function normalizeExecution(
  input: NormalizeExecutionInput,
  fallbackExecutionIndex = 0,
): Execution {
  const symbol = input.symbol.trim().toUpperCase();

  if (!symbol) {
    throw new Error("Invalid execution symbol: value is empty.");
  }

  const shares = normalizeRequiredNumber(input.shares, "shares");
  const price = normalizeRequiredNumber(input.price, "price");

  if (shares <= 0) {
    throw new Error(`Invalid execution shares: ${shares} must be greater than zero.`);
  }

  if (price <= 0) {
    throw new Error(`Invalid execution price: ${price} must be greater than zero.`);
  }

  return {
    symbol,
    timestamp: normalizeTimestamp(input.timestamp, "timestamp"),
    side: normalizeSide(input.side),
    shares,
    price,
    executionIndex: normalizeOptionalInteger(
      input.executionIndex,
      fallbackExecutionIndex,
      "executionIndex",
    ),
    orderId: normalizeOptionalString(input.orderId),
    brokerExecutionId: normalizeOptionalString(input.brokerExecutionId),
    notes: normalizeOptionalString(input.notes),
    source: normalizeOptionalString(input.source),
  };
}

export function normalizeExecutions(inputs: NormalizeExecutionInput[]): Execution[] {
  const normalized = inputs.map((input, index) => normalizeExecution(input, index));

  normalized.sort((left, right) => {
    const timeDifference = Date.parse(left.timestamp) - Date.parse(right.timestamp);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.executionIndex - right.executionIndex;
  });

  return normalized.map((execution, index) => ({
    ...execution,
    executionIndex: index,
  }));
}