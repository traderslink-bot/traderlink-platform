import type Database from "better-sqlite3";
import type {CommunityStatsCoverage,CommunityStatsRequestScope,CommunityStatsTableRow,CommunityStatsWindow} from "../../contracts/community-stats-contracts";
import {statsChannelIdSql} from "./community-stats-channel-selection";
import {resolveStatsWindow,statsRangeCovered,statsSourceObserved} from "./community-stats-coverage";
import {statsHistoryReady} from "./community-stats-history-storage";

/** A missing message is meaningful only after channel history/live observation covers the quiet period. */
export function readStatsStoppedPosting(db:Database.Database,scope:CommunityStatsRequestScope,options:{window:CommunityStatsWindow;channels:readonly string[];coverage:readonly CommunityStatsCoverage[];roleId?:string;page:number;pageSize:number;priorDays:number;quietDays:number;activeDays:number}){
  const {window,channels,coverage,roleId,page,pageSize,priorDays,quietDays,activeDays}=options;
  if(![7,30,90].includes(priorDays)||![7,14,30].includes(quietDays)||![1,3,5].includes(activeDays))throw new RangeError("Invalid posting filters.");
  const bounds=resolveStatsWindow(window),day=86400000;
  // Quiet days are complete UTC dates ending before today's partial date, or at a past selected end date.
  const end=Math.floor(bounds.end/day)*day,quietStart=end-quietDays*day,priorStart=quietStart-priorDays*day;
  const until=new Date(bounds.end).toISOString(),quietFrom=new Date(quietStart).toISOString(),priorFrom=new Date(priorStart).toISOString();
  const columns=["Discord username","Previous messages","Previous posting days","Last message UTC"];
  const notes=[`Posted on at least ${activeDays} days in the ${priorDays} days before the last ${quietDays} complete UTC days, with no posts since. Based on the selected end date and included channels.`];
  // Current heartbeat can trail a request slightly. Only complete days need negative proof;
  // any message already recorded today still excludes that member immediately.
  const settings=db.prepare(`SELECT updated_at_utc,discord_configuration_version FROM community_stats_settings WHERE community_id=?`).get(scope.communityId) as {updated_at_utc:string;discord_configuration_version:number}|undefined;
  const settingsAt=settings?Date.parse(settings.updated_at_utc):Infinity;
  let covered=channels.length>0&&settingsAt<=quietStart&&statsSourceObserved(coverage,scope.communityId,"discord",quietStart,end);
  if(!covered&&channels.length&&statsHistoryReady(db)){
    const jobs=db.prepare(`SELECT channel_id,kind,status,snapshot_at_utc FROM community_stats_history_jobs WHERE community_id=? AND configuration_version=?`).all(scope.communityId,settings?.discord_configuration_version??-1) as {channel_id:string;kind:string;status:string;snapshot_at_utc:string}[];
    const types=new Map((db.prepare(`SELECT channel_id,channel_type FROM community_stats_channels WHERE community_id=?`).all(scope.communityId) as {channel_id:string;channel_type:number}[]).map(row=>[row.channel_id,row.channel_type]));
    const active=jobs.find(job=>job.kind==="active"&&job.status==="complete");
    const live=coverage.filter(row=>row.source==="discord"&&row.state==="observed").map(row=>[Math.max(settingsAt,Date.parse(row.fromUtc)),Date.parse(row.untilUtc)] as const).filter(([left,right])=>left<right);
    covered=channels.every(channel=>{
      const related=jobs.filter(job=>job.channel_id===channel);
      const type=types.get(channel),threadParent=type!==undefined&&[0,5,15,16].includes(type);
      const required=related.filter(job=>job.kind==="messages"||job.kind==="archived");
      if(!required.length||required.some(job=>job.status!=="complete"))return false;
      if(threadParent&&(!active||!required.some(job=>job.kind==="archived")))return false;
      if(![15,16].includes(type??-1)&&!required.some(job=>job.kind==="messages"))return false;
      const snapshot=Math.min(...required.map(job=>Date.parse(job.snapshot_at_utc)),threadParent?Date.parse(active!.snapshot_at_utc):Infinity);
      return statsRangeCovered(quietStart,end,[[Date.parse("2015-01-01T00:00:00.000Z"),snapshot],...live]);
    });
  }
  if(!covered||priorStart<bounds.retainedFrom)return {postingStatus:"needs_tracking" as const,columns,rows:[],totalRows:0,notes};
  const role=roleId?"AND EXISTS(SELECT 1 FROM json_each(n.role_ids_json) role WHERE role.value=@role)":"";
  const sql=`SELECT n.discord_user_id AS memberId,n.username AS "Discord username",sum(e.occurred_at_utc<@quiet) AS "Previous messages",count(DISTINCT CASE WHEN e.occurred_at_utc<@quiet THEN substr(e.occurred_at_utc,1,10) END) AS "Previous posting days",max(e.occurred_at_utc) AS "Last message UTC"
    FROM community_stats_members n JOIN community_stats_events e ON e.community_id=n.community_id AND e.discord_user_id=n.discord_user_id
    WHERE n.community_id=@community AND n.active=1 AND n.is_bot=0 AND n.joined_at_utc<=@quiet ${role}
    AND e.surface='discord' AND e.kind IN('message','thread_reply','forum_post') AND ${statsChannelIdSql(channels,"e")}
    AND e.occurred_at_utc>=@prior AND e.occurred_at_utc<@until
    GROUP BY n.discord_user_id HAVING "Previous posting days">=@days AND sum(e.occurred_at_utc>=@quiet)=0`;
  const params={community:scope.communityId,prior:priorFrom,quiet:quietFrom,until,days:activeDays,...(roleId?{role:roleId}:{})};
  const total=db.prepare(`SELECT count(*) AS n FROM (${sql})`).get(params) as {n:number};
  const rows=db.prepare(`${sql} ORDER BY "Previous messages" DESC,n.discord_user_id LIMIT @limit OFFSET @offset`).all({...params,limit:pageSize,offset:(page-1)*pageSize}) as CommunityStatsTableRow[];
  return {postingStatus:"ready" as const,columns,rows,totalRows:total.n,notes};
}
