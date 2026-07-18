import {
  buildStartingInventoryForExecution,
  executionLedgerGroupKey,
  orderCanonicalExecutions,
  resolveExecutionRelationships,
  type AnalyticalPnlReconstructionInput,
  type CanonicalExecutionEnvelope,
  type FifoLedgerInput,
  type StartingInventoryContract,
} from "../domain";

export function buildSyntheticAnalyticalPnlInput(
  executions: readonly CanonicalExecutionEnvelope[],
  state: "proven_flat" | "unknown" = "proven_flat",
): AnalyticalPnlReconstructionInput {
  const relationshipResolution = resolveExecutionRelationships(executions);
  const starts = new Map<string, StartingInventoryContract>();
  for (const execution of relationshipResolution.retainedExecutions) {
    if (execution.content.stableInstrumentKey === null) continue;
    const key = executionLedgerGroupKey(execution);
    if (starts.has(key)) continue;
    const startingInventory = buildStartingInventoryForExecution(execution, state);
    if (!startingInventory.ok) {
      throw new Error(startingInventory.error.reasonCodes.join(","));
    }
    starts.set(key, startingInventory.value);
  }
  return {
    relationshipResolution,
    startingInventories: [...starts.values()],
  };
}

export function buildSyntheticFifoLedgerInput(
  executions: readonly CanonicalExecutionEnvelope[],
  startingInventory?: StartingInventoryContract,
): FifoLedgerInput {
  if (executions.length === 0) {
    throw new Error("ti_v3_synthetic_fifo_input_empty");
  }
  const relationshipResolution = resolveExecutionRelationships(executions);
  const ledgerGroupKey = executionLedgerGroupKey(executions[0]);
  let selectedStartingInventory = startingInventory;
  if (selectedStartingInventory === undefined) {
    const built = buildStartingInventoryForExecution(executions[0], "proven_flat");
    if (!built.ok) {
      throw new Error(built.error.reasonCodes.join(","));
    }
    selectedStartingInventory = built.value;
  }
  return {
    relationshipResolution,
    ledgerGroupKey,
    ordering: orderCanonicalExecutions(
      relationshipResolution.retainedExecutions.filter(
        (execution) => executionLedgerGroupKey(execution) === ledgerGroupKey,
      ),
    ),
    startingInventory: selectedStartingInventory,
  };
}
