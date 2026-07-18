import {
  type CanonicalExecutionEnvelope,
  type ExecutionRelationshipClassification,
  orderCanonicalExecutions,
} from "../execution";
import { canonicalBytesEqual } from "../identity";
import {
  FIFO_ANALYTICAL_PNL_POLICY_VERSION,
  type AnalyticalPnlReconstructionResult,
  type ReconstructionBlockedState,
} from "./reconstruction-result";
import { runFifoPositionLedger } from "./fifo-position-ledger";

function groupKey(execution: CanonicalExecutionEnvelope): string {
  return [
    execution.content.canonicalOwnerKey,
    execution.content.canonicalAccountKey,
    execution.content.stableInstrumentKey ?? "unresolved",
    execution.content.currency,
  ].join(":");
}

export function reconstructAnalyticalPnl(
  executions: readonly CanonicalExecutionEnvelope[],
  relationships: readonly ExecutionRelationshipClassification[] = [],
): AnalyticalPnlReconstructionResult {
  const allDigests = executions.map((execution) => execution.canonicalContentDigest);
  const digestBytes = new Map<string, Uint8Array>();
  for (const execution of executions) {
    const existing = digestBytes.get(execution.canonicalContentDigest);
    if (existing !== undefined && !canonicalBytesEqual(existing, execution.canonicalBytes)) {
      return {
        status: "blocked",
        policyVersion: FIFO_ANALYTICAL_PNL_POLICY_VERSION,
        ledgers: [],
        blockedStates: [
          {
            code: "ti_v3_reconstruction_digest_collision",
            executionDigest: execution.canonicalContentDigest,
          },
        ],
        limitations: ["ti_v3_reconstruction_digest_collision"],
        inputExecutionDigests: allDigests,
      };
    }
    digestBytes.set(execution.canonicalContentDigest, execution.canonicalBytes);
  }

  const groups = new Map<string, CanonicalExecutionEnvelope[]>();
  for (const execution of executions) {
    const key = groupKey(execution);
    const group = groups.get(key) ?? [];
    group.push(execution);
    groups.set(key, group);
  }

  const ledgers = [];
  const blockedStates: ReconstructionBlockedState[] = [];
  const limitations = new Set<string>();
  for (const key of [...groups.keys()].sort()) {
    const ordering = orderCanonicalExecutions(groups.get(key) ?? []);
    const result = runFifoPositionLedger({
      ordering,
      relationshipClassifications: relationships,
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
