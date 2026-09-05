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
    return Object.freeze({snapshot:createTraderLinkCommunityReviewFixture(),isReview:true});
  }
  const identity=await requireTraderLinkPlatformServerComponentPageIdentity();
  const snapshot=withPlatformDatabase({mode:"runtime"},database=>{const viewer=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const repository=new TraderLinkCommunityPlatformRepository(database);const current=repository.readSnapshot(communitySlug,viewer);repository.recordView({communityId:current.community.communityId,userId:viewer.userId,path:path??`/communities/${communitySlug}`,objectType:path?.includes("watchlists")?"watchlist":path?.includes("alerts")?"alert":path?.includes("coach")?"coaching":"community",atUtc:createCanonicalUtcTimestamp()});return current;});
  return Object.freeze({snapshot,isReview:false});
}
