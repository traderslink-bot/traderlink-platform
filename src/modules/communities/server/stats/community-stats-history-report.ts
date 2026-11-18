import type Database from "better-sqlite3";
import type {CommunityStatsTableRow} from "../../contracts/community-stats-contracts";
import {statsHistoryReady} from "./community-stats-history-storage";

export function readStatsHistory(db:Database.Database,communityId:string,from:string,until:string,_page:number,_pageSize:number,roleId?:string){
  if(!statsHistoryReady(db))return [];
  const sections: {title:string;columns:string[];rows:CommunityStatsTableRow[]}[]=[];
  const joins=db.prepare(`SELECT substr(joined_at_utc,1,7) AS "Join month UTC",count(*) AS "Current members" FROM community_stats_members n WHERE community_id=@communityId AND active=1 AND is_bot=0 AND joined_at_utc>=@from AND joined_at_utc<@until ${roleId?" AND EXISTS(SELECT 1 FROM json_each(n.role_ids_json) r WHERE r.value=@roleId)":""} GROUP BY substr(joined_at_utc,1,7) ORDER BY "Join month UTC"`).all({communityId,from,until,...(roleId?{roleId}:{})}) as CommunityStatsTableRow[];
  // Show the selected calendar months rather than silently skipping months with no joins.
  // All time starts at the first known join, not Discord's platform inception date.
  const counts=new Map(joins.map(row=>[String(row["Join month UTC"]),Number(row["Current members"])]));
  const firstMonth=from.startsWith("2015-01-01")&&joins.length?String(joins[0]["Join month UTC"]):from.slice(0,7);
  const monthly:CommunityStatsTableRow[]=[];
  if(joins.length)for(let date=new Date(`${firstMonth}-01T00:00:00.000Z`);date.toISOString()<until;date.setUTCMonth(date.getUTCMonth()+1)){
    const month=date.toISOString().slice(0,7);monthly.push({"Join month UTC":month,"Current members":counts.get(month)??0});
  }
  sections.push({title:"Current members by join month",columns:["Join month UTC","Current members"],rows:monthly});
  return sections;
}
