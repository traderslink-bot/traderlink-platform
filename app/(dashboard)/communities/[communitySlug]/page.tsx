import { CommunityDashboard } from "../community-dashboard";
import { loadCommunityPublishingDashboard as loadCommunityDashboard } from "../community-publication-dashboard-loader";

export default async function CommunityHomePage({params}:{params:Promise<{communitySlug:string}>}){
  const {communitySlug}=await params; const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}`);
  return <CommunityDashboard discordClientId={process.env.TRADERLINK_COMMUNITIES_DISCORD_CLIENT_ID?.trim()||null} isReview={loaded.isReview} section="home" snapshot={loaded.snapshot}/>;
}
