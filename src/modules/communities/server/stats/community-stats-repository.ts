// A database handle is supplied by an authorized server/CLI caller; imports never open storage.
import type Database from "better-sqlite3";
import type { CommunityStatsIdentitySnapshot, CommunityStatsNativeMember, CommunityStatsSource, CommunityStatsStoredEvent } from "../../contracts/community-stats-contracts";
import { statsUtcMs } from "./community-stats-coverage";

export const COMMUNITY_STATS_TABLES=Object.freeze([
  "community_stats_settings","community_stats_members","community_stats_memberships","community_stats_identity_links",
  "community_stats_events","community_stats_coverage","community_stats_source_state","community_stats_channels","community_stats_voice_state",
  "community_stats_settings_audit",
  "community_stats_roles",
]);
export function communityStatsStorageReady(db:Database.Database):boolean {
  const rows=db.prepare(`SELECT name FROM sqlite_schema WHERE type='table' AND name IN (SELECT value FROM json_each(?))`)
    .all(JSON.stringify(COMMUNITY_STATS_TABLES)) as {name:string}[];
  return rows.length===COMMUNITY_STATS_TABLES.length;
}
export class CommunityStatsRepository {
  constructor(readonly db:Database.Database){}
  transaction<T>(operation:()=>T):T {return this.db.inTransaction?operation():this.db.transaction(operation).immediate();}
  ensureCommunity(communityId:string,atUtc:string):void {
    statsUtcMs(atUtc);
    this.db.prepare(`INSERT INTO community_stats_settings(community_id,created_at_utc,updated_at_utc)
      VALUES(?,?,?) ON CONFLICT(community_id) DO NOTHING`).run(communityId,atUtc,atUtc);
  }
  recordEvent(communityId:string,event:CommunityStatsStoredEvent):boolean {
    if(event.kind==="voice_participation")return false;
    const received=statsUtcMs(event.receivedAtUtc),at=statsUtcMs(event.occurredAtUtc);
    if(at>received+5000||at<Date.parse("2015-01-01T00:00:00.000Z")||!event.eventId||event.eventId.length>180
      || !/^\d{1,32}$/u.test(event.discordUserId)||!Number.isInteger(event.durationSeconds)||event.durationSeconds<0)throw new Error("Invalid Stats event.");
    const old=this.db.prepare(`SELECT discord_user_id,platform_user_id,kind,content_id,path,canonical_content_id,placement_id,page_id FROM community_stats_events
      WHERE community_id=? AND event_id=?`).get(communityId,event.eventId) as {discord_user_id:string;platform_user_id:string|null;kind:string;content_id:string|null;path:string|null;canonical_content_id:string|null;placement_id:string|null;page_id:string|null}|undefined;
    if(old){
      if(old.discord_user_id!==event.discordUserId||old.platform_user_id!==event.platformUserId||old.kind!==event.kind||old.content_id!==event.contentId||old.path!==event.path||old.canonical_content_id!==(event.canonicalContentId??null)||old.placement_id!==(event.placementId??null)||old.page_id!==(event.pageId??null))throw new Error("Conflicting Stats event identity.");
      return false;
    }
    this.db.prepare(`INSERT INTO community_stats_events(community_id,event_id,discord_user_id,platform_user_id,surface,kind,
      occurred_at_utc,received_at_utc,content_id,content_type,title,path,author_user_id,username,display_name,nickname,
      identity_observed_at_utc,channel_id,duration_seconds,reply_to_event_id,reply_delay_seconds,source_link_id,canonical_content_id,placement_id,nickname_state,page_id,category_id,publisher_user_id)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(communityId,event.eventId,event.discordUserId,event.platformUserId,event.surface,event.kind,
      event.occurredAtUtc,event.receivedAtUtc,event.contentId,event.contentType,event.title,event.path,event.authorUserId,event.username,event.displayName,event.nickname,
      event.identityObservedAtUtc,event.channelId,event.durationSeconds,event.replyToEventId,event.replyDelaySeconds,event.sourceLinkId,event.canonicalContentId??null,event.placementId??null,event.nicknameState??"not_collected",event.pageId??null,event.categoryId??null,event.publisherUserId??null);
    this.db.prepare(`UPDATE community_stats_source_state SET last_event_at_utc=max(coalesce(last_event_at_utc,''),?) WHERE community_id=? AND source=?`)
      .run(event.occurredAtUtc,communityId,event.surface);
    return true;
  }
  nativeMember(communityId:string,member:CommunityStatsNativeMember,atUtc:string,kind:"observed_join"|"snapshot"="snapshot"):void {
    statsUtcMs(atUtc);if(!/^\d{1,32}$/u.test(member.discordUserId)||member.username.length<1||member.username.length>80)throw new Error("Invalid Stats member.");
    const joinedAt=member.joinedAtUtc&&statsUtcMs(member.joinedAtUtc)<=statsUtcMs(atUtc)?member.joinedAtUtc:null;
    const old=this.db.prepare(`SELECT active,joined_at_utc FROM community_stats_members WHERE community_id=? AND discord_user_id=?`).get(communityId,member.discordUserId) as {active:number;joined_at_utc:string|null}|undefined;
    const changedJoin=old?.active===1&&old.joined_at_utc&&joinedAt&&old.joined_at_utc!==joinedAt;
    if(changedJoin)this.leave(communityId,member.discordUserId,atUtc,"snapshot_absent");
    this.db.prepare(`INSERT INTO community_stats_members(community_id,discord_user_id,username,display_name,nickname,role_ids_json,is_bot,active,
      joined_at_utc,first_observed_at_utc,last_observed_at_utc) VALUES(?,?,?,?,?,?,?,1,?,?,?)
      ON CONFLICT(community_id,discord_user_id) DO UPDATE SET username=excluded.username,display_name=excluded.display_name,
      nickname=CASE WHEN ?=1 THEN community_stats_members.nickname ELSE excluded.nickname END,role_ids_json=CASE WHEN ?=1 THEN community_stats_members.role_ids_json ELSE excluded.role_ids_json END,is_bot=excluded.is_bot,active=1,
      joined_at_utc=coalesce(excluded.joined_at_utc,community_stats_members.joined_at_utc),last_observed_at_utc=excluded.last_observed_at_utc`)
      .run(communityId,member.discordUserId,member.username,member.displayName,member.nickname,JSON.stringify(member.roleIds),member.isBot?1:0,joinedAt,atUtc,atUtc,member.nicknameObserved===false?1:0,member.rolesObserved===false?1:0);
    // A roster can supply the join date after an identity-only webpage observation.
    // Fill that metadata without backdating the interval during which membership was tracked.
    if(joinedAt)this.db.prepare(`UPDATE community_stats_memberships SET joined_at_utc=coalesce(joined_at_utc,?) WHERE community_id=? AND discord_user_id=? AND until_utc IS NULL AND join_kind='snapshot'`).run(joinedAt,communityId,member.discordUserId);
    const active=this.db.prepare(`SELECT 1 FROM community_stats_memberships WHERE community_id=? AND discord_user_id=? AND until_utc IS NULL`).get(communityId,member.discordUserId);
    if(!active){
      const previous=this.db.prepare(`SELECT 1 FROM community_stats_memberships WHERE community_id=? AND discord_user_id=? LIMIT 1`).get(communityId,member.discordUserId);
      this.db.prepare(`INSERT INTO community_stats_memberships(community_id,discord_user_id,from_utc,joined_at_utc,join_kind) VALUES(?,?,?,?,?)
        ON CONFLICT(community_id,discord_user_id,from_utc) DO NOTHING`).run(communityId,member.discordUserId,atUtc,joinedAt,kind==="snapshot"||!joinedAt?"snapshot":previous?"rejoin":"observed_join");
    }
  }
  leave(communityId:string,discordUserId:string,atUtc:string,kind:"observed_leave"|"snapshot_absent"="observed_leave"):void {
    statsUtcMs(atUtc);
    this.db.prepare(`UPDATE community_stats_members SET active=0,last_observed_at_utc=? WHERE community_id=? AND discord_user_id=?`).run(atUtc,communityId,discordUserId);
    this.db.prepare(`UPDATE community_stats_memberships SET until_utc=?,end_kind=? WHERE community_id=? AND discord_user_id=? AND until_utc IS NULL AND from_utc<=?`).run(atUtc,kind,communityId,discordUserId,atUtc);
    this.db.prepare(`UPDATE community_stats_identity_links SET until_utc=? WHERE community_id=? AND discord_user_id=? AND until_utc IS NULL AND from_utc<=?`).run(atUtc,communityId,discordUserId,atUtc);
  }
  identityLink(identity:CommunityStatsIdentitySnapshot,atUtc:string):void {
    const old=this.db.prepare(`SELECT discord_user_id FROM community_stats_identity_links WHERE community_id=? AND platform_user_id=? AND until_utc IS NULL`).get(identity.communityId,identity.platformUserId) as {discord_user_id:string}|undefined;
    if(old?.discord_user_id===identity.discordUserId)return;
    this.db.prepare(`UPDATE community_stats_identity_links SET until_utc=? WHERE community_id=? AND until_utc IS NULL AND (platform_user_id=? OR discord_user_id=?)`)
      .run(atUtc,identity.communityId,identity.platformUserId,identity.discordUserId);
    this.db.prepare(`INSERT INTO community_stats_identity_links(community_id,platform_user_id,discord_user_id,from_utc) VALUES(?,?,?,?)`)
      .run(identity.communityId,identity.platformUserId,identity.discordUserId,atUtc);
  }
  source(communityId:string,source:CommunityStatsSource,status:"not_configured"|"connecting"|"collecting"|"gap"|"unavailable"|"disabled",atUtc:string,reason:string|null=null):void {
    statsUtcMs(atUtc);
    this.db.prepare(`INSERT INTO community_stats_source_state(community_id,source,status,since_utc,checked_at_utc,reason)
      VALUES(?,?,?,?,?,?) ON CONFLICT(community_id,source) DO UPDATE SET status=excluded.status,checked_at_utc=excluded.checked_at_utc,reason=excluded.reason`)
      .run(communityId,source,status,atUtc,atUtc,reason);
  }
  coverage(communityId:string,source:CommunityStatsSource,fromUtc:string,untilUtc:string,state:"observed"|"gap",reason:string|null=null):void {
    if(statsUtcMs(untilUtc)<=statsUtcMs(fromUtc))return;
    const previous=this.db.prepare(`SELECT from_utc,until_utc,state FROM community_stats_coverage WHERE community_id=? AND source=? ORDER BY until_utc DESC LIMIT 1`)
      .get(communityId,source) as {from_utc:string;until_utc:string;state:string}|undefined;
    if(previous&&previous.state===state&&previous.until_utc===fromUtc){
      this.db.prepare(`UPDATE community_stats_coverage SET until_utc=? WHERE community_id=? AND source=? AND from_utc=?`).run(untilUtc,communityId,source,previous.from_utc);
    }else this.db.prepare(`INSERT INTO community_stats_coverage(community_id,source,from_utc,until_utc,state,reason) VALUES(?,?,?,?,?,?)
      ON CONFLICT(community_id,source,from_utc) DO UPDATE SET until_utc=max(until_utc,excluded.until_utc),state=CASE WHEN state='gap' OR excluded.state='gap' THEN 'gap' ELSE 'observed' END,reason=CASE WHEN excluded.state='gap' THEN excluded.reason ELSE reason END`)
      .run(communityId,source,fromUtc,untilUtc,state,reason);
  }
}
