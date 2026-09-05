import { CommunityDashboard } from "../community-dashboard";
import { loadCommunityDashboard } from "../community-dashboard-loader";

export default async function CommunityHomePage({params}:{params:Promise<{communitySlug:string}>}){
  const {communitySlug}=await params; const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}`);
  return <CommunityDashboard isReview={loaded.isReview} section="home" snapshot={loaded.snapshot}/>;
}
