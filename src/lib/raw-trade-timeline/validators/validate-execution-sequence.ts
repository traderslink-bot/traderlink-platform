// 2026-04-12 09:22 AM America/Toronto
// PURPOSE:
// Validates an execution sequence used by the raw trade timeline system.
// This file stays strictly factual and interpretation free.
// It validates structure and order only. It does not label execution intent.

import type { Execution } from "../types/execution";

export interface ValidateExecutionSequenceArgs {
  executions: Execution[];
  expectedSymbol?: string;
  sequenceLabel: string;
  requireAtLeastOneExecution?: boolean;
}

export function validateExecutionSequence(
  args: ValidateExecutionSequenceArgs,
): string[] {
  const {
    executions,
    expectedSymbol,
    sequenceLabel,
    requireAtLeastOneExecution = true,
  } = args;

  const warnings: string[] = [];
  const seenExecutionIndexes = new Set<number>();

  if (requireAtLeastOneExecution && executions.length === 0) {
    throw new Error(`${sequenceLabel} must include at least one execution.`);
  }

  for (let index = 0; index < executions.length; index += 1) {
    const execution = executions[index];
    const parsedTimestamp = Date.parse(execution.timestamp);

    if (!execution.symbol.trim()) {
      throw new Error(
        `Invalid ${sequenceLabel} execution at index ${index}: symbol is empty.`,
      );
    }

    if (expectedSymbol && execution.symbol !== expectedSymbol) {
      throw new Error(
        `Invalid ${sequenceLabel} execution at index ${index}: symbol "${execution.symbol}" does not match expected symbol "${expectedSymbol}".`,
      );
    }

    if (Number.isNaN(parsedTimestamp)) {
      throw new Error(
        `Invalid ${sequenceLabel} execution at index ${index}: timestamp "${execution.timestamp}" is invalid.`,
      );
    }

    if (execution.side !== "buy" && execution.side !== "sell") {
      throw new Error(
        `Invalid ${sequenceLabel} execution at index ${index}: side "${execution.side}" is invalid.`,
      );
    }

    if (!Number.isFinite(execution.shares) || execution.shares <= 0) {
      throw new Error(
        `Invalid ${sequenceLabel} execution at index ${index}: shares must be a finite value greater than zero.`,
      );
    }

    if (!Number.isFinite(execution.price) || execution.price <= 0) {
      throw new Error(
        `Invalid ${sequenceLabel} execution at index ${index}: price must be a finite value greater than zero.`,
      );
    }

    if (
      !Number.isInteger(execution.executionIndex) ||
      execution.executionIndex < 0
    ) {
      throw new Error(
        `Invalid ${sequenceLabel} execution at index ${index}: executionIndex must be a non negative integer.`,
      );
    }

    if (seenExecutionIndexes.has(execution.executionIndex)) {
      throw new Error(
        `Invalid ${sequenceLabel} execution sequence: duplicate executionIndex ${execution.executionIndex} found.`,
      );
    }

    seenExecutionIndexes.add(execution.executionIndex);

    if (index > 0) {
      const previousExecution = executions[index - 1];
      const previousTimestamp = Date.parse(previousExecution.timestamp);

      if (parsedTimestamp < previousTimestamp) {
        throw new Error(
          `Invalid ${sequenceLabel} execution sequence: executions are not sorted in ascending timestamp order at index ${index}.`,
        );
      }

      if (
        parsedTimestamp === previousTimestamp &&
        execution.executionIndex < previousExecution.executionIndex
      ) {
        throw new Error(
          `Invalid ${sequenceLabel} execution sequence: execution ordering is inconsistent at index ${index}.`,
        );
      }
    }
  }

  if (!requireAtLeastOneExecution && executions.length === 0) {
    warnings.push(`${sequenceLabel} is empty.`);
  }

  return warnings;
}