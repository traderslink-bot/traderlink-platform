import {DashboardPage} from "@/app/dashboard-ui";
import {TeachingPage} from "../../../coaching-program-pages";
import {loadCommunityDashboard} from "../../../community-dashboard-loader";
export default async function Page({params}:{params:Promise<{communitySlug:string}>}){const {communitySlug}=await params;const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/teaching`);return <DashboardPage><TeachingPage isReview={loaded.isReview} snapshot={loaded.snapshot}/></DashboardPage>}
