import "server-only";
import {TraderLinkCommunityRepository} from "../traderlink-community-repository";
import {readCanonicalStatsTargets,resolveCanonicalStatsTarget} from "./community-stats-content-targets";
import type Database from "better-sqlite3";
import type {CommunityStatsRequestScope} from "../../contracts/community-stats-contracts";
import {readCommunityStatsCatalog,resolveCommunityStatsPage} from "./community-stats-catalog";
import {resolveOwnCommunityStatsIdentity} from "./community-stats-identity";
import {CommunityStatsRepository,communityStatsStorageReady} from "./community-stats-repository";
import {statsAttributionReady} from "./community-stats-invites";
import {normalizeStatsTrafficSource} from "../../contracts/community-stats-traffic-source";
import {assertMembershipFeature} from "../../../platform/server/membership/platform-membership-access";

export function recordCommunityStatsVisit(db:Database.Database,scope:CommunityStatsRequestScope,body:unknown,atUtc:string,ownHost:string,revalidateOriginalRequest:()=>void):"recorded"|"duplicate"|"not_eligible"|"unavailable" {
  if(!communityStatsStorageReady(db)||process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1")return "unavailable";
  if(!body||typeof body!=="object"||Array.isArray(body))return "not_eligible";
  const input=body as Record<string,unknown>;
  if(Object.keys(input).some(key=>!["navigationId","path","referrerHost","campaignSource","campaignMedium","campaignName","focus"].includes(key))||typeof input.path!=="string"||typeof input.navigationId!=="string"
    ||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(input.navigationId))return "not_eligible";
  const repository=new CommunityStatsRepository(db),eventId=`web:${scope.actorUserId}:${input.navigationId}`;
  return repository.transaction(()=>{
    // The route supplies a closure over its ORIGINAL request/session. Recheck it
    // under the writer lock, then resolve metadata and current app access in this snapshot.
    revalidateOriginalRequest();
    const community=db.prepare("SELECT slug,discord_guild_id FROM traderlink_communities WHERE community_id=? AND status='active'").get(scope.communityId) as {slug:string;discord_guild_id:string}|undefined;
    if(community?.slug!==scope.slug||community.discord_guild_id!==scope.guildId)return "not_eligible";
    const access=new TraderLinkCommunityRepository(db).requireCapability(scope.communityId,scope.actorUserId,"community.view");
    const currentScope={...scope,isOwner:access.isOwner,capabilities:access.capabilities};
    const canonical=readCanonicalStatsTargets(db,currentScope);
    const content=resolveCanonicalStatsTarget(canonical,input.path as string,input.focus)
      ??(input.focus==null?resolveCommunityStatsPage(readCommunityStatsCatalog(db,currentScope),scope.slug,input.path as string):null);
    if(!content)return "not_eligible";
    if(content.placementId&&!content.pageId)assertMembershipFeature(db,scope.actorUserId,"community.access");
    const identity=resolveOwnCommunityStatsIdentity(db,{communityId:scope.communityId,authenticatedUserId:scope.actorUserId,atUtc});
    if(identity.state!=="verified"||identity.identity.guildId!==scope.guildId)return "unavailable";
    const duplicate=db.prepare(`SELECT path,platform_user_id,content_id,canonical_content_id,placement_id,page_id FROM community_stats_events WHERE community_id=? AND event_id=?`).get(scope.communityId,eventId) as {path:string;platform_user_id:string;content_id:string|null;canonical_content_id:string|null;placement_id:string|null;page_id:string|null}|undefined;
    if(duplicate)return duplicate.path===content.path&&duplicate.platform_user_id===scope.actorUserId&&duplicate.content_id===content.id&&duplicate.canonical_content_id===(content.canonicalId??content.id)&&duplicate.placement_id===(content.placementId??null)&&duplicate.page_id===(content.pageId??null)?"duplicate":"not_eligible";
    const rate=db.prepare(`SELECT count(*) AS n FROM community_stats_events WHERE community_id=? AND platform_user_id=? AND surface='web' AND received_at_utc>=?`)
      .get(scope.communityId,scope.actorUserId,new Date(Date.parse(atUtc)-60_000).toISOString()) as {n:number};
    if(rate.n>=120)return "unavailable";
    repository.ensureCommunity(scope.communityId,atUtc);repository.identityLink(identity.identity,atUtc);
    repository.nativeMember(scope.communityId,{discordUserId:identity.identity.discordUserId,username:identity.identity.username,
      displayName:identity.identity.globalDisplayName,nickname:null,nicknameObserved:false,roleIds:scope.discordRoleIds,isBot:false,joinedAtUtc:null},atUtc);
    const inserted=repository.recordEvent(scope.communityId,{eventId,discordUserId:identity.identity.discordUserId,platformUserId:scope.actorUserId,
      surface:"web",kind:"web_visit",occurredAtUtc:atUtc,receivedAtUtc:atUtc,contentId:content.id,contentType:content.type,title:content.title,path:content.path,
      authorUserId:content.authorUserId,username:identity.identity.username,displayName:identity.identity.globalDisplayName,nickname:identity.identity.guildNickname,
      identityObservedAtUtc:identity.identity.observedAtUtc,channelId:null,durationSeconds:0,replyToEventId:null,replyDelaySeconds:null,sourceLinkId:null,canonicalContentId:content.canonicalId??content.id,placementId:content.placementId??null,nicknameState:identity.identity.nicknameAvailability,pageId:content.pageId??null,categoryId:content.categoryId??null,publisherUserId:content.publisherUserId??null});
    if(inserted&&statsAttributionReady(db)){
      const source=normalizeStatsTrafficSource(input,ownHost);
      db.prepare(`INSERT INTO community_stats_traffic_sources VALUES(?,?,?,?,?,?,?,?)`).run(scope.communityId,eventId,source.category,source.source,source.referrerHost,source.campaignSource,source.campaignMedium,source.campaignName);
    }
    return inserted?"recorded":"duplicate";
  });
}
