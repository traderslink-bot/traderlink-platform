import {
  executionLedgerGroupKey,
  isCompleteExecutionRelationshipResolution,
  orderCanonicalExecutions,
  type CanonicalExecutionEnvelope,
  type CompleteExecutionRelationshipResolution,
} from "../execution";
import {
  FIFO_ANALYTICAL_PNL_POLICY_VERSION,
  type AnalyticalPnlReconstructionResult,
  type ReconstructionBlockedState,
} from "./reconstruction-result";
import { runFifoPositionLedger } from "./fifo-position-ledger";
import {
  isVerifiedStartingInventoryContract,
  startingInventoryLedgerGroupKey,
  type StartingInventoryContract,
} from "./starting-inventory";

export interface AnalyticalPnlReconstructionInput {
  readonly relationshipResolution: CompleteExecutionRelationshipResolution;
  readonly startingInventories: readonly StartingInventoryContract[];
}

export function reconstructAnalyticalPnl(
  input: AnalyticalPnlReconstructionInput,
): AnalyticalPnlReconstructionResult {
  if (!isCompleteExecutionRelationshipResolution(input.relationshipResolution)) {
    return {
      status: "blocked",
      policyVersion: FIFO_ANALYTICAL_PNL_POLICY_VERSION,
      ledgers: [],
      blockedStates: [
        {
          code: "ti_v3_reconstruction_relationship_coverage_incomplete",
          executionDigest: null,
        },
      ],
      limitations: ["ti_v3_reconstruction_relationship_coverage_incomplete"],
      inputExecutionDigests: [],
    };
  }
  const resolution = input.relationshipResolution;
  const allDigests = resolution.coverageReceipt.inputExecutionDigests;
  if (
    resolution.coverageReceipt.state !== "complete" ||
    resolution.coverageReceipt.classifiedCandidateCount !==
      resolution.coverageReceipt.candidateRelationshipCount
  ) {
    return {
      status: "blocked",
      policyVersion: FIFO_ANALYTICAL_PNL_POLICY_VERSION,
      ledgers: [],
      blockedStates: [
        {
          code: "ti_v3_reconstruction_relationship_coverage_incomplete",
          executionDigest: null,
        },
      ],
      limitations: ["ti_v3_reconstruction_relationship_coverage_incomplete"],
      inputExecutionDigests: allDigests,
    };
  }
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
  const startsByGroup = new Map<string, StartingInventoryContract[]>();
  for (const startingInventory of input.startingInventories) {
    if (!isVerifiedStartingInventoryContract(startingInventory)) continue;
    const key = startingInventoryLedgerGroupKey(startingInventory.ledgerIdentity);
    const starts = startsByGroup.get(key) ?? [];
    starts.push(startingInventory);
    startsByGroup.set(key, starts);
  }

  const ledgers = [];
  const blockedStates: ReconstructionBlockedState[] = [];
  const limitations = new Set<string>();
  const allGroupKeys = new Set([
    ...groups.keys(),
    ...groupBlocks.keys(),
    ...startsByGroup.keys(),
  ]);
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
    const groupExecutions = groups.get(key) ?? [];
    const unsafeInstrument = groupExecutions.find(
      (execution) =>
        execution.content.instrumentResolutionState !== "resolved" ||
        execution.content.stableInstrumentKey === null,
    );
    if (unsafeInstrument !== undefined) {
      blockedStates.push({
        code: "ti_v3_reconstruction_instrument_unresolved",
        executionDigest: unsafeInstrument.canonicalContentDigest,
      });
      limitations.add("ti_v3_reconstruction_instrument_unresolved");
      continue;
    }
    const startingInventories = startsByGroup.get(key) ?? [];
    if (
      startingInventories.length !== 1 ||
      startingInventories[0].state === "unknown"
    ) {
      blockedStates.push({
        code: "ti_v3_reconstruction_prior_inventory_required",
        executionDigest: groupExecutions[0]?.canonicalContentDigest ?? null,
      });
      limitations.add("ti_v3_reconstruction_prior_inventory_required");
      continue;
    }
    const ordering = orderCanonicalExecutions(groupExecutions);
    const result = runFifoPositionLedger({
      relationshipResolution: resolution,
      ledgerGroupKey: key,
      ordering,
      startingInventory: startingInventories[0],
    });
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
