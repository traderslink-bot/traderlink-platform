import {
  executionLedgerGroupKey,
  orderCanonicalExecutions,
  resolveExecutionRelationships,
  type CanonicalExecutionEnvelope,
  type ExecutionRelationshipClassification,
} from "../execution";
import {
  FIFO_ANALYTICAL_PNL_POLICY_VERSION,
  type AnalyticalPnlReconstructionResult,
  type ReconstructionBlockedState,
} from "./reconstruction-result";
import { runFifoPositionLedger } from "./fifo-position-ledger";

export function reconstructAnalyticalPnl(
  executions: readonly CanonicalExecutionEnvelope[],
  relationships: readonly ExecutionRelationshipClassification[] = [],
): AnalyticalPnlReconstructionResult {
  const allDigests = executions.map((execution) => execution.canonicalContentDigest);
  const resolution = resolveExecutionRelationships(executions, relationships);
  if (resolution.globalBlocks.length > 0) {
    const blockedStates: ReconstructionBlockedState[] =
      resolution.globalBlocks.map((block) => ({
        code: block.code,
        executionDigest: block.executionDigests[0] ?? null,
        relatedExecutionDigests: block.executionDigests,
      }));
    return {
      status: "blocked",
      policyVersion: FIFO_ANALYTICAL_PNL_POLICY_VERSION,
      ledgers: [],
      blockedStates,
      limitations: [...new Set(blockedStates.map((state) => state.code))].sort(),
      inputExecutionDigests: allDigests,
    };
  }

  const groupBlocks = new Map<string, typeof resolution.groupBlocks>();
  for (const block of resolution.groupBlocks) {
    const existing = groupBlocks.get(block.groupKey) ?? [];
    groupBlocks.set(block.groupKey, [...existing, block]);
  }
  const groups = new Map<string, CanonicalExecutionEnvelope[]>();
  for (const execution of resolution.retainedExecutions) {
    const key = executionLedgerGroupKey(execution);
    const group = groups.get(key) ?? [];
    group.push(execution);
    groups.set(key, group);
  }

  const ledgers = [];
  const blockedStates: ReconstructionBlockedState[] = [];
  const limitations = new Set<string>();
  const allGroupKeys = new Set([...groups.keys(), ...groupBlocks.keys()]);
  for (const key of [...allGroupKeys].sort()) {
    const blocks = groupBlocks.get(key) ?? [];
    if (blocks.length > 0) {
      for (const block of blocks) {
        blockedStates.push({
          code: block.code,
          executionDigest: block.executionDigests[0] ?? null,
          relatedExecutionDigests: block.executionDigests,
        });
        limitations.add(block.code);
      }
      continue;
    }
    const ordering = orderCanonicalExecutions(groups.get(key) ?? []);
    const result = runFifoPositionLedger({ ordering });
    ledgers.push(...result.ledgers);
    blockedStates.push(...result.blockedStates);
    result.limitations.forEach((limitation) => limitations.add(limitation));
  }
  return {
    status: blockedStates.length > 0 ? "blocked" : "completed",
    policyVersion: FIFO_ANALYTICAL_PNL_POLICY_VERSION,
    ledgers,
    blockedStates,
    limitations: [...limitations].sort(),
    inputExecutionDigests: allDigests,
  };
}
