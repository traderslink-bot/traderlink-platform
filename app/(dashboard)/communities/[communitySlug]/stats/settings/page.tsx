import {notFound} from "next/navigation";
import {DashboardPage} from "@/app/dashboard-ui";
import {CommunityNavigation} from "../../../community-navigation";
import {loadCommunityPublishingDashboard as loadCommunityDashboard} from "../../../community-publication-dashboard-loader";
import {CommunityStatsSettings} from "../../../community-stats-settings";

export default async function CommunityStatsSettingsPage({params}:{params:Promise<{communitySlug:string}>}){
  const {communitySlug}=await params;
  const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/stats/settings`);
  if(!loaded.snapshot.community.isOwner||loaded.isReview)notFound();
  return <DashboardPage><CommunityNavigation snapshot={loaded.snapshot}/><CommunityStatsSettings key={`${loaded.snapshot.community.communityId}:${loaded.snapshot.viewer.userId}`} communitySlug={loaded.snapshot.community.slug}/></DashboardPage>;
}
