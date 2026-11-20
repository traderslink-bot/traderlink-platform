import "server-only";
import {communityStatsIsAnalystPost} from "./community-stats-catalog";
import type Database from "better-sqlite3";
import type {CommunityStatsContent,CommunityStatsTableRow} from "../../contracts/community-stats-contracts";

export const statsContributorId=(item:CommunityStatsContent)=>item.contributorUserId??item.authorUserId;
export const statsContributorName=(item:CommunityStatsContent)=>item.contributorName??item.authorName;
/** One native unit across placements; restoring the same ID is not a new post. */
export function statsPublicationUnits(catalog:readonly CommunityStatsContent[]):CommunityStatsContent[]{
  return [...new Map(catalog.filter(item=>["alert","watchlist"].includes(item.type)&&item.state!=="draft"&&(item.state==="published"||!!item.publishedAtUtc))
    .map(item=>[`${item.type}:${item.targetKind==="watchlist_item"?"item:":""}${item.canonicalId??item.id}`,item])).values()];
}
export function statsPublishedIn(item:CommunityStatsContent,from:string,until:string):boolean{
  return !!item.publishedAtUtc&&item.publishedAtUtc>=from&&item.publishedAtUtc<until;
}

/** Publication counts use first publications in dates; audience includes older posts read in dates. */
export function readStatsAnalysts(db:Database.Database,communityId:string,catalog:readonly CommunityStatsContent[],from:string,until:string,webAvailable:boolean,roleId?:string,attributionCatalog:readonly CommunityStatsContent[]=catalog):CommunityStatsTableRow[]{
  const units=statsPublicationUnits(catalog);
  const posts=units.filter(item=>communityStatsIsAnalystPost(item)&&!!statsContributorId(item)&&(!item.publishedAtUtc||item.publishedAtUtc<until));
  if(!posts.length)return [];
  const content=JSON.stringify(posts.map(item=>({id:item.id,analyst:statsContributorId(item)})));
  const eligible=`WITH content AS (SELECT json_extract(value,'$.id') AS id,json_extract(value,'$.analyst') AS analyst FROM json_each(@content)), visits AS (SELECT e.content_id,e.discord_user_id,e.occurred_at_utc,c.analyst FROM community_stats_events e JOIN content c ON c.id=e.content_id WHERE e.community_id=@communityId AND e.surface='web' AND e.occurred_at_utc>=@from AND e.occurred_at_utc<@until ${roleId?"AND e.discord_user_id IN(SELECT n.discord_user_id FROM community_stats_members n,json_each(n.role_ids_json) r WHERE n.community_id=@communityId AND n.active=1 AND r.value=@roleId)":""})`;
  const params={content,communityId,from,until,...(roleId?{roleId}:{})};
  const audience=db.prepare(`${eligible}, viewers AS (SELECT analyst,discord_user_id,count(*) AS views,count(DISTINCT substr(occurred_at_utc,1,10)) AS dates,max(occurred_at_utc) AS last FROM visits GROUP BY analyst,discord_user_id) SELECT analyst,sum(views) AS views,count(*) AS viewers,sum(dates>1) AS "returning",max(last) AS last FROM viewers GROUP BY analyst`).all(params) as {analyst:string;views:number;viewers:number;returning:number;last:string}[];
  const perPost=db.prepare(`${eligible} SELECT content_id AS id,count(DISTINCT discord_user_id) AS viewers FROM visits GROUP BY content_id`).all(params) as {id:string;viewers:number}[];
  const byAnalyst=new Map(audience.map(row=>[row.analyst,row])),byPost=new Map(perPost.map(row=>[row.id,row.viewers]));
  const groups=new Map<string,CommunityStatsContent[]>();
  for(const post of posts){const id=statsContributorId(post)!;const group=groups.get(id);if(group)group.push(post);else groups.set(id,[post]);}
  const unknownWatchlist=statsPublicationUnits(attributionCatalog).some(item=>item.targetKind==="watchlist_item"&&!statsContributorId(item)&&(!item.publishedAtUtc||statsPublishedIn(item,from,until)));
  return [...groups].map(([id,pages])=>{
    const stats=byAnalyst.get(id),cohort=pages.filter(item=>statsPublishedIn(item,from,until));
    const tracked=cohort.filter(item=>item.mode==="tracked_page"||byPost.has(item.id));
    const hasMeasurement=!!stats||webAvailable&&pages.some(item=>item.mode==="tracked_page");
    const average=tracked.length&&(webAvailable||tracked.every(item=>byPost.has(item.id)))?Math.round(tracked.reduce((sum,item)=>sum+(byPost.get(item.id)??0),0)/tracked.length*10)/10:null;
    return {authorId:id,Analyst:pages.map(statsContributorName).find(Boolean)??"n/a",
      "Alerts published":pages.some(item=>item.type==="alert"&&!item.publishedAtUtc)?null:cohort.filter(item=>item.type==="alert").length,
      "Watchlists published":unknownWatchlist||pages.some(item=>item.type==="watchlist"&&!item.publishedAtUtc)?null:cohort.filter(item=>item.type==="watchlist").length,
      Viewers:hasMeasurement?stats?.viewers??0:null,"Returning viewers":hasMeasurement?stats?.returning??0:null,Views:hasMeasurement?stats?.views??0:null,
      "Avg viewers per new post":average,"Last view UTC":stats?.last??null};
  }).sort((a,b)=>(b.Viewers??-1)-(a.Viewers??-1)||(b.Views??-1)-(a.Views??-1)||a.Analyst.localeCompare(b.Analyst)||a.authorId.localeCompare(b.authorId));
}
