import type { CanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import { validateCanonicalDigest, validateCanonicalTimestamp, validateEnum, validateExactRecord, type FoundationValidationFailure } from "../foundation";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../identity";

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

export function buildEvidenceReference(input: unknown): ExactResult<EvidenceReference, EvidenceFailure> {
  const record = validateExactRecord(input, ["manifestDigest", "snapshotDigest", "subjectKind", "semanticKey", "correctionDigest", "policyDigest", "filterDigest", "analysisCutoffAt"], []);
  if (!record.ok) return record;
  const manifest = validateCanonicalDigest(record.value.manifestDigest, "$.manifestDigest", "dataset_manifest");
  if (!manifest.ok) return manifest;
  const snapshot = validateCanonicalDigest(record.value.snapshotDigest, "$.snapshotDigest", "analysis_snapshot");
  if (!snapshot.ok) return snapshot;
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
  const filter = validateCanonicalDigest(record.value.filterDigest, "$.filterDigest", "canonical_filter");
  if (!filter.ok) return filter;
  const cutoff = validateCanonicalTimestamp(record.value.analysisCutoffAt, "$.analysisCutoffAt");
  if (!cutoff.ok) return cutoff;
  if (subject.value === "correction_version" && correction.value === null) return failure("ti_v3_validation_required_field_missing", "$.correctionDigest");
  if (subject.value === "policy_version" && policy.value === null) return failure("ti_v3_validation_required_field_missing", "$.policyDigest");
  const content = { schemaVersion: EVIDENCE_REFERENCE_VERSION, manifestDigest: manifest.value, snapshotDigest: snapshot.value, subjectKind: subject.value, semanticKey: record.value.semanticKey, correctionDigest: correction.value, policyDigest: policy.value, filterDigest: filter.value, analysisCutoffAt: cutoff.value };
  const identity = createCanonicalContentIdentity("evidence_reference", "v1", content);
  if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const reference = Object.freeze({ ...content, evidenceDigest: identity.value.identifier });
  verifiedReferences.add(reference);
  return { ok: true, value: reference };
}

export function verifyEvidenceReference(input: unknown): ExactResult<EvidenceReference, EvidenceFailure> {
  if (typeof input === "object" && input !== null && verifiedReferences.has(input as EvidenceReference)) return { ok: true, value: input as EvidenceReference };
  const record = validateExactRecord(input, ["schemaVersion", "manifestDigest", "snapshotDigest", "subjectKind", "semanticKey", "correctionDigest", "policyDigest", "filterDigest", "analysisCutoffAt", "evidenceDigest"], []);
  if (!record.ok || record.value.schemaVersion !== EVIDENCE_REFERENCE_VERSION) return failure("ti_v3_evidence_unverified", "$.schemaVersion");
  const rebuilt = buildEvidenceReference({ manifestDigest: record.value.manifestDigest, snapshotDigest: record.value.snapshotDigest, subjectKind: record.value.subjectKind, semanticKey: record.value.semanticKey, correctionDigest: record.value.correctionDigest, policyDigest: record.value.policyDigest, filterDigest: record.value.filterDigest, analysisCutoffAt: record.value.analysisCutoffAt });
  if (!rebuilt.ok || rebuilt.value.evidenceDigest !== record.value.evidenceDigest) return failure("ti_v3_evidence_unverified", "$.evidenceDigest");
  return rebuilt;
}

export function assertEvidenceScope(reference: EvidenceReference, expected: { readonly manifestDigest: CanonicalContentDigest; readonly snapshotDigest: CanonicalContentDigest }): ExactResult<EvidenceReference, EvidenceFailure> {
  if (reference.manifestDigest !== expected.manifestDigest) return failure("ti_v3_evidence_manifest_mismatch", "$.manifestDigest");
  if (reference.snapshotDigest !== expected.snapshotDigest) return failure("ti_v3_evidence_snapshot_mismatch", "$.snapshotDigest");
  return { ok: true, value: reference };
}
