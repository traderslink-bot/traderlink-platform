import { configurePlatformDatabaseConnection } from "@/src/modules/platform/server/database/open-platform-database";
import { issuePlatformPremiumStagingRuntimeAuthority, evaluatePlatformPremiumWithRuntimeAuthority,
  assertPlatformPremiumRuntimeAuthority, type PlatformPremiumRuntimeAuthorityBinding } from "@/src/modules/platform/server/membership/platform-premium-runtime-authority";
import { PlatformOperatorRepository } from "@/src/modules/platform/server/administration/platform-operator-repository";
import { platformAuthCookieName } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-session-service";
import { PlatformPremiumRoleReconciliation } from "@/src/modules/platform/server/membership/platform-premium-role-reconciliation";
/** Synthetic native integration only. Actual Core admission, SQLite statements,
 * ticket/epoch checks and role store execute. No actual release/provider review
 * is asserted by this test catalog or decoder, and no HTTP request is allowed. */
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformErasureAdmission, currentPlatformErasureAdmission } from "@/src/modules/platform/server/privacy/platform-erasure-admission";
import { platformErasureCatalogReviewDigest } from "@/src/modules/platform/server/privacy/platform-reviewed-erasure-catalog";
import { platformPremiumAuthoritySchemaDescriptorV2 } from "@/src/modules/platform/server/membership/platform-premium-authority-repository";
import { platformPremiumSignerRedactionSchemaDescriptor } from "@/src/modules/platform/server/privacy/platform-premium-signer-redaction";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS } from "@/src/modules/platform/server/membership/platform-premium-role-current-access-schema";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL } from "@/src/modules/platform/server/membership/platform-premium-role-schema";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { WhopAiReviewEntitlementRepository } from "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { createWhopPrivacyReference } from "@/src/modules/platform/server/billing/whop-ai-review-identity";
import { PlatformPremiumWhopCurrentAccessPreparation } from "@/src/modules/platform/server/membership/platform-premium-whop-current-access";
import { PlatformPremiumCurrentAuthority } from "@/src/modules/platform/server/membership/platform-premium-current-authority";
import { evaluatePlatformPremium } from "@/src/modules/platform/contracts/platform-premium-access";
import { createPlatformPremiumCurrentAccessEvent } from "@/src/modules/platform/server/membership/platform-premium-current-access-event";
import { PlatformPremiumRoleRepository, type PlatformPremiumRoleIntent } from "@/src/modules/platform/server/membership/platform-premium-role-repository";
import { SqlitePlatformPremiumRoleStore } from "@/src/modules/platform/server/membership/platform-premium-role-store";
const hash=(bytes:string|Buffer)=>createHash("sha256").update(bytes).digest("hex");
const guildId="1559172784813514803",paidRoleId="12347";
let networkRequests=0;
globalThis.fetch=async()=>{networkRequests+=1;throw Error("Network forbidden in synthetic integration");};
async function run(){
 const capabilityUnit=process.argv.includes("--runtime-authority-unit");
 let db=new Database(capabilityUnit?join(process.cwd(),"synthetic-native.sqlite"): ":memory:");
 if(capabilityUnit)configurePlatformDatabaseConnection(db,"initializer");else db.pragma("foreign_keys=ON");
 runPlatformMigrations(db,{manifest:platformMigrationManifest.slice(0,203)});
 const old203=db.serialize();
 const migrated=runPlatformMigrations(db);
 const baseAt=capabilityUnit?new Date().toISOString():"2026-11-17T20:00:00.000Z",profileUntil=new Date(Date.parse(baseAt)+3600000).toISOString();
 let clock=baseAt;
 if(capabilityUnit)Object.assign(process.env,{NODE_ENV:"production",DISCORD_GUILD_ID:guildId,TRADERLINK_PLATFORM_INITIAL_OWNER_DISCORD_SUBJECT:"12345",
  TRADERLINK_PLATFORM_STORAGE_BACKEND:"sqlite_single_node",TRADERLINK_PLATFORM_DB_PATH:db.name,TRADERLINK_PLATFORM_PUBLIC_ORIGIN:"https://synthetic.example.com",
  TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET:randomBytes(32).toString("hex"),TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID:paidRoleId,
  TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT:"12345,99999"});
 const source=join(process.cwd(),"src/modules/platform/server");
 const catalog:Record<string,unknown>={version:"core_partner_erasure_profiles_v1",referencePolicy:"hold_signer_and_shared_owner",
  payloadDisposition:"policy_bound_text_expiry_hold_minimal_unresolved",reviewStatus:"INDEPENDENTLY_REVIEWED",
  technicalRefsAndExpiryStatus:"independently_reviewed",qualificationValidUntilUtc:profileUntil,schemaSha256:migrated.finalSchemaSha256,
  authoritySchemaSha256:platformPremiumAuthoritySchemaDescriptorV2.sha256,privacySchemaSha256:platformPremiumSignerRedactionSchemaDescriptor.sha256,
  nativeSourceArtifactSha256:hash(readFileSync(join(source,"privacy/platform-premium-signer-redaction.ts"))),
  schemaEvidence:{reviewStatus:"INDEPENDENTLY_REVIEWED",observedSchemaSha256:migrated.finalSchemaSha256,artifactSha256:hash("synthetic_test_only")},
  retentionPolicy:{ref:"synthetic_retention",deliveredOrSettledMessageTextDays:7,rejectedModerationTextDays:7,textClock:"first_local_receipt_no_restart",
   unresolvedExternalOperationPayloads:"minimal_identifiers_status_only_after_text_expiry",credentialRemoval:"immediate_on_disconnect_or_erasure",
   pseudonymizedAuditAndIdempotencyYears:2,agreementPaymentRefundDisputeYears:7},
  backupPolicy:{ref:"synthetic_restore",rotationPeriod:"not_prescribed",localAlertTextDays:7,erasureTombstonesReappliedAfterRestore:true,restoredCredentialsRemainDisabled:true},
  profiles:[{profileRef:"synthetic_profile",retentionPolicyRef:"synthetic_retention",backupPolicyRef:"synthetic_restore",validUntilUtc:profileUntil}]};
 catalog.independentReview={status:"accepted",reviewerRef:"SYNTHETIC_TEST_ONLY",receiptRef:"SYNTHETIC_TEST_ONLY",reviewedAtUtc:baseAt,
  catalogContentSha256:platformErasureCatalogReviewDigest(catalog)};
 const catalogBytes=JSON.stringify(catalog);mkdirSync("docs/migration",{recursive:true});writeFileSync("docs/migration/partner-alert-erasure-profile-qualification.json",catalogBytes,{flag:"wx",mode:0o600});
 db.prepare("INSERT INTO platform_erasure_profiles VALUES('synthetic_profile',1,?,'synthetic_retention','synthetic_restore','hold_signer_and_shared_owner',?)").run(migrated.finalSchemaSha256,profileUntil);
 const actor=new PlatformDiscordSignInService(db,{now:()=>new Date(clock)}).signIn({authSubject:"12345",username:"synthetic",globalDisplayName:"Synthetic",avatarHash:null,
  guildId,roleIds:[],guildOwner:capabilityUnit,joinedAtUtc:null},{deferDemoActivation:true});
 db.prepare("INSERT INTO platform_erasure_lifecycles VALUES(?,?,1,?,1,'live','synthetic_profile',1,?,NULL)").run(randomUUID(),actor.userId,randomUUID(),profileUntil);
 const realm: "live" | "sandbox"=capabilityUnit?"sandbox":"live";
 const q={reviewRef:"synthetic_native",schemaSha256:hash("synthetic_native"),apiVersion:"native_fixture",accountId:"merchant",environment:realm};
 const offer={scopeRef:"offer",environment:realm,accountId:"merchant",productId:"product",planId:"plan"};
 db.prepare("INSERT INTO platform_premium_authority_policies VALUES('policy','config',?,'active',1,?,'[]',30000,?)").run(guildId,JSON.stringify([offer]),JSON.stringify(q));
 process.env.TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY=randomBytes(32).toString("hex");
 new WhopAiReviewEntitlementRepository(db).linkUser(actor.userId,createWhopPrivacyReference("buyer","user",process.env.TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY),new Date(clock));
 const bind=(database:Database.Database,statements=PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS)=>PlatformErasureAdmission.bind(database,{nowUtc:()=>clock,maximumAdmissionMs:60000,participantStatements:statements,profileCatalogSha256:hash(catalogBytes)});
 // Correct actual204 must require the current descriptor, never relabel an old runtime.
 let qualifierNegatives=0;
 const refuse=(image:Buffer,statements:readonly string[],mutate?:(clone:Database.Database)=>void)=>{
  const filename=join(process.cwd(),"negative-"+qualifierNegatives+".sqlite");
  if(capabilityUnit)writeFileSync(filename,image,{mode:0o600});
  const clone=new Database(capabilityUnit?filename:image);if(capabilityUnit)configurePlatformDatabaseConnection(clone,"initializer");else clone.pragma("foreign_keys=ON");try{
   mutate?.(clone);const before=hash(clone.serialize());assert.throws(()=>bind(clone,statements));
   assert.equal(hash(clone.serialize()),before);assert.equal(currentPlatformErasureAdmission(clone),null);qualifierNegatives+=1;
  }finally{clone.close();}
 };
 refuse(old203,PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS);
 refuse(old203,PLATFORM_PREMIUM_ROLE_SCHEMA_SQL);
 refuse(db.serialize(),PLATFORM_PREMIUM_ROLE_SCHEMA_SQL);
 refuse(db.serialize(),PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS.map(sql=>sql.startsWith('CREATE TABLE "platform_premium_paid_events"')?sql.replace("current_provider_access","forged_access"):sql));
 refuse(db.serialize(),PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS,clone=>clone.prepare("DELETE FROM platform_schema_migrations WHERE migration_id='0216_platform_premium_current_access_events'").run());
 refuse(db.serialize(),PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS,clone=>clone.prepare("UPDATE platform_schema_migrations SET checksum_sha256=? WHERE migration_id='0216_platform_premium_current_access_events'").run("f".repeat(64)));
 refuse(db.serialize(),PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS,clone=>{const invalidOrder=clone.prepare("SELECT max(execution_order)+1 AS value FROM platform_schema_migrations").get() as {value:number};
  assert(Number.isSafeInteger(invalidOrder.value));const changed=clone.prepare("UPDATE platform_schema_migrations SET execution_order=? WHERE migration_id='0216_platform_premium_current_access_events'").run(invalidOrder.value);
  assert.equal(changed.changes,1);});
 refuse(db.serialize(),PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS,clone=>clone.prepare("UPDATE platform_schema_migrations SET module_namespace='journal' WHERE migration_id='0216_platform_premium_current_access_events'").run());
 refuse(db.serialize(),PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS,clone=>clone.exec("ALTER TABLE platform_premium_paid_events ADD COLUMN unexpected_native_column TEXT"));
 let core=bind(db);
 let repo=core.memberRepository(actor.userId);
 const key=core.runForUsers([actor.userId],()=>repo.initialize(actor.userId,"policy"));
 let store=new SqlitePlatformPremiumRoleStore(db,{enabled:true,guildId,paidRoleId});
 const capture=()=>core.runForUsers([actor.userId],()=>{const value=repo.captureV2(key);assert.equal(value.kind,"snapshot");if(value.kind!=="snapshot")throw Error("Missing native fixture snapshot");return value;});
 if(capabilityUnit)core.runForUsers([actor.userId],()=>db.prepare("UPDATE platform_premium_authority_policies SET maximum_evidence_age_ms=120000 WHERE policy_ref='policy'").run());
 const initial=capture();
 core.runForUsers([actor.userId],()=>store.transaction(tx=>tx.appendEligibility({ticket:initial.ticket,scope:initial.ticket.scope,authorityKey:key,
  authorityRevision:initial.ticket.authorityRevision,observedAtUtc:clock,paidEligible:false,paidThroughUtc:null,validUntilUtc:null})));
 const purchase=core.runForUsers([actor.userId],()=>repo.nativePurchaseV2(initial.ticket,"offer","buyer"));assert.equal(purchase.kind,"purchase");if(purchase.kind!=="purchase")throw Error("Missing genuine native payer binding");
 const nativeUntil=new Date(Date.parse(baseAt)+(capabilityUnit?120000:30000)).toISOString();

 const proof=new PlatformPremiumWhopCurrentAccessPreparation({qualification:q,decodeHydrated:input=>({protocol:"platform_premium_current_paid_access_v1",
  purchase:input.purchase,discovery:"complete",observedAtUtc:clock,validUntilUtc:nativeUntil,members:[{membershipRef:"membership",nativeStatus:"past_due",accessKind:"paid_membership",
   productAccess:"customer",attribution:"exact_membership",paidBasis:{paymentRef:"payment",settlement:"settled",amountMinor:"100",currency:"USD",refund:"none",dispute:"none"}}]})})
  .prepare({purchase:purchase.purchase,hydrated:{synthetic:true},observedAtUtc:clock,validUntilUtc:nativeUntil,maximumEvidenceAgeMs:capabilityUnit?120000:30000,expectedQualification:q});
 assert.equal(proof.kind,"prepared_native_current_paid_access");if(proof.kind!=="prepared_native_current_paid_access")throw Error("Missing synthetic native receipt");
 core.runForUsers([actor.userId],()=>repo.recordWhopCurrentAccess(initial.ticket,"native_observation",proof));
 if(capabilityUnit){
  // ONLY the namespace target guard is replaced by the parent unit build. Core,
  // normal owner/session/audit frame, native data and every token check are real.
  new PlatformOperatorRepository(db).insert({operatorGrantId:randomUUID(),userId:actor.userId,grantedByKind:"bootstrap_console",grantedByUserId:null,
   grantReceiptSha256:hash("synthetic_operator_fixture"),recoveryOfGrantId:null,grantedAtUtc:clock});
  const abort=new AbortController();
  const request=new Request("https://synthetic.example.com/__private/premium-runtime",{method:"POST",signal:abort.signal,
   headers:{origin:"https://synthetic.example.com","sec-fetch-site":"same-origin",cookie:platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)+"="+actor.session.token}});
  const pins={origin:"https://synthetic.example.com",sourceCommit:"c".repeat(40),sourceVectorSha256:"d".repeat(64),schemaSha256:migrated.finalSchemaSha256,
   buildId:"synthetic_only",artifactSha256:"e".repeat(64)};
  let token:ReturnType<typeof issuePlatformPremiumStagingRuntimeAuthority>|null=null;
  const binding:PlatformPremiumRuntimeAuthorityBinding={database:db,current:()=>token};
  const refreshToken=()=>{clock=new Date().toISOString();const fresh=capture();token=issuePlatformPremiumStagingRuntimeAuthority({database:db,request,pins,originalTicket:fresh.ticket});clock=new Date().toISOString();return fresh.ticket;};
  let original=refreshToken();
  const writer={run:<T>(operation:()=>T)=>core.runForUsers([actor.userId],operation),isCurrentWriter:()=>core.isCurrentWriter()};
  const currentAuthority=new PlatformPremiumCurrentAuthority({enabled:true,guildId,paidRoleId,complimentaryRoleId:null,nowUtc:()=>clock},repo,writer,store,
   {read:()=>({kind:"reviewed",reviewRef:"synthetic_review",actorUserId:actor.userId,reviewedAtUtc:baseAt,paidRoleDisposition:"paid_only"})},binding);
  const loaded=await currentAuthority.loadCurrent(key);assert.equal(loaded.kind,"snapshot");if(loaded.kind!=="snapshot")throw Error("Missing sandbox fixture snapshot");
  assert.equal(evaluatePlatformPremium(loaded.snapshot,clock).partnerPaidEligible,false);
  assert.equal(evaluatePlatformPremiumWithRuntimeAuthority(loaded.snapshot,clock,binding).partnerPaidEligible,true);
  const copied={...token!};assert.throws(()=>assertPlatformPremiumRuntimeAuthority({database:db,current:()=>copied},original,paidRoleId,clock));
  const otherDb=new Database(":memory:");assert.throws(()=>assertPlatformPremiumRuntimeAuthority({database:otherDb,current:()=>token},original,paidRoleId,clock));otherDb.close();
  let negativeCases=2;
  const deny=(operation:(ticket:typeof original)=>void)=>{original=refreshToken();operation(original);negativeCases+=1;};
  deny(ticket=>assert.throws(()=>assertPlatformPremiumRuntimeAuthority(binding,{...ticket,scope:{...ticket.scope,userId:randomUUID()}},paidRoleId,clock)));
  deny(ticket=>assert.throws(()=>assertPlatformPremiumRuntimeAuthority(binding,ticket,"12348",clock)));
  deny(ticket=>assert.throws(()=>assertPlatformPremiumRuntimeAuthority(binding,{...ticket,factsSha256:"f".repeat(64)},paidRoleId,clock)));
  deny(ticket=>assert.throws(()=>assertPlatformPremiumRuntimeAuthority(binding,ticket,paidRoleId,token!.expiresAtUtc)));
  const changeThenRollback=(sql:string)=>deny(ticket=>{
   try{core.runForUsers([actor.userId],()=>{db.exec(sql);assert.equal(evaluatePlatformPremiumWithRuntimeAuthority(loaded.snapshot,clock,binding).partnerPaidEligible,false);throw Error("Synthetic rollback");});}catch{/* Core poisons a failed context; its transaction rolls back all fixture changes. */}
   assert.throws(()=>assertPlatformPremiumRuntimeAuthority(binding,ticket,paidRoleId,clock));
  });
  changeThenRollback("UPDATE platform_auth_sessions SET revoked_at_utc='"+baseAt+"' WHERE user_id='"+actor.userId+"'");
  changeThenRollback("UPDATE platform_premium_authority_policies SET native_qualification_json=json_set(native_qualification_json,'$.reviewRef','changed') WHERE policy_ref='policy'");
  changeThenRollback("UPDATE platform_premium_native_bindings SET whop_user_id='changed' WHERE authority_key='"+key+"'");
  changeThenRollback("UPDATE platform_erasure_profiles SET generation=generation+1 WHERE profile_ref='synthetic_profile'");
  changeThenRollback("UPDATE platform_premium_authority_policies SET offer_scopes_json=json_set(offer_scopes_json,'$[0].accountId','changed') WHERE policy_ref='policy'");
  original=refreshToken();request.headers.set("x-changed","yes");assert.throws(()=>assertPlatformPremiumRuntimeAuthority(binding,original,paidRoleId,clock));request.headers.delete("x-changed");negativeCases+=1;
  original=refreshToken();abort.abort();assert.throws(()=>assertPlatformPremiumRuntimeAuthority(binding,original,paidRoleId,clock));negativeCases+=1;
  assert.equal(networkRequests,0);db.close();
  return{syntheticOnly:true,targetGuardMocked:true,actualStageQualified:false,actualCoreAdmission:true,actualNormalOwnerFrame:true,sandboxPositiveOnlyWithOpaqueToken:true,
   delayedReader:true,negativeCases,qualifierNegatives,networkRequests};
 }
 const writer={run:<T>(operation:()=>T)=>core.runForUsers([actor.userId],operation),isCurrentWriter:()=>core.isCurrentWriter()};
 const authority=()=>new PlatformPremiumCurrentAuthority({enabled:true,guildId,paidRoleId,complimentaryRoleId:null,nowUtc:()=>clock},repo,writer,store,
  {read:()=>({kind:"reviewed",reviewRef:"synthetic_review",actorUserId:actor.userId,reviewedAtUtc:baseAt,paidRoleDisposition:"paid_only"})});
 const load=async()=>{const result=await authority().loadCurrent(key);assert.equal(result.kind,"snapshot");if(result.kind!=="snapshot")throw Error("Missing actual current snapshot");return result.snapshot;};
 const roleRepo=()=>new PlatformPremiumRoleRepository(store,ticket=>repo.isCurrentV2(ticket));
 const stage=async()=>{const snapshot=await load(),decision=evaluatePlatformPremium(snapshot,clock),event=createPlatformPremiumCurrentAccessEvent(snapshot,decision,clock);assert(event);
  const intent:PlatformPremiumRoleIntent={ticket:snapshot.ticket,scope:snapshot.scope,authorityRevision:snapshot.authorityRevision,managedAssignmentRef:null,
   target:{authorityKey:key,guildId,discordUserId:snapshot.scope.discordUserId!,roleId:paidRoleId},desired:decision.paidRole,validUntilUtc:decision.paidRole==="hold"?null:decision.validUntilUtc,
   atUtc:clock,reason:decision.reason,basis:"current_provider_access",realm:event.realm,nativeObservationRefs:event.nativeObservationRefs};
  assert.equal(core.runForUsers([actor.userId],()=>roleRepo().stage([intent],event)),true);return{snapshot,decision,event,intent};};
 const positive=await stage();assert.equal(positive.event.paidEligible,true);assert.equal(positive.event.paidThroughUtc,null);
 const nativeRow=()=>db.prepare("SELECT paid_eligible,event_json FROM platform_premium_paid_events WHERE json_extract(event_json,'$.basis')='current_provider_access' ORDER BY observed_at_utc DESC LIMIT 1").get() as {paid_eligible:number|null;event_json:string};
 assert.equal(nativeRow().paid_eligible,1);
 const history=core.runForUsers([actor.userId],()=>store.readAuthorityHistory(positive.snapshot.scope));assert.equal(history.previousPaidThroughUtc,null);
 let applied=0,refreshes=0;
 const projector={allowsRealm:(realm:"live"|"sandbox")=>realm==="live",isCurrentOriginalTicket:(ticket:typeof positive.snapshot.ticket)=>repo.isCurrentV2(ticket),refreshRequired:()=>{refreshes+=1;}};
 core.runForUsers([actor.userId],()=>store.projectPaidEvents(clock,10,()=>{throw Error("Missing realm binding must hold");}));
 core.runForUsers([actor.userId],()=>store.projectPaidEvents(clock,10,input=>{assert.equal(input.event.basis,"current_provider_access");assert.equal(input.expired,false);applied+=1;return"applied";},projector));
 assert.equal(applied,1); // Historical period-false was retired without a removal callback.
 let workerCalls=0;
 const worker=new PlatformPremiumRoleReconciliation(authority(),roleRepo(),{setRole:async(target,present,_operationRef,stillCurrent)=>{
  assert.equal(db.inTransaction,false);assert.equal(stillCurrent(),true);assert.equal(present,true);workerCalls+=1;
  return{kind:"confirmed",target,present};
 }},{enabled:true,guildId,paidRoleId,complimentaryRoleId:null,nowUtc:()=>clock,createOperationRef:()=>randomUUID(),attention:()=>{}});
 assert.equal(await worker.runOnce(),true);assert.equal(workerCalls,1); // Native admitted selection and custody; synthetic transport only.
 const image=db.serialize();db.close();db=new Database(image);db.pragma("foreign_keys=ON");core=bind(db);repo=core.memberRepository(actor.userId);store=new SqlitePlatformPremiumRoleStore(db,{enabled:true,guildId,paidRoleId});
 core.runForUsers([actor.userId],()=>store.transaction(tx=>assert.deepEqual(tx.findTarget(positive.intent.target)?.intent.ticket,positive.snapshot.ticket)));
 clock=nativeUntil;
 core.runForUsers([actor.userId],()=>store.projectPaidEvents(clock,10,()=>{throw Error("Observation expiry is never unpaid");},projector));assert.equal(refreshes,1);
 const unknown=await stage();assert.equal(unknown.event.state,"unknown");assert.equal(unknown.event.paidEligible,null);assert.equal(unknown.intent.desired,"hold");
 assert.equal(nativeRow().paid_eligible,null);assert.equal(JSON.parse(nativeRow().event_json).paidEligible,null);
 core.runForUsers([actor.userId],()=>store.projectPaidEvents(clock,10,()=>{throw Error("Unknown cannot be a removal callback");},projector));
 const recheck=unknown.event.validUntilUtc;
 clock=recheck;assert.equal(core.runForUsers([actor.userId],()=>roleRepo().nextDueAuthority(clock)),key);
 assert.equal(core.runForUsers([actor.userId],()=>roleRepo().claim(clock,"claim",key)),null);
 const count=(db.prepare("SELECT count(*) n FROM platform_premium_paid_events").get() as {n:number}).n;
 assert.equal(core.runForUsers([actor.userId],()=>roleRepo().stage([positive.intent],positive.event)),false);
 assert.equal((db.prepare("SELECT count(*) n FROM platform_premium_paid_events").get() as {n:number}).n,count);
 assert.deepEqual(db.pragma("foreign_key_check"),[]);db.close();assert.equal(networkRequests,0);
 return{syntheticOnly:true,actualCoreAdmission:true,actualSQLiteStore:true,migrations:204,schemaSha256:migrated.finalSchemaSha256,
  qualifierNegatives,originalTicketPreservedAcrossReopen:true,unknownRoundTripsAsNull:true,staleOriginalRefused:true,expiryRefreshNotRemoval:true,
  legacyFalseDoesNotOverrideCurrent:true,periodHistoryNotInvented:true,actualAdmittedWorkerWithSyntheticTransport:true,networkRequests};
}
run().then(result=>process.stdout.write("CORE_CURRENT_ACCESS_RECEIPT "+JSON.stringify(result)+"\n")).catch(error=>{process.stderr.write(String(error.stack??error));process.exitCode=1;});
