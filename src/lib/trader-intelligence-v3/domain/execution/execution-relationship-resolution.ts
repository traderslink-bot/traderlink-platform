import { canonicalBytesEqual, type CanonicalExecutionDigest } from "../identity";
import type { CanonicalExecutionEnvelope } from "./canonical-execution";
import {
  classifyExecutionRelationship,
  type ExecutionRelationshipClassification,
  type ExecutionRelationshipState,
} from "./execution-relationship";

export type ExecutionRelationshipResolutionBlockCode =
  | "ti_v3_reconstruction_correction_unresolved"
  | "ti_v3_reconstruction_digest_collision"
  | "ti_v3_reconstruction_reexport_unresolved"
  | "ti_v3_reconstruction_possible_duplicate_unresolved"
  | "ti_v3_reconstruction_manual_review_required"
  | "ti_v3_reconstruction_relationship_unknown_execution"
  | "ti_v3_reconstruction_relationship_group_mismatch"
  | "ti_v3_reconstruction_relationship_classification_mismatch"
  | "ti_v3_reconstruction_duplicate_relationship_missing";

export interface ExecutionRelationshipGroupBlock {
  groupKey: string;
  code: ExecutionRelationshipResolutionBlockCode;
  executionDigests: readonly CanonicalExecutionDigest[];
}

export interface ExecutionRelationshipResolution {
  retainedExecutions: readonly CanonicalExecutionEnvelope[];
  groupBlocks: readonly ExecutionRelationshipGroupBlock[];
  globalBlocks: readonly {
    code: ExecutionRelationshipResolutionBlockCode;
    executionDigests: readonly CanonicalExecutionDigest[];
  }[];
}

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

function classificationMatches(
  supplied: ExecutionRelationshipClassification,
  computed: ExecutionRelationshipClassification,
): boolean {
  return (
    supplied.leftExecutionDigest === computed.leftExecutionDigest &&
    supplied.rightExecutionDigest === computed.rightExecutionDigest &&
    supplied.state === computed.state &&
    supplied.confidence === computed.confidence &&
    supplied.suppressionEligible === computed.suppressionEligible
  );
}

export function resolveExecutionRelationships(
  executions: readonly CanonicalExecutionEnvelope[],
  relationships: readonly ExecutionRelationshipClassification[],
): ExecutionRelationshipResolution {
  const byDigest = new Map<string, CanonicalExecutionEnvelope[]>();
  for (const execution of executions) {
    const occurrences = byDigest.get(execution.canonicalContentDigest) ?? [];
    occurrences.push(execution);
    byDigest.set(execution.canonicalContentDigest, occurrences);
  }

  const groupBlocks = new Map<
    string,
    {
      code: ExecutionRelationshipResolutionBlockCode;
      digests: Set<CanonicalExecutionDigest>;
    }[]
  >();
  const globalBlocks: {
    code: ExecutionRelationshipResolutionBlockCode;
    executionDigests: readonly CanonicalExecutionDigest[];
  }[] = [];
  const exactDuplicateSuppressions = new Map<CanonicalExecutionDigest, number>();

  const addGroupBlock = (
    groupKey: string,
    code: ExecutionRelationshipResolutionBlockCode,
    digests: readonly CanonicalExecutionDigest[],
  ): void => {
    const existing = groupBlocks.get(groupKey) ?? [];
    const sameCode = existing.find((item) => item.code === code);
    if (sameCode === undefined) {
      existing.push({ code, digests: new Set(digests) });
    } else {
      digests.forEach((digest) => sameCode.digests.add(digest));
    }
    groupBlocks.set(groupKey, existing);
  };

  for (const occurrences of byDigest.values()) {
    const first = occurrences[0];
    for (const occurrence of occurrences.slice(1)) {
      if (!canonicalBytesEqual(first.canonicalBytes, occurrence.canonicalBytes)) {
        addGroupBlock(
          executionLedgerGroupKey(first),
          "ti_v3_reconstruction_digest_collision",
          [first.canonicalContentDigest],
        );
        addGroupBlock(
          executionLedgerGroupKey(occurrence),
          "ti_v3_reconstruction_digest_collision",
          [occurrence.canonicalContentDigest],
        );
      }
    }
  }

  for (const relationship of relationships) {
    const leftOccurrences = byDigest.get(relationship.leftExecutionDigest);
    const rightOccurrences = byDigest.get(relationship.rightExecutionDigest);
    if (leftOccurrences === undefined || rightOccurrences === undefined) {
      globalBlocks.push({
        code: "ti_v3_reconstruction_relationship_unknown_execution",
        executionDigests: [
          relationship.leftExecutionDigest,
          relationship.rightExecutionDigest,
        ],
      });
      continue;
    }
    const left = leftOccurrences[0];
    const right = rightOccurrences[0];
    const leftGroup = executionLedgerGroupKey(left);
    const rightGroup = executionLedgerGroupKey(right);
    if (leftGroup !== rightGroup) {
      addGroupBlock(leftGroup, "ti_v3_reconstruction_relationship_group_mismatch", [
        left.canonicalContentDigest,
        right.canonicalContentDigest,
      ]);
      addGroupBlock(rightGroup, "ti_v3_reconstruction_relationship_group_mismatch", [
        left.canonicalContentDigest,
        right.canonicalContentDigest,
      ]);
      continue;
    }
    const computed = classifyExecutionRelationship(left, right);
    if (!classificationMatches(relationship, computed)) {
      addGroupBlock(
        leftGroup,
        "ti_v3_reconstruction_relationship_classification_mismatch",
        [left.canonicalContentDigest, right.canonicalContentDigest],
      );
      continue;
    }
    if (
      computed.state === "exact_duplicate_same_source" &&
      computed.suppressionEligible &&
      computed.leftExecutionDigest === computed.rightExecutionDigest
    ) {
      exactDuplicateSuppressions.set(
        computed.leftExecutionDigest,
        (exactDuplicateSuppressions.get(computed.leftExecutionDigest) ?? 0) + 1,
      );
      continue;
    }
    const blockCode = stateBlockCode(computed.state);
    if (blockCode !== null) {
      addGroupBlock(leftGroup, blockCode, [
        left.canonicalContentDigest,
        right.canonicalContentDigest,
      ]);
    }
  }

  for (const [digest, occurrences] of byDigest) {
    if (
      occurrences.length > 1 &&
      (exactDuplicateSuppressions.get(digest as CanonicalExecutionDigest) ?? 0) <
        occurrences.length - 1 &&
      occurrences.every((occurrence) =>
        canonicalBytesEqual(occurrences[0].canonicalBytes, occurrence.canonicalBytes),
      )
    ) {
      addGroupBlock(
        executionLedgerGroupKey(occurrences[0]),
        "ti_v3_reconstruction_duplicate_relationship_missing",
        [digest as CanonicalExecutionDigest],
      );
    }
  }

  const retainedExecutions: CanonicalExecutionEnvelope[] = [];
  const retainedCounts = new Map<CanonicalExecutionDigest, number>();
  for (const execution of executions) {
    const occurrences = byDigest.get(execution.canonicalContentDigest)?.length ?? 1;
    const suppressions = Math.min(
      exactDuplicateSuppressions.get(execution.canonicalContentDigest) ?? 0,
      occurrences - 1,
    );
    const retainLimit = occurrences - suppressions;
    const retained = retainedCounts.get(execution.canonicalContentDigest) ?? 0;
    if (suppressions > 0) {
      if (retained >= retainLimit) {
        continue;
      }
    }
    retainedCounts.set(execution.canonicalContentDigest, retained + 1);
    retainedExecutions.push(execution);
  }

  return {
    retainedExecutions,
    groupBlocks: [...groupBlocks.entries()]
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .flatMap(([groupKey, blocks]) =>
        blocks
          .sort((left, right) =>
            left.code < right.code ? -1 : left.code > right.code ? 1 : 0,
          )
          .map((block) => ({
            groupKey,
            code: block.code,
            executionDigests: [...block.digests].sort(),
          })),
      ),
    globalBlocks,
  };
}
