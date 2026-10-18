// Also used by the existing Node account-erasure workflow, without a Next.js import condition.
import type Database from "better-sqlite3";
import {CommunityStatsRepository,communityStatsStorageReady} from "./community-stats-repository";
import {statsUtcMs,COMMUNITY_STATS_NAMED_RETENTION_DAYS} from "./community-stats-coverage";

/** Overlapping gap/observed intervals can share the cutoff after trimming; normalize, never collide. */
function trimCoverage(db:Database.Database,cutoff:string):void{
  db.prepare(`DELETE FROM community_stats_coverage WHERE until_utc<=?`).run(cutoff);
  const sources=db.prepare(`SELECT DISTINCT community_id,source FROM community_stats_coverage WHERE from_utc<? AND until_utc>?`).all(cutoff,cutoff) as {community_id:string;source:string}[];
  for(const source of sources){
    const rows=db.prepare(`SELECT from_utc,until_utc,state,reason FROM community_stats_coverage WHERE community_id=? AND source=? ORDER BY from_utc`).all(source.community_id,source.source) as {from_utc:string;until_utc:string;state:"observed"|"gap";reason:string|null}[];
    const events=new Map<string,{observed:number;reasons:Map<string,number>}>();
    const edge=(at:string,state:"observed"|"gap",reason:string|null,delta:number)=>{let value=events.get(at);if(!value){value={observed:0,reasons:new Map()};events.set(at,value);}if(state==="observed")value.observed+=delta;else{const key=reason??"recorded_gap";value.reasons.set(key,(value.reasons.get(key)??0)+delta);}};
    for(const row of rows){const from=row.from_utc<cutoff?cutoff:row.from_utc;if(from>=row.until_utc)continue;edge(from,row.state,row.reason,1);edge(row.until_utc,row.state,row.reason,-1);}
    const boundaries=[...events.keys()].sort(),reasons=new Map<string,number>();let observed=0;
    const normalized:{from:string;until:string;state:"observed"|"gap";reason:string|null}[]=[];
    for(let index=0;index<boundaries.length-1;index++){
      const from=boundaries[index],until=boundaries[index+1],change=events.get(from)!;observed+=change.observed;
      for(const [reason,delta] of change.reasons){const count=(reasons.get(reason)??0)+delta;if(count>0)reasons.set(reason,count);else reasons.delete(reason);}
      if(!reasons.size&&observed<=0)continue;
      const state=reasons.size?"gap":"observed",reason=reasons.size?[...reasons.keys()].sort()[0]:null,last=normalized.at(-1);
      if(last&&last.until===from&&last.state===state&&last.reason===reason)last.until=until;else normalized.push({from,until,state,reason});
    }
    db.prepare(`DELETE FROM community_stats_coverage WHERE community_id=? AND source=?`).run(source.community_id,source.source);
    const insert=db.prepare(`INSERT INTO community_stats_coverage(community_id,source,from_utc,until_utc,state,reason) VALUES(?,?,?,?,?,?)`);
    for(const row of normalized)insert.run(source.community_id,source.source,row.from,row.until,row.state,row.reason);
  }
}

/** Runs independently of page visits, including idle communities. No older named derivative survives. */
export function pruneCommunityStats(db:Database.Database,atUtc:string,limit=500):Readonly<{removed:number}>|null {
  if(!communityStatsStorageReady(db))return null;
  if(!Number.isInteger(limit)||limit<1||limit>5000)throw new Error("Invalid Stats retention batch.");
  const cutoff=new Date(statsUtcMs(atUtc)-COMMUNITY_STATS_NAMED_RETENTION_DAYS*86_400_000).toISOString();
  return new CommunityStatsRepository(db).transaction(()=>{
    let removed=0;
    removed+=db.prepare(`DELETE FROM community_stats_events WHERE (community_id,event_id) IN
      (SELECT community_id,event_id FROM community_stats_events WHERE occurred_at_utc<? ORDER BY occurred_at_utc LIMIT ?)`).run(cutoff,limit).changes;
    for(const table of ["community_stats_identity_links","community_stats_memberships"] as const){
      removed+=db.prepare(`DELETE FROM ${table} WHERE (community_id,discord_user_id,from_utc) IN
        (SELECT community_id,discord_user_id,from_utc FROM ${table} WHERE until_utc<=? ORDER BY until_utc LIMIT ?)`).run(cutoff,limit).changes;
      // Truncate the retained portion and remove the historical join label.
      db.prepare(`UPDATE ${table} SET from_utc=?${table==="community_stats_memberships"?",join_kind='snapshot'":""} WHERE from_utc<? AND (until_utc IS NULL OR until_utc>?)`).run(cutoff,cutoff,cutoff);
    }
    removed+=db.prepare(`DELETE FROM community_stats_members WHERE (community_id,discord_user_id) IN
      (SELECT community_id,discord_user_id FROM community_stats_members WHERE last_observed_at_utc<? ORDER BY last_observed_at_utc LIMIT ?)`).run(cutoff,limit).changes;
    db.prepare(`UPDATE community_stats_members SET first_observed_at_utc=? WHERE first_observed_at_utc<?`).run(cutoff,cutoff);
    db.prepare(`UPDATE community_stats_members SET joined_at_utc=NULL WHERE joined_at_utc<?`).run(cutoff);
    db.prepare(`UPDATE community_stats_memberships SET joined_at_utc=NULL,join_kind='snapshot' WHERE joined_at_utc<?`).run(cutoff);
    removed+=db.prepare(`DELETE FROM community_stats_settings_audit WHERE audit_id IN
      (SELECT audit_id FROM community_stats_settings_audit WHERE occurred_at_utc<? ORDER BY occurred_at_utc LIMIT ?)`).run(cutoff,limit).changes;
    removed+=db.prepare(`DELETE FROM community_stats_voice_state WHERE from_utc<?`).run(cutoff).changes;
    trimCoverage(db,cutoff);
    return Object.freeze({removed});
  });
}

/** Called by the approved erasure integration before auth identity rows are anonymized. */
export function eraseCommunityStatsIdentity(db:Database.Database,platformUserId:string):void {
  if(!communityStatsStorageReady(db))return;
  new CommunityStatsRepository(db).transaction(()=>{
    const current=db.prepare(`SELECT auth_subject AS id FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'`).all(platformUserId) as {id:string}[];
    const currentIds=JSON.stringify(current.map(identity=>identity.id));
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
  const cutoff=new Date(statsUtcMs(atUtc)-90*86_400_000).toISOString();
  return db.prepare(`SELECT e.community_id,e.event_id,e.discord_user_id,e.platform_user_id,e.kind,e.occurred_at_utc,e.received_at_utc,e.content_id,e.canonical_content_id,e.placement_id,e.content_type,e.title,e.path,e.username,e.display_name,e.nickname,e.nickname_state,e.identity_observed_at_utc
    FROM community_stats_events e WHERE e.occurred_at_utc>=? AND (? IS NULL OR e.community_id=?) AND(e.platform_user_id=? OR(e.surface='discord' AND EXISTS(SELECT 1 FROM community_stats_identity_links l WHERE l.platform_user_id=? AND l.community_id=e.community_id AND l.discord_user_id=e.discord_user_id AND e.occurred_at_utc>=l.from_utc AND(l.until_utc IS NULL OR e.occurred_at_utc<l.until_utc)))) ORDER BY e.occurred_at_utc,e.event_id`).all(cutoff,communityId??null,communityId??null,platformUserId,platformUserId);
}
