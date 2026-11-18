import "server-only";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type { NextRequest } from "next/server";
import { resolvePlatformPublicOrigin } from "../authentication/platform-public-origin";
import { readAppliedPlatformMigrations } from "../database/platform-migration-registry";
import { assertCommunityStagingQaTarget, type CommunityStagingQaTargetPins } from "../../../communities/server/community-staging-qa-target";
import { currentPlatformErasureAdmission, type PlatformErasureAdmission } from "../privacy/platform-erasure-admission";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "../authentication/require-platform-request-scope";
import { platformAuthCookieName } from "../authentication/platform-auth-cookies";
import { hashPlatformSessionToken, TRADERLINK_PLATFORM_SESSION_COOKIE } from "../authentication/platform-session-service";
import { PlatformSessionRepository } from "../authentication/platform-session-repository";
import { readProtectedInitialOwnerDiscordSubject, resolveTraderLinkDiscordGuildId } from "../authentication/platform-discord-configuration";
import { evaluatePlatformPremium, evaluatePlatformPremiumForQualifiedRealm, PlatformPremiumError, premiumComplimentaryEvidence,
  premiumRef, premiumSnowflake, premiumTicket, premiumUtc, type PlatformPremiumDecision, type PlatformPremiumPaidEvidence,
  type PlatformPremiumPurchase, type PlatformPremiumSnapshot, type PlatformPremiumTicket } from "../../contracts/platform-premium-access";
import { preparePlatformPremiumCurrentPaidEvidenceInRealm } from "./platform-premium-current-paid-evidence";
import type { PlatformPremiumNativeCurrentAccessCollection } from "./platform-premium-whop-current-access";
import type { PlatformPremiumAuthoritySnapshotV2 } from "./platform-premium-authority-repository";

const guildId="1559172784813514803";
const hash=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const refused=():never=>{throw new PlatformPremiumError("unbound");};
export type PlatformPremiumRuntimeAuthority=Readonly<{kind:"platform_premium_staging_runtime_authority_v1";authorityKey:string;expiresAtUtc:string}>;
/** Server-owned delayed reader: the first refresh may create the genuine native
 * binding before an owner issues the token. Returning a copied token never works. */
export type PlatformPremiumRuntimeAuthorityBinding=Readonly<{database:Database.Database;current:()=>PlatformPremiumRuntimeAuthority|null}>;
type State={revoked:boolean;database:Database.Database;core:PlatformErasureAdmission;request:Request;pins:CommunityStagingQaTargetPins;
 actorUserId:string;actorWorkspaceId:string;actorSessionId:string;actorTokenDigest:string;actorBinding:string;headersBinding:string;
 issuedAtUtc:string;expiresAtUtc:string;lastAtUtc:string;targetUserId:string;authorityKey:string;targetBinding:string;paidRoleId:string};
const issued=new WeakMap<object,State>();
function selectedSubjects():string[]{
 const values=(process.env.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT??"").split(",").map(value=>value.trim());
 if(values.length!==2||values.some(value=>!value)||new Set(values).size!==2)return refused();return values.map(premiumSnowflake);
}
function targetBinding(read:PlatformPremiumAuthoritySnapshotV2):string{
 return hash({authorityKey:read.ticket.scope.authorityKey,userId:read.ticket.scope.userId,discordUserId:read.ticket.scope.discordUserId,
  identityGeneration:read.ticket.scope.identityGeneration,whopGeneration:read.ticket.whopGeneration,erasureGeneration:read.ticket.scope.erasureGeneration,
  policyGeneration:read.ticket.scope.policyGeneration,policy:read.policy,payer:read.payer});
}
/** Fingerprint every native input to the already-authorized normal owner policy,
 * plus session/workspace and protected owner configuration. This does not invent
 * or duplicate an owner decision. Any change denies; a new real frame is needed. */
function actorBinding(state:Pick<State,"database"|"actorUserId"|"actorWorkspaceId"|"actorSessionId">):string{
 const db=state.database,user=state.actorUserId;
 const identities=db.prepare("SELECT * FROM platform_auth_identities WHERE user_id=? ORDER BY auth_provider,auth_subject LIMIT 51").all(user);
 if(identities.length>50)return refused();
 return hash({user:db.prepare("SELECT * FROM platform_users WHERE user_id=?").get(user),identities,
  session:db.prepare("SELECT * FROM platform_auth_sessions WHERE session_id=? AND user_id=?").get(state.actorSessionId,user),
  workspace:db.prepare("SELECT * FROM platform_workspaces WHERE workspace_id=?").get(state.actorWorkspaceId),
  membership:db.prepare("SELECT * FROM platform_workspace_memberships WHERE workspace_id=? AND user_id=?").get(state.actorWorkspaceId,user),
  operator:db.prepare("SELECT * FROM platform_operator_grants WHERE authority_key='journal_administration' AND grant_state='active' ORDER BY operator_grant_id LIMIT 2").all(),
  discord:db.prepare("SELECT * FROM platform_discord_memberships WHERE user_id=? AND guild_id=?").get(user,guildId),
  protectedOwner:readProtectedInitialOwnerDiscordSubject(process.env)??null,
  environment:Object.keys(process.env).sort().map(key=>[key,process.env[key]])});
}
function readTarget(core:PlatformErasureAdmission,userId:string,ticket:PlatformPremiumTicket):PlatformPremiumAuthoritySnapshotV2{
 return core.runForUsers([userId],()=>{const repo=core.memberRepository(userId);if(!repo.isCurrentV2(ticket))return refused();
  const read=repo.captureV2(ticket.scope.authorityKey);if(read.kind!=="snapshot")return refused();return read;});
}
function policyChecks(read:PlatformPremiumAuthoritySnapshotV2,paidRoleId:string):void{
 if(read.ticket.scope.guildId!==guildId||!read.ticket.scope.discordUserId||!selectedSubjects().includes(read.ticket.scope.discordUserId)
  ||read.payer.kind!=="bound"||read.policy.state!=="active"||!read.policy.nativeQualification||read.policy.offerScopes.length!==1
  ||read.policy.offerScopes[0]?.environment!=="sandbox"||paidRoleId===guildId
  ||process.env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID!==paidRoleId)return refused();
}
/** No migration/profile/provider/role write. Caller must already have installed
 * genuine independently reviewed source/native policy and a verified payer link.
 * The request is a private controller input; no HTTP route exposes this issuer. */
export function issuePlatformPremiumStagingRuntimeAuthority(input:Readonly<{database:Database.Database;request:Request;
 pins:CommunityStagingQaTargetPins;originalTicket:PlatformPremiumTicket}>):PlatformPremiumRuntimeAuthority{
 const db=input.database,request=input.request,pins=Object.freeze({...input.pins}),ticket=premiumTicket(input.originalTicket),now=new Date().toISOString();
 assertCommunityStagingQaTarget(db,pins);
 if(db.inTransaction||request.method!=="POST"||request.signal.aborted||new URL(request.url).origin!==pins.origin
  ||request.headers.get("origin")!==pins.origin||request.headers.get("sec-fetch-site")==="cross-site"||resolveTraderLinkDiscordGuildId(process.env)!==guildId)return refused();
 const core=currentPlatformErasureAdmission(db);if(!core)return refused();
 const paidRoleId=premiumSnowflake(process.env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID??"");
 const target=readTarget(core,ticket.scope.userId,ticket);policyChecks(target,paidRoleId);
 const scope=target.policy.offerScopes[0]!;
 // Premium and channel products/roles are separate real commercial scopes.
 if(db.prepare("SELECT 1 FROM partner_alert_mappings WHERE destination_guild_id=? AND destination_role_id=? LIMIT 1").get(guildId,paidRoleId)
  ||db.prepare("SELECT 1 FROM partner_alert_offers WHERE whop_environment='sandbox' AND whop_account_id=? AND (whop_product_id=? OR whop_plan_id=?) LIMIT 1").get(scope.accountId,scope.productId,scope.planId))return refused();
 const identity=requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{environment:process.env,databasePath:db.name});
 if(identity.mode!=="platform_session"||!identity.sessionId)return refused();
 const cookieName=platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
 const cookies=(request.headers.get("cookie")??"").split(";").map(value=>value.trim()).filter(value=>value.startsWith(cookieName+"="));
 if(cookies.length!==1)return refused();
 let tokenDigest:string;try{tokenDigest=hashPlatformSessionToken(decodeURIComponent(cookies[0]!.slice(cookieName.length+1)));}catch{return refused();}
 let state:State|undefined;
 core.withRequestAuditFrame(request,process.env,frame=>{
  core.attachRequestPrincipal(identity,()=>requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{environment:process.env,databasePath:db.name}));
  const owner=frame.authorize(identity,request.headers);core.retainOwnerScope(owner);
  const selected=db.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").all(identity.scope.userId) as {auth_subject:string}[];
  const session=new PlatformSessionRepository(db).findActiveByTokenDigest(tokenDigest,now);
  if(owner.role!=="journal_owner_admin"||owner.mode!=="production_discord_owner"||!owner.permissions.includes("manage_users")
   ||!owner.discordOwnerVerifiedAtUtc||owner.discordOwnerVerifiedAtUtc>now||Date.parse(now)-Date.parse(owner.discordOwnerVerifiedAtUtc)>=300000||!session||session.sessionId!==identity.sessionId||selected.length!==1||!selectedSubjects().includes(selected[0]!.auth_subject))return refused();
  const expiresAtUtc=new Date(Math.min(Date.parse(now)+120000,Date.parse(ticket.validUntilUtc),Date.parse(session.expiresAtUtc),Date.parse(owner.discordOwnerVerifiedAtUtc)+300000)).toISOString();
  if(expiresAtUtc<=now)return refused();
  state={revoked:false,database:db,core,request,pins,actorUserId:identity.scope.userId,actorWorkspaceId:identity.scope.workspaceId,actorSessionId:identity.sessionId,
   actorTokenDigest:tokenDigest,actorBinding:"",headersBinding:JSON.stringify([...request.headers]),issuedAtUtc:now,expiresAtUtc,lastAtUtc:now,
   targetUserId:ticket.scope.userId,authorityKey:ticket.scope.authorityKey,targetBinding:targetBinding(target),paidRoleId};
  state.actorBinding=actorBinding(state);frame.revalidate(owner,identity,request.headers);
 });
 if(!state)return refused();
 if(actorBinding(state)!==state.actorBinding||targetBinding(readTarget(core,state.targetUserId,ticket))!==state.targetBinding)return refused();
 const result:PlatformPremiumRuntimeAuthority=Object.freeze({kind:"platform_premium_staging_runtime_authority_v1",authorityKey:state.authorityKey,expiresAtUtc:state.expiresAtUtc});
 issued.set(result,state);return result;
}
/** Actual HTTP buyer consumption only. This does not install a policy, authorize
 * an owner operation or act for another user. The separately authorized native
 * policy/decoder/payer/receipt must already exist. Negative and incomplete native
 * collections remain negative/unknown; issuance is never a paid=true predicate. */
export function issuePlatformPremiumSelfSubscriberRuntimeAuthority(input:Readonly<{database:Database.Database;request:Request;
 pins:CommunityStagingQaTargetPins;originalTicket:PlatformPremiumTicket}>):PlatformPremiumRuntimeAuthority{
 const db=input.database,request=input.request,pins=Object.freeze({...input.pins}),ticket=premiumTicket(input.originalTicket),now=new Date().toISOString();
 assertCommunityStagingQaTarget(db,pins);
 if(db.inTransaction||!["GET","POST"].includes(request.method)||request.signal.aborted
  ||resolvePlatformPublicOrigin(request as NextRequest)!==pins.origin
  ||(request.headers.has("origin")&&request.headers.get("origin")!==pins.origin)||request.headers.get("sec-fetch-site")==="cross-site"
  ||resolveTraderLinkDiscordGuildId(process.env)!==guildId)return refused();
 const core=currentPlatformErasureAdmission(db),ledger=readAppliedPlatformMigrations(db),last=ledger.at(-1);
 const reviewedLedger = ledger.length === 204 && last?.migration_id === "0216_platform_premium_current_access_events" && last.module_namespace === "platform"
    && last.execution_order === 291 && last.checksum_sha256 === "a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539"
   || ledger.length === 205 && ledger[203]?.migration_id === "0216_platform_premium_current_access_events" && ledger[203].module_namespace === "platform"
    && ledger[203].execution_order === 291 && ledger[203].checksum_sha256 === "a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539"
    && last?.migration_id === "0217_traderlink_community_stats_forward_checkpoints" && last.module_namespace === "community"
    && last.execution_order === 292 && last.checksum_sha256 === "d0d493935a53c473a73d164101c1bab6193487ca56a4b678ea26cff4d9f7dbec";
 if(!core||core.schemaSha256!==pins.schemaSha256||!reviewedLedger)return refused();
 const identity=requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{environment:process.env,databasePath:db.name});
 if(identity.mode!=="platform_session"||!identity.sessionId||identity.scope.userId!==ticket.scope.userId)return refused();
 const subjects=db.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").all(identity.scope.userId) as {auth_subject:string}[];
 if(subjects.length!==1||!selectedSubjects().includes(subjects[0]!.auth_subject)||subjects[0]!.auth_subject!==ticket.scope.discordUserId)return refused();
 const cookieName=platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
 const cookies=(request.headers.get("cookie")??"").split(";").map(value=>value.trim()).filter(value=>value.startsWith(cookieName+"="));
 if(cookies.length!==1)return refused();
 let digest:string;try{digest=hashPlatformSessionToken(decodeURIComponent(cookies[0]!.slice(cookieName.length+1)));}catch{return refused();}
 const session=new PlatformSessionRepository(db).findActiveByTokenDigest(digest,now);
 if(!session||session.sessionId!==identity.sessionId||session.userId!==identity.scope.userId)return refused();
 const paidRoleId=premiumSnowflake(process.env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID??"");
 const target=core.runForUsers([identity.scope.userId],()=>{
  core.assertLivePrincipal(identity.scope.userId);
  const repo=core.memberRepository(identity.scope.userId);if(!repo.isCurrentV2(ticket))return refused();
  const read=repo.captureV2(ticket.scope.authorityKey);if(read.kind!=="snapshot")return refused();return read;
 });
 policyChecks(target,paidRoleId);
 const scope=target.policy.offerScopes[0]!;
 if(db.prepare("SELECT 1 FROM partner_alert_mappings WHERE destination_guild_id=? AND destination_role_id=? LIMIT 1").get(guildId,paidRoleId)
  ||db.prepare("SELECT 1 FROM partner_alert_offers WHERE whop_environment='sandbox' AND whop_account_id=? AND (whop_product_id=? OR whop_plan_id=?) LIMIT 1").get(scope.accountId,scope.productId,scope.planId))return refused();
 const coverage=target.coverage[0];
 if(target.coverage.length!==1||coverage?.kind!=="native_coverage"||!("protocol" in coverage.collection)
  ||coverage.collection.protocol!=="platform_premium_current_paid_access_v1"||coverage.collection.observedAtUtc>now||coverage.collection.validUntilUtc<=now)return refused();
 premiumRef(coverage.observationRef);
 const expiresAtUtc=new Date(Math.min(Date.parse(now)+120000,Date.parse(ticket.validUntilUtc),Date.parse(session.expiresAtUtc),
  Date.parse(coverage.collection.validUntilUtc),Date.parse(coverage.collection.observedAtUtc)+target.policy.maximumEvidenceAgeMs)).toISOString();
 if(expiresAtUtc<=now)return refused();
 const state:State={revoked:false,database:db,core,request,pins,actorUserId:identity.scope.userId,actorWorkspaceId:identity.scope.workspaceId,
  actorSessionId:identity.sessionId,actorTokenDigest:digest,actorBinding:"",headersBinding:JSON.stringify([...request.headers]),issuedAtUtc:now,
  expiresAtUtc,lastAtUtc:now,targetUserId:identity.scope.userId,authorityKey:ticket.scope.authorityKey,targetBinding:targetBinding(target),paidRoleId};
 state.actorBinding=actorBinding(state);
 // A second genuine normal resolver and native read close changes during issuance.
 const current=requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{environment:process.env,databasePath:db.name});
 if(current.mode!=="platform_session"||current.sessionId!==identity.sessionId||current.scope.userId!==identity.scope.userId
  ||current.scope.workspaceId!==identity.scope.workspaceId||current.scope.workspaceRole!==identity.scope.workspaceRole
  ||actorBinding(state)!==state.actorBinding||targetBinding(readTarget(core,state.targetUserId,ticket))!==state.targetBinding
  ||request.signal.aborted)return refused();
 const result:PlatformPremiumRuntimeAuthority=Object.freeze({kind:"platform_premium_staging_runtime_authority_v1",authorityKey:state.authorityKey,expiresAtUtc});
 issued.set(result,state);return result;
}
function qualifiedRead(binding:PlatformPremiumRuntimeAuthorityBinding,ticket:PlatformPremiumTicket,paidRoleId:string,at:string):PlatformPremiumAuthoritySnapshotV2{
 const token=binding.current(),state=token&&issued.get(token);if(!state||state.database!==binding.database||currentPlatformErasureAdmission(state.database)!==state.core)return refused();
 if(state.revoked)return refused();
 try {
 at=premiumUtc(at);if(at<state.lastAtUtc||at<state.issuedAtUtc||at>=state.expiresAtUtc||new Date().toISOString()>=state.expiresAtUtc
  ||state.request.signal.aborted||JSON.stringify([...state.request.headers])!==state.headersBinding)return refused();
 assertCommunityStagingQaTarget(state.database,state.pins);
 if(actorBinding(state)!==state.actorBinding||paidRoleId!==state.paidRoleId||ticket.scope.authorityKey!==state.authorityKey||ticket.scope.userId!==state.targetUserId)return refused();
 const session=new PlatformSessionRepository(state.database).findActiveByTokenDigest(state.actorTokenDigest,at);
 if(!session||session.sessionId!==state.actorSessionId||session.userId!==state.actorUserId)return refused();
 const read=readTarget(state.core,state.targetUserId,premiumTicket(ticket));policyChecks(read,paidRoleId);
 if(targetBinding(read)!==state.targetBinding)return refused();state.lastAtUtc=at;return read;
 }catch{state.revoked=true;return refused();}
}
export function assertPlatformPremiumRuntimeAuthority(binding:PlatformPremiumRuntimeAuthorityBinding,
 ticket:PlatformPremiumTicket,paidRoleId:string,nowUtc:string):void{qualifiedRead(binding,ticket,paidRoleId,nowUtc);}
export function preparePlatformPremiumCurrentPaidEvidenceWithRuntimeAuthority(input:PlatformPremiumNativeCurrentAccessCollection,
 expected:PlatformPremiumPurchase,nowUtc:string,maximumEvidenceAgeMs:number,binding:PlatformPremiumRuntimeAuthorityBinding,
 ticket:PlatformPremiumTicket,paidRoleId:string):PlatformPremiumPaidEvidence{
 const read=qualifiedRead(binding,ticket,paidRoleId,nowUtc),item=read.coverage.find(value=>value.offer.scopeRef===input.purchase.offer.scopeRef);
 if(!item||item.kind!=="native_coverage"||!("protocol" in item.collection)||hash(item.collection)!==hash(input))return refused();
 return preparePlatformPremiumCurrentPaidEvidenceInRealm(input,expected,nowUtc,maximumEvidenceAgeMs,"sandbox");
}
export function evaluatePlatformPremiumWithRuntimeAuthority(snapshot:PlatformPremiumSnapshot,nowUtc:string,
 binding:PlatformPremiumRuntimeAuthorityBinding|null=null):PlatformPremiumDecision{
 if(!binding)return evaluatePlatformPremium(snapshot,nowUtc);
 try{
  const read=qualifiedRead(binding,snapshot.ticket,snapshot.paidRoleId,nowUtc);
  const coverage:PlatformPremiumSnapshot["coverage"]=read.coverage.map(item=>{
   if(item.kind!=="native_coverage"||!("protocol" in item.collection)||read.payer.kind!=="bound")return{kind:"unknown",offer:item.offer,basis:"current_provider_access",reason:"native_current_unqualified"};
   const expected={environment:item.offer.environment,accountId:item.offer.accountId,productId:item.offer.productId,planId:item.offer.planId,whopUserId:read.payer.whopUserId};
   return{kind:"evidence",offer:item.offer,nativeObservationRef:premiumRef(item.observationRef),evidence:preparePlatformPremiumCurrentPaidEvidenceInRealm(item.collection,expected,nowUtc,read.policy.maximumEvidenceAgeMs,"sandbox")};
  });
  const gift=read.complimentary;
  const complimentary=premiumComplimentaryEvidence(gift.kind==="active"?{...gift,observedAtUtc:snapshot.ticket.observedAtUtc,validUntilUtc:snapshot.ticket.validUntilUtc}:gift,snapshot.ticket);
  return evaluatePlatformPremiumForQualifiedRealm({...snapshot,payer:read.payer,coverage,complimentary},nowUtc,"sandbox");
 }catch{return Object.freeze({ordinaryAccess:"unknown",partnerPaidEligible:false,paidRole:"hold",complimentaryRole:"unchanged",reason:"evidence_unknown",validUntilUtc:null,paidThroughUtc:null});}
}
