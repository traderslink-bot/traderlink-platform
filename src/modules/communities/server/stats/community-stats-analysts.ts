import "server-only";
import {communityStatsIsAnalystPost} from "./community-stats-catalog";
import type Database from "better-sqlite3";
import type {CommunityStatsContent,CommunityStatsTableRow} from "../../contracts/community-stats-contracts";

/** Catalog access has already been resolved for this community and actor. */
export function readStatsAnalysts(db:Database.Database,communityId:string,catalog:readonly CommunityStatsContent[],from:string,until:string,webAvailable:boolean,roleId?:string):CommunityStatsTableRow[]{
  const posts=catalog.filter(item=>communityStatsIsAnalystPost(item)&&(!item.publishedAtUtc||item.publishedAtUtc<until));
  if(!posts.length)return [];
  const content=JSON.stringify(posts.map(item=>({id:item.id,analyst:item.authorUserId})));
  const eligible=`WITH content AS (SELECT json_extract(value,'$.id') AS id,json_extract(value,'$.analyst') AS analyst FROM json_each(@content)), visits AS (SELECT e.content_id,e.discord_user_id,e.occurred_at_utc,c.analyst FROM community_stats_events e JOIN content c ON c.id=e.content_id WHERE e.community_id=@communityId AND e.surface='web' AND e.occurred_at_utc>=@from AND e.occurred_at_utc<@until ${roleId?"AND e.discord_user_id IN(SELECT n.discord_user_id FROM community_stats_members n,json_each(n.role_ids_json) r WHERE n.community_id=@communityId AND n.active=1 AND r.value=@roleId)":""})`;
  const params={content,communityId,from,until,...(roleId?{roleId}:{})};
  const audience=db.prepare(`${eligible}, viewers AS (SELECT analyst,discord_user_id,count(*) AS views,count(DISTINCT substr(occurred_at_utc,1,10)) AS dates,max(occurred_at_utc) AS last FROM visits GROUP BY analyst,discord_user_id) SELECT analyst,sum(views) AS views,count(*) AS viewers,sum(dates>1) AS returning,max(last) AS last FROM viewers GROUP BY analyst`).all(params) as {analyst:string;views:number;viewers:number;returning:number;last:string}[];
  const perPost=db.prepare(`${eligible} SELECT content_id AS id,count(DISTINCT discord_user_id) AS viewers FROM visits GROUP BY content_id`).all(params) as {id:string;viewers:number}[];
  const byAnalyst=new Map(audience.map(row=>[row.analyst,row])),byPost=new Map(perPost.map(row=>[row.id,row.viewers]));
  const groups=new Map<string,CommunityStatsContent[]>();
  for(const post of posts){const id=post.authorUserId!,group=groups.get(id);if(group)group.push(post);else groups.set(id,[post]);}
  return [...groups].map(([id,pages])=>{
    const stats=byAnalyst.get(id),tracked=pages.filter(item=>item.mode==="tracked_page"||byPost.has(item.id));
    const hasMeasurement=!!stats||webAvailable&&tracked.length>0;
    const average=tracked.length&&(webAvailable||tracked.every(item=>byPost.has(item.id)))?Math.round(tracked.reduce((sum,item)=>sum+(byPost.get(item.id)??0),0)/tracked.length*10)/10:null;
    return {authorId:id,Analyst:pages.find(item=>item.authorName)?.authorName??"Former analyst",Alerts:pages.filter(item=>item.type==="alert").length,Watchlists:pages.filter(item=>item.type==="watchlist").length,Viewers:hasMeasurement?stats?.viewers??0:null,"Returning viewers":hasMeasurement?stats?.returning??0:null,Views:hasMeasurement?stats?.views??0:null,"Avg viewers per post":average,"Last view UTC":stats?.last??null};
  }).sort((a,b)=>(b.Viewers??-1)-(a.Viewers??-1)||(b.Views??-1)-(a.Views??-1)||a.Analyst.localeCompare(b.Analyst)||a.authorId.localeCompare(b.authorId));
}
