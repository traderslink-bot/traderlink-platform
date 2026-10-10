import type Database from "better-sqlite3";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4,createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { isFreshCommunityEvidence } from "./community-launch-policy";
import { reconcileCoachingAccess } from "./coaching-access-lifecycle";

type Target = { community_id:string; discord_guild_id:string; auth_subject:string; last_verified_at_utc:string|null; membership_status:string|null };

/** No transaction is held during Discord I/O. Failures never manufacture removal evidence. */
export async function verifyCommunityRequestMember(db:Database.Database,input:{slug:string;userId:string;botToken:string;atUtc:string},request:typeof fetch=fetch):Promise<boolean>{
 assertCanonicalUuidV4(input.userId,"userId");assertCanonicalUtcTimestamp(input.atUtc,"atUtc");
 const target=db.prepare(`SELECT c.community_id,c.discord_guild_id,i.auth_subject,m.last_verified_at_utc,cm.status membership_status FROM traderlink_communities c JOIN platform_auth_identities i ON i.user_id=? AND i.auth_provider='discord' AND i.status='active' LEFT JOIN platform_discord_memberships m ON m.user_id=i.user_id AND m.guild_id=c.discord_guild_id LEFT JOIN traderlink_community_memberships cm ON cm.community_id=c.community_id AND cm.user_id=i.user_id WHERE c.slug=?`).get(input.userId,input.slug) as Target|undefined;
 if(!target||target.membership_status==='suspended')return false;
 if(isFreshCommunityEvidence(target.last_verified_at_utc,input.atUtc)&&target.membership_status==='active')return true;
 if(!input.botToken.trim()||!/^\d{1,32}$/.test(target.auth_subject)||!/^\d{1,32}$/.test(target.discord_guild_id))return false;
 try{
  const options={headers:{Authorization:`Bot ${input.botToken}`},cache:"no-store" as const};
  const [guildResponse,memberResponse]=await Promise.all([
   request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}`,{...options,signal:AbortSignal.timeout(8000)}),
   request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}/members/${target.auth_subject}`,{...options,signal:AbortSignal.timeout(8000)}),
  ]);
  if(!guildResponse.ok)return false;
  const guild=await guildResponse.json() as {id?:string;owner_id?:string};
  if(guild.id!==target.discord_guild_id||!guild.owner_id||!/^\d{1,32}$/.test(guild.owner_id))return false;
  const owner=db.prepare("SELECT i.auth_subject,c.updated_at_utc FROM traderlink_communities c LEFT JOIN platform_auth_identities i ON i.user_id=c.owner_user_id AND i.auth_provider='discord' AND i.status='active' WHERE c.community_id=?").get(target.community_id) as {auth_subject:string|null;updated_at_utc:string};
  if(owner.updated_at_utc<=input.atUtc&&owner.auth_subject!==guild.owner_id){
   db.transaction(()=>{
    db.prepare("UPDATE platform_discord_memberships SET guild_owner=0 WHERE guild_id=? AND last_verified_at_utc<=?").run(target.discord_guild_id,input.atUtc);
    const changed=db.prepare("UPDATE traderlink_communities SET status='paused',updated_at_utc=? WHERE community_id=? AND status IN ('active','setup') AND updated_at_utc<=?").run(input.atUtc,target.community_id,input.atUtc);
    if(changed.changes)db.prepare("INSERT INTO traderlink_community_authorization_audit_events(audit_event_id,community_id,actor_user_id,event_type,object_type,object_ref,detail_json,created_at_utc) VALUES(?,?,?,'community.owner.verification_changed','community',?,'{}',?)").run(createCanonicalUuidV4(),target.community_id,input.userId,target.community_id,input.atUtc);
   })();
   return false;
  }
  const member=await memberResponse.json() as {code?:number;roles?:unknown;user?:{id?:string;username?:string;global_name?:string|null;avatar?:string|null};joined_at?:string|null};
  if(memberResponse.status===404&&member.code===10007){
   db.transaction(()=>{
    const latest=db.prepare(`SELECT last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?`).get(input.userId,target.discord_guild_id) as {last_verified_at_utc:string}|undefined;
    if(latest&&latest.last_verified_at_utc>input.atUtc)return;
    db.prepare(`UPDATE platform_discord_memberships SET role_ids_json='[]',guild_owner=0,last_verified_at_utc=? WHERE user_id=? AND guild_id=? AND last_verified_at_utc<=?`).run(input.atUtc,input.userId,target.discord_guild_id,input.atUtc);
    db.prepare(`UPDATE traderlink_community_memberships SET status='inactive',discord_verified_at_utc=?,updated_at_utc=? WHERE community_id=? AND user_id=? AND status!='suspended' AND discord_verified_at_utc<=?`).run(input.atUtc,input.atUtc,target.community_id,input.userId,input.atUtc);
    reconcileCoachingAccess(db,target.community_id,input.userId,input.atUtc);
   })();return false;
  }
  if(!memberResponse.ok||member.user?.id!==target.auth_subject||!member.user.username||!Array.isArray(member.roles)||member.roles.length>250||member.roles.some(role=>typeof role!=='string'||!/^\d{1,32}$/.test(role)))return false;
  const user=member.user,roles=member.roles as string[];
  return db.transaction(()=>{
   // Ignore an older response arriving after a newer verification.
   const current=db.prepare(`SELECT last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?`).get(input.userId,target.discord_guild_id) as {last_verified_at_utc:string}|undefined;
   if(current&&current.last_verified_at_utc>input.atUtc)return false;
   new PlatformDiscordMembershipRepository(db).upsertCurrent({userId:input.userId,guildId:target.discord_guild_id,username:user.username!,globalDisplayName:user.global_name??null,avatarHash:user.avatar??null,roleIds:roles,guildOwner:guild.owner_id===target.auth_subject,joinedAtUtc:member.joined_at?new Date(member.joined_at).toISOString():null,verifiedAtUtc:input.atUtc});
   db.prepare(`UPDATE traderlink_community_memberships SET status='active',discord_verified_at_utc=?,updated_at_utc=? WHERE community_id=? AND user_id=? AND status!='suspended' AND discord_verified_at_utc<=?`).run(input.atUtc,input.atUtc,target.community_id,input.userId,input.atUtc);
   reconcileCoachingAccess(db,target.community_id,input.userId,input.atUtc);
   return true;
  })();
 }catch{return false;}
}
