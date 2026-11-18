import type Database from "better-sqlite3";

export type StatsOlderPageCounts=Readonly<{pageViews:number;accounts:number;fromDate:string|null;throughDate:string|null}>;

/** Settings-only reference counts. Never combine the older counter with visit-event totals. */
export function readStatsOlderPageCounts(db:Database.Database,scope:{communityId:string;isOwner:boolean},paths:readonly string[]):StatsOlderPageCounts|null{
  if(!scope.isOwner||!db.prepare(`SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_community_activity_daily_members'`).get())return null;
  return db.prepare(`SELECT coalesce(sum(views),0) AS pageViews,count(DISTINCT user_id) AS accounts,min(activity_day) AS fromDate,max(activity_day) AS throughDate
    FROM traderlink_community_activity_daily_members WHERE community_id=? AND path IN(SELECT value FROM json_each(?))`)
    .get(scope.communityId,JSON.stringify([...new Set(paths)])) as StatsOlderPageCounts;
}
