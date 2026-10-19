import type Database from "better-sqlite3";
import type {CommunityStatsTableRow} from "../../contracts/community-stats-contracts";
import {statsHistoryReady} from "./community-stats-history-storage";

export function readStatsHistory(db:Database.Database,communityId:string,from:string,until:string,page:number,pageSize:number,roleId?:string,channelIds:readonly string[]=[]){
  if(!statsHistoryReady(db))return [];
  const sections: {title:string;columns:string[];rows:CommunityStatsTableRow[];totalRows:number;page:number;pageSize:number}[]=[];
  const joins=db.prepare(`SELECT substr(joined_at_utc,1,7) AS "Join month UTC",count(*) AS "Current members" FROM community_stats_members n WHERE community_id=@communityId AND active=1 AND is_bot=0 AND joined_at_utc>=@from AND joined_at_utc<@until ${roleId?" AND EXISTS(SELECT 1 FROM json_each(n.role_ids_json) r WHERE r.value=@roleId)":""} GROUP BY substr(joined_at_utc,1,7) ORDER BY "Join month UTC"`).all({communityId,from,until,...(roleId?{roleId}:{})}) as CommunityStatsTableRow[];
  sections.push({title:"Member joins",columns:["Join month UTC","Current members"],rows:joins.slice((page-1)*pageSize,page*pageSize),totalRows:joins.length,page,pageSize});
  // Snapshots have no individual reactor evidence, so they cannot honor a member/role filter.
  if(!roleId){
    const snapshots=db.prepare(`SELECT coalesce(c.name,r.channel_id) AS Channel,sum(r.reactions) AS "Current reactions",count(*) AS "Messages",max(r.observed_at_utc) AS "Updated UTC" FROM community_stats_reaction_snapshots r LEFT JOIN community_stats_channels c ON c.community_id=r.community_id AND c.channel_id=r.channel_id WHERE r.channel_id IN(SELECT value FROM json_each(?)) AND r.community_id=? AND r.message_at_utc>=? AND r.message_at_utc<? GROUP BY r.channel_id ORDER BY r.channel_id`).all(JSON.stringify(channelIds),communityId,from,until) as CommunityStatsTableRow[];
    sections.push({title:"Reactions",columns:["Channel","Current reactions","Messages","Updated UTC"],rows:snapshots.slice((page-1)*pageSize,page*pageSize),totalRows:snapshots.length,page,pageSize});
  }
  return sections;
}
