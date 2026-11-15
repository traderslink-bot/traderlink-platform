import {DashboardPage} from "@/app/dashboard-ui";
import {EnrollmentRequestsPage} from "../../../coach-workspace-navigation";
import {loadCommunityDashboard} from "../../../community-dashboard-loader";
export default async function Page({params}:{params:Promise<{communitySlug:string}>}){const {communitySlug}=await params;const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/requests`);return <DashboardPage><EnrollmentRequestsPage snapshot={loaded.snapshot} isReview={loaded.isReview}/></DashboardPage>}
