import {createHash} from "node:crypto";
import type Database from "better-sqlite3";
export const statsHistoryIdentityHash=(communityId:string,userId:string)=>createHash("sha256").update(`${communityId}:${userId}`).digest("hex");
export function statsHistoryReady(db:Database.Database):boolean{return !!db.prepare(`SELECT 1 FROM sqlite_schema WHERE type='table' AND name='community_stats_history_jobs'`).get();}

/** Keep message-history progress across settings versions; a completed channel is never rescanned. */
export function ensureStatsHistoryJob(db:Database.Database,communityId:string,version:number,channelId:string,kind:"messages"|"archived"|"active",at:string,parentId:string|null=null):void{
 if(kind==="messages")db.prepare(`UPDATE community_stats_history_jobs SET (cursor,status,scanned,recovered,oldest_at_utc,snapshot_at_utc,checked_at_utc,retry_at_utc,reason)=(SELECT cursor,status,scanned,recovered,oldest_at_utc,snapshot_at_utc,checked_at_utc,retry_at_utc,reason FROM community_stats_history_jobs WHERE community_id=? AND channel_id=? AND kind='messages' AND status='complete' ORDER BY configuration_version DESC LIMIT 1) WHERE community_id=? AND configuration_version=? AND channel_id=? AND kind='messages' AND status!='complete' AND EXISTS(SELECT 1 FROM community_stats_history_jobs WHERE community_id=? AND channel_id=? AND kind='messages' AND status='complete')`).run(communityId,channelId,communityId,version,channelId,communityId,channelId);
 if(kind==="messages")db.prepare(`INSERT INTO community_stats_history_jobs(community_id,configuration_version,channel_id,parent_id,kind,cursor,status,scanned,recovered,oldest_at_utc,snapshot_at_utc,checked_at_utc,retry_at_utc,reason)
 SELECT community_id,?,channel_id,?,kind,cursor,status,scanned,recovered,oldest_at_utc,snapshot_at_utc,checked_at_utc,retry_at_utc,reason FROM community_stats_history_jobs WHERE community_id=? AND channel_id=? AND kind='messages' ORDER BY (status='complete') DESC,scanned DESC,configuration_version DESC LIMIT 1 ON CONFLICT DO NOTHING`).run(version,parentId,communityId,channelId);
 db.prepare(`INSERT INTO community_stats_history_jobs(community_id,configuration_version,channel_id,parent_id,kind,snapshot_at_utc,checked_at_utc,retry_at_utc) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`).run(communityId,version,channelId,parentId,kind,at,at,at);
}
