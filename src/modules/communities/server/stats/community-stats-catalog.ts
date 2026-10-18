import "server-only";
import type Database from "better-sqlite3";
import type { CommunityStatsContent, CommunityStatsRequestScope } from "../../contracts/community-stats-contracts";
import { mayReadCommunityPublication } from "../community-channel-readership";
import {communityStatsStorageReady} from "./community-stats-repository";

export function communityStatsContentMatchesSearch(content:CommunityStatsContent,search:string|undefined):boolean{
  const value=search?.trim().toLowerCase();return !value||`${content.title}\n${content.authorName??""}`.toLowerCase().includes(value);
}

/** Metadata-only catalog. No private Coaching/Journal queries and no content-body reads. */
export function readCommunityStatsCatalog(db:Database.Database, scope:CommunityStatsRequestScope):readonly CommunityStatsContent[] {
  const base=`/communities/${scope.slug}`, result:CommunityStatsContent[]=[];
  const has=(key:string)=>scope.isOwner||scope.capabilities.includes(key);
  result.push({id:"index:community",type:"community",title:scope.communityName,path:base,authorUserId:null,authorName:null,state:"published",mode:"tracked_page"});
  const publication=(kind:"alert"|"watchlist",id:string,author:string)=>scope.isOwner
    || (author===scope.actorUserId&&has(kind==="alert"?"community.alerts.create":"community.watchlists.publish_staff"))
    || has(kind==="alert"?"community.alerts.manage_all":"community.watchlists.manage_all")
    || mayReadCommunityPublication(db,scope.communityId,kind,id,scope.readableChannelIds);
  const alerts=db.prepare(`SELECT a.alert_id,a.slug,a.title,a.author_user_id,u.display_name,a.status,a.publishing_mode
    FROM traderlink_community_alerts a JOIN platform_users u ON u.user_id=a.author_user_id
    WHERE a.community_id=? AND a.status IN ('draft','published','archived')`).all(scope.communityId) as {alert_id:string;slug:string;title:string;author_user_id:string;display_name:string;status:"draft"|"published"|"archived";publishing_mode:"tracked_page"|"discord_post"}[];
  const allowedAlerts=alerts.filter(row=>row.status==="published"?publication("alert",row.alert_id,row.author_user_id):scope.isOwner||has("community.alerts.manage_all")||(row.author_user_id===scope.actorUserId&&has("community.alerts.create")));
  if(has("community.alerts.view")||has("community.alerts.create")||allowedAlerts.length) result.push({id:"index:alerts",type:"alerts",title:"Alerts",path:`${base}/alerts`,authorUserId:null,authorName:null,state:"published",mode:"tracked_page"});
  allowedAlerts.forEach(row=>result.push({id:row.alert_id,type:"alert",title:row.title,path:`${base}/alerts/${row.slug}`,authorUserId:row.author_user_id,authorName:row.display_name,state:row.status,publicationMode:row.publishing_mode,mode:row.status==="draft"?"not_collected":row.publishing_mode}));
  const watchlists=db.prepare(`SELECT w.watchlist_id,w.title,w.author_user_id,u.display_name,w.status,w.publishing_mode
    FROM traderlink_community_server_watchlists w JOIN platform_users u ON u.user_id=w.author_user_id
    WHERE w.community_id=? AND w.status IN ('draft','published','archived')`).all(scope.communityId) as {watchlist_id:string;title:string;author_user_id:string;display_name:string;status:"draft"|"published"|"archived";publishing_mode:"tracked_page"|"discord_post"}[];
  const allowedWatchlists=watchlists.filter(row=>row.status==="published"?publication("watchlist",row.watchlist_id,row.author_user_id):scope.isOwner||has("community.watchlists.manage_all")||(row.author_user_id===scope.actorUserId&&has("community.watchlists.publish_staff")));
  if(has("community.watchlists.view")||has("community.watchlists.publish_staff")||allowedWatchlists.length) result.push({id:"index:watchlists",type:"watchlists",title:"Community watchlists",path:`${base}/watchlists`,authorUserId:null,authorName:null,state:"published",mode:"tracked_page"});
  allowedWatchlists.forEach(row=>result.push({id:row.watchlist_id,type:"watchlist",title:row.title,path:`${base}/server-watchlists/${row.watchlist_id}`,authorUserId:row.author_user_id,authorName:row.display_name,state:row.status,publicationMode:row.publishing_mode,mode:row.status==="draft"?"not_collected":row.publishing_mode}));
  if(has("community.watchlists.view")){
    const placements=db.prepare(`SELECT p.placement_id,p.watchlist_id,p.author_user_id,w.title,w.status AS canonical_status,u.display_name,p.status FROM traderlink_community_watchlist_placements p JOIN community_watchlists w ON w.watchlist_id=p.watchlist_id JOIN platform_users u ON u.user_id=p.author_user_id JOIN traderlink_community_audiences a ON a.community_id=p.community_id AND a.audience_id=p.audience_id WHERE p.community_id=@communityId AND (p.status='published' OR @owner=1 OR p.author_user_id=@actor) AND (@owner=1 OR (a.status='active' AND (a.mode='everyone' OR EXISTS(SELECT 1 FROM traderlink_community_audience_discord_roles r WHERE r.community_id=a.community_id AND r.audience_id=a.audience_id AND r.discord_role_id IN(SELECT value FROM json_each(@roles))))))`).all({communityId:scope.communityId,owner:scope.isOwner?1:0,actor:scope.actorUserId,roles:JSON.stringify(scope.discordRoleIds)}) as {placement_id:string;watchlist_id:string;author_user_id:string;title:string;display_name:string;status:string;canonical_status:string}[];
    // Stable per-community placement identity is separate from canonical ownership;
    // index navigation and another server's canonical-page visits never become item views.
    placements.forEach(row=>result.push({id:`placement:${row.placement_id}`,type:"watchlist",canonicalId:row.watchlist_id,placementId:row.placement_id,publicationMode:"unknown",title:row.title,path:`${base}/member-watchlists/${row.placement_id}`,authorUserId:row.author_user_id,authorName:row.display_name,state:row.status==="published"&&row.canonical_status==="published"?"published":"archived",mode:row.status==="published"&&row.canonical_status==="published"?"tracked_page":"not_collected"}));
  }
  if(has("community.coaching.view")||has("community.coaching.offer")||has("community.coaching.manage_all")) {
    result.push({id:"index:coaches",type:"coaches",title:"Coaches",path:`${base}/coaches`,authorUserId:null,authorName:null,state:"published",mode:"tracked_page"});
    const coaches=db.prepare(`SELECT coach_profile_id,coach_slug,display_name,user_id,status FROM traderlink_community_coach_profiles
      WHERE community_id=? AND status IN ('active','archived')`).all(scope.communityId) as {coach_profile_id:string;coach_slug:string;display_name:string;user_id:string;status:string}[];
    coaches.forEach(row=>result.push({id:row.coach_profile_id,type:"coach",title:row.display_name,path:`${base}/coaches/${row.coach_slug}`,authorUserId:row.user_id,authorName:row.display_name,state:row.status==="active"?"published":"archived",mode:"tracked_page"}));
  }
  if(communityStatsStorageReady(db)&&(scope.isOwner||scope.ownContentOnly)){
    const removed=db.prepare(`SELECT content_id,content_type,author_user_id FROM community_stats_events WHERE community_id=? AND surface='web' AND occurred_at_utc>=? AND (?=1 OR author_user_id=?) GROUP BY content_id,content_type,author_user_id`).all(scope.communityId,new Date(Date.now()-90*86_400_000).toISOString(),scope.isOwner?1:0,scope.actorUserId) as {content_id:string;content_type:CommunityStatsContent["type"];author_user_id:string|null}[];
    for(const row of removed)if(!result.some(content=>content.id===row.content_id))result.push({id:row.content_id,type:row.content_type,title:"Removed content",path:"",authorUserId:row.author_user_id,authorName:null,state:"archived",mode:"not_collected"});
  }
  return Object.freeze(scope.ownContentOnly?result.filter(content=>content.authorUserId===scope.actorUserId):result);
}

export function resolveCommunityStatsPage(catalog:readonly CommunityStatsContent[],slug:string,path:string):CommunityStatsContent|null {
  if(path.length>500||path.includes("?")||path.includes("#")||path.includes("%")||!path.startsWith(`/communities/${slug}`))return null;
  const content=catalog.find(row=>row.path===path||(row.type==="alert"&&path===`/communities/${slug}/alerts/${row.id}`));
  return content?.state==="published"&&content.mode==="tracked_page"?content:null;
}
