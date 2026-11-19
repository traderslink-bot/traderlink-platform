import { COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,isCommunityReviewDiscordGuild,isCommunityStagingQaDiscordGuild } from "./community-review-discord-guild";
import type Database from "better-sqlite3";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4,createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { isFreshCommunityEvidence } from "./community-launch-policy";
import { reconcileCoachingAccess } from "./coaching-access-lifecycle";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";

/** Internal synchronous port; observation I/O must finish before invocation.
 * Existing Community callers retain their bounded default behavior. */
export type CommunityRequestObservationCommit = <T>(affectedUserIds: readonly string[], operation: () => T) => T;
export type CommunityRequestVerificationInput = {
 slug:string;userId:string;botToken:string;atUtc:string;existingCoachingOnly?:boolean;relationshipId?:string;
 stagingQaGuildId?:string;
 /** Fixed by selected-identity server entry points, never form/query input.
  * This permits only metadata verification, not guild/channel delivery. */
 reviewIntent?:"shared-alerts"|"stats"|"community-owner-review";
 signal?:AbortSignal;commitObservation?:CommunityRequestObservationCommit;
};

type Target = { community_id:string; discord_guild_id:string; auth_subject:string; last_verified_at_utc:string|null; membership_status:string|null };

/** No transaction is held during Discord I/O. Failures never manufacture removal evidence. */
export async function verifyCommunityRequestMember(db:Database.Database,input:CommunityRequestVerificationInput,request:typeof fetch=fetch):Promise<boolean>{
 assertCanonicalUuidV4(input.userId,"userId");assertCanonicalUtcTimestamp(input.atUtc,"atUtc");
 if(input.signal?.aborted||input.commitObservation&&db.inTransaction)return false;
 const target=db.prepare(`SELECT c.community_id,c.discord_guild_id,i.auth_subject,m.last_verified_at_utc,cm.status membership_status FROM traderlink_communities c JOIN platform_auth_identities i ON i.user_id=? AND i.auth_provider='discord' AND i.status='active' LEFT JOIN platform_discord_memberships m ON m.user_id=i.user_id AND m.guild_id=c.discord_guild_id LEFT JOIN traderlink_community_memberships cm ON cm.community_id=c.community_id AND cm.user_id=i.user_id WHERE c.slug=?`).get(input.userId,input.slug) as Target|undefined;
 const admittedGuild=input.stagingQaGuildId!==undefined&&isCommunityStagingQaDiscordGuild(input.stagingQaGuildId)&&target?.discord_guild_id===input.stagingQaGuildId;
 const ownerReview = (input.reviewIntent === "shared-alerts" || input.reviewIntent === "stats" || input.reviewIntent === "community-owner-review")
  && target?.discord_guild_id === COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID;
 if(!target||(!isCommunityReviewDiscordGuild(target.discord_guild_id)&&!admittedGuild&&!ownerReview)||target.membership_status==='suspended')return false;
 const owner=db.prepare("SELECT i.auth_subject,c.updated_at_utc,u.auth_provider owner_provider,u.status owner_status FROM traderlink_communities c JOIN platform_users u ON u.user_id=c.owner_user_id LEFT JOIN platform_auth_identities i ON i.user_id=c.owner_user_id AND i.auth_provider='discord' AND i.status='active' WHERE c.community_id=?").get(target.community_id) as {auth_subject:string|null;updated_at_utc:string;owner_provider:string;owner_status:string};
 const deletedOwner=owner.owner_provider==='deleted'&&owner.owner_status==='disabled';
 // Explicit server-side coaching intent is required even with fresh cached
 // membership. A relationship ID alone never authorizes publishing or setup.
 if(deletedOwner){
  if(!input.existingCoachingOnly||!db.prepare(`SELECT 1 FROM traderlink_community_coaching_relationships
   WHERE community_id=? AND (coach_user_id=? OR student_user_id=?) AND status='active'
   AND archived_at_utc IS NULL AND (? IS NULL OR relationship_id=?) LIMIT 1`)
   .get(target.community_id,input.userId,input.userId,input.relationshipId??null,input.relationshipId??null))return false;
 }
 // Bind original target/owner/identity/suspension facts before provider I/O.
 // This extra fence applies only to the explicitly admitted caller.
 const targetState=()=>JSON.stringify({
  community:db.prepare("SELECT community_id,discord_guild_id,owner_user_id,status,updated_at_utc FROM traderlink_communities WHERE community_id=?").get(target.community_id),
  actorIdentities:db.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active' ORDER BY auth_subject").all(input.userId),
  membership:db.prepare("SELECT status FROM traderlink_community_memberships WHERE community_id=? AND user_id=?").get(target.community_id,input.userId),
  owner:db.prepare("SELECT c.owner_user_id,u.auth_provider,u.status,i.auth_subject FROM traderlink_communities c JOIN platform_users u ON u.user_id=c.owner_user_id LEFT JOIN platform_auth_identities i ON i.user_id=u.user_id AND i.auth_provider='discord' AND i.status='active' WHERE c.community_id=? ORDER BY i.auth_subject").all(target.community_id),
  retained:deletedOwner?db.prepare("SELECT relationship_id,student_user_id,coach_user_id,status,archived_at_utc FROM traderlink_community_coaching_relationships WHERE community_id=? AND (coach_user_id=? OR student_user_id=?) AND status='active' AND archived_at_utc IS NULL AND (? IS NULL OR relationship_id=?) ORDER BY relationship_id").all(target.community_id,input.userId,input.userId,input.relationshipId??null,input.relationshipId??null):null,
 });
 const originalTargetState=input.commitObservation?targetState():null;
 type DependencySnapshot=Readonly<{ids:readonly string[];fingerprint:string}>;
 const dependencies=(kind:"member"|"owner_mismatch"):DependencySnapshot=>{
  const community=db.prepare("SELECT owner_user_id FROM traderlink_communities WHERE community_id=?").get(target.community_id) as {owner_user_id:string}|undefined;
  if(!community)throw Error("Community observation target changed");
  const where="r.community_id=? AND r.status='active'"+(kind==="member"?" AND r.student_user_id=?":"");
  const values=kind==="member"?[target.community_id,input.userId]:[target.community_id];
  // Explicit lifecycle graph: no feedback, reviews, Journal content or templates.
  const relations=db.prepare("SELECT r.relationship_id,r.community_id,r.coach_profile_id,r.coach_user_id,r.student_user_id,r.plan_id,r.status,r.requested_at_utc,r.started_at_utc,r.ended_at_utc,r.archived_at_utc,r.student_messaging_enabled,r.student_trade_reviews_enabled FROM traderlink_community_coaching_relationships r WHERE "+where+" ORDER BY r.relationship_id LIMIT 10001")
   .all(...values) as {coach_user_id:string;student_user_id:string}[];
  const plans=db.prepare("SELECT DISTINCT p.plan_id,p.required_discord_role_id FROM traderlink_community_coaching_relationships r JOIN traderlink_community_coaching_plans p ON p.plan_id=r.plan_id WHERE "+where+" ORDER BY p.plan_id LIMIT 10001").all(...values);
  // coachingEntitlement consumes this singleton's required role, not other terms.
  const terms=db.prepare("SELECT a.agreement_id,a.relationship_id,a.revision,a.status,a.accepted_at_utc,json_type(a.terms_json,'$.requiredDiscordRoleId') role_type,json_extract(a.terms_json,'$.requiredDiscordRoleId') required_role FROM traderlink_community_coaching_relationships r JOIN traderlink_community_coaching_agreements a ON a.relationship_id=r.relationship_id AND a.status='accepted' WHERE "+where+" ORDER BY r.relationship_id,a.agreement_id LIMIT 10001").all(...values);
  const access=db.prepare("SELECT x.relationship_id,x.state,x.changed_at_utc,x.verified_at_utc FROM traderlink_community_coaching_relationships r JOIN traderlink_community_coaching_access_state x ON x.relationship_id=r.relationship_id WHERE "+where+" ORDER BY r.relationship_id LIMIT 10001").all(...values);
  const membership=db.prepare("SELECT r.relationship_id,cm.status membership_status,m.last_verified_at_utc,CASE WHEN a.agreement_id IS NOT NULL THEN json_type(a.terms_json,'$.requiredDiscordRoleId') ELSE CASE WHEN p.required_discord_role_id IS NULL THEN 'null' ELSE 'text' END END role_type,EXISTS(SELECT 1 FROM json_each(m.role_ids_json) WHERE value=CASE WHEN a.agreement_id IS NOT NULL THEN json_extract(a.terms_json,'$.requiredDiscordRoleId') ELSE p.required_discord_role_id END) required_role_present FROM traderlink_community_coaching_relationships r JOIN traderlink_community_coaching_plans p ON p.plan_id=r.plan_id LEFT JOIN traderlink_community_coaching_agreements a ON a.relationship_id=r.relationship_id AND a.status='accepted' LEFT JOIN traderlink_community_memberships cm ON cm.community_id=r.community_id AND cm.user_id=r.student_user_id LEFT JOIN platform_discord_memberships m ON m.guild_id=? AND m.user_id=r.student_user_id WHERE "+where+" ORDER BY r.relationship_id LIMIT 10001").all(target.discord_guild_id,...values);
  const guildUsers=kind==="owner_mismatch"?db.prepare("SELECT user_id,last_verified_at_utc,guild_owner FROM platform_discord_memberships WHERE guild_id=? AND last_verified_at_utc<=? ORDER BY user_id LIMIT 10001").all(target.discord_guild_id,input.atUtc) as {user_id:string}[]:[];
  const ids=[...new Set([input.userId,community.owner_user_id,...relations.flatMap(row=>[row.coach_user_id,row.student_user_id]),...guildUsers.map(row=>row.user_id)])].sort();
  if([relations,plans,terms,access,membership,guildUsers].some(rows=>rows.length>10000)||ids.length>10000)throw Error("Community observation set unavailable");
  // A readmission/erasure during I/O is a new intent even if the same parties
  // and coaching graph remain. Missing admission is never created here.
  const lifecycles=db.prepare("SELECT l.user_id,l.lifecycle_ref,l.generation,l.admission_ref,l.erasure_generation,l.phase,l.profile_ref,l.profile_generation,l.valid_until_utc,l.operation_ref,p.generation current_profile_generation,p.valid_until_utc current_profile_until,u.status user_status FROM platform_erasure_lifecycles l JOIN platform_erasure_profiles p USING(profile_ref) JOIN platform_users u ON u.user_id=l.user_id WHERE l.user_id IN (SELECT value FROM json_each(?)) ORDER BY l.user_id").all(JSON.stringify(ids));
  const fingerprint=JSON.stringify({relations,plans,terms,access,membership,guildUsers,lifecycles});
  if(Buffer.byteLength(fingerprint,'utf8')>8*1024*1024)throw Error("Community observation dependency budget exceeded");
  return Object.freeze({ids:Object.freeze(ids),fingerprint});
 };
 let originalDependencies:Readonly<Record<"member"|"owner_mismatch",DependencySnapshot>>|null=null;
 const commit=<T>(kind:"member"|"owner_mismatch",operation:()=>T):T=>{
  if(!input.commitObservation)return db.transaction(operation)();
  const original=originalDependencies?.[kind];
  if(!original)throw Error("Community observation dependencies unavailable");
  const ids=original.ids;let invoked=false,closed=false;
  try{
   const result=input.commitObservation(ids,()=>{
    if(closed||invoked||!db.inTransaction||input.signal?.aborted||targetState()!==originalTargetState
      ||JSON.stringify(dependencies(kind))!==JSON.stringify(original))throw Error("Community observation changed");
    invoked=true;
    for(const id of ids)requirePlatformErasureWriter(db,id).assertLivePrincipal(id);
    return db.transaction(()=>{
     const value=operation();
     if(value!==null&&(typeof value==='object'||typeof value==='function')&&'then' in value)throw Error("Community observation must be synchronous");
     if(input.signal?.aborted)throw Error("Community observation cancelled");
     for(const id of ids)requirePlatformErasureWriter(db,id).assertLivePrincipal(id);
     return value;
    })();
   });
   if(!invoked||result!==null&&(typeof result==='object'||typeof result==='function')&&'then' in result)throw Error("Community observation must be synchronous");
   return result;
  }finally{closed=true;}
 };
 if(isFreshCommunityEvidence(target.last_verified_at_utc,input.atUtc)&&target.membership_status==='active')return true;
 if(!input.botToken.trim()||!/^\d{1,32}$/.test(target.auth_subject)||!/^\d{1,32}$/.test(target.discord_guild_id))return false;
 try{
  if(input.commitObservation)originalDependencies=Object.freeze({member:dependencies("member"),owner_mismatch:dependencies("owner_mismatch")});
  const options={headers:{Authorization:`Bot ${input.botToken}`},cache:"no-store" as const};
  const [guildResponse,memberResponse]=await Promise.all([
   request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}`,{...options,signal:input.signal?AbortSignal.any([input.signal,AbortSignal.timeout(8000)]):AbortSignal.timeout(8000)}),
   request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}/members/${target.auth_subject}`,{...options,signal:input.signal?AbortSignal.any([input.signal,AbortSignal.timeout(8000)]):AbortSignal.timeout(8000)}),
  ]);
  if(input.signal?.aborted||!guildResponse.ok)return false;
  if(!db.prepare("SELECT 1 FROM traderlink_communities WHERE community_id=? AND discord_guild_id=?").get(target.community_id,target.discord_guild_id))return false;
  const guild=await guildResponse.json() as {id?:string;owner_id?:string};
  if(guild.id!==target.discord_guild_id||!guild.owner_id||!/^\d{1,32}$/.test(guild.owner_id))return false;
  if(!deletedOwner&&owner.updated_at_utc<=input.atUtc&&owner.auth_subject!==guild.owner_id){
   commit("owner_mismatch",()=>{
    db.prepare("UPDATE platform_discord_memberships SET guild_owner=0 WHERE guild_id=? AND last_verified_at_utc<=?").run(target.discord_guild_id,input.atUtc);
    const changed=db.prepare("UPDATE traderlink_communities SET status='paused',updated_at_utc=? WHERE community_id=? AND status IN ('active','setup') AND updated_at_utc<=?").run(input.atUtc,target.community_id,input.atUtc);
    if(changed.changes)db.prepare("INSERT INTO traderlink_community_authorization_audit_events(audit_event_id,community_id,actor_user_id,event_type,object_type,object_ref,detail_json,created_at_utc) VALUES(?,?,?,'community.owner.verification_changed','community',?,'{}',?)").run(createCanonicalUuidV4(),target.community_id,input.userId,target.community_id,input.atUtc);
   });
   return false;
  }
  const member=await memberResponse.json() as {code?:number;roles?:unknown;user?:{id?:string;username?:string;global_name?:string|null;avatar?:string|null};joined_at?:string|null};
  if(memberResponse.status===404&&member.code===10007){
   commit("member",()=>{
    const latest=db.prepare(`SELECT last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?`).get(input.userId,target.discord_guild_id) as {last_verified_at_utc:string}|undefined;
    if(latest&&latest.last_verified_at_utc>input.atUtc)return;
    db.prepare(`UPDATE platform_discord_memberships SET role_ids_json='[]',guild_owner=0,last_verified_at_utc=? WHERE user_id=? AND guild_id=? AND last_verified_at_utc<=?`).run(input.atUtc,input.userId,target.discord_guild_id,input.atUtc);
    db.prepare(`UPDATE traderlink_community_memberships SET status='inactive',discord_verified_at_utc=?,updated_at_utc=? WHERE community_id=? AND user_id=? AND status!='suspended' AND discord_verified_at_utc<=?`).run(input.atUtc,input.atUtc,target.community_id,input.userId,input.atUtc);
    reconcileCoachingAccess(db,target.community_id,input.userId,input.atUtc);
   });return false;
  }
  if(!memberResponse.ok||member.user?.id!==target.auth_subject||!member.user.username||!Array.isArray(member.roles)||member.roles.length>250||member.roles.some(role=>typeof role!=='string'||!/^\d{1,32}$/.test(role)))return false;
  const user=member.user,roles=member.roles as string[];
  return commit("member",()=>{
   // Ignore an older response arriving after a newer verification.
   const current=db.prepare(`SELECT last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?`).get(input.userId,target.discord_guild_id) as {last_verified_at_utc:string}|undefined;
   if(current&&current.last_verified_at_utc>input.atUtc)return false;
   new PlatformDiscordMembershipRepository(db).upsertCurrent({userId:input.userId,guildId:target.discord_guild_id,username:user.username!,globalDisplayName:user.global_name??null,avatarHash:user.avatar??null,roleIds:roles,guildOwner:guild.owner_id===target.auth_subject,joinedAtUtc:member.joined_at?new Date(member.joined_at).toISOString():null,verifiedAtUtc:input.atUtc});
   db.prepare(`UPDATE traderlink_community_memberships SET status='active',discord_verified_at_utc=?,updated_at_utc=? WHERE community_id=? AND user_id=? AND status!='suspended' AND discord_verified_at_utc<=?`).run(input.atUtc,input.atUtc,target.community_id,input.userId,input.atUtc);
   reconcileCoachingAccess(db,target.community_id,input.userId,input.atUtc);
   return true;
  });
 }catch{return false;}
}
