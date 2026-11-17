import {notFound} from "next/navigation";
import {DashboardPage} from "@/app/dashboard-ui";
import {CommunityNavigation} from "../../../community-navigation";
import {loadCommunityDashboard} from "../../../community-dashboard-loader";
import {CommunityStatsDashboard} from "../../../community-stats-dashboard";

export default async function CommunityStatsTeamPage({params}:{params:Promise<{communitySlug:string}>}){
  const {communitySlug}=await params;
  const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/stats/team`);
  const {capabilities}=loaded.snapshot.viewer;
  if(loaded.isReview||!loaded.snapshot.community.isOwner&&!["community.team.manage","community.member_activity.view","community.analytics.view"].every(key=>capabilities.some(value=>value===key)))notFound();
  return <DashboardPage><CommunityNavigation snapshot={loaded.snapshot}/><CommunityStatsDashboard key={`${loaded.snapshot.community.communityId}:${loaded.snapshot.viewer.userId}`} communitySlug={loaded.snapshot.community.slug} initialTab="team"/></DashboardPage>;
}
