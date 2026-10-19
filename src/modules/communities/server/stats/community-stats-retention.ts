// Also used by the existing Node account-erasure workflow, without a Next.js import condition.
import type Database from "better-sqlite3";
import {CommunityStatsRepository,communityStatsStorageReady} from "./community-stats-repository";
import {statsUtcMs} from "./community-stats-coverage";
import {statsHistoryIdentityHash,statsHistoryReady} from "./community-stats-history-storage";

/** Owner policy: retain Stats history indefinitely. Explicit identity deletion remains below. */
export function pruneCommunityStats(db:Database.Database,atUtc:string,limit=500):Readonly<{removed:number}>|null {
  statsUtcMs(atUtc);
  if(!Number.isInteger(limit)||limit<1||limit>5000)throw new Error("Invalid Stats maintenance batch.");
  return communityStatsStorageReady(db)?Object.freeze({removed:0}):null;
}

/** Called by the approved erasure integration before auth identity rows are anonymized. */
export function eraseCommunityStatsIdentity(db:Database.Database,platformUserId:string):void {
  if(!communityStatsStorageReady(db))return;
  new CommunityStatsRepository(db).transaction(()=>{
    const current=db.prepare(`SELECT auth_subject AS id FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'`).all(platformUserId) as {id:string}[];
    const currentIds=JSON.stringify(current.map(identity=>identity.id));
    if(statsHistoryReady(db)){
      const identities=db.prepare(`SELECT DISTINCT community_id,discord_user_id FROM community_stats_identity_links WHERE platform_user_id=? UNION SELECT community_id,discord_user_id FROM community_stats_members WHERE discord_user_id IN(SELECT value FROM json_each(?))`).all(platformUserId,currentIds) as {community_id:string;discord_user_id:string}[];
      const erasedAt=new Date().toISOString();
      for(const identity of identities)db.prepare(`INSERT INTO community_stats_history_exclusions VALUES(?,?,?) ON CONFLICT(community_id,identity_hash) DO UPDATE SET erased_at_utc=excluded.erased_at_utc`).run(identity.community_id,statsHistoryIdentityHash(identity.community_id,identity.discord_user_id),erasedAt);
    }
    const affected=db.prepare(`SELECT DISTINCT community_id FROM community_stats_members WHERE discord_user_id IN(SELECT value FROM json_each(?))`).all(currentIds) as {community_id:string}[];
    // An old link must never erase another Platform account's subsequent webpage visits.
    db.prepare(`DELETE FROM community_stats_events AS e WHERE e.platform_user_id=? OR(e.surface='discord' AND(e.discord_user_id IN(SELECT value FROM json_each(?)) OR EXISTS(SELECT 1 FROM community_stats_identity_links l WHERE l.platform_user_id=? AND l.community_id=e.community_id AND l.discord_user_id=e.discord_user_id AND e.occurred_at_utc>=l.from_utc AND(l.until_utc IS NULL OR e.occurred_at_utc<l.until_utc))))`).run(platformUserId,currentIds,platformUserId);
    for(const table of ["community_stats_members","community_stats_memberships","community_stats_voice_state"] as const)db.prepare(`DELETE FROM ${table} WHERE discord_user_id IN(SELECT value FROM json_each(?))`).run(currentIds);
    db.prepare(`DELETE FROM community_stats_identity_links WHERE platform_user_id=?`).run(platformUserId);
    const erasedAt=new Date().toISOString();
    for(const community of affected)db.prepare(`UPDATE community_stats_source_state SET status='gap',checked_at_utc=?,reason='Refreshing roster after account deletion.' WHERE community_id=? AND source IN('discord','membership') AND status IN('collecting','connecting')`).run(erasedAt,community.community_id);
    db.prepare(`DELETE FROM community_stats_settings_audit WHERE actor_user_id=?`).run(platformUserId);
    db.prepare(`DELETE FROM community_stats_settings_audit WHERE EXISTS(SELECT 1 FROM json_each(settings_json,'$.ownContentUserIds') WHERE value=?) OR EXISTS(SELECT 1 FROM json_each(settings_json,'$.exportUserIds') WHERE value=?)`).run(platformUserId,platformUserId);
    const settings=db.prepare(`SELECT community_id,own_content_user_ids_json,export_user_ids_json FROM community_stats_settings`).all() as {community_id:string;own_content_user_ids_json:string;export_user_ids_json:string}[];
    for(const row of settings){
      const own=(JSON.parse(row.own_content_user_ids_json) as string[]).filter(id=>id!==platformUserId);
      const exports=(JSON.parse(row.export_user_ids_json) as string[]).filter(id=>id!==platformUserId);
      if(JSON.stringify(own)!==row.own_content_user_ids_json||JSON.stringify(exports)!==row.export_user_ids_json)db.prepare(`UPDATE community_stats_settings SET revision=revision+1,updated_at_utc=?,own_content_user_ids_json=?,export_user_ids_json=? WHERE community_id=?`).run(erasedAt,JSON.stringify(own),JSON.stringify(exports),row.community_id);
    }
  });
}

export function exportCommunityStatsIdentity(db:Database.Database,platformUserId:string,atUtc=new Date().toISOString(),communityId?:string):readonly unknown[] {
  if(!communityStatsStorageReady(db))return [];
  const cutoff="2015-01-01T00:00:00.000Z";
  return db.prepare(`SELECT e.community_id,e.event_id,e.discord_user_id,e.platform_user_id,e.kind,e.occurred_at_utc,e.received_at_utc,e.content_id,e.canonical_content_id,e.placement_id,e.content_type,e.title,e.path,e.username,e.display_name,e.nickname,e.nickname_state,e.identity_observed_at_utc
    FROM community_stats_events e WHERE e.occurred_at_utc>=? AND (? IS NULL OR e.community_id=?) AND(e.platform_user_id=? OR(e.surface='discord' AND EXISTS(SELECT 1 FROM community_stats_identity_links l WHERE l.platform_user_id=? AND l.community_id=e.community_id AND l.discord_user_id=e.discord_user_id AND e.occurred_at_utc>=l.from_utc AND(l.until_utc IS NULL OR e.occurred_at_utc<l.until_utc)))) ORDER BY e.occurred_at_utc,e.event_id`).all(cutoff,communityId??null,communityId??null,platformUserId,platformUserId);
}
