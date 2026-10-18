import "server-only";
import type Database from "better-sqlite3";
import type {CommunityStatsRequestScope} from "../../contracts/community-stats-contracts";
import {readCommunityStatsCatalog,resolveCommunityStatsPage} from "./community-stats-catalog";
import {resolveOwnCommunityStatsIdentity} from "./community-stats-identity";
import {CommunityStatsRepository,communityStatsStorageReady} from "./community-stats-repository";
import {assertMembershipFeature} from "../../../platform/server/membership/platform-membership-access";

export function recordCommunityStatsVisit(db:Database.Database,scope:CommunityStatsRequestScope,body:unknown,atUtc:string):"recorded"|"duplicate"|"not_eligible"|"unavailable" {
  if(!communityStatsStorageReady(db)||process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1")return "unavailable";
  if(!body||typeof body!=="object"||Array.isArray(body))return "not_eligible";
  const input=body as Record<string,unknown>;
  if(Object.keys(input).some(key=>!["navigationId","path"].includes(key))||typeof input.path!=="string"||typeof input.navigationId!=="string"
    ||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(input.navigationId))return "not_eligible";
  const content=resolveCommunityStatsPage(readCommunityStatsCatalog(db,scope),scope.slug,input.path);
  if(!content)return "not_eligible";
  if(content.placementId)assertMembershipFeature(db,scope.actorUserId,"community.access");
  const identity=resolveOwnCommunityStatsIdentity(db,{communityId:scope.communityId,authenticatedUserId:scope.actorUserId,atUtc});
  if(identity.state!=="verified")return "unavailable";
  const repository=new CommunityStatsRepository(db),eventId=`web:${scope.actorUserId}:${input.navigationId}`;
  return repository.transaction(()=>{
    const duplicate=db.prepare(`SELECT path,platform_user_id FROM community_stats_events WHERE community_id=? AND event_id=?`).get(scope.communityId,eventId) as {path:string;platform_user_id:string}|undefined;
    if(duplicate)return duplicate.path===content.path&&duplicate.platform_user_id===scope.actorUserId?"duplicate":"not_eligible";
    const rate=db.prepare(`SELECT count(*) AS n FROM community_stats_events WHERE community_id=? AND platform_user_id=? AND surface='web' AND received_at_utc>=?`)
      .get(scope.communityId,scope.actorUserId,new Date(Date.parse(atUtc)-60_000).toISOString()) as {n:number};
    if(rate.n>=120)return "unavailable";
    repository.ensureCommunity(scope.communityId,atUtc);repository.identityLink(identity.identity,atUtc);
    repository.nativeMember(scope.communityId,{discordUserId:identity.identity.discordUserId,username:identity.identity.username,
      displayName:identity.identity.globalDisplayName,nickname:null,nicknameObserved:false,roleIds:scope.discordRoleIds,isBot:false,joinedAtUtc:null},atUtc);
    const inserted=repository.recordEvent(scope.communityId,{eventId,discordUserId:identity.identity.discordUserId,platformUserId:scope.actorUserId,
      surface:"web",kind:"web_visit",occurredAtUtc:atUtc,receivedAtUtc:atUtc,contentId:content.id,contentType:content.type,title:content.title,path:content.path,
      authorUserId:content.authorUserId,username:identity.identity.username,displayName:identity.identity.globalDisplayName,nickname:identity.identity.guildNickname,
      identityObservedAtUtc:identity.identity.observedAtUtc,channelId:null,durationSeconds:0,replyToEventId:null,replyDelaySeconds:null,sourceLinkId:null,canonicalContentId:content.canonicalId??content.id,placementId:content.placementId??null,nicknameState:identity.identity.nicknameAvailability});
    return inserted?"recorded":"duplicate";
  });
}
