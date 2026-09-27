import type Database from "better-sqlite3";
import {createCanonicalUuidV4,assertCanonicalUtcTimestamp} from "../../platform/server/database/platform-migration-contract";
import {acceptedCoachingTerms} from "./coaching-service-limits";

export function coachingEntitlement(db:Database.Database,relationshipId:string){
 const row=db.prepare(`SELECT plan.required_discord_role_id,relationship.student_user_id,relationship.coach_user_id,relationship.community_id,membership.role_ids_json,membership.last_verified_at_utc FROM traderlink_community_coaching_relationships relationship JOIN traderlink_community_coaching_plans plan ON plan.plan_id=relationship.plan_id JOIN traderlink_communities community ON community.community_id=relationship.community_id LEFT JOIN platform_discord_memberships membership ON membership.guild_id=community.discord_guild_id AND membership.user_id=relationship.student_user_id WHERE relationship.relationship_id=?`).get(relationshipId) as {required_discord_role_id:string|null;student_user_id:string;coach_user_id:string;community_id:string;role_ids_json:string|null;last_verified_at_utc:string|null}|undefined;
 if(!row)return null;
 const terms=acceptedCoachingTerms(db,relationshipId);
 const requiredRole=terms?terms.requiredDiscordRoleId:row.required_discord_role_id;
 return {...row,requiredRole,present:requiredRole===null||Boolean(row.role_ids_json&&(JSON.parse(row.role_ids_json) as string[]).includes(requiredRole))};
}

// Only invoke after a successful, current Discord membership response. Network failures never call this function.
export function reconcileCoachingAccess(db:Database.Database,communityId:string,studentUserId:string,verifiedAtUtc:string){
 assertCanonicalUtcTimestamp(verifiedAtUtc,"verifiedAtUtc");
 const relationships=db.prepare(`SELECT relationship_id FROM traderlink_community_coaching_relationships WHERE community_id=? AND student_user_id=? AND status='active'`).all(communityId,studentUserId) as {relationship_id:string}[];
 db.transaction(()=>{
  for(const relationship of relationships){
   const entitlement=coachingEntitlement(db,relationship.relationship_id);if(!entitlement||entitlement.last_verified_at_utc!==verifiedAtUtc)continue;
   const state=entitlement.present?"active":"paused";
   const previous=db.prepare(`SELECT state,verified_at_utc FROM traderlink_community_coaching_access_state WHERE relationship_id=?`).get(relationship.relationship_id) as {state:string;verified_at_utc:string}|undefined;
   if(previous&&previous.verified_at_utc>verifiedAtUtc)continue;
   db.prepare(`INSERT INTO traderlink_community_coaching_access_state(relationship_id,community_id,state,changed_at_utc,verified_at_utc) VALUES(?,?,?,?,?) ON CONFLICT(relationship_id) DO UPDATE SET changed_at_utc=CASE WHEN state<>excluded.state THEN excluded.changed_at_utc ELSE changed_at_utc END,state=excluded.state,verified_at_utc=excluded.verified_at_utc`).run(relationship.relationship_id,communityId,state,verifiedAtUtc,verifiedAtUtc);
   if(previous?.state===state||(!previous&&state==="active"))continue;
   for(const userId of [entitlement.coach_user_id,studentUserId])db.prepare(`INSERT INTO traderlink_community_coaching_notices(notice_id,community_id,relationship_id,user_id,kind,body,created_at_utc) VALUES(?,?,?,?,?,?,?)`).run(createCanonicalUuidV4(),communityId,relationship.relationship_id,userId,state==="paused"?"access_paused":"access_restored",state==="paused"?"Coaching access paused — required Discord role removed":"Coaching access restored",verifiedAtUtc);
  }
 })();
}

export function archivePausedCoaching(db:Database.Database,atUtc:string):number{
 assertCanonicalUtcTimestamp(atUtc,"atUtc");
 const rows=db.prepare(`SELECT relationship.relationship_id,access.changed_at_utc,plan.auto_archive_after_days FROM traderlink_community_coaching_relationships relationship JOIN traderlink_community_coaching_access_state access ON access.relationship_id=relationship.relationship_id JOIN traderlink_community_coaching_plans plan ON plan.plan_id=relationship.plan_id WHERE relationship.status='active' AND relationship.archived_at_utc IS NULL AND access.state='paused'`).all() as {relationship_id:string;changed_at_utc:string;auto_archive_after_days:number|null}[];
 let archived=0;
 for(const row of rows){const terms=acceptedCoachingTerms(db,row.relationship_id),days=terms?terms.autoArchiveAfterDays:row.auto_archive_after_days;if(days&&Date.parse(atUtc)-Date.parse(row.changed_at_utc)>=days*86400000&&!coachingEntitlement(db,row.relationship_id)?.present)archived+=db.prepare(`UPDATE traderlink_community_coaching_relationships SET archived_at_utc=? WHERE relationship_id=? AND archived_at_utc IS NULL`).run(atUtc,row.relationship_id).changes;}
 return archived;
}
