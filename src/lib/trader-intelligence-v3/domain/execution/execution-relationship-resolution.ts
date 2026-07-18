import {
  createCanonicalContentIdentity,
  createCanonicalOccurrenceSetDigest,
  type CanonicalExecutionDigest,
} from "../identity";
import {
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionContent,
  type CanonicalExecutionEnvelope,
} from "./canonical-execution";
import { compareCanonicalStorageOrder } from "./execution-ordering";
import {
  classifyExecutionRelationship,
  type ExecutionRelationshipClassification,
  type ExecutionRelationshipState,
} from "./execution-relationship";

export const EXECUTION_RELATIONSHIP_COVERAGE_VERSION =
  "ti_v3_execution_relationship_coverage_v2" as const;

export const EXECUTION_RELATIONSHIP_RESOURCE_LIMITS = Object.freeze({
  maximumCandidatePairs: 250_000,
});

export type ExecutionRelationshipResolutionBlockCode =
  | "ti_v3_reconstruction_correction_unresolved"
  | "ti_v3_reconstruction_digest_collision"
  | "ti_v3_reconstruction_reexport_unresolved"
  | "ti_v3_reconstruction_possible_duplicate_unresolved"
  | "ti_v3_reconstruction_manual_review_required"
  | "ti_v3_reconstruction_relationship_group_mismatch"
  | "ti_v3_reconstruction_execution_envelope_integrity_invalid"
  | "ti_v3_reconstruction_relationship_coverage_incomplete"
  | "ti_v3_reconstruction_relationship_resource_limit";

export interface ExecutionRelationshipGroupBlock {
  readonly groupKey: string;
  readonly code: ExecutionRelationshipResolutionBlockCode;
  readonly executionDigests: readonly CanonicalExecutionDigest[];
}

export type ExecutionRelationshipCandidateIndexName =
  | "canonical_digest"
  | "stable_execution_identity"
  | "correction_reference_identity"
  | "source_location"
  | "scoped_broker_execution_index"
  | "conservative_non_location_fingerprint";

export interface ExecutionRelationshipCandidateIndexSummary {
  readonly indexName: ExecutionRelationshipCandidateIndexName;
  readonly partitionCount: number;
  readonly candidatePartitionCount: number;
}

export interface ExecutionRelationshipCandidateReceipt {
  readonly leftOccurrenceKey: string;
  readonly rightOccurrenceKey: string;
  readonly classification: ExecutionRelationshipClassification;
}

export interface ExecutionRelationshipCoverageReceipt {
  readonly version: typeof EXECUTION_RELATIONSHIP_COVERAGE_VERSION;
  readonly state: "complete" | "blocked_invalid_input" | "blocked_resource_limit";
  readonly inputExecutionCount: number;
  readonly inputOccurrenceDigest: string;
  readonly inputOccurrenceKeys: readonly string[];
  readonly inputExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly candidateIndexSummaries: readonly ExecutionRelationshipCandidateIndexSummary[];
  readonly candidateRelationshipCount: number;
  readonly classifiedCandidateCount: number;
  readonly defaultDistinctPairCount: string;
  readonly defaultDistinctProof:
    | "absence_from_all_conservative_candidate_indexes"
    | "not_available";
  readonly candidateRelationships: readonly ExecutionRelationshipCandidateReceipt[];
  readonly retainedOccurrenceCount: number;
  readonly suppressedOccurrenceCount: number;
  readonly blockedGroupCount: number;
  readonly resourceLimits: typeof EXECUTION_RELATIONSHIP_RESOURCE_LIMITS;
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

interface IndexedOccurrence {
  readonly occurrenceKey: string;
  readonly execution: CanonicalExecutionEnvelope;
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

function totalPairCount(inputCount: number): bigint {
  const count = BigInt(inputCount);
  return (count * (count - BigInt(1))) / BigInt(2);
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

function inputOccurrenceDigest(occurrenceKeys: readonly string[]): string {
  return createCanonicalOccurrenceSetDigest(
    occurrenceKeys,
  );
}

function canonicalOccurrenceOrder(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): number {
  const storage = compareCanonicalStorageOrder(left, right);
  if (storage !== 0) return storage;
  if (left.validation.state !== right.validation.state) {
    return left.validation.state < right.validation.state ? -1 : 1;
  }
  const leftReasons = left.validation.reasonCodes.join("\u0000");
  const rightReasons = right.validation.reasonCodes.join("\u0000");
  return leftReasons < rightReasons ? -1 : leftReasons > rightReasons ? 1 : 0;
}

function indexedOccurrences(
  executions: readonly CanonicalExecutionEnvelope[],
): readonly IndexedOccurrence[] {
  const sorted = [...executions].sort(canonicalOccurrenceOrder);
  const counts = new Map<string, number>();
  return sorted.map((execution) => {
    const validationKey = `${execution.validation.state}:${execution.validation.reasonCodes.join(",")}`;
    const base = `${execution.canonicalContentDigest}:${validationKey}`;
    const ordinal = counts.get(base) ?? 0;
    counts.set(base, ordinal + 1);
    return Object.freeze({
      occurrenceKey: `${base}:occurrence:${ordinal}`,
      execution,
    });
  });
}

function contentWithoutSourceLocation(
  content: CanonicalExecutionContent,
): Omit<CanonicalExecutionContent, "sourceDocumentDigest" | "originalSourceRowLocator"> {
  const { sourceDocumentDigest: _document, originalSourceRowLocator: _locator, ...facts } = content;
  void _document;
  void _locator;
  return facts;
}

function nonLocationFingerprint(execution: CanonicalExecutionEnvelope): string {
  const identity = createCanonicalContentIdentity(
    "canonical_content",
    "v1",
    contentWithoutSourceLocation(execution.content),
  );
  return identity.ok ? identity.value.identifier : "invalid";
}

function addIndexValue(
  index: Map<string, number[]>,
  key: string | null,
  occurrenceIndex: number,
): void {
  if (key === null) return;
  const partition = index.get(key) ?? [];
  partition.push(occurrenceIndex);
  index.set(key, partition);
}

function indexKey(parts: readonly (string | null)[]): string {
  return parts
    .map((part) =>
      part === null ? "null;" : `string:${part.length}:${part};`,
    )
    .join("");
}

function candidateIndexes(
  occurrences: readonly IndexedOccurrence[],
): ReadonlyMap<ExecutionRelationshipCandidateIndexName, Map<string, number[]>> {
  const indexes = new Map<ExecutionRelationshipCandidateIndexName, Map<string, number[]>>();
  const ensure = (name: ExecutionRelationshipCandidateIndexName): Map<string, number[]> => {
    const existing = indexes.get(name);
    if (existing !== undefined) return existing;
    const created = new Map<string, number[]>();
    indexes.set(name, created);
    return created;
  };
  occurrences.forEach(({ execution }, occurrenceIndex) => {
    const content = execution.content;
    const relationshipIdentityScope =
      content.stableInstrumentKey === null
        ? null
        : indexKey([
            content.canonicalOwnerKey,
            content.canonicalAccountKey,
            content.stableInstrumentKey,
            content.currency,
            content.brokerCode,
            content.sourceSystem,
          ]);
    addIndexValue(ensure("canonical_digest"), execution.canonicalContentDigest, occurrenceIndex);
    addIndexValue(
      ensure("stable_execution_identity"),
      relationshipIdentityScope === null || content.executionId === null
        ? null
        : indexKey([relationshipIdentityScope, content.executionId]),
      occurrenceIndex,
    );
    addIndexValue(
      ensure("correction_reference_identity"),
      relationshipIdentityScope === null || content.executionId === null
        ? null
        : indexKey([relationshipIdentityScope, content.executionId]),
      occurrenceIndex,
    );
    addIndexValue(
      ensure("correction_reference_identity"),
      relationshipIdentityScope === null || content.correctionReference === null
        ? null
        : indexKey([relationshipIdentityScope, content.correctionReference]),
      occurrenceIndex,
    );
    addIndexValue(
      ensure("source_location"),
      indexKey([
        content.sourceIdentity,
        content.sourceDocumentDigest,
        content.originalSourceRowLocator.kind,
        content.originalSourceRowLocator.value,
      ]),
      occurrenceIndex,
    );
    addIndexValue(
      ensure("scoped_broker_execution_index"),
      content.brokerExecutionIndex === null || content.sourceDocumentDigest === null
        ? null
        : indexKey([
            content.sourceIdentity,
            content.sourceDocumentDigest,
            content.brokerExecutionIndex,
          ]),
      occurrenceIndex,
    );
    addIndexValue(
      ensure("conservative_non_location_fingerprint"),
      content.executionId === null
        ? nonLocationFingerprint(execution)
        : null,
      occurrenceIndex,
    );
  });
  return indexes;
}

function indexSummaries(
  indexes: ReadonlyMap<ExecutionRelationshipCandidateIndexName, Map<string, number[]>>,
): readonly ExecutionRelationshipCandidateIndexSummary[] {
  return [...indexes.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([indexName, partitions]) =>
      Object.freeze({
        indexName,
        partitionCount: partitions.size,
        candidatePartitionCount: [...partitions.values()].filter(
          (partition) => partition.length > 1,
        ).length,
      }),
    );
}

function candidatePairKeys(
  indexes: ReadonlyMap<ExecutionRelationshipCandidateIndexName, Map<string, number[]>>,
): { readonly ok: true; readonly value: ReadonlySet<string> } | { readonly ok: false } {
  let upperBound = BigInt(0);
  for (const partitions of indexes.values()) {
    for (const partition of partitions.values()) {
      upperBound += totalPairCount(partition.length);
      if (upperBound > BigInt(EXECUTION_RELATIONSHIP_RESOURCE_LIMITS.maximumCandidatePairs)) {
        return { ok: false };
      }
    }
  }
  const pairKeys = new Set<string>();
  for (const partitions of indexes.values()) {
    for (const partition of partitions.values()) {
      for (let left = 0; left < partition.length; left += 1) {
        for (let right = left + 1; right < partition.length; right += 1) {
          const leftIndex = partition[left];
          const rightIndex = partition[right];
          pairKeys.add(
            leftIndex < rightIndex
              ? `${leftIndex}:${rightIndex}`
              : `${rightIndex}:${leftIndex}`,
          );
        }
      }
    }
  }
  if (pairKeys.size > EXECUTION_RELATIONSHIP_RESOURCE_LIMITS.maximumCandidatePairs) {
    return { ok: false };
  }
  return { ok: true, value: pairKeys };
}

function emptyReceipt(
  state: "blocked_invalid_input" | "blocked_resource_limit",
  inputCount: number,
  occurrenceKeys: readonly string[],
  inputDigests: readonly CanonicalExecutionDigest[],
  summaries: readonly ExecutionRelationshipCandidateIndexSummary[],
): ExecutionRelationshipCoverageReceipt {
  return Object.freeze({
    version: EXECUTION_RELATIONSHIP_COVERAGE_VERSION,
    state,
    inputExecutionCount: inputCount,
    inputOccurrenceDigest: inputOccurrenceDigest(occurrenceKeys),
    inputOccurrenceKeys: Object.freeze([...occurrenceKeys]),
    inputExecutionDigests: Object.freeze([...inputDigests]),
    candidateIndexSummaries: Object.freeze([...summaries]),
    candidateRelationshipCount: 0,
    classifiedCandidateCount: 0,
    defaultDistinctPairCount: "0",
    defaultDistinctProof: "not_available",
    candidateRelationships: Object.freeze([]),
    retainedOccurrenceCount: 0,
    suppressedOccurrenceCount: 0,
    blockedGroupCount: 0,
    resourceLimits: EXECUTION_RELATIONSHIP_RESOURCE_LIMITS,
  });
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
      return protectResolution({
        retainedExecutions: Object.freeze([]),
        groupBlocks: Object.freeze([]),
        globalBlocks: Object.freeze([globalBlock]),
        coverageReceipt: emptyReceipt(
          "blocked_invalid_input",
          executions.length,
          [],
          [...inputDigests, ...candidateDigest],
          [],
        ),
      });
    }
    verifiedExecutions.push(verified.value);
    inputDigests.push(verified.value.canonicalContentDigest);
  }

  const occurrences = indexedOccurrences(verifiedExecutions);
  const occurrenceKeys = occurrences.map((occurrence) => occurrence.occurrenceKey);
  const orderedDigests = occurrences.map(
    (occurrence) => occurrence.execution.canonicalContentDigest,
  );
  const indexes = candidateIndexes(occurrences);
  const summaries = indexSummaries(indexes);
  const candidates = candidatePairKeys(indexes);
  if (!candidates.ok) {
    const globalBlock = Object.freeze({
      code: "ti_v3_reconstruction_relationship_resource_limit" as const,
      executionDigests: Object.freeze(orderedDigests),
    });
    return protectResolution({
      retainedExecutions: Object.freeze([]),
      groupBlocks: Object.freeze([]),
      globalBlocks: Object.freeze([globalBlock]),
      coverageReceipt: emptyReceipt(
        "blocked_resource_limit",
        executions.length,
        occurrenceKeys,
        orderedDigests,
        summaries,
      ),
    });
  }

  const groupBlocks = new Map<
    string,
    Map<ExecutionRelationshipResolutionBlockCode, Set<CanonicalExecutionDigest>>
  >();
  const pairReceipts: ExecutionRelationshipCandidateReceipt[] = [];
  const suppressedOccurrenceIndexes = new Set<number>();

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

  occurrences.forEach(({ execution }) => {
    if (
      execution.content.correctionState !== "none" ||
      execution.content.correctionReference !== null
    ) {
      addGroupBlock(
        executionLedgerGroupKey(execution),
        "ti_v3_reconstruction_correction_unresolved",
        [execution.canonicalContentDigest],
      );
    }
  });

  const sortedCandidates = [...candidates.value].sort((left, right) => {
    const [leftA, leftB] = left.split(":").map(Number);
    const [rightA, rightB] = right.split(":").map(Number);
    return leftA - rightA || leftB - rightB;
  });
  for (const pairKey of sortedCandidates) {
    const [leftIndex, rightIndex] = pairKey.split(":").map(Number);
    const left = occurrences[leftIndex];
    const right = occurrences[rightIndex];
    const classification = freezeClassification(
      classifyExecutionRelationship(left.execution, right.execution),
    );
    pairReceipts.push(
      Object.freeze({
        leftOccurrenceKey: left.occurrenceKey,
        rightOccurrenceKey: right.occurrenceKey,
        classification,
      }),
    );
    if (
      classification.state === "exact_duplicate_same_source" &&
      classification.suppressionEligible
    ) {
      suppressedOccurrenceIndexes.add(rightIndex);
      continue;
    }
    const blockCode = stateBlockCode(classification.state);
    if (blockCode === null) continue;
    const leftGroup = executionLedgerGroupKey(left.execution);
    const rightGroup = executionLedgerGroupKey(right.execution);
    const digests = [
      left.execution.canonicalContentDigest,
      right.execution.canonicalContentDigest,
    ];
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
  const retainedExecutions = occurrences
    .filter((_, index) => !suppressedOccurrenceIndexes.has(index))
    .map((occurrence) => occurrence.execution);
  const defaultDistinctPairCount =
    totalPairCount(occurrences.length) - BigInt(pairReceipts.length);
  const receipt: ExecutionRelationshipCoverageReceipt = Object.freeze({
    version: EXECUTION_RELATIONSHIP_COVERAGE_VERSION,
    state: "complete",
    inputExecutionCount: occurrences.length,
    inputOccurrenceDigest: inputOccurrenceDigest(occurrenceKeys),
    inputOccurrenceKeys: Object.freeze([...occurrenceKeys]),
    inputExecutionDigests: Object.freeze([...orderedDigests]),
    candidateIndexSummaries: Object.freeze([...summaries]),
    candidateRelationshipCount: pairReceipts.length,
    classifiedCandidateCount: pairReceipts.length,
    defaultDistinctPairCount: defaultDistinctPairCount.toString(),
    defaultDistinctProof: "absence_from_all_conservative_candidate_indexes",
    candidateRelationships: Object.freeze(pairReceipts),
    retainedOccurrenceCount: retainedExecutions.length,
    suppressedOccurrenceCount: suppressedOccurrenceIndexes.size,
    blockedGroupCount: frozenGroupBlocks.length,
    resourceLimits: EXECUTION_RELATIONSHIP_RESOURCE_LIMITS,
  });
  return protectResolution({
    retainedExecutions: Object.freeze(retainedExecutions),
    groupBlocks: Object.freeze(frozenGroupBlocks),
    globalBlocks: Object.freeze([]),
    coverageReceipt: receipt,
  });
}
