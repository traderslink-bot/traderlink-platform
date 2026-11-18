import type Database from "better-sqlite3";
import {assertCanonicalUtcTimestamp} from "../../platform/server/database/platform-migration-contract";

export const COMMUNITY_CONTENT_RAW_VISIT_RETENTION_DAYS=90;

/** Rolls up completed UTC days, then prunes only raw branded-page visits already represented by a rollup. */
export function maintainCommunityContentStats(db:Database.Database,atUtc:string,dayLimit=7,deleteLimit=500){
 assertCanonicalUtcTimestamp(atUtc,"atUtc");
 if(!Number.isInteger(dayLimit)||dayLimit<1||dayLimit>31||!Number.isInteger(deleteLimit)||deleteLimit<1||deleteLimit>5000)throw new Error("Invalid Community content Stats maintenance limit.");
 if(!(db.prepare("SELECT 1 present FROM sqlite_schema WHERE type='table' AND name='traderlink_community_content_daily_stats'").get() as {present:number}|undefined))return {days:0,rolledUp:0,pruned:0};
 const currentDay=atUtc.slice(0,10),cutoff=new Date(Date.parse(atUtc)-COMMUNITY_CONTENT_RAW_VISIT_RETENTION_DAYS*86_400_000).toISOString();
 const operation=()=>{
  const days=db.prepare(`SELECT DISTINCT substr(occurred_at_utc,1,10) activity_day FROM community_stats_events WHERE surface='web' AND kind='web_visit' AND page_id IS NOT NULL AND substr(occurred_at_utc,1,10)<? ORDER BY activity_day LIMIT ?`).all(currentDay,dayLimit) as {activity_day:string}[];
  let rolledUp=0;
  for(const {activity_day:day} of days){
   const next=new Date(Date.parse(`${day}T00:00:00.000Z`)+86_400_000).toISOString();
   db.prepare(`DELETE FROM traderlink_community_content_daily_stats WHERE activity_day=?`).run(day);
   rolledUp+=db.prepare(`INSERT INTO traderlink_community_content_daily_stats(community_id,page_id,activity_day,category_id,publisher_user_id,visits,unique_members,content_opens,last_rolled_up_at_utc)
    SELECT community_id,page_id,substr(occurred_at_utc,1,10),coalesce(category_id,''),coalesce(publisher_user_id,''),count(*),count(DISTINCT platform_user_id),count(DISTINCT CASE WHEN content_id<>page_id THEN content_id END),?
    FROM community_stats_events WHERE surface='web' AND kind='web_visit' AND page_id IS NOT NULL AND occurred_at_utc>=? AND occurred_at_utc<?
    GROUP BY community_id,page_id,substr(occurred_at_utc,1,10),coalesce(category_id,''),coalesce(publisher_user_id,'')`).run(atUtc,`${day}T00:00:00.000Z`,next).changes;
  }
  const pruned=db.prepare(`DELETE FROM community_stats_events WHERE (community_id,event_id) IN (
   SELECT event.community_id,event.event_id FROM community_stats_events event
   WHERE event.surface='web' AND event.kind='web_visit' AND event.page_id IS NOT NULL AND event.occurred_at_utc<?
    AND EXISTS(SELECT 1 FROM traderlink_community_content_daily_stats daily WHERE daily.community_id=event.community_id AND daily.page_id=event.page_id AND daily.activity_day=substr(event.occurred_at_utc,1,10))
   ORDER BY event.occurred_at_utc,event.event_id LIMIT ?
  )`).run(cutoff,deleteLimit).changes;
  return {days:days.length,rolledUp,pruned};
 };
 return db.inTransaction?operation():db.transaction(operation).immediate();
}
