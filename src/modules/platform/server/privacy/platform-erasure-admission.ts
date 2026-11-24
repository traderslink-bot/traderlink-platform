import { isReviewed210PremiumEventsBoundary, isReviewed211NewsMembershipsPremiumEventsBoundary } from "./platform-erasure-210-boundary";
import { calculatePlatformMigrationChecksum } from "../database/platform-migration-contract";
import { platformPremiumCurrentAccessEventsMigration } from "../database/migrations/0216_platform_premium_current_access_events";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS } from "../membership/platform-premium-role-current-access-schema";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL } from "../membership/platform-premium-role-schema";
import { createWhopPrivacyReference } from "../billing/whop-ai-review-identity";
import { platformErasureParticipants } from "./platform-erasure-participants";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";
import type Database from "better-sqlite3";
import { PlatformAdminAuthorization, type PlatformAdminRequestFrame } from "../administration/platform-admin-authorization";
import type { TraderLinkPlatformRequestIdentity } from "../authentication/require-platform-request-scope";
import { PlatformSessionRepository } from "../authentication/platform-session-repository";
import { hashPlatformSessionToken, TRADERLINK_PLATFORM_SESSION_COOKIE } from "../authentication/platform-session-service";
import { platformAuthCookieName } from "../authentication/platform-auth-cookies";
import { platformMigrationManifest, expectedPlatformTableNamesForPrefix } from "../database/platform-migration-manifest";
import { readAppliedPlatformMigrations, validateAppliedPlatformMigrationPrefix,
  listPlatformUserTableNames, requirePlatformSchemaDigest } from "../database/platform-migration-registry";
import { platformPremiumAuthoritySchemaStatementsV2, platformPremiumAuthoritySchemaDescriptor,
  platformPremiumAuthoritySchemaDescriptorV2, PlatformPremiumAuthorityRepository,
  type PlatformPremiumAuthorityDependenciesV2 } from "../membership/platform-premium-authority-repository";
import { PlatformPremiumSignerRedaction, platformPremiumSignerRedactionSchemaStatements,
  platformPremiumSignerRedactionSchemaDescriptor } from "./platform-premium-signer-redaction";
import { revalidatePlatformRootErasureCommand, type ErasureCommand } from "./platform-erasure-command";
import { samePremiumRoleTarget, type PlatformPremiumRoleClaim, type PlatformPremiumRoleOutcome } from "../membership/platform-premium-role-repository";

import { platformErasureAdmissionSchemaStatements, platformErasureAdmissionSchemaDescriptor } from "./platform-erasure-admission-schema";
import { projectPartnerAlertAuditEvidence, projectPartnerAlertIdempotencyEvidence } from "../../../partner-alerts/server/partner-alert-retained-evidence";
import { partnerAlertRecordRetainUntil } from "../../../partner-alerts/server/partner-alert-retention-policy";
import { partnerGuardDomainHmac, rawPartnerClaimSha256, samePartnerGuardNamedValues } from "./platform-partner-identifying-source-guard-helpers";
import { installPlatformProfile, type PlatformProfileInstallInput } from "./platform-profile-install-primitive";
import { readReviewedPlatformErasureCatalog } from "./platform-reviewed-erasure-catalog";
import { PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS } from "./platform-erasure-text-successor-schema";
import { sweepPlatformErasureTextPage } from "./platform-erasure-text-sweep";
import { PlatformErasureService } from "./platform-erasure-service";
import { PlatformErasureRecovery, erasureTargetBinding, type ErasureObjectStore } from "./platform-erasure-recovery";
import { stageCommittedRestoreTombstone } from "./platform-erasure-restore-evidence";
import { PartnerAlertTombstoneLedger } from "../../../partner-alerts/server/partner-alert-tombstone-ledger";
import { currentPartnerAlertErasureRuntime } from "../../../partner-alerts/server/partner-alert-erasure-runtime";
export { platformErasureAdmissionSchemaStatements, platformErasureAdmissionSchemaDescriptor };

export class PlatformErasureAdmissionError extends Error {
  constructor(readonly code: "unqualified" | "not_admitted" | "held" | "conflict") {
    super("Platform operation requires current admission.");
  }
}
export const erasureHold = (): never => { throw new PlatformErasureAdmissionError("held"); };
const fail = (): never => { throw new PlatformErasureAdmissionError("not_admitted"); };
const sha = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const utc = (value: string): string => {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) return fail();
  return value;
};
const ref = (value: string): string => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_:-]{1,160}$/u.test(value)) return fail();
  return value;
};
type Profile = { profile_ref: string; generation: number; schema_sha256: string;
  retention_policy_ref: string; backup_policy_ref: string; reference_policy: string; valid_until_utc: string };
type ReviewedProfile = Readonly<{ profileRef: string; retentionPolicyRef: string; backupPolicyRef: string; validUntilUtc: string }>;
type ReviewedCatalog = Readonly<{ schemaSha256: string; profiles: readonly ReviewedProfile[] }>;
function verifyNativeArtifacts(): void {
  const pins: Readonly<Record<string,string>> = {
    "membership/platform-premium-authority-repository.ts": "f6ebb4fd6b1afba84efbbcad0ff89d0743a9f859c588fde58f74a6106d11314b",
    "membership/platform-premium-whop-native.ts": "0c6e1ad9b402e5bde926284865c38de1f7a7502dcf72c623d6300b8b85637718",
    "privacy/platform-premium-signer-redaction.ts": "364aa7982a87f4cee623dbcc1d50b3c53a94825a1c964278de18c1481bdc9f76",
  };
  try {
    const root = realpathSync(resolve(process.cwd(),"src/modules/platform/server"));
    for (const [relative,expected] of Object.entries(pins)) {
      const path = realpathSync(resolve(root,relative));
      if (!path.startsWith(`${root}${sep}`)) return fail();
      const bytes = readFileSync(path);
      if (bytes.length > 256 * 1024 || createHash("sha256").update(bytes).digest("hex") !== expected) return fail();
    }
  } catch { throw new PlatformErasureAdmissionError("unqualified"); }
}
/** Bootstrap-only immutable release artifact, not an HTTP input. The selected
 * candidate must supply a separately reviewed pin; no artifact is fabricated
 * or written by this source. Filesystem access precedes the writer entirely. */
function readReviewedCatalog(expectedSha256: string, nowUtc: string): ReviewedCatalog {
  if (!/^[0-9a-f]{64}$/u.test(expectedSha256)) return fail();
  try {
    const docs = realpathSync(resolve(process.cwd(),"docs"));
    const path = realpathSync(resolve(docs,"migration/partner-alert-erasure-profile-qualification.json"));
    if (!path.startsWith(`${docs}${sep}`)) return fail();
    const bytes = readFileSync(path);
    if (bytes.length > 1024 * 1024 || createHash("sha256").update(bytes).digest("hex") !== expectedSha256) return fail();
    return readReviewedPlatformErasureCatalog(JSON.parse(bytes.toString("utf8")), {
      nowUtc,
      authoritySchemaSha256: platformPremiumAuthoritySchemaDescriptorV2.sha256,
      privacySchemaSha256: platformPremiumSignerRedactionSchemaDescriptor.sha256,
      nativeSourceArtifactSha256: "364aa7982a87f4cee623dbcc1d50b3c53a94825a1c964278de18c1481bdc9f76",
    });
  } catch { throw new PlatformErasureAdmissionError("unqualified"); }
}
type Lifecycle = { lifecycle_ref: string; user_id: string | null; generation: number; admission_ref: string;
  erasure_generation: number; phase: string; profile_ref: string; profile_generation: number; valid_until_utc: string; operation_ref: string | null };
export type PlatformErasureQualificationReceipt = Readonly<{
  receiptRef: string; schemaSha256: string; profileCatalogSha256: string;
}>;
export type PlatformErasureModuleOperation = Readonly<{
  operation_ref: string; lifecycle_ref: string; workspace_id: string | null; phase: string;
  profile_ref: string; profile_generation: number; original_admission_ref: string; original_generation: number;
  prepared_at_utc: string; valid_until_utc: string; quiescence_ref: string | null; hold_code: string | null;
}>;
type Context = { kind: "request" | "automation" | "erasure"; active: boolean; failed: boolean;
  userIds: ReadonlySet<string>; deadline: string; verify: () => void;
  frame: PlatformAdminRequestFrame | null; request: Request | null;
  identity: TraderLinkPlatformRequestIdentity | null;
  identifyingSourceDelete: { admission: PlatformErasureAdmission; participant: "partner_audit" | "partner_command"; sourceRef: string; userId: string; communityId: string; consumed: boolean } | null;
  ownerScope: ReturnType<PlatformAdminRequestFrame["authorize"]> | null; operationRef: string | null };

type PartnerIdentifyingBinding=Readonly<{keyRef:string;key:Uint8Array}>;
function storedPartnerOperationProjection(value:Record<string,unknown>):Record<string,unknown>{return {
  evidence_ref:value.evidenceRef,lifecycle_ref:value.lifecycleRef,record_kind:value.recordKind,
  community_binding_hmac_sha256:value.communityBindingHmacSha256,source_record_hmac_sha256:value.sourceRecordHmacSha256,
  binding_key_ref:value.bindingKeyRef,action_code:value.actionCode,resource_binding_hmac_sha256:value.resourceBindingHmacSha256,
  partner_revision:value.partnerRevision,resource_version:value.resourceVersion,state_code:value.stateCode,
  fingerprint_hmac_sha256:value.fingerprintHmacSha256,result_hmac_sha256:value.resultHmacSha256,
  source_created_at_utc:value.sourceCreatedAtUtc,archived_at_utc:value.archivedAtUtc,retain_until_utc:value.retainUntilUtc,
};}

const bindings = new WeakMap<Database.Database, PlatformErasureAdmission>();
const contexts = new WeakMap<Database.Database, Context>();

/** An exact registered schema is necessary, including trigger bodies and the
 * complete managed-table list. Installing component DDL or copying a ledger is
 * insufficient. Current source has NO registered successor and cannot bind. */
function currentPremiumEventsTableSql(database: Database.Database): string | undefined {
  return (database.prepare("SELECT sql FROM sqlite_schema WHERE type='table' AND name='platform_premium_paid_events'").get() as {sql:string}|undefined)?.sql;
}
function qualifyRegisteredSchema(database: Database.Database, required: readonly string[]): string {
  const rows = readAppliedPlatformMigrations(database);
  validateAppliedPlatformMigrationPrefix(rows, platformMigrationManifest);
  if (rows.length !== platformMigrationManifest.length || !rows.length) return fail();
  const expected = [...expectedPlatformTableNamesForPrefix(rows.length)].sort();
  if (JSON.stringify(listPlatformUserTableNames(database)) !== JSON.stringify(expected)) return fail();
  const registered = new Set(platformMigrationManifest.flatMap(m => [...m.statements]));
  const rebuildId = "0216_platform_premium_current_access_events";
  const installed = rows.find(row => row.migration_id === rebuildId);
  const currentTable = PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS.find(statement => statement.startsWith('CREATE TABLE "platform_premium_paid_events" ('));
  const legacyTable = PLATFORM_PREMIUM_ROLE_SCHEMA_SQL.find(statement => statement.startsWith("CREATE TABLE platform_premium_paid_events ("));
  if (!installed && required.some(statement => statement === legacyTable || statement === currentTable)) return fail();
  if (installed) {
    const known = platformPremiumCurrentAccessEventsMigration;
    const declared = platformMigrationManifest.find(migration => migration.migrationId === rebuildId);
    const checksum = "a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539";
    const created = known.statements.find(statement => statement.startsWith("CREATE TABLE platform_premium_paid_events_next_v3 ("));
    const appended = rows[204], canonicalAppend = platformMigrationManifest[204];
    const reviewedBoundary = rows.length === 204 && rows.at(-1) === installed
      || rows.length === 205 && rows[203] === installed && appended?.migration_id === "0217_traderlink_community_stats_forward_checkpoints"
        && appended.module_namespace === "community" && appended.execution_order === 292
        && canonicalAppend?.migrationId === appended.migration_id && canonicalAppend.moduleNamespace === "community"
        && canonicalAppend.executionOrder === 292 && appended.checksum_sha256 === calculatePlatformMigrationChecksum(canonicalAppend)
      || isReviewed210PremiumEventsBoundary(rows, platformMigrationManifest)
      || isReviewed211NewsMembershipsPremiumEventsBoundary(rows, platformMigrationManifest);
    if (!reviewedBoundary || !declared || declared.moduleNamespace !== "platform"
      || declared.executionOrder !== 291 || installed.execution_order !== 291 || installed.module_namespace !== "platform"
      || installed.checksum_sha256 !== checksum || calculatePlatformMigrationChecksum(declared) !== checksum
      || calculatePlatformMigrationChecksum(known) !== checksum || !created || !registered.has(created)
      || !registered.has("ALTER TABLE platform_premium_paid_events_next_v3 RENAME TO platform_premium_paid_events")
      || currentTable !== created.replace("CREATE TABLE platform_premium_paid_events_next_v3 (", 'CREATE TABLE "platform_premium_paid_events" (')
      || currentPremiumEventsTableSql(database) !== currentTable || required.some(statement => statement === legacyTable)) return fail();
  }
  if (required.some(statement => !registered.has(statement) && !(installed && statement === currentTable))) return fail();
  return requirePlatformSchemaDigest(database, rows[rows.length - 1]!.post_schema_sha256);
}

export function currentPlatformErasureAdmission(database: Database.Database): PlatformErasureAdmission | null {
  return bindings.get(database) ?? null;
}
export function requirePlatformErasureWriter(database: Database.Database, userId?: string): PlatformErasureAdmission {
  const admission = bindings.get(database); if (!admission) return fail();
  admission.assertCurrent(userId); return admission;
}
export function hasPlatformErasureModules(database: Database.Database): boolean {
  // The legacy Swing Ideas analytics table predates the paid erasure modules.
  // Selection only. Presence NEVER qualifies a positive admission.
  return Boolean(database.prepare(`SELECT 1 FROM sqlite_schema WHERE type='table' AND
    (name GLOB 'partner_alert_*'
      OR name IN ('platform_erasure_profiles','platform_erasure_lifecycles','platform_erasure_lifecycle_events',
        'platform_erasure_module_operations','platform_erasure_operation_claims','platform_erasure_gift_authorizations')
      OR (name GLOB 'platform_premium_*' AND name!='platform_premium_swing_idea_visit_events')) LIMIT 1`).get());
}

/** Owns synchronous connection contexts. No private frame, DB or Auth scope is
 * returned to a browser. Every failure poisons the frame even if caught. */
export class PlatformErasureAdmission {
  private schemaCookie: number;
  private readonly ledgerSha256: string;
  private readonly qualification: PlatformErasureQualificationReceipt;
  private lastClock = Number.NEGATIVE_INFINITY;
  private constructor(private readonly database: Database.Database, readonly schemaSha256: string,
    private readonly nowUtc: () => string, private readonly maximumAdmissionMs: number,
    private readonly catalog: ReviewedCatalog, profileCatalogSha256: string) {
    this.schemaCookie = database.pragma("schema_version", { simple: true }) as number;
    this.ledgerSha256 = sha(readAppliedPlatformMigrations(database));
    this.qualification = Object.freeze({ receiptRef: randomUUID(), schemaSha256, profileCatalogSha256 });
  }
  static bind(database: Database.Database, input: Readonly<{ nowUtc: () => string; maximumAdmissionMs: number;
    participantStatements: readonly string[]; profileCatalogSha256: string }>): PlatformErasureAdmission {
    if (!database.open || database.readonly || database.inTransaction || bindings.has(database)
      || typeof input.nowUtc !== "function" || !Number.isSafeInteger(input.maximumAdmissionMs)
      || input.maximumAdmissionMs < 1 || input.maximumAdmissionMs > 300_000) return fail();
    verifyNativeArtifacts();
    const catalog = readReviewedCatalog(input.profileCatalogSha256, utc(input.nowUtc()));
    const schema = qualifyRegisteredSchema(database, [...platformErasureAdmissionSchemaStatements,
      ...platformPremiumAuthoritySchemaStatementsV2, ...platformPremiumSignerRedactionSchemaStatements,
      ...input.participantStatements]);
    if (catalog.schemaSha256 !== schema) return fail();
    const admission = new PlatformErasureAdmission(database, schema, input.nowUtc, input.maximumAdmissionMs,
      catalog, input.profileCatalogSha256);
    database.function("traderlink_erasure_source_delete_guard", { deterministic:false },
      (participant:unknown,sourceRef:unknown,userId:unknown,communityId:unknown):number=>{
        const context=contexts.get(database),permit=context?.identifyingSourceDelete;
        if(bindings.get(database)!==admission||!database.inTransaction||context?.kind!=="erasure"
          ||context.active!==true||context.failed||!context.operationRef||!permit||permit.admission!==admission
          ||permit.consumed||participant!==permit.participant||sourceRef!==permit.sourceRef
          ||userId!==permit.userId||communityId!==permit.communityId)return 0;
        permit.consumed=true;return 1;
      });
    bindings.set(database, admission); return admission;
  }
  private poisonCurrentErasureMutation(error:unknown):never {
    const context=contexts.get(this.database);if(context?.active&&context.kind==="erasure")context.failed=true;throw error;
  }
  private deleteVerifiedPartnerIdentifyingSource(input:Readonly<{operationRef:string;participant:"partner_audit"|"partner_command";sourceRef:string;userId:string;communityId:string}>):void {
    let context:Context|undefined;try{this.assertCurrent();context=contexts.get(this.database);
      if(!context||context.kind!=="erasure"||context.operationRef!==input.operationRef||context.identifyingSourceDelete||!context.userIds.has(input.userId))return fail();
      const permit={admission:this,...input,consumed:false};context.identifyingSourceDelete=permit;
      try{const changed=input.participant==="partner_audit"?this.database.prepare("DELETE FROM partner_alert_audit_events WHERE audit_event_id=? AND actor_user_id=? AND community_id=?").run(input.sourceRef,input.userId,input.communityId):this.database.prepare("DELETE FROM partner_alert_commands WHERE request_id=? AND actor_user_id=? AND community_id=?").run(input.sourceRef,input.userId,input.communityId);if(changed.changes!==1||!permit.consumed)return erasureHold();
        const remains=input.participant==="partner_audit"?this.database.prepare("SELECT 1 FROM partner_alert_audit_events WHERE audit_event_id=? LIMIT 1").get(input.sourceRef):this.database.prepare("SELECT 1 FROM partner_alert_commands WHERE actor_user_id=? AND request_id=? LIMIT 1").get(input.userId,input.sourceRef);if(remains)return erasureHold();
      }finally{context.identifyingSourceDelete=null;}this.assertCurrent();
    }catch(error){if(context)context.failed=true;throw error;}
  }
  purgePartnerIdentifyingSources(input:Readonly<{operationRef:string;userId:string;binding:PartnerIdentifyingBinding}>):number {
    let context:Context|undefined;try{this.assertCurrent();context=contexts.get(this.database);
      const operation=ref(input.operationRef),user=ref(input.userId),keyRef=ref(input.binding.keyRef);
      if(!context||context.kind!=="erasure"||context.operationRef!==operation||!context.userIds.has(user)||!(input.binding.key instanceof Uint8Array)||input.binding.key.byteLength<32||input.binding.key.byteLength>128)return fail();
      const op=this.database.prepare("SELECT lifecycle_ref,phase FROM platform_erasure_module_operations WHERE operation_ref=?").get(operation) as {lifecycle_ref:string;phase:string}|undefined;if(!op||!["prepared","settling","ready"].includes(op.phase))return erasureHold();
      const claims=this.database.prepare(`SELECT participant,claim_ref,original_json,original_sha256,state FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant IN ('partner_audit','partner_command') ORDER BY participant,claim_ref LIMIT 10001`).all(operation) as {participant:"partner_audit"|"partner_command";claim_ref:string;original_json:string;original_sha256:string;state:string}[];if(claims.length>10000)return erasureHold();let removed=0;
      for(const claim of claims){if(!["captured","settled"].includes(claim.state)||rawPartnerClaimSha256(claim.original_json)!==claim.original_sha256)return erasureHold();let source:Record<string,unknown>;try{source=JSON.parse(claim.original_json) as Record<string,unknown>;}catch{return erasureHold();}
        const audit=claim.participant==="partner_audit",sourceRef=audit?source.audit_event_id:source.request_id;if(typeof sourceRef!=="string"||source.actor_user_id!==user||typeof source.community_id!=="string")return erasureHold();
        const current=audit?this.database.prepare("SELECT * FROM partner_alert_audit_events WHERE audit_event_id=?").get(sourceRef):this.database.prepare("SELECT * FROM partner_alert_commands WHERE actor_user_id=? AND request_id=?").get(user,sourceRef);
        const retained=this.database.prepare(`SELECT * FROM partner_alert_retained_operation_evidence WHERE lifecycle_ref=? AND record_kind=? AND source_record_hmac_sha256=?`).get(op.lifecycle_ref,audit?"audit":"idempotency",partnerGuardDomainHmac(input.binding.key,"source",ref(sourceRef))) as Record<string,unknown>|undefined;if(!retained||retained.binding_key_ref!==keyRef)return erasureHold();
        const common={lifecycleRef:op.lifecycle_ref,communityId:String(source.community_id),archivedAtUtc:String(retained.archived_at_utc),binding:{keyRef,key:input.binding.key},createId:()=>String(retained.evidence_ref)};
        const projected=audit?projectPartnerAlertAuditEvidence({...common,row:{auditEventId:sourceRef,action:String(source.action),resourceId:String(source.resource_id),detailJson:String(source.detail_json),createdAtUtc:String(source.created_at_utc)}}):projectPartnerAlertIdempotencyEvidence({...common,row:{requestId:sourceRef,fingerprintJson:String(source.fingerprint_json),resultJson:String(source.result_json),createdAtUtc:String(source.created_at_utc)}});if(!samePartnerGuardNamedValues(retained,storedPartnerOperationProjection(projected as unknown as Record<string,unknown>)))return erasureHold();
        const successor=this.database.prepare(`SELECT * FROM partner_alert_erasure_claim_successors WHERE operation_ref=? AND participant=? AND claim_binding_hmac_sha256=? AND original_binding_hmac_sha256=?`).get(operation,claim.participant,partnerGuardDomainHmac(input.binding.key,"claim",claim.claim_ref),partnerGuardDomainHmac(input.binding.key,"original",claim.original_json)) as Record<string,unknown>|undefined;if(typeof successor?.verified_at_utc!=="string")return erasureHold();
        const expected={operation_ref:operation,participant:claim.participant,claim_binding_hmac_sha256:partnerGuardDomainHmac(input.binding.key,"claim",claim.claim_ref),original_binding_hmac_sha256:partnerGuardDomainHmac(input.binding.key,"original",claim.original_json),binding_key_ref:keyRef,successor_kind:"operational_evidence",successor_ref:retained.evidence_ref,verified_at_utc:successor.verified_at_utc,retain_until_utc:partnerAlertRecordRetainUntil("pseudonymized_audit_or_idempotency",successor.verified_at_utc)};if(!samePartnerGuardNamedValues(successor,expected))return erasureHold();
        if(current===undefined)continue;if(JSON.stringify(current)!==claim.original_json)return erasureHold();this.deleteVerifiedPartnerIdentifyingSource({operationRef:operation,participant:claim.participant,sourceRef,userId:user,communityId:String(source.community_id)});removed+=1;
      }return removed;
    }catch(error){return this.poisonCurrentErasureMutation(error);}
  }
  qualificationReceipt(): PlatformErasureQualificationReceipt {
    this.schemaCurrent(); return this.qualification;
  }
  assertQualificationReceipt(database: Database.Database, receipt: PlatformErasureQualificationReceipt): void {
    this.schemaCurrent();
    if (database !== this.database || bindings.get(database) !== this || receipt !== this.qualification
      || receipt.schemaSha256 !== this.schemaSha256) return fail();
  }
  now(): string {
    const value = utc(this.nowUtc()), epoch = Date.parse(value);
    if (epoch < this.lastClock) return fail(); this.lastClock = epoch; return value;
  }
  assertStorageCurrent(): void { this.schemaCurrent(); }
  /** Server maintenance only: key and clock come from qualified runtime, not
   * request data. This is not a positive restore receipt. */
  sweepExpiredClaimText(profileRef: string, cursor: Parameters<typeof sweepPlatformErasureTextPage>[3] = null) {
    if (this.database.inTransaction || contexts.has(this.database)) return fail();
    this.qualifyAdditionalStatements(PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS);
    const runtime = currentPartnerAlertErasureRuntime(this.database);
    if (!runtime) return erasureHold();
    return this.database.transaction(() => {
      const profile = this.profile(profileRef);
      if (profile.retention_policy_ref !== "paid_partner_retention_7d_v2") return erasureHold();
      return sweepPlatformErasureTextPage(this.database,
        {ref:runtime.binding.keyRef,bytes:runtime.binding.key},this.now(),cursor);
    }).immediate();
  }
  qualifyAdditionalStatements(statements: readonly string[]): void {
    if (this.database.inTransaction || qualifyRegisteredSchema(this.database, statements) !== this.schemaSha256) return fail();
  }
  requestPrincipal(): Readonly<{ userId: string; workspaceId: string }> {
    this.assertCurrent(); const context = contexts.get(this.database)!;
    if (context.kind !== "request" || !context.identity) return fail();
    return Object.freeze({ userId: context.identity.scope.userId, workspaceId: context.identity.scope.workspaceId });
  }
  admittedUserIds(): readonly string[] {
    this.assertCurrent(); return Object.freeze([...contexts.get(this.database)!.userIds]);
  }
  assertLivePrincipal(userId: string): void {
    this.assertCurrent(); const row = this.lifecycle(userId), profile = this.profile(row.profile_ref);
    if (row.phase !== "live" || row.profile_generation !== profile.generation || row.valid_until_utc <= this.now()
      || !this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId)) return fail();
  }
  principalIsLive(userId: string): boolean {
    this.assertCurrent();
    const row = this.database.prepare(`SELECT l.phase,l.profile_generation,l.valid_until_utc,p.generation,
      p.valid_until_utc profile_valid_until,u.status FROM platform_erasure_lifecycles l
      JOIN platform_erasure_profiles p USING(profile_ref) JOIN platform_users u ON u.user_id=l.user_id WHERE l.user_id=?`)
      .get(userId) as { phase: string; profile_generation: number; generation: number; valid_until_utc: string; profile_valid_until: string; status: string } | undefined;
    const at = this.now();
    return Boolean(row && row.phase === "live" && row.status === "active" && row.profile_generation === row.generation
      && row.valid_until_utc > at && row.profile_valid_until > at);
  }
  retainOwnerScope(scope: ReturnType<PlatformAdminRequestFrame["authorize"]>): void {
    this.assertCurrent(); const context = contexts.get(this.database)!;
    if (!context.frame || !context.identity || !context.request) return fail();
    context.frame.revalidate(scope, context.identity, context.request.headers); context.ownerScope = scope;
  }
  requirePlatformOwner(): void { this.owner(); }
  rootCommand(userId: string): string {
    this.assertCurrent(); const context = contexts.get(this.database)!;
    if (context.kind !== "erasure" || !context.operationRef || !context.userIds.has(userId)) return fail();
    return context.operationRef;
  }
  private schemaCurrent(): void {
    if (!this.database.open || this.database.readonly || bindings.get(this.database) !== this
      || sha(readAppliedPlatformMigrations(this.database)) !== this.ledgerSha256) return fail();
    const cookie = this.database.pragma("schema_version", { simple: true }) as number;
    if (cookie !== this.schemaCookie) {
      // Core restores its exact guards in the same transaction before invoking
      // post-delete settlement. A changed cookie requires the FULL digest again.
      requirePlatformSchemaDigest(this.database, this.schemaSha256); this.schemaCookie = cookie;
    }
  }
  profile(profileRef: string): Profile {
    this.schemaCurrent();
    const row = this.database.prepare("SELECT * FROM platform_erasure_profiles WHERE profile_ref=?").get(ref(profileRef)) as Profile | undefined;
    const reviewed = this.catalog.profiles.find(profile => profile.profileRef === profileRef);
    if (!reviewed || !row || row.schema_sha256 !== this.schemaSha256 || row.valid_until_utc <= this.now()
      || row.retention_policy_ref !== reviewed.retentionPolicyRef || row.backup_policy_ref !== reviewed.backupPolicyRef
      || row.valid_until_utc > reviewed.validUntilUtc
      || !row.retention_policy_ref || !row.backup_policy_ref || row.reference_policy !== "hold_signer_and_shared_owner") return fail();
    return row;
  }
  lifecycle(userId: string): Lifecycle {
    const row = this.database.prepare("SELECT * FROM platform_erasure_lifecycles WHERE user_id=?").get(userId) as Lifecycle | undefined;
    if (!row) return fail(); return row;
  }
  assertCurrent(userId?: string): void {
    try {
      this.schemaCurrent(); const context = contexts.get(this.database);
      if (!context?.active || context.failed || !this.database.inTransaction || context.deadline <= this.now()) return fail();
      context.verify();
      if (userId !== undefined) {
        if (!context.userIds.has(userId)) return fail();
        const row = this.lifecycle(userId), profile = this.profile(row.profile_ref);
        if (row.phase !== "live" || row.valid_until_utc <= this.now() || row.profile_generation !== profile.generation
          || !this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId)) return fail();
      }
    } catch (error) { const context = contexts.get(this.database); if (context) context.failed = true; throw error; }
  }
  isCurrentWriter(): boolean { try { this.assertCurrent(); return true; } catch { return false; } }
  private own<T>(context: Context, operation: () => T): T {
    if (contexts.has(this.database)) return fail();
    contexts.set(this.database, context);
    try {
      this.assertCurrent(); const result = operation();
      if (result !== null && (typeof result === "object" || typeof result === "function") && "then" in result) return fail();
      this.assertCurrent();
      if (context.ownerScope && context.frame && context.identity && context.request) {
        context.frame.revalidate(context.ownerScope, context.identity, context.request.headers);
      }
      return result;
    } finally { context.active = false; contexts.delete(this.database); }
  }
  /** Uses the real Auth frame, retaining its audit/rate ownership. Principal
   * hydration remains on the same selected connection inside this frame. */
  withRequestAuditFrame<T>(request: Request, environment: NodeJS.ProcessEnv,
    operation: (frame: PlatformAdminRequestFrame) => T): T {
    if (this.database.inTransaction || contexts.has(this.database)) return fail();
    this.schemaCurrent(); const started = this.now();
    const headers = JSON.stringify([...request.headers.entries()]);
    const context: Context = { kind: "request", active: true, failed: false, userIds: new Set(),
      deadline: new Date(Date.parse(started) + this.maximumAdmissionMs).toISOString(), frame: null,
      request, identity: null, identifyingSourceDelete:null, ownerScope: null, operationRef: null, verify: () => {
        if (request.signal.aborted || JSON.stringify([...request.headers.entries()]) !== headers || this.now() < started) return fail();
      } };
    return new PlatformAdminAuthorization(this.database, environment, () => new Date(this.now()))
      .withRequestAuditFrame(request, frame => { context.frame = frame; return this.own(context, () => operation(frame)); });
  }
  attachRequestPrincipal(identity: TraderLinkPlatformRequestIdentity, verify: () => unknown): void {
    this.assertCurrent(); const context = contexts.get(this.database)!;
    if (context.kind !== "request" || !context.request || context.identity || identity.mode !== "platform_session") return fail();
    const sessionCookieName = platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
    const cookies = (context.request.headers.get("cookie") ?? "").split(";").map(p => p.trim())
      .filter(p => p.startsWith(`${sessionCookieName}=`));
    if (cookies.length !== 1) return fail();
    const digest = hashPlatformSessionToken(decodeURIComponent(cookies[0]!.slice(sessionCookieName.length + 1)));
    const originalVerify = context.verify;
    const verifyPrincipal = () => {
      originalVerify(); verify();
      const session = new PlatformSessionRepository(this.database).findActiveByTokenDigest(digest, this.now());
      const member = this.database.prepare(`SELECT m.role FROM platform_workspace_memberships m
        JOIN platform_workspaces w ON w.workspace_id=m.workspace_id AND w.status='active'
        WHERE m.user_id=? AND m.workspace_id=? AND m.status='active'`).get(identity.scope.userId, identity.scope.workspaceId) as { role: string } | undefined;
      if (!session || session.sessionId !== identity.sessionId || session.userId !== identity.scope.userId
        || member?.role !== identity.scope.workspaceRole) return fail();
    };
    verifyPrincipal(); context.identity = identity; context.userIds = new Set([identity.scope.userId]);
    context.verify = verifyPrincipal;
  }
  private owner(): TraderLinkPlatformRequestIdentity {
    this.assertCurrent(); const context = contexts.get(this.database)!;
    if (context.kind !== "request" || !context.identity || !context.request || !context.frame) return fail();
    const lifecycle = this.database.prepare("SELECT phase FROM platform_erasure_lifecycles WHERE user_id=?").get(context.identity.scope.userId) as { phase: string } | undefined;
    if (lifecycle && lifecycle.phase !== "live") return erasureHold();
    // Community ownership is deliberately never a substitute for Platform Auth.
    if (context.ownerScope) context.frame.revalidate(context.ownerScope, context.identity, context.request.headers);
    else context.ownerScope = context.frame.authorize(context.identity, context.request.headers);
    return context.identity;
  }
  installProfile(input: PlatformProfileInstallInput): void {
    installPlatformProfile({ database:this.database,schemaSha256:this.schemaSha256,profiles:this.catalog.profiles,
      command:input,authorizeOwner:()=>{this.owner();},reference:ref,canonicalUtc:utc,
      nowUtc:()=>this.now(),reject:fail });
  }
  private event(row: Lifecycle, kind: string): void {
    this.database.prepare("INSERT INTO platform_erasure_lifecycle_events VALUES(?,?,?,?,?,?)")
      .run(randomUUID(), row.lifecycle_ref, row.generation, kind, row.operation_ref, this.now());
  }
  /** Explicit command, never a read fallback. Initial 1 is a persisted creation
   * event. Existing/expired subjects require explicit re-admission instead. */
  onboardMember(policyRef: string, profileRef: string): string {
    return this.database.transaction(() => {
    this.assertCurrent(); const context = contexts.get(this.database)!;
    if (context.kind !== "request" || !context.identity) return fail();
    const userId = context.identity.scope.userId, profile = this.profile(profileRef);
    if (this.database.prepare("SELECT 1 FROM platform_erasure_lifecycles WHERE user_id=?").get(userId)) return fail();
    const row: Lifecycle = { lifecycle_ref: randomUUID(), user_id: userId, generation: 1, admission_ref: randomUUID(), erasure_generation: 1, phase: "live",
      profile_ref: profile.profile_ref, profile_generation: profile.generation,
      valid_until_utc: profile.valid_until_utc, operation_ref: null };
    this.database.prepare("INSERT INTO platform_erasure_lifecycles VALUES(?,?,?,?,?,?,?,?,?,?)")
      .run(row.lifecycle_ref, row.user_id, row.generation, row.admission_ref, row.erasure_generation, row.phase, row.profile_ref,
        row.profile_generation, row.valid_until_utc, row.operation_ref);
    this.event(row, "onboarded");
    return this.memberRepository().initialize(userId, policyRef);
    })();
  }
  readmitMember(profileRef: string): void {
    this.database.transaction(() => {
    this.assertCurrent(); const context = contexts.get(this.database)!;
    if (context.kind !== "request" || !context.identity) return fail();
    const row = this.lifecycle(context.identity.scope.userId), profile = this.profile(profileRef);
    if (row.phase !== "live" || row.operation_ref) return erasureHold();
    row.generation += 1; row.admission_ref = randomUUID(); row.profile_ref = profile.profile_ref;
    row.profile_generation = profile.generation; row.valid_until_utc = profile.valid_until_utc;
    this.database.prepare(`UPDATE platform_erasure_lifecycles SET generation=?,admission_ref=?,profile_ref=?,profile_generation=?,valid_until_utc=? WHERE lifecycle_ref=?`)
      .run(row.generation, row.admission_ref, row.profile_ref, row.profile_generation, row.valid_until_utc, row.lifecycle_ref);
    this.event(row, "readmitted");
    })();
  }
  /** Automation may capture NEW work only for an explicitly admitted live set.
   * Effects must additionally recheck their stored original full ticket. */
  runForUsers<T>(userIds: readonly string[], operation: () => T): T {
    const current = contexts.get(this.database);
    if (current) { for (const userId of userIds) this.assertCurrent(userId); return operation(); }
    if (this.database.inTransaction || !userIds.length || userIds.length > 10_000 || new Set(userIds).size !== userIds.length) return fail();
    this.schemaCurrent();
    return this.database.transaction(() => {
      const deadline = new Date(Date.parse(this.now()) + this.maximumAdmissionMs).toISOString();
      return this.own({ kind: "automation", active: true, failed: false, userIds: new Set(userIds), deadline,
        verify: () => { for (const id of userIds) {
          const row = this.lifecycle(id), p = this.profile(row.profile_ref);
          if (row.phase !== "live" || row.profile_generation !== p.generation || row.valid_until_utc <= this.now()
            || !this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(id)) return fail();
        } }, frame: null, request: null, identity: null, identifyingSourceDelete:null, ownerScope: null, operationRef: null }, operation);
    }).immediate();
  }
  /** Exact native dependencies, no Member epoch writes or policy copies. */
  memberRepository(forUserId?: string): PlatformPremiumAuthorityRepository {
    const deps: PlatformPremiumAuthorityDependenciesV2 = {
      nowUtc: () => this.now(),
      whopSubjectReference: raw => createWhopPrivacyReference(raw, "user", (process.env.TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY ?? "").trim()),
      schemaIsQualified: (db, descriptor) => {
        try { this.assertCurrent(); return db === this.database && [platformPremiumAuthoritySchemaDescriptor.sha256,
          platformPremiumAuthoritySchemaDescriptorV2.sha256].includes(descriptor); } catch { return false; }
      },
      erasure: {
        readCurrent: (db, input) => {
          try {
            if (db !== this.database || (forUserId !== undefined && forUserId !== input.userId)) return { kind: "unbound" };
            this.assertCurrent(input.userId); const row = this.lifecycle(input.userId);
            const existing = db.prepare("SELECT user_id FROM platform_premium_authorities WHERE authority_key=?").get(input.authorityKey) as { user_id: string | null } | undefined;
            if (existing && existing.user_id !== input.userId) return { kind: "blocked" };
            return { kind: "admitted", generation: row.erasure_generation, admissionRef: row.admission_ref,
              validUntilUtc: [row.valid_until_utc, this.profile(row.profile_ref).valid_until_utc].sort()[0]! };
          } catch { return { kind: "blocked" }; }
        },
        captureBeforeRootDelete: (db, input) => this.captureBeforeRootDelete(db, input),
      },
      owner: {
        authorizePolicy: db => { if (db !== this.database) return false; this.owner(); return true; },
        authorizeGift: (db, input) => {
          if (db !== this.database || this.owner().scope.userId !== input.actorUserId) return false;
          const original = db.prepare(`SELECT authority_key,entitlement_id FROM platform_erasure_gift_authorizations WHERE authorization_ref=?`)
            .get(input.authorizationRef) as { authority_key: string; entitlement_id: string } | undefined;
          return original?.authority_key === input.authorityKey && original.entitlement_id === input.entitlementId;
        },
      },
      redactedComplimentary: new PlatformPremiumSignerRedaction({
        nowUtc: () => this.now(), qualification: { readCurrent: (db, input) => {
          if (db !== this.database || input.authoritySchemaSha256 !== platformPremiumAuthoritySchemaDescriptorV2.sha256
            || input.privacySchemaSha256 !== platformPremiumSignerRedactionSchemaDescriptor.sha256
            || input.protocol !== "ordinary_complimentary_signer_redaction_v1") return { kind: "unbound" };
          this.assertCurrent(); const context = contexts.get(db)!;
          const ids = forUserId === undefined ? [...context.userIds] : [forUserId];
          if (ids.some(id => !context.userIds.has(id))) return { kind: "unbound" };
          const profiles = ids.map(id => this.profile(this.lifecycle(id).profile_ref));
          if (profiles.length !== 1) return { kind: "unbound" };
          const profile = profiles[0]!;
          return { kind: "qualified_protocol", qualificationRef: profile.profile_ref,
            authoritySchemaSha256: input.authoritySchemaSha256, privacySchemaSha256: input.privacySchemaSha256,
            retentionPolicyRef: profile.retention_policy_ref,
            sourceArtifactSha256: "364aa7982a87f4cee623dbcc1d50b3c53a94825a1c964278de18c1481bdc9f76",
            canonicalWriter: "grantor_null_and_qualified_source_successor", validUntilUtc: profile.valid_until_utc };
        } },
        // Selected V6 protocol cannot erase the retained recipient provenance.
        // No issuer may manufacture an admission/fence/original-auth successor.
        admission: { prepare: () => ({ kind: "unbound" }), recheckPrepared: () => ({ kind: "unbound" }), readRecipient: () => ({ kind: "unbound" }) },
        fences: { captureAndQuiesce: () => ({ kind: "unbound" }), readCurrent: () => ({ kind: "unbound" }) },
        originalAuthorization: { prepare: () => ({ kind: "unbound" }), readCurrent: () => ({ kind: "unbound" }) },
      }),
    };
    return new PlatformPremiumAuthorityRepository(this.database, deps);
  }
  issueGiftAuthorization(authorityKey: string, entitlementId: string): string {
    this.owner();
    const subject = this.database.prepare("SELECT user_id FROM platform_premium_authorities WHERE authority_key=? AND phase='live'").get(authorityKey) as { user_id: string } | undefined;
    if (!subject) return fail();
    const owned = contexts.get(this.database)!; owned.userIds = new Set([...owned.userIds, subject.user_id]);
    this.assertCurrent(subject.user_id);
    const canonical = this.database.prepare(`SELECT entitlement_id,plan_version_id,status,starts_at_utc,ends_at_utc
      FROM platform_membership_entitlements WHERE entitlement_id=?`).get(entitlementId);
    if (!canonical || !this.database.prepare("SELECT 1 FROM platform_premium_authorities WHERE authority_key=? AND phase='live'").get(authorityKey)) return fail();
    const context = contexts.get(this.database)!, profile = this.profile(this.lifecycle(context.identity!.scope.userId).profile_ref);
    const authorizationRef = randomUUID();
    this.database.prepare("INSERT INTO platform_erasure_gift_authorizations VALUES(?,?,?,?,?,?,?)")
      .run(authorizationRef, authorityKey, entitlementId, JSON.stringify(canonical), profile.profile_ref, profile.generation, this.now());
    return authorizationRef;
  }
  private captureBeforeRootDelete(db: Database.Database,
    input: Parameters<PlatformPremiumAuthorityDependenciesV2["erasure"]["captureBeforeRootDelete"]>[1]):
    ReturnType<PlatformPremiumAuthorityDependenciesV2["erasure"]["captureBeforeRootDelete"]> {
    this.assertCurrent(); const context = contexts.get(this.database)!;
    if (db !== this.database || context.kind !== "erasure" || context.operationRef !== input.receiptRef
      || !context.userIds.has(input.userId) || input.referencePlan.blockingReasons.length
      || input.affectedGiftRecipients.length) return erasureHold();
    const op = this.operation(input.receiptRef), row = this.lifecycle(input.userId);
    if (op.phase !== "ready" || !op.quiescence_ref || input.authorities.some(a =>
      a.currentErasureGeneration !== op.original_generation || a.nextRevision !== a.currentRevision + 1)) return erasureHold();
    return { kind: "captured_and_quiescent", receiptRef: input.receiptRef, quiescenceRef: op.quiescence_ref,
      authorities: input.authorities.map(a => ({ authorityKey: a.authorityKey, nextErasureGeneration: row.erasure_generation })),
      affectedGiftRecipientAuthorityKeys: [] };
  }
  operation(operationRef: string): PlatformErasureModuleOperation {
    const row = this.database.prepare("SELECT * FROM platform_erasure_module_operations WHERE operation_ref=?").get(operationRef) as PlatformErasureModuleOperation | undefined;
    if (!row) return fail(); return row;
  }
  pendingFor(userId: string, workspaceId: string): string | null {
    this.schemaCurrent();
    const row = this.database.prepare(`SELECT o.operation_ref,o.workspace_id FROM platform_erasure_lifecycles l
      JOIN platform_erasure_module_operations o ON o.lifecycle_ref=l.lifecycle_ref WHERE l.user_id=? AND o.phase!='complete'`)
      .get(userId) as { operation_ref: string; workspace_id: string } | undefined;
    if (row && row.workspace_id !== workspaceId) return erasureHold(); return row?.operation_ref ?? null;
  }
  recordHold(operationRef: string, code: string): void {
    if (this.database.inTransaction || !/^[a-z_]{1,120}$/u.test(code)) return fail();
    this.database.transaction(() => {
      this.schemaCurrent(); const op = this.operation(operationRef);
      if (!["prepared", "settling", "ready"].includes(op.phase)) return erasureHold();
      this.database.prepare("UPDATE platform_erasure_module_operations SET phase='settling',hold_code=?,quiescence_ref=NULL WHERE operation_ref=?")
        .run(code, operationRef);
      this.database.prepare("UPDATE platform_erasure_lifecycles SET phase='settling',generation=generation+1 WHERE lifecycle_ref=?")
        .run(op.lifecycle_ref);
      const row = this.database.prepare("SELECT * FROM platform_erasure_lifecycles WHERE lifecycle_ref=?").get(op.lifecycle_ref) as Lifecycle;
      this.event(row, "settling");
    }).immediate();
  }
  /** Explicit deletion command onboarding. The worker selects the profile from
   * its current signed release input. No Membership/Premium authority is created. */
  admitRootErasureCommand(command: ErasureCommand, profileRef: string): void {
    if (this.database.inTransaction || contexts.has(this.database)) return fail();
    this.database.transaction(() => {
      this.schemaCurrent();
      revalidatePlatformRootErasureCommand(this.database, command);
      const profile = this.profile(profileRef);
      const existing = this.database.prepare("SELECT * FROM platform_erasure_lifecycles WHERE user_id=?")
        .get(command.scope.userId) as Lifecycle | undefined;
      if (existing) {
        // A different, expired or held lifecycle requires its own explicit
        // reviewed transition. This command never repairs or renews it.
        if (existing.profile_ref !== profile.profile_ref || existing.profile_generation !== profile.generation
          || existing.valid_until_utc <= this.now() || existing.phase !== "live" || existing.operation_ref) return erasureHold();
        return;
      }
      const row: Lifecycle = { lifecycle_ref: randomUUID(), user_id: command.scope.userId,
        generation: 1, admission_ref: randomUUID(), erasure_generation: 1, phase: "live",
        profile_ref: profile.profile_ref, profile_generation: profile.generation,
        valid_until_utc: profile.valid_until_utc, operation_ref: null };
      this.database.prepare("INSERT INTO platform_erasure_lifecycles VALUES(?,?,?,?,?,?,?,?,?,?)")
        .run(row.lifecycle_ref, row.user_id, row.generation, row.admission_ref, row.erasure_generation,
          row.phase, row.profile_ref, row.profile_generation, row.valid_until_utc, row.operation_ref);
      this.event(row, "onboarded");
    }).immediate();
  }
  prepare(command: ErasureCommand, operationRef: string): void {
    if (this.database.inTransaction || contexts.has(this.database)) return fail();
    this.database.transaction(() => {
      this.schemaCurrent(); revalidatePlatformRootErasureCommand(this.database,command);
      const { userId, workspaceId } = command.scope, row = this.lifecycle(userId), p = this.profile(row.profile_ref);
      if (row.phase !== "live" || row.operation_ref || row.profile_generation !== p.generation || row.valid_until_utc <= this.now()) return erasureHold();
      this.database.prepare(`INSERT INTO platform_erasure_module_operations VALUES(?,?,?,'prepared',?,?,?,?,?,?,NULL,NULL,NULL,NULL)`)
        .run(operationRef, row.lifecycle_ref, workspaceId, p.profile_ref, p.generation, row.admission_ref,
          row.erasure_generation, this.now(), [row.valid_until_utc,new Date(Date.parse(this.now())+this.maximumAdmissionMs).toISOString()].sort()[0]!);
      this.database.prepare(`UPDATE platform_erasure_lifecycles SET generation=generation+1,erasure_generation=erasure_generation+1,phase='preparing',operation_ref=? WHERE lifecycle_ref=?`)
        .run(operationRef, row.lifecycle_ref);
      this.event(this.lifecycle(userId), "prepared");
    }).immediate();
  }
  readmitErasureCommand(operationRef: string, command: ErasureCommand): void {
    if (this.database.inTransaction || contexts.has(this.database)) return fail();
    this.database.transaction(() => {
      this.schemaCurrent(); revalidatePlatformRootErasureCommand(this.database,command);
      const op = this.operation(operationRef), life = this.lifecycle(command.scope.userId), profile = this.profile(op.profile_ref);
      if (life.operation_ref !== operationRef || op.workspace_id !== command.scope.workspaceId
        || !["prepared","settling","ready"].includes(op.phase) || profile.generation !== op.profile_generation) return erasureHold();
      // Fresh COMMAND admission only. Original effects/claims/admission/epochs
      // and their deadlines are neither renewed nor replaced.
      const deadline = [profile.valid_until_utc,new Date(Date.parse(this.now())+this.maximumAdmissionMs).toISOString()].sort()[0]!;
      this.database.prepare("UPDATE platform_erasure_module_operations SET valid_until_utc=?,phase='settling',quiescence_ref=NULL WHERE operation_ref=?")
        .run(deadline,operationRef);
      this.database.prepare("UPDATE platform_erasure_lifecycles SET generation=generation+1,phase='settling' WHERE lifecycle_ref=?").run(life.lifecycle_ref);
      this.event(this.lifecycle(command.scope.userId),"settling");
    }).immediate();
  }
  runErasureCommand<T>(operationRef: string, command: ErasureCommand, operation: () => T): T {
    if (this.database.inTransaction || contexts.has(this.database)) return fail();
    return this.database.transaction(() => this.withErasureCommand(operationRef,command,operation)).immediate();
  }
  private withErasureCommand<T>(operationRef: string, command: ErasureCommand, operation: () => T): T {
    if (!this.database.inTransaction) return fail();
    revalidatePlatformRootErasureCommand(this.database,command); const userId = command.scope.userId;
    const op = this.operation(operationRef), row = this.lifecycle(userId), p = this.profile(op.profile_ref);
    if (row.operation_ref !== operationRef || row.lifecycle_ref !== op.lifecycle_ref || p.generation !== op.profile_generation
      || op.workspace_id !== command.scope.workspaceId || !["prepared", "settling", "ready"].includes(op.phase) || op.valid_until_utc <= this.now()) return erasureHold();
    return this.own({ kind: "erasure", active: true, failed: false, userIds: new Set([userId]),
      deadline: op.valid_until_utc, frame: null, request: null, identity: null, identifyingSourceDelete:null, ownerScope: null,
      operationRef, verify: () => revalidatePlatformRootErasureCommand(this.database,command) }, operation);
  }
  /** Recovery on a controller-owned in-memory image only. The external
   * committed tombstone replaces session authorization for exactly this root. */
  runQuarantinedRootReplay(
    ledger: PartnerAlertTombstoneLedger, pin: Readonly<{generation:number;sha256:string}>,
    userId: string, operationRef: string,
    store: ErasureObjectStore,
  ): void {
    if (!this.database.memory || this.database.inTransaction || contexts.has(this.database)
      || !(ledger instanceof PartnerAlertTombstoneLedger)) return fail();
    const runtime = currentPartnerAlertErasureRuntime(this.database);
    if (!runtime || runtime.tombstoneLedger !== ledger) return fail();
    const recovery = new PlatformErasureRecovery(this.database,store);
    this.database.transaction(() => {
      this.schemaCurrent();
      if (recovery.pending()) return erasureHold();
      if (this.database.prepare("SELECT 1 FROM platform_auth_sessions WHERE revoked_at_utc IS NULL LIMIT 1").get()) return fail();
      const workspace = this.database.prepare(`SELECT workspace_id FROM platform_workspace_memberships
        WHERE user_id=? AND role='owner' AND status='active' LIMIT 2`).all(userId) as {workspace_id:string}[];
      const workspaceId = workspace[0]?.workspace_id;
      if (!workspaceId || workspace.length !== 1) return erasureHold();
      const life = this.lifecycle(userId), profile = this.profile(life.profile_ref), now = this.now();
      if (life.profile_generation !== profile.generation || life.valid_until_utc <= now) return erasureHold();
      const deadline = [life.valid_until_utc,profile.valid_until_utc,
        new Date(Date.parse(now)+this.maximumAdmissionMs).toISOString()].sort()[0]!;
      if (life.phase === "live" && life.operation_ref === null) {
        this.database.prepare(`INSERT INTO platform_erasure_module_operations VALUES(?,?,?,'prepared',?,?,?,?,?,?,NULL,NULL,NULL,NULL)`)
          .run(operationRef,life.lifecycle_ref,workspaceId,profile.profile_ref,profile.generation,life.admission_ref,
            life.erasure_generation,now,deadline);
        this.database.prepare(`UPDATE platform_erasure_lifecycles SET generation=generation+1,
          erasure_generation=erasure_generation+1,phase='preparing',operation_ref=? WHERE lifecycle_ref=?`)
          .run(operationRef,life.lifecycle_ref);
        this.event(this.lifecycle(userId),"prepared");
      } else if (life.operation_ref !== operationRef || this.operation(operationRef).workspace_id !== workspaceId) return erasureHold();
      stageCommittedRestoreTombstone(this.database,ledger,pin,operationRef,userId,runtime.binding,now);
      const verify = () => {
        const current = PartnerAlertTombstoneLedger.prototype.read.call(ledger);
        if (current.generation !== pin.generation || current.sha256 !== pin.sha256 || current.unresolvedPrepared.length) return fail();
      };
      const scope = Object.freeze({userId,workspaceId,workspaceRole:"owner" as const,allowedAccountIds:[],activeAccountId:null});
      this.own({kind:"erasure",active:true,failed:false,userIds:new Set([userId]),deadline,frame:null,request:null,
        identity:null,identifyingSourceDelete:null,ownerScope:null,operationRef,verify}, () => {
        new PlatformErasureService(this.database).eraseTraderLinkAccount(scope, {
          recordPrivateArtifactObligations: artifacts => {
            recovery.record("traderlink_account",erasureTargetBinding([userId,workspaceId,"restore"]),artifacts,operationRef);
          },
        });
        if (this.operation(operationRef).phase !== "logical_deleted" || recovery.pending() !== operationRef) return erasureHold();
        verify();
      });
    }).immediate();
    recovery.finish(operationRef);
    const current = PartnerAlertTombstoneLedger.prototype.read.call(ledger);
    if (current.generation !== pin.generation || current.sha256 !== pin.sha256
      || this.operation(operationRef).phase !== "complete" || recovery.pending()
      || this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=?").get(userId)) return erasureHold();
  }
  /** Disposable server-only preflight. Native I/O runs between separate
   * calls; both callbacks run synchronously under the admitted writer. */
  runStripeRootPreflight<T>(
    operationRef: string, command: ErasureCommand,
    expected: Readonly<{fenceRef:string;generation:number}> | null,
    local: (fence: Readonly<{fenceRef:string;generation:number}>) => T,
  ): T {
    return this.runErasureCommand(operationRef,command,() => {
      const userId=command.scope.userId;
      if (this.rootCommand(userId)!==operationRef) return erasureHold();
      const before=this.operation(operationRef), life=this.lifecycle(userId);
      if (expected && (before.phase!=="ready" || life.phase!=="settling"
        || before.quiescence_ref!==expected.fenceRef || life.generation!==expected.generation)) return erasureHold();
      if (!expected) {
        const participants=platformErasureParticipants(this.database);
        if (!participants || participants.core!==this || !participants.partner.prepare(operationRef,userId).ready) return erasureHold();
        this.markReady(operationRef);
      }
      // Reentry settles the exact transport claim under the existing fence.
      // Re-running readiness here would reject that very in-flight claim.
      // The final root writer still checks every in-flight claim.
      const assertFence=()=>{
        const operation=this.operation(operationRef), current=this.lifecycle(userId);
        if (operation.phase!=="ready" || current.phase!=="settling" || !operation.quiescence_ref
          || current.operation_ref!==operationRef || current.lifecycle_ref!==operation.lifecycle_ref
          || operation.workspace_id!==command.scope.workspaceId
          || (expected && (operation.quiescence_ref!==expected.fenceRef || current.generation!==expected.generation))) return erasureHold();
        return {fenceRef:operation.quiescence_ref,generation:current.generation};
      };
      const fence=Object.freeze(assertFence()), result=local(fence), after=assertFence();
      if (after.fenceRef!==fence.fenceRef || after.generation!==fence.generation) return erasureHold();
      return result;
    });
  }
  markReady(operationRef: string): void {
    this.assertCurrent();
    if (contexts.get(this.database)!.operationRef !== operationRef) return fail();
    const unresolved = this.database.prepare("SELECT 1 FROM platform_erasure_operation_claims WHERE operation_ref=? AND state='in_flight' LIMIT 1").get(operationRef);
    if (unresolved) return erasureHold();
    const op = this.operation(operationRef);
    const lifecycle = this.database.prepare(`SELECT * FROM platform_erasure_lifecycles
      WHERE lifecycle_ref=? AND operation_ref=?`).get(op.lifecycle_ref,operationRef) as Lifecycle | undefined;
    if (!lifecycle?.user_id || !contexts.get(this.database)!.userIds.has(lifecycle.user_id)
      || !["preparing","settling"].includes(lifecycle.phase)
      || (op.phase==="ready" && lifecycle.phase!=="settling")) return erasureHold();
    if (lifecycle.phase==="preparing") {
      const transition = this.database.prepare(`UPDATE platform_erasure_lifecycles SET phase='settling',generation=generation+1
        WHERE lifecycle_ref=? AND operation_ref=? AND phase='preparing' AND generation=?`)
        .run(lifecycle.lifecycle_ref,operationRef,lifecycle.generation);
      if (transition.changes!==1) return erasureHold();
      this.event(this.lifecycle(lifecycle.user_id),"settling");
    }
    // Existing ready fence is stable for this admitted operation. Stripe
    // independently rechecks the exact affected work and authority at use.
    const result = this.database.prepare(`UPDATE platform_erasure_module_operations
      SET phase='ready',quiescence_ref=CASE WHEN phase='ready' THEN quiescence_ref ELSE ? END,hold_code=NULL
      WHERE operation_ref=? AND (phase IN ('prepared','settling') OR (phase='ready' AND quiescence_ref IS NOT NULL))`)
      .run(randomUUID(), operationRef);
    if (result.changes !== 1) return erasureHold();
  }
  markLogicalDeleted(operationRef: string): void {
    this.schemaCurrent(); const context = contexts.get(this.database);
    if (!this.database.inTransaction || !context?.active || context.failed || context.kind !== "erasure"
      || context.operationRef !== operationRef || context.deadline <= this.now()) return fail();
    const op = this.operation(operationRef);
    if (op.phase !== "ready" || this.database.prepare(`SELECT 1 FROM platform_users u JOIN platform_erasure_lifecycles l
      ON l.user_id=u.user_id WHERE l.lifecycle_ref=?`).get(op.lifecycle_ref)) return erasureHold();
    this.database.prepare(`UPDATE platform_erasure_lifecycles SET generation=generation+1,phase='logical_deleted',user_id=NULL WHERE lifecycle_ref=?`).run(op.lifecycle_ref);
    this.database.prepare("UPDATE platform_erasure_module_operations SET phase='logical_deleted',workspace_id=NULL,logical_deleted_at_utc=? WHERE operation_ref=?").run(this.now(), operationRef);
    const row = this.database.prepare("SELECT * FROM platform_erasure_lifecycles WHERE lifecycle_ref=?").get(op.lifecycle_ref) as Lifecycle;
    this.event(row, "logical_deleted");
    // Deletion is a one-way authorization transition. The deleted login cannot
    // be rehydrated for final validation; prove the exact committed-work state.
    context.verify = () => {
      const current = this.operation(operationRef);
      const lifecycle = this.database.prepare("SELECT user_id,phase FROM platform_erasure_lifecycles WHERE lifecycle_ref=?").get(op.lifecycle_ref) as { user_id: string | null; phase: string } | undefined;
      if (current.phase !== "logical_deleted" || lifecycle?.user_id !== null || lifecycle.phase !== "logical_deleted") return fail();
    };
  }
}

function canonical(value: unknown): string {
  const visit = (item: unknown, depth: number): unknown => {
    if (depth > 32) return erasureHold();
    if (item === null || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return item.map(v => visit(v,depth+1));
    if (item && typeof item === "object" && Object.getPrototypeOf(item) === Object.prototype) {
      return Object.fromEntries(Object.keys(item).sort().map(key => [key,visit((item as Record<string,unknown>)[key],depth+1)]));
    }
    return erasureHold();
  };
  return JSON.stringify(visit(value,0));
}

/** Concrete private binding to original durable Native role claims. It does not
 * implement current admission, issue a replacement ticket or finish a live job.
 * Missing binding/exception leaves the actual participant unsettled. */
export class PlatformPremiumErasureOutcomeRecorder {
  private constructor(private readonly database: Database.Database, private readonly core: PlatformErasureAdmission) {}
  static bind(database: Database.Database): PlatformPremiumErasureOutcomeRecorder {
    const core = currentPlatformErasureAdmission(database); if (!core || database.inTransaction) return fail();
    core.assertStorageCurrent(); return new PlatformPremiumErasureOutcomeRecorder(database,core);
  }
  record(claim: PlatformPremiumRoleClaim, result: PlatformPremiumRoleOutcome): boolean {
    if (this.database.inTransaction || currentPlatformErasureAdmission(this.database) !== this.core) return fail();
    this.core.assertStorageCurrent();
    const lease = claim.job.lease;
    if (!lease || lease.token !== claim.token) return erasureHold();
    return this.database.transaction(() => {
      const target = lease.intent.target;
      const row = this.database.prepare(`SELECT * FROM platform_premium_role_jobs
        WHERE guild_id=? AND discord_user_id=? AND role_id=? AND lease_token=? AND state IN ('applying','uncertain')`)
        .get(target.guildId,target.discordUserId,target.roleId,claim.token) as { job_json: string } | undefined;
      if (!row) return false;
      const stored = JSON.parse(row.job_json) as { lease: unknown };
      if (canonical(stored.lease) !== canonical(lease)) return erasureHold();
      const subjects = new Set<string>();
      const collect = (value: unknown, depth = 0): void => {
        if (depth > 32) return erasureHold();
        if (value && typeof value === "object") for (const [key,item] of Object.entries(value)) {
          if (key === "userId" && typeof item === "string") subjects.add(item);
          else collect(item,depth+1);
        }
      };
      collect(JSON.parse(row.job_json));
      const pending = [...subjects].flatMap(userId => {
        const life = this.database.prepare(`SELECT lifecycle_ref,operation_ref FROM platform_erasure_lifecycles
          WHERE user_id=? AND phase IN ('preparing','settling')`).get(userId) as { lifecycle_ref: string; operation_ref: string } | undefined;
        return life ? [life] : [];
      });
      if (!pending.length) return false;
      if (result.kind === "confirmed" && (!samePremiumRoleTarget(result.target,target) || result.present !== lease.present)) return erasureHold();
      if (result.kind === "retry" && (!Number.isSafeInteger(result.delayMs) || result.delayMs < 1000 || result.delayMs > 86_400_000)) return erasureHold();
      if (result.kind === "retry" && !["rate_limited","temporary"].includes(result.reason)) return erasureHold();
      if (result.kind === "rejected" && !["permission","rate_limit_unqualified"].includes(result.reason)) return erasureHold();
      if (result.kind === "not_written" && !["authority_changed","disabled","member_absent"].includes(result.reason)) return erasureHold();
      if (!["confirmed","retry","rejected","not_written","uncertain"].includes(result.kind)) return erasureHold();
      const original = JSON.stringify(row), originalSha = createHash("sha256").update(original).digest("hex");
      const claimRef = createHash("sha256").update(JSON.stringify([target.guildId,target.discordUserId,target.roleId])).digest("hex");
      const receipt = JSON.stringify({ claim, result, receivedAtUtc: this.core.now() });
      if (Buffer.byteLength(receipt) > 2 * 1024 * 1024) return erasureHold();
      for (const life of pending) {
        const op = this.core.operation(life.operation_ref);
        if (op.lifecycle_ref !== life.lifecycle_ref || !["prepared","settling","ready"].includes(op.phase)) return erasureHold();
        const previous = this.database.prepare(`SELECT original_json,original_sha256 FROM platform_erasure_operation_claims
          WHERE operation_ref=? AND participant='premium_role' AND claim_ref=?`).get(life.operation_ref,claimRef) as
          { original_json: string; original_sha256: string } | undefined;
        if (previous && (previous.original_json !== original || previous.original_sha256 !== originalSha)) return erasureHold();
        if (!previous) this.database.prepare("INSERT INTO platform_erasure_operation_claims VALUES(?,'premium_role',?,?,?,'in_flight',NULL)")
          .run(life.operation_ref,claimRef,original,originalSha);
        const outcomeRef = randomUUID();
        this.database.prepare("INSERT INTO platform_erasure_operation_claims VALUES(?,'premium_role_outcome',?,?,?,'captured',?)")
          .run(life.operation_ref,outcomeRef,receipt,createHash("sha256").update(receipt).digest("hex"),claim.token);
        if (result.kind !== "uncertain") this.database.prepare(`UPDATE platform_erasure_operation_claims SET state='settled',outcome_ref=?
          WHERE operation_ref=? AND participant='premium_role' AND claim_ref=? AND state='in_flight'`)
          .run(outcomeRef,life.operation_ref,claimRef);
      }
      return true;
    }).immediate();
  }
}
