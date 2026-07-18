import { canonicalBytesEqual } from "../identity";
import type { CanonicalExecutionEnvelope } from "./canonical-execution";

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
    left.content.canonicalAccountKey === right.content.canonicalAccountKey &&
    left.content.executionId !== null &&
    left.content.executionId === right.content.executionId
  );
}

function economicContentEqual(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): boolean {
  return (
    left.content.canonicalOwnerKey === right.content.canonicalOwnerKey &&
    left.content.canonicalAccountKey === right.content.canonicalAccountKey &&
    left.content.stableInstrumentKey === right.content.stableInstrumentKey &&
    left.content.rawBrokerSymbol === right.content.rawBrokerSymbol &&
    left.content.executedAt === right.content.executedAt &&
    left.content.timestampPrecision === right.content.timestampPrecision &&
    left.content.side === right.content.side &&
    left.content.quantity === right.content.quantity &&
    left.content.price === right.content.price &&
    left.content.currency === right.content.currency &&
    left.content.charges.length === right.content.charges.length &&
    left.content.charges.every((charge, index) => {
      const counterpart = right.content.charges[index];
      return (
        counterpart !== undefined &&
        charge.kind === counterpart.kind &&
        charge.amount === counterpart.amount &&
        charge.currency === counterpart.currency
      );
    })
  );
}

function result(
  state: ExecutionRelationshipState,
  confidence: ExecutionRelationshipConfidence,
  reasonCodes: readonly string[],
  evidence: readonly string[],
): ExecutionRelationshipClassification {
  return {
    state,
    confidence,
    suppressionEligible: state === "exact_duplicate_same_source",
    reasonCodes,
    evidence,
  };
}

export function classifyExecutionRelationship(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): ExecutionRelationshipClassification {
  const digestEqual = left.canonicalContentDigest === right.canonicalContentDigest;
  const bytesEqual = canonicalBytesEqual(left.canonicalBytes, right.canonicalBytes);
  if (digestEqual && !bytesEqual) {
    return result(
      "digest_collision_detected",
      "conflict",
      ["ti_v3_relationship_digest_equal_bytes_differ"],
      ["canonical_digest", "canonical_bytes"],
    );
  }

  const sameSourceLocation =
    left.content.sourceIdentity === right.content.sourceIdentity &&
    left.content.sourceDocumentDigest === right.content.sourceDocumentDigest &&
    left.content.originalSourceRowLocator.kind === right.content.originalSourceRowLocator.kind &&
    left.content.originalSourceRowLocator.value === right.content.originalSourceRowLocator.value;
  if (bytesEqual && sameSourceLocation) {
    return result(
      "exact_duplicate_same_source",
      "proven",
      ["ti_v3_relationship_identical_content_same_source_location"],
      ["canonical_bytes", "source_identity", "source_row_locator"],
    );
  }

  if (
    left.content.correctionState !== "none" ||
    right.content.correctionState !== "none" ||
    left.content.correctionReference !== null ||
    right.content.correctionReference !== null
  ) {
    return result(
      "broker_correction_or_bust",
      "strong",
      ["ti_v3_relationship_correction_or_bust_evidence"],
      ["correction_state", "correction_reference"],
    );
  }

  if (stableExecutionScopeEqual(left, right)) {
    if (economicContentEqual(left, right)) {
      if (left.content.sourceDocumentDigest !== right.content.sourceDocumentDigest) {
        return result(
          "same_execution_reexported",
          "proven",
          ["ti_v3_relationship_stable_execution_id_equal_economics_new_document"],
          ["broker_code", "canonical_account", "execution_id", "source_document_digest"],
        );
      }
      return result(
        "exact_duplicate_same_source",
        "proven",
        ["ti_v3_relationship_stable_execution_id_equal_economics_same_document"],
        ["broker_code", "canonical_account", "execution_id", "economic_content"],
      );
    }
    return result(
      "broker_correction_or_bust",
      "conflict",
      ["ti_v3_relationship_stable_execution_id_changed_economics"],
      ["broker_code", "canonical_account", "execution_id", "economic_content"],
    );
  }

  if (
    left.content.executionId !== null &&
    right.content.executionId !== null &&
    left.content.executionId !== right.content.executionId
  ) {
    return result(
      "legitimate_repeated_fill",
      "proven",
      ["ti_v3_relationship_distinct_stable_execution_ids"],
      ["execution_id"],
    );
  }
  if (
    left.content.brokerExecutionIndex !== null &&
    right.content.brokerExecutionIndex !== null &&
    left.content.brokerExecutionIndex !== right.content.brokerExecutionIndex
  ) {
    return result(
      "legitimate_repeated_fill",
      "strong",
      ["ti_v3_relationship_distinct_broker_execution_indices"],
      ["broker_execution_index"],
    );
  }
  if (economicContentEqual(left, right)) {
    return result(
      "possible_duplicate_ambiguous",
      "ambiguous",
      ["ti_v3_relationship_equal_economics_without_unique_identity"],
      ["economic_content"],
    );
  }
  if (
    left.content.executionId === null &&
    right.content.executionId === null &&
    left.content.sourceIdentity === right.content.sourceIdentity &&
    left.content.originalSourceRowLocator.value === right.content.originalSourceRowLocator.value
  ) {
    return result(
      "manual_review_required",
      "ambiguous",
      ["ti_v3_relationship_source_locator_reused_with_different_content"],
      ["source_identity", "source_row_locator"],
    );
  }
  return result(
    "distinct_execution",
    "strong",
    ["ti_v3_relationship_distinct_content_no_duplicate_evidence"],
    ["canonical_bytes"],
  );
}
