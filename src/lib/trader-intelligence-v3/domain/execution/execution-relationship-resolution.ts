import type { CanonicalExecutionDigest } from "../identity";
import {
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionEnvelope,
} from "./canonical-execution";
import {
  classifyExecutionRelationship,
  type ExecutionRelationshipClassification,
  type ExecutionRelationshipState,
} from "./execution-relationship";

export const EXECUTION_RELATIONSHIP_COVERAGE_VERSION =
  "ti_v3_execution_relationship_coverage_v1" as const;

export type ExecutionRelationshipResolutionBlockCode =
  | "ti_v3_reconstruction_correction_unresolved"
  | "ti_v3_reconstruction_digest_collision"
  | "ti_v3_reconstruction_reexport_unresolved"
  | "ti_v3_reconstruction_possible_duplicate_unresolved"
  | "ti_v3_reconstruction_manual_review_required"
  | "ti_v3_reconstruction_relationship_group_mismatch"
  | "ti_v3_reconstruction_execution_envelope_integrity_invalid"
  | "ti_v3_reconstruction_relationship_coverage_incomplete";

export interface ExecutionRelationshipGroupBlock {
  readonly groupKey: string;
  readonly code: ExecutionRelationshipResolutionBlockCode;
  readonly executionDigests: readonly CanonicalExecutionDigest[];
}

export interface ExecutionRelationshipPairReceipt {
  readonly leftInputIndex: number;
  readonly rightInputIndex: number;
  readonly classification: ExecutionRelationshipClassification;
}

export interface ExecutionRelationshipCoverageReceipt {
  readonly version: typeof EXECUTION_RELATIONSHIP_COVERAGE_VERSION;
  readonly state: "complete" | "blocked_invalid_input";
  readonly inputExecutionCount: number;
  readonly expectedPairCount: number;
  readonly classifiedPairCount: number;
  readonly inputExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly pairs: readonly ExecutionRelationshipPairReceipt[];
}

export interface CompleteExecutionRelationshipResolution {
  readonly retainedExecutions: readonly CanonicalExecutionEnvelope[];
  readonly groupBlocks: readonly ExecutionRelationshipGroupBlock[];
  readonly globalBlocks: readonly {
    readonly code: ExecutionRelationshipResolutionBlockCode;
    readonly executionDigests: readonly CanonicalExecutionDigest[];
  }[];
  readonly coverageReceipt: ExecutionRelationshipCoverageReceipt;
}

const completeRelationshipResolutions =
  new WeakSet<CompleteExecutionRelationshipResolution>();

export function executionLedgerGroupKey(
  execution: CanonicalExecutionEnvelope,
): string {
  return [
    execution.content.canonicalOwnerKey,
    execution.content.canonicalAccountKey,
    execution.content.stableInstrumentKey ??
      `unresolved_${execution.content.rawBrokerSymbol}`,
    execution.content.currency,
  ].join(":");
}

function stateBlockCode(
  state: ExecutionRelationshipState,
): ExecutionRelationshipResolutionBlockCode | null {
  switch (state) {
    case "same_execution_reexported":
      return "ti_v3_reconstruction_reexport_unresolved";
    case "broker_correction_or_bust":
      return "ti_v3_reconstruction_correction_unresolved";
    case "possible_duplicate_ambiguous":
      return "ti_v3_reconstruction_possible_duplicate_unresolved";
    case "digest_collision_detected":
      return "ti_v3_reconstruction_digest_collision";
    case "manual_review_required":
      return "ti_v3_reconstruction_manual_review_required";
    case "exact_duplicate_same_source":
    case "legitimate_repeated_fill":
    case "distinct_execution":
      return null;
  }
}

function expectedPairCount(inputCount: number): number {
  return (inputCount * (inputCount - 1)) / 2;
}

function freezeClassification(
  classification: ExecutionRelationshipClassification,
): ExecutionRelationshipClassification {
  return Object.freeze({
    ...classification,
    reasonCodes: Object.freeze([...classification.reasonCodes]),
    evidence: Object.freeze([...classification.evidence]),
  });
}

function protectResolution(
  input: CompleteExecutionRelationshipResolution,
): CompleteExecutionRelationshipResolution {
  const resolution = Object.freeze(input);
  completeRelationshipResolutions.add(resolution);
  return resolution;
}

export function isCompleteExecutionRelationshipResolution(
  input: unknown,
): input is CompleteExecutionRelationshipResolution {
  return (
    typeof input === "object" &&
    input !== null &&
    completeRelationshipResolutions.has(
      input as CompleteExecutionRelationshipResolution,
    )
  );
}

export function resolveExecutionRelationships(
  executions: readonly CanonicalExecutionEnvelope[],
): CompleteExecutionRelationshipResolution {
  const verifiedExecutions: CanonicalExecutionEnvelope[] = [];
  const inputDigests: CanonicalExecutionDigest[] = [];
  for (const execution of executions) {
    const verified = verifyCanonicalExecutionEnvelope(execution);
    if (!verified.ok) {
      const candidateDigest =
        typeof execution?.canonicalContentDigest === "string"
          ? [execution.canonicalContentDigest]
          : [];
      const globalBlock = Object.freeze({
        code: "ti_v3_reconstruction_execution_envelope_integrity_invalid" as const,
        executionDigests: Object.freeze(candidateDigest),
      });
      const receipt: ExecutionRelationshipCoverageReceipt = Object.freeze({
        version: EXECUTION_RELATIONSHIP_COVERAGE_VERSION,
        state: "blocked_invalid_input",
        inputExecutionCount: executions.length,
        expectedPairCount: expectedPairCount(executions.length),
        classifiedPairCount: 0,
        inputExecutionDigests: Object.freeze([...inputDigests, ...candidateDigest]),
        pairs: Object.freeze([]),
      });
      return protectResolution({
        retainedExecutions: Object.freeze([]),
        groupBlocks: Object.freeze([]),
        globalBlocks: Object.freeze([globalBlock]),
        coverageReceipt: receipt,
      });
    }
    verifiedExecutions.push(verified.value);
    inputDigests.push(verified.value.canonicalContentDigest);
  }

  const groupBlocks = new Map<
    string,
    Map<ExecutionRelationshipResolutionBlockCode, Set<CanonicalExecutionDigest>>
  >();
  const pairReceipts: ExecutionRelationshipPairReceipt[] = [];
  const suppressedInputIndexes = new Set<number>();

  const addGroupBlock = (
    groupKey: string,
    code: ExecutionRelationshipResolutionBlockCode,
    digests: readonly CanonicalExecutionDigest[],
  ): void => {
    const blocks = groupBlocks.get(groupKey) ?? new Map();
    const blockDigests = blocks.get(code) ?? new Set<CanonicalExecutionDigest>();
    digests.forEach((digest) => blockDigests.add(digest));
    blocks.set(code, blockDigests);
    groupBlocks.set(groupKey, blocks);
  };

  for (let leftIndex = 0; leftIndex < verifiedExecutions.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < verifiedExecutions.length;
      rightIndex += 1
    ) {
      const left = verifiedExecutions[leftIndex];
      const right = verifiedExecutions[rightIndex];
      const classification = freezeClassification(
        classifyExecutionRelationship(left, right),
      );
      pairReceipts.push(
        Object.freeze({
          leftInputIndex: leftIndex,
          rightInputIndex: rightIndex,
          classification,
        }),
      );
      if (
        classification.state === "exact_duplicate_same_source" &&
        classification.suppressionEligible
      ) {
        suppressedInputIndexes.add(rightIndex);
        continue;
      }
      const blockCode = stateBlockCode(classification.state);
      if (blockCode === null) continue;
      const leftGroup = executionLedgerGroupKey(left);
      const rightGroup = executionLedgerGroupKey(right);
      const digests = [left.canonicalContentDigest, right.canonicalContentDigest];
      if (leftGroup !== rightGroup) {
        addGroupBlock(
          leftGroup,
          "ti_v3_reconstruction_relationship_group_mismatch",
          digests,
        );
        addGroupBlock(
          rightGroup,
          "ti_v3_reconstruction_relationship_group_mismatch",
          digests,
        );
      } else {
        addGroupBlock(leftGroup, blockCode, digests);
      }
    }
  }

  const frozenGroupBlocks = [...groupBlocks.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .flatMap(([groupKey, blocks]) =>
      [...blocks.entries()]
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([code, digests]) =>
          Object.freeze({
            groupKey,
            code,
            executionDigests: Object.freeze([...digests].sort()),
          }),
        ),
    );
  const receipt: ExecutionRelationshipCoverageReceipt = Object.freeze({
    version: EXECUTION_RELATIONSHIP_COVERAGE_VERSION,
    state: "complete",
    inputExecutionCount: verifiedExecutions.length,
    expectedPairCount: expectedPairCount(verifiedExecutions.length),
    classifiedPairCount: pairReceipts.length,
    inputExecutionDigests: Object.freeze([...inputDigests]),
    pairs: Object.freeze(pairReceipts),
  });
  return protectResolution({
    retainedExecutions: Object.freeze(
      verifiedExecutions.filter((_, index) => !suppressedInputIndexes.has(index)),
    ),
    groupBlocks: Object.freeze(frozenGroupBlocks),
    globalBlocks: Object.freeze([]),
    coverageReceipt: receipt,
  });
}
