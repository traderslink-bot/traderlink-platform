import {sharedAlertsMigrationCarrier} from "@/src/modules/platform/server/database/platform-shared-alerts-production-carrier";
import {isSharedAlertPublisher} from "@/src/modules/communities/server/shared-alerts-publisher-permissions";
import type {SharedSourceNavigationAccess} from "@/src/modules/communities/contracts/shared-alerts-contracts";
import {hasCommunityStatsOwnAccess} from "@/src/modules/communities/server/stats/community-stats-access";
import type {CommunityStatsNavigationAccess} from "@/src/modules/communities/contracts/community-stats-contracts";
import {readCommunityStatsViewerChannels} from "@/src/modules/communities/server/stats/community-stats-viewer-channels";
import {readCommunityViewerChannels} from "@/src/modules/communities/server/community-channel-readership";
import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import { requireCommunityOwnerReviewServerComponentPageIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { TraderLinkCommunityDashboardSnapshot } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { createTraderLinkCommunityReviewFixture } from "@/src/modules/communities/server/traderlink-community-review-fixture";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";
import { notFound } from "next/navigation";
import { isCommunityContentActivityPath } from "@/src/modules/communities/server/community-activity-scope";

async function loadAuthorizedCommunityPublishingDashboard(communitySlug:string,path?:string):Promise<Readonly<{snapshot:TraderLinkCommunityDashboardSnapshot&CommunityStatsNavigationAccess&SharedSourceNavigationAccess;isReview:boolean}>>{
  try {
    return await loadAuthorizedCommunityDashboard(communitySlug,path);
  } catch (error) {
    if(isTraderLinkPlatformError(error)&&(error.code==="TRADERLINK_WORKSPACE_ACCESS_DENIED"||error.code==="TRADERLINK_WORKSPACE_NOT_FOUND"))notFound();
    throw error;
  }
}

async function loadAuthorizedCommunityDashboard(communitySlug:string,path?:string):Promise<Readonly<{snapshot:TraderLinkCommunityDashboardSnapshot&CommunityStatsNavigationAccess&SharedSourceNavigationAccess;isReview:boolean}>>{
  if(communitySlug==="review") {
    if(process.env.NODE_ENV==="production"&&process.env.RAILWAY_ENVIRONMENT_NAME!=="staging") notFound();
    const role=path?.includes("/workspace")?"coach":"owner";
    return Object.freeze({snapshot:createTraderLinkCommunityReviewFixture(role),isReview:true});
  }
  const identity=await requireCommunityOwnerReviewServerComponentPageIdentity();
  const requested=path??`/communities/${communitySlug}`;
  const suffix=requested.slice(`/communities/${communitySlug}`.length);
  const statsReview = ["/stats/activity", "/stats/analysts", "/stats/team", "/stats/settings"].includes(suffix);
  const historyPath=suffix==="/coaching"||suffix==="/workspace"||suffix==="/workspace/students"||/^\/workspace\/students\/[^/?#]+(?:\/reviews\/[^/?#]+(?:\/final)?)?$/.test(suffix);
  let historyOnly=false;
  const existingCoachingPage=historyPath||/^\/workspace\/(coachingwork|reviews|sessions|teaching)$/.test(suffix);
  try{await requireCommunityRequestAccess({userId:identity.scope.userId,slug:communitySlug,existingCoachingOnly:existingCoachingPage,reviewIntent:statsReview?"stats":"community-owner-review",relationshipId:suffix.match(/^\/workspace\/students\/([^/?#]+)/)?.[1]});}
  catch(error){if(!historyPath)throw error;historyOnly=true;}
  // The resolver reads its target synchronously; no connection/transaction is held during Discord I/O.
  const readableChannelIds=historyOnly?[]:await withPlatformDatabase({mode:"runtime"},database=>statsReview?readCommunityStatsViewerChannels(database,communitySlug,identity.scope.userId,process.env.TRADERLINK_DISCORD_BOT_TOKEN??""):readCommunityViewerChannels(database,communitySlug,identity.scope.userId,process.env.TRADERLINK_DISCORD_BOT_TOKEN??"",fetch,[0,5],"community-owner-review"));
  let activeJournalAccountName:string|null=null;
  const snapshot=withPlatformDatabase({mode:"runtime"},database=>{
    if(identity.scope.activeAccountId&&identity.scope.allowedAccountIds.includes(identity.scope.activeAccountId))activeJournalAccountName=(database.prepare("SELECT display_name FROM journal_accounts WHERE account_id=? AND workspace_id=? AND status='active'").get(identity.scope.activeAccountId,identity.scope.workspaceId) as {display_name:string}|undefined)?.display_name??null;
    const viewer=historyOnly?{userId:identity.scope.userId,displayName:identity.displayName??"Member",discordRoleIds:[]}:resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const repository=new TraderLinkCommunityPlatformRepository(database);
    let current=repository.readSnapshot(communitySlug,viewer,{historyOnly,readableChannelIds,detailPath:requested});
    const statsOwnContentAccess=!historyOnly&&hasCommunityStatsOwnAccess(database,current.community.communityId,viewer.userId);
    const capabilities=new Set(current.viewer.capabilities);
    const requestedPath=path??"";
    const permitted=requestedPath.includes("/manage/alerts")
      ? capabilities.has("community.alerts.create")||capabilities.has("community.alerts.manage_all")
      : requestedPath.includes("/alerts")
      ? capabilities.has("community.alerts.view")||capabilities.has("community.alerts.create")||current.viewer.channelAccess?.alerts===true
      : requestedPath.includes("/watchlists")
        ? capabilities.has("community.watchlists.view")||capabilities.has("community.watchlists.publish_staff")||current.viewer.channelAccess?.watchlists===true
        : requestedPath.includes("/coaches")||requestedPath.includes("/coaching")
          ? capabilities.has("community.coaching.view")||capabilities.has("community.coaching.offer")||capabilities.has("community.coaching.manage_all")
          : requestedPath.includes("/workspace")
            ? capabilities.has("community.coaching.offer")||capabilities.has("community.coaching.students")
            : requestedPath.includes("/manage/templates")
              ? capabilities.has("community.alerts.manage_all")
              : requestedPath.includes("/manage/roles")
              ? capabilities.has("community.roles.manage")
              : requestedPath.includes("/manage/team")
                ? capabilities.has("community.team.manage")
                : requestedPath.includes("/manage/members")
                  ? capabilities.has("community.members.view")
                  : (requestedPath.includes("/manage/activity")||requestedPath.includes("/stats"))
                    ? capabilities.has("community.analytics.view")||statsOwnContentAccess
                    : requestedPath.includes("/manage/channels")
                      ? capabilities.has("community.discord.manage")
                      : requestedPath.includes("/manage")
                        ? capabilities.has("community.manage")
              : true;
    const ownCoachingHistory=requestedPath===`/communities/${communitySlug}/coaching`&&current.relationships.some(relationship=>relationship.studentUserId===viewer.userId);
    if(!permitted&&!ownCoachingHistory){if(!historyPath)notFound();current=repository.readSnapshot(communitySlug,viewer,{historyOnly:true});historyOnly=true;}
    const alertSlug=requestedPath.includes("/manage/alerts/")?undefined:requestedPath.match(/\/alerts\/([^/?#]+)/u)?.[1];
    const watchlistId=requestedPath.match(/\/server-watchlists\/([^/?#]+)/u)?.[1];
    const tracked=alertSlug
      ? current.alerts.some(alert=>(alert.slug===alertSlug||alert.alertId===alertSlug)&&alert.status==="published")
      : watchlistId
        ? current.watchlists.some(watchlist=>watchlist.watchlistId===watchlistId&&watchlist.status==="published")
        : true;
    const activityPath=path??`/communities/${communitySlug}`;
    if(!historyOnly&&tracked&&isCommunityContentActivityPath(communitySlug,activityPath))repository.recordView({communityId:current.community.communityId,userId:viewer.userId,path:activityPath,objectType:path?.includes("watchlists")?"watchlist":path?.includes("alerts")?"alert":path?.includes("coach")?"coaching":"community",atUtc:createCanonicalUtcTimestamp()});
    const planCounts=database.prepare(`SELECT plan_id, count(*) AS count
      FROM traderlink_community_coaching_relationships
      WHERE community_id=? AND status='active' GROUP BY plan_id`).all(current.community.communityId) as {plan_id:string;count:number}[];
    const counts=new Map(planCounts.map(row=>[row.plan_id,row.count]));
    const deliveries=!historyOnly&&requestedPath.endsWith('/manage/channels')&&capabilities.has('community.discord.manage')?database.prepare(`SELECT d.delivery_id deliveryId,coalesce(d.current_attempt_key,d.delivery_id) attemptKey,d.object_type objectType,x.name channelName,(SELECT u.display_name FROM platform_users u WHERE u.user_id=d.publisher_user_id) publisherName,d.status,d.delivery_outcome outcome,d.discord_message_id messageId,d.last_error error,d.updated_at_utc updatedAtUtc,EXISTS(SELECT 1 FROM traderlink_community_delivery_attempt_history h WHERE h.delivery_id=d.delivery_id AND h.attempt_key LIKE 'source-alert:%:part:%') multipart FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id WHERE d.community_id=? ORDER BY d.updated_at_utc DESC LIMIT 100`).all(current.community.communityId) as NonNullable<TraderLinkCommunityDashboardSnapshot['deliveries']>:[];
    const deletedOwner=database.prepare("SELECT 1 FROM traderlink_communities c JOIN platform_users u ON u.user_id=c.owner_user_id WHERE c.community_id=? AND u.auth_provider='deleted' AND u.status='disabled'").get(current.community.communityId);
    if(deletedOwner&&!historyOnly){
      // readSnapshot's SQL restricts relationships to this viewer; all review,
      // message and attachment collections derive from those relationship IDs.
      // The remediation fixture verifies that invariant. This only removes
      // general community data; it never grants additional data or authority.
      const ownRelationships=current.relationships.filter(row=>row.coachUserId===identity.scope.userId||row.studentUserId===identity.scope.userId);
      if(!existingCoachingPage||!ownRelationships.some(row=>row.status==='active'&&!row.archivedAtUtc))notFound();
      return {...current,relationships:ownRelationships,deliveries:[],alerts:[],watchlists:[],alertTemplates:[],audiences:[],channels:[],teamMembers:[],members:[],staffRoles:[],plans:[],coaches:[],
        community:{...current.community,isOwner:false,memberCount:0},viewer:{...current.viewer,capabilities:current.viewer.capabilities.filter(capability=>capability.startsWith('community.coaching.')&&capability!=='community.coaching.manage_all')},
        settings:{description:'',personalAlertTemplatesEnabled:false},contentPages:[],analytics:{views30Days:0,uniqueMembers30Days:0,alertViews30Days:0,watchlistViews30Days:0,coachingViews30Days:0,topPages:[],namedMemberPages:[],brandedPages:[]},referrals:{attributedMembers:0,tier2Members:0,estimatedEarningsMinor:0,currency:'USD',commissionLabel:'Not configured'}};
    }
    return {...current,statsOwnContentAccess,sourceAlertPublishingAllowed:sharedAlertsMigrationCarrier.state==="selected"&&(process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED==="1"||process.env.TRADERLINK_SHARED_ALERTS_OWNER_REVIEW_ENABLED==="1")&&!historyOnly&&current.viewer.capabilities.includes("community.view")&&isSharedAlertPublisher(database,current.community.communityId,viewer.userId,createCanonicalUtcTimestamp(),true),lifecycle:database.prepare(`SELECT bot_state botState,bot_checked_at_utc checkedAtUtc FROM traderlink_community_lifecycle WHERE community_id=?`).get(current.community.communityId) as {botState:string;checkedAtUtc:string|null}|undefined,deliveries,plans:current.plans.map(plan=>({...plan,activeStudents:counts.get(plan.planId)??0}))};
  });
  return Object.freeze({snapshot:{...snapshot,viewer:{...snapshot.viewer,activeJournalAccountId:identity.scope.activeAccountId??null,activeJournalAccountName}},isReview:false});
}


export async function loadCommunityPublishingDashboard(communitySlug: string, path?: string) {
  try {
    return await loadAuthorizedCommunityPublishingDashboard(communitySlug, path);
  } catch (error) {
    if (isTraderLinkPlatformError(error)
      && (error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED"
        || error.code === "TRADERLINK_WORKSPACE_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}
