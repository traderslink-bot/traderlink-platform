import "server-only";
import type Database from "better-sqlite3";
import type {NextRequest} from "next/server";
import {assertCommunityStagingQaTarget,type CommunityStagingQaTargetPins} from "../../../communities/server/community-staging-qa-target";
import {PlatformErasureAdmission,currentPlatformErasureAdmission} from "../privacy/platform-erasure-admission";
import {readAppliedPlatformMigrations} from "../database/platform-migration-registry";
import {PlatformSessionRepository} from "../authentication/platform-session-repository";
import {hashPlatformSessionToken,TRADERLINK_PLATFORM_SESSION_COOKIE} from "../authentication/platform-session-service";
import {platformAuthCookieName} from "../authentication/platform-auth-cookies";
import {createWhopPrivacyReference} from "./whop-ai-review-identity";
import {loadWhopOAuthRequestConfiguration,requireWhopOAuthRequestIdentity} from "./whop-ai-review-staging-identity";
export type WhopStagingNativeLinkResult=Readonly<{kind:"bound"|"duplicate"|"held"}>;
/** Called ONLY by the normal callback with its actual provider-userinfo result,
 * after canonical link persistence. No raw subject is read from request/env or
 * retained outside the native identity row. No paid evidence is manufactured. */
export function bindWhopAiReviewStagingNativeLink(input:Readonly<{database:Database.Database;request:NextRequest;
 linkedUserId:string;justVerifiedSubject:string}>):WhopStagingNativeLinkResult{
 const held=():WhopStagingNativeLinkResult=>Object.freeze({kind:"held"});
 try{
  const db=input.database,request=input.request;
  if(!db.open||db.readonly||db.inTransaction||request.signal.aborted||request.method!=="GET")return held();
  const identity=requireWhopOAuthRequestIdentity(request);
  if(identity.mode!=="platform_session"||!identity.sessionId||identity.scope.userId!==input.linkedUserId)return held();
  const configuration=loadWhopOAuthRequestConfiguration(request,identity.scope.userId);
  if(configuration.realm!=="sandbox")return held();
  const env=process.env;
  const pins:CommunityStagingQaTargetPins={origin:new URL(configuration.redirectUri).origin,
   sourceCommit:env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_COMMIT??"",sourceVectorSha256:env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_VECTOR_SHA256??"",
   schemaSha256:env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SCHEMA_SHA256??"",buildId:env.TRADERLINK_PLATFORM_ISOLATED_STAGING_BUILD_ID??"",
   artifactSha256:env.TRADERLINK_PLATFORM_ISOLATED_STAGING_ARTIFACT_SHA256??""};
  assertCommunityStagingQaTarget(db,pins);
  const ledger=readAppliedPlatformMigrations(db),last=ledger.at(-1);
  const reviewedLedger = ledger.length === 204 && last?.migration_id === "0216_platform_premium_current_access_events" && last.module_namespace === "platform"
    && last.execution_order === 291 && last.checksum_sha256 === "a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539"
   || ledger.length === 205 && ledger[203]?.migration_id === "0216_platform_premium_current_access_events" && ledger[203].module_namespace === "platform"
    && ledger[203].execution_order === 291 && ledger[203].checksum_sha256 === "a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539"
    && last?.migration_id === "0217_traderlink_community_stats_forward_checkpoints" && last.module_namespace === "community"
    && last.execution_order === 292 && last.checksum_sha256 === "d0d493935a53c473a73d164101c1bab6193487ca56a4b678ea26cff4d9f7dbec";
  if(!reviewedLedger)return held();
  const catalog=env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256??"";
  if(!/^[a-f0-9]{64}$/.test(catalog))return held();
  const core=currentPlatformErasureAdmission(db)??PlatformErasureAdmission.bind(db,{nowUtc:()=>new Date().toISOString(),maximumAdmissionMs:30000,participantStatements:[],profileCatalogSha256:catalog});
  if(core.schemaSha256!==pins.schemaSha256||core.qualificationReceipt().profileCatalogSha256!==catalog)return held();
  const originalHeaders=JSON.stringify([...request.headers]);
  const cookieName=platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
  const cookies=(request.headers.get("cookie")??"").split(";").map(value=>value.trim()).filter(value=>value.startsWith(cookieName+"="));
  if(cookies.length!==1)return held();
  const tokenDigest=hashPlatformSessionToken(decodeURIComponent(cookies[0]!.slice(cookieName.length+1)));
  const subjects=db.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").all(identity.scope.userId) as {auth_subject:string}[];
  if(subjects.length!==1)return held();
  const verifiedDiscordSubject=subjects[0]!.auth_subject;
  const verifyOriginalPrincipal=()=>{
   const session=new PlatformSessionRepository(db).findActiveByTokenDigest(tokenDigest,new Date().toISOString());
   const membership=db.prepare("SELECT m.role FROM platform_workspace_memberships m JOIN platform_workspaces w USING(workspace_id) JOIN platform_users u ON u.user_id=m.user_id WHERE m.user_id=? AND m.workspace_id=? AND m.status='active' AND w.status='active' AND u.status='active'").get(identity.scope.userId,identity.scope.workspaceId) as {role:string}|undefined;
   const currentSubjects=db.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").all(identity.scope.userId) as {auth_subject:string}[];
   if(!session||session.sessionId!==identity.sessionId||session.userId!==identity.scope.userId||membership?.role!==identity.scope.workspaceRole
    ||currentSubjects.length!==1||currentSubjects[0]!.auth_subject!==verifiedDiscordSubject
    ||request.signal.aborted||JSON.stringify([...request.headers])!==originalHeaders)throw Error("Staging native identity changed");
  };
  return core.runForUsers([identity.scope.userId],()=>{
   core.assertLivePrincipal(identity.scope.userId);
   verifyOriginalPrincipal();
   const links=db.prepare("SELECT whop_user_ref_hmac FROM platform_whop_user_links WHERE user_id=? AND link_state='active'").all(identity.scope.userId) as {whop_user_ref_hmac:string}[];
   if(links.length!==1||links[0]!.whop_user_ref_hmac!==createWhopPrivacyReference(input.justVerifiedSubject,"user",configuration.identityHmacKey))throw Error("Canonical Whop identity mismatch");
   const authorities=db.prepare("SELECT authority_key FROM platform_premium_authorities WHERE user_id=? AND phase='live'").all(identity.scope.userId) as {authority_key:string}[];
   if(authorities.length!==1)throw Error("Native Member authority unavailable");
   const repo=core.memberRepository(identity.scope.userId),read=repo.captureV2(authorities[0]!.authority_key);
   if(read.kind!=="snapshot"||read.ticket.scope.userId!==identity.scope.userId||read.policy.state!=="active"||read.policy.guildId!=="1559172784813514803"
    ||read.policy.offerScopes.length!==1||read.policy.offerScopes[0]?.environment!=="sandbox"||!read.policy.nativeQualification)throw Error("Qualified native policy unavailable");
   // This is a NEW identity-binding intent. Its own full original V2 becomes
   // stale after INSERT; no previously staged work is recaptured or upgraded.
   const result=repo.recordVerifiedWhopSubjectBindingV2(read.ticket,read.policy.offerScopes[0].scopeRef,input.justVerifiedSubject);
   verifyOriginalPrincipal();
   core.assertLivePrincipal(identity.scope.userId);
   return Object.freeze({kind:result.kind});
  });
 }catch{return held();}
}
