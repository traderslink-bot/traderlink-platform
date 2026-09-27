import type Database from "better-sqlite3";
import {reconcileCoachingAccess} from "./coaching-access-lifecycle";

type Target={community_id:string;discord_guild_id:string;student_user_id:string;auth_subject:string};
export class CoachingDiscordRefreshService{
 constructor(private readonly db:Database.Database,private readonly botToken:string,private readonly request:typeof fetch=fetch){}
 async runAvailable(limit=25,atUtc=new Date().toISOString()){
  if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error("Invalid refresh batch size.");
  const cutoff=new Date(Date.parse(atUtc)-5*60000).toISOString();
  const targets=this.db.prepare(`SELECT DISTINCT community.community_id,community.discord_guild_id,relationship.student_user_id,identity.auth_subject FROM traderlink_community_coaching_relationships relationship JOIN traderlink_communities community ON community.community_id=relationship.community_id JOIN platform_auth_identities identity ON identity.user_id=relationship.student_user_id AND identity.auth_provider='discord' AND identity.status='active' LEFT JOIN platform_discord_memberships membership ON membership.user_id=relationship.student_user_id AND membership.guild_id=community.discord_guild_id WHERE relationship.status='active' AND community.status='active' AND (membership.last_verified_at_utc IS NULL OR membership.last_verified_at_utc<?) ORDER BY coalesce(membership.last_verified_at_utc,'') LIMIT ?`).all(cutoff,limit) as Target[];
  let refreshed=0,unavailable=0;
  for(const target of targets){
   if(!/^\d{1,32}$/.test(target.auth_subject)||!/^\d{1,32}$/.test(target.discord_guild_id)){unavailable++;continue;}
   try{
    const response=await this.request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}/members/${target.auth_subject}`,{headers:{Authorization:`Bot ${this.botToken}`},signal:AbortSignal.timeout(8000),cache:"no-store"});
    if(response.status===429){unavailable++;break;}
    const body=await response.json() as {roles?:unknown;code?:number};
    const left=response.status===404&&body.code===10007;
    if(!left&&(!response.ok||!Array.isArray(body.roles)||body.roles.some(role=>typeof role!=="string"||!/^\d{1,32}$/.test(role)))){unavailable++;continue;}
    // Do not manufacture an identity or membership: onboarding owns those records.
    this.db.transaction(()=>{
     const updated=this.db.prepare(`UPDATE platform_discord_memberships SET role_ids_json=?,last_verified_at_utc=? WHERE user_id=? AND guild_id=? AND last_verified_at_utc<=?`).run(JSON.stringify(left?[]:body.roles),atUtc,target.student_user_id,target.discord_guild_id,atUtc);
     if(updated.changes)reconcileCoachingAccess(this.db,target.community_id,target.student_user_id,atUtc);
    })();refreshed++;
   }catch{unavailable++;}
  }
  return {refreshed,unavailable};
 }
}
