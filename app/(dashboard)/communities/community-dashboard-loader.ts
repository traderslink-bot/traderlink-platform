import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { TraderLinkCommunityDashboardSnapshot } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { createTraderLinkCommunityReviewFixture } from "@/src/modules/communities/server/traderlink-community-review-fixture";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";
import { notFound } from "next/navigation";

export async function loadCommunityDashboard(communitySlug:string,path?:string):Promise<Readonly<{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean}>>{
  if(communitySlug==="review") {
    if(process.env.NODE_ENV==="production"&&process.env.RAILWAY_ENVIRONMENT_NAME!=="staging") notFound();
    const role=path?.includes("/workspace")?"coach":"owner";
    return Object.freeze({snapshot:createTraderLinkCommunityReviewFixture(role),isReview:true});
  }
  const identity=await requireTraderLinkPlatformServerComponentPageIdentity();
  const snapshot=withPlatformDatabase({mode:"runtime"},database=>{
    const viewer=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const repository=new TraderLinkCommunityPlatformRepository(database);
    const current=repository.readSnapshot(communitySlug,viewer);
    const capabilities=new Set(current.viewer.capabilities);
    const requestedPath=path??"";
    const permitted=requestedPath.includes("/alerts")
      ? capabilities.has("community.alerts.view")||capabilities.has("community.alerts.create")
      : requestedPath.includes("/watchlists")
        ? capabilities.has("community.watchlists.view")||capabilities.has("community.watchlists.publish_staff")
        : requestedPath.includes("/coaches")||requestedPath.includes("/coaching")
          ? capabilities.has("community.coaching.view")||capabilities.has("community.coaching.offer")||capabilities.has("community.coaching.manage_all")
          : requestedPath.includes("/workspace")
            ? capabilities.has("community.coaching.offer")||capabilities.has("community.coaching.students")
            : requestedPath.includes("/manage/roles")
              ? capabilities.has("community.roles.manage")
              : requestedPath.includes("/manage/team")
                ? capabilities.has("community.team.manage")
                : requestedPath.includes("/manage/members")
                  ? capabilities.has("community.members.view")
                  : requestedPath.includes("/manage/activity")
                    ? capabilities.has("community.analytics.view")
                    : requestedPath.includes("/manage/channels")
                      ? capabilities.has("community.discord.manage")
                      : requestedPath.includes("/manage")
                        ? capabilities.has("community.manage")
              : true;
    const ownCoachingHistory=requestedPath===`/communities/${communitySlug}/coaching`&&current.relationships.some(relationship=>relationship.studentUserId===viewer.userId);
    if(!permitted&&!ownCoachingHistory)notFound();
    const alertSlug=requestedPath.match(/\/alerts\/([^/?#]+)/u)?.[1];
    const watchlistId=requestedPath.match(/\/server-watchlists\/([^/?#]+)/u)?.[1];
    const tracked=alertSlug
      ? current.alerts.some(alert=>alert.slug===alertSlug&&alert.publishingMode==="tracked_page")
      : watchlistId
        ? current.watchlists.some(watchlist=>watchlist.watchlistId===watchlistId&&watchlist.publishingMode==="tracked_page")
        : true;
    if(tracked)repository.recordView({communityId:current.community.communityId,userId:viewer.userId,path:path??`/communities/${communitySlug}`,objectType:path?.includes("watchlists")?"watchlist":path?.includes("alerts")?"alert":path?.includes("coach")?"coaching":"community",atUtc:createCanonicalUtcTimestamp()});
    const planCounts=database.prepare(`SELECT plan_id, count(*) AS count
      FROM traderlink_community_coaching_relationships
      WHERE community_id=? AND status='active' GROUP BY plan_id`).all(current.community.communityId) as {plan_id:string;count:number}[];
    const counts=new Map(planCounts.map(row=>[row.plan_id,row.count]));
    return {...current,plans:current.plans.map(plan=>({...plan,activeStudents:counts.get(plan.planId)??0}))};
  });
  return Object.freeze({snapshot,isReview:false});
}
