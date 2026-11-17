import {notFound} from "next/navigation";
import {DashboardPage} from "@/app/dashboard-ui";
import {CommunityNavigation} from "../../../community-navigation";
import {loadCommunityDashboard} from "../../../community-dashboard-loader";
import {CommunityStatsDashboard} from "../../../community-stats-dashboard";

export default async function CommunityStatsAnalystsPage({params}:{params:Promise<{communitySlug:string}>}){
  const {communitySlug}=await params;
  const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/stats/analysts`);
  if(loaded.isReview||!loaded.snapshot.community.isOwner&&!loaded.snapshot.viewer.capabilities.includes("community.analytics.view")&&!loaded.snapshot.statsOwnContentAccess)notFound();
  return <DashboardPage><CommunityNavigation snapshot={loaded.snapshot}/><CommunityStatsDashboard key={`${loaded.snapshot.community.communityId}:${loaded.snapshot.viewer.userId}`} communitySlug={loaded.snapshot.community.slug} initialTab="authors"/></DashboardPage>;
}
