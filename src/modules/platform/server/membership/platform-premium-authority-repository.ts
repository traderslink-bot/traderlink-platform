import { isReviewed210PremiumEventsLedgerPrefix, isReviewed211NewsMembershipsLedger } from "../privacy/platform-erasure-210-boundary";
import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import {
  isPreparedPlatformPremiumWhopCoverage,
  readStoredPlatformPremiumWhopCollection,
  type PlatformPremiumNativeCollection,
  type PlatformPremiumNativePayer,
  type PlatformPremiumNativePurchase,
  type PlatformPremiumOfferScope,
  type PlatformPremiumPreparedWhopCoverage,
} from "./platform-premium-whop-native";

import { isPreparedPlatformPremiumWhopCurrentAccess, readStoredPlatformPremiumWhopCurrentAccess,
  type PlatformPremiumNativeCurrentAccessCollection, type PlatformPremiumPreparedWhopCurrentAccess } from "./platform-premium-whop-current-access";
type StoredPremiumNativeCollection = PlatformPremiumNativeCollection | PlatformPremiumNativeCurrentAccessCollection;

export class PlatformPremiumAuthorityError extends Error {
  constructor(readonly code: "unbound" | "invalid" | "conflict" | "transaction_required",
    readonly reason?: "canonical_signer_entitlement_disposition_unqualified" | "gift_signer_reference_unqualified") {
    super("Premium authority is not qualified for this operation.");
  }
}

const invalid: () => never = () => { throw new PlatformPremiumAuthorityError("invalid"); };
const ref = (value: string): string => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_:-]{1,160}$/u.test(value)) invalid();
  return value;
};
const uuid = (value: string): string => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) invalid();
  return value;
};
const integer = (value: number): number => {
  if (!Number.isSafeInteger(value) || value < 1) invalid();
  return value;
};
const utc = (value: string): string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
    || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) invalid();
  return value;
};
const snowflake = (value: string): string => {
  if (!/^[1-9][0-9]{0,19}$/u.test(value) || BigInt(value) > (BigInt(1) << BigInt(64)) - BigInt(1)) invalid();
  return value;
};
const sha = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export type PlatformPremiumAuthorityPolicyInput = Readonly<{
  policyRef: string;
  configurationRef: string;
  guildId: string;
  state: "active" | "disabled";
  offerScopes: readonly PlatformPremiumOfferScope[];
  premiumPlanIds: readonly string[];
  maximumEvidenceAgeMs: number;
  nativeQualification: Readonly<{ reviewRef: string; schemaSha256: string; apiVersion: string }> | null;
}>;
export type PlatformPremiumAuthorityPolicy = PlatformPremiumAuthorityPolicyInput & Readonly<{ generation: number }>;

export type PlatformPremiumAuthorityScope = Readonly<{
  authorityKey: string;
  userId: string;
  discordUserId: string | null;
  guildId: string;
  identityGeneration: number;
  entitlementGeneration: number;
  erasureGeneration: number;
  policyGeneration: number;
}>;

/** Persist this exact ticket with a prepared intent. Revision alone cannot fence
 * a paid period expiring without a database write. No in-memory ticket registry
 * or timestamp-derived generation is an acceptable substitute. */
export type PlatformPremiumAuthorityTicket = Readonly<{
  scope: PlatformPremiumAuthorityScope;
  authorityRevision: number;
  whopGeneration: number;
  admissionRef: string;
  factsSha256: string;
  observedAtUtc: string;
  validUntilUtc: string;
}>;

export type PlatformPremiumAuthoritySnapshot = Readonly<{
  kind: "snapshot";
  ticket: PlatformPremiumAuthorityTicket;
  policy: PlatformPremiumAuthorityPolicy;
  payer: PlatformPremiumNativePayer;
  coverage: readonly (Readonly<{ kind: "native_coverage"; offer: PlatformPremiumOfferScope;
    collection: StoredPremiumNativeCollection; observationRef: string }>
    | Readonly<{ kind: "unknown"; offer: PlatformPremiumOfferScope; reason: string; basis?: "current_provider_access" }>)[];
  complimentary: Readonly<{ kind: "active"; grantRef: string; actorUserId: string;
    authorizationRef: string; startsAtUtc: string; endsAtUtc: string | null }>
    | Readonly<{ kind: "none" | "unknown" }>;
  /** Native old-subject facts only. Paid must supply its own actual managed
   * assignment references; release history does not prove a managed role. */
  retiredSubjectFacts: readonly Readonly<{ discordUserId: string; identityGeneration: number }>[];
}>;
export type PlatformPremiumAuthorityRead = PlatformPremiumAuthoritySnapshot
  | Readonly<{ kind: "unbound"; reason: string }>;

/** Dormant V2 source contract. The repository implements the V2 methods below;
 * actual privacy/authorization adapters and schema remain unqualified/uninstalled.
 * V1 capture/isCurrent and its mandatory active actor are unchanged.
 * Consumers must explicitly adopt captureV2 + isCurrentV2 together; casting a V1
 * snapshot or replacing a persisted ORIGINAL ticket is not an adapter. */
export type PlatformPremiumRedactedComplimentaryReceiptV2 = Readonly<{
  protocol: "ordinary_complimentary_signer_redaction_v1";
  /** Durable opaque references from the real qualified producer. Neither these
   * refs nor referenced retained records may encode/resolve to the erased actor
   * without an independently approved retention basis. A UUID hash is not proof
   * of anonymization. No replacement administrator is introduced. */
  provenanceRef: string;
  authorizationReceiptRef: string;
  qualificationRef: string;
  originalGrantRef: string;
  canonicalSourceRef: string;
  privacyCaptureRef: string;
  quiescenceRef: string;
  redactionOperationRef: string;
  scope: Readonly<{
    authorityKey: string;
    recipientUserId: string;
    entitlementId: string;
    planVersionId: string;
    planId: string;
  }>;
  /** Original explicitly authorized gift and canonical entitlement bounds.
   * Redaction must not extend either period or adopt generic historical grants. */
  originalTerms: Readonly<{
    giftStartsAtUtc: string;
    giftEndsAtUtc: string | null;
    entitlementStartsAtUtc: string;
    entitlementEndsAtUtc: string | null;
  }>;
  sourceKind: "ordinary_owner_complimentary";
  disposition: "retain_access_remove_grantor_identity";
  redactedAtUtc: string;
  /** Actual committed post-redaction recipient epochs, never inferred/defaulted.
   * Later authorized changes may advance these; the real read must requalify the
   * retained receipt against CURRENT rows/epochs rather than freeze the user at
   * these old epochs or overwrite a caller's original prepared-intent ticket. */
  recipientRevisionAfterRedaction: number;
  recipientEntitlementGenerationAfterRedaction: number;
}>;

export type PlatformPremiumComplimentaryV2 = Readonly<{
  kind: "active";
  grantRef: string;
  entitlementId: string;
  startsAtUtc: string;
  endsAtUtc: string | null;
  provenance: Readonly<{ kind: "live_signer"; actorUserId: string; authorizationRef: string }>
    | Readonly<{ kind: "qualified_redacted_signer";
      receipt: PlatformPremiumRedactedComplimentaryReceiptV2 }>;
}> | Readonly<{ kind: "none" | "unknown" }>;

export type PlatformPremiumAuthoritySnapshotV2 = Readonly<
  Omit<PlatformPremiumAuthoritySnapshot, "complimentary"> & {
    apiVersion: "platform_premium_authority_v2";
    complimentary: PlatformPremiumComplimentaryV2;
  }
>;
export type PlatformPremiumAuthorityReadV2 = PlatformPremiumAuthoritySnapshotV2
  | Readonly<{ kind: "unbound"; reason: string }>;

/** Proposed privacy/owner producer port, NOT a supplied qualification boolean or
 * an implementation. Every read uses the caller's admitted IMMEDIATE transaction
 * after schema/protocol qualification. Null signer fields alone are never proof.
 * The producer must bind the original real authorization and exact retained rows,
 * reject paid/external grants, establish nonidentifying retained provenance and
 * verify revocation/period/scope plus the CURRENT recipient revision/generation.
 * Both gift.actor_user_id and canonical granted_by_user_id must be NULL, with
 * the original canonical recipient row retained and its ordinary owner-grant
 * classification/authorization qualified. Neither NULL permits generic adoption.
 * Missing, forged, stale or unqualified evidence is unbound/UNKNOWN, not unpaid. */
export type PlatformPremiumGiftRedactionPreimageV2 = Readonly<{
  grantRef: string; authorityKey: string; recipientUserId: string; entitlementId: string;
  planVersionId: string; planId: string; signerUserId: string;
  authorizationRef: string; canonicalSourceRef: string;
  giftStartsAtUtc: string; giftEndsAtUtc: string | null;
  entitlementStartsAtUtc: string; entitlementEndsAtUtc: string | null;
}>;

export interface PlatformPremiumRedactedComplimentaryPortV2 {
  /** Real issuer, same admitted IMMEDIATE transaction. It must inspect original
   * durable owner authorization, preserve it nonidentifyingly, admit/quiesce the
   * COMPLETE signer/recipient union and capture durable cleanup/recovery before
   * issuing this exact operation/recipient/post-epoch receipt. Not a caller flag.
   * No authority/material gift mutation is allowed during preparation. */
  prepareRedaction(database: Database.Database, input: Readonly<{
    originalTicket: PlatformPremiumAuthorityTicket;
    operationRef: string;
    preimage: PlatformPremiumGiftRedactionPreimageV2;
    nextAuthorityRevision: number;
    nextEntitlementGeneration: number;
  }>): Readonly<{ kind: "prepared"; receipt: PlatformPremiumRedactedComplimentaryReceiptV2 }>
    | Readonly<{ kind: "unbound" }>;
  /** Privacy-owned NORMAL canonical writer. Only granted_by_user_id -> NULL and
   * source_ref -> the qualified nonidentifying successor may change. Repository
   * independently re-reads the entire selected canonical row and checks epochs.
   * Must stay in this connection/transaction; no core closure or provider I/O. */
  commitCanonicalRedaction(database: Database.Database, input: Readonly<{
    receipt: PlatformPremiumRedactedComplimentaryReceiptV2;
    preimage: PlatformPremiumGiftRedactionPreimageV2;
  }>): Readonly<{ kind: "applied" | "unbound" }>;
  isQualified(database: Database.Database, input: Readonly<{
    authoritySchemaSha256: string;
    protocol: "ordinary_complimentary_signer_redaction_v1";
  }>): boolean;
  readCurrent(database: Database.Database, input: Readonly<{
    scope: PlatformPremiumAuthorityScope;
    authorityRevision: number;
    grantRef: string;
    entitlementId: string;
  }>): Readonly<{ kind: "qualified"; receipt: PlatformPremiumRedactedComplimentaryReceiptV2;
    /** Durable evidence/admission boundary, not a sliding now+duration alias. */
    validUntilUtc: string }>
    | Readonly<{ kind: "unbound" }>;
}

/** Named immutable consumer-port successor for Paid. This interface is
 * exposed by explicit V2 methods below; it cannot be obtained by casting a V1
 * snapshot or substituting V1 isCurrent for isCurrentV2.
 * Ticket STRUCTURE is unchanged. V2 factsSha256 must bind apiVersion, all original
 * V1 facts and the complete qualified redaction receipt/current classification.
 * Actor/canonical redaction and every later provenance mutation/revoke must
 * advance the affected live recipient entitlement generation AND revision.
 * A new V2 ticket is captured only for a NEW intent after actual redaction;
 * existing intents keep/recheck their persisted original full ticket. */
export interface PlatformPremiumAuthorityPortV2 {
  captureV2(authorityKey: string): PlatformPremiumAuthorityReadV2;
  /** Same admitted IMMEDIATE transaction as the durable intent/effect; re-read
   * actual current facts, all scope/identity/entitlement/erasure/policy/Whop epochs,
   * revision, admission, original deadline and V2 fact digest. Reject changed or
   * expired ORIGINAL tickets; never replace one with a current ticket or check
   * revision alone. Both live and redacted gifts retain real expiry/revocation. */
  isCurrentV2(originalTicket: PlatformPremiumAuthorityTicket): boolean;
}

/** Explicit real dependencies for the dormant V2 producer. No implementation of
 * these external ports, registration or runtime wiring is supplied. */
export type PlatformPremiumAuthorityDependenciesV2 = PlatformPremiumAuthorityDependencies & Readonly<{
  redactedComplimentary: PlatformPremiumRedactedComplimentaryPortV2;
}>;

export const platformPremiumComplimentaryRedactionProposalV2 = Object.freeze({
  apiVersion: "platform_premium_authority_v2" as const,
  protocol: "ordinary_complimentary_signer_redaction_v1" as const,
  implementationStatus: "dormant_source_implementation_external_ports_unqualified" as const,
  canRegister: false as const,
  crossRecipientErasure: "HOLD_until_real_admission_quiescence_closure_redaction_and_recovery_qualification" as const,
  canonicalRequirement: "Preserve the original ordinary recipient entitlement and terms; remove the grantor reference before the core incoming-FK closure is captured. Do not blanket-exempt all granted-by rows or erase other recipients' access.",
  provenanceRequirement: "Qualify the actual original grant, authorization, recipient, plan/version and bounded terms using nonidentifying durable provenance. Audit grant_ref, authorization_ref, source_ref, pre-existing baseline fingerprints, receipt graphs, JSON and backup/recovery copies; NULL or an actor UUID/hash alone is insufficient.",
  mutationRequirement: "Admit and prove quiescence for the complete signer/recipient union, including recipients without Premium authorities. Capture and fence every affected existing live authority; exact canonical/provenance mutation counts and post-generations must be qualified. Expired leases are not quiescence.",
  ticketRequirement: "Explicitly adopt the V2 read+original-full-ticket recheck together; include complete provenance/classification in facts and actual revision/generation changes, intersect original gift/entitlement/evidence deadlines and retain revocation. Never convert unknown into unpaid.",
  independentCoverage: "A qualified ordinary gift is independent of native purchase evidence and is never Partner paid proof. Unqualified gifts must not suppress independently qualified access.",
  outsideAssignedFiles: Object.freeze([
    "privacy/core canonical entitlement signer redaction before closure capture",
    "real owner authorization/redacted provenance producer, storage and mutation fencing",
    "all-recipient admission/quiescence/capture, retention/backup/recovery and complete reference audit",
    "explicit Paid V2 consumer adapter and original-ticket lifecycle qualification",
  ]),
});

export type PlatformPremiumRootErasureReferencePlan = Readonly<{
  userId: string;
  /** Exact union of these TWO known source edges, not an exhaustive FK closure. */
  knownReferencesOnly: true;
  canonicalSignerDisposition: "unqualified";
  recipients: readonly Readonly<{
    userId: string | null;
    authorityKey: string | null;
    phase: "live" | "erasing" | "erased" | null;
    currentRevision: number | null;
    explicitGiftActorUpdateCount: number;
    canonicalSignerEntitlementIds: readonly string[];
    /** A lower bound, not a prediction of the complete core closure. */
    knownMinimumRevisionDeltaIfCoreDeletesCanonicalRows: number | null;
  }>[];
  blockingReasons: readonly ("canonical_signer_entitlement_disposition_unqualified" | "gift_signer_reference_unqualified")[];
}>;

export interface PlatformPremiumAuthorityDependencies {
  nowUtc(): string;
  /** Real Coordinator schema qualification, including trigger/closure/recovery
   * review. The descriptor below deliberately does not provide this adapter. */
  schemaIsQualified(database: Database.Database, descriptorSha256: string): boolean;
  erasure: {
    readCurrent(database: Database.Database, input: Readonly<{ authorityKey: string; userId: string }>):
      Readonly<{ kind: "admitted"; generation: number; admissionRef: string; validUntilUtc: string }>
      | Readonly<{ kind: "unbound" | "blocked" }>;
    /** Same admitted immediate transaction, all affected signer/recipient scopes,
     * durable cleanup capture and proven quiescence. Expired leases are NOT proof.
     * Current always-throwing privacy participant cannot implement this port. */
    captureBeforeRootDelete(database: Database.Database, input: Readonly<{
      userId: string; receiptRef: string; authorities: readonly Readonly<{
        authorityKey: string; currentRevision: number; nextRevision: number;
        currentErasureGeneration: number;
      }>[]; referencePlan: PlatformPremiumRootErasureReferencePlan;
      affectedGiftRecipients: readonly Readonly<{ authorityKey: string;
        currentRevision: number; nextRevision: number; materialUpdateCount: number }>[];
    }>): Readonly<{ kind: "captured_and_quiescent"; receiptRef: string; quiescenceRef: string;
      authorities: readonly Readonly<{ authorityKey: string; nextErasureGeneration: number }>[];
      affectedGiftRecipientAuthorityKeys: readonly string[] }>;
  };
  owner: {
    authorizePolicy(database: Database.Database, policy: PlatformPremiumAuthorityPolicyInput): boolean;
    authorizeGift(database: Database.Database, input: Readonly<{
      actorUserId: string; authorizationRef: string; authorityKey: string; entitlementId: string;
    }>): boolean;
  };
  /** Inject the existing canonical identity-HMAC function, never its key. Missing
   * raw native identity/key binding is UNKNOWN; no HMAC reversal or email match. */
  whopSubjectReference?: (rawWhopUserId: string) => string;
}

const TABLES = Object.freeze([
  "platform_premium_authorities", "platform_premium_authority_policies",
  "platform_premium_native_bindings", "platform_premium_paid_observations",
  "platform_premium_complimentary_grants", "platform_premium_identity_fence_events",
] as const);

const advance = (principal: string, column: "identity_generation" | "entitlement_generation"): string =>
  `UPDATE platform_premium_authorities SET ${column}=${column}+1,authority_revision=authority_revision+1
   WHERE phase='live' AND user_id IN (${principal});`;
function existingFactTriggers(table: string, columns: readonly string[], column: "identity_generation" | "entitlement_generation") {
  return [
    `CREATE TRIGGER premium_fence_${table}_insert AFTER INSERT ON ${table}
     BEGIN ${advance("SELECT NEW.user_id", column)} END`,
    `CREATE TRIGGER premium_fence_${table}_update AFTER UPDATE ON ${table}
     WHEN ${columns.map(name => `NEW.${name} IS NOT OLD.${name}`).join(" OR ")}
     BEGIN ${advance("SELECT OLD.user_id UNION SELECT NEW.user_id", column)} END`,
    `CREATE TRIGGER premium_fence_${table}_delete AFTER DELETE ON ${table}
     BEGIN ${advance("SELECT OLD.user_id", column)} END`,
  ];
}
function ownedFactTriggers(table: string, columns: readonly string[], column: "identity_generation" | "entitlement_generation") {
  const change = (keys: string) => `UPDATE platform_premium_authorities SET ${column}=${column}+1,
    authority_revision=authority_revision+1 WHERE phase='live' AND authority_key IN (${keys});`;
  return [
    `CREATE TRIGGER premium_fence_${table}_insert AFTER INSERT ON ${table} BEGIN ${change("SELECT NEW.authority_key")} END`,
    `CREATE TRIGGER premium_fence_${table}_update AFTER UPDATE ON ${table}
     WHEN ${columns.map(name => `NEW.${name} IS NOT OLD.${name}`).join(" OR ")}
     BEGIN ${change("SELECT OLD.authority_key UNION SELECT NEW.authority_key")} END`,
    `CREATE TRIGGER premium_fence_${table}_delete AFTER DELETE ON ${table} BEGIN ${change("SELECT OLD.authority_key")} END`,
  ];
}

/** ID-free PROPOSED schema only. Importing this module never installs/executes it.
 * No bootstrap/backfill or trigger inserts a principal. Every generation trigger
 * updates existing LIVE rows only, including during late writes/root erasure. */
export const platformPremiumAuthoritySchemaStatements: readonly string[] = Object.freeze([
  `CREATE TABLE platform_premium_authority_policies (
    policy_ref TEXT PRIMARY KEY,configuration_ref TEXT NOT NULL,guild_id TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('active','disabled')),generation INTEGER NOT NULL CHECK(generation>0),
    offer_scopes_json TEXT NOT NULL CHECK(json_valid(offer_scopes_json)),
    premium_plan_ids_json TEXT NOT NULL CHECK(json_valid(premium_plan_ids_json)),
    maximum_evidence_age_ms INTEGER NOT NULL CHECK(maximum_evidence_age_ms>0),
    native_qualification_json TEXT CHECK(native_qualification_json IS NULL OR json_valid(native_qualification_json))
  ) STRICT`,
  `CREATE UNIQUE INDEX platform_premium_one_active_policy_guild ON platform_premium_authority_policies(guild_id) WHERE state='active'`,
  `CREATE TABLE platform_premium_authorities (
    authority_key TEXT PRIMARY KEY,user_id TEXT UNIQUE REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    policy_ref TEXT NOT NULL REFERENCES platform_premium_authority_policies(policy_ref) ON DELETE RESTRICT,
    phase TEXT NOT NULL CHECK(phase IN ('live','erasing','erased')),
    identity_generation INTEGER NOT NULL CHECK(identity_generation>0),
    entitlement_generation INTEGER NOT NULL CHECK(entitlement_generation>0),
    whop_generation INTEGER NOT NULL CHECK(whop_generation>0),
    erasure_generation INTEGER NOT NULL CHECK(erasure_generation>0),
    authority_revision INTEGER NOT NULL CHECK(authority_revision>0),baseline_sha256 TEXT,
    erasure_receipt_ref TEXT,erasure_quiescence_ref TEXT,
    CHECK((phase='live' AND user_id IS NOT NULL AND baseline_sha256 IS NOT NULL AND erasure_receipt_ref IS NULL)
      OR (phase IN ('erasing','erased') AND erasure_receipt_ref IS NOT NULL AND erasure_quiescence_ref IS NOT NULL)),
    CHECK(phase<>'erased' OR (user_id IS NULL AND baseline_sha256 IS NULL))
  ) STRICT`,
  `CREATE TABLE platform_premium_native_bindings (
    authority_key TEXT PRIMARY KEY REFERENCES platform_premium_authorities(authority_key) ON DELETE RESTRICT,
    link_id TEXT NOT NULL,whop_user_ref_hmac TEXT NOT NULL,whop_user_id TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE platform_premium_paid_observations (
    observation_ref TEXT PRIMARY KEY,authority_key TEXT NOT NULL REFERENCES platform_premium_authorities(authority_key) ON DELETE RESTRICT,
    offer_scope_ref TEXT NOT NULL,collection_sha256 TEXT NOT NULL,collection_json TEXT NOT NULL CHECK(json_valid(collection_json)),
    qualification_ref TEXT NOT NULL,schema_sha256 TEXT NOT NULL,api_version TEXT NOT NULL,
    identity_generation INTEGER NOT NULL,whop_generation INTEGER NOT NULL,erasure_generation INTEGER NOT NULL,policy_generation INTEGER NOT NULL,
    observed_at_utc TEXT NOT NULL,valid_until_utc TEXT NOT NULL CHECK(observed_at_utc<valid_until_utc)
  ) STRICT`,
  `CREATE INDEX platform_premium_observation_scope ON platform_premium_paid_observations(authority_key,offer_scope_ref,observed_at_utc)`,
  `CREATE TRIGGER platform_premium_observation_immutable BEFORE UPDATE ON platform_premium_paid_observations
   BEGIN SELECT RAISE(ABORT,'premium_observation_immutable'); END`,
  `CREATE TABLE platform_premium_complimentary_grants (
    grant_ref TEXT PRIMARY KEY,authority_key TEXT NOT NULL REFERENCES platform_premium_authorities(authority_key) ON DELETE RESTRICT,
    entitlement_id TEXT NOT NULL,actor_user_id TEXT,authorization_ref TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active','revoked')),starts_at_utc TEXT NOT NULL,ends_at_utc TEXT,
    CHECK(ends_at_utc IS NULL OR starts_at_utc<ends_at_utc)
  ) STRICT`,
  `CREATE TABLE platform_premium_identity_fence_events (
    authority_key TEXT NOT NULL REFERENCES platform_premium_authorities(authority_key) ON DELETE RESTRICT,
    identity_generation INTEGER NOT NULL,discord_user_id TEXT NOT NULL,
    PRIMARY KEY(authority_key,identity_generation,discord_user_id)
  ) STRICT`,
  `CREATE TRIGGER premium_retire_discord_update BEFORE UPDATE ON platform_auth_identities
   WHEN OLD.auth_provider='discord' AND OLD.status='active'
     AND (NEW.user_id IS NOT OLD.user_id OR NEW.auth_provider IS NOT OLD.auth_provider
       OR NEW.auth_subject IS NOT OLD.auth_subject OR NEW.status IS NOT OLD.status)
   BEGIN INSERT OR IGNORE INTO platform_premium_identity_fence_events
     SELECT authority_key,identity_generation,OLD.auth_subject FROM platform_premium_authorities
     WHERE phase='live' AND user_id=OLD.user_id; END`,
  // Current canonical erasure temporarily suspends ALL BEFORE DELETE triggers.
  // Capture and advance in one AFTER body, so both survive that protocol and
  // retirement never depends on ordering between separate AFTER triggers.
  `CREATE TRIGGER premium_fence_platform_auth_identities_delete AFTER DELETE ON platform_auth_identities
   BEGIN INSERT OR IGNORE INTO platform_premium_identity_fence_events
     SELECT authority_key,identity_generation,OLD.auth_subject FROM platform_premium_authorities
     WHERE phase='live' AND user_id=OLD.user_id AND OLD.auth_provider='discord' AND OLD.status='active';
     ${advance("SELECT OLD.user_id", "identity_generation")} END`,
  ...existingFactTriggers("platform_auth_identities", ["user_id", "auth_provider", "auth_subject", "status", "linked_by_user_id"], "identity_generation").slice(0, 2),
  ...existingFactTriggers("platform_whop_user_links", ["link_id", "user_id", "whop_user_ref_hmac", "link_state"], "identity_generation"),
  ...existingFactTriggers("platform_membership_entitlements", ["entitlement_id", "user_id", "plan_version_id", "source_type", "source_ref", "status", "starts_at_utc", "ends_at_utc", "granted_by_user_id"], "entitlement_generation"),
  ...ownedFactTriggers("platform_premium_native_bindings", ["authority_key", "link_id", "whop_user_ref_hmac", "whop_user_id"], "identity_generation"),
  ...ownedFactTriggers("platform_premium_complimentary_grants", ["authority_key", "entitlement_id", "actor_user_id", "authorization_ref", "status", "starts_at_utc", "ends_at_utc"], "entitlement_generation"),
  ...ownedFactTriggers("platform_premium_paid_observations", ["authority_key", "collection_sha256"], "entitlement_generation"),
  `CREATE TRIGGER premium_verified_whop_receipt AFTER INSERT ON platform_membership_provider_event_receipts WHEN NEW.provider='whop'
   BEGIN UPDATE platform_premium_authorities SET whop_generation=whop_generation+1,
     entitlement_generation=entitlement_generation+1,authority_revision=authority_revision+1 WHERE phase='live'; END`,
  `CREATE TRIGGER premium_root_status AFTER UPDATE OF status ON platform_users WHEN NEW.status IS NOT OLD.status
   BEGIN ${advance("SELECT OLD.user_id UNION SELECT NEW.user_id", "identity_generation")} END`,
  `CREATE TRIGGER premium_root_erasure_requires_participant AFTER DELETE ON platform_users
   WHEN EXISTS(SELECT 1 FROM platform_premium_authorities WHERE user_id=OLD.user_id)
     OR EXISTS(SELECT 1 FROM platform_premium_complimentary_grants WHERE actor_user_id=OLD.user_id)
   BEGIN SELECT RAISE(ABORT,'premium_erasure_participant_required'); END`,
  `CREATE TRIGGER premium_authority_retention_requires_qualification AFTER DELETE ON platform_premium_authorities
   BEGIN SELECT RAISE(ABORT,'premium_authority_retention_unqualified'); END`,
  `CREATE TRIGGER premium_policy_change AFTER UPDATE ON platform_premium_authority_policies
   BEGIN UPDATE platform_premium_authorities SET authority_revision=authority_revision+1 WHERE phase='live' AND policy_ref=NEW.policy_ref; END`,
]);

export const platformPremiumAuthoritySchemaDescriptor = Object.freeze({
  canRegister: false as const,
  migrationId: null,
  executionOrder: null,
  statements: platformPremiumAuthoritySchemaStatements,
  sha256: sha(platformPremiumAuthoritySchemaStatements),
  tables: TABLES,
  requiredQualification: Object.freeze(["Coordinator_prefix_and_trigger_schema_review", "real_erasure_admission_and_quiescence",
    "actor_signer_closure_and_recovery", "explicit_retention_and_backup_policy"]),
  paidCoverageQualification: Object.freeze(["native_decoder_current_realm_paid_period_refund_dispute_and_trial_classification",
    "correctly_versioned_verified_event_intake_and_freshness_policy"]),
  rootReferences: Object.freeze([
    "authorities.user_id: nullable root FK RESTRICT; detach only after admitted/quiescent capture in the same immediate transaction",
    "complimentary_grants.actor_user_id: explicit logical signer reference; enumerate/scrub affected recipient scopes before root deletion",
    "canonical membership_entitlements.granted_by_user_id: nullable root FK NO ACTION in the current source; core closure can select other recipients' rows. Disposition remains unqualified and blocks capture even without a new gift/authority row",
    "native_bindings.link_id/HMAC/native ID and paid collection payer/native references: private logical refs; delete before detaching principal",
  ]),
  jsonReferences: Object.freeze({
    offer_scopes_json: "scopeRef/environment/accountId/productId/planId only; no Platform user reference",
    premium_plan_ids_json: "approved plan IDs only",
    native_qualification_json: "reviewRef/schemaSha256/apiVersion only; signer receipt graph owned by the real qualification producer",
    collection_json: "purchase.payer.linkId/whopUserRefHmac/whopUserId and native membership/payment refs; remove with the erased principal",
  }),
  triggerLifetime: "Current canonical core drops all BEFORE DELETE guards. Root barrier, authority-retention barrier and combined auth-delete retirement/fence are AFTER DELETE and are not selected by that suspension. BEFORE UPDATE retirement remains installed. Source protocol argument only; exact core/SQLite/closure qualification is still required. No principal creation or blanket table exemption.",
  protectedAfterDeleteTriggers: Object.freeze(["premium_root_erasure_requires_participant",
    "premium_authority_retention_requires_qualification", "premium_fence_platform_auth_identities_delete"]),
  retainedAfterRootErasure: "Intended retained set: detached authority key/counters/policyRef/qualified opaque erasure+quiescence refs only; Paid owns captured cleanup claims/outcomes. Actual reference/signer graph and retention remain unqualified; no erasure acceptance claimed.",
  retention: "Unqualified; no duration, automatic prune or blanket closure exemption supplied.",
});

/** ID-free V2 schema proposal; never installs or registers itself. Legacy
 * statements and descriptor stay exact. Separate real qualification must cover
 * this whole set AND external provenance mutations/closure/recipient cleanup. */
export const platformPremiumAuthoritySchemaStatementsV2: readonly string[] = Object.freeze([
  ...platformPremiumAuthoritySchemaStatements,
  `CREATE TABLE platform_premium_complimentary_redactions_v2 (
    provenance_ref TEXT PRIMARY KEY,
    grant_ref TEXT NOT NULL UNIQUE REFERENCES platform_premium_complimentary_grants(grant_ref) ON DELETE RESTRICT,
    authority_key TEXT NOT NULL REFERENCES platform_premium_authorities(authority_key) ON DELETE RESTRICT,
    receipt_json TEXT NOT NULL CHECK(json_valid(receipt_json)),receipt_sha256 TEXT NOT NULL
  ) STRICT`,
  `CREATE TRIGGER premium_redaction_v2_immutable BEFORE UPDATE ON platform_premium_complimentary_redactions_v2
   BEGIN SELECT RAISE(ABORT,'premium_redaction_v2_immutable'); END`,
  // Recipient erasure/retention still needs real privacy qualification; a core
  // suspension of BEFORE DELETE guards cannot silently remove this provenance.
  `CREATE TRIGGER premium_redaction_v2_retention_hold AFTER DELETE ON platform_premium_complimentary_redactions_v2
   BEGIN SELECT RAISE(ABORT,'premium_redaction_v2_retention_unqualified'); END`,
  ...ownedFactTriggers("platform_premium_complimentary_redactions_v2",
    ["authority_key", "grant_ref", "receipt_json", "receipt_sha256"], "entitlement_generation"),
]);
export const platformPremiumAuthoritySchemaDescriptorV2 = Object.freeze({
  canRegister: false as const, migrationId: null, executionOrder: null,
  sha256: sha(platformPremiumAuthoritySchemaStatementsV2),
  statements: platformPremiumAuthoritySchemaStatementsV2,
  requiredQualification: Object.freeze([
    ...platformPremiumAuthoritySchemaDescriptor.requiredQualification,
    "actual_original_authorization_nonidentifying_receipt_issuer_and_canonical_signer_writer",
    "all_recipient_admission_quiescence_capture_exact_material_fences_before_core_closure",
    "external_provenance_mutation_generation_fences_and_original_full_ticket_recheck",
    "redacted_recipient_erasure_retention_backup_recovery_protocol",
  ]),
  recipientErasure: "HOLD: unconditional AFTER DELETE retention barrier; original V1 erasure is not a V2 cleanup adapter",
  transitionMaterialUpdates: "Exactly canonical signer/source update + gift actor/authorization update + immutable provenance insert = three recipient generation/revision advances; no implicit epochs",
});

type AuthorityRow = { authority_key: string; user_id: string | null; policy_ref: string;
  phase: "live" | "erasing" | "erased"; identity_generation: number; entitlement_generation: number;
  whop_generation: number; erasure_generation: number; authority_revision: number;
  baseline_sha256: string | null; erasure_receipt_ref: string | null; erasure_quiescence_ref: string | null };
type PolicyRow = { policy_ref: string; configuration_ref: string; guild_id: string; state: "active" | "disabled";
  generation: number; offer_scopes_json: string; premium_plan_ids_json: string; maximum_evidence_age_ms: number;
  native_qualification_json: string | null };
type LinkRow = { link_id: string; whop_user_ref_hmac: string; link_state: string };
type BindingRow = { authority_key: string; link_id: string; whop_user_ref_hmac: string; whop_user_id: string };
type ObservationRow = { observation_ref: string; authority_key: string; offer_scope_ref: string;
  collection_sha256: string; collection_json: string; qualification_ref: string; schema_sha256: string; api_version: string;
  identity_generation: number; whop_generation: number; erasure_generation: number; policy_generation: number;
  observed_at_utc: string; valid_until_utc: string };
type GiftRow = { grant_ref: string; authority_key: string; entitlement_id: string; actor_user_id: string | null;
  authorization_ref: string; status: string; starts_at_utc: string; ends_at_utc: string | null };

type RedactedGiftRowV2 = { provenance_ref: string; grant_ref: string; authority_key: string;
  receipt_json: string; receipt_sha256: string };
type CanonicalGiftRowV2 = { entitlement_id: string; user_id: string; plan_version_id: string;
  source_type: string; source_ref: string; granted_by_user_id: string | null;
  status: string; starts_at_utc: string; ends_at_utc: string | null };

/** Whitelist every persisted field; no spread/JSON retention of issuer payloads
 * or actor IDs/hashes. Opaque reference graphs still need REAL qualification. */
function redactedGiftReceiptCopyV2(value: PlatformPremiumRedactedComplimentaryReceiptV2): PlatformPremiumRedactedComplimentaryReceiptV2 {
  const terms = value.originalTerms, scope = value.scope;
  if (value.protocol !== "ordinary_complimentary_signer_redaction_v1"
    || value.sourceKind !== "ordinary_owner_complimentary" || value.disposition !== "retain_access_remove_grantor_identity"
    || ref(value.canonicalSourceRef).startsWith("external:")) invalid();
  const giftStart = utc(terms.giftStartsAtUtc), giftEnd = terms.giftEndsAtUtc === null ? null : utc(terms.giftEndsAtUtc);
  const canonicalStart = utc(terms.entitlementStartsAtUtc), canonicalEnd = terms.entitlementEndsAtUtc === null ? null : utc(terms.entitlementEndsAtUtc);
  if ((giftEnd !== null && giftEnd <= giftStart) || (canonicalEnd !== null && canonicalEnd <= canonicalStart)) invalid();
  return Object.freeze({ protocol: value.protocol, provenanceRef: ref(value.provenanceRef),
    authorizationReceiptRef: ref(value.authorizationReceiptRef), qualificationRef: ref(value.qualificationRef),
    originalGrantRef: ref(value.originalGrantRef), canonicalSourceRef: value.canonicalSourceRef,
    privacyCaptureRef: ref(value.privacyCaptureRef), quiescenceRef: ref(value.quiescenceRef), redactionOperationRef: ref(value.redactionOperationRef),
    scope: Object.freeze({ authorityKey: uuid(scope.authorityKey), recipientUserId: uuid(scope.recipientUserId),
      entitlementId: uuid(scope.entitlementId), planVersionId: uuid(scope.planVersionId), planId: uuid(scope.planId) }),
    originalTerms: Object.freeze({ giftStartsAtUtc: giftStart, giftEndsAtUtc: giftEnd,
      entitlementStartsAtUtc: canonicalStart, entitlementEndsAtUtc: canonicalEnd }),
    sourceKind: value.sourceKind, disposition: value.disposition, redactedAtUtc: utc(value.redactedAtUtc),
    recipientRevisionAfterRedaction: integer(value.recipientRevisionAfterRedaction),
    recipientEntitlementGenerationAfterRedaction: integer(value.recipientEntitlementGenerationAfterRedaction) });
}

function policyCopy(input: PlatformPremiumAuthorityPolicyInput): PlatformPremiumAuthorityPolicyInput {
  ref(input.policyRef); ref(input.configurationRef); snowflake(input.guildId); integer(input.maximumEvidenceAgeMs);
  if (!["active", "disabled"].includes(input.state) || !Array.isArray(input.offerScopes) || input.offerScopes.length > 250
    || !Array.isArray(input.premiumPlanIds) || input.premiumPlanIds.length > 250) invalid();
  const seen = new Set<string>();
  const scopes = input.offerScopes.map(offer => {
    if (!["sandbox", "live"].includes(offer.environment) || seen.has(ref(offer.scopeRef))) invalid();
    seen.add(offer.scopeRef);
    return Object.freeze({ scopeRef: offer.scopeRef, environment: offer.environment,
      accountId: ref(offer.accountId), productId: ref(offer.productId), planId: ref(offer.planId) });
  }).sort((a, b) => a.scopeRef.localeCompare(b.scopeRef, "en"));
  const plans = [...new Set(input.premiumPlanIds.map(uuid))].sort();
  const q = input.nativeQualification;
  if (q && !/^[a-f0-9]{64}$/u.test(q.schemaSha256)) invalid();
  return Object.freeze({ policyRef: input.policyRef, configurationRef: input.configurationRef,
    guildId: input.guildId, state: input.state, offerScopes: Object.freeze(scopes), premiumPlanIds: Object.freeze(plans),
    maximumEvidenceAgeMs: input.maximumEvidenceAgeMs, nativeQualification: q ? Object.freeze({
      reviewRef: ref(q.reviewRef), schemaSha256: q.schemaSha256, apiVersion: ref(q.apiVersion),
    }) : null });
}

function ticketCopy(input: PlatformPremiumAuthorityTicket): PlatformPremiumAuthorityTicket {
  const scope = input.scope;
  if (!/^[a-f0-9]{64}$/u.test(input.factsSha256) || utc(input.observedAtUtc) >= utc(input.validUntilUtc)) invalid();
  return Object.freeze({ scope: Object.freeze({ authorityKey: uuid(scope.authorityKey), userId: uuid(scope.userId),
    discordUserId: scope.discordUserId === null ? null : snowflake(scope.discordUserId), guildId: snowflake(scope.guildId),
    identityGeneration: integer(scope.identityGeneration), entitlementGeneration: integer(scope.entitlementGeneration),
    erasureGeneration: integer(scope.erasureGeneration), policyGeneration: integer(scope.policyGeneration) }),
  authorityRevision: integer(input.authorityRevision), whopGeneration: integer(input.whopGeneration),
  admissionRef: ref(input.admissionRef), factsSha256: input.factsSha256,
  observedAtUtc: input.observedAtUtc, validUntilUtc: input.validUntilUtc });
}

/** Dormant concrete producer. No dependency implementation, database opening,
 * registration, timer or provider I/O is supplied. All calls use the caller's
 * single connection/transaction; mutations require its admitted IMMEDIATE writer. */
export class PlatformPremiumAuthorityRepository implements PlatformPremiumAuthorityPortV2 {
  constructor(private readonly db: Database.Database,
    private readonly dependencies: PlatformPremiumAuthorityDependencies | PlatformPremiumAuthorityDependenciesV2 | null = null) {}

  private transaction(): void {
    if (!this.db.inTransaction) throw new PlatformPremiumAuthorityError("transaction_required");
  }
  private atomic<T>(operation: () => T): T {
    this.transaction();
    // A savepoint also rolls back this participant if an outer caller catches
    // its exception. The caller still owns the required IMMEDIATE transaction.
    return this.db.transaction(operation)();
  }
  private qualified(): boolean {
    this.transaction();
    if (!this.dependencies) return false;
    return this.dependencies.schemaIsQualified(this.db, platformPremiumAuthoritySchemaDescriptor.sha256)
      && TABLES.every(name => Boolean(this.db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name)));
  }
  private write(): PlatformPremiumAuthorityDependencies {
    if (!this.qualified() || !this.dependencies) throw new PlatformPremiumAuthorityError("unbound");
    return this.dependencies;
  }
  private row(authorityKey: string): AuthorityRow | undefined {
    return this.db.prepare<[string], AuthorityRow>("SELECT * FROM platform_premium_authorities WHERE authority_key=?").get(uuid(authorityKey));
  }
  private policy(policyRef: string): PlatformPremiumAuthorityPolicy | null {
    const row = this.db.prepare<[string], PolicyRow>("SELECT * FROM platform_premium_authority_policies WHERE policy_ref=?").get(ref(policyRef));
    if (!row) return null;
    return Object.freeze({ ...policyCopy({ policyRef: row.policy_ref, configurationRef: row.configuration_ref,
      guildId: row.guild_id, state: row.state, offerScopes: JSON.parse(row.offer_scopes_json),
      premiumPlanIds: JSON.parse(row.premium_plan_ids_json), maximumEvidenceAgeMs: row.maximum_evidence_age_ms,
      nativeQualification: row.native_qualification_json === null ? null : JSON.parse(row.native_qualification_json) }),
    generation: integer(row.generation) });
  }

  /** Explicit authorized policy event; generation1 is its real initial epoch,
   * never a default generation returned by a read of missing configuration. */
  savePolicy(input: PlatformPremiumAuthorityPolicyInput, expectedGeneration: number | null): void {
    this.atomic(() => {
    const deps = this.write(), policy = policyCopy(input);
    if (!deps.owner.authorizePolicy(this.db, policy)) throw new PlatformPremiumAuthorityError("unbound");
    const current = this.policy(policy.policyRef);
    if ((current?.generation ?? null) !== expectedGeneration) throw new PlatformPremiumAuthorityError("conflict");
    if (current && (current.guildId !== policy.guildId
      || current.offerScopes.some(old => !policy.offerScopes.some(next => sha(next) === sha(old)))
      || current.premiumPlanIds.some(id => !policy.premiumPlanIds.includes(id)))) {
      // Hiding/retiring an offer must not silently remove a legacy paid scope.
      // Scope removal or a guild move needs a separately reviewed migration.
      throw new PlatformPremiumAuthorityError("conflict");
    }
    const generation = current ? integer(current.generation + 1) : 1;
    this.db.prepare(`INSERT INTO platform_premium_authority_policies VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(policy_ref) DO UPDATE SET configuration_ref=excluded.configuration_ref,guild_id=excluded.guild_id,
      state=excluded.state,generation=excluded.generation,offer_scopes_json=excluded.offer_scopes_json,
      premium_plan_ids_json=excluded.premium_plan_ids_json,maximum_evidence_age_ms=excluded.maximum_evidence_age_ms,
      native_qualification_json=excluded.native_qualification_json`)
      .run(policy.policyRef, policy.configurationRef, policy.guildId, policy.state, generation, JSON.stringify(policy.offerScopes),
        JSON.stringify(policy.premiumPlanIds), policy.maximumEvidenceAgeMs, policy.nativeQualification ? JSON.stringify(policy.nativeQualification) : null);
    });
  }

  /** Sole principal-creation entry point. No trigger/read resurrects an erased
   * principal. The initial epoch records an admitted real fact snapshot, not paid
   * access, a historical counter guess, or automatic historical gift adoption. */
  initialize(userId: string, policyRef: string): string {
    return this.atomic(() => {
    const deps = this.write(); uuid(userId);
    if (!this.db.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId)) invalid();
    const policy = this.policy(policyRef); if (!policy || policy.state !== "active") throw new PlatformPremiumAuthorityError("unbound");
    if (this.db.prepare("SELECT 1 FROM platform_premium_authorities WHERE user_id=?").get(userId)) throw new PlatformPremiumAuthorityError("conflict");
    const key = randomUUID(), admission = deps.erasure.readCurrent(this.db, { authorityKey: key, userId });
    if (admission.kind !== "admitted" || utc(admission.validUntilUtc) <= utc(deps.nowUtc())) throw new PlatformPremiumAuthorityError("unbound");
    const identities = this.db.prepare("SELECT auth_provider,auth_subject,status,linked_by_user_id FROM platform_auth_identities WHERE user_id=? ORDER BY auth_provider,auth_subject").all(userId);
    const entitlements = this.db.prepare("SELECT entitlement_id,plan_version_id,source_type,source_ref,status,starts_at_utc,ends_at_utc FROM platform_membership_entitlements WHERE user_id=? ORDER BY entitlement_id").all(userId);
    this.db.prepare(`INSERT INTO platform_premium_authorities
      (authority_key,user_id,policy_ref,phase,identity_generation,entitlement_generation,whop_generation,erasure_generation,authority_revision,baseline_sha256)
      VALUES (?,?,?,'live',1,1,1,?,1,?)`).run(key, userId, policy.policyRef, integer(admission.generation), sha({ identities, entitlements }));
    return key;
    });
  }

  capture(authorityKey: string): PlatformPremiumAuthorityRead {
    if (!this.qualified() || !this.dependencies) return Object.freeze({ kind: "unbound", reason: "schema_or_dependencies_unqualified" });
    const deps = this.dependencies, row = this.row(authorityKey), now = utc(deps.nowUtc());
    if (!row?.user_id || row.phase !== "live"
      || !this.db.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(row.user_id)) {
      return Object.freeze({ kind: "unbound", reason: "principal_missing_or_erasing" });
    }
    const policy = this.policy(row.policy_ref);
    if (!policy || policy.state !== "active") return Object.freeze({ kind: "unbound", reason: "policy_unqualified" });
    const admission = deps.erasure.readCurrent(this.db, { authorityKey, userId: row.user_id });
    if (admission.kind !== "admitted" || integer(admission.generation) !== row.erasure_generation
      || utc(admission.validUntilUtc) <= now) return Object.freeze({ kind: "unbound", reason: "erasure_admission_unqualified" });
    type Identity = { auth_provider: string; auth_subject: string; status: string; linked_by_user_id: string };
    const identities = this.db.prepare<[string], Identity>(`SELECT auth_provider,auth_subject,status,linked_by_user_id
      FROM platform_auth_identities WHERE user_id=? ORDER BY auth_provider,auth_subject`).all(row.user_id);
    const discord = identities.filter(identity => identity.auth_provider === "discord" && identity.status === "active");
    if (discord.length > 1) return Object.freeze({ kind: "unbound", reason: "identity_conflict" });
    let discordUserId: string | null = null;
    try { if (discord[0]) discordUserId = snowflake(discord[0].auth_subject); }
    catch { return Object.freeze({ kind: "unbound", reason: "native_discord_subject_unqualified" }); }
    const links = this.db.prepare<[string], LinkRow>(`SELECT link_id,whop_user_ref_hmac,link_state
      FROM platform_whop_user_links WHERE user_id=? ORDER BY link_id`).all(row.user_id);
    const activeLinks = links.filter(link => link.link_state === "active");
    const conflict = links.some(link => link.link_state === "conflict") || activeLinks.length > 1;
    const canonicalLink = conflict ? undefined : activeLinks[0];
    const binding = this.db.prepare<[string], BindingRow>("SELECT * FROM platform_premium_native_bindings WHERE authority_key=?").get(authorityKey);
    let nativeIdentityMatches = !deps.whopSubjectReference;
    if (binding && deps.whopSubjectReference) {
      try { nativeIdentityMatches = deps.whopSubjectReference(binding.whop_user_id) === binding.whop_user_ref_hmac; }
      catch { nativeIdentityMatches = false; }
    }
    const bound = nativeIdentityMatches && binding && canonicalLink && /^[a-f0-9]{64}$/u.test(binding.whop_user_ref_hmac) && binding.link_id === canonicalLink.link_id
      && binding.whop_user_ref_hmac === canonicalLink.whop_user_ref_hmac;
    const payer: PlatformPremiumNativePayer = bound && binding ? Object.freeze({ kind: "bound", linkId: uuid(binding.link_id),
      whopUserRefHmac: binding.whop_user_ref_hmac, whopUserId: ref(binding.whop_user_id) })
      : Object.freeze({ kind: "unbound", reason: conflict ? "conflict" : canonicalLink ? "historical_hmac_only" : "not_linked" });
    // Only the latest observation in the CURRENT native identity/event/policy
    // epoch can participate. Older paid receipts never replace a newer unknown.
    const observations = this.db.prepare<[string, number, number, number, number], ObservationRow>(`SELECT * FROM (
      SELECT o.*,ROW_NUMBER() OVER (PARTITION BY offer_scope_ref ORDER BY observed_at_utc DESC,observation_ref DESC) AS position
      FROM platform_premium_paid_observations o WHERE authority_key=? AND identity_generation=?
        AND whop_generation=? AND erasure_generation=? AND policy_generation=?
      ) WHERE position=1 ORDER BY offer_scope_ref`).all(authorityKey, row.identity_generation,
      row.whop_generation, row.erasure_generation, policy.generation);
    const gifts = this.db.prepare<[string], GiftRow>("SELECT * FROM platform_premium_complimentary_grants WHERE authority_key=? ORDER BY grant_ref").all(authorityKey);
    const deadlines = [utc(admission.validUntilUtc), new Date(Date.parse(now) + policy.maximumEvidenceAgeMs).toISOString()];
    const boundary = (value: string | null) => { if (value !== null && utc(value) > now) deadlines.push(value); };
    const coverage: PlatformPremiumAuthoritySnapshot["coverage"] = Object.freeze(policy.offerScopes.map(offer => {
      let currentAccessObserved = false;
      const unknown = (reason: string) => Object.freeze({ kind: "unknown" as const, offer, reason,
        ...(currentAccessObserved ? { basis: "current_provider_access" as const } : {}) });
      const observation = observations.find(item => item.offer_scope_ref === offer.scopeRef);
      // A historical mode tag can only force a hold. It never adopts an old
      // observation across epochs or qualifies JSON for paid access.
      const modeObservation = observation ?? this.db.prepare<[string, string], { collection_json: string }>(
        "SELECT collection_json FROM platform_premium_paid_observations WHERE authority_key=? AND offer_scope_ref=? ORDER BY observed_at_utc DESC,observation_ref DESC LIMIT 1")
        .get(authorityKey, offer.scopeRef);
      try { currentAccessObserved = JSON.parse(modeObservation?.collection_json ?? "null")?.protocol === "platform_premium_current_paid_access_v1"; } catch { /* Remain unqualified. */ }
      if (payer.kind !== "bound") return unknown(payer.reason);
      const qualification = policy.nativeQualification;
      if (!observation || !qualification) return unknown("native_coverage_unqualified");
      boundary(observation.valid_until_utc);
      if (observation.observed_at_utc > now || observation.valid_until_utc <= now
        || Date.parse(observation.valid_until_utc) - Date.parse(observation.observed_at_utc) > policy.maximumEvidenceAgeMs
        || observation.qualification_ref !== qualification.reviewRef || observation.schema_sha256 !== qualification.schemaSha256
        || observation.api_version !== qualification.apiVersion) return unknown("native_coverage_stale_or_unqualified");
      let collection: StoredPremiumNativeCollection | null = null;
      try { const value: unknown = JSON.parse(observation.collection_json); collection = readStoredPlatformPremiumWhopCurrentAccess(value) ?? readStoredPlatformPremiumWhopCollection(value); } catch { /* Unknown, never unpaid. */ }
      if (!collection || sha(collection) !== observation.collection_sha256 || sha(collection.purchase.offer) !== sha(offer)
        || collection.purchase.payer.linkId !== payer.linkId || collection.purchase.payer.whopUserId !== payer.whopUserId
        || collection.purchase.payer.whopUserRefHmac !== payer.whopUserRefHmac
        || collection.observedAtUtc !== observation.observed_at_utc || collection.validUntilUtc !== observation.valid_until_utc) {
        return unknown("native_coverage_scope_or_integrity");
      }
      for (const member of ("protocol" in collection ? [] : collection.members)) for (const term of member.terms) {
        if (term.coverage) { boundary(term.coverage.startsAtUtc); boundary(term.coverage.endsAtUtc); }
      }
      return Object.freeze({ kind: "native_coverage" as const, offer, collection, observationRef: observation.observation_ref });
    }));
    let complimentary: PlatformPremiumAuthoritySnapshot["complimentary"] = Object.freeze({ kind: "none" });
    const giftFacts: unknown[] = [];
    for (const gift of gifts) {
      const entitlement = this.db.prepare<[string, string], { user_id: string; plan_version_id: string; plan_id: string;
        source_type: string; source_ref: string; granted_by_user_id: string; status: string; starts_at_utc: string; ends_at_utc: string | null }>(`SELECT e.user_id,e.plan_version_id,
        v.plan_id,e.source_type,e.source_ref,e.granted_by_user_id,e.status,e.starts_at_utc,e.ends_at_utc FROM platform_membership_entitlements e
        JOIN platform_membership_plan_versions v USING(plan_version_id) WHERE e.entitlement_id=? AND e.user_id=?`)
        .get(gift.entitlement_id, row.user_id);
      const actorActive = gift.actor_user_id !== null
        && Boolean(this.db.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(gift.actor_user_id));
      giftFacts.push({ gift, entitlement: entitlement ?? null, actorActive });
      boundary(gift.starts_at_utc); boundary(gift.ends_at_utc);
      if (entitlement) { boundary(entitlement.starts_at_utc); boundary(entitlement.ends_at_utc); }
      if (gift.status !== "active") continue;
      if (!entitlement || !actorActive || !policy.premiumPlanIds.includes(entitlement.plan_id)
        || entitlement.source_type !== "owner_grant" || entitlement.source_ref.startsWith("external:")
        || entitlement.granted_by_user_id !== gift.actor_user_id) {
        if (complimentary.kind !== "active") complimentary = Object.freeze({ kind: "unknown" });
        continue;
      }
      if (entitlement.status === "active" && gift.starts_at_utc <= now && (gift.ends_at_utc === null || gift.ends_at_utc > now)
        && entitlement.starts_at_utc <= now && (entitlement.ends_at_utc === null || entitlement.ends_at_utc > now)) {
        // Independent of Whop binding/payment status. Historical owner_grant rows
        // lacking this explicit provenance are not automatically adopted.
        complimentary = Object.freeze({ kind: "active", grantRef: gift.grant_ref,
          actorUserId: gift.actor_user_id!, authorizationRef: gift.authorization_ref,
          startsAtUtc: [gift.starts_at_utc, entitlement.starts_at_utc].sort().at(-1)!,
          endsAtUtc: [gift.ends_at_utc, entitlement.ends_at_utc].filter((value): value is string => value !== null).sort()[0] ?? null });
      }
    }
    const retiredSubjectFacts = Object.freeze(this.db.prepare<[string], { discord_user_id: string; identity_generation: number }>(
      "SELECT discord_user_id,identity_generation FROM platform_premium_identity_fence_events WHERE authority_key=? ORDER BY identity_generation,discord_user_id")
      .all(authorityKey).map(item => Object.freeze({ discordUserId: snowflake(item.discord_user_id), identityGeneration: integer(item.identity_generation) })));
    const scope: PlatformPremiumAuthorityScope = Object.freeze({ authorityKey: uuid(authorityKey), userId: uuid(row.user_id),
      discordUserId, guildId: policy.guildId, identityGeneration: integer(row.identity_generation),
      entitlementGeneration: integer(row.entitlement_generation), erasureGeneration: integer(row.erasure_generation),
      policyGeneration: policy.generation });
    const periodPhase = (start: string, end: string) => now < start ? "future" : now >= end ? "ended" : "current";
    const timedCoverage = coverage.map(item => item.kind === "unknown" ? item : {
      offer: item.offer, kind: item.kind, observationRef: item.observationRef,
      members: "protocol" in item.collection ? item.collection.members : item.collection.members.map(member => ({ membershipRef: member.membershipRef, accessKind: member.accessKind, state: member.state,
        terms: member.terms.map(term => ({ paymentRef: term.paymentRef, coverageKind: term.coverageKind,
          phase: term.coverage ? periodPhase(term.coverage.startsAtUtc, term.coverage.endsAtUtc) : "unqualified" })) })),
    });
    // This is a decision-time fact fingerprint, NOT a generation derived from
    // a timestamp. It also rejects a tampered/extended persisted ticket after
    // real paid/gift boundaries pass without any SQLite write.
    const factsSha256 = sha({ scope, revision: row.authority_revision, whopGeneration: row.whop_generation,
      policy, identities, links, binding: binding ?? null, observations, gifts: giftFacts,
      complimentary, timedCoverage, retiredSubjectFacts });
    return Object.freeze({ kind: "snapshot", policy, payer, coverage, complimentary, retiredSubjectFacts,
      ticket: Object.freeze({ scope, authorityRevision: integer(row.authority_revision), whopGeneration: integer(row.whop_generation),
        admissionRef: ref(admission.admissionRef), factsSha256, observedAtUtc: now,
        validUntilUtc: deadlines.sort()[0]! }) });
  }

  private dependenciesV2(): PlatformPremiumAuthorityDependenciesV2 | null {
    if (!this.qualified() || !this.dependencies || !("redactedComplimentary" in this.dependencies)) return null;
    const deps = this.dependencies;
    if (!deps.redactedComplimentary
      || !deps.schemaIsQualified(this.db, platformPremiumAuthoritySchemaDescriptorV2.sha256)
      || !this.db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_premium_complimentary_redactions_v2'").get()
      || !deps.redactedComplimentary.isQualified(this.db, {
        authoritySchemaSha256: platformPremiumAuthoritySchemaDescriptorV2.sha256,
        protocol: "ordinary_complimentary_signer_redaction_v1" })) return null;
    return deps;
  }

  private canonicalGiftV2(entitlementId: string): CanonicalGiftRowV2 | undefined {
    return this.db.prepare<[string], CanonicalGiftRowV2>(
      "SELECT * FROM platform_membership_entitlements WHERE entitlement_id=?").get(uuid(entitlementId));
  }

  /** Actual V2 read. All original fact collection/admission remains in V1 capture;
   * V2 independently binds persisted redaction + current real issuer evidence.
   * No adapter/schema dependency => UNBOUND, never fabricated gifted/paid access. */
  captureV2(authorityKey: string): PlatformPremiumAuthorityReadV2 {
    const deps = this.dependenciesV2();
    if (!deps) return Object.freeze({ kind: "unbound", reason: "v2_schema_or_privacy_dependencies_unqualified" });
    const base = this.capture(authorityKey);
    if (base.kind !== "snapshot") return base;
    const now = utc(deps.nowUtc()), deadlines = [base.ticket.validUntilUtc];
    const records = this.db.prepare<[string], RedactedGiftRowV2>(
      "SELECT * FROM platform_premium_complimentary_redactions_v2 WHERE authority_key=? ORDER BY grant_ref").all(authorityKey);
    const gifts = this.db.prepare<[string], GiftRow>(
      "SELECT * FROM platform_premium_complimentary_grants WHERE authority_key=? ORDER BY grant_ref").all(authorityKey);
    if (records.some(r => !gifts.some(g => g.grant_ref === r.grant_ref))) {
      return Object.freeze({ kind: "unbound", reason: "v2_provenance_scope_conflict" });
    }
    let complimentary: PlatformPremiumComplimentaryV2 = Object.freeze({ kind: "none" });
    const evidence: unknown[] = [];
    const unknown = () => { if (complimentary.kind !== "active") complimentary = Object.freeze({ kind: "unknown" }); };
    for (const gift of gifts) {
      const record = records.find(item => item.grant_ref === gift.grant_ref);
      if (gift.status !== "active") continue;
      const entitlement = this.canonicalGiftV2(gift.entitlement_id);
      const version = entitlement ? this.db.prepare<[string], { plan_id: string }>(
        "SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?").get(entitlement.plan_version_id) : undefined;
      if (!entitlement || entitlement.user_id !== base.ticket.scope.userId || !version
        || !base.policy.premiumPlanIds.includes(version.plan_id) || entitlement.source_type !== "owner_grant"
        || entitlement.source_ref.startsWith("external:")) { unknown(); continue; }
      let provenance: Extract<PlatformPremiumComplimentaryV2, { kind: "active" }>["provenance"];
      if (record) {
        try {
          const receipt = redactedGiftReceiptCopyV2(JSON.parse(record.receipt_json));
          if (JSON.stringify(receipt) !== record.receipt_json || sha(receipt) !== record.receipt_sha256 || receipt.provenanceRef !== record.provenance_ref
            || receipt.originalGrantRef !== gift.grant_ref || receipt.scope.authorityKey !== authorityKey
            || receipt.scope.recipientUserId !== entitlement.user_id || receipt.scope.entitlementId !== gift.entitlement_id
            || receipt.scope.planVersionId !== entitlement.plan_version_id || receipt.scope.planId !== version.plan_id
            || gift.actor_user_id !== null || entitlement.granted_by_user_id !== null
            || gift.authorization_ref !== receipt.authorizationReceiptRef || entitlement.source_ref !== receipt.canonicalSourceRef
            || receipt.originalTerms.giftStartsAtUtc !== gift.starts_at_utc || receipt.originalTerms.giftEndsAtUtc !== gift.ends_at_utc
            || receipt.originalTerms.entitlementStartsAtUtc !== entitlement.starts_at_utc
            || receipt.originalTerms.entitlementEndsAtUtc !== entitlement.ends_at_utc || receipt.redactedAtUtc > now
            || receipt.recipientRevisionAfterRedaction > base.ticket.authorityRevision
            || receipt.recipientEntitlementGenerationAfterRedaction > base.ticket.scope.entitlementGeneration) invalid();
          const current = deps.redactedComplimentary.readCurrent(this.db, { scope: base.ticket.scope,
            authorityRevision: base.ticket.authorityRevision, grantRef: gift.grant_ref, entitlementId: gift.entitlement_id });
          if (current.kind !== "qualified") { evidence.push({ grantRef: gift.grant_ref, kind: "unbound" }); unknown(); continue; }
          const currentReceipt = redactedGiftReceiptCopyV2(current.receipt), until = utc(current.validUntilUtc);
          if (sha(currentReceipt) !== record.receipt_sha256 || until <= now) invalid();
          evidence.push({ grantRef: gift.grant_ref, receipt: currentReceipt, validUntilUtc: until });
          deadlines.push(until);
          provenance = Object.freeze({ kind: "qualified_redacted_signer", receipt });
        } catch { evidence.push({ grantRef: gift.grant_ref, kind: "unqualified" }); unknown(); continue; }
      } else {
        // V1 live-signer qualification is preserved, not generalized to NULL.
        if (gift.actor_user_id === null || entitlement.granted_by_user_id !== gift.actor_user_id
          || !this.db.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(gift.actor_user_id)) {
          unknown(); continue;
        }
        provenance = Object.freeze({ kind: "live_signer", actorUserId: uuid(gift.actor_user_id), authorizationRef: ref(gift.authorization_ref) });
      }
      if (entitlement.status === "active" && gift.starts_at_utc <= now && (gift.ends_at_utc === null || now < gift.ends_at_utc)
        && entitlement.starts_at_utc <= now && (entitlement.ends_at_utc === null || now < entitlement.ends_at_utc)) {
        complimentary = Object.freeze({ kind: "active", grantRef: gift.grant_ref, entitlementId: gift.entitlement_id,
          startsAtUtc: [gift.starts_at_utc, entitlement.starts_at_utc].sort().at(-1)!,
          endsAtUtc: [gift.ends_at_utc, entitlement.ends_at_utc].filter((v): v is string => v !== null).sort()[0] ?? null, provenance });
      }
    }
    const factsSha256 = sha({ apiVersion: "platform_premium_authority_v2", originalFactsSha256: base.ticket.factsSha256,
      records, evidence, complimentary });
    return Object.freeze({ ...base, apiVersion: "platform_premium_authority_v2", complimentary,
      ticket: Object.freeze({ ...base.ticket, factsSha256, validUntilUtc: deadlines.sort()[0]! }) });
  }

  /** Recheck the caller's ORIGINAL full V2 ticket, never a fresh substitute. */
  isCurrentV2(originalTicket: PlatformPremiumAuthorityTicket): boolean {
    try {
      const ticket = ticketCopy(originalTicket);
      this.transaction();
      if (!this.dependencies || utc(ticket.observedAtUtc) > utc(this.dependencies.nowUtc())
        || utc(ticket.validUntilUtc) <= utc(this.dependencies.nowUtc())) return false;
      const current = this.captureV2(ticket.scope.authorityKey);
      const keys: readonly (keyof PlatformPremiumAuthorityScope)[] = ["authorityKey", "userId", "discordUserId", "guildId",
        "identityGeneration", "entitlementGeneration", "erasureGeneration", "policyGeneration"];
      return current.kind === "snapshot" && keys.every(key => current.ticket.scope[key] === ticket.scope[key])
        && current.ticket.observedAtUtc < ticket.validUntilUtc
        && current.ticket.authorityRevision === ticket.authorityRevision
        && current.ticket.whopGeneration === ticket.whopGeneration
        && current.ticket.admissionRef === ticket.admissionRef && current.ticket.factsSha256 === ticket.factsSha256
        && utc(this.dependencies.nowUtc()) < ticket.validUntilUtc;
    } catch { return false; }
  }

  /** Actual three-material-update transition, not a root-erasure service. The
   * real privacy issuer owns complete union admission/quiescence/closure/capture.
   * This method persists ONLY its exact qualified nonidentifying successor and
   * redacts the selected gift; canonical mutation stays with the injected owner.
   * A missing port, stale original ticket, mismatched pre/post state or absent
   * durable issuer read rolls back the entire savepoint, even if caller catches. */
  redactOwnerComplimentarySignerV2(originalTicket: PlatformPremiumAuthorityTicket,
    input: Readonly<{ grantRef: string; signerUserId: string; operationRef: string }>): PlatformPremiumRedactedComplimentaryReceiptV2 {
    return this.atomic(() => {
      const deps = this.dependenciesV2();
      if (!deps) throw new PlatformPremiumAuthorityError("unbound");
      const ticket = ticketCopy(originalTicket), grantRef = ref(input.grantRef), signerUserId = uuid(input.signerUserId), operationRef = ref(input.operationRef);
      if (!this.isCurrentV2(ticket)) throw new PlatformPremiumAuthorityError("conflict");
      const base = this.captureV2(ticket.scope.authorityKey);
      if (base.kind !== "snapshot" || ticket.scope.userId === signerUserId) throw new PlatformPremiumAuthorityError("unbound");
      const gift = this.db.prepare<[string, string], GiftRow>(
        "SELECT * FROM platform_premium_complimentary_grants WHERE authority_key=? AND grant_ref=?").get(ticket.scope.authorityKey, grantRef);
      const entitlement = gift ? this.canonicalGiftV2(gift.entitlement_id) : undefined;
      const version = entitlement ? this.db.prepare<[string], { plan_id: string }>(
        "SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?").get(entitlement.plan_version_id) : undefined;
      if (!gift || !entitlement || !version || gift.status !== "active" || entitlement.status !== "active"
        || gift.actor_user_id !== signerUserId || entitlement.granted_by_user_id !== signerUserId
        || entitlement.user_id !== ticket.scope.userId || entitlement.source_type !== "owner_grant"
        || entitlement.source_ref.startsWith("external:") || !base.policy.premiumPlanIds.includes(version.plan_id)
        || this.db.prepare("SELECT 1 FROM platform_premium_complimentary_redactions_v2 WHERE grant_ref=?").get(grantRef)) {
        throw new PlatformPremiumAuthorityError("unbound");
      }
      const preimage: PlatformPremiumGiftRedactionPreimageV2 = Object.freeze({ grantRef, authorityKey: ticket.scope.authorityKey,
        recipientUserId: ticket.scope.userId, entitlementId: gift.entitlement_id, planVersionId: entitlement.plan_version_id,
        planId: version.plan_id, signerUserId, authorizationRef: gift.authorization_ref, canonicalSourceRef: entitlement.source_ref,
        giftStartsAtUtc: gift.starts_at_utc, giftEndsAtUtc: gift.ends_at_utc,
        entitlementStartsAtUtc: entitlement.starts_at_utc, entitlementEndsAtUtc: entitlement.ends_at_utc });
      // Three is the selected mutation plan, not a default epoch. The qualified
      // schema must install these exact material fences; read back EACH advance.
      const assertMaterialStage = (count: number) => {
        const row = this.row(ticket.scope.authorityKey);
        if (!row || row.phase !== "live" || row.user_id !== ticket.scope.userId
          || row.authority_revision !== ticket.authorityRevision + count
          || row.entitlement_generation !== ticket.scope.entitlementGeneration + count
          || row.identity_generation !== ticket.scope.identityGeneration || row.whop_generation !== ticket.whopGeneration
          || row.erasure_generation !== ticket.scope.erasureGeneration) throw new PlatformPremiumAuthorityError("conflict");
      };
      const nextRevision = integer(ticket.authorityRevision + 3), nextGeneration = integer(ticket.scope.entitlementGeneration + 3);
      const prepared = deps.redactedComplimentary.prepareRedaction(this.db, { originalTicket: ticket, operationRef,
        preimage, nextAuthorityRevision: nextRevision, nextEntitlementGeneration: nextGeneration });
      if (prepared.kind !== "prepared") throw new PlatformPremiumAuthorityError("unbound");
      const receipt = redactedGiftReceiptCopyV2(prepared.receipt);
      if (receipt.originalGrantRef !== grantRef || receipt.redactionOperationRef !== operationRef
        || receipt.scope.authorityKey !== ticket.scope.authorityKey || receipt.scope.recipientUserId !== ticket.scope.userId
        || receipt.scope.entitlementId !== gift.entitlement_id || receipt.scope.planVersionId !== entitlement.plan_version_id
        || receipt.scope.planId !== version.plan_id || receipt.recipientRevisionAfterRedaction !== nextRevision
        || receipt.recipientEntitlementGenerationAfterRedaction !== nextGeneration
        || receipt.originalTerms.giftStartsAtUtc !== gift.starts_at_utc || receipt.originalTerms.giftEndsAtUtc !== gift.ends_at_utc
        || receipt.originalTerms.entitlementStartsAtUtc !== entitlement.starts_at_utc
        || receipt.originalTerms.entitlementEndsAtUtc !== entitlement.ends_at_utc || receipt.redactedAtUtc > utc(deps.nowUtc())) invalid();
      // Reject a literal erased identity in the retained projection. This is an
      // extra guard, not a substitute for issuer reference/encoding/backup audit.
      if (JSON.stringify(receipt).toLowerCase().includes(signerUserId)) throw new PlatformPremiumAuthorityError("unbound");
      if (!this.isCurrentV2(ticket)) throw new PlatformPremiumAuthorityError("conflict");
      assertMaterialStage(0);
      const committed = deps.redactedComplimentary.commitCanonicalRedaction(this.db, { receipt, preimage });
      if (committed.kind !== "applied") throw new PlatformPremiumAuthorityError("unbound");
      const canonicalAfter = this.canonicalGiftV2(gift.entitlement_id);
      if (!canonicalAfter || sha(canonicalAfter) !== sha({ ...entitlement, granted_by_user_id: null, source_ref: receipt.canonicalSourceRef })) {
        throw new PlatformPremiumAuthorityError("conflict");
      }
      assertMaterialStage(1);
      const changed = this.db.prepare(`UPDATE platform_premium_complimentary_grants SET actor_user_id=NULL,authorization_ref=?
        WHERE authority_key=? AND grant_ref=? AND actor_user_id=? AND authorization_ref=? AND status='active'`)
        .run(receipt.authorizationReceiptRef, ticket.scope.authorityKey, grantRef, signerUserId, gift.authorization_ref);
      if (changed.changes !== 1) throw new PlatformPremiumAuthorityError("conflict");
      const giftAfter = this.db.prepare<[string], GiftRow>("SELECT * FROM platform_premium_complimentary_grants WHERE grant_ref=?").get(grantRef);
      if (!giftAfter || sha(giftAfter) !== sha({ ...gift, actor_user_id: null, authorization_ref: receipt.authorizationReceiptRef })) {
        throw new PlatformPremiumAuthorityError("conflict");
      }
      assertMaterialStage(2);
      this.db.prepare(`INSERT INTO platform_premium_complimentary_redactions_v2
        (provenance_ref,grant_ref,authority_key,receipt_json,receipt_sha256) VALUES (?,?,?,?,?)`)
        .run(receipt.provenanceRef, grantRef, ticket.scope.authorityKey, JSON.stringify(receipt), sha(receipt));
      assertMaterialStage(3);
      const after = this.captureV2(ticket.scope.authorityKey);
      if (after.kind !== "snapshot" || after.ticket.authorityRevision !== nextRevision
        || after.ticket.scope.entitlementGeneration !== nextGeneration || after.ticket.whopGeneration !== ticket.whopGeneration
        || after.ticket.scope.identityGeneration !== ticket.scope.identityGeneration || after.ticket.scope.erasureGeneration !== ticket.scope.erasureGeneration
        || after.ticket.scope.policyGeneration !== ticket.scope.policyGeneration || after.ticket.admissionRef !== ticket.admissionRef
        || after.ticket.scope.userId !== ticket.scope.userId || after.ticket.scope.guildId !== ticket.scope.guildId
        || after.ticket.scope.discordUserId !== ticket.scope.discordUserId) throw new PlatformPremiumAuthorityError("conflict");
      const proof = deps.redactedComplimentary.readCurrent(this.db, { scope: after.ticket.scope,
        authorityRevision: after.ticket.authorityRevision, grantRef, entitlementId: gift.entitlement_id });
      if (proof.kind !== "qualified" || sha(redactedGiftReceiptCopyV2(proof.receipt)) !== sha(receipt)
        || utc(proof.validUntilUtc) <= utc(deps.nowUtc())) throw new PlatformPremiumAuthorityError("unbound");
      return receipt;
    });
  }

  /** Call inside the SAME IMMEDIATE transaction as the downstream durable intent.
   * Do not adapt this to revision-only checking or discard the ticket deadline. */
  isCurrent(ticket: PlatformPremiumAuthorityTicket): boolean {
    try {
      ticket = ticketCopy(ticket);
      this.transaction();
      if (!this.dependencies || utc(ticket.observedAtUtc) > utc(this.dependencies.nowUtc())
        || utc(ticket.validUntilUtc) <= utc(this.dependencies.nowUtc())) return false;
      const current = this.capture(ticket.scope.authorityKey);
      const scopeKeys: readonly (keyof PlatformPremiumAuthorityScope)[] = ["authorityKey", "userId", "discordUserId", "guildId",
        "identityGeneration", "entitlementGeneration", "erasureGeneration", "policyGeneration"];
      return current.kind === "snapshot" && scopeKeys.every(key => current.ticket.scope[key] === ticket.scope[key])
        && current.ticket.observedAtUtc < ticket.validUntilUtc
        && current.ticket.authorityRevision === ticket.authorityRevision
        && current.ticket.whopGeneration === ticket.whopGeneration
        && current.ticket.admissionRef === ticket.admissionRef
        && current.ticket.factsSha256 === ticket.factsSha256
        && utc(this.dependencies.nowUtc()) < ticket.validUntilUtc;
    } catch { return false; }
  }

  /** Map a stable Platform user to an ALREADY initialized authority, scoped to
   * the consumer's configured guild. Caller owns the admitted IMMEDIATE writer.
   * A missing mapping is unbound, never unpaid; this read does not initialize,
   * adopt an identity, substitute the user UUID or manufacture an epoch/ticket.
   * A null Discord subject remains valid user evidence when another active login
   * exists; any downstream Discord effect still needs its own actual subject.
   * The key is only a lookup result: persist/recheck the full capture ticket for
   * a durable intent, not this key or a newly substituted current ticket. */
  resolveUserAuthority(userId: string, guildId: string): Readonly<{
    kind: "linked"; authorityKey: string;
  }> | Readonly<{ kind: "ambiguous" | "unbound" }> {
    uuid(userId); snowflake(guildId);
    if (!this.qualified()) return Object.freeze({ kind: "unbound" });
    // Count all existing mappings before filtering policy/phase. A corrupt or
    // ambiguous mapping must not become unique by hiding an ineligible row.
    const rows = this.db.prepare<[string], { authority_key: string }>(`SELECT authority_key
      FROM platform_premium_authorities WHERE user_id=? ORDER BY authority_key LIMIT 2`).all(userId);
    if (rows.length !== 1) return Object.freeze({ kind: rows.length ? "ambiguous" : "unbound" });
    if (!this.db.prepare("SELECT 1 FROM platform_auth_identities WHERE user_id=? AND status='active' LIMIT 1").get(userId)) {
      return Object.freeze({ kind: "unbound" });
    }
    const snapshot = this.capture(rows[0]!.authority_key);
    if (snapshot.kind !== "snapshot" || snapshot.ticket.scope.userId !== userId
      || snapshot.ticket.scope.guildId !== guildId || snapshot.ticket.scope.authorityKey !== rows[0]!.authority_key) {
      return Object.freeze({ kind: "unbound" });
    }
    return Object.freeze({ kind: "linked", authorityKey: snapshot.ticket.scope.authorityKey });
  }

  resolveDiscordAuthority(guildId: string, discordUserId: string): Readonly<{
    kind: "linked"; authorityKey: string;
  }> | Readonly<{ kind: "unlinked" | "ambiguous" | "unbound" }> {
    if (!this.qualified()) return Object.freeze({ kind: "unbound" });
    const rows = this.db.prepare<[string, string], { authority_key: string }>(`SELECT a.authority_key
      FROM platform_auth_identities i JOIN platform_premium_authorities a ON a.user_id=i.user_id
      JOIN platform_users u ON u.user_id=i.user_id JOIN platform_premium_authority_policies p ON p.policy_ref=a.policy_ref
      WHERE i.auth_provider='discord' AND i.auth_subject=? AND i.status='active' AND u.status='active'
        AND a.phase='live' AND p.state='active' AND p.guild_id=? LIMIT 2`).all(snowflake(discordUserId), snowflake(guildId));
    if (rows.length !== 1) return Object.freeze({ kind: rows.length ? "ambiguous" : "unlinked" });
    const snapshot = this.capture(rows[0]!.authority_key);
    return snapshot.kind === "snapshot" ? Object.freeze({ kind: "linked", authorityKey: snapshot.ticket.scope.authorityKey })
      : Object.freeze({ kind: "unbound" });
  }

  /** A known raw subject is optional server evidence (e.g. a verified callback),
   * not a client-selected payer. The actual canonical HMAC must match. Without
   * it or a previously persisted verified binding, no GET target is manufactured. */
  nativePurchase(ticket: PlatformPremiumAuthorityTicket, offerScopeRef: string, knownNativeSubject?: string):
  Readonly<{ kind: "purchase"; purchase: PlatformPremiumNativePurchase }>
    | Readonly<{ kind: "unbound" }> {
    return this.nativePurchaseForTicket(ticket, offerScopeRef, knownNativeSubject, false);
  }

  nativePurchaseV2(ticket: PlatformPremiumAuthorityTicket, offerScopeRef: string, knownNativeSubject?: string):
    Readonly<{ kind: "purchase"; purchase: PlatformPremiumNativePurchase }> | Readonly<{ kind: "unbound" }> {
    return this.nativePurchaseForTicket(ticket, offerScopeRef, knownNativeSubject, true);
  }

  private nativePurchaseForTicket(ticket: PlatformPremiumAuthorityTicket, offerScopeRef: string,
    knownNativeSubject: string | undefined, v2: boolean):
    Readonly<{ kind: "purchase"; purchase: PlatformPremiumNativePurchase }> | Readonly<{ kind: "unbound" }> {
    ticket = ticketCopy(ticket);
    if (!(v2 ? this.isCurrentV2(ticket) : this.isCurrent(ticket))) return Object.freeze({ kind: "unbound" });
    const snapshot = v2 ? this.captureV2(ticket.scope.authorityKey) : this.capture(ticket.scope.authorityKey);
    if (snapshot.kind !== "snapshot") return Object.freeze({ kind: "unbound" });
    const offer = snapshot.policy.offerScopes.find(item => item.scopeRef === ref(offerScopeRef));
    if (!offer || !snapshot.policy.nativeQualification) return Object.freeze({ kind: "unbound" });
    if (snapshot.payer.kind === "bound") {
      if (knownNativeSubject && knownNativeSubject !== snapshot.payer.whopUserId) throw new PlatformPremiumAuthorityError("conflict");
      return Object.freeze({ kind: "purchase", purchase: Object.freeze({ offer, payer: snapshot.payer }) });
    }
    if (!knownNativeSubject || snapshot.payer.reason === "conflict" || !this.dependencies?.whopSubjectReference) {
      return Object.freeze({ kind: "unbound" });
    }
    const links = this.db.prepare<[string], LinkRow>(`SELECT link_id,whop_user_ref_hmac,link_state
      FROM platform_whop_user_links WHERE user_id=? AND link_state='active'`).all(ticket.scope.userId);
    const rawId = ref(knownNativeSubject);
    if (links.length !== 1 || this.dependencies.whopSubjectReference(rawId) !== links[0]!.whop_user_ref_hmac) {
      return Object.freeze({ kind: "unbound" });
    }
    return Object.freeze({ kind: "purchase", purchase: Object.freeze({ offer, payer: Object.freeze({
      kind: "bound", linkId: uuid(links[0]!.link_id), whopUserRefHmac: links[0]!.whop_user_ref_hmac, whopUserId: rawId,
    }) }) });
  }

  /** Identity-only proof consumption for an actual OAuth callback. The canonical
   * active link/HMAC, qualified policy and full original V2 must already be real.
   * No provider observation/payment/role is created. A successful INSERT advances
   * native identity epochs; retry with that old intent stays stale. */
  recordVerifiedWhopSubjectBindingV2(originalTicket: PlatformPremiumAuthorityTicket, offerScopeRef: string,
    justVerifiedSubject: string): Readonly<{ kind: "bound" | "duplicate" }> {
    return this.atomic(() => {
      this.write(); const ticket = ticketCopy(originalTicket), raw = ref(justVerifiedSubject);
      const ledger = this.db.prepare("SELECT migration_id,module_namespace,execution_order,checksum_sha256,post_schema_sha256 FROM platform_schema_migrations ORDER BY execution_order").all() as {
        migration_id:string;module_namespace:string;execution_order:number;checksum_sha256:string;post_schema_sha256:string }[];
      const last = ledger.at(-1);
      const reviewedLedger = ledger.length === 204 && last?.migration_id === "0216_platform_premium_current_access_events" && last.module_namespace === "platform"
    && last.execution_order === 291 && last.checksum_sha256 === "a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539"
   || ledger.length === 205 && ledger[203]?.migration_id === "0216_platform_premium_current_access_events" && ledger[203].module_namespace === "platform"
    && ledger[203].execution_order === 291 && ledger[203].checksum_sha256 === "a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539"
    && last?.migration_id === "0217_traderlink_community_stats_forward_checkpoints" && last.module_namespace === "community"
    && last.execution_order === 292 && last.checksum_sha256 === "d0d493935a53c473a73d164101c1bab6193487ca56a4b678ea26cff4d9f7dbec"
   || isReviewed210PremiumEventsLedgerPrefix(ledger)
   || isReviewed211NewsMembershipsLedger(ledger);
      if (!reviewedLedger || !this.isCurrentV2(ticket)) throw new PlatformPremiumAuthorityError("unbound");
      const snapshot = this.captureV2(ticket.scope.authorityKey);
      if (snapshot.kind !== "snapshot" || snapshot.policy.state !== "active" || snapshot.policy.guildId !== "1559172784813514803"
        || snapshot.policy.offerScopes.length !== 1 || snapshot.policy.offerScopes[0]?.environment !== "sandbox"
        || snapshot.policy.offerScopes[0].scopeRef !== ref(offerScopeRef) || !snapshot.policy.nativeQualification) throw new PlatformPremiumAuthorityError("unbound");
      const purchase = this.nativePurchaseForTicket(ticket, offerScopeRef, raw, true);
      if (purchase.kind !== "purchase") throw new PlatformPremiumAuthorityError("unbound");
      const payer = purchase.purchase.payer;
      const old = this.db.prepare<[string], BindingRow>("SELECT * FROM platform_premium_native_bindings WHERE authority_key=?").get(ticket.scope.authorityKey);
      if (old) {
        if (old.link_id !== payer.linkId || old.whop_user_ref_hmac !== payer.whopUserRefHmac || old.whop_user_id !== raw) throw new PlatformPremiumAuthorityError("conflict");
        return Object.freeze({ kind: "duplicate" });
      }
      if (!this.isCurrentV2(ticket)) throw new PlatformPremiumAuthorityError("conflict");
      const before = this.row(ticket.scope.authorityKey)!;
      this.db.prepare("INSERT INTO platform_premium_native_bindings VALUES (?,?,?,?)").run(ticket.scope.authorityKey, payer.linkId, payer.whopUserRefHmac, raw);
      const after = this.row(ticket.scope.authorityKey)!;
      if (after.identity_generation !== before.identity_generation + 1 || after.authority_revision !== before.authority_revision + 1
        || after.entitlement_generation !== before.entitlement_generation || after.whop_generation !== before.whop_generation
        || after.erasure_generation !== before.erasure_generation) throw new PlatformPremiumAuthorityError("conflict");
      return Object.freeze({ kind: "bound" });
    });
  }

  /** Only the native module's in-process prepared receipt can be persisted.
   * Hydration is outside SQLite; all real authority is rechecked here. */
  recordWhopCoverage(ticket: PlatformPremiumAuthorityTicket, observationRef: string,
    proof: PlatformPremiumPreparedWhopCoverage): Readonly<{ kind: "recorded" | "duplicate" }> {
    if (!isPreparedPlatformPremiumWhopCoverage(proof)) invalid();
    return this.recordWhopObservation(ticket, observationRef, proof);
  }

  recordWhopCurrentAccess(ticket: PlatformPremiumAuthorityTicket, observationRef: string,
    proof: PlatformPremiumPreparedWhopCurrentAccess): Readonly<{ kind: "recorded" | "duplicate" }> {
    if (!isPreparedPlatformPremiumWhopCurrentAccess(proof)) invalid();
    return this.recordWhopObservation(ticket, observationRef, proof, true);
  }

  private recordWhopObservation(ticket: PlatformPremiumAuthorityTicket, observationRef: string,
    proof: PlatformPremiumPreparedWhopCoverage | PlatformPremiumPreparedWhopCurrentAccess, v2 = false): Readonly<{ kind: "recorded" | "duplicate" }> {
    return this.atomic(() => {
    ticket = ticketCopy(ticket);
    const deps = this.write(); ref(observationRef);
    if (!isPreparedPlatformPremiumWhopCoverage(proof) && !isPreparedPlatformPremiumWhopCurrentAccess(proof)) invalid();
    const prior = this.db.prepare<[string], ObservationRow>("SELECT * FROM platform_premium_paid_observations WHERE observation_ref=?").get(observationRef);
    if (prior) {
      if (prior.authority_key !== ticket.scope.authorityKey || prior.collection_sha256 !== proof.digest) throw new PlatformPremiumAuthorityError("conflict");
      return Object.freeze({ kind: "duplicate" });
    }
    if (!(v2 ? this.isCurrentV2(ticket) : this.isCurrent(ticket))) throw new PlatformPremiumAuthorityError("conflict");
    const snapshot = v2 ? this.captureV2(ticket.scope.authorityKey) : this.capture(ticket.scope.authorityKey);
    if (snapshot.kind !== "snapshot") throw new PlatformPremiumAuthorityError("unbound");
    const collection = proof.collection, scope = snapshot.policy.offerScopes.find(item => sha(item) === sha(collection.purchase.offer));
    const q = snapshot.policy.nativeQualification, now = utc(deps.nowUtc());
    if (!scope || !q || proof.qualificationRef !== q.reviewRef || proof.schemaSha256 !== q.schemaSha256
      || proof.apiVersion !== q.apiVersion || sha(collection) !== proof.digest || collection.observedAtUtc > now
      || collection.validUntilUtc <= now
      || Date.parse(collection.validUntilUtc) - Date.parse(collection.observedAtUtc) > snapshot.policy.maximumEvidenceAgeMs) invalid();
    const selected = this.nativePurchaseForTicket(ticket, scope.scopeRef, collection.purchase.payer.whopUserId, v2);
    if (selected.kind !== "purchase" || sha(selected.purchase) !== sha(collection.purchase)) throw new PlatformPremiumAuthorityError("unbound");
    const latest = this.db.prepare<[string, string], ObservationRow>(`SELECT * FROM platform_premium_paid_observations
      WHERE authority_key=? AND offer_scope_ref=? ORDER BY observed_at_utc DESC,observation_ref DESC LIMIT 1`)
      .get(ticket.scope.authorityKey, scope.scopeRef);
    if (latest && (latest.observed_at_utc > collection.observedAtUtc
      || (latest.observed_at_utc === collection.observedAtUtc && latest.collection_sha256 !== proof.digest))) {
      throw new PlatformPremiumAuthorityError("conflict");
    }
    const payer = collection.purchase.payer;
    if (!(v2 ? this.isCurrentV2(ticket) : this.isCurrent(ticket))) throw new PlatformPremiumAuthorityError("conflict");
    this.db.prepare(`INSERT INTO platform_premium_native_bindings VALUES (?,?,?,?)
      ON CONFLICT(authority_key) DO UPDATE SET link_id=excluded.link_id,whop_user_ref_hmac=excluded.whop_user_ref_hmac,
      whop_user_id=excluded.whop_user_id`).run(ticket.scope.authorityKey, payer.linkId, payer.whopUserRefHmac, payer.whopUserId);
    const current = this.row(ticket.scope.authorityKey)!;
    this.db.prepare(`INSERT INTO platform_premium_paid_observations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(observationRef, current.authority_key, scope.scopeRef, proof.digest, JSON.stringify(collection), proof.qualificationRef,
        proof.schemaSha256, proof.apiVersion, current.identity_generation, current.whop_generation,
        current.erasure_generation, snapshot.policy.generation, collection.observedAtUtc, collection.validUntilUtc);
    return Object.freeze({ kind: "recorded" });
    });
  }

  recordOwnerComplimentary(input: Readonly<{ authorityKey: string; grantRef: string; entitlementId: string;
    actorUserId: string; authorizationRef: string; startsAtUtc: string; endsAtUtc: string | null }>): void {
    this.atomic(() => {
    input = Object.freeze({ authorityKey: uuid(input.authorityKey), grantRef: ref(input.grantRef),
      entitlementId: uuid(input.entitlementId), actorUserId: uuid(input.actorUserId), authorizationRef: ref(input.authorizationRef),
      startsAtUtc: utc(input.startsAtUtc), endsAtUtc: input.endsAtUtc === null ? null : utc(input.endsAtUtc) });
    const deps = this.write();
    const snapshot = this.capture(input.authorityKey);
    if (snapshot.kind !== "snapshot") throw new PlatformPremiumAuthorityError("unbound");
    uuid(input.entitlementId); uuid(input.actorUserId); ref(input.grantRef); ref(input.authorizationRef);
    utc(input.startsAtUtc); if (input.endsAtUtc && utc(input.endsAtUtc) <= input.startsAtUtc) invalid();
    if (!deps.owner.authorizeGift(this.db, input)) throw new PlatformPremiumAuthorityError("unbound");
    const entitlement = this.db.prepare<[string, string], { plan_id: string; source_type: string; source_ref: string;
      granted_by_user_id: string; starts_at_utc: string; ends_at_utc: string | null }>(
      `SELECT v.plan_id,e.source_type,e.source_ref,e.granted_by_user_id,e.starts_at_utc,e.ends_at_utc FROM platform_membership_entitlements e
       JOIN platform_membership_plan_versions v USING(plan_version_id) WHERE e.entitlement_id=? AND e.user_id=? AND e.status='active'`)
      .get(input.entitlementId, snapshot.ticket.scope.userId);
    if (!entitlement || entitlement.source_type !== "owner_grant" || !snapshot.policy.premiumPlanIds.includes(entitlement.plan_id)
      || entitlement.source_ref.startsWith("external:") || entitlement.granted_by_user_id !== input.actorUserId
      || input.startsAtUtc < entitlement.starts_at_utc || (entitlement.ends_at_utc !== null
        && (input.endsAtUtc === null || input.endsAtUtc > entitlement.ends_at_utc))) invalid();
    // Explicit authorization must distinguish a real owner gift from external
    // payment confirmation. This method never adopts generic historical grants.
    if (!this.isCurrent(snapshot.ticket)) throw new PlatformPremiumAuthorityError("conflict");
    this.db.prepare("INSERT INTO platform_premium_complimentary_grants VALUES (?,?,?,?,?,'active',?,?)")
      .run(input.grantRef, input.authorityKey, input.entitlementId, input.actorUserId, input.authorizationRef,
        input.startsAtUtc, input.endsAtUtc);
    });
  }

  revokeOwnerComplimentary(input: Readonly<{ authorityKey: string; grantRef: string; entitlementId: string;
    actorUserId: string; authorizationRef: string }>): void {
    this.atomic(() => {
    input = Object.freeze({ authorityKey: uuid(input.authorityKey), grantRef: ref(input.grantRef),
      entitlementId: uuid(input.entitlementId), actorUserId: uuid(input.actorUserId), authorizationRef: ref(input.authorizationRef) });
    const deps = this.write();
    const snapshot = this.capture(input.authorityKey);
    if (snapshot.kind !== "snapshot") throw new PlatformPremiumAuthorityError("unbound");
    if (!deps.owner.authorizeGift(this.db, input)) throw new PlatformPremiumAuthorityError("unbound");
    if (!this.isCurrent(snapshot.ticket)) throw new PlatformPremiumAuthorityError("conflict");
    this.db.prepare("UPDATE platform_premium_complimentary_grants SET status='revoked' WHERE authority_key=? AND grant_ref=? AND entitlement_id=?")
      .run(uuid(input.authorityKey), ref(input.grantRef), uuid(input.entitlementId));
    });
  }

  /** Command-private planning read in the caller's admitted transaction. Enumerates
   * these two known cross-recipient signer edges, NOT the complete core FK graph.
   * Canonical rows include every status and recipients without a new authority.
   * A nullable signer does not itself authorize redaction or access revocation. */
  inspectRootErasureReferences(userId: string): PlatformPremiumRootErasureReferencePlan
    | Readonly<{ kind: "unbound"; reason: "schema_unqualified" }> {
    uuid(userId);
    if (!this.qualified()) return Object.freeze({ kind: "unbound", reason: "schema_unqualified" });
    type Recipient = { userId: string | null; authorityKey: string | null; phase: AuthorityRow["phase"] | null;
      currentRevision: number | null; explicitGiftActorUpdateCount: number; canonicalSignerEntitlementIds: string[] };
    const recipients = new Map<string, Recipient>();
    const gifts = this.db.prepare<[string, string], { authority_key: string; user_id: string | null;
      phase: AuthorityRow["phase"]; authority_revision: number; material_updates: number }>(
      `SELECT a.authority_key,a.user_id,a.phase,a.authority_revision,COUNT(*) AS material_updates
       FROM platform_premium_complimentary_grants g JOIN platform_premium_authorities a USING(authority_key)
       WHERE g.actor_user_id=? AND (a.user_id IS NULL OR a.user_id<>?)
       GROUP BY a.authority_key,a.user_id,a.phase,a.authority_revision ORDER BY a.authority_key`).all(userId, userId);
    for (const row of gifts) {
      const key = row.user_id === null ? `authority:${row.authority_key}` : `user:${row.user_id}`;
      recipients.set(key, { userId: row.user_id, authorityKey: row.authority_key, phase: row.phase,
        currentRevision: integer(row.authority_revision), explicitGiftActorUpdateCount: integer(row.material_updates),
        canonicalSignerEntitlementIds: [] });
    }
    const canonical = this.db.prepare<[string, string], { entitlement_id: string; user_id: string;
      authority_key: string | null; phase: AuthorityRow["phase"] | null; authority_revision: number | null }>(
      `SELECT e.entitlement_id,e.user_id,a.authority_key,a.phase,a.authority_revision
       FROM platform_membership_entitlements e LEFT JOIN platform_premium_authorities a ON a.user_id=e.user_id
       WHERE e.granted_by_user_id=? AND e.user_id<>? ORDER BY e.user_id,e.entitlement_id`).all(userId, userId);
    for (const row of canonical) {
      const key = `user:${row.user_id}`;
      let recipient = recipients.get(key);
      if (!recipient) {
        recipient = { userId: row.user_id, authorityKey: row.authority_key, phase: row.phase,
          currentRevision: row.authority_revision === null ? null : integer(row.authority_revision),
          explicitGiftActorUpdateCount: 0, canonicalSignerEntitlementIds: [] };
        recipients.set(key, recipient);
      }
      recipient.canonicalSignerEntitlementIds.push(row.entitlement_id);
    }
    const entries = [...recipients.entries()].sort(([a], [b]) => a.localeCompare(b, "en"));
    const blockingReasons: ("canonical_signer_entitlement_disposition_unqualified" | "gift_signer_reference_unqualified")[] = [];
    if (canonical.length) blockingReasons.push("canonical_signer_entitlement_disposition_unqualified");
    if (gifts.some(row => row.phase !== "live" || row.user_id === null)) blockingReasons.push("gift_signer_reference_unqualified");
    return Object.freeze({ userId, knownReferencesOnly: true, canonicalSignerDisposition: "unqualified",
      recipients: Object.freeze(entries.map(([, recipient]) => Object.freeze({ ...recipient,
        canonicalSignerEntitlementIds: Object.freeze([...recipient.canonicalSignerEntitlementIds].sort()),
        knownMinimumRevisionDeltaIfCoreDeletesCanonicalRows: recipient.phase === "live"
          ? integer(recipient.explicitGiftActorUpdateCount + recipient.canonicalSignerEntitlementIds.length) : null,
      }))), blockingReasons: Object.freeze(blockingReasons) });
  }

  /** Command-only participant BEFORE the core erasure service/guard suspension.
   * It must share the fresh admitted IMMEDIATE transaction. A missing or merely
   * expired inflight lease is never converted into quiescence. No Paid receipt,
   * outbox, claim or outcome table is deleted/invalidated by this participant. */
  fenceForRootErasure(userId: string, receiptRef: string): void {
    this.atomic(() => {
    const deps = this.write(); uuid(userId); ref(receiptRef);
    const referencePlan = this.inspectRootErasureReferences(userId);
    if ("kind" in referencePlan) throw new PlatformPremiumAuthorityError("unbound");
    // Must run even when the deleting user has no Premium authority. Never issue
    // a positive quiescence/capture request with unresolved canonical signer rows.
    if (referencePlan.blockingReasons.length) throw new PlatformPremiumAuthorityError("unbound", referencePlan.blockingReasons[0]);
    const rows = this.db.prepare<[string], AuthorityRow>("SELECT * FROM platform_premium_authorities WHERE user_id=? ORDER BY authority_key").all(userId);
    const recipients = referencePlan.recipients.map(recipient => {
      if (!recipient.authorityKey || recipient.currentRevision === null || recipient.phase !== "live"
        || recipient.explicitGiftActorUpdateCount < 1) throw new PlatformPremiumAuthorityError("unbound");
      return { authority_key: recipient.authorityKey, authority_revision: recipient.currentRevision,
        material_updates: recipient.explicitGiftActorUpdateCount };
    }).sort((a, b) => a.authority_key.localeCompare(b.authority_key, "en"));
    const capture = deps.erasure.captureBeforeRootDelete(this.db, { userId, receiptRef, referencePlan,
      authorities: Object.freeze(rows.map(row => Object.freeze({ authorityKey: row.authority_key,
        currentRevision: integer(row.authority_revision), nextRevision: integer(row.authority_revision + 1),
        currentErasureGeneration: integer(row.erasure_generation) }))),
      affectedGiftRecipients: Object.freeze(recipients.map(row => Object.freeze({ authorityKey: row.authority_key,
        currentRevision: integer(row.authority_revision), nextRevision: integer(row.authority_revision + row.material_updates),
        materialUpdateCount: integer(row.material_updates) }))) });
    if (capture.kind !== "captured_and_quiescent" || capture.receiptRef !== receiptRef) throw new PlatformPremiumAuthorityError("unbound");
    ref(capture.quiescenceRef);
    if (sha(this.inspectRootErasureReferences(userId)) !== sha(referencePlan)) throw new PlatformPremiumAuthorityError("conflict");
    if (sha([...capture.affectedGiftRecipientAuthorityKeys].sort()) !== sha(recipients.map(row => row.authority_key))) invalid();
    if (capture.authorities.length !== rows.length || new Set(capture.authorities.map(row => row.authorityKey)).size !== rows.length) invalid();
    for (const recipient of recipients) {
      if (this.row(recipient.authority_key)?.authority_revision !== recipient.authority_revision) throw new PlatformPremiumAuthorityError("conflict");
    }
    for (const row of rows) {
      if (row.phase !== "live") throw new PlatformPremiumAuthorityError("conflict");
      const next = capture.authorities.find(item => item.authorityKey === row.authority_key);
      if (!next || integer(next.nextErasureGeneration) <= row.erasure_generation) throw new PlatformPremiumAuthorityError("unbound");
      const changed = this.db.prepare(`UPDATE platform_premium_authorities SET phase='erasing',authority_revision=authority_revision+1,
        erasure_generation=?,erasure_receipt_ref=?,erasure_quiescence_ref=? WHERE authority_key=? AND phase='live'
          AND authority_revision=? AND erasure_generation=?`)
        .run(next.nextErasureGeneration, receiptRef, capture.quiescenceRef, row.authority_key, row.authority_revision, row.erasure_generation);
      if (changed.changes !== 1) throw new PlatformPremiumAuthorityError("conflict");
      // Phase is already fenced: later owned-row DELETE triggers cannot advance
      // captured generations or recreate principals. Scrub all private payloads.
      for (const table of TABLES.filter(name => !["platform_premium_authorities", "platform_premium_authority_policies"].includes(name))) {
        this.db.prepare(`DELETE FROM ${table} WHERE authority_key=?`).run(row.authority_key);
      }
      this.db.prepare("UPDATE platform_premium_authorities SET phase='erased',user_id=NULL,baseline_sha256=NULL WHERE authority_key=?")
        .run(row.authority_key);
    }
    // Signer identity is a separate logical root reference. The real privacy
    // producer must have admitted/quiesced these recipient scopes as well.
    this.db.prepare("UPDATE platform_premium_complimentary_grants SET actor_user_id=NULL WHERE actor_user_id=?").run(userId);
    });
  }
}
