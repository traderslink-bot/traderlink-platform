import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type {
  PlatformPremiumAuthorityScope,
  PlatformPremiumGiftRedactionPreimageV2,
  PlatformPremiumRedactedComplimentaryPortV2,
  PlatformPremiumRedactedComplimentaryReceiptV2,
} from "../membership/platform-premium-authority-repository";

/** Source-only implementation of the actual Member V6 port fragment d7b72fb9.
 * No opener, issuer, migration, runtime factory or enabled/default adapter.
 * Existing canonical command/service are NOT wired to this module.
 */
const PROTOCOL = "ordinary_complimentary_signer_redaction_v1" as const;
const TABLE = "platform_premium_signer_redaction_protocol";
const UNBOUND = Object.freeze({ kind: "unbound" as const });
const MAX_REFERENCES = 10_000;
type Receipt = PlatformPremiumRedactedComplimentaryReceiptV2;
type Preimage = PlatformPremiumGiftRedactionPreimageV2;
type PrepareInput = Parameters<PlatformPremiumRedactedComplimentaryPortV2["prepareRedaction"]>[1];
type CommitInput = Parameters<PlatformPremiumRedactedComplimentaryPortV2["commitCanonicalRedaction"]>[1];
type ReadInput = Parameters<PlatformPremiumRedactedComplimentaryPortV2["readCurrent"]>[1];
type SqlRow = Record<string, string | number | null>;

class SignerRedactionHold extends Error {
  constructor() { super("Premium signer redaction is unqualified."); }
}
const hold: () => never = () => { throw new SignerRedactionHold(); };
const digest = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const stableRow = (row: SqlRow): string => JSON.stringify(Object.keys(row).sort().map(key => [key, row[key]]));
const sameRow = (a: SqlRow, b: SqlRow): boolean => stableRow(a) === stableRow(b);
const canonicalDigest = (row: SqlRow): string => createHash("sha256").update(stableRow(row)).digest("hex");
const utc = (value: string): string => {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))
    || new Date(value).toISOString() !== value) hold();
  return value;
};
const positive = (value: number): number => {
  if (!Number.isSafeInteger(value) || value < 1) hold();
  return value;
};
const ref = (value: string): string => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_:-]{1,160}$/u.test(value)) hold();
  return value;
};
const uuid = (value: string): string => {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) hold();
  return value;
};
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const exactKeys = (value: object, keys: readonly string[]): void => {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) hold();
};
const receiptCopy = (value: Receipt): Receipt => {
  exactKeys(value,["protocol","provenanceRef","authorizationReceiptRef","qualificationRef","originalGrantRef",
    "canonicalSourceRef","privacyCaptureRef","quiescenceRef","redactionOperationRef","scope","originalTerms",
    "sourceKind","disposition","redactedAtUtc","recipientRevisionAfterRedaction","recipientEntitlementGenerationAfterRedaction"]);
  exactKeys(value.scope,["authorityKey","recipientUserId","entitlementId","planVersionId","planId"]);
  exactKeys(value.originalTerms,["giftStartsAtUtc","giftEndsAtUtc","entitlementStartsAtUtc","entitlementEndsAtUtc"]);
  if (value.protocol !== PROTOCOL || value.sourceKind !== "ordinary_owner_complimentary"
    || value.disposition !== "retain_access_remove_grantor_identity") hold();
  const r: Receipt = { protocol:PROTOCOL,provenanceRef:ref(value.provenanceRef),
    authorizationReceiptRef:ref(value.authorizationReceiptRef),qualificationRef:ref(value.qualificationRef),
    originalGrantRef:ref(value.originalGrantRef),canonicalSourceRef:ref(value.canonicalSourceRef),
    privacyCaptureRef:ref(value.privacyCaptureRef),quiescenceRef:ref(value.quiescenceRef),
    redactionOperationRef:ref(value.redactionOperationRef),
    scope:{authorityKey:uuid(value.scope.authorityKey),recipientUserId:uuid(value.scope.recipientUserId),
      entitlementId:uuid(value.scope.entitlementId),planVersionId:uuid(value.scope.planVersionId),planId:uuid(value.scope.planId)},
    originalTerms:{giftStartsAtUtc:utc(value.originalTerms.giftStartsAtUtc),
      giftEndsAtUtc:value.originalTerms.giftEndsAtUtc===null?null:utc(value.originalTerms.giftEndsAtUtc),
      entitlementStartsAtUtc:utc(value.originalTerms.entitlementStartsAtUtc),
      entitlementEndsAtUtc:value.originalTerms.entitlementEndsAtUtc===null?null:utc(value.originalTerms.entitlementEndsAtUtc)},
    sourceKind:"ordinary_owner_complimentary",disposition:"retain_access_remove_grantor_identity",
    redactedAtUtc:utc(value.redactedAtUtc),recipientRevisionAfterRedaction:positive(value.recipientRevisionAfterRedaction),
    recipientEntitlementGenerationAfterRedaction:positive(value.recipientEntitlementGenerationAfterRedaction) };
  return r;
};

export type PremiumSignerReferencePlan = Readonly<{
  /** Transient original facts, NEVER persisted by this module. Two known edges,
   * not a complete reference audit. Includes every canonical status/no-authority.
   */
  grantorUserId: string;
  canonicalRows: readonly SqlRow[];
  giftRows: readonly SqlRow[];
  recipientUserIds: readonly string[];
}>;

type Qualification = Readonly<{
  kind: "qualified_protocol";
  qualificationRef: string;
  authoritySchemaSha256: string;
  privacySchemaSha256: string;
  retentionPolicyRef: string;
  sourceArtifactSha256: string;
  canonicalWriter: "grantor_null_and_qualified_source_successor";
  validUntilUtc: string;
}>;
type Quiescence = Readonly<{
  kind: "captured_and_quiescent";
  privacyCaptureRef: string;
  quiescenceRef: string;
  originalClaimsReceiptRef: string;
  grantorUserId: string;
  referenceGraphQualificationRef: string;
  recipientUserIds: readonly string[];
  validUntilUtc: string;
}>;
type Authorization = Readonly<{
  kind: "qualified_original_authorization";
  receipt: Receipt;
  /** SHA256 of JSON sorted [column,value] pairs of the audited survivor row,
   * not a persisted hash of the erased actor or original private preimage. */
  retainedCanonicalSha256: string;
  referenceGraphQualificationRef: string;
  validUntilUtc: string;
}>;

/** These are required REAL server producers, not supplied implementations or
 * caller booleans. Reads must inspect durable qualified records and their full
 * reference/backup/retention graph. No callback may perform external I/O, open
 * another connection, release the writer or independently commit. Missing real
 * adapters leave EVERY public operation unbound. Opaque syntax is not anonymity.
 */
export interface PlatformPremiumSignerRedactionDependencies {
  nowUtc(): string;
  qualification: {
    readCurrent(database: Database.Database, input: Readonly<{
      authoritySchemaSha256: string; privacySchemaSha256: string; protocol: typeof PROTOCOL;
    }>): Qualification | Readonly<{ kind: "unbound" }>;
  };
  admission: {
    /** Must prove fresh WHOLE-PLATFORM command admission + IMMEDIATE lock on this
     * exact connection, original full-ticket validity, and complete reference
     * disposition. inTransaction and an accepted history row alone do not do so.
     */
    prepare(database: Database.Database, input: PrepareInput):
      Readonly<{ kind: "admitted"; admissionRef: string; authoritySchemaSha256: string;
        operationRef: string; authorityKey: string; recipientUserId: string; validUntilUtc: string }>
      | Readonly<{ kind: "unbound" }>;
    recheckPrepared(database: Database.Database, receipt: Receipt):
      Readonly<{ kind: "admitted"; admissionRef: string; authoritySchemaSha256: string;
        operationRef: string; authorityKey: string; recipientUserId: string; validUntilUtc: string }>
      | Readonly<{ kind: "unbound" }>;
    /** Ordinary current-recipient admission after the grantor has disappeared.
     * Requalify durable evidence; never reuse the short preparation deadline as
     * a permanent gift expiry or invent a sliding now+duration observation.
     */
    readRecipient(database: Database.Database, input: ReadInput):
      Readonly<{ kind: "admitted_recipient"; admissionRef: string; authoritySchemaSha256: string;
        scope: PlatformPremiumAuthorityScope; authorityRevision: number; validUntilUtc: string }>
      | Readonly<{ kind: "unbound" }>;
  };
  fences: {
    /** Durable all-recipient capture and proven writer quiescence BEFORE issuing
     * a receipt, including canonical-only recipients. NEVER infer from expired
     * leases. Capture original desired/event/inflight/managed tickets and late
     * outcomes; do not replace old tickets with fresh captures. No material
     * authority/gift/canonical mutation is allowed in this preparation step.
     */
    captureAndQuiesce(database: Database.Database, input: Readonly<{
      preparation: PrepareInput; references: PremiumSignerReferencePlan;
    }>): Quiescence | Readonly<{ kind: "unbound" }>;
    readCurrent(database: Database.Database, receipt: Receipt): Quiescence | Readonly<{ kind: "unbound" }>;
  };
  originalAuthorization: {
    /** Real original durable gift authorization, not a fake issuer or NULL
     * fallback. Produce only qualified nonidentifying original authorization and
     * source/grant/receipt successors; audit free text and every retained ref.
     * If immutable grantRef itself identifies the actor, HOLD for an explicit
     * producer successor rather than retaining it or silently renaming it.
     */
    prepare(database: Database.Database, input: Readonly<{
      preparation: PrepareInput; references: PremiumSignerReferencePlan;
      quiescence: Quiescence; canonicalBefore: SqlRow;
    }>): Authorization | Readonly<{ kind: "unbound" }>;
    readCurrent(database: Database.Database, receipt: Receipt): Authorization | Readonly<{ kind: "unbound" }>;
  };
}

/** ID-free strings ONLY. Member owns its V2 provenance row; this is the separate
 * privacy protocol receipt. No original actor, original ticket, raw preimage or
 * actor-derived digest is persisted here. Recipient FK is deliberate: erasing a
 * recipient requires explicit receipt retention/purge qualification, not an
 * exemption. AFTER DELETE HOLD survives canonical BEFORE-guard suspension.
 */
export const platformPremiumSignerRedactionSchemaStatements: readonly string[] = Object.freeze([
  `CREATE TABLE ${TABLE} (
    provenance_ref TEXT PRIMARY KEY, operation_ref TEXT NOT NULL,
    authority_key TEXT NOT NULL REFERENCES platform_premium_authorities(authority_key) ON DELETE RESTRICT,
    recipient_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    grant_ref TEXT NOT NULL REFERENCES platform_premium_complimentary_grants(grant_ref) ON DELETE RESTRICT,
    receipt_json TEXT NOT NULL CHECK(json_valid(receipt_json)), receipt_sha256 TEXT NOT NULL,
    retained_canonical_sha256 TEXT NOT NULL,
    phase TEXT NOT NULL CHECK(phase IN ('prepared','canonical_written','recipient_verified')),
    preparation_valid_until_utc TEXT NOT NULL, UNIQUE(operation_ref,grant_ref)
  ) STRICT`,
  `CREATE TRIGGER premium_signer_protocol_immutable BEFORE UPDATE ON ${TABLE}
   WHEN NEW.provenance_ref IS NOT OLD.provenance_ref OR NEW.operation_ref IS NOT OLD.operation_ref
     OR NEW.authority_key IS NOT OLD.authority_key OR NEW.recipient_user_id IS NOT OLD.recipient_user_id
     OR NEW.grant_ref IS NOT OLD.grant_ref OR NEW.receipt_json IS NOT OLD.receipt_json
     OR NEW.receipt_sha256 IS NOT OLD.receipt_sha256 OR NEW.retained_canonical_sha256 IS NOT OLD.retained_canonical_sha256
     OR NEW.preparation_valid_until_utc IS NOT OLD.preparation_valid_until_utc
     OR NOT (NEW.phase=OLD.phase OR (OLD.phase='prepared' AND NEW.phase='canonical_written')
       OR (OLD.phase='canonical_written' AND NEW.phase='recipient_verified'))
   BEGIN SELECT RAISE(ABORT,'premium_signer_protocol_immutable'); END`,
  `CREATE TRIGGER premium_signer_protocol_retention_hold AFTER DELETE ON ${TABLE}
   BEGIN SELECT RAISE(ABORT,'premium_signer_protocol_retention_unqualified'); END`,
]);
export const platformPremiumSignerRedactionSchemaDescriptor = Object.freeze({
  canRegister: false as const, migrationId: null, executionOrder: null,
  statements: platformPremiumSignerRedactionSchemaStatements,
  sha256: digest(platformPremiumSignerRedactionSchemaStatements),
  memberPortFragmentSha256: "d7b72fb930ce4dce0ac1af9c39362250b66f3bf7c7c1f49477504769d818f19b",
  requiredAdapters: Object.freeze(["real_command_admission_and_current_full_ticket", "real_original_nonidentifying_authorization",
    "durable_all_recipient_fences_original_claim_capture_and_proven_quiescence", "qualified_reference_backup_retention_policy"]),
  phaseMeaning: "Local protocol progress ONLY; no phase certifies external cleanup or identifying-ticket retirement.",
  materialFences: "This private protocol row does not replace Member material counters. Member canonical/gift/provenance writes own their exact three advances; qualification/issuer revocation must fence affected recipients through the real producer.",
  recipientErasure: "HOLD until explicit recipient provenance/retention/recovery contract. No default delete or expiry prune.",
});

type Stored = { receipt_json: string; receipt_sha256: string; phase: "prepared" | "canonical_written" | "recipient_verified";
  preparation_valid_until_utc: string; operation_ref: string; retained_canonical_sha256: string };

export class PlatformPremiumSignerRedaction implements PlatformPremiumRedactedComplimentaryPortV2 {
  constructor(private readonly dependencies: PlatformPremiumSignerRedactionDependencies | null = null) {}

  private attempt<T>(database: Database.Database, operation: () => T): T | typeof UNBOUND {
    if (!database.inTransaction || !this.dependencies) return UNBOUND;
    try { return database.transaction(operation)(); }
    catch (error) { if (error instanceof SignerRedactionHold) return UNBOUND; throw error; }
  }
  private now(): string { if (!this.dependencies) hold(); return utc(this.dependencies.nowUtc()); }
  private admission(database: Database.Database, receipt: Receipt) {
    if (!this.dependencies || !database.inTransaction) hold();
    const a = this.dependencies.admission.recheckPrepared(database, receipt);
    if (a.kind !== "admitted" || utc(a.validUntilUtc) <= this.now()
      || a.operationRef !== receipt.redactionOperationRef || a.authorityKey !== receipt.scope.authorityKey
      || a.recipientUserId !== receipt.scope.recipientUserId) hold();
    ref(a.admissionRef);
    return a;
  }
  private qualified(database: Database.Database, authoritySchemaSha256: string): Qualification {
    if (!database.inTransaction || !this.dependencies || !/^[a-f0-9]{64}$/u.test(authoritySchemaSha256)) hold();
    const q = this.dependencies.qualification.readCurrent(database, { authoritySchemaSha256,
      privacySchemaSha256: platformPremiumSignerRedactionSchemaDescriptor.sha256, protocol: PROTOCOL });
    if (q.kind !== "qualified_protocol" || q.authoritySchemaSha256 !== authoritySchemaSha256
      || q.privacySchemaSha256 !== platformPremiumSignerRedactionSchemaDescriptor.sha256
      || q.canonicalWriter !== "grantor_null_and_qualified_source_successor" || utc(q.validUntilUtc) <= this.now()
      || !/^[a-f0-9]{64}$/u.test(q.sourceArtifactSha256)) hold();
    ref(q.qualificationRef); ref(q.retentionPolicyRef);
    for (const sql of platformPremiumSignerRedactionSchemaStatements) {
      const match = /^CREATE (TABLE|TRIGGER) ([a-z_]+)/u.exec(sql); if (!match) hold();
      const row = database.prepare<[string, string], { sql: string }>("SELECT sql FROM sqlite_schema WHERE type=? AND name=?")
        .get(match[1]!.toLowerCase(), match[2]!);
      if (!row || row.sql.replace(/\r\n?/gu, "\n").trim() !== sql.replace(/\r\n?/gu, "\n").trim()) hold();
    }
    return q;
  }
  isQualified(database: Database.Database, input: Parameters<PlatformPremiumRedactedComplimentaryPortV2["isQualified"]>[1]): boolean {
    if (input.protocol !== PROTOCOL) return false;
    const result = this.attempt(database, () => { this.qualified(database, input.authoritySchemaSha256); return true; });
    return result === true;
  }
  private references(database: Database.Database, grantorUserId: string): PremiumSignerReferencePlan {
    uuid(grantorUserId);
    const canonicalRows = database.prepare<[string, string], SqlRow>(`SELECT * FROM platform_membership_entitlements
      WHERE granted_by_user_id=? AND user_id<>? ORDER BY entitlement_id LIMIT 10001`).all(grantorUserId, grantorUserId);
    const giftRows = database.prepare<[string, string], SqlRow>(`SELECT g.*,a.user_id AS recipient_user_id,a.phase AS recipient_phase,
      a.authority_revision,a.entitlement_generation FROM platform_premium_complimentary_grants g
      JOIN platform_premium_authorities a USING(authority_key)
      WHERE g.actor_user_id=? AND (a.user_id IS NULL OR a.user_id<>?) ORDER BY g.authority_key,g.grant_ref LIMIT 10001`)
      .all(grantorUserId, grantorUserId);
    if (canonicalRows.length > MAX_REFERENCES || giftRows.length > MAX_REFERENCES
      || giftRows.some(row => row.recipient_user_id === null || row.recipient_phase !== "live")) hold();
    const recipientUserIds = [...new Set([...canonicalRows.map(row => uuid(String(row.user_id))),
      ...giftRows.map(row => uuid(String(row.recipient_user_id)))])].sort();
    return copy({ grantorUserId, canonicalRows, giftRows, recipientUserIds });
  }
  private canonical(database: Database.Database, preimage: Preimage): SqlRow {
    const row = database.prepare<[string, string], SqlRow>(
      "SELECT * FROM platform_membership_entitlements WHERE entitlement_id=? AND user_id=?",
    ).get(uuid(preimage.entitlementId), uuid(preimage.recipientUserId));
    if (!row || row.plan_version_id !== preimage.planVersionId || row.source_type !== "owner_grant"
      || String(row.source_ref).startsWith("external:") || row.starts_at_utc !== preimage.entitlementStartsAtUtc
      || row.ends_at_utc !== preimage.entitlementEndsAtUtc) hold();
    return row;
  }
  private validateReceipt(receipt: Receipt, preimage: Preimage, operationRef: string): Receipt {
    const r = receiptCopy(receipt);
    if (r.protocol !== PROTOCOL || r.sourceKind !== "ordinary_owner_complimentary"
      || r.disposition !== "retain_access_remove_grantor_identity" || r.redactionOperationRef !== operationRef
      || r.originalGrantRef !== preimage.grantRef || r.scope.authorityKey !== preimage.authorityKey
      || r.scope.recipientUserId !== preimage.recipientUserId || r.scope.entitlementId !== preimage.entitlementId
      || r.scope.planVersionId !== preimage.planVersionId || r.scope.planId !== preimage.planId
      || r.originalTerms.giftStartsAtUtc !== preimage.giftStartsAtUtc || r.originalTerms.giftEndsAtUtc !== preimage.giftEndsAtUtc
      || r.originalTerms.entitlementStartsAtUtc !== preimage.entitlementStartsAtUtc
      || r.originalTerms.entitlementEndsAtUtc !== preimage.entitlementEndsAtUtc || utc(r.redactedAtUtc) > this.now()) hold();
    for (const v of [r.provenanceRef,r.authorizationReceiptRef,r.qualificationRef,r.originalGrantRef,r.canonicalSourceRef,
      r.privacyCaptureRef,r.quiescenceRef,r.redactionOperationRef]) ref(v);
    positive(r.recipientRevisionAfterRedaction); positive(r.recipientEntitlementGenerationAfterRedaction);
    // Syntax alone does not qualify refs; real issuer/reference-graph checks below are mandatory.
    return r;
  }
  private quiescence(value: Quiescence | typeof UNBOUND, receipt: Receipt, recipients?: readonly string[]): Quiescence {
    if (value.kind !== "captured_and_quiescent" || value.privacyCaptureRef !== receipt.privacyCaptureRef
      || value.quiescenceRef !== receipt.quiescenceRef || utc(value.validUntilUtc) <= this.now()) hold();
    ref(value.originalClaimsReceiptRef); ref(value.referenceGraphQualificationRef); uuid(value.grantorUserId);
    const covered = new Set(value.recipientUserIds.map(uuid));
    if (covered.size !== value.recipientUserIds.length || (recipients && recipients.some(id => !covered.has(id)))) hold();
    // Additional members may be from earlier items in the SAME qualified batch;
    // the real capture producer must verify its durable complete reference plan.
    return value;
  }
  private stored(database: Database.Database, receipt: Receipt): Stored {
    const row = database.prepare<[string], Stored>(`SELECT * FROM ${TABLE} WHERE provenance_ref=?`).get(ref(receipt.provenanceRef));
    if (!row || row.operation_ref !== receipt.redactionOperationRef || row.receipt_sha256 !== digest(receipt)
      || row.receipt_sha256 !== digest(JSON.parse(row.receipt_json))
      || !/^[a-f0-9]{64}$/u.test(row.retained_canonical_sha256)) hold();
    return row;
  }
  prepareRedaction(database: Database.Database, input: PrepareInput) {
    return this.attempt(database, () => {
      input = copy(input);
      const d = this.dependencies!; const p = input.preimage;
      const a = d.admission.prepare(database,input);
      if (a.kind !== "admitted" || a.operationRef !== input.operationRef || a.authorityKey !== p.authorityKey
        || a.recipientUserId !== p.recipientUserId || utc(a.validUntilUtc) <= this.now()) hold();
      ref(a.admissionRef);
      const q = this.qualified(database, a.authoritySchemaSha256);
      if (p.signerUserId === p.recipientUserId || input.originalTicket.scope.authorityKey !== p.authorityKey
        || input.originalTicket.scope.userId !== p.recipientUserId || utc(input.originalTicket.validUntilUtc) <= this.now()
        || utc(input.originalTicket.observedAtUtc) > this.now()) hold();
      const before = this.canonical(database, p);
      if (before.granted_by_user_id !== p.signerUserId || before.source_ref !== p.canonicalSourceRef) hold();
      const authorityBefore = database.prepare<[string], SqlRow>(
        "SELECT * FROM platform_premium_authorities WHERE authority_key=?",
      ).get(p.authorityKey);
      if (!authorityBefore || authorityBefore.phase !== "live" || authorityBefore.user_id !== p.recipientUserId
        || authorityBefore.authority_revision !== input.originalTicket.authorityRevision
        || authorityBefore.entitlement_generation !== input.originalTicket.scope.entitlementGeneration
        || authorityBefore.identity_generation !== input.originalTicket.scope.identityGeneration
        || authorityBefore.erasure_generation !== input.originalTicket.scope.erasureGeneration
        || authorityBefore.whop_generation !== input.originalTicket.whopGeneration
        || input.nextAuthorityRevision !== positive(input.originalTicket.authorityRevision+3)
        || input.nextEntitlementGeneration !== positive(input.originalTicket.scope.entitlementGeneration+3)) hold();
      const references = this.references(database, p.signerUserId);
      const captured = d.fences.captureAndQuiesce(database, { preparation: input, references });
      if (captured.kind !== "captured_and_quiescent") hold();
      const issued = d.originalAuthorization.prepare(database, { preparation: input, references, quiescence: captured, canonicalBefore: copy(before) });
      if (issued.kind !== "qualified_original_authorization" || utc(issued.validUntilUtc) <= this.now()) hold();
      const receipt = this.validateReceipt(issued.receipt, p, ref(input.operationRef));
      if (JSON.stringify(receipt).toLowerCase().includes(p.signerUserId.toLowerCase())
        || JSON.stringify({ ...before,granted_by_user_id:null,source_ref:receipt.canonicalSourceRef })
          .toLowerCase().includes(p.signerUserId.toLowerCase())) hold();
      // Literal check is only defense in depth, never reference/encoding proof.
      ref(issued.referenceGraphQualificationRef);
      if (captured.grantorUserId !== p.signerUserId || issued.referenceGraphQualificationRef !== captured.referenceGraphQualificationRef) hold();
      if (receipt.qualificationRef !== q.qualificationRef
        || receipt.recipientRevisionAfterRedaction !== positive(input.nextAuthorityRevision)
        || receipt.recipientEntitlementGenerationAfterRedaction !== positive(input.nextEntitlementGeneration)
        || issued.retainedCanonicalSha256 !== canonicalDigest({ ...before, granted_by_user_id: null, source_ref: receipt.canonicalSourceRef })) hold();
      this.quiescence(captured, receipt, references.recipientUserIds);
      const authorityAfter = database.prepare<[string], SqlRow>(
        "SELECT * FROM platform_premium_authorities WHERE authority_key=?",
      ).get(p.authorityKey);
      if (!authorityAfter || !sameRow(authorityBefore,authorityAfter) || !sameRow(before, this.canonical(database, p))
        || digest(this.references(database, p.signerUserId)) !== digest(references)) hold();
      const until = [q.validUntilUtc,a.validUntilUtc,issued.validUntilUtc,captured.validUntilUtc,input.originalTicket.validUntilUtc].map(utc).sort()[0]!;
      database.prepare(`INSERT INTO ${TABLE} (provenance_ref,operation_ref,authority_key,recipient_user_id,grant_ref,
        receipt_json,receipt_sha256,retained_canonical_sha256,phase,preparation_valid_until_utc) VALUES(?,?,?,?,?,?,?,?,'prepared',?)`)
        .run(receipt.provenanceRef,receipt.redactionOperationRef,receipt.scope.authorityKey,receipt.scope.recipientUserId,
          receipt.originalGrantRef,JSON.stringify(receipt),digest(receipt),issued.retainedCanonicalSha256,until);
      return Object.freeze({ kind: "prepared" as const, receipt: Object.freeze(receipt) });
    });
  }
  commitCanonicalRedaction(database: Database.Database, input: CommitInput) {
    return this.attempt(database, () => {
      input = copy(input); const d = this.dependencies!; const p = input.preimage;
      const receipt = this.validateReceipt(input.receipt,p,input.receipt.redactionOperationRef);
      const a = this.admission(database,receipt);
      this.qualified(database,a.authoritySchemaSha256);
      const stored = this.stored(database,receipt);
      if (stored.phase !== "prepared" || utc(stored.preparation_valid_until_utc) <= this.now()) hold();
      const before = this.canonical(database,p);
      if (before.granted_by_user_id !== p.signerUserId || before.source_ref !== p.canonicalSourceRef) hold();
      const refs = this.references(database,p.signerUserId);
      const quiescence = this.quiescence(d.fences.readCurrent(database,receipt),receipt,refs.recipientUserIds);
      if (quiescence.grantorUserId !== p.signerUserId) hold();
      const authorization = d.originalAuthorization.readCurrent(database,receipt);
      if (authorization.kind !== "qualified_original_authorization" || digest(receiptCopy(authorization.receipt)) !== digest(receipt)
        || utc(authorization.validUntilUtc) <= this.now()
        || authorization.retainedCanonicalSha256 !== stored.retained_canonical_sha256
        || authorization.retainedCanonicalSha256 !== canonicalDigest({ ...before,granted_by_user_id:null,source_ref:receipt.canonicalSourceRef })) hold();
      ref(authorization.referenceGraphQualificationRef);
      if (authorization.referenceGraphQualificationRef !== quiescence.referenceGraphQualificationRef) hold();
      const authorityBefore = database.prepare<[string], SqlRow>(
        "SELECT * FROM platform_premium_authorities WHERE authority_key=?",
      ).get(receipt.scope.authorityKey);
      if (!authorityBefore || authorityBefore.phase !== "live" || authorityBefore.user_id !== p.recipientUserId
        || authorityBefore.authority_revision !== receipt.recipientRevisionAfterRedaction-3
        || authorityBefore.entitlement_generation !== receipt.recipientEntitlementGenerationAfterRedaction-3) hold();
      const result = database.prepare(`UPDATE platform_membership_entitlements SET granted_by_user_id=NULL,source_ref=?
        WHERE entitlement_id=? AND user_id=? AND granted_by_user_id=? AND source_ref=?`)
        .run(receipt.canonicalSourceRef,p.entitlementId,p.recipientUserId,p.signerUserId,p.canonicalSourceRef);
      if (result.changes !== 1 || !sameRow(this.canonical(database,p),{ ...before,granted_by_user_id:null,source_ref:receipt.canonicalSourceRef })) hold();
      const authorityAfter = database.prepare<[string], SqlRow>(
        "SELECT * FROM platform_premium_authorities WHERE authority_key=?",
      ).get(receipt.scope.authorityKey);
      if (!authorityAfter || !sameRow(authorityAfter,{ ...authorityBefore,
        authority_revision:receipt.recipientRevisionAfterRedaction-2,
        entitlement_generation:receipt.recipientEntitlementGenerationAfterRedaction-2 })) hold();
      if (database.prepare(`UPDATE ${TABLE} SET phase='canonical_written' WHERE provenance_ref=? AND phase='prepared'`)
        .run(receipt.provenanceRef).changes !== 1) hold();
      return Object.freeze({ kind: "applied" as const });
    });
  }
  private readQualified(database: Database.Database, input: ReadInput) {
    const d = this.dependencies!;
    const a = d.admission.readRecipient(database,input);
    if (a.kind !== "admitted_recipient" || utc(a.validUntilUtc) <= this.now()) hold();
    const scopeKeys: readonly (keyof PlatformPremiumAuthorityScope)[] = ["authorityKey","userId","discordUserId","guildId",
      "identityGeneration","entitlementGeneration","erasureGeneration","policyGeneration"];
    if (scopeKeys.some(key => a.scope[key] !== input.scope[key]) || a.authorityRevision !== input.authorityRevision) hold();
    ref(a.admissionRef);
    const q = this.qualified(database,a.authoritySchemaSha256);
    const row = database.prepare<[string,string], Stored>(`SELECT * FROM ${TABLE} WHERE authority_key=? AND grant_ref=?`)
      .get(uuid(input.scope.authorityKey),ref(input.grantRef));
    if (!row || row.phase === "prepared") hold();
    const r = receiptCopy(JSON.parse(row.receipt_json) as Receipt); this.stored(database,r);
    const memberReceipt = database.prepare<[string,string,string], {receipt_json:string;receipt_sha256:string}>(
      "SELECT receipt_json,receipt_sha256 FROM platform_premium_complimentary_redactions_v2 WHERE provenance_ref=? AND authority_key=? AND grant_ref=?",
    ).get(r.provenanceRef,r.scope.authorityKey,r.originalGrantRef);
    if (!memberReceipt || digest(receiptCopy(JSON.parse(memberReceipt.receipt_json) as Receipt)) !== digest(r)
      || memberReceipt.receipt_sha256 !== digest(r) || r.redactedAtUtc > this.now()) hold();
    if (r.scope.entitlementId !== input.entitlementId || r.scope.recipientUserId !== input.scope.userId) hold();
    const authority = database.prepare<[string], SqlRow>("SELECT * FROM platform_premium_authorities WHERE authority_key=?").get(r.scope.authorityKey);
    if (!authority || authority.phase !== "live" || authority.user_id !== input.scope.userId
      || authority.authority_revision !== input.authorityRevision || authority.identity_generation !== input.scope.identityGeneration
      || authority.entitlement_generation !== input.scope.entitlementGeneration || authority.erasure_generation !== input.scope.erasureGeneration
      || input.authorityRevision < r.recipientRevisionAfterRedaction || input.scope.entitlementGeneration < r.recipientEntitlementGenerationAfterRedaction) hold();
    const policy = database.prepare<[string], SqlRow>(
      "SELECT * FROM platform_premium_authority_policies WHERE policy_ref=?",
    ).get(String(authority.policy_ref));
    const version = database.prepare<[string], SqlRow>(
      "SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?",
    ).get(r.scope.planVersionId);
    if (!policy || policy.state !== "active" || policy.guild_id !== input.scope.guildId
      || policy.generation !== input.scope.policyGeneration || !version || version.plan_id !== r.scope.planId
      || !(JSON.parse(String(policy.premium_plan_ids_json)) as unknown[]).includes(r.scope.planId)
      || !database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(input.scope.userId)) hold();
    const canonical = database.prepare<[string], SqlRow>("SELECT * FROM platform_membership_entitlements WHERE entitlement_id=?").get(r.scope.entitlementId);
    const gift = database.prepare<[string], SqlRow>("SELECT * FROM platform_premium_complimentary_grants WHERE grant_ref=?").get(r.originalGrantRef);
    if (!canonical || !gift || canonical.user_id !== input.scope.userId || canonical.granted_by_user_id !== null
      || gift.actor_user_id !== null || gift.authorization_ref !== r.authorizationReceiptRef || gift.authority_key !== r.scope.authorityKey
      || gift.entitlement_id !== canonical.entitlement_id || canonical.plan_version_id !== r.scope.planVersionId
      || canonical.source_type !== "owner_grant" || canonical.source_ref !== r.canonicalSourceRef
      || canonical.status !== "active" || gift.status !== "active" || canonical.starts_at_utc !== r.originalTerms.entitlementStartsAtUtc
      || canonical.ends_at_utc !== r.originalTerms.entitlementEndsAtUtc || gift.starts_at_utc !== r.originalTerms.giftStartsAtUtc
      || gift.ends_at_utc !== r.originalTerms.giftEndsAtUtc) hold();
    const authorization = d.originalAuthorization.readCurrent(database,r);
    if (authorization.kind !== "qualified_original_authorization" || digest(receiptCopy(authorization.receipt)) !== digest(r)
      || authorization.retainedCanonicalSha256 !== canonicalDigest(canonical) || utc(authorization.validUntilUtc) <= this.now()) hold();
    ref(authorization.referenceGraphQualificationRef);
    const now = this.now();
    const starts = [r.originalTerms.giftStartsAtUtc,r.originalTerms.entitlementStartsAtUtc].map(utc);
    const ends = [r.originalTerms.giftEndsAtUtc,r.originalTerms.entitlementEndsAtUtc].filter((v): v is string => v !== null).map(utc);
    if (ends.some(v => v <= now)) hold();
    // Provenance may be qualified before access begins; recheck at each start.
    const futureStarts = starts.filter(v => v > now);
    const validUntilUtc = [q.validUntilUtc,a.validUntilUtc,authorization.validUntilUtc,...futureStarts,...ends].map(utc).sort()[0]!;
    if (validUntilUtc <= now) hold();
    return Object.freeze({ kind: "qualified" as const, receipt: Object.freeze(r), validUntilUtc });
  }
  readCurrent(database: Database.Database, input: ReadInput) {
    return this.attempt(database, () => this.readQualified(database,copy(input)));
  }
  /** Recovery re-reads committed local receipts/facts only. Never replay original
   * redaction, root deletion or external work; never convert lease expiry to
   * success. A prepared/partial state remains HOLD for its real orchestrator.
   */
  reconcileRecipient(database: Database.Database, input: ReadInput) {
    return this.attempt(database, () => {
      const result = this.readQualified(database,copy(input));
      database.prepare(`UPDATE ${TABLE} SET phase='recipient_verified' WHERE provenance_ref=? AND phase='canonical_written'`)
        .run(result.receipt.provenanceRef);
      return Object.freeze({ kind: "recipient_verified" as const, receipt: result.receipt,
        externalCleanup: "not_certified" as const, identifyingTicketRetirement: "not_certified" as const });
    });
  }
}
