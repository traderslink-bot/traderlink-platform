import { DashboardPage } from "@/app/dashboard-ui";
import { CoachSetupPage } from "../../../coach-setup-page";
import { loadCommunityDashboard } from "../../../community-dashboard-loader";
export default async function Page({params}:{params:Promise<{communitySlug:string}>}){const {communitySlug}=await params;const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/setup`);return <DashboardPage><CoachSetupPage isReview={loaded.isReview} snapshot={loaded.snapshot}/></DashboardPage>}
