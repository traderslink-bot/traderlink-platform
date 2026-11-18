import "server-only";
import type Database from "better-sqlite3";
import { requireCommunityOwnerReviewIdentity } from "../../communities/server/community-owner-review-request-identity";
import { isCommunityReviewDiscordGuild } from "../../communities/server/community-review-discord-guild";
import { verifyCommunityRequestMember } from "../../communities/server/community-request-verification";
import { deriveAuthenticatedUserJournalScope } from "../../platform/server/authentication/authenticated-user-journal-scope";
import { platformAuthCookieName } from "../../platform/server/authentication/platform-auth-cookies";
import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { PlatformSessionRepository } from "../../platform/server/authentication/platform-session-repository";
import { hashPlatformSessionToken, TRADERLINK_PLATFORM_SESSION_COOKIE } from "../../platform/server/authentication/platform-session-service";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { deriveJournalAccountSelectionRef } from "../../platform/contracts/journal-account-selection";
import { requirePlatformErasureWriter, type PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";

type OwnerTarget = Readonly<{ kind:"id"|"slug"; value:string }>;
type Community = Readonly<{ community_id:string;slug:string;discord_guild_id:string;owner_user_id:string;status:string;updated_at_utc:string }>;

/** Select only existing owner setup entry points. A URL selects a lookup, never
 * an owner capability. Catalog, subscriber, admin and webhook paths are excluded. */
export function partnerAlertOwnerEvidenceTarget(request: Request): OwnerTarget | null {
  if (!["GET","POST"].includes(request.method)) return null;
  const path = new URL(request.url).pathname;
  const api = /^\/api\/partner-channels\/communities\/([0-9a-f-]{36})(?:\/(?:source-channels|stripe-onboarding))?\/?$/u.exec(path);
  if (api) return Object.freeze({kind:"id",value:api[1]!});
  const page = /^\/communities\/([a-z][a-z0-9-]{2,79})\/partner-channels\/?$/u.exec(path);
  return page && request.method === "GET" ? Object.freeze({kind:"slug",value:page[1]!}) : null;
}

/** Refresh native observations only. The existing Paid writer must still perform
 * its complete authorization after this helper; no authorization receipt leaves. */
export async function refreshPartnerAlertOwnerEvidence(input: Readonly<{
  database:Database.Database;admission:PlatformErasureAdmission;request:Request;
  environment:NodeJS.ProcessEnv;target:OwnerTarget;botToken:string;
  configurationIsCurrent:()=>boolean;transport?:typeof fetch;
}>):Promise<"verified"|"not_owner"|"unavailable"> {
  const db=input.database,request=input.request,started=Date.now();
  const unavailable=():never=>{throw Error("Community ownership verification is unavailable");};
  try {
    if(!db.open||db.readonly||db.inTransaction||request.signal.aborted)return "unavailable";
    if(request.method === "POST")requirePlatformMutationRequest(request);
    const identity=()=>requireCommunityOwnerReviewIdentity(requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,
      {environment:input.environment,databasePath:db.name}));
    const original=identity();
    if(original.mode!=="platform_session"||!original.sessionId)return "unavailable";
    const query="SELECT community_id,slug,discord_guild_id,owner_user_id,status,updated_at_utc FROM traderlink_communities WHERE "+(input.target.kind==="id"?"community_id":"slug")+"=?";
    const community=db.prepare(query).get(input.target.value) as Community|undefined;
    if(!community||community.owner_user_id!==original.scope.userId)return "not_owner";
    if(!isCommunityReviewDiscordGuild(community.discord_guild_id)||["removed","suspended"].includes(community.status))return "unavailable";
    const lifecycle=()=>db.prepare("SELECT bot_state,bot_missing_since_utc,removed_at_utc FROM traderlink_community_lifecycle WHERE community_id=?").get(community.community_id) as {bot_state:string;bot_missing_since_utc:string|null;removed_at_utc:string|null}|undefined;
    const communityLifecycle=lifecycle();
    if(communityLifecycle?.removed_at_utc||communityLifecycle?.bot_state==="not_installed")return "unavailable";
    const headers=JSON.stringify([...request.headers]),reviewSelector=input.environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT;
    const cookieName=platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE);
    const cookies=(request.headers.get("cookie")??"").split(";").map(value=>value.trim()).filter(value=>value.startsWith(cookieName+"="));
    if(cookies.length!==1)return "unavailable";
    const digest=hashPlatformSessionToken(decodeURIComponent(cookies[0]!.slice(cookieName.length+1)));
    const originalSession=new PlatformSessionRepository(db).findActiveByTokenDigest(digest,new Date().toISOString());
    if(!originalSession||originalSession.sessionId!==original.sessionId||originalSession.userId!==original.scope.userId)return "unavailable";
    const subjects=()=>db.prepare("SELECT auth_subject,created_at_utc,updated_at_utc FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active' ORDER BY auth_subject").all(original.scope.userId) as {auth_subject:string;created_at_utc:string;updated_at_utc:string}[];
    const originalSubjects=subjects();
    if(originalSubjects.length!==1||!reviewSelector?.split(",").map(value=>value.trim()).includes(originalSubjects[0]!.auth_subject))return "unavailable";
    const selection=original.scope.activeAccountId===null?null:deriveJournalAccountSelectionRef(original.scope.workspaceId,original.scope.activeAccountId);
    const atUtc=new Date().toISOString();
    const signal=AbortSignal.any([request.signal,AbortSignal.timeout(30_000)]);
    const ownerLife=input.admission.runForUsers([original.scope.userId],()=>{
      input.admission.assertLivePrincipal(original.scope.userId);
      const value=input.admission.lifecycle(original.scope.userId);
      return JSON.stringify(value);
    });
    const verify=(allowCanonicalPause=false)=>{
      const now=Date.now();
      if(now<started||now-started>=30_000||signal.aborted||JSON.stringify([...request.headers])!==headers
        ||input.environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT!==reviewSelector||!input.configurationIsCurrent())return unavailable();
      if(requirePlatformErasureWriter(db,original.scope.userId)!==input.admission)return unavailable();
      input.admission.assertLivePrincipal(original.scope.userId);
      if(JSON.stringify(input.admission.lifecycle(original.scope.userId))!==ownerLife)return unavailable();
      const session=new PlatformSessionRepository(db).findActiveByTokenDigest(digest,new Date().toISOString());
      const scope=deriveAuthenticatedUserJournalScope(db,original.scope.userId,selection);
      const current=db.prepare(query).get(input.target.value) as Community|undefined;
      if(!session||session.sessionId!==original.sessionId||session.userId!==original.scope.userId
        ||session.expiresAtUtc!==originalSession.expiresAtUtc||session.authProvider!==originalSession.authProvider
        ||JSON.stringify(scope)!==JSON.stringify(original.scope)||JSON.stringify(subjects())!==JSON.stringify(originalSubjects)
        ||!current||current.community_id!==community.community_id||current.slug!==community.slug
        ||current.discord_guild_id!==community.discord_guild_id||current.owner_user_id!==community.owner_user_id
        ||JSON.stringify(lifecycle())!==JSON.stringify(communityLifecycle))return unavailable();
      const unchanged=current.status===community.status&&current.updated_at_utc===community.updated_at_utc;
      const canonicalPause=allowCanonicalPause&&["active","setup"].includes(community.status)&&current.status==="paused"&&current.updated_at_utc===atUtc;
      if(!unchanged&&!canonicalPause)return unavailable();
    };
    // Fresh cached evidence still passes the complete current caller checks.
    input.admission.runForUsers([original.scope.userId],()=>verify());
    const verified=await verifyCommunityRequestMember(db,{slug:community.slug,userId:original.scope.userId,botToken:input.botToken,
      atUtc,signal,commitObservation:(affected,operation)=>input.admission.runForUsers(affected,()=>{
        verify();
        const result=operation();
        verify(true);
        return result;
      })},input.transport??fetch);
    // Full normal Auth is deliberately outside the Core writer, after I/O.
    const latest=identity();
    if(latest.mode!==original.mode||latest.sessionId!==original.sessionId||JSON.stringify(latest.scope)!==JSON.stringify(original.scope))return "unavailable";
    input.admission.runForUsers([original.scope.userId],()=>verify(!verified));
    return verified?"verified":"unavailable";
  }catch{return "unavailable";}
}
