import type Database from "better-sqlite3";
import type {CommunityStatsTableRow} from "../../contracts/community-stats-contracts";
import {statsHistoryReady} from "./community-stats-history-storage";

export function readStatsHistory(db:Database.Database,communityId:string,from:string,until:string,page:number,pageSize:number,roleId?:string){
  if(!statsHistoryReady(db))return [];
  const count=db.prepare(`SELECT count(*) AS n FROM community_stats_history_jobs j JOIN community_stats_settings s ON s.community_id=j.community_id AND s.discord_configuration_version=j.configuration_version WHERE j.community_id=?`).get(communityId) as {n:number};
  const jobs=db.prepare(`SELECT coalesce(c.name,j.channel_id) AS Channel,j.kind AS Kind,CASE j.status WHEN 'complete' THEN 'Scan complete; history incomplete' WHEN 'running' THEN 'Scanning' WHEN 'blocked' THEN 'Inaccessible; partial history' ELSE 'Pending' END AS Status,j.scanned AS "Records scanned",j.recovered AS "Messages imported",j.oldest_at_utc AS "Oldest scanned UTC",j.snapshot_at_utc AS "Scan started UTC",j.checked_at_utc AS "Checked UTC",coalesce(j.reason,'Recovery pending or in progress; history is incomplete.') AS Coverage
    FROM community_stats_history_jobs j JOIN community_stats_settings s ON s.community_id=j.community_id AND s.discord_configuration_version=j.configuration_version LEFT JOIN community_stats_channels c ON c.community_id=j.community_id AND c.channel_id=j.channel_id
    WHERE j.community_id=? ORDER BY j.channel_id,j.kind LIMIT ? OFFSET ?`).all(communityId,pageSize,(page-1)*pageSize) as CommunityStatsTableRow[];
  const sections=[{title:"Historical recovery",columns:["Channel","Kind","Status","Records scanned","Messages imported","Oldest scanned UTC","Scan started UTC","Checked UTC","Coverage"],rows:jobs,totalRows:count.n,page,pageSize}];
  const role=roleId?` AND e.discord_user_id IN(SELECT n.discord_user_id FROM community_stats_members n,json_each(n.role_ids_json) r WHERE n.community_id=e.community_id AND n.active=1 AND r.value=@roleId)`:"";
  const evidence=db.prepare(`SELECT evidence AS Evidence,count(*) AS Messages,min(occurred_at_utc) AS "First message UTC",max(occurred_at_utc) AS "Last message UTC" FROM community_stats_events e WHERE community_id=@communityId AND surface='discord' AND kind IN('message','thread_reply','forum_post') AND occurred_at_utc>=@from AND occurred_at_utc<@until ${role} GROUP BY evidence`).all({communityId,from,until,...(roleId?{roleId}:{})}) as CommunityStatsTableRow[];
  sections.push({title:"Message evidence",columns:["Evidence","Messages","First message UTC","Last message UTC"],rows:evidence,totalRows:evidence.length,page:1,pageSize});
  const joins=db.prepare(`SELECT substr(joined_at_utc,1,7) AS "Join month UTC",count(*) AS "Current members",'Current roster join dates only; departed members and earlier rejoin history are incomplete.' AS Coverage FROM community_stats_members n WHERE community_id=@communityId AND active=1 AND is_bot=0 AND joined_at_utc>=@from AND joined_at_utc<@until ${roleId?" AND EXISTS(SELECT 1 FROM json_each(n.role_ids_json) r WHERE r.value=@roleId)":""} GROUP BY substr(joined_at_utc,1,7) ORDER BY "Join month UTC"`).all({communityId,from,until,...(roleId?{roleId}:{})}) as CommunityStatsTableRow[];
  sections.push({title:"Recovered member join dates",columns:["Join month UTC","Current members","Coverage"],rows:joins.slice((page-1)*pageSize,page*pageSize),totalRows:joins.length,page,pageSize});
  // Snapshots have no individual reactor evidence, so they cannot honor a member/role filter.
  if(!roleId){
    const snapshots=db.prepare(`SELECT coalesce(c.name,r.channel_id) AS Channel,sum(r.reactions) AS "Current reactions",count(*) AS "Messages scanned",max(r.observed_at_utc) AS "Snapshot UTC",'Current snapshot, including bots; reaction dates unavailable. Selected dates refer to message creation.' AS Coverage FROM community_stats_reaction_snapshots r LEFT JOIN community_stats_channels c ON c.community_id=r.community_id AND c.channel_id=r.channel_id WHERE r.community_id=? AND r.message_at_utc>=? AND r.message_at_utc<? GROUP BY r.channel_id ORDER BY r.channel_id`).all(communityId,from,until) as CommunityStatsTableRow[];
    sections.push({title:"Recovered reaction snapshots",columns:["Channel","Current reactions","Messages scanned","Snapshot UTC","Coverage"],rows:snapshots.slice((page-1)*pageSize,page*pageSize),totalRows:snapshots.length,page,pageSize});
  }
  return sections;
}
