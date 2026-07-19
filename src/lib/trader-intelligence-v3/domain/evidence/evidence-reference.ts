import type { CanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import { validateCanonicalDigest, validateEnum, validateExactRecordWithAuthorities, type FoundationValidationFailure } from "../foundation";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../identity";
import { verifyAnalysisSnapshot, type AnalysisSnapshot } from "../snapshot";

export const EVIDENCE_REFERENCE_VERSION = "ti_v3_evidence_reference_v1" as const;

export type EvidenceSubjectKind =
  | "execution_occurrence"
  | "canonical_execution"
  | "correction_version"
  | "reconstructed_round_trip"
  | "policy_version"
  | "filter_contract";

export interface EvidenceReference {
  readonly schemaVersion: typeof EVIDENCE_REFERENCE_VERSION;
  readonly manifestDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly subjectKind: EvidenceSubjectKind;
  readonly semanticKey: string;
  readonly correctionDigest: CanonicalContentDigest | null;
  readonly policyDigest: CanonicalContentDigest | null;
  readonly filterDigest: CanonicalContentDigest;
  readonly policySetDigest: CanonicalContentDigest;
  readonly correctionResultDigest: CanonicalContentDigest;
  readonly evidenceNamespace: string;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly evidenceDigest: CanonicalContentDigest;
}

export type EvidenceFailure = FoundationValidationFailure | {
  readonly code: "ti_v3_evidence_private_identifier" | "ti_v3_evidence_manifest_mismatch" | "ti_v3_evidence_snapshot_mismatch" | "ti_v3_evidence_unverified";
  readonly path: string;
};

const SUBJECTS = new Set<EvidenceSubjectKind>(["execution_occurrence", "canonical_execution", "correction_version", "reconstructed_round_trip", "policy_version", "filter_contract"]);
const verifiedReferences = new WeakSet<EvidenceReference>();

function failure(code: EvidenceFailure["code"], path: string): ExactResult<never, EvidenceFailure> {
  return { ok: false, error: { code, path } };
}

export function buildEvidenceReference(input: { readonly snapshot: AnalysisSnapshot; readonly subjectKind: unknown; readonly semanticKey: unknown; readonly correctionDigest: unknown; readonly policyDigest: unknown }): ExactResult<EvidenceReference, EvidenceFailure> {
  const record = validateExactRecordWithAuthorities(input, ["snapshot", "subjectKind", "semanticKey", "correctionDigest", "policyDigest"], [], { snapshot: (value) => verifyAnalysisSnapshot(value).ok });
  if (!record.ok) return record;
  const verifiedSnapshot = verifyAnalysisSnapshot(record.value.snapshot);
  if (!verifiedSnapshot.ok) return failure("ti_v3_evidence_unverified", "$.snapshot");
  const subject = validateEnum(record.value.subjectKind, SUBJECTS, "$.subjectKind");
  if (!subject.ok) return subject;
  if (typeof record.value.semanticKey !== "string" || !/^[a-z0-9][a-z0-9:._-]{0,255}$/.test(record.value.semanticKey)) return failure("ti_v3_validation_string_invalid", "$.semanticKey");
  if (/^(?:[a-z]:[\\/]|\\\\|\/)|account(?:_number)?[:=]|broker_row|sqlite_row/i.test(record.value.semanticKey)) return failure("ti_v3_evidence_private_identifier", "$.semanticKey");
  const optionalDigest = (value: unknown, path: string, domain?: string): ExactResult<CanonicalContentDigest | null, EvidenceFailure> => {
    if (value === null) return { ok: true, value: null };
    return validateCanonicalDigest(value, path, domain);
  };
  const correction = optionalDigest(record.value.correctionDigest, "$.correctionDigest", "correction_record");
  if (!correction.ok) return correction;
  const policy = optionalDigest(record.value.policyDigest, "$.policyDigest");
  if (!policy.ok) return policy;
  if (subject.value === "correction_version" && correction.value === null) return failure("ti_v3_validation_required_field_missing", "$.correctionDigest");
  if (subject.value === "policy_version" && policy.value === null) return failure("ti_v3_validation_required_field_missing", "$.policyDigest");
  const snapshot = verifiedSnapshot.value;
  const semanticKey = record.value.semanticKey;
  const executions = snapshot.evidenceSubjects.executionDigests as readonly string[];
  const subjectExists =
    subject.value === "canonical_execution"
      ? executions.includes(semanticKey)
      : subject.value === "execution_occurrence"
        ? snapshot.evidenceSubjects.executionOccurrenceKeys.includes(semanticKey)
        : subject.value === "correction_version"
          ? correction.value !== null && semanticKey === correction.value && snapshot.evidenceSubjects.correctionDigests.includes(correction.value)
          : subject.value === "policy_version"
            ? policy.value !== null && semanticKey === policy.value && snapshot.evidenceSubjects.policyDigests.includes(policy.value)
            : subject.value === "filter_contract"
              ? semanticKey === snapshot.filterDigest
              : snapshot.evidenceSubjects.reconstructedRoundTripKeys.includes(semanticKey);
  if (!subjectExists) return failure("ti_v3_evidence_snapshot_mismatch", "$.semanticKey");
  if (subject.value !== "correction_version" && correction.value !== null) return failure("ti_v3_evidence_snapshot_mismatch", "$.correctionDigest");
  if (subject.value !== "policy_version" && policy.value !== null) return failure("ti_v3_evidence_snapshot_mismatch", "$.policyDigest");
  const content = { schemaVersion: EVIDENCE_REFERENCE_VERSION, manifestDigest: snapshot.manifestDigest, snapshotDigest: snapshot.snapshotDigest, subjectKind: subject.value, semanticKey, correctionDigest: correction.value, policyDigest: policy.value, filterDigest: snapshot.filterDigest, policySetDigest: snapshot.policySetDigest, correctionResultDigest: snapshot.correctionResultDigest, evidenceNamespace: snapshot.evidenceNamespace, analysisCutoffAt: snapshot.analysisCutoffAt };
  const identity = createCanonicalContentIdentity("evidence_reference", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const reference = Object.freeze({ ...content, evidenceDigest: identity.value.identifier });
  verifiedReferences.add(reference);
  return { ok: true, value: reference };
}

export function verifyEvidenceReference(input: unknown): ExactResult<EvidenceReference, EvidenceFailure> {
  if (typeof input === "object" && input !== null && verifiedReferences.has(input as EvidenceReference)) return { ok: true, value: input as EvidenceReference };
  return failure("ti_v3_evidence_unverified", "$");
}

export function assertEvidenceScope(reference: EvidenceReference, expected: { readonly manifestDigest: CanonicalContentDigest; readonly snapshotDigest: CanonicalContentDigest }): ExactResult<EvidenceReference, EvidenceFailure> {
  if (reference.manifestDigest !== expected.manifestDigest) return failure("ti_v3_evidence_manifest_mismatch", "$.manifestDigest");
  if (reference.snapshotDigest !== expected.snapshotDigest) return failure("ti_v3_evidence_snapshot_mismatch", "$.snapshotDigest");
  return { ok: true, value: reference };
}
