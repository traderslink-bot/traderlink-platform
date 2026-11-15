import type Database from "better-sqlite3";
import {createCanonicalUuidV4} from "../../platform/server/database/platform-migration-contract";
export function communityIsRemoved(db:Database.Database,communityId:string):boolean{return Boolean(db.prepare(`SELECT 1 FROM traderlink_community_lifecycle WHERE community_id=? AND removed_at_utc IS NOT NULL`).get(communityId));}
export function stopCommunityPendingDeliveries(db:Database.Database,communityId:string,atUtc:string){
 db.prepare(`UPDATE traderlink_community_content_deliveries SET status='failed',delivery_outcome='rejected',next_attempt_at_utc=NULL,last_error='Community disconnected or removed; explicit new publication required.',updated_at_utc=? WHERE community_id=? AND status IN ('pending','failed') AND delivery_outcome='pending'`).run(atUtc,communityId);
 db.prepare(`UPDATE traderlink_community_publication_actions SET status='rejected',next_attempt_at_utc=NULL,last_error='Community disconnected or removed; explicit new action required.',updated_at_utc=? WHERE community_id=? AND status='pending'`).run(atUtc,communityId);
}
export function removeCommunity(db:Database.Database,communityId:string,actorUserId:string,atUtc:string){
 db.transaction(()=>{
  const community=db.prepare(`SELECT owner_user_id,status FROM traderlink_communities WHERE community_id=?`).get(communityId) as {owner_user_id:string;status:string}|undefined;
  if(!community||community.owner_user_id!==actorUserId||community.status==='suspended')throw new Error("Community unavailable");
  if(communityIsRemoved(db,communityId))return;
  const recovery=new Date(Date.parse(atUtc)+30*86400000).toISOString();
  db.prepare(`INSERT INTO traderlink_community_lifecycle(community_id,removed_at_utc,recover_until_utc,removed_by_user_id) VALUES(?,?,?,?) ON CONFLICT(community_id) DO UPDATE SET removed_at_utc=excluded.removed_at_utc,recover_until_utc=excluded.recover_until_utc,removed_by_user_id=excluded.removed_by_user_id`).run(communityId,atUtc,recovery,actorUserId);
  db.prepare(`UPDATE traderlink_communities SET status='paused',updated_at_utc=? WHERE community_id=?`).run(atUtc,communityId);
  stopCommunityPendingDeliveries(db,communityId,atUtc);
  db.prepare(`INSERT INTO traderlink_community_authorization_audit_events(audit_event_id,community_id,actor_user_id,event_type,object_type,object_ref,detail_json,created_at_utc) VALUES(?,?,?,'community.removed','community',?,?,?)`).run(createCanonicalUuidV4(),communityId,actorUserId,communityId,JSON.stringify({recoverUntilUtc:recovery}),atUtc);
 })();
}
export function recoverCommunity(db:Database.Database,communityId:string,actorUserId:string,atUtc:string){
 db.transaction(()=>{
  const row=db.prepare(`SELECT l.recover_until_utc,l.configuration_purged_at_utc,c.owner_user_id,c.status FROM traderlink_community_lifecycle l JOIN traderlink_communities c ON c.community_id=l.community_id WHERE l.community_id=? AND l.removed_at_utc IS NOT NULL`).get(communityId) as {recover_until_utc:string;configuration_purged_at_utc:string|null;owner_user_id:string;status:string}|undefined;
  if(!row||row.owner_user_id!==actorUserId||row.status==='suspended'||row.configuration_purged_at_utc||row.recover_until_utc<=atUtc)throw new Error("Recovery window expired");
  // Recovery restores settings into a paused community. Resume is a separate explicit owner action.
  db.prepare(`UPDATE traderlink_community_lifecycle SET removed_at_utc=NULL,recover_until_utc=NULL,removed_by_user_id=NULL,bot_state='connected',bot_checked_at_utc=?,bot_missing_since_utc=NULL WHERE community_id=?`).run(atUtc,communityId);
  stopCommunityPendingDeliveries(db,communityId,atUtc);
 })();
}
/** Purge only recoverable setup, never coaching, Journals, publication evidence or membership history. */
export function expireCommunityRecoverySettings(db:Database.Database,atUtc:string){
 const rows=db.prepare(`SELECT community_id FROM traderlink_community_lifecycle WHERE removed_at_utc IS NOT NULL AND recover_until_utc<=? AND configuration_purged_at_utc IS NULL LIMIT 25`).all(atUtc) as {community_id:string}[];
 for(const row of rows)db.transaction(()=>{
  db.prepare(`DELETE FROM traderlink_community_discord_role_mappings WHERE community_id=?`).run(row.community_id);
  db.prepare(`DELETE FROM traderlink_community_destination_publishers WHERE community_id=?`).run(row.community_id);
  db.prepare(`UPDATE traderlink_community_discord_destinations SET status='paused',updated_at_utc=? WHERE community_id=?`).run(atUtc,row.community_id);
  db.prepare(`UPDATE traderlink_community_settings SET description='',personal_alert_templates_enabled=0,updated_at_utc=? WHERE community_id=?`).run(atUtc,row.community_id);
  db.prepare(`UPDATE traderlink_community_lifecycle SET configuration_purged_at_utc=? WHERE community_id=?`).run(atUtc,row.community_id);
 })();
}
/** Complete successful bot roster only; partial, malformed, rate-limited and failed reads never mean uninstall. */
export async function refreshCommunityBotInstallations(db:Database.Database,token:string,atUtc:string,request:typeof fetch=fetch){
 if(!token)return;
 const due=db.prepare(`SELECT c.community_id,c.discord_guild_id,l.bot_missing_since_utc FROM traderlink_communities c LEFT JOIN traderlink_community_lifecycle l ON l.community_id=c.community_id WHERE c.status IN ('active','paused') AND l.removed_at_utc IS NULL AND (l.bot_checked_at_utc IS NULL OR l.bot_checked_at_utc<?) LIMIT 25`).all(new Date(Date.parse(atUtc)-300000).toISOString()) as {community_id:string;discord_guild_id:string;bot_missing_since_utc:string|null}[];
 if(!due.length)return;
 const guilds=new Set<string>();let complete=false,after="0";
 try{
  for(let page=0;page<10;page++){
   const response=await request(`https://discord.com/api/v10/users/@me/guilds?limit=200&after=${after}`,{headers:{Authorization:`Bot ${token}`},cache:"no-store",signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw new Error("Unavailable");
   const rows=await response.json() as {id:string}[];if(!Array.isArray(rows)||rows.some(row=>!/^\d{1,32}$/.test(row.id)||BigInt(row.id)<=BigInt(after)))throw new Error("Malformed roster");
   for(const row of rows)guilds.add(row.id);
   if(rows.length<200){complete=true;break;}
   after=rows.reduce((largest,row)=>BigInt(row.id)>BigInt(largest)?row.id:largest,after);
  }
 }catch{/* Unknown evidence below; never infer absence. */}
 db.transaction(()=>{
  for(const row of due){
   const present=guilds.has(row.discord_guild_id),confirmedMissing=!present&&complete&&Boolean(row.bot_missing_since_utc&&Date.parse(atUtc)-Date.parse(row.bot_missing_since_utc)>=60000);
   const state=present?'connected':confirmedMissing?'not_installed':'unavailable';
   db.prepare(`INSERT INTO traderlink_community_lifecycle(community_id,bot_state,bot_checked_at_utc,bot_missing_since_utc) VALUES(?,?,?,?) ON CONFLICT(community_id) DO UPDATE SET bot_state=excluded.bot_state,bot_checked_at_utc=excluded.bot_checked_at_utc,bot_missing_since_utc=excluded.bot_missing_since_utc`).run(row.community_id,state,atUtc,present?null:complete?(row.bot_missing_since_utc??atUtc):null);
   if(confirmedMissing){db.prepare(`UPDATE traderlink_communities SET status='paused',updated_at_utc=? WHERE community_id=? AND status='active'`).run(atUtc,row.community_id);stopCommunityPendingDeliveries(db,row.community_id,atUtc);}
  }
 })();
}
