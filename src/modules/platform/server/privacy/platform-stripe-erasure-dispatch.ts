import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { readAppliedPlatformMigrations } from "../database/platform-migration-registry";
import { erasureHold, requirePlatformErasureWriter } from "./platform-erasure-admission";
import { verifyPlatformStripeErasureRoleProof } from "./platform-stripe-erasure-proof-verifier";
import { erasePartnerAlertStripeUser } from "../../../partner-alerts/server/database/partner-alert-stripe-connect-lifecycle";
import { PartnerAlertErasureClaimSuccessors } from "../../../partner-alerts/server/partner-alert-erasure-claim-successors";

type Verification = Parameters<typeof verifyPlatformStripeErasureRoleProof>[1];
type Claim = Readonly<{claimRef:string;originalSha256:string}>;
type Claims = Readonly<{settlement: Claim | null;transport: Claim | null}>;
const digest = (value:unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Unbound source candidate. The server-owned per-connection proof context
 * must be admitted by the separate 0209 release catalog and trust bootstrap
 * before a caller can select this entry. Never use a route-provided context. */
export function dispatchQualifiedStripeRootErasure(database: Database.Database, input: Readonly<{
  verification: Omit<Verification,"readSettlement" | "nowUtc">;
  readCurrentEvidence: (facts: Parameters<Verification["readSettlement"]>[0], nowUtc:string) =>
    (Readonly<{settlement: NonNullable<ReturnType<Verification["readSettlement"]>>;claims:Claims}>) | null;
  successorBinding: ConstructorParameters<typeof PartnerAlertErasureClaimSuccessors>[1];
}>) {
  const core = requirePlatformErasureWriter(database);
  const {verification:v}=input, scope=v.expectedScope;
  if (!database.inTransaction || core.rootCommand(scope.userId)!==scope.operationRef) return erasureHold();
  const nowUtc=core.now();
  const qualification=core.qualificationReceipt();
  const operation=core.operation(scope.operationRef), lifecycle=core.lifecycle(scope.userId);
  if (scope.schemaSha256!==qualification.schemaSha256 || scope.catalogSha256!==qualification.profileCatalogSha256
    || scope.appliedLedgerSha256!==digest(readAppliedPlatformMigrations(database))
    || operation.phase!=="ready" || lifecycle.phase!=="settling" || operation.workspace_id!==scope.workspaceId
    || lifecycle.lifecycle_ref!==scope.lifecycleRef || operation.lifecycle_ref!==scope.lifecycleRef
    || lifecycle.operation_ref!==scope.operationRef || lifecycle.erasure_generation!==scope.erasureGeneration
    || !operation.quiescence_ref || (scope.mode==="root" && (scope.writerFenceRef!==operation.quiescence_ref
      || scope.writerFenceGeneration!==lifecycle.generation))) return erasureHold();

  const settlement=new Map<string,string>(), transport=new Map<string,string>();
  const record=(target:Map<string,string>, claim:Claim|null)=>{
    if (!claim) { if(scope.mode==="root") return erasureHold(); return; }
    if (target.has(claim.claimRef)) return erasureHold();
    target.set(claim.claimRef,claim.originalSha256);
  };
  const verified=verifyPlatformStripeErasureRoleProof(database,{...v,nowUtc,readSettlement:facts=>{
    const evidence=input.readCurrentEvidence(facts,nowUtc);
    if (!evidence) return null;
    record(settlement,evidence.claims.settlement);
    record(transport,evidence.claims.transport);
    return evidence.settlement;
  }});
  const successors=new PartnerAlertErasureClaimSuccessors(database,input.successorBinding);
  successors.retainVerifiedStripeSettlements(scope.operationRef,settlement,v.proof.receiptId,nowUtc);
  successors.retainVerifiedStripeSettlements(scope.operationRef,transport,v.proof.receiptId,nowUtc,"stripe_role_transport");
  erasePartnerAlertStripeUser(database,scope.userId,Date.parse(nowUtc),verified);
}
