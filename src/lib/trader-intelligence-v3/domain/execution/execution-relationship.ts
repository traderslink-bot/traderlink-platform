import { serializeCanonicalValue } from "../canonical";
import { canonicalBytesEqual, type CanonicalExecutionDigest } from "../identity";
import {
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionIntegrityFailure,
  CanonicalExecutionContent,
  CanonicalExecutionEnvelope,
} from "./canonical-execution";

export type ExecutionRelationshipState =
  | "exact_duplicate_same_source"
  | "same_execution_reexported"
  | "broker_correction_or_bust"
  | "possible_duplicate_ambiguous"
  | "legitimate_repeated_fill"
  | "digest_collision_detected"
  | "manual_review_required"
  | "distinct_execution";

export type ExecutionRelationshipConfidence =
  | "proven"
  | "strong"
  | "ambiguous"
  | "conflict";

export interface ExecutionRelationshipClassification {
  leftExecutionDigest: CanonicalExecutionDigest;
  rightExecutionDigest: CanonicalExecutionDigest;
  state: ExecutionRelationshipState;
  confidence: ExecutionRelationshipConfidence;
  suppressionEligible: boolean;
  reasonCodes: readonly string[];
  evidence: readonly string[];
}

function stableExecutionScopeEqual(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): boolean {
  return (
    left.content.brokerCode === right.content.brokerCode &&
    left.content.sourceSystem === right.content.sourceSystem &&
    left.content.canonicalAccountKey === right.content.canonicalAccountKey &&
    left.content.executionId !== null &&
    left.content.executionId === right.content.executionId
  );
}

function contentWithoutSourceLocation(
  content: CanonicalExecutionContent,
): Omit<
  CanonicalExecutionContent,
  "sourceDocumentDigest" | "originalSourceRowLocator"
> {
  return Object.fromEntries(
    Object.entries(content).filter(
      ([key]) =>
        key !== "sourceDocumentDigest" && key !== "originalSourceRowLocator",
    ),
  ) as unknown as Omit<
    CanonicalExecutionContent,
    "sourceDocumentDigest" | "originalSourceRowLocator"
  >;
}

function allNonLocationFactsEqual(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): boolean {
  const leftSerialized = serializeCanonicalValue(
    contentWithoutSourceLocation(left.content),
  );
  const rightSerialized = serializeCanonicalValue(
    contentWithoutSourceLocation(right.content),
  );
  return (
    leftSerialized.ok &&
    rightSerialized.ok &&
    canonicalBytesEqual(leftSerialized.value.utf8, rightSerialized.value.utf8)
  );
}

function validationEqual(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): boolean {
  return (
    left.validation.state === right.validation.state &&
    left.validation.reasonCodes.length === right.validation.reasonCodes.length &&
    left.validation.reasonCodes.every(
      (reason, index) => reason === right.validation.reasonCodes[index],
    )
  );
}

function integrityResult(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
  failures: readonly CanonicalExecutionIntegrityFailure[],
): ExecutionRelationshipClassification {
  return result(
    left,
    right,
    "manual_review_required",
    "conflict",
    [
      "ti_v3_relationship_execution_envelope_integrity_invalid",
      ...failures.map((failure) => failure.code),
    ].sort(),
    ["canonical_execution_envelope_integrity"],
  );
}

function result(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
  state: ExecutionRelationshipState,
  confidence: ExecutionRelationshipConfidence,
  reasonCodes: readonly string[],
  evidence: readonly string[],
  suppressionEligible = false,
): ExecutionRelationshipClassification {
  return {
    leftExecutionDigest: left.canonicalContentDigest,
    rightExecutionDigest: right.canonicalContentDigest,
    state,
    confidence,
    suppressionEligible,
    reasonCodes,
    evidence,
  };
}

function classifyVerifiedExecutionRelationship(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
  digestEqualOverride?: boolean,
): ExecutionRelationshipClassification {
  const digestEqual =
    digestEqualOverride ??
    left.canonicalContentDigest === right.canonicalContentDigest;
  const bytesEqual = canonicalBytesEqual(left.canonicalBytes, right.canonicalBytes);
  if (digestEqual && !bytesEqual) {
    return result(
      left,
      right,
      "digest_collision_detected",
      "conflict",
      ["ti_v3_relationship_digest_equal_bytes_differ"],
      ["canonical_digest", "canonical_bytes"],
    );
  }

  const sameSourceLocation =
    left.content.sourceIdentity === right.content.sourceIdentity &&
    left.content.sourceDocumentDigest !== null &&
    left.content.sourceDocumentDigest === right.content.sourceDocumentDigest &&
    left.content.originalSourceRowLocator.kind ===
      right.content.originalSourceRowLocator.kind &&
    left.content.originalSourceRowLocator.value ===
      right.content.originalSourceRowLocator.value;
  if (digestEqual && bytesEqual && sameSourceLocation && validationEqual(left, right)) {
    return result(
      left,
      right,
      "exact_duplicate_same_source",
      "proven",
      ["ti_v3_relationship_digest_bytes_and_source_location_equal"],
      ["canonical_digest", "canonical_bytes", "source_identity", "source_row_locator"],
      true,
    );
  }

  if (digestEqual && bytesEqual && !validationEqual(left, right)) {
    return result(
      left,
      right,
      "manual_review_required",
      "conflict",
      ["ti_v3_relationship_equal_facts_validation_disagreement"],
      ["canonical_digest", "canonical_bytes", "validation_state"],
    );
  }

  if (
    digestEqual &&
    bytesEqual &&
    left.content.sourceIdentity === right.content.sourceIdentity &&
    left.content.sourceDocumentDigest === null &&
    right.content.sourceDocumentDigest === null
  ) {
    return result(
      left,
      right,
      "possible_duplicate_ambiguous",
      "ambiguous",
      ["ti_v3_relationship_same_source_document_identity_unproven"],
      ["canonical_digest", "canonical_bytes", "source_document_digest_missing"],
    );
  }

  if (
    left.content.correctionState !== "none" ||
    right.content.correctionState !== "none" ||
    left.content.correctionReference !== null ||
    right.content.correctionReference !== null
  ) {
    return result(
      left,
      right,
      "broker_correction_or_bust",
      "strong",
      ["ti_v3_relationship_correction_or_bust_evidence"],
      ["correction_state", "correction_reference"],
    );
  }

  if (stableExecutionScopeEqual(left, right)) {
    if (allNonLocationFactsEqual(left, right)) {
      if (!validationEqual(left, right)) {
        return result(
          left,
          right,
          "manual_review_required",
          "conflict",
          ["ti_v3_relationship_stable_execution_validation_disagreement"],
          ["execution_id", "validation_state"],
        );
      }
      if (
        left.content.sourceDocumentDigest !== null &&
        right.content.sourceDocumentDigest !== null &&
        left.content.sourceDocumentDigest !== right.content.sourceDocumentDigest
      ) {
        return result(
          left,
          right,
          "same_execution_reexported",
          "proven",
          ["ti_v3_relationship_stable_execution_id_equal_content_new_document"],
          [
            "broker_code",
            "source_system",
            "canonical_account",
            "execution_id",
            "all_non_location_canonical_content",
            "source_document_digest",
          ],
        );
      }
      return result(
        left,
        right,
        "manual_review_required",
        "ambiguous",
        ["ti_v3_relationship_stable_execution_id_equal_content_document_unproven_or_location_changed"],
        ["execution_id", "source_document_digest", "source_row_locator"],
      );
    }
    return result(
      left,
      right,
      "broker_correction_or_bust",
      "conflict",
      ["ti_v3_relationship_stable_execution_id_changed_canonical_content"],
      ["broker_code", "source_system", "canonical_account", "execution_id"],
    );
  }

  if (
    left.content.executionId !== null &&
    right.content.executionId !== null &&
    left.content.executionId !== right.content.executionId
  ) {
    return result(
      left,
      right,
      "legitimate_repeated_fill",
      "proven",
      ["ti_v3_relationship_distinct_stable_execution_ids"],
      ["execution_id"],
    );
  }
  if (
    left.content.brokerExecutionIndex !== null &&
    right.content.brokerExecutionIndex !== null &&
    left.content.brokerExecutionIndex !== right.content.brokerExecutionIndex &&
    left.content.sourceDocumentDigest !== null &&
    left.content.sourceDocumentDigest === right.content.sourceDocumentDigest
  ) {
    return result(
      left,
      right,
      "legitimate_repeated_fill",
      "strong",
      ["ti_v3_relationship_distinct_scoped_broker_execution_indices"],
      ["source_document_digest", "broker_execution_index"],
    );
  }
  if (allNonLocationFactsEqual(left, right) && validationEqual(left, right)) {
    return result(
      left,
      right,
      "possible_duplicate_ambiguous",
      "ambiguous",
      ["ti_v3_relationship_equal_canonical_content_without_unique_identity"],
      ["all_non_location_canonical_content"],
    );
  }
  if (
    left.content.executionId === null &&
    right.content.executionId === null &&
    left.content.sourceIdentity === right.content.sourceIdentity &&
    left.content.originalSourceRowLocator.kind ===
      right.content.originalSourceRowLocator.kind &&
    left.content.originalSourceRowLocator.value ===
      right.content.originalSourceRowLocator.value
  ) {
    return result(
      left,
      right,
      "manual_review_required",
      "ambiguous",
      ["ti_v3_relationship_source_locator_reused_with_different_content"],
      ["source_identity", "source_row_locator"],
    );
  }
  return result(
    left,
    right,
    "distinct_execution",
    "strong",
    ["ti_v3_relationship_distinct_content_no_duplicate_evidence"],
    ["canonical_bytes"],
  );
}


export function classifyExecutionRelationship(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): ExecutionRelationshipClassification {
  const verifiedLeft = verifyCanonicalExecutionEnvelope(left);
  const verifiedRight = verifyCanonicalExecutionEnvelope(right);
  if (!verifiedLeft.ok || !verifiedRight.ok) {
    return integrityResult(
      left,
      right,
      [
        ...(verifiedLeft.ok ? [] : [verifiedLeft.error]),
        ...(verifiedRight.ok ? [] : [verifiedRight.error]),
      ],
    );
  }
  return classifyVerifiedExecutionRelationship(verifiedLeft.value, verifiedRight.value);
}

export function classifyExecutionRelationshipWithTestHash(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
  hashFunction: (bytes: Uint8Array) => string,
): ExecutionRelationshipClassification {
  const verifiedLeft = verifyCanonicalExecutionEnvelope(left);
  const verifiedRight = verifyCanonicalExecutionEnvelope(right);
  if (!verifiedLeft.ok || !verifiedRight.ok) {
    return integrityResult(
      left,
      right,
      [
        ...(verifiedLeft.ok ? [] : [verifiedLeft.error]),
        ...(verifiedRight.ok ? [] : [verifiedRight.error]),
      ],
    );
  }
  const leftHash = hashFunction(verifiedLeft.value.canonicalBytes);
  const rightHash = hashFunction(verifiedRight.value.canonicalBytes);
  if (!/^[0-9a-f]{64}$/.test(leftHash) || !/^[0-9a-f]{64}$/.test(rightHash)) {
    return result(
      verifiedLeft.value,
      verifiedRight.value,
      "manual_review_required",
      "conflict",
      ["ti_v3_relationship_test_hash_invalid"],
      ["injected_collision_test_hash"],
    );
  }
  return classifyVerifiedExecutionRelationship(
    verifiedLeft.value,
    verifiedRight.value,
    leftHash === rightHash,
  );
}
