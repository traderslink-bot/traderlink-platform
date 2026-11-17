import { createHash } from "node:crypto";

/** Parsing is not approval. Only a separately reviewed, caller-pinned artifact
 * may be passed to the runtime binder; unit fixtures confer no qualification.
 */
export const PLATFORM_ERASURE_PAYLOAD_DISPOSITION = "policy_bound_text_expiry_hold_minimal_unresolved";
const invalid = (): never => { throw new Error("platform_erasure_catalog_unqualified"); };
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : invalid();
const reference = (value: unknown): string => typeof value === "string" && /^[A-Za-z0-9_:-]{1,160}$/u.test(value) ? value : invalid();
const utc = (value: unknown): string => {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) invalid();
  return value as string;
};
const sha = (value: unknown): string => typeof value === "string" && /^[a-f0-9]{64}$/u.test(value) ? value : invalid();
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
  : value !== null && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([key,v]) => [key,canonical(v)])) : value;
export function platformErasureCatalogReviewDigest(value: unknown): string {
  const { independentReview: _review, ...content } = record(value);
  return createHash("sha256").update(JSON.stringify(canonical(content))).digest("hex");
}

/** Shared policy check for candidate configuration and reviewed runtime admission.
 * The legacy backupPolicyRef column now references reviewed restore safety ONLY;
 * no backup rotation/encryption scheme is selected or inferred by this contract.
 */
export function validatePlatformErasureCatalogPolicy(value: unknown): void {
  const c = record(value), retention = record(c.retentionPolicy), restore = record(c.backupPolicy);
  if (c.version !== "core_partner_erasure_profiles_v1" || c.referencePolicy !== "hold_signer_and_shared_owner"
    || c.payloadDisposition !== PLATFORM_ERASURE_PAYLOAD_DISPOSITION
    || retention.deliveredOrSettledMessageTextDays !== 7 || retention.rejectedModerationTextDays !== 7
    || retention.textClock !== "first_local_receipt_no_restart"
    || retention.unresolvedExternalOperationPayloads !== "minimal_identifiers_status_only_after_text_expiry"
    || retention.credentialRemoval !== "immediate_on_disconnect_or_erasure"
    || retention.pseudonymizedAuditAndIdempotencyYears !== 2 || retention.agreementPaymentRefundDisputeYears !== 7
    || restore.rotationPeriod !== "not_prescribed" || "rollingDays" in restore || "encrypted" in restore
    || restore.localAlertTextDays !== 7 || restore.erasureTombstonesReappliedAfterRestore !== true
    || restore.restoredCredentialsRemainDisabled !== true) invalid();
  const retentionRef = reference(retention.ref), restoreRef = reference(restore.ref);
  if (!Array.isArray(c.profiles) || !c.profiles.length || c.profiles.length > 1000) invalid();
  const seen = new Set<string>();
  for (const item of c.profiles as unknown[]) {
    const p = record(item), id = reference(p.profileRef);
    if (seen.has(id) || p.retentionPolicyRef !== retentionRef || p.backupPolicyRef !== restoreRef) invalid();
    seen.add(id); utc(p.validUntilUtc);
  }
}

export function readReviewedPlatformErasureCatalog(value: unknown, input: Readonly<{
  nowUtc: string; authoritySchemaSha256: string; privacySchemaSha256: string; nativeSourceArtifactSha256: string;
}>) {
  validatePlatformErasureCatalogPolicy(value);
  const c = record(value), evidence = record(c.schemaEvidence), review = record(c.independentReview);
  const now = utc(input.nowUtc), expiry = utc(c.qualificationValidUntilUtc);
  if (c.reviewStatus !== "INDEPENDENTLY_REVIEWED" || c.technicalRefsAndExpiryStatus !== "independently_reviewed"
    || evidence.reviewStatus !== "INDEPENDENTLY_REVIEWED" || review.status !== "accepted"
    || sha(review.catalogContentSha256) !== platformErasureCatalogReviewDigest(c)
    || utc(review.reviewedAtUtc) > now || utc(review.reviewedAtUtc) >= expiry || expiry <= now
    || c.authoritySchemaSha256 !== sha(input.authoritySchemaSha256)
    || c.privacySchemaSha256 !== sha(input.privacySchemaSha256)
    || c.nativeSourceArtifactSha256 !== sha(input.nativeSourceArtifactSha256)
    || sha(c.schemaSha256) !== evidence.observedSchemaSha256) invalid();
  reference(review.receiptRef); reference(review.reviewerRef); sha(evidence.artifactSha256);
  const profiles = (c.profiles as unknown[]).map(item => {
    const p = record(item), until = utc(p.validUntilUtc);
    if (until <= now || until > expiry) invalid();
    return Object.freeze({ profileRef: reference(p.profileRef), retentionPolicyRef: reference(p.retentionPolicyRef),
      backupPolicyRef: reference(p.backupPolicyRef), validUntilUtc: until });
  });
  return Object.freeze({ schemaSha256: sha(c.schemaSha256), profiles: Object.freeze(profiles) });
}
